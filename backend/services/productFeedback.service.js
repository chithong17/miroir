import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";
import { trackShopEvent } from "./shopAnalytics.service.js";

const cleanString = (value) => String(value || "").trim();

const normalizeContext = (context) =>
  ["tryon", "stylist", "product"].includes(context) ? context : "product";

const getPublicSummary = ({ productId, reviews }) => {
  const ratingCount = reviews.length;
  const averageRating = ratingCount
    ? Number(
        (
          reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          ratingCount
        ).toFixed(2)
      )
    : 0;
  const comments = reviews
    .map((review) => cleanString(review.comment))
    .filter(Boolean)
    .slice(-8);
  const fitSignals = {
    trueToSize:
      reviews.filter((review) => review.fitFeedback === "true_to_size").length >=
      Math.max(1, Math.ceil(ratingCount / 2)),
    comfortScore: averageRating,
  };

  return {
    productId,
    ratingCount,
    averageRating,
    summary: ratingCount
      ? `${ratingCount} user reviews, average ${averageRating}/5.`
      : "No reviews yet.",
    fitSignals,
    commonFeedback: comments,
    updatedAt: new Date(),
  };
};

export const submitProductFeedback = async ({
  productId,
  userId,
  body = {},
}) => {
  const rating = Number(body.rating);
  const comment = cleanString(body.comment);
  const fitFeedback = cleanString(body.fitFeedback);
  const context = normalizeContext(body.context);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error("rating must be an integer from 1 to 5.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const product = await db.collection("products").findOne({ id: productId });

  if (!product) {
    const error = new Error("Product was not found.");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const review = {
    id: crypto.randomUUID(),
    productId,
    shopId: product.shopId,
    userId,
    rating,
    comment,
    fitFeedback,
    context,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("product_feedback_reviews").insertOne(review);

  const reviews = await db
    .collection("product_feedback_reviews")
    .find({ productId })
    .toArray();
  const summary = getPublicSummary({ productId, reviews });

  await db.collection("product_review_summaries").updateOne(
    { productId },
    {
      $set: summary,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  await trackShopEvent({
    eventType: "product_feedback",
    shopId: product.shopId,
    productId,
    userId,
    metadata: {
      rating,
      comment,
      fitFeedback,
      context,
      productStyleTags: product.styleTags || [],
      productColors: product.colors || [],
    },
  });

  return {
    review: {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      fitFeedback: review.fitFeedback,
      context: review.context,
      createdAt: review.createdAt,
    },
    summary,
  };
};
