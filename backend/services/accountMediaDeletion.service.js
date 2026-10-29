import { getMongoDb } from "./mongo.service.js";
import { deleteImageByPublicId } from "./cloudinary.service.js";

// Preserve assets still used by another account or a retained transaction/conversation.
export const hasRetainedMediaReference = async (db, { publicId, url }) => {
  const sources = [
    ["products", { $or: [{ imagePublicId: publicId }, ...(url ? [{ imageUrl: url }] : [])] }],
    ["users", { $or: [{ "profile.modelImagePublicId": publicId }, ...(url ? [{ "profile.modelImageUrl": url }] : [])] }],
    ["shops", { $or: [{ "paymentSettings.qrImagePublicId": publicId }, ...(url ? [{ logoUrl: url }, { coverUrl: url }, { "paymentSettings.qrImageUrl": url }] : [])] }],
    ["orders", { $or: [{ "paymentSnapshot.qrImagePublicId": publicId }, ...(url ? [{ "items.imageUrl": url }] : [])] }],
    ["chat_messages", { $or: [{ "images.publicId": publicId }, ...(url ? [{ "images.url": url }, { "context.imageUrl": url }] : [])] }],
    ["order_returns", { "attachments.publicId": publicId }],
  ];
  for (const [name, filter] of sources) if (await db.collection(name).findOne(filter, { projection: { _id: 1 } })) return true;
  return false;
};

export const processAccountMediaDeletionJobs = async ({ db, destroy = deleteImageByPublicId, retained = hasRetainedMediaReference, now = new Date() } = {}) => {
  db ||= await getMongoDb();
  const jobs = await db.collection("account_media_deletions").find({ $or: [{ status: "pending", nextAttemptAt: { $lte: now } }, { status: "processing", leaseUntil: { $lte: now } }] }).limit(25).toArray();
  for (const job of jobs) {
    const claimed = await db.collection("account_media_deletions").findOneAndUpdate({ id: job.id, status: job.status, ...(job.status === "processing" ? { leaseUntil: { $lte: now } } : {}) }, { $set: { status: "processing", leaseUntil: new Date(now.getTime() + 300000) }, $inc: { attempts: 1 } }, { returnDocument: "after" });
    if (!claimed) continue;
    try {
      if (await retained(db, job)) {
        // Revisit retained assets rather than abandoning deletion forever.
        await db.collection("account_media_deletions").updateOne({ id: job.id }, { $set: { status: "pending", nextAttemptAt: new Date(now.getTime() + 86400000), retainedReference: true } });
      } else {
        await destroy(job.publicId);
        await db.collection("account_media_deletions").deleteOne({ id: job.id });
      }
    } catch {
      await db.collection("account_media_deletions").updateOne({ id: job.id }, { $set: { status: "pending", nextAttemptAt: new Date(now.getTime() + 3600000), lastError: "Media cleanup unavailable; retry scheduled." } });
    }
  }
};
