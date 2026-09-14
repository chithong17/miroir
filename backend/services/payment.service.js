import { PayOS } from "@payos/node";
import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";
import {
  PLAN_CODES,
  buildSubscriptionSummary,
  getPaymentPlan,
  normalizePlanCode,
} from "./subscription.service.js";
import { activatePlanOrder, ensureLegacyCycle, getOwnerBillingSummary, markInvoicePaid, quotePlanChange } from "./billing.service.js";


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
  const randomPart = crypto.randomInt(10000, 100000);
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

export const createPaymentLink = async ({ account, planCode, invoiceId = null }) => {
  const plan = invoiceId ? null : await getPlanForAccount({ planCode, accountType: account.accountType });
  const db = await getMongoDb();
  if (plan && account.subscription?.pendingRenewal && account.subscription.planCode === plan.code) { const error = new Error("A renewal is already scheduled."); error.statusCode = 409; throw error; }
  const invoice = invoiceId ? await db.collection("billing_invoices").findOne({ id: invoiceId, ownerId: account.id, status: { $in: ["unpaid", "overdue"] } }) : null;
  if (invoiceId && !invoice) { const error = new Error("Invoice is not payable."); error.statusCode = 404; throw error; }
  const pending = await db.collection("payment_orders").findOne({ accountId: account.id, status: "pending", ...(invoiceId ? { invoiceId } : { invoiceId: null }) }, { sort: { createdAt: -1 } });
  if (pending?.checkoutUrl) {
    const latest = await syncPaymentOrderWithPayOs(pending).catch(() => pending);
    if (latest.status === "pending") {
      if (invoiceId || latest.planCode === plan?.code) return { order: latest, checkoutUrl: latest.checkoutUrl };
      const error = new Error("Complete or cancel the existing plan checkout first."); error.statusCode = 409; throw error;
    }
    if (latest.status === "paid") {
      if (invoiceId || latest.planCode === plan?.code) return { order: latest, checkoutUrl: null };
      const error = new Error("Subscription changed; refresh before choosing a new plan."); error.statusCode = 409; throw error;
    }
  }
  const quote = plan ? await quotePlanChange({ owner: account, plan }) : null;
  const amount = invoice ? invoice.amount : quote.payable;
  if (plan && amount === 0) {
    const now = new Date();
    const order = { id: crypto.randomUUID(), orderCode: createOrderCode(), accountType: account.accountType, accountId: account.id, planCode: plan.code, amount: 0, planSnapshot: plan, quote, previousCycleId: account.subscription?.cycleId || null, checkoutKey: `plan:${account.id}`, status: "pending", createdAt: now, updatedAt: now };
    await db.collection("payment_orders").insertOne(order);
    await activatePlanOrder({ order, paymentRaw: { source: "credit" } });
    return { order: { ...order, status: "paid" }, checkoutUrl: null };
  }
  const payos = getPayOsClient();
  const now = new Date();
  const orderCode = createOrderCode();
  const { returnUrl, cancelUrl } = getPaymentUrls({
    accountType: account.accountType,
    planCode: invoice ? "INVOICE" : planCode,
    orderCode,
  });

  const order = {
    id: crypto.randomUUID(),
    orderCode,
    accountType: account.accountType,
    accountId: account.id,
    planCode: invoice ? "INVOICE" : plan.code,
    invoiceId: invoice?.id || null,
    planSnapshot: plan,
    quote,
    checkoutKey: invoice ? `invoice:${invoice.id}` : `plan:${account.id}`,
    previousCycleId: account.subscription?.cycleId || null,
    amount,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  try { await db.collection("payment_orders").insertOne(order); }
  catch (error) {
    if (error.code === 11000) { const conflict = new Error("A checkout is already in progress. Please retry shortly."); conflict.statusCode = 409; throw conflict; }
    throw error;
  }

  try {
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount,
      description: (invoice ? `MIROIR ${invoice.id.slice(0, 8)}` : plan.description).slice(0, 25),
      returnUrl,
      cancelUrl,
      items: [
        {
          name: invoice ? "MIROIR invoice" : plan.name,
          quantity: 1,
          price: amount,
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
  if (order.invoiceId) {
    await markInvoicePaid({ invoiceId: order.invoiceId, orderCode: order.orderCode });
    const db = await getMongoDb();
    await db.collection("payment_orders").updateOne({ id: order.id, status: { $ne: "paid" } }, { $set: { status: "paid", paidAt: new Date(), webhookRaw: webhookData } });
    return null;
  }
  let payableOrder = order;
  if (!order.planSnapshot) {
    const db = await getMongoDb();
    const owner = await ensureLegacyCycle(await db.collection("shop_owners").findOne({ id: order.accountId }));
    const plan = await getPaymentPlan(normalizePlanCode(order.planCode));
    if (!owner || !plan) throw new Error("Legacy payment plan could not be migrated.");
    payableOrder = { ...order, planCode: plan.code, planSnapshot: { ...plan, amount: order.amount }, previousCycleId: owner.subscription?.cycleId || null, quote: { remainingCredit: owner.subscription?.creditBalance || 0 } };
    await db.collection("payment_orders").updateOne({ id: order.id, planSnapshot: { $exists: false } }, { $set: { planCode: payableOrder.planCode, planSnapshot: payableOrder.planSnapshot, previousCycleId: payableOrder.previousCycleId, quote: payableOrder.quote } });
  }
  return activatePlanOrder({ order: payableOrder, paymentRaw: webhookData });
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
  const { owner, usage } = await getOwnerBillingSummary(account);
  return { ...buildSubscriptionSummary({
    accountType: "shop_owner",
    subscription: owner.subscription,
    usage,
  }), trialEligible: !owner.trialUsedAt && !owner.subscription?.planCode };
};

export const getCheckoutPlanForAccountType = (accountType) =>
  accountType === "shop_owner"
    ? PLAN_CODES.GROWTH
    : null;
