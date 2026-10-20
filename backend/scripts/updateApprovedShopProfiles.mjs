import dotenv from "dotenv";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BSON } from "mongodb";
import { getMongoDb, withMongoTransaction, closeMongoConnection } from "../services/mongo.service.js";

dotenv.config({ quiet: true });
const apply = process.argv.includes("--apply");
// Names, addresses, phone numbers and fanpages explicitly approved by the user.
const changes = [
  {
    id: "9f298e88-b026-4035-a95d-e033ec8ec202", previousName: "Enbi Boutique",
    name: "Mouses Menswear", slug: "mouses-menswear", address: "242 Trần Hưng Đạo",
    phone: "093 529 7564", facebook: "https://www.facebook.com/profile.php?id=100083565182278",
    description: "Mouses Menswear – cửa hàng thời trang nam tại 242 Trần Hưng Đạo.",
  },
  {
    id: "c3c149f4-f450-4349-87fc-48ebf49cc966", previousName: "Girly Boutique",
    name: "Bụi", slug: "bui", address: "124 Tăng Bạt Hổ",
    phone: "076 667 6988", facebook: "https://www.facebook.com/shopbuiquynhon",
    description: "Bụi – cửa hàng thời trang tại 124 Tăng Bạt Hổ.",
  },
];

try {
  const db = await getMongoDb();
  const shopIds = changes.map((change) => change.id);
  const shops = await db.collection("shops").find({ id: { $in: shopIds } }).toArray();
  assert.equal(shops.length, changes.length, "Expected all requested existing shops.");
  const owners = await db.collection("shop_owners").find({ id: { $in: shops.map((shop) => shop.ownerId) } })
    .project({ id: 1, email: 1, subscription: 1, createdAt: 1, updatedAt: 1 }).toArray();
  const productCounts = new Map();
  for (const change of changes) {
    const shop = shops.find((entry) => entry.id === change.id);
    assert.ok(shop.name === change.previousName || shop.name === change.name, "Shop identity changed; review fixture.");
    assert.ok(!await db.collection("shops").findOne({ slug: change.slug, id: { $ne: change.id } }, { projection: { id: 1 } }), "Target slug already used.");
    productCounts.set(shop.id, await db.collection("products").countDocuments({ shopId: shop.id }));
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", changes: changes.map(({ previousName, name, slug, address, phone, facebook }) => ({ previousName, name, slug, address, phone, facebook })) }, null, 2));

  if (apply) {
    const now = new Date();
    const backupDir = fileURLToPath(new URL("../../outputs/admin-data-backups/", import.meta.url));
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(`${backupDir}/.gitignore`, "*\n!.gitignore\n");
    const backupPath = `${backupDir}/approved-shop-profiles-${now.toISOString().replace(/[:.]/g, "-")}.ejson`;
    const before = shops.map(({ id, name, slug, contact, description, updatedAt }) => ({ id, name, slug, contact, description, updatedAt }));
    await fs.writeFile(backupPath, BSON.EJSON.stringify({ backedUpAt: now, shops: before }, null, 2, { relaxed: false }), { flag: "wx" });
    await withMongoTransaction(async (tx, session) => {
      for (const change of changes) {
        const oldShop = shops.find((shop) => shop.id === change.id);
        assert.ok(!await tx.collection("shops").findOne({ slug: change.slug, id: { $ne: change.id } }, { session, projection: { id: 1 } }));
        const updated = await tx.collection("shops").updateOne({ id: change.id, name: oldShop.name, slug: oldShop.slug, updatedAt: oldShop.updatedAt }, {
          $set: {
            name: change.name, slug: change.slug, description: change.description,
            "contact.address": change.address, "contact.phone": change.phone,
            "contact.facebook": change.facebook, updatedAt: now,
          },
        }, { session });
        assert.equal(updated.matchedCount, 1, "Concurrent shop update; transaction rolled back.");
      }
    });

    for (const change of changes) {
      const shop = await db.collection("shops").findOne({ id: change.id });
      const oldShop = shops.find((entry) => entry.id === change.id);
      assert.equal(shop.name, change.name);
      assert.equal(shop.slug, change.slug);
      assert.equal(shop.description, change.description);
      assert.equal(shop.contact.address, change.address);
      assert.equal(shop.contact.phone, change.phone);
      assert.equal(shop.contact.facebook, change.facebook);
      assert.equal(shop.contact.email, oldShop.contact?.email);
      assert.equal(shop.ownerId, oldShop.ownerId);
      assert.deepEqual(shop.createdAt, oldShop.createdAt);
      assert.equal(await db.collection("products").countDocuments({ shopId: shop.id }), productCounts.get(shop.id));
    }
    for (const owner of owners) {
      const saved = await db.collection("shop_owners").findOne({ id: owner.id }, { projection: { id: 1, email: 1, subscription: 1, createdAt: 1, updatedAt: 1 } });
      assert.deepEqual(saved, owner, "Owner account and subscription must remain unchanged.");
    }
    console.log(JSON.stringify({ verified: true, updatedShops: changes.length, accountsAndPlansPreserved: true, registrationDatesPreserved: true, productsPreserved: true, backup: backupPath }, null, 2));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
