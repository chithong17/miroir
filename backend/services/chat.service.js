import crypto from "node:crypto";
import { getMongoDb, withMongoTransaction } from "./mongo.service.js";
import { deleteImageByPublicId, uploadImageBuffer } from "./cloudinary.service.js";
import { emitChatEvent, shopRoom, userRoom } from "./chatRealtime.service.js";

const clean = (value) => String(value || "").trim();
const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const encodeCursor = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decodeCursor = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(String(value), "base64url").toString("utf8"));
  } catch {
    fail("Invalid pagination cursor.");
  }
};

const limits = (value, fallback, max) =>
  Math.min(Math.max(Number.parseInt(value || fallback, 10) || fallback, 1), max);

const actorFilter = (actor) =>
  actor.type === "user" ? { userId: actor.id } : { shopId: actor.shopId };

const counterpart = (conversation, actor) =>
  actor.type === "user" ? conversation.shopSnapshot : conversation.userSnapshot;

export const toConversationDto = (conversation, actor) => ({
  id: conversation.id,
  userId: conversation.userId,
  shopId: conversation.shopId,
  counterpart: counterpart(conversation, actor),
  lastMessage: conversation.lastMessage || null,
  lastMessageAt: conversation.lastMessageAt || null,
  unreadCount: actor.type === "user"
    ? Number(conversation.userUnreadCount || 0)
    : Number(conversation.shopUnreadCount || 0),
  userLastReadAt: conversation.userLastReadAt || null,
  shopLastReadAt: conversation.shopLastReadAt || null,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
});

const messagePreview = ({ text, images, context }) => {
  if (text) return text.slice(0, 160);
  if (images?.length) return images.length > 1 ? `${images.length} images` : "Image";
  if (context?.type === "product") return `Product: ${context.name}`;
  if (context?.type === "order") return `Order: ${context.orderCode}`;
  return "Message";
};

export const validateChatMessageInput = ({ text, fileCount = 0, hasContext = false, clientMessageId }) => {
  const normalizedText = clean(text);
  const normalizedClientMessageId = clean(clientMessageId);
  if (normalizedText.length > 2000) fail("Message text must not exceed 2000 characters.");
  if (!normalizedClientMessageId || normalizedClientMessageId.length > 100) fail("clientMessageId is required.");
  if (fileCount > 3) fail("A message can contain at most 3 images.");
  if (!normalizedText && !fileCount && !hasContext) fail("Message text, image, or context is required.");
  return { text: normalizedText, clientMessageId: normalizedClientMessageId };
};

const getActorConversation = async ({ db, actor, conversationId, session }) => {
  const conversation = await db.collection("chat_conversations").findOne(
    { id: conversationId, ...actorFilter(actor) },
    { session }
  );
  if (!conversation) fail("Conversation was not found.", 404);
  return conversation;
};

const resolveShopForUser = async ({ db, userId, shopId, orderId }) => {
  if (Boolean(shopId) === Boolean(orderId)) fail("Provide exactly one of shopId or orderId.");
  if (orderId) {
    const order = await db.collection("orders").findOne({ id: clean(orderId), userId });
    if (!order) fail("Order was not found.", 404);
    const shop = await db.collection("shops").findOne({ id: order.shopId });
    if (!shop) fail("Shop was not found.", 404);
    return shop;
  }
  const shop = await db.collection("shops").findOne({ id: clean(shopId), status: "active" });
  if (!shop) fail("Active shop was not found.", 404);
  return shop;
};

const resolveShopForOwner = async ({ db, ownerId, orderId }) => {
  if (!clean(orderId)) fail("orderId is required.");
  const shop = await db.collection("shops").findOne({ ownerId });
  if (!shop) fail("Shop was not found.", 404);
  const order = await db.collection("orders").findOne({ id: clean(orderId), shopId: shop.id });
  if (!order) fail("Order was not found.", 404);
  return { shop, userId: order.userId };
};

