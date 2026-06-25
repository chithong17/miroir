import { getMongoDb } from "./mongo.service.js";

export const getReviewSummariesByProductIds = async (productIds) => {
  if (!productIds.length) {
    return [];
  }

  const db = await getMongoDb();
  return db
    .collection("product_review_summaries")
    .find({ productId: { $in: productIds } })
    .project({
      _id: 0,
      productId: 1,
      summary: 1,
      fitSignals: 1,
      commonFeedback: 1,
      updatedAt: 1,
    })
    .toArray();
};
