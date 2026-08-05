import dotenv from "dotenv";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";

dotenv.config();

const apply = process.argv.includes("--apply");
const requestedStock = Number(process.argv.find((argument) => argument.startsWith("--stock="))?.split("=")[1] || 100);

if (!Number.isInteger(requestedStock) || requestedStock < 0) {
  throw new Error("--stock phải là số nguyên không âm.");
}

const db = await getMongoDb();
const products = await db.collection("products")
  .find({ "variants.0": { $exists: true } }, { projection: { _id: 1, id: 1, name: 1, variants: 1 } })
  .toArray();

let variantCount = 0;
const now = new Date();

for (const product of products) {
  const variants = product.variants.map((variant) => ({
    ...variant,
    active: true,
    stockQuantity: requestedStock,
  }));
  variantCount += variants.length;

  if (apply) {
    await db.collection("products").updateOne(
      { _id: product._id },
      { $set: { variants, availability: requestedStock > 0 ? "in_stock" : "out_of_stock", updatedAt: now } },
    );
  }
}

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  stockPerVariant: requestedStock,
  products: products.length,
  variants: variantCount,
}, null, 2));

await closeMongoConnection();
