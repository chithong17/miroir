import crypto from "crypto";
import { getMongoDb, withMongoTransaction } from "./mongo.service.js";
import { addMonth, isSubscriptionActive, normalizePlanCode, PAYMENT_PLANS, PLAN_CODES } from "./subscription.service.js";
import { getPiApiTaskStatus } from "./piapi.service.js";
import { findResultUrls } from "../utils/findResultUrl.js";
import { createNotification } from "./notification.service.js";

const DAY = 86400000;
const bad = (message, statusCode = 409) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
export const money = (value) => Math.max(0, Math.round(value));
export const overageDelta = ({ before, added, quota }) => Math.max(0, before + added - quota) - Math.max(0, before - quota);
export const commissionTarget = ({ subtotal, rate, orderStatus, paymentStatus, refundedAmount = 0 }) => {
  if (orderStatus !== "delivered" || !["paid", "refunded"].includes(paymentStatus)) return 0;
  const refund = paymentStatus === "refunded" ? subtotal : refundedAmount;
  return money(Math.max(0, subtotal - refund) * rate);
};

export const quotePlanChange = async ({ owner, plan, forceChange = false }) => {
  const current = owner.subscription || {};
  const now = new Date();
  const changing = isSubscriptionActive(current) && (forceChange || normalizePlanCode(current.planCode) !== plan.code);
  const remaining = changing ? Math.max(0, new Date(current.expiresAt) - now) : 0;
  const duration = changing ? Math.max(1, new Date(current.expiresAt) - new Date(current.startsAt || new Date(current.expiresAt).getTime() - 30 * DAY)) : 1;
  const proratedCredit = changing ? money((current.amountPaid ?? PAYMENT_PLANS[normalizePlanCode(current.planCode)]?.amount ?? 0) * remaining / duration) : 0;
  const existingCredit = money(current.creditBalance || 0);
  const prepaidRenewalCredit = changing || !isSubscriptionActive(current) ? money(current.pendingRenewal?.planSnapshot?.amount || 0) : 0;
  const appliedCredit = Math.min(plan.amount, proratedCredit + existingCredit + prepaidRenewalCredit);
  return {
    planCode: plan.code, oldPlanCode: normalizePlanCode(current.planCode) || null,
    planAmount: plan.amount, proratedCredit, existingCredit, prepaidRenewalCredit, appliedCredit,
    payable: plan.amount - appliedCredit,
    remainingCredit: proratedCredit + existingCredit + prepaidRenewalCredit - appliedCredit,
    quotedAt: now,
  };
};

export const ensureLegacyCycle = async (owner) => {
  if (!owner) return null;
  if (owner.subscription?.planCode !== PLAN_CODES.SHOP_OWNER_MONTHLY || owner.subscription.cycleId || !isSubscriptionActive(owner.subscription)) return owner;
  const db = await getMongoDb();
  const now = new Date();
  const expiresAt = new Date(owner.subscription.expiresAt);
  const startsAt = new Date(expiresAt.getTime() - 30 * DAY);
  const cycleId = `legacy:${owner.id}:${expiresAt.toISOString()}`;
  const quota = Math.max(0, Math.ceil(60 * Math.max(0, expiresAt - now) / (30 * DAY)));
  await db.collection("billing_cycles").updateOne({ id: cycleId }, { $setOnInsert: {
    id: cycleId, ownerId: owner.id, planCode: PLAN_CODES.GROWTH, startsAt, expiresAt,
    status: "open", amountPaid: 349000, commissionRate: 0, tryOnQuota: quota,
    overagePrice: 2500, usedTryOns: 0, migratedFrom: PLAN_CODES.SHOP_OWNER_MONTHLY,
    originalStartsAt: startsAt, anchorDay: startsAt.getUTCDate(), createdAt: now,
  } }, { upsert: true });
  const patch = { ...owner.subscription, planCode: PLAN_CODES.GROWTH, cycleId, startsAt, tryOnQuota: quota, overagePrice: 2500, commissionRate: 0, amountPaid: 349000, migratedFrom: PLAN_CODES.SHOP_OWNER_MONTHLY };
  await db.collection("shop_owners").updateOne({ id: owner.id, "subscription.planCode": PLAN_CODES.SHOP_OWNER_MONTHLY }, { $set: { subscription: patch } });
  return { ...owner, subscription: patch };
};

