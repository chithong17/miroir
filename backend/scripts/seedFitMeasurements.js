import dotenv from "dotenv";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";

dotenv.config();

const apply = process.argv.includes("--apply");
const overwrite = process.argv.includes("--overwrite");
const SIZE_INDEX = { XXS: -1, XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5, "2XL": 5, XXXL: 6, "3XL": 6, "4XL": 7 };
const normalize = (value) => String(value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const inferCategory = (product) => {
  if (["top", "bottom", "dress", "outerwear"].includes(product.fitCategory)) return product.fitCategory;
  const text = normalize(`${product.name} ${product.category} ${product.description}`);
  if (/\b(quan|chan vay|jean|pants?|trouser|short|legging|skirt)\b/.test(text)) return "bottom";
  if (/\b(vay|dam|dress|jumpsuit)\b/.test(text)) return "dress";
  if (/\b(jacket|coat|blazer|hoodie|cardigan|ao khoac)\b/.test(text)) return "outerwear";
  if (/\b(ao|shirt|tee|t shirt|polo|sweater|knit|blouse|top)\b/.test(text)) return "top";
  return "";
};

const sizeOffset = (size) => SIZE_INDEX[String(size || "").trim().toUpperCase()] ?? null;
const generatedMeasurements = (category, size) => {
  const offset = sizeOffset(size);
  if (offset === null) return null;
  if (category === "bottom") return {
    waist: 68 + offset * 5, hips: 92 + offset * 5, inseam: 70 + Math.max(0, offset - 1), outseam: 96 + Math.max(0, offset - 1),
  };
  const chest = category === "outerwear" ? 96 + offset * 6 : 90 + offset * 6;
  return {
    chest, waist: chest - 8, hips: chest, shoulder: 38 + offset * 1.5,
    length: category === "dress" ? 88 + offset * 2 : 62 + offset * 2,
    sleeveLength: 57 + offset,
  };
};

const db = await getMongoDb();
const products = await db.collection("products").find({ "variants.0": { $exists: true } }).toArray();
const report = { mode: apply ? "apply" : "dry-run", overwrite, scannedProducts: products.length, updatedProducts: 0, updatedVariants: 0, skipped: [], samples: [] };

for (const product of products) {
  const fitCategory = inferCategory(product);
  if (!fitCategory) { report.skipped.push({ id: product.id, name: product.name, reason: "not_apparel_or_unknown_category" }); continue; }
  let updatedVariants = 0;
  const variants = product.variants.map((variant) => {
    const suggested = generatedMeasurements(fitCategory, variant.size);
    if (!suggested) return variant;
    const existing = variant.fitMeasurements || {};
    const fitMeasurements = overwrite ? suggested : { ...suggested, ...existing };
    const changed = Object.keys(suggested).some((key) => Number(existing[key]) !== Number(fitMeasurements[key]));
    if (changed) updatedVariants += 1;
    return changed ? { ...variant, fitMeasurements } : variant;
  });
  if (!updatedVariants) { report.skipped.push({ id: product.id, name: product.name, reason: "no_supported_size_or_measurements_already_present" }); continue; }
  report.updatedProducts += 1;
  report.updatedVariants += updatedVariants;
  report.samples.push({ id: product.id, name: product.name, fitCategory, variants: variants.filter((variant) => generatedMeasurements(fitCategory, variant.size)).slice(0, 3).map((variant) => ({ sku: variant.sku, size: variant.size, fitMeasurements: variant.fitMeasurements })) });
  if (apply) await db.collection("products").updateOne({ _id: product._id }, { $set: { variants, fitCategory, fitIntent: product.fitIntent || "regular", updatedAt: new Date() } });
}

console.log(JSON.stringify(report, null, 2));
await closeMongoConnection();
