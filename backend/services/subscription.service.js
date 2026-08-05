import { getMongoDb } from "./mongo.service.js";

export const PLAN_CODES = {
  FREE: "FREE",
  SHOP_OWNER_MONTHLY: "SHOP_OWNER_MONTHLY",
};

export const PAYMENT_PLANS = {
  [PLAN_CODES.SHOP_OWNER_MONTHLY]: {
    code: PLAN_CODES.SHOP_OWNER_MONTHLY,
    accountType: "shop_owner",
    name: "MIROIR Shop Owner",
    description: "MIR Shop Owner",
    amount: 349000,
    durationDays: 30,
    features: [
      "Đăng sản phẩm lên nền tảng",
      "Tiếp cận user MIROIR",
      "Dashboard phân tích",
      "Ưu tiên hiển thị",
      "Truy cập insight khách hàng",
    ],
  },
};

export const listPaymentPlans = async () => {
  const db = await getMongoDb();
  const overrides = await db.collection("payment_plans").find({}).toArray();
  const overrideByCode = new Map(overrides.map((plan) => [plan.code, plan]));

  return Object.values(PAYMENT_PLANS).map((defaultPlan) => {
    const override = overrideByCode.get(defaultPlan.code) || {};
    return {
      ...defaultPlan,
      ...override,
      code: defaultPlan.code,
      accountType: defaultPlan.accountType,
      features: Array.isArray(override.features)
        ? override.features
        : defaultPlan.features,
      amount:
        Number.isFinite(Number(override.amount)) && Number(override.amount) >= 0
          ? Number(override.amount)
          : defaultPlan.amount,
      durationDays:
        Number.isInteger(Number(override.durationDays)) &&
        Number(override.durationDays) > 0
          ? Number(override.durationDays)
          : defaultPlan.durationDays,
      defaultAmount: defaultPlan.amount,
      defaultDurationDays: defaultPlan.durationDays,
    };
  });
};

export const getPaymentPlan = async (planCode) => {
  const plans = await listPaymentPlans();
  return plans.find((plan) => plan.code === planCode) || null;
};

export const updatePaymentPlan = async ({ planCode, body }) => {
  const defaultPlan = PAYMENT_PLANS[planCode];

  if (!defaultPlan) {
    const error = new Error("Invalid payment plan.");
    error.statusCode = 404;
    throw error;
  }

  const amount = Number(body.amount);
  const durationDays = Number(body.durationDays ?? defaultPlan.durationDays);

  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error("amount must be a non-negative number.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(durationDays) || durationDays < 1) {
    const error = new Error("durationDays must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  const features = Array.isArray(body.features)
    ? body.features.map((item) => String(item || "").trim()).filter(Boolean)
    : defaultPlan.features;
  const now = new Date();
  const patch = {
    code: defaultPlan.code,
    accountType: defaultPlan.accountType,
    name: String(body.name || defaultPlan.name).trim() || defaultPlan.name,
    description:
      String(body.description || defaultPlan.description).trim() ||
      defaultPlan.description,
    amount,
    durationDays,
    features,
    updatedAt: now,
  };

  const db = await getMongoDb();
  await db.collection("payment_plans").updateOne(
    { code: planCode },
    {
      $set: patch,
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return {
    ...defaultPlan,
    ...patch,
    defaultAmount: defaultPlan.amount,
    defaultDurationDays: defaultPlan.durationDays,
  };
};

export const getPeriodKey = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const isSubscriptionActive = (subscription = {}, expectedPlanCode) => {
  if (!subscription?.expiresAt) return false;

  const expiresAt = new Date(subscription.expiresAt);
  const planMatches = expectedPlanCode
    ? subscription.planCode === expectedPlanCode
    : subscription.planCode && subscription.planCode !== PLAN_CODES.FREE;

  return (
    planMatches &&
    subscription.status === "active" &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt > new Date()
  );
};

export const getPremiumShopIds = async (shopIds = []) => {
  const ids = [...new Set(shopIds.filter(Boolean))];
  if (!ids.length) return new Set();

  const db = await getMongoDb();
  const shops = await db
    .collection("shops")
    .find({ id: { $in: ids }, status: "active" })
    .project({ id: 1, ownerId: 1 })
    .toArray();
  const ownerIds = [...new Set(shops.map((shop) => shop.ownerId).filter(Boolean))];
  const owners = ownerIds.length
    ? await db.collection("shop_owners").find({ id: { $in: ownerIds } }).toArray()
    : [];
  const premiumOwnerIds = new Set(
    owners
      .filter((owner) =>
        isSubscriptionActive(owner.subscription, PLAN_CODES.SHOP_OWNER_MONTHLY)
      )
      .map((owner) => owner.id)
  );

  return new Set(
    shops
      .filter((shop) => premiumOwnerIds.has(shop.ownerId))
      .map((shop) => shop.id)
  );
};

export const getPlanFeatures = (planCode) =>
  PAYMENT_PLANS[planCode]?.features || [];

export const buildSubscriptionSummary = ({
  accountType,
  subscription = {},
  usage,
} = {}) => {
  if (accountType === "user") {
    return {
      planCode: PLAN_CODES.FREE,
      status: "free",
      expiresAt: null,
      isPremium: false,
      allFeaturesIncluded: true,
      features: [],
      usage: null,
    };
  }

  const premiumPlanCode =
    PLAN_CODES.SHOP_OWNER_MONTHLY;
  const active = isSubscriptionActive(subscription, premiumPlanCode);
  const planCode = active ? premiumPlanCode : PLAN_CODES.FREE;

  return {
    planCode,
    status: active ? "active" : "inactive",
    expiresAt: active ? subscription.expiresAt : subscription?.expiresAt || null,
    isPremium: active,
    features: active ? getPlanFeatures(planCode) : [],
    usage: usage || null,
  };
};