const issueInvoice = async ({ db, session, ownerId, cycleId, now, includeCycleIds = null }) => {
  const entries = await db.collection("billing_entries").find({ ownerId, invoiceId: null, ...(includeCycleIds ? { cycleId: { $in: includeCycleIds } } : {}) }, { session }).toArray();
  const amount = entries.reduce((sum, item) => sum + item.amount, 0);
  if (!entries.length || amount <= 0) return null;
  const id = crypto.randomUUID();
  const invoice = { id, ownerId, cycleId, entries: entries.map(({ id: entryId, type, amount: itemAmount, referenceId, cycleId: sourceCycleId }) => ({ id: entryId, type, amount: itemAmount, referenceId, sourceCycleId })), amount, status: "unpaid", issuedAt: now, dueAt: new Date(now.getTime() + 7 * DAY), createdAt: now };
  await db.collection("billing_invoices").insertOne(invoice, { session });
  await db.collection("billing_entries").updateMany({ id: { $in: entries.map((entry) => entry.id) }, invoiceId: null }, { $set: { invoiceId: id } }, { session });
  await createNotification({ audienceType: "shop", audienceId: ownerId, type: "billing_invoice", title: "Hóa đơn phí phát sinh", message: `Hóa đơn ${amount.toLocaleString("vi-VN")}đ cần thanh toán trong 7 ngày.`, db, session });
  return invoice;
};

export const activatePlanOrder = async ({ order, paymentRaw = null }) => withMongoTransaction(async (db, session) => {
  const claim = await db.collection("payment_orders").updateOne({ id: order.id, status: { $ne: "paid" } }, { $set: { status: "activating" } }, { session });
  if (!claim.modifiedCount) return null;
  const owner = await db.collection("shop_owners").findOne({ id: order.accountId }, { session });
  if (!owner) bad("Shop owner was not found.", 404);
  const current = owner.subscription || {};
  if ((current.cycleId || null) !== (order.previousCycleId || null)) bad("Subscription changed while payment was pending.");
  if (order.grantType === "trial" && (owner.trialUsedAt || current.planCode)) bad("Free trial has already been used or a plan was previously activated.");
  const now = new Date();
  if (!order.grantType && isSubscriptionActive(current) && normalizePlanCode(current.planCode) === order.planCode) {
    if (current.pendingRenewal) bad("A renewal is already scheduled.");
    await db.collection("shop_owners").updateOne({ id: owner.id }, { $set: { "subscription.pendingRenewal": { planSnapshot: order.planSnapshot, orderCode: order.orderCode }, "subscription.creditBalance": order.quote?.remainingCredit || 0, updatedAt: now } }, { session });
    await db.collection("payment_orders").updateOne({ id: order.id }, { $set: { status: "paid", paidAt: now, subscriptionExpiresAt: current.expiresAt, paymentRaw, renewalScheduled: true, updatedAt: now } }, { session });
    return current.expiresAt;
  }
  if (current.cycleId) {
    await db.collection("billing_cycles").updateOne({ id: current.cycleId, status: "open" }, { $set: { status: "closed", closedAt: now } }, { session });
    await issueInvoice({ db, session, ownerId: owner.id, cycleId: current.cycleId, now });
  }
  if (current.pendingRenewal?.orderCode) await db.collection("payment_orders").updateOne({ orderCode: current.pendingRenewal.orderCode }, { $set: { renewalScheduled: false, supersededByOrderCode: order.orderCode } }, { session });
  const plan = order.planSnapshot;
  const cycleId = crypto.randomUUID();
  const expiresAt = addMonth(now);
  const cycle = { id: cycleId, ownerId: owner.id, planCode: plan.code, planSnapshot: plan, startsAt: now, expiresAt, anchorDay: now.getUTCDate(), status: "open", amountPaid: plan.amount, commissionRate: plan.commissionRate, tryOnQuota: plan.tryOnQuota, overagePrice: plan.overagePrice, usedTryOns: 0, paymentOrderCode: order.orderCode, ...(order.grantType ? { grantType: order.grantType, grantedBy: order.grantedBy || null } : {}), createdAt: now };
  await db.collection("billing_cycles").insertOne(cycle, { session });
  const subscription = { planCode: plan.code, planName: plan.name, features: plan.features, status: "active", startsAt: now, expiresAt, cycleId, amountPaid: plan.amount, commissionRate: plan.commissionRate, tryOnQuota: plan.tryOnQuota, overagePrice: plan.overagePrice, creditBalance: order.quote?.remainingCredit || 0, lastPaymentOrderCode: order.orderCode, ...(order.grantType ? { grantType: order.grantType } : {}), ...(current.suspendedAt ? { suspendedAt: current.suspendedAt } : {}), updatedAt: now };
  await db.collection("shop_owners").updateOne({ id: owner.id }, { $set: { subscription, updatedAt: now, ...(order.grantType === "trial" ? { trialUsedAt: now } : {}) } }, { session });
  await db.collection("payment_orders").updateOne({ id: order.id }, { $set: { status: "paid", paidAt: now, subscriptionExpiresAt: expiresAt, cycleId, paymentRaw, updatedAt: now } }, { session });
  return expiresAt;
});

