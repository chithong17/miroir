import { getMongoDb } from "./mongo.service.js";

export const ensureCommerceIndexes = async () => {
  const db = await getMongoDb();
  // The former unique index prevented two independent return disputes on one order.
  await db.collection("order_disputes").dropIndex("orderId_1_type_1").catch(() => {});
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
    db.collection("chat_conversations").createIndex({ userId: 1, shopId: 1 }, { unique: true }),
    db.collection("chat_conversations").createIndex({ userId: 1, lastMessageAt: -1, id: -1 }),
    db.collection("chat_conversations").createIndex({ shopId: 1, lastMessageAt: -1, id: -1 }),
    db.collection("chat_messages").createIndex({ conversationId: 1, createdAt: -1, id: -1 }),
    db.collection("chat_messages").createIndex(
      { conversationId: 1, senderType: 1, clientMessageId: 1 },
      { unique: true }
    ),
    db.collection("order_disputes").createIndex({ id: 1 }, { unique: true }),
    db.collection("order_returns").createIndex({ id: 1 }, { unique: true }),
    db.collection("order_returns").createIndex({ userId: 1, updatedAt: -1 }),
    db.collection("order_returns").createIndex({ shopId: 1, updatedAt: -1 }),
    db.collection("order_returns").createIndex({ orderId: 1, status: 1 }),
    db.collection("fit_events").createIndex({ shopId: 1, createdAt: -1 }),
    db.collection("fit_feedback").createIndex({ shopId: 1, createdAt: -1 }),
    db.collection("order_disputes").createIndex({ orderId: 1, type: 1, status: 1 }),
    db.collection("products").createIndex(
      { shopId: 1, "variants.sku": 1 },
      { unique: true, partialFilterExpression: { "variants.0": { $exists: true } } }
    ),
  ]);
};