export const openConversation = async ({ actor, body = {} }) => {
  const db = await getMongoDb();
  let shop;
  let userId;
  if (actor.type === "user") {
    userId = actor.id;
    shop = await resolveShopForUser({ db, userId, shopId: body.shopId, orderId: body.orderId });
  } else {
    const resolved = await resolveShopForOwner({ db, ownerId: actor.id, orderId: body.orderId });
    shop = resolved.shop;
    userId = resolved.userId;
  }
  const user = await db.collection("users").findOne({ id: userId, status: "active" });
  if (!user) fail("Customer account was not found.", 404);
  const now = new Date();
  const seed = {
    id: crypto.randomUUID(),
    userId,
    shopId: shop.id,
    userSnapshot: { id: user.id, name: user.name || "Customer" },
    shopSnapshot: { id: shop.id, name: shop.name, logoUrl: shop.logoUrl || "", slug: shop.slug || "" },
    lastMessage: null,
    lastMessageAt: null,
    userUnreadCount: 0,
    shopUnreadCount: 0,
    userLastReadAt: null,
    shopLastReadAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("chat_conversations").updateOne(
    { userId, shopId: shop.id },
    { $setOnInsert: seed },
    { upsert: true }
  );
  const conversation = await db.collection("chat_conversations").findOne({ userId, shopId: shop.id });
  return toConversationDto(conversation, actor);
};

export const listConversations = async ({ actor, query = {} }) => {
  const db = await getMongoDb();
  const limit = limits(query.limit, 20, 50);
  const cursor = decodeCursor(query.cursor);
  const filter = { ...actorFilter(actor), lastMessageAt: { $ne: null } };
  if (cursor?.lastMessageAt && cursor?.id) {
    const date = new Date(cursor.lastMessageAt);
    filter.$or = [
      { lastMessageAt: { $lt: date } },
      { lastMessageAt: date, id: { $lt: cursor.id } },
    ];
  }
  const rows = await db.collection("chat_conversations")
    .find(filter).sort({ lastMessageAt: -1, id: -1 }).limit(limit + 1).toArray();
  const hasMore = rows.length > limit;
  const conversations = rows.slice(0, limit);
  const unreadField = actor.type === "user" ? "userUnreadCount" : "shopUnreadCount";
  const unread = await db.collection("chat_conversations").aggregate([
    { $match: actorFilter(actor) },
    { $group: { _id: null, total: { $sum: `$${unreadField}` } } },
  ]).toArray();
  const last = conversations.at(-1);
  return {
    conversations: conversations.map((item) => toConversationDto(item, actor)),
    totalUnread: Number(unread[0]?.total || 0),
    nextCursor: hasMore && last ? encodeCursor({ lastMessageAt: last.lastMessageAt, id: last.id }) : null,
  };
};

export const listMessages = async ({ actor, conversationId, query = {} }) => {
  const db = await getMongoDb();
  await getActorConversation({ db, actor, conversationId });
  const limit = limits(query.limit, 30, 100);
  const before = decodeCursor(query.before);
  const filter = { conversationId };
  if (before?.createdAt && before?.id) {
    const date = new Date(before.createdAt);
    filter.$or = [
      { createdAt: { $lt: date } },
      { createdAt: date, id: { $lt: before.id } },
    ];
  }
  const rows = await db.collection("chat_messages")
    .find(filter).sort({ createdAt: -1, id: -1 }).limit(limit + 1).toArray();
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const oldest = page.at(-1);
  return {
    messages: page.reverse(),
    nextCursor: hasMore && oldest ? encodeCursor({ createdAt: oldest.createdAt, id: oldest.id }) : null,
  };
};

const buildContext = async ({ db, conversation, contextType, contextId, actor }) => {
  if (!contextType && !contextId) return null;
  if (!contextType || !clean(contextId)) fail("contextType and contextId must be provided together.");
  if (contextType === "product") {
    const filter = { id: clean(contextId), shopId: conversation.shopId };
    if (actor.type === "user") filter.status = "published";
    const product = await db.collection("products").findOne(filter);
    if (!product) fail("Product context is not available.", 404);
    return {
      type: "product", productId: product.id, name: product.name,
      imageUrl: product.imageUrl || "", price: Number(product.price || 0),
      shopId: product.shopId,
    };
  }
  if (contextType === "order") {
    const order = await db.collection("orders").findOne({
      id: clean(contextId), userId: conversation.userId, shopId: conversation.shopId,
    });
    if (!order) fail("Order context is not available.", 404);
    return {
      type: "order", orderId: order.id, orderCode: order.orderCode,
      orderStatus: order.orderStatus, total: Number(order.total || 0),
      imageUrl: order.items?.[0]?.imageUrl || "", itemCount: order.items?.length || 0,
      shopId: order.shopId,
    };
  }
  fail("contextType must be product or order.");
};

const uploadImages = async (files = []) => {
  const uploaded = [];
  try {
    for (const file of files) {
      const result = await uploadImageBuffer(file.buffer, file.originalname || "chat-image");
      uploaded.push({
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: file.mimetype,
        width: result.width || null,
        height: result.height || null,
        bytes: result.bytes || file.size || null,
      });
    }
    return uploaded;
  } catch (error) {
    await Promise.allSettled(uploaded.map((image) => deleteImageByPublicId(image.publicId)));
    throw error;
  }
};

const unreadTotal = async ({ db, actor }) => {
  const field = actor.type === "user" ? "userUnreadCount" : "shopUnreadCount";
  const result = await db.collection("chat_conversations").aggregate([
    { $match: actorFilter(actor) },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]).toArray();
  return Number(result[0]?.total || 0);
};

const emitConversationState = async ({ db, conversation, message = null, read = null }) => {
  const userActor = { type: "user", id: conversation.userId };
  const shopActor = { type: "shop", shopId: conversation.shopId };
  const userPayload = toConversationDto(conversation, userActor);
  const shopPayload = toConversationDto(conversation, shopActor);
  for (const [room, payload, actor] of [
    [userRoom(conversation.userId), userPayload, userActor],
    [shopRoom(conversation.shopId), shopPayload, shopActor],
  ]) {
    if (message) emitChatEvent({ room, event: "chat:message.created", payload: { conversationId: conversation.id, message } });
    emitChatEvent({ room, event: "chat:conversation.updated", payload: { conversation: payload } });
    if (read) emitChatEvent({ room, event: "chat:read", payload: read });
    emitChatEvent({ room, event: "chat:unread.updated", payload: { totalUnread: await unreadTotal({ db, actor }) } });
  }
};

export const sendMessage = async ({ actor, conversationId, body = {}, files = [] }) => {
  const hasRequestedContext = Boolean(clean(body.contextType) || clean(body.contextId));
  const { text, clientMessageId } = validateChatMessageInput({
    text: body.text, fileCount: files.length, hasContext: hasRequestedContext, clientMessageId: body.clientMessageId,
  });
  const db = await getMongoDb();
  const conversation = await getActorConversation({ db, actor, conversationId });
  const duplicate = await db.collection("chat_messages").findOne({ conversationId, senderType: actor.type, clientMessageId });
  if (duplicate) return { message: duplicate, conversation: toConversationDto(conversation, actor), duplicate: true };
  const context = await buildContext({
    db, conversation, contextType: clean(body.contextType), contextId: clean(body.contextId), actor,
  });
  if (hasRequestedContext && !context) fail("Message context is not available.");
  const images = await uploadImages(files);
  const now = new Date();
  const message = {
    id: crypto.randomUUID(), conversationId, senderType: actor.type, senderId: actor.id,
    text, images, context, clientMessageId, createdAt: now,
  };
  let savedConversation;
  try {
    const transactionResult = await withMongoTransaction(async (transactionDb, session) => {
      await getActorConversation({ db: transactionDb, actor, conversationId, session });
      const existing = await transactionDb.collection("chat_messages").findOne(
        { conversationId, senderType: actor.type, clientMessageId }, { session }
      );
      if (existing) return {
        conversation: await transactionDb.collection("chat_conversations").findOne({ id: conversationId }, { session }),
        duplicateMessage: existing,
      };
      await transactionDb.collection("chat_messages").insertOne(message, { session });
      const unreadField = actor.type === "user" ? "shopUnreadCount" : "userUnreadCount";
      await transactionDb.collection("chat_conversations").updateOne(
        { id: conversationId },
        {
          $set: {
            lastMessage: { id: message.id, senderType: actor.type, preview: messagePreview({ text, images, context }), createdAt: now },
            lastMessageAt: now, updatedAt: now,
          },
          $inc: { [unreadField]: 1 },
        },
        { session }
      );
      return {
        conversation: await transactionDb.collection("chat_conversations").findOne({ id: conversationId }, { session }),
        duplicateMessage: null,
      };
    });
    savedConversation = transactionResult.conversation;
    if (transactionResult.duplicateMessage) {
      await Promise.allSettled(images.map((image) => deleteImageByPublicId(image.publicId)));
      return { message: transactionResult.duplicateMessage, conversation: toConversationDto(savedConversation, actor), duplicate: true };
    }
  } catch (error) {
    await Promise.allSettled(images.map((image) => deleteImageByPublicId(image.publicId)));
    if (error.code !== 11000) throw error;
    const existing = await db.collection("chat_messages").findOne({ conversationId, senderType: actor.type, clientMessageId });
    if (!existing) throw error;
    return { message: existing, conversation: toConversationDto(conversation, actor), duplicate: true };
  }
  await emitConversationState({ db, conversation: savedConversation, message });
  return { message, conversation: toConversationDto(savedConversation, actor), duplicate: false };
};

export const markConversationRead = async ({ actor, conversationId }) => {
  const db = await getMongoDb();
  const now = new Date();
  const conversation = await withMongoTransaction(async (transactionDb, session) => {
    await getActorConversation({ db: transactionDb, actor, conversationId, session });
    const unreadField = actor.type === "user" ? "userUnreadCount" : "shopUnreadCount";
    const readField = actor.type === "user" ? "userLastReadAt" : "shopLastReadAt";
    await transactionDb.collection("chat_conversations").updateOne(
      { id: conversationId },
      { $set: { [unreadField]: 0, [readField]: now, updatedAt: now } },
      { session }
    );
    return transactionDb.collection("chat_conversations").findOne({ id: conversationId }, { session });
  });
  const read = { conversationId, readerType: actor.type, readThroughAt: now };
  await emitConversationState({ db, conversation, read });
  return toConversationDto(conversation, actor);
};