export const listOwnerInvoices = async (ownerId) => (await getMongoDb()).collection("billing_invoices").find({ ownerId }).sort({ issuedAt: -1 }).toArray();
export const listAdminInvoices = async () => (await getMongoDb()).collection("billing_invoices").find({}).sort({ issuedAt: -1 }).limit(300).toArray();

export const getOwnerBillingSummary = async (owner) => {
  const current = await ensureLegacyCycle(owner);
  const db = await getMongoDb();
  const cycle = current.subscription?.cycleId ? await db.collection("billing_cycles").findOne({ id: current.subscription.cycleId }) : null;
  const [entries, invoices] = await Promise.all([
    db.collection("billing_entries").find({ ownerId: owner.id, invoiceId: null }).toArray(),
    db.collection("billing_invoices").find({ ownerId: owner.id, status: { $in: ["unpaid", "overdue"] } }).toArray(),
  ]);
  return { owner: current, usage: { used: cycle?.usedTryOns || 0, quota: cycle?.tryOnQuota || 0, overage: Math.max(0, (cycle?.usedTryOns || 0) - (cycle?.tryOnQuota || 0)), estimatedFees: entries.reduce((sum, item) => sum + item.amount, 0), outstanding: invoices.reduce((sum, item) => sum + item.amount, 0) } };
};

export const registerTryOnTask = async ({ taskId, shopId, productId, userId }) => {
  const db = await getMongoDb();
  const shop = await db.collection("shops").findOne({ id: shopId });
  if (!shop) return;
  const owner = await ensureLegacyCycle(await db.collection("shop_owners").findOne({ id: shop.ownerId }));
  if (!isSubscriptionActive(owner?.subscription) || owner.subscription.suspendedAt) bad("Shop subscription is inactive.", 403);
  await db.collection("billing_tryon_tasks").updateOne({ taskId }, { $setOnInsert: { taskId, shopId, productId, userId, ownerId: owner.id, cycleId: owner.subscription.cycleId, overagePrice: owner.subscription.overagePrice, settledCount: 0, createdAt: new Date() } }, { upsert: true });
};

export const assertShopTryOnAvailable = async (shopId) => {
  const db = await getMongoDb();
  const shop = await db.collection("shops").findOne({ id: shopId, status: "active" });
  if (!shop) bad("Shop is inactive.", 403);
  const owner = await ensureLegacyCycle(await db.collection("shop_owners").findOne({ id: shop.ownerId }));
  if (!owner || !isSubscriptionActive(owner.subscription) || owner.subscription.suspendedAt) bad("Shop Try-On is unavailable.", 403);
};

export const settleTryOnTask = async ({ taskId, imageCount }) => {
  if (!Number.isInteger(imageCount) || imageCount < 1) return;
  await withMongoTransaction(async (db, session) => {
    const task = await db.collection("billing_tryon_tasks").findOne({ taskId }, { session });
    if (!task || task.settledCount >= imageCount) return;
    const delta = imageCount - task.settledCount;
    const cycle = await db.collection("billing_cycles").findOne({ id: task.cycleId }, { session });
    if (!cycle) return;
    const before = cycle.usedTryOns || 0;
    const overage = overageDelta({ before, added: delta, quota: cycle.tryOnQuota });
    await db.collection("billing_cycles").updateOne({ id: cycle.id }, { $inc: { usedTryOns: delta } }, { session });
    await db.collection("billing_tryon_tasks").updateOne({ taskId }, { $set: { settledCount: imageCount, settledAt: new Date(), completedAt: new Date() } }, { session });
    if (overage) await db.collection("billing_entries").insertOne({ id: crypto.randomUUID(), ownerId: task.ownerId, cycleId: task.cycleId, type: "tryon_overage", referenceId: taskId, quantity: overage, unitPrice: task.overagePrice, amount: overage * task.overagePrice, invoiceId: null, createdAt: new Date() }, { session });
  });
};

