import { PayOS } from "@payos/node";
import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";
import {
  PLAN_CODES,
  buildSubscriptionSummary,
  getPaymentPlan,
} from "./subscription.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const getPayOsClient = () => {
  const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY } = process.env;

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    const error = new Error("PayOS is not configured.");
    error.statusCode = 503;
    throw error;
  }

  return new PayOS({
    clientId: PAYOS_CLIENT_ID,
    apiKey: PAYOS_API_KEY,
    checksumKey: PAYOS_CHECKSUM_KEY,
  });
};

const getPaymentUrls = ({ accountType, planCode, orderCode }) => {
  const returnBase =
    process.env.PAYMENT_RETURN_URL || "http://localhost:5173/payment/success";
  const cancelBase =
    process.env.PAYMENT_CANCEL_URL || "http://localhost:5173/payment/cancel";
  const query = new URLSearchParams({
    orderCode: String(orderCode),
    accountType,
    planCode,
  }).toString();

  return {
    returnUrl: `${returnBase}?${query}`,
    cancelUrl: `${cancelBase}?${query}`,
  };
};

const createOrderCode = () => {
  const timestampPart = Date.now() % 10000000000;
  const randomPart = crypto.randomInt(100, 999);
  return Number(`${timestampPart}${randomPart}`.slice(0, 15));
};

export const getPlanForAccount = async ({ planCode, accountType }) => {
  const plan = await getPaymentPlan(planCode);

  if (!plan) {
    const error = new Error("Invalid payment plan.");
    error.statusCode = 400;
    throw error;
  }

  if (plan.accountType !== accountType) {
    const error = new Error("This payment plan is not available for this account.");
    error.statusCode = 403;
    throw error;
  }

  return plan;
};

export const createPaymentLink = async ({ account, planCode }) => {
  const plan = await getPlanForAccount({
    planCode,
    accountType: account.accountType,
  });
  const db = await getMongoDb();
  const payos = getPayOsClient();
  const now = new Date();
  const orderCode = createOrderCode();
  const { returnUrl, cancelUrl } = getPaymentUrls({
    accountType: account.accountType,
    planCode,
    orderCode,
  });

  const order = {
    id: crypto.randomUUID(),
    orderCode,
    accountType: account.accountType,
    accountId: account.id,
    planCode,
    amount: plan.amount,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("payment_orders").insertOne(order);

  try {
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: plan.amount,
      description: plan.description,
      returnUrl,
      cancelUrl,
      items: [
        {
          name: plan.name,
          quantity: 1,
          price: plan.amount,
        },
      ],
      buyerEmail: account.email,
      buyerName: account.name,
    });

    await db.collection("payment_orders").updateOne(
      { orderCode },
      {
        $set: {
          checkoutUrl: paymentLink.checkoutUrl,
          paymentLinkId: paymentLink.paymentLinkId,
          payosRaw: paymentLink,
          updatedAt: new Date(),
        },
      }
    );

    return {
      order: {
        ...order,
        checkoutUrl: paymentLink.checkoutUrl,
        paymentLinkId: paymentLink.paymentLinkId,
      },
      checkoutUrl: paymentLink.checkoutUrl,
    };
  } catch (error) {
    await db.collection("payment_orders").updateOne(
      { orderCode },
      {
        $set: {
          status: "failed",
          failureMessage: error.message,
          updatedAt: new Date(),
        },
      }
    );
    throw error;
  }
};

const activateSubscription = async ({ order, webhookData }) => {
  const db = await getMongoDb();
  const plan = await getPaymentPlan(order.planCode);
  const collectionName =
    order.accountType === "shop_owner" ? "shop_owners" : "users";
  const account = await db.collection(collectionName).findOne({ id: order.accountId });
  const now = new Date();
  const currentExpiresAt = account?.subscription?.expiresAt
    ? new Date(account.subscription.expiresAt)
    : null;
  const startsAt =
    currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
  const expiresAt = new Date(startsAt.getTime() + plan.durationDays * DAY_MS);

  await db.collection(collectionName).updateOne(
    { id: order.accountId },
    {
      $set: {
        subscription: {
          planCode: order.planCode,
          status: "active",
          expiresAt,
          lastPaymentOrderCode: order.orderCode,
          updatedAt: now,
        },
        updatedAt: now,
      },
    }
  );

  await db.collection("payment_orders").updateOne(
    { orderCode: order.orderCode },
    {
      $set: {
        status: "paid",
        paidAt: now,
        webhookRaw: webhookData,
        subscriptionExpiresAt: expiresAt,
        updatedAt: now,
      },
    }
  );

  return expiresAt;
};

