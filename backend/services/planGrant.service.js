import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";
import { ensureLegacyCycle, quotePlanChange, activatePlanOrder } from "./billing.service.js";
import { getPaymentPlan } from "./subscription.service.js";

const reject = (message, statusCode = 409) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

export const isTrialEligible = (owner) => !owner.trialUsedAt && !owner.subscription?.planCode;

export const grantShopPlan = async ({ ownerId, planCode, grantType, grantedBy = null }) => {
  if (!["trial", "admin_grant"].includes(grantType)) reject("Invalid grant type.", 400);
  const db = await getMongoDb();
  let owner = await db.collection("shop_owners").findOne({ id: ownerId });
  if (!owner || owner.status !== "active") reject("An active shop owner is required.", 404);
  const plan = await getPaymentPlan(planCode);
  if (!plan) reject("Plan not found.", 404);
  if (grantType === "trial" && (!plan.trialEnabled || !isTrialEligible(owner))) reject("Free trial is unavailable for this account or plan.");
  owner = await ensureLegacyCycle(owner);
  const pending = await db.collection("payment_orders").findOne({ accountId: owner.id, status: "pending" });
  if (pending) reject("Complete or cancel the existing checkout before activating another plan.");

  const freePlan = { ...plan, catalogAmount: plan.amount, amount: 0 };
  const quote = await quotePlanChange({ owner, plan: freePlan, forceChange: true });
  const now = new Date();
  const order = {
    id: crypto.randomUUID(), orderCode: -crypto.randomInt(1, 1_000_000_000_000),
    accountType: "shop_owner", accountId: owner.id, planCode: plan.code,
    grantType, grantedBy, amount: 0, planSnapshot: freePlan, quote,
    previousCycleId: owner.subscription?.cycleId || null,
    checkoutKey: `plan:${owner.id}`, status: "pending", createdAt: now, updatedAt: now,
  };
  try { await db.collection("payment_orders").insertOne(order); }
  catch (error) {
    if (error.code === 11000) reject("Another plan activation is in progress.");
    throw error;
  }
  try {
    const expiresAt = await activatePlanOrder({ order, paymentRaw: { source: grantType, grantedBy } });
    if (!expiresAt) reject("Plan activation did not complete.");
    return { ownerId, planCode: plan.code, grantType, startsAt: now, expiresAt, suspended: Boolean(owner.subscription?.suspendedAt), orderCode: order.orderCode };
  } catch (error) {
    await db.collection("payment_orders").updateOne({ id: order.id, status: "pending" }, { $set: { status: "failed", error: error.message, updatedAt: new Date() } });
    throw error;
  }
};
