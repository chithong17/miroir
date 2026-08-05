import crypto from "node:crypto";
import dotenv from "dotenv";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";

dotenv.config();
const apply = process.argv.includes("--apply");
const db = await getMongoDb();
const products = await db.collection("products").find({ $or: [{ variants: { $exists: false } }, { variants: { $size: 0 } }] }).toArray();
let combinationCount = 0;

for (const product of products) {
  const colors = Array.isArray(product.colors) && product.colors.length ? product.colors : [""];
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : [""];
  const variants = [];
  for (const color of colors) {
    for (const size of sizes) {
      combinationCount += 1;
      const skuBase = `${product.id}-${color || "DEFAULT"}-${size || "ONE"}`
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-")
        .replace(/^-|-$/g, "").toUpperCase().slice(0, 48);
      variants.push({ id: crypto.randomUUID(), sku: skuBase, color: String(color), size: String(size), stockQuantity: 0, active: true });
    }
  }
  if (apply) {
    await db.collection("products").updateOne({ _id: product._id }, { $set: { variants, availability: "out_of_stock", updatedAt: new Date(), variantsMigratedAt: new Date() } });
  }
}

console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", products: products.length, combinations: combinationCount }, null, 2));
await closeMongoConnection();
