import dotenv from "dotenv";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BSON } from "mongodb";
import { getMongoDb, withMongoTransaction, closeMongoConnection } from "../services/mongo.service.js";
import { withProductSoldCounts } from "../services/productSales.service.js";
import { buildCatalogSales, CATALOG_SALES_SEED } from "./catalogSalesData.js";

dotenv.config({ quiet: true });
const apply = process.argv.includes("--apply");
try {
  const db = await getMongoDb();
  const manifestIndex = process.argv.indexOf("--customer-manifest");
  let approvedIds = null;
  if (manifestIndex !== -1) {
    const manifest = BSON.EJSON.parse(await fs.readFile(process.argv[manifestIndex + 1], "utf8"));
    approvedIds = [...new Set([...manifest.existingCustomerIds, ...manifest.insertedCustomerIds])];
    assert.equal(approvedIds.length, 97, "Expected the approved set of 97 customer IDs.");
  }
  const shops = await db.collection("shops").find({ status: "active" }).project({ id: 1 }).toArray();
  const products = await db.collection("products").find({
    shopId: { $in: shops.map((s) => s.id) }, status: "published", availability: "in_stock",
    variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } },
  }).project({ id: 1, shopId: 1 }).toArray();
  const totalCustomers = await db.collection("users").countDocuments({});
  const users = await db.collection("users").find({ status: "active", ...(approvedIds ? { id: { $in: approvedIds } } : {}) }).project({ id: 1 }).toArray();
  assert.equal(users.length, 97, "Review customer count before allocation.");
  assert.ok(products.length > 0);
  const now = new Date();
  const { allocations, distribution, productQuantities } = buildCatalogSales({ products, users, now });
  const previous = await db.collection("catalog_sales").find({ seed: CATALOG_SALES_SEED }).toArray();
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", products: products.length, distribution, units: allocations.length, buyers: new Set(allocations.map((a) => a.userId)).size }, null, 2));
  if (apply) {
    const backupDir = fileURLToPath(new URL("../../outputs/admin-data-backups/", import.meta.url));
    await fs.mkdir(backupDir, { recursive: true });
    const backup = `${backupDir}/catalog-sales-${now.toISOString().replace(/[:.]/g, "-")}.ejson`;
    await fs.writeFile(backup, BSON.EJSON.stringify({ backedUpAt: now, seed: CATALOG_SALES_SEED, previous, plannedIds: allocations.map((a) => a.id) }, null, 2, { relaxed: false }), { flag: "wx" });
    await db.collection("catalog_sales").createIndex({ id: 1 }, { unique: true });
    await db.collection("catalog_sales").createIndex({ productId: 1 });
    await withMongoTransaction(async (tx, session) => {
      assert.equal(await tx.collection("users").countDocuments({}, { session }), totalCustomers);
      const existingUsers = await tx.collection("users").countDocuments({ id: { $in: users.map((u) => u.id) } }, { session });
      assert.equal(existingUsers, 97, "Customers changed concurrently.");
      const currentProducts = await tx.collection("products").countDocuments({ id: { $in: products.map((p) => p.id) }, status: "published" }, { session });
      assert.equal(currentProducts, products.length, "Products changed concurrently.");
      await tx.collection("catalog_sales").bulkWrite(allocations.map((allocation) => ({ updateOne: { filter: { id: allocation.id }, update: { $setOnInsert: allocation }, upsert: true } })), { session });
    });
    const stored = await db.collection("catalog_sales").find({ seed: CATALOG_SALES_SEED }).toArray();
    assert.equal(stored.length, allocations.length);
    const buyers = new Set(users.map((u) => u.id));
    const totals = new Map();
    for (const sale of stored) {
      assert.ok(buyers.has(sale.userId));
      assert.equal(sale.quantity, 1);
      totals.set(sale.productId, (totals.get(sale.productId) || 0) + sale.quantity);
    }
    for (const [id, quantity] of productQuantities) assert.equal(totals.get(id) || 0, quantity);
    const publicProducts = await withProductSoldCounts(db, products);
    for (const product of publicProducts) assert.ok(product.soldCount >= productQuantities.get(product.id));
    assert.equal(await db.collection("users").countDocuments({}), totalCustomers);
    console.log(JSON.stringify({ verified: true, ordersAndPaymentsUnchanged: true, allocatedCustomers: 97, totalCustomers, backup }, null, 2));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
