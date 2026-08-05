import crypto from "node:crypto";
import { getMongoDb } from "./mongo.service.js";
import { createNotification } from "./notification.service.js";

const clean = (value) => String(value || "").trim();
const fail = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
const ACTIVE = ["open", "shop_responded", "under_review"];

const publicDispute = (item) => ({ ...item, _id: undefined });

export const createRefundDispute = async ({ userId, orderId, message, attachments = [] }) => {
  const db = await getMongoDb();
  const order = await db.collection("orders").findOne({ id: orderId, userId });
  if (!order) fail("Order was not found.", 404);
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const eligible = order.paymentStatus === "refunded" || (
    order.paymentStatus === "refund_pending" && new Date(order.refundPendingAt || order.updatedAt) <= seventyTwoHoursAgo
  );
  if (!eligible) fail("This order is not eligible for a refund dispute yet.", 409);
  if (await db.collection("order_disputes").findOne({ orderId, type: "refund_not_received", status: { $in: ACTIVE } })) {
    fail("An active refund dispute already exists for this order.", 409);
  }
  const now = new Date();
  const dispute = {
    id: crypto.randomUUID(), orderId, orderCode: order.orderCode, userId, shopId: order.shopId,
    type: "refund_not_received", status: "open",
    messages: [{ id: crypto.randomUUID(), actorType: "customer", actorId: userId, message: clean(message), attachments, createdAt: now }],
    attachments, resolution: null, createdAt: now, updatedAt: now,
  };
  await db.collection("order_disputes").insertOne(dispute);
  const shop = await db.collection("shops").findOne({ id: order.shopId });
  await Promise.all([
    createNotification({ audienceType: "shop", audienceId: shop?.ownerId, type: "dispute_created", title: "Khiếu nại hoàn tiền", message: `${order.orderCode} có khiếu nại mới.`, orderId, disputeId: dispute.id }),
    createNotification({ audienceType: "admin", audienceId: null, type: "dispute_created", title: "Khiếu nại mới", message: `${order.orderCode} cần theo dõi.`, orderId, disputeId: dispute.id }),
  ]);
  return publicDispute(dispute);
};

export const listCustomerDisputes = async (userId) => {
  const db = await getMongoDb(); return db.collection("order_disputes").find({ userId }).sort({ updatedAt: -1 }).toArray();
};
export const listOwnerDisputes = async (ownerId) => {
  const db = await getMongoDb();
  const shop = await db.collection("shops").findOne({ ownerId });
  return shop ? db.collection("order_disputes").find({ shopId: shop.id }).sort({ updatedAt: -1 }).toArray() : [];
};
export const listAdminDisputes = async (query = {}) => {
  const db = await getMongoDb();
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.orderCode = String(query.search).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const disputes = await db.collection("order_disputes").find(filter).sort({ updatedAt: -1 }).toArray();
  const orders = disputes.length ? await db.collection("orders").find({ id: { $in: disputes.map((item) => item.orderId) } }).toArray() : [];
  const orderById = new Map(orders.map((item) => [item.id, item]));
  return disputes.map((item) => ({ ...item, orderSnapshot: orderById.get(item.orderId) || null }));
};

const getScopedDispute = async ({ db, disputeId, actorType, actorId }) => {
  const dispute = await db.collection("order_disputes").findOne({ id: disputeId });
  if (!dispute) fail("Dispute was not found.", 404);
  if (actorType === "customer" && dispute.userId !== actorId) fail("Dispute was not found.", 404);
  if (actorType === "shop") {
    const shop = await db.collection("shops").findOne({ ownerId: actorId });
    if (!shop || dispute.shopId !== shop.id) fail("Dispute was not found.", 404);
  }
  return dispute;
};

export const getDispute = async (scope) => getScopedDispute({ db: await getMongoDb(), ...scope });

export const replyDispute = async ({ disputeId, actorType, actorId, message, attachments = [] }) => {
  if (!clean(message) && !attachments.length) fail("A message or attachment is required.");
  if (attachments.length > 3) fail("A maximum of three attachments is allowed.");
  const db = await getMongoDb();
  const dispute = await getScopedDispute({ db, disputeId, actorType, actorId });
  if (["resolved", "closed"].includes(dispute.status)) fail("Dispute is closed.", 409);
  const now = new Date();
  const entry = { id: crypto.randomUUID(), actorType, actorId, message: clean(message), attachments, createdAt: now };
  const status = actorType === "shop" ? "shop_responded" : dispute.status;
  await db.collection("order_disputes").updateOne({ id: dispute.id }, { $push: { messages: entry }, $set: { status, updatedAt: now } });
  const target = actorType === "customer" ? { audienceType: "shop", audienceId: (await db.collection("shops").findOne({ id: dispute.shopId }))?.ownerId } : { audienceType: "customer", audienceId: dispute.userId };
  await createNotification({ ...target, type: "dispute_reply", title: "Phản hồi khiếu nại", message: `${dispute.orderCode} có phản hồi mới.`, orderId: dispute.orderId, disputeId: dispute.id });
  return { ...dispute, status, messages: [...dispute.messages, entry], updatedAt: now };
};

export const adminUpdateDispute = async ({ adminId, disputeId, status, resolution, message, attachments = [] }) => {
  if (!["under_review", "resolved", "closed"].includes(status)) fail("Invalid dispute status.");
  const db = await getMongoDb();
  const dispute = await getScopedDispute({ db, disputeId, actorType: "admin", actorId: adminId });
  const now = new Date();
  const patch = { status, updatedAt: now };
  if (resolution !== undefined) patch.resolution = { text: clean(resolution), adminId, createdAt: now };
  const update = { $set: patch };
  if (clean(message) || attachments.length) update.$push = { messages: { id: crypto.randomUUID(), actorType: "admin", actorId: adminId, message: clean(message), attachments, createdAt: now } };
  await db.collection("order_disputes").updateOne({ id: dispute.id }, update);
  await createNotification({ audienceType: "customer", audienceId: dispute.userId, type: "dispute_status", title: "Cập nhật khiếu nại", message: `${dispute.orderCode}: ${status}`, orderId: dispute.orderId, disputeId: dispute.id });
  const shop = await db.collection("shops").findOne({ id: dispute.shopId });
  await createNotification({ audienceType: "shop", audienceId: shop?.ownerId, type: "dispute_status", title: "Admin cập nhật khiếu nại", message: `${dispute.orderCode}: ${status}`, orderId: dispute.orderId, disputeId: dispute.id });
  return db.collection("order_disputes").findOne({ id: dispute.id });
};
