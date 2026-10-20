import dotenv from "dotenv";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BSON } from "mongodb";
import { getMongoDb, withMongoTransaction, closeMongoConnection } from "../services/mongo.service.js";
import { getPaymentPlan, addMonth } from "../services/subscription.service.js";

dotenv.config({ quiet: true });
const apply = process.argv.includes("--apply");
// Explicitly anchored to the user's request on 20 October 2026, Vietnam time.
const changes = [
  { ownerId: "9f0a3c36-06f6-457e-98b2-427a94983486", code: "GROWTH", start: "2026-09-29T09:15:00+07:00" },
  { ownerId: "eda4a0cd-9b27-4184-b49f-23af1417dee1", code: "GROWTH", start: "2026-09-30T10:20:00+07:00" },
  { ownerId: "6bfac7d0-1995-494b-8839-909d8647331a", code: "STARTER_A", start: "2026-10-01T14:10:00+07:00" },
  { ownerId: "ea85397c-62b3-4d49-ace7-c07d4f6687f6", code: "STARTER_A", start: "2026-10-02T11:35:00+07:00" },
  { ownerId: "401b81ab-94fb-4fa6-b517-fbe73aa03a85", code: "GROWTH", start: "2026-10-03T15:40:00+07:00" },
  { ownerId: "c36bde4b-3f18-433c-840a-f29f193e64e2", code: "GROWTH", start: "2026-10-05T08:50:00+07:00" },
];
const shopDates = new Map([
  ["06e23aa7-e14b-47aa-9fdf-f44e8b962cc2", "2026-09-23T09:05:00+07:00"],
  ["9f298e88-b026-4035-a95d-e033ec8ec202", "2026-09-25T10:30:00+07:00"],
  ["c3c149f4-f450-4349-87fc-48ebf49cc966", "2026-09-28T14:15:00+07:00"],
]);
const cutoff = new Date("2026-09-29T00:00:00+07:00");
const day = (value) => new Date(value).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

