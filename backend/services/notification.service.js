import crypto from "node:crypto";
import { getMongoDb } from "./mongo.service.js";

export const createNotification = async ({ audienceType, audienceId, type, title, message, orderId, disputeId, db: suppliedDb, session }) => {
  const db = suppliedDb || await getMongoDb();
  const now = new Date();
  const notification = {
    id: crypto.randomUUID(), audienceType, audienceId, type, title, message,
    orderId: orderId || null, disputeId: disputeId || null,
    readAt: null, createdAt: now,
  };
  await db.collection("notifications").insertOne(notification, { session });
  return notification;
};

export const listNotifications = async ({ audienceType, audienceId, limit = 50 }) => {
  const db = await getMongoDb();
  const filter = { audienceType, ...(audienceId ? { audienceId } : {}) };
  const [notifications, unreadCount] = await Promise.all([
    db.collection("notifications").find(filter).sort({ createdAt: -1 }).limit(Math.min(Number(limit) || 50, 100)).toArray(),
    db.collection("notifications").countDocuments({ ...filter, readAt: null }),
  ]);
  return { notifications, unreadCount };
};

export const markNotificationRead = async ({ audienceType, audienceId, notificationId }) => {
  const db = await getMongoDb();
  const filter = { id: notificationId, audienceType, ...(audienceId ? { audienceId } : {}) };
  const result = await db.collection("notifications").findOneAndUpdate(
    filter, { $set: { readAt: new Date() } }, { returnDocument: "after" }
  );
  if (!result) { const error = new Error("Notification was not found."); error.statusCode = 404; throw error; }
  return result;
};
