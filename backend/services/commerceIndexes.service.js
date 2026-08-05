import { getMongoDb } from "./mongo.service.js";

export const ensureCommerceIndexes = async () => {
  const db = await getMongoDb();
  await Promise.all([
    db.collection("user_addresses").createIndex({ id: 1 }, { unique: true }),
    db.collection("user_addresses").createIndex({ userId: 1, isDefault: 1 }),
    db.collection("user_addresses").createIndex({ userId: 1 }, { unique: true, partialFilterExpression: { isDefault: true } }),
    db.collection("carts").createIndex({ userId: 1 }, { unique: true }),
    db.collection("orders").createIndex({ id: 1 }, { unique: true }),
    db.collection("orders").createIndex({ orderCode: 1 }, { unique: true }),
    db.collection("orders").createIndex({ userId: 1, checkoutIdempotencyKey: 1 }),
    db.collection("checkout_batches").createIndex({ userId: 1, idempotencyKey: 1 }, { unique: true }),
    db.collection("orders").createIndex({ shopId: 1, createdAt: -1 }),
    db.collection("orders").createIndex({ expiresAt: 1, orderStatus: 1 }),
    db.collection("notifications").createIndex({ audienceType: 1, audienceId: 1, createdAt: -1 }),
    db.collection("order_disputes").createIndex({ id: 1 }, { unique: true }),
    db.collection("order_disputes").createIndex(
      { orderId: 1, type: 1 },
      { unique: true, partialFilterExpression: { status: { $in: ["open", "shop_responded", "under_review"] } } }
    ),
    db.collection("products").createIndex(
      { shopId: 1, "variants.sku": 1 },
      { unique: true, partialFilterExpression: { "variants.0": { $exists: true } } }
    ),
  ]);
};
