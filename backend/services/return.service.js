import crypto from "node:crypto";
import { getMongoDb, withMongoTransaction } from "./mongo.service.js";
import { createNotification } from "./notification.service.js";

export const RETURN_STATUSES = ["requested", "approved", "rejected", "return_shipped", "received", "refund_pending", "refunded", "disputed"];
const clean = (value) => String(value || "").trim();
const fail = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
const event = (status, actorType, actorId, note = "") => ({ status, actorType, actorId, note, createdAt: new Date() });

export const getReturnDeliveryDate = (order) => order.deliveredAt || order.statusHistory?.find((entry) => entry.status === "delivered")?.createdAt || null;
export const isReturnWindowOpen = (order, now = Date.now()) => {
  const deliveredAt = getReturnDeliveryDate(order);
  return Boolean(deliveredAt && now - new Date(deliveredAt).getTime() <= 7 * 24 * 60 * 60 * 1000);
};
const scopedReturn = async (db, returnId, scope, actorId) => {
  const item = await db.collection("order_returns").findOne({ id: returnId });
  if (!item) fail("Return request was not found.", 404);
  if (scope === "customer" && item.userId !== actorId) fail("Return request was not found.", 404);
  if (scope === "shop") {
    const shop = await db.collection("shops").findOne({ ownerId: actorId });
    if (!shop || item.shopId !== shop.id) fail("Return request was not found.", 404);
  }
  return item;
};

const validatedItems = async ({ db, order, requested, session }) => {
  if (!Array.isArray(requested) || !requested.length) fail("Select at least one product to return.");
  const requestedByVariant = new Map();
  for (const value of requested) {
    const variantId = clean(value?.variantId);
    const quantity = Number(value?.quantity);
    if (!variantId || !Number.isInteger(quantity) || quantity < 1) fail("Each return item needs a product variant and positive quantity.");
    if (requestedByVariant.has(variantId)) fail("Duplicate return product variant.");
    requestedByVariant.set(variantId, quantity);
  }
  const existing = await db.collection("order_returns").find({ orderId: order.id, status: { $in: ["requested", "approved", "return_shipped", "received", "refund_pending", "refunded", "disputed"] } }, { session }).toArray();
  const reserved = new Map();
  existing.forEach((request) => request.items.forEach((item) => reserved.set(item.variantId, (reserved.get(item.variantId) || 0) + item.quantity)));
  return [...requestedByVariant].map(([variantId, quantity]) => {
    const source = order.items.find((item) => item.variantId === variantId);
    if (!source || quantity + (reserved.get(variantId) || 0) > source.quantity) fail("Return quantity exceeds the remaining quantity of an order item.", 409);
    return { variantId, productId: source.productId, name: source.name, imageUrl: source.imageUrl || "", sku: source.sku, color: source.color || "", size: source.size || "", quantity, unitPrice: source.unitPrice, lineTotal: Number(source.unitPrice) * quantity };
  });
};

export const createReturnRequest = async ({ userId, orderId, items, reason, refundAccount, attachments = [] }) => withMongoTransaction(async (db, session) => {
  const order = await db.collection("orders").findOne({ id: orderId, userId }, { session });
  if (!order) fail("Order was not found.", 404);
  const deliveredAt = getReturnDeliveryDate(order);
  if (order.orderStatus !== "delivered" || order.paymentStatus !== "paid" || !deliveredAt) fail("Only delivered and paid orders can be returned.", 409);
  if (!isReturnWindowOpen(order)) fail("The 7-day return window has expired.", 409);
  if (!clean(reason)) fail("Return reason is required.");
  if (attachments.length > 3) fail("A maximum of three return images is allowed.");
  const account = { bankName: clean(refundAccount?.bankName), accountNumber: clean(refundAccount?.accountNumber), accountHolder: clean(refundAccount?.accountHolder) };
  if (!account.bankName || !account.accountNumber || !account.accountHolder) fail("Refund bank name, account number and account holder are required.");
  const returnItems = await validatedItems({ db, order, requested: items, session });
  const now = new Date();
  const request = { id: crypto.randomUUID(), orderId: order.id, orderCode: order.orderCode, userId, shopId: order.shopId, orderSnapshot: { paymentStatus: order.paymentStatus, deliveredAt, shopName: order.shopSnapshot?.name || "" }, items: returnItems, reason: clean(reason), attachments, refundAccount: account, refundAmount: returnItems.reduce((sum, item) => sum + item.lineTotal, 0), status: "requested", returnInstructions: null, shipment: null, receipt: null, refund: null, disputeId: null, inventoryRestockedAt: null, history: [event("requested", "customer", userId, clean(reason))], createdAt: now, updatedAt: now };
  await db.collection("order_returns").insertOne(request, { session });
  const shop = await db.collection("shops").findOne({ id: order.shopId }, { session });
  await createNotification({ audienceType: "shop", audienceId: shop?.ownerId, type: "return_requested", title: "Yêu cầu trả hàng mới", message: `${order.orderCode} có yêu cầu trả hàng mới.`, orderId: order.id, db, session });
  return request;
});