export const handlePayOsWebhook = async (body) => {
  const payos = getPayOsClient();
  const webhookData = await payos.webhooks.verify(body);
  const db = await getMongoDb();
  const order = await db.collection("payment_orders").findOne({
    orderCode: Number(webhookData.orderCode),
  });

  if (!order) {
    const error = new Error("Payment order was not found.");
    error.statusCode = 404;
    throw error;
  }

  if (order.status === "paid") {
    return {
      order,
      webhookData,
      alreadyProcessed: true,
    };
  }

  const paymentSucceeded =
    body?.success === true &&
    body?.code === "00" &&
    webhookData?.code === "00" &&
    Number(webhookData.amount) === Number(order.amount);

  if (!paymentSucceeded) {
    await db.collection("payment_orders").updateOne(
      { orderCode: order.orderCode },
      {
        $set: {
          status: "failed",
          webhookRaw: webhookData,
          updatedAt: new Date(),
        },
      }
    );

    return {
      order,
      webhookData,
      alreadyProcessed: false,
    };
  }

  const subscriptionExpiresAt = await activateSubscription({
    order,
    webhookData,
  });

  return {
    order: {
      ...order,
      status: "paid",
      subscriptionExpiresAt,
    },
    webhookData,
    alreadyProcessed: false,
  };
};

const syncPaymentOrderWithPayOs = async (order) => {
  if (order.status === "paid") return order;

  const db = await getMongoDb();
  const payos = getPayOsClient();
  const paymentLink = await payos.paymentRequests.get(Number(order.orderCode));
  const status = String(paymentLink?.status || "").toUpperCase();
  const paidEnough =
    status === "PAID" &&
    Number(paymentLink.amountPaid ?? paymentLink.amount) >= Number(order.amount);

  if (paidEnough) {
    const subscriptionExpiresAt = await activateSubscription({
      order,
      webhookData: paymentLink,
    });

    return {
      ...order,
      status: "paid",
      paidAt: new Date(),
      payosStatusRaw: paymentLink,
      subscriptionExpiresAt,
    };
  }

  const mappedStatus =
    {
      CANCELLED: "cancelled",
      EXPIRED: "expired",
      FAILED: "failed",
    }[status] || order.status;

  if (mappedStatus !== order.status) {
    await db.collection("payment_orders").updateOne(
      { orderCode: order.orderCode },
      {
        $set: {
          status: mappedStatus,
          payosStatusRaw: paymentLink,
          updatedAt: new Date(),
        },
      }
    );
  }

  return {
    ...order,
    status: mappedStatus,
    payosStatusRaw: paymentLink,
  };
};

export const getPaymentStatus = async (orderCode) => {
  const db = await getMongoDb();
  let order = await db.collection("payment_orders").findOne({
    orderCode: Number(orderCode),
  });

  if (!order) {
    const error = new Error("Payment order was not found.");
    error.statusCode = 404;
    throw error;
  }

  if (["pending", "failed"].includes(order.status)) {
    try {
      order = await syncPaymentOrderWithPayOs(order);
    } catch (error) {
      console.error("Could not sync PayOS payment status:", error);
    }
  }

  return {
    orderCode: order.orderCode,
    accountType: order.accountType,
    planCode: order.planCode,
    amount: order.amount,
    status: order.status,
    checkoutUrl: order.checkoutUrl,
    paidAt: order.paidAt,
    subscriptionExpiresAt: order.subscriptionExpiresAt,
  };
};

export const getPaymentProfile = async (account) => {
  return buildSubscriptionSummary({
    accountType: "shop_owner",
    subscription: account.subscription,
  });
};

export const getCheckoutPlanForAccountType = (accountType) =>
  accountType === "shop_owner"
    ? PLAN_CODES.SHOP_OWNER_MONTHLY
    : null;