export const syncOrderCommission = async (orderId) => withMongoTransaction(async (db, session) => {
  const order = await db.collection("orders").findOne({ id: orderId }, { session });
  if (!order) return;
  if (!order.commissionRateSnapshot) { await db.collection("orders").updateOne({ id: orderId }, { $unset: { billingSyncNeededAt: "" } }, { session }); return; }
  const returns = await db.collection("order_returns").find({ orderId, status: "refunded" }, { session }).toArray();
  const refunded = order.paymentStatus === "refunded" ? order.subtotal : returns.reduce((sum, item) => sum + (item.refundAmount || 0), 0);
  const target = commissionTarget({ subtotal: order.subtotal, rate: order.commissionRateSnapshot, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, refundedAmount: refunded });
  const previous = order.billingAccruedCommission || 0;
  if (target === previous) { await db.collection("orders").updateOne({ id: orderId }, { $unset: { billingSyncNeededAt: "" } }, { session }); return; }
  const revision = (order.billingCommissionRevision || 0) + 1;
  await db.collection("orders").updateOne({ id: orderId }, { $set: { billingAccruedCommission: target, billingCommissionRevision: revision }, $unset: { billingSyncNeededAt: "" } }, { session });
  await db.collection("billing_entries").insertOne({ id: crypto.randomUUID(), ownerId: order.ownerIdSnapshot, cycleId: order.billingCycleIdSnapshot, type: "commission", referenceId: orderId, revision, amount: target - previous, invoiceId: null, createdAt: new Date() }, { session });
});