export const listCustomerReturns = async (userId) => (await getMongoDb()).collection("order_returns").find({ userId }).sort({ updatedAt: -1 }).toArray();
export const getCustomerReturn = async ({ userId, returnId }) => scopedReturn(await getMongoDb(), returnId, "customer", userId);
export const listShopReturns = async ({ ownerId, query = {} }) => { const db = await getMongoDb(); const shop = await db.collection("shops").findOne({ ownerId }); return shop ? db.collection("order_returns").find({ shopId: shop.id, ...(query.status ? { status: query.status } : {}) }).sort({ updatedAt: -1 }).toArray() : []; };
export const getShopReturn = async ({ ownerId, returnId }) => scopedReturn(await getMongoDb(), returnId, "shop", ownerId);

export const decideReturn = async ({ ownerId, returnId, approved, reason, instructions }) => {
  const db = await getMongoDb(); const request = await scopedReturn(db, returnId, "shop", ownerId);
  if (request.status !== "requested") fail("Return request cannot be decided from its current state.", 409);
  if (!clean(reason)) fail("A decision reason is required.");
  if (approved && !clean(instructions)) fail("Return instructions are required when approving.");
  const status = approved ? "approved" : "rejected"; const now = new Date();
  const patch = { status, decision: { approved, reason: clean(reason), decidedBy: ownerId, decidedAt: now }, updatedAt: now, ...(approved ? { returnInstructions: clean(instructions) } : {}) };
  await db.collection("order_returns").updateOne({ id: request.id, status: "requested" }, { $set: patch, $push: { history: event(status, "shop", ownerId, clean(reason)) } });
  await createNotification({ audienceType: "customer", audienceId: request.userId, type: "return_decided", title: approved ? "Yêu cầu trả hàng được duyệt" : "Yêu cầu trả hàng bị từ chối", message: `${request.orderCode}: ${clean(reason)}`, orderId: request.orderId });
  return { ...request, ...patch };
};

export const submitReturnShipment = async ({ userId, returnId, trackingCode, attachments = [] }) => {
  const db = await getMongoDb(); const request = await scopedReturn(db, returnId, "customer", userId);
  if (request.status !== "approved") fail("Return shipment is not expected yet.", 409);
  if (!clean(trackingCode) || !attachments.length) fail("Tracking code and at least one shipping receipt image are required.");
  const now = new Date(); const shipment = { trackingCode: clean(trackingCode), attachments, submittedAt: now };
  await db.collection("order_returns").updateOne({ id: request.id, status: "approved" }, { $set: { status: "return_shipped", shipment, updatedAt: now }, $push: { history: event("return_shipped", "customer", userId, trackingCode) } });
  const shop = await db.collection("shops").findOne({ id: request.shopId });
  await createNotification({ audienceType: "shop", audienceId: shop?.ownerId, type: "return_shipped", title: "Khách đã gửi hàng trả", message: `${request.orderCode} có biên lai gửi trả mới.`, orderId: request.orderId });
  return { ...request, status: "return_shipped", shipment, updatedAt: now };
};

export const receiveReturn = async ({ ownerId, returnId }) => withMongoTransaction(async (db, session) => {
  let request = await scopedReturn(db, returnId, "shop", ownerId);
  if (request.status !== "return_shipped") fail("Return shipment has not been submitted.", 409);
  const now = new Date();
  const claimed = await db.collection("order_returns").updateOne({ id: request.id, status: "return_shipped", inventoryRestockedAt: null }, { $set: { status: "received", inventoryRestockedAt: now, receipt: { receivedBy: ownerId, receivedAt: now }, updatedAt: now }, $push: { history: event("received", "shop", ownerId, "Return received") } }, { session });
  if (!claimed.modifiedCount) fail("Return state changed; reload and try again.", 409);
  for (const item of request.items) await db.collection("products").updateOne({ id: item.productId, "variants.id": item.variantId }, { $inc: { "variants.$.stockQuantity": item.quantity }, $set: { availability: "in_stock", updatedAt: now } }, { session });
  await db.collection("order_returns").updateOne({ id: request.id }, { $set: { status: "refund_pending", updatedAt: now }, $push: { history: event("refund_pending", "system", null, "Awaiting refund") } }, { session });
  await createNotification({ audienceType: "customer", audienceId: request.userId, type: "return_received", title: "Shop đã nhận hàng trả", message: `${request.orderCode} đang chờ hoàn tiền.`, orderId: request.orderId, db, session });
  return { ...request, status: "refund_pending", inventoryRestockedAt: now };
});

