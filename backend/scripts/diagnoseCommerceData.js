import dotenv from "dotenv";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";

dotenv.config();
const db = await getMongoDb();
const now = new Date();
const [
  totalProducts,
  publishedProducts,
  productsWithVariants,
  publishedWithSellableStock,
  activeShops,
  activeSubscribedOwners,
] = await Promise.all([
  db.collection("products").countDocuments({}),
  db.collection("products").countDocuments({ status: "published" }),
  db.collection("products").countDocuments({ "variants.0": { $exists: true } }),
  db.collection("products").countDocuments({
    status: "published",
    variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } },
  }),
  db.collection("shops").countDocuments({ status: "active" }),
  db.collection("shop_owners").countDocuments({
    status: "active",
    "subscription.status": "active",
    "subscription.expiresAt": { $gt: now },
  }),
]);
const byShop = await db.collection("products").aggregate([
  { $group: {
    _id: "$shopId",
    products: { $sum: 1 },
    published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
    stock: { $sum: { $sum: { $map: { input: { $ifNull: ["$variants", []] }, as: "variant", in: { $cond: ["$$variant.active", { $ifNull: ["$$variant.stockQuantity", 0] }, 0] } } } } },
  } },
  { $lookup: { from: "shops", localField: "_id", foreignField: "id", as: "shop" } },
  { $project: { _id: 0, shopId: "$_id", shopName: { $first: "$shop.name" }, products: 1, published: 1, stock: 1 } },
]).toArray();

console.log(JSON.stringify({
  database: process.env.MONGODB_DB_NAME,
  totalProducts,
  publishedProducts,
  productsWithVariants,
  publishedWithSellableStock,
  activeShops,
  activeSubscribedOwners,
  byShop,
}, null, 2));
await closeMongoConnection();
