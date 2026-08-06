import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";

dotenv.config();

const apply = process.argv.includes("--apply");
const normalize = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const dateValue = (value) => {
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const completenessScore = (product) => [
  ({ published: 400, draft: 300, archived: 200, trashed: 0 }[product.status] ?? 100),
  Array.isArray(product.variants) && product.variants.some((variant) => variant.active && Number(variant.stockQuantity) > 0) ? 50 : 0,
  product.imageUrl ? 20 : 0,
  product.description ? 10 : 0,
  Array.isArray(product.tags) ? Math.min(product.tags.length, 5) : 0,
  dateValue(product.updatedAt) / 1e15,
].reduce((sum, value) => sum + value, 0);

const db = await getMongoDb();
const products = await db.collection("products").find({}).toArray();
const groups = new Map();

for (const product of products) {
  const key = `${product.shopId ?? "no-shop"}|${normalize(product.name)}`;
  const group = groups.get(key) ?? [];
  group.push(product);
  groups.set(key, group);
}

const duplicateGroups = [...groups.values()]
  .filter((group) => group.length > 1)
  .map((group) => {
    const ranked = [...group].sort((left, right) => completenessScore(right) - completenessScore(left));
    return { keep: ranked[0], remove: ranked.slice(1) };
  });

const removedProducts = duplicateGroups.flatMap((group) => group.remove);
const removedIds = removedProducts.map((product) => product.id).filter(Boolean);
const replacementById = new Map(duplicateGroups.flatMap(({ keep, remove }) =>
  remove.map((product) => [product.id, keep.id])));
const runId = `product-dedupe-${new Date().toISOString()}-${randomUUID().slice(0, 8)}`;

const referenceChecks = {};
for (const collectionName of ["carts", "orders", "outfits", "user_favorites", "product_feedback", "shop_events"]) {
  const exists = await db.listCollections({ name: collectionName }).hasNext();
  if (!exists || removedIds.length === 0) {
    referenceChecks[collectionName] = 0;
    continue;
  }

  referenceChecks[collectionName] = await db.collection(collectionName).countDocuments({
    $or: [
      { productId: { $in: removedIds } },
      { productIds: { $in: removedIds } },
      { "items.productId": { $in: removedIds } },
      { favoriteProductIds: { $in: removedIds } },
    ],
  });
}

const report = {
  mode: apply ? "apply" : "dry-run",
  runId,
  totalBefore: products.length,
  duplicateGroups: duplicateGroups.length,
  removeCount: removedProducts.length,
  totalAfter: products.length - removedProducts.length,
  referenceChecks,
  groups: duplicateGroups.map(({ keep, remove }) => ({
    name: keep.name,
    shopId: keep.shopId,
    keep: { id: keep.id, price: keep.price, status: keep.status, imageUrl: keep.imageUrl },
    remove: remove.map((product) => ({ id: product.id, price: product.price, status: product.status, imageUrl: product.imageUrl })),
  })),
};

if (apply && removedProducts.length > 0) {
  const protectedReferenceCount = Object.entries(referenceChecks)
    .filter(([collectionName]) => collectionName !== "shop_events")
    .reduce((sum, [, count]) => sum + count, 0);
  if (protectedReferenceCount > 0) {
    throw new Error("Duplicate products are still referenced by commerce data. Cleanup was not applied; inspect referenceChecks first.");
  }

  await db.collection("product_cleanup_backups").insertMany(removedProducts.map((product) => ({
    runId,
    backedUpAt: new Date(),
    reason: "duplicate-normalized-name-within-shop",
    replacementProductId: replacementById.get(product.id),
    originalProduct: product,
  })));

  let remappedShopEvents = 0;
  for (const [removedId, replacementId] of replacementById) {
    const eventUpdate = await db.collection("shop_events").updateMany(
      { productId: removedId },
      { $set: { productId: replacementId, productDedupeRunId: runId } },
    );
    remappedShopEvents += eventUpdate.modifiedCount;
  }

  const deletion = await db.collection("products").deleteMany({ id: { $in: removedIds } });
  report.deletedCount = deletion.deletedCount;
  report.remappedShopEvents = remappedShopEvents;
  report.backupCollection = "product_cleanup_backups";
}

console.log(JSON.stringify(report, null, 2));
await closeMongoConnection();
