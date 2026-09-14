import { getMongoDb } from "./mongo.service.js";

export const PLAN_CODES = {
  FREE: "FREE", STARTER_A: "STARTER_A", STARTER_B: "STARTER_B",
  GROWTH: "GROWTH", PRO_INSIGHT: "PRO_INSIGHT",
  SHOP_OWNER_MONTHLY: "SHOP_OWNER_MONTHLY", // Existing paid accounts.
};

const plan = (code, name, amount, commissionRate, tryOnQuota, overagePrice, tier, features) => ({
  code, accountType: "shop_owner", name, description: name, amount,
  durationMonths: 1, durationDays: 30, commissionRate, tryOnQuota, overagePrice, tier, features,
});

export const PAYMENT_PLANS = {
  STARTER_A: plan("STARTER_A", "Starter A", 99000, 0.025, 30, 3000, "basic", ["Dashboard cơ bản", "30 lượt Try-On", "Hoa hồng 2,5%"]),
  STARTER_B: plan("STARTER_B", "Starter B", 199000, 0, 30, 3000, "basic", ["Dashboard cơ bản", "30 lượt Try-On", "Không hoa hồng"]),
  GROWTH: plan("GROWTH", "Growth", 349000, 0, 60, 2500, "growth", ["Dashboard nâng cao", "60 lượt Try-On", "Gợi ý kinh doanh AI", "Gợi ý phối đồ B2C"]),
  PRO_INSIGHT: plan("PRO_INSIGHT", "Pro Insight", 599000, 0, 120, 2000, "pro", ["Insight Style & Budget", "120 lượt Try-On", "Báo cáo tư vấn AI mỗi kỳ"]),
};

export const normalizePlanCode = (code) => code === PLAN_CODES.SHOP_OWNER_MONTHLY ? PLAN_CODES.GROWTH : code;
export const isGrowthPlan = (code) => [PLAN_CODES.GROWTH, PLAN_CODES.PRO_INSIGHT, PLAN_CODES.SHOP_OWNER_MONTHLY].includes(code);
export const isProPlan = (code) => code === PLAN_CODES.PRO_INSIGHT;

export const addMonth = (date, anchorDay = new Date(date).getUTCDate()) => {
  const start = new Date(date);
  const result = new Date(start);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const finalDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(anchorDay, finalDay));
  return result;
};

export const listPaymentPlans = async () => {
  const db = await getMongoDb();
  const overrides = await db.collection("payment_plans").find({}).toArray();
  const byCode = new Map(overrides.map((item) => [item.code, item]));
  return Object.values(PAYMENT_PLANS).map((base) => {
    const override = byCode.get(base.code) || {};
    return {
      ...base,
      name: override.name || base.name,
      description: override.description || base.description,
      features: Array.isArray(override.features) ? override.features : base.features,
      amount: Number.isInteger(override.amount) && override.amount >= 0 ? override.amount : base.amount,
      trialEnabled: override.trialEnabled === true,
      defaultAmount: base.amount, defaultDurationDays: base.durationDays,
    };
  });
};

export const getPaymentPlan = async (code) => (await listPaymentPlans()).find((item) => item.code === normalizePlanCode(code)) || null;

export const updatePaymentPlan = async ({ planCode, body }) => {
  const base = PAYMENT_PLANS[planCode];
  if (!base) { const error = new Error("Invalid payment plan."); error.statusCode = 404; throw error; }
  const amount = Number(body.amount);
  if (!Number.isSafeInteger(amount) || amount < 0) { const error = new Error("amount must be a non-negative integer."); error.statusCode = 400; throw error; }
  if (body.trialEnabled !== undefined && typeof body.trialEnabled !== "boolean") { const error = new Error("trialEnabled must be a boolean."); error.statusCode = 400; throw error; }
  const patch = {
    code: base.code, accountType: base.accountType, amount,
    ...(body.trialEnabled !== undefined ? { trialEnabled: body.trialEnabled } : {}),
    name: String(body.name || base.name).trim(),
    description: String(body.description || base.description).trim(),
    features: Array.isArray(body.features) ? body.features.map((item) => String(item).trim()).filter(Boolean) : base.features,
    updatedAt: new Date(),
  };
  const db = await getMongoDb();
  await db.collection("payment_plans").updateOne({ code: planCode }, { $set: patch, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  return getPaymentPlan(planCode);
};

export const getPeriodKey = (date = new Date()) => date.toISOString().slice(0, 7);
export const isSubscriptionActive = (subscription = {}, expectedPlanCode) => {
  const code = normalizePlanCode(subscription?.planCode);
  return Boolean(subscription?.status === "active" && code && code !== PLAN_CODES.FREE &&
    (!expectedPlanCode || code === normalizePlanCode(expectedPlanCode)) &&
    subscription.expiresAt && new Date(subscription.expiresAt) > new Date());
};

export const getPremiumShopIds = async (shopIds = []) => {
  const ids = [...new Set(shopIds.filter(Boolean))];
  if (!ids.length) return new Set();
  const db = await getMongoDb();
  const shops = await db.collection("shops").find({ id: { $in: ids }, status: "active" }).project({ id: 1, ownerId: 1 }).toArray();
  const owners = await db.collection("shop_owners").find({ id: { $in: shops.map((item) => item.ownerId) } }).toArray();
  const active = new Set(owners.filter((owner) => isSubscriptionActive(owner.subscription) && !owner.subscription?.suspendedAt).map((owner) => owner.id));
  return new Set(shops.filter((shop) => active.has(shop.ownerId)).map((shop) => shop.id));
};

export const getPlanFeatures = (code) => PAYMENT_PLANS[normalizePlanCode(code)]?.features || [];
export const buildSubscriptionSummary = ({ accountType, subscription = {}, usage = null } = {}) => {
  if (accountType === "user") return { planCode: PLAN_CODES.FREE, status: "free", expiresAt: null, isPremium: false, allFeaturesIncluded: true, features: [], usage: null };
  const active = isSubscriptionActive(subscription) && !subscription.suspendedAt;
  const code = normalizePlanCode(subscription.planCode);
  const base = PAYMENT_PLANS[code];
  return {
    planCode: active ? code : PLAN_CODES.FREE, previousPlanCode: code || null,
    status: subscription.suspendedAt ? "suspended" : active ? "active" : "inactive",
    startsAt: subscription.startsAt || null, expiresAt: subscription.expiresAt || null,
    cycleId: subscription.cycleId || null, isPremium: active,
    grantType: active ? subscription.grantType || null : null,
    tier: active ? base?.tier : null, planName: subscription.planName || base?.name || null, features: active ? subscription.features || getPlanFeatures(code) : [],
    tryOnQuota: subscription.tryOnQuota ?? base?.tryOnQuota ?? 0,
    overagePrice: subscription.overagePrice ?? base?.overagePrice ?? 0,
    commissionRate: subscription.commissionRate ?? base?.commissionRate ?? 0,
    creditBalance: subscription.creditBalance || 0, usage,
    pendingRenewal: subscription.pendingRenewal ? { planCode: subscription.pendingRenewal.planSnapshot?.code } : null,
  };
};
