import { getMongoDb } from "./mongo.service.js";

const unique = (values) => [...new Set(values.filter(Boolean))];

export const getUserFashionMemory = async (userId) => {
  if (!userId) {
    return null;
  }

  const db = await getMongoDb();
  return db.collection("user_fashion_memory").findOne({ userId });
};

const getProductSignals = (products) => {
  const styles = products.flatMap(
    (product) => product.styleTags || product.style_tags || []
  );
  const colors = products.flatMap((product) => product.colors || []);
  const categories = products.map((product) => product.category);
  const fitTypes = products
    .map((product) => product.fitType || product.fit_type)
    .filter(Boolean);

  return {
    styles: unique(styles),
    colors: unique(colors),
    categories: unique(categories),
    fitPreference: fitTypes[0],
  };
};

export const recordFashionFeedback = async ({
  userId,
  productIds = [],
  outfitId,
  eventType,
  reason,
}) => {
  if (!userId || !eventType) {
    const error = new Error("userId and eventType are required.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const products = productIds.length
    ? await db
        .collection("products")
        .find({ id: { $in: productIds } })
        .toArray()
    : [];
  const signals = getProductSignals(products);
  const now = new Date();

  await db.collection("fashion_feedback_events").insertOne({
    userId,
    productIds,
    outfitId,
    eventType,
    reason,
    createdAt: now,
  });

  const positive = ["liked", "purchased", "tried_on"].includes(eventType);
  const negative = ["disliked", "returned"].includes(eventType);
  await db.collection("user_fashion_memory").updateOne(
    { userId },
    {
      $set: { userId, lastUpdatedAt: now },
      $setOnInsert: {
        fitPreference: "",
        preferredOccasions: [],
        sizeHints: {},
        likedStyles: [],
        dislikedStyles: [],
        favoriteColors: [],
        avoidedColors: [],
        preferredCategories: [],
        dislikedCategories: [],
      },
    },
    { upsert: true }
  );

  const update = {
    $set: { lastUpdatedAt: now },
  };

  if (positive) {
    update.$addToSet = {
      likedStyles: { $each: signals.styles },
      favoriteColors: { $each: signals.colors },
      preferredCategories: { $each: signals.categories },
    };

    if (signals.fitPreference) {
      update.$set.fitPreference = signals.fitPreference;
    }
  }

  if (negative) {
    update.$addToSet = {
      dislikedStyles: { $each: signals.styles },
      avoidedColors: { $each: signals.colors },
      dislikedCategories: { $each: signals.categories },
    };
  }

  if (!positive && !negative) {
    update.$set.lastFeedbackEventType = eventType;
  }

  await db
    .collection("user_fashion_memory")
    .updateOne({ userId }, update);

  return db.collection("user_fashion_memory").findOne({ userId });
};
