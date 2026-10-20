import dotenv from "dotenv";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { BSON } from "mongodb";
import { getMongoDb, withMongoTransaction, closeMongoConnection } from "../services/mongo.service.js";
import { getPaymentPlan } from "../services/subscription.service.js";

dotenv.config({ quiet: true });
const apply = process.argv.includes("--apply");
const expectedOwners = [
  "9f0a3c36-06f6-457e-98b2-427a94983486", "eda4a0cd-9b27-4184-b49f-23af1417dee1",
  "6bfac7d0-1995-494b-8839-909d8647331a", "ea85397c-62b3-4d49-ace7-c07d4f6687f6",
  "401b81ab-94fb-4fa6-b517-fbe73aa03a85", "c36bde4b-3f18-433c-840a-f29f193e64e2",
];
const trialOwners = new Set([
  "c36bde4b-3f18-433c-840a-f29f193e64e2", // Thoi trang nam Han Quoc: Growth.
]);

try {
  const db = await getMongoDb();
  const shops = await db.collection("shops").find({}).project({ id: 1, name: 1, ownerId: 1, createdAt: 1 }).toArray();
  assert.equal(shops.length, 7, "Review fixture if shop membership has changed.");
  assert.ok(shops.every((shop) => expectedOwners.includes(shop.ownerId)));
  const owners = await db.collection("shop_owners").find({ id: { $in: expectedOwners } })
    .project({ id: 1, subscription: 1, trialUsedAt: 1, updatedAt: 1 }).toArray();
  assert.equal(owners.length, 6);
  const prepared = [];
  const now = new Date();
  for (const owner of owners) {
    const sub = owner.subscription;
    assert.ok(sub?.cycleId && sub.status === "active");
    const cycle = await db.collection("billing_cycles").findOne({ id: sub.cycleId, ownerId: owner.id });
    assert.ok(cycle);
    const order = await db.collection("payment_orders").findOne({ orderCode: cycle.paymentOrderCode, accountId: owner.id, status: "paid" });
    assert.ok(order, "Expected settled activation order.");
    const catalog = await getPaymentPlan(sub.planCode);
    assert.ok(catalog);
    const trial = trialOwners.has(owner.id);
    const amount = trial ? 0 : catalog.amount;
    const snapshot = { ...catalog, amount, ...(trial ? { catalogAmount: catalog.amount } : {}) };
    prepared.push({ owner, cycle, order, trial, amount, snapshot });
  }
  const summary = shops.map((shop) => {
    const entry = prepared.find((item) => item.owner.id === shop.ownerId);
    return { shop: shop.name, plan: entry.snapshot.name, source: entry.trial ? "trial" : "paid", amount: entry.amount };
  });
  assert.equal(summary.filter((shop) => shop.source === "trial").length, 1);
  assert.equal(summary.filter((shop) => shop.source === "paid").length, 6);
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", shops: summary }, null, 2));
  if (apply) {
    const backupDir = fileURLToPath(new URL("../../outputs/admin-data-backups/", import.meta.url));
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(`${backupDir}/.gitignore`, "*\n!.gitignore\n");
    const backupPath = `${backupDir}/subscription-sources-${now.toISOString().replace(/[:.]/g, "-")}.ejson`;
    // Store only the fields being adjusted, excluding credentials and provider payloads.
    const pick = (doc, keys) => Object.fromEntries(keys.filter((key) => key in doc).map((key) => [key, doc[key]]));
    const backup = {
      backedUpAt: now, shops,
      owners: prepared.map(({ owner }) => owner),
      cycles: prepared.map(({ cycle }) => pick(cycle, ["id", "amountPaid", "planSnapshot", "grantType", "grantedBy", "updatedAt", "dataAdjustment"])),
      orders: prepared.map(({ order }) => pick(order, ["id", "amount", "planSnapshot", "grantType", "grantedBy", "quote", "updatedAt", "dataAdjustment"])),
    };
    await fs.writeFile(backupPath, BSON.EJSON.stringify(backup, null, 2, { relaxed: false }), { flag: "wx" });
    const pendingBefore = await db.collection("payment_orders").countDocuments({ accountId: { $in: expectedOwners }, status: "pending" });
    await withMongoTransaction(async (tx, session) => {
      for (const { owner, cycle, order, trial, amount, snapshot } of prepared) {
        const adjustment = { source: "demo-subscription-mix", adjustedAt: now };
        const subscriptionSet = { "subscription.amountPaid": amount, "subscription.updatedAt": now, "subscription.dataAdjustment": adjustment, updatedAt: now };
        const subscriptionUnset = { "subscription.grantedBy": "" };
        if (trial) {
          subscriptionSet["subscription.grantType"] = "trial";
          subscriptionSet.trialUsedAt = owner.subscription.startsAt;
        } else {
          subscriptionUnset["subscription.grantType"] = "";
        }
        const ownerUpdate = await tx.collection("shop_owners").updateOne({ id: owner.id, "subscription.cycleId": cycle.id, "subscription.updatedAt": owner.subscription.updatedAt }, { $set: subscriptionSet, $unset: subscriptionUnset }, { session });
        assert.equal(ownerUpdate.matchedCount, 1, "Concurrent subscription change; rolling back.");
        const sourceFields = trial ? { grantType: "trial" } : {};
        const sourceUnset = trial ? { grantedBy: "" } : { grantType: "", grantedBy: "" };
        const cycleUpdate = await tx.collection("billing_cycles").updateOne({ id: cycle.id, ownerId: owner.id }, {
          $set: { amountPaid: amount, planSnapshot: snapshot, updatedAt: now, dataAdjustment: adjustment, ...sourceFields }, $unset: sourceUnset,
        }, { session });
        assert.equal(cycleUpdate.matchedCount, 1);
        const quote = { planCode: snapshot.code, oldPlanCode: null, planAmount: amount, proratedCredit: 0, existingCredit: 0, prepaidRenewalCredit: 0, appliedCredit: 0, payable: amount, remainingCredit: 0, quotedAt: owner.subscription.startsAt };
        const orderUpdate = await tx.collection("payment_orders").updateOne({ id: order.id, status: "paid" }, {
          $set: { amount, planSnapshot: snapshot, quote, updatedAt: now, dataAdjustment: adjustment, ...sourceFields }, $unset: sourceUnset,
        }, { session });
        assert.equal(orderUpdate.matchedCount, 1);
      }
    });

    // Verify the stored subscriptions and their linked cycles/orders independently.
    let trials = 0;
    for (const { owner, cycle, order, trial, amount } of prepared) {
      const actual = await db.collection("shop_owners").findOne({ id: owner.id });
      const actualCycle = await db.collection("billing_cycles").findOne({ id: cycle.id });
      const actualOrder = await db.collection("payment_orders").findOne({ id: order.id });
      assert.equal(actual.subscription.grantType || null, trial ? "trial" : null);
      assert.equal(actual.subscription.amountPaid, amount);
      assert.equal(actualCycle.amountPaid, amount);
      assert.equal(actualCycle.grantType || null, trial ? "trial" : null);
      assert.equal(actualOrder.grantType || null, trial ? "trial" : null);
      assert.equal(actualOrder.amount, amount);
      assert.equal(actualOrder.status, "paid");
      assert.deepEqual(actual.subscription.startsAt, owner.subscription.startsAt);
      assert.deepEqual(actual.subscription.expiresAt, owner.subscription.expiresAt);
      assert.equal(actual.subscription.planCode, owner.subscription.planCode);
      assert.equal(actualCycle.usedTryOns, cycle.usedTryOns);
      assert.deepEqual(actual.subscription.pendingRenewal, owner.subscription.pendingRenewal);
      trials += trial ? shops.filter((shop) => shop.ownerId === owner.id).length : 0;
    }
    for (const shop of shops) {
      const actualShop = await db.collection("shops").findOne({ id: shop.id });
      assert.deepEqual(actualShop.createdAt, shop.createdAt);
    }
    assert.equal(trials, 1);
    assert.equal(await db.collection("payment_orders").countDocuments({ accountId: { $in: expectedOwners }, status: "pending" }), pendingBefore);
    console.log(JSON.stringify({ verified: true, trialShops: 1, paidShops: 6, datesPreserved: true, backup: backupPath }, null, 2));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