export const runBillingWorker = async () => {
  const db = await getMongoDb();
  const now = new Date();
  const ordersToSync = await db.collection("orders").find({ billingSyncNeededAt: { $exists: true } }).sort({ billingSyncNeededAt: 1 }).limit(100).project({ id: 1 }).toArray();
  for (const order of ordersToSync) await syncOrderCommission(order.id).catch((error) => console.error(`Commission sync failed for ${order.id}:`, error));
  const refundsToSync = await db.collection("order_returns").find({ status: "refunded", billingSyncedAt: { $exists: false } }).sort({ updatedAt: 1 }).limit(100).project({ id: 1, orderId: 1 }).toArray();
  for (const refund of refundsToSync) {
    try {
      await syncOrderCommission(refund.orderId);
      await db.collection("order_returns").updateOne({ id: refund.id, status: "refunded" }, { $set: { billingSyncedAt: now } });
    } catch (error) { console.error(`Refund commission sync failed for ${refund.id}:`, error); }
  }
  const endingSoon = await db.collection("billing_cycles").find({ status: "open", reminderSentAt: { $exists: false }, expiresAt: { $gt: now, $lte: new Date(now.getTime() + 3 * DAY) } }).toArray();
  for (const cycle of endingSoon) {
    const owner = await db.collection("shop_owners").findOne({ id: cycle.ownerId });
    if (owner?.subscription?.pendingRenewal) continue;
    const updated = await db.collection("billing_cycles").updateOne({ id: cycle.id, reminderSentAt: { $exists: false } }, { $set: { reminderSentAt: now } });
    if (updated.modifiedCount) await createNotification({ audienceType: "shop", audienceId: cycle.ownerId, type: "subscription_expiring", title: "Gói sắp hết hạn", message: "Gói shop còn dưới 3 ngày. Vào Gói & thanh toán để gia hạn.", db });
  }
  const expired = await db.collection("billing_cycles").find({ status: "open", expiresAt: { $lte: now } }).toArray();
  for (const cycle of expired) {
    await withMongoTransaction(async (transactionDb, session) => {
      const updated = await transactionDb.collection("billing_cycles").updateOne({ id: cycle.id, status: "open" }, { $set: { status: "closed", closedAt: now } }, { session });
      if (!updated.modifiedCount) return;
      await issueInvoice({ db: transactionDb, session, ownerId: cycle.ownerId, cycleId: cycle.id, now });
      const owner = await transactionDb.collection("shop_owners").findOne({ id: cycle.ownerId }, { session });
      const renewal = owner?.subscription?.cycleId === cycle.id ? owner.subscription.pendingRenewal : null;
      if (renewal) {
        const plan = renewal.planSnapshot;
        const start = cycle.expiresAt;
        const anchorDay = cycle.anchorDay || new Date(cycle.startsAt).getUTCDate();
        const next = { id: crypto.randomUUID(), ownerId: owner.id, planCode: plan.code, planSnapshot: plan, startsAt: start, expiresAt: addMonth(start, anchorDay), anchorDay, status: "open", amountPaid: plan.amount, commissionRate: plan.commissionRate, tryOnQuota: plan.tryOnQuota, overagePrice: plan.overagePrice, usedTryOns: 0, paymentOrderCode: renewal.orderCode, createdAt: now };
        await transactionDb.collection("billing_cycles").insertOne(next, { session });
        await transactionDb.collection("shop_owners").updateOne({ id: owner.id }, { $set: { subscription: { planCode: plan.code, planName: plan.name, features: plan.features, status: "active", startsAt: next.startsAt, expiresAt: next.expiresAt, cycleId: next.id, amountPaid: plan.amount, commissionRate: plan.commissionRate, tryOnQuota: next.tryOnQuota, overagePrice: next.overagePrice, creditBalance: owner.subscription.creditBalance || 0, lastPaymentOrderCode: renewal.orderCode, ...(owner.subscription.suspendedAt ? { suspendedAt: owner.subscription.suspendedAt } : {}), updatedAt: now } } }, { session });
      }
    });
  }
  const overdue = await db.collection("billing_invoices").find({ status: "unpaid", dueAt: { $lte: now } }).toArray();
  for (const invoice of overdue) {
    const changed = await db.collection("billing_invoices").updateOne({ id: invoice.id, status: "unpaid" }, { $set: { status: "overdue" } });
    if (changed.modifiedCount) {
      await db.collection("shop_owners").updateOne({ id: invoice.ownerId, "subscription.suspendedAt": { $exists: false } }, { $set: { "subscription.suspendedAt": now } });
      await createNotification({ audienceType: "shop", audienceId: invoice.ownerId, type: "billing_overdue", title: "Hóa đơn quá hạn", message: "Gói shop và Try-On tạm ngừng đến khi thanh toán hóa đơn.", db });
    }
  }
  const tryOnTasks = await db.collection("billing_tryon_tasks").find({ completedAt: { $exists: false }, createdAt: { $gte: new Date(now.getTime() - 7 * DAY) } }).limit(20).toArray();
  await Promise.allSettled(tryOnTasks.map(async (task) => {
    const response = await getPiApiTaskStatus(task.taskId);
    const payload = response?.data || response;
    if (payload?.status === "completed") {
      const count = findResultUrls(payload.output).length;
      if (count) await settleTryOnTask({ taskId: task.taskId, imageCount: count });
      else await db.collection("billing_tryon_tasks").updateOne({ taskId: task.taskId }, { $set: { completedAt: now, settledCount: 0 } });
    } else if (payload?.status === "failed") await db.collection("billing_tryon_tasks").updateOne({ taskId: task.taskId }, { $set: { completedAt: now, failed: true } });
  }));
  const pendingEntries = await db.collection("billing_entries").find({ invoiceId: null }).project({ ownerId: 1, cycleId: 1 }).toArray();
  const sourceCycles = await db.collection("billing_cycles").find({ id: { $in: [...new Set(pendingEntries.map((entry) => entry.cycleId).filter(Boolean))] }, status: "closed" }).project({ id: 1 }).toArray();
  const closedIds = new Set(sourceCycles.map((cycle) => cycle.id));
  for (const ownerId of new Set(pendingEntries.filter((entry) => closedIds.has(entry.cycleId)).map((entry) => entry.ownerId))) {
    await withMongoTransaction((transactionDb, session) => issueInvoice({ db: transactionDb, session, ownerId, cycleId: null, now, includeCycleIds: [...closedIds] }));
  }
};

export const markInvoicePaid = async ({ invoiceId, orderCode }) => {
  const db = await getMongoDb();
  const invoice = await db.collection("billing_invoices").findOne({ id: invoiceId });
  if (!invoice || invoice.status === "paid") return;
  await db.collection("billing_invoices").updateOne({ id: invoiceId, status: { $ne: "paid" } }, { $set: { status: "paid", paidAt: new Date(), paymentOrderCode: orderCode } });
  const remaining = await db.collection("billing_invoices").countDocuments({ ownerId: invoice.ownerId, status: "overdue" });
  if (!remaining) await db.collection("shop_owners").updateOne({ id: invoice.ownerId }, { $unset: { "subscription.suspendedAt": "" } });
};
