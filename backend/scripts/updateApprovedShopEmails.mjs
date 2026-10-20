import dotenv from "dotenv";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BSON } from "mongodb";
import { getMongoDb, withMongoTransaction, closeMongoConnection } from "../services/mongo.service.js";

dotenv.config({ quiet: true });
const apply = process.argv.includes("--apply");
const changes = [
  { id: "06e23aa7-e14b-47aa-9fdf-f44e8b962cc2", name: "Zin Boutique", email: "zinboutique.qn@gmail.com" },
  { id: "9f298e88-b026-4035-a95d-e033ec8ec202", name: "Mouses Menswear", email: "mousesmenswear.qn@gmail.com" },
  { id: "c3c149f4-f450-4349-87fc-48ebf49cc966", name: "Bụi", email: "shopbui.quynhon@gmail.com" },
];

try {
  const db = await getMongoDb();
  const prepared = [];
  for (const change of changes) {
    const shop = await db.collection("shops").findOne({ id: change.id });
    assert.equal(shop?.name, change.name, "Shop identity changed; review before applying.");
    const owner = await db.collection("shop_owners").findOne({ id: shop.ownerId }, {
      projection: { id: 1, email: 1, updatedAt: 1, subscription: 1, createdAt: 1 },
    });
    assert.ok(owner);
    assert.equal(await db.collection("shops").countDocuments({ ownerId: owner.id }), 1, "Owner is shared with another shop.");
    assert.ok(!await db.collection("shop_owners").findOne({ email: change.email, id: { $ne: owner.id } }, { projection: { id: 1 } }), "Email is already in use.");
    prepared.push({ change, shop, owner });
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", shops: changes.map(({ name, email }) => ({ name, email })) }, null, 2));

  if (apply) {
    const now = new Date();
    const backupDir = fileURLToPath(new URL("../../outputs/admin-data-backups/", import.meta.url));
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(`${backupDir}/.gitignore`, "*\n!.gitignore\n");
    const backupPath = `${backupDir}/approved-shop-emails-${now.toISOString().replace(/[:.]/g, "-")}.ejson`;
    const backup = {
      backedUpAt: now,
      shops: prepared.map(({ shop }) => ({ id: shop.id, contact: shop.contact, updatedAt: shop.updatedAt })),
      owners: prepared.map(({ owner }) => ({ id: owner.id, email: owner.email, updatedAt: owner.updatedAt })),
    };
    await fs.writeFile(backupPath, BSON.EJSON.stringify(backup, null, 2, { relaxed: false }), { flag: "wx" });
    await withMongoTransaction(async (tx, session) => {
      for (const { change, shop, owner } of prepared) {
        assert.ok(!await tx.collection("shop_owners").findOne({ email: change.email, id: { $ne: owner.id } }, { session, projection: { id: 1 } }));
        const ownerResult = await tx.collection("shop_owners").updateOne({ id: owner.id, email: owner.email, updatedAt: owner.updatedAt }, {
          $set: { email: change.email, updatedAt: now },
        }, { session });
        assert.equal(ownerResult.matchedCount, 1, "Concurrent owner update; rolling back.");
        const shopResult = await tx.collection("shops").updateOne({ id: shop.id, ownerId: owner.id, updatedAt: shop.updatedAt }, {
          $set: { "contact.email": change.email, updatedAt: now },
        }, { session });
        assert.equal(shopResult.matchedCount, 1, "Concurrent shop update; rolling back.");
      }
    });

    for (const { change, shop, owner } of prepared) {
      const actualShop = await db.collection("shops").findOne({ id: shop.id });
      const actualOwner = await db.collection("shop_owners").findOne({ id: owner.id }, {
        projection: { id: 1, email: 1, updatedAt: 1, subscription: 1, createdAt: 1 },
      });
      assert.equal(actualOwner.email, change.email);
      assert.equal(actualShop.contact.email, change.email);
      assert.deepEqual(actualOwner.subscription, owner.subscription);
      assert.deepEqual(actualOwner.createdAt, owner.createdAt);
      const { updatedAt: oldUpdatedAt, ...oldFields } = shop;
      const { updatedAt: newUpdatedAt, ...newFields } = actualShop;
      assert.deepEqual(newFields, { ...oldFields, contact: { ...oldFields.contact, email: change.email } });
    }
    console.log(JSON.stringify({ verified: true, updatedShops: prepared.length, loginAndContactEmailsMatch: true, plansAndDatesPreserved: true, backup: backupPath }, null, 2));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
