import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";
import { getSingleOwnerShop } from "./shop.service.js";
import { generateEmbedding } from "./gemini.service.js";
import { buildProductEmbeddingText, hashEmbeddingText } from "./embeddingText.service.js";

export const createAiUpdateJob = async ({ ownerId, productIds }) => {
  const db = await getMongoDb();
  const shop = await getSingleOwnerShop(ownerId);
  if (!shop) {
    const error = new Error("Shop not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check if there is an active job running for this shop
  const activeJob = await db.collection("ai_update_jobs").findOne({
    shopId: shop.id,
    status: { $in: ["pending", "processing"] },
  });

  if (activeJob) {
    return activeJob;
  }

  const filter = { shopId: shop.id };

  if (Array.isArray(productIds) && productIds.length > 0) {
    // If specific product IDs are provided, force update them regardless of stale status
    filter.id = { $in: productIds };
  } else {
    // Otherwise, find products needing update
    filter.$or = [
      { embeddingStale: true },
      { embeddingTextHash: { $in: [null, ""] } },
      { embedding: { $in: [null, []] } },
      { embedding: { $exists: false } },
    ];
  }

  const productsToUpdate = await db.collection("products").find(filter).toArray();
  const totalCount = productsToUpdate.length;

  const jobId = crypto.randomUUID();
  const now = new Date();

  const job = {
    id: jobId,
    ownerId,
    shopId: shop.id,
    status: totalCount === 0 ? "completed" : "pending",
    totalCount,
    processedCount: 0,
    failedCount: 0,
    errors: [],
    createdAt: now,
    updatedAt: now,
    completedAt: totalCount === 0 ? now : null,
  };

  await db.collection("ai_update_jobs").insertOne(job);

  if (totalCount > 0) {
    // Run background task asynchronously
    runAiUpdateJob(jobId, shop.id, productsToUpdate).catch((err) => {
      console.error(`AI Update Job ${jobId} failed in background:`, err);
    });
  }

  return job;
};

export const getAiUpdateJob = async ({ ownerId, jobId }) => {
  const db = await getMongoDb();
  const job = await db.collection("ai_update_jobs").findOne({ id: jobId, ownerId });
  if (!job) {
    const error = new Error("AI update job not found.");
    error.statusCode = 404;
    throw error;
  }
  return job;
};

export const runAiUpdateJob = async (jobId, shopId, productsToUpdate) => {
  const db = await getMongoDb();
  const totalCount = productsToUpdate.length;

  // Set job status to processing
  await db.collection("ai_update_jobs").updateOne(
    { id: jobId },
    {
      $set: {
        status: "processing",
        updatedAt: new Date(),
      },
    }
  );

  let processedCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const product of productsToUpdate) {
    try {
      const text = buildProductEmbeddingText(product);
      const hash = hashEmbeddingText(text);

      if (!text.trim()) {
        processedCount += 1;
        await db.collection("ai_update_jobs").updateOne(
          { id: jobId },
          {
            $set: {
              processedCount,
              updatedAt: new Date(),
            },
          }
        );
        continue;
      }

      // Generate the embedding using Gemini
      const embedding = await generateEmbedding(text);

      // Update the product in MongoDB
      await db.collection("products").updateOne(
        { id: product.id },
        {
          $set: {
            embedding,
            embeddingTextHash: hash,
            embeddingStale: false,
            embeddingUpdatedAt: new Date(),
          },
        }
      );

      processedCount += 1;
      await db.collection("ai_update_jobs").updateOne(
        { id: jobId },
        {
          $set: {
            processedCount,
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      failedCount += 1;
      errors.push({
        productId: product.id,
        name: product.name,
        message: error.message || "Failed to generate embedding",
      });

      await db.collection("ai_update_jobs").updateOne(
        { id: jobId },
        {
          $set: {
            failedCount,
            errors,
            updatedAt: new Date(),
          },
        }
      );
    }
  }

  const finalStatus = failedCount === totalCount ? "failed" : "completed";

  await db.collection("ai_update_jobs").updateOne(
    { id: jobId },
    {
      $set: {
        status: finalStatus,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
};