export const refundReturn = async ({ ownerId, returnId, note, proof }) => {
  const db = await getMongoDb(); const request = await scopedReturn(db, returnId, "shop", ownerId);
  if (request.status !== "refund_pending") fail("Return refund is not pending.", 409);
  if (!proof) fail("Refund proof is required.");
  const now = new Date(); const refund = { amount: request.refundAmount, note: clean(note), proof, refundedBy: ownerId, refundedAt: now };
  await db.collection("order_returns").updateOne({ id: request.id, status: "refund_pending" }, { $set: { status: "refunded", refund, updatedAt: now }, $push: { history: event("refunded", "shop", ownerId, clean(note)) } });
  await createNotification({ audienceType: "customer", audienceId: request.userId, type: "return_refunded", title: "Đã hoàn tiền", message: `${request.orderCode}: ${request.refundAmount.toLocaleString("vi-VN")}đ`, orderId: request.orderId });
  return { ...request, status: "refunded", refund, updatedAt: now };
};

export const escalateReturn = async ({ userId, returnId, message = "" }) => {
  const db = await getMongoDb(); const request = await scopedReturn(db, returnId, "customer", userId);
  const overdue = request.status === "requested" && Date.now() - new Date(request.createdAt).getTime() >= 72 * 60 * 60 * 1000;
  if (!(request.status === "rejected" || overdue)) fail("This return can only be escalated after rejection or 72 hours without a shop decision.", 409);
  const now = new Date(); const dispute = { id: crypto.randomUUID(), orderId: request.orderId, orderCode: request.orderCode, userId, shopId: request.shopId, returnId: request.id, type: "return_request", status: "under_review", messages: [{ id: crypto.randomUUID(), actorType: "customer", actorId: userId, message: clean(message) || "Customer escalated return request.", attachments: [], createdAt: now }], attachments: [], resolution: null, createdAt: now, updatedAt: now };
  await db.collection("order_disputes").insertOne(dispute);
  await db.collection("order_returns").updateOne({ id: request.id }, { $set: { status: "disputed", disputeId: dispute.id, updatedAt: now }, $push: { history: event("disputed", "customer", userId, clean(message)) } });
  await Promise.all([createNotification({ audienceType: "shop", audienceId: (await db.collection("shops").findOne({ id: request.shopId }))?.ownerId, type: "return_disputed", title: "Tranh chấp trả hàng", message: `${request.orderCode} đã được chuyển admin xử lý.`, orderId: request.orderId, disputeId: dispute.id }), createNotification({ audienceType: "admin", audienceId: null, type: "return_disputed", title: "Tranh chấp trả hàng", message: `${request.orderCode} cần xử lý.`, orderId: request.orderId, disputeId: dispute.id })]);
  return dispute;
};

export const adminDecideReturn = async ({ adminId, returnId, approved, reason, instructions }) => {
  const db = await getMongoDb(); const request = await db.collection("order_returns").findOne({ id: returnId });
  if (!request) fail("Return request was not found.", 404);
  if (request.status !== "disputed") fail("Return is not under dispute.", 409);
  if (!clean(reason) || (approved && !clean(instructions))) fail("Decision reason and return instructions are required when approving.");
  const now = new Date(); const status = approved ? "approved" : "rejected";
  await db.collection("order_returns").updateOne({ id: request.id }, { $set: { status, returnInstructions: approved ? clean(instructions) : request.returnInstructions, adminDecision: { approved, reason: clean(reason), adminId, decidedAt: now }, updatedAt: now }, $push: { history: event(status, "admin", adminId, clean(reason)) } });
  if (request.disputeId) await db.collection("order_disputes").updateOne({ id: request.disputeId }, { $set: { status: "resolved", resolution: { text: clean(reason), adminId, createdAt: now }, updatedAt: now } });
  await createNotification({ audienceType: "customer", audienceId: request.userId, type: "return_admin_decision", title: "Admin đã xử lý yêu cầu trả hàng", message: `${request.orderCode}: ${clean(reason)}`, orderId: request.orderId, disputeId: request.disputeId });
  return { ...request, status };
};