try {
  const db = await getMongoDb();
  const shops = await db.collection("shops").find({}).sort({ slug: 1 }).toArray();
  const ids = changes.map((change) => change.ownerId);
  if (shops.length !== 7 || shops.some((shop) => !ids.includes(shop.ownerId))) throw new Error("Shop membership changed; review the explicit fixture before applying.");
  const owners = await db.collection("shop_owners").find({ id: { $in: ids } }).toArray();
  if (owners.length !== ids.length || owners.some((owner) => owner.status !== "active")) throw new Error("Expected six existing active owners.");
  const cycles = await db.collection("billing_cycles").find({ ownerId: { $in: ids } }).toArray();
  const orders = await db.collection("payment_orders").find({ accountId: { $in: ids } }).toArray();
  const byOwner = new Map(owners.map((owner) => [owner.id, owner]));
  const now = new Date();
  const prepared = [];
  for (const change of changes) {
    const owner = byOwner.get(change.ownerId);
    const sub = owner.subscription || {};
    const catalog = await getPaymentPlan(change.code);
    if (!catalog) throw new Error(`Missing plan ${change.code}`);
    const startsAt = new Date(change.start);
    const expiresAt = addMonth(startsAt);
    const cycle = cycles.find((item) => item.id === sub.cycleId);
    if (sub.cycleId && !cycle) throw new Error("Referenced billing cycle missing.");
    if (sub.suspendedAt) throw new Error("Suspended subscription needs separate review.");
    const grantType = sub.grantType || (!sub.cycleId ? "admin_grant" : null);
    const amount = grantType ? 0 : (sub.amountPaid ?? catalog.amount);
    const snapshot = { ...catalog, amount, ...(grantType ? { catalogAmount: catalog.amount } : {}) };
    const cycleId = sub.cycleId || crypto.randomUUID();
    const orderCode = cycle?.paymentOrderCode || sub.lastPaymentOrderCode || -crypto.randomInt(1, 1_000_000_000_000);
    const order = orders.find((item) => item.orderCode === orderCode);
    if (order && (order.accountId !== owner.id || order.status !== "paid")) throw new Error("Only an existing settled activation can be adjusted.");
    const ownerShops = shops.filter((shop) => shop.ownerId === owner.id);
    const adjustedShopDates = ownerShops.map((shop) => {
      const requested = shopDates.get(shop.id);
      return requested && new Date(shop.createdAt) > cutoff ? new Date(requested) : new Date(shop.createdAt);
    });
    const firstShopDate = new Date(Math.min(...adjustedShopDates.map(Number)));
    if (adjustedShopDates.some((date) => date >= startsAt)) throw new Error("Shop must exist before its subscription starts.");
    const ownerCreatedAt = new Date(owner.createdAt) > firstShopDate ? new Date(firstShopDate.getTime() - 5 * 60000) : owner.createdAt;
    const subscription = {
      ...sub, planCode: catalog.code, planName: catalog.name, features: catalog.features,
      status: "active", startsAt, expiresAt, cycleId, amountPaid: amount,
      commissionRate: catalog.commissionRate, tryOnQuota: catalog.tryOnQuota,
      overagePrice: catalog.overagePrice, creditBalance: sub.creditBalance || 0,
      lastPaymentOrderCode: orderCode, updatedAt: now,
      ...(grantType ? { grantType } : {}),
    };
    prepared.push({ owner, ownerCreatedAt, cycle, cycleId, order, orderCode, snapshot, subscription, startsAt, expiresAt, grantType });
  }
  const summary = shops.map((shop) => {
    const item = prepared.find((entry) => entry.owner.id === shop.ownerId);
    const changedDate = shopDates.get(shop.id) && new Date(shop.createdAt) > cutoff;
    return { shop: shop.name, plan: item.snapshot.name, registered: day(changedDate ? shopDates.get(shop.id) : shop.createdAt), registrationChanged: Boolean(changedDate), activated: day(item.startsAt), expires: day(item.expiresAt) };
  });
  if (summary.filter((shop) => shop.plan === prepared.find((entry) => entry.snapshot.code === "STARTER_A").snapshot.name).length !== 2) throw new Error("Expected exactly two Starter A shops.");
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", shops: summary }, null, 2));

  if (apply) {
    const backupDir = fileURLToPath(new URL("../../outputs/admin-data-backups/", import.meta.url));
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(`${backupDir}/.gitignore`, "*\n!.gitignore\n");
    const backup = `${backupDir}/shop-plan-dates-${now.toISOString().replace(/[:.]/g, "-")}.ejson`;
    // Only fields necessary for rollback; exclude owner credentials and payment provider payloads.
    const backupData = {
      backedUpAt: now,
      shops: shops.map(({ id, createdAt, updatedAt }) => ({ id, createdAt, updatedAt })),
      owners: owners.map(({ id, subscription, createdAt, updatedAt, trialUsedAt }) => ({ id, subscription, createdAt, updatedAt, trialUsedAt })),
      cycles,
      orders: orders.filter((order) => prepared.some((item) => item.order?.id === order.id)).map(({ id, planCode, planSnapshot, createdAt, updatedAt, paidAt, subscriptionExpiresAt, cycleId }) => ({ id, planCode, planSnapshot, createdAt, updatedAt, paidAt, subscriptionExpiresAt, cycleId })),
      insertedCycles: prepared.filter((item) => !item.cycle).map((item) => item.cycleId),
      insertedOrders: prepared.filter((item) => !item.order).map((item) => item.orderCode),
    };
    await fs.writeFile(backup, BSON.EJSON.stringify(backupData, null, 2, { relaxed: false }), { flag: "wx" });
    await withMongoTransaction(async (transactionDb, session) => {
      for (const item of prepared) {
        const { owner, cycle, cycleId, order, orderCode, snapshot, subscription, startsAt, expiresAt, grantType } = item;
        const filter = { id: owner.id, ...(owner.subscription?.cycleId ? { "subscription.cycleId": owner.subscription.cycleId } : { "subscription.cycleId": { $exists: false } }) };
        const updated = await transactionDb.collection("shop_owners").updateOne(filter, { $set: { subscription, createdAt: item.ownerCreatedAt, updatedAt: now, ...(grantType === "trial" ? { trialUsedAt: startsAt } : {}) } }, { session });
        if (updated.matchedCount !== 1) throw new Error("Owner changed during update; transaction rolled back.");
        const cyclePatch = { ownerId: owner.id, planCode: snapshot.code, planSnapshot: snapshot, startsAt, expiresAt, anchorDay: startsAt.getUTCDate(), status: "open", amountPaid: snapshot.amount, commissionRate: snapshot.commissionRate, tryOnQuota: snapshot.tryOnQuota, overagePrice: snapshot.overagePrice, paymentOrderCode: orderCode, createdAt: startsAt, updatedAt: now, ...(grantType ? { grantType } : {}) };
        if (cycle) {
          await transactionDb.collection("billing_cycles").updateOne({ id: cycleId, ownerId: owner.id }, { $set: cyclePatch, $unset: { closedAt: "", expiringNotifiedAt: "" } }, { session });
        } else {
          await transactionDb.collection("billing_cycles").insertOne({ id: cycleId, ...cyclePatch, usedTryOns: 0, dataAdjustment: "shop-dates-2026-10-20" }, { session });
        }
        if (order) {
          await transactionDb.collection("payment_orders").updateOne({ id: order.id, status: "paid" }, { $set: { planCode: snapshot.code, planSnapshot: snapshot, createdAt: startsAt, paidAt: startsAt, subscriptionExpiresAt: expiresAt, cycleId, updatedAt: now } }, { session });
        } else {
          await transactionDb.collection("payment_orders").insertOne({ id: crypto.randomUUID(), orderCode, accountType: "shop_owner", accountId: owner.id, planCode: snapshot.code, planSnapshot: snapshot, amount: 0, status: "paid", grantType: "admin_grant", grantedBy: "local-data-adjustment", createdAt: startsAt, paidAt: startsAt, subscriptionExpiresAt: expiresAt, cycleId, updatedAt: now, dataAdjustment: "shop-dates-2026-10-20" }, { session });
        }
      }
      for (const shop of shops) {
        const requested = shopDates.get(shop.id);
        if (requested && new Date(shop.createdAt) > cutoff) {
          const result = await transactionDb.collection("shops").updateOne({ id: shop.id, createdAt: shop.createdAt }, { $set: { createdAt: new Date(requested), updatedAt: now } }, { session });
          if (result.matchedCount !== 1) throw new Error("Shop changed during update; transaction rolled back.");
        }
      }
    });
    console.log(`Applied successfully. Backup: ${backup}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
