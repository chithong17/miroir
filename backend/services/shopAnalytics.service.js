import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";
import { getSingleOwnerShop } from "./shop.service.js";

const PRIVACY_THRESHOLD = 3;
const RANGE_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const normalizeRange = (range = "30d") => (RANGE_DAYS[range] ? range : "30d");

const getRangeStart = (range = "30d") => {
  const days = RANGE_DAYS[normalizeRange(range)];
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  return start;
};

const incrementMap = (map, key, amount = 1) => {
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) return;
  map.set(normalizedKey, (map.get(normalizedKey) || 0) + amount);
};

const topEntries = (map, limit = 8) =>
  [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

const budgetBucket = (budget) => {
  const max = Number(budget?.max ?? budget);
  if (!Number.isFinite(max) || max <= 0) return "";
  if (max < 300000) return "Under 300k";
  if (max < 700000) return "300k-700k";
  if (max < 1500000) return "700k-1.5m";
  return "Over 1.5m";
};

export const trackShopEvent = async ({
  eventType,
  shopId,
  productId,
  userId,
  metadata = {},
}) => {
  if (!eventType || !shopId) return null;

  const db = await getMongoDb();
  const event = {
    id: crypto.randomUUID(),
    eventType,
    shopId,
    productId: productId || "",
    userId: userId || "",
    metadata,
    createdAt: new Date(),
  };

  await db.collection("shop_events").insertOne(event);
  return event;
};

export const trackShopEvents = async (events = []) => {
  const validEvents = events.filter((event) => event.eventType && event.shopId);
  if (!validEvents.length) return [];

  const db = await getMongoDb();
  const now = new Date();
  const docs = validEvents.map((event) => ({
    id: crypto.randomUUID(),
    eventType: event.eventType,
    shopId: event.shopId,
    productId: event.productId || "",
    userId: event.userId || "",
    metadata: event.metadata || {},
    createdAt: now,
  }));

  await db.collection("shop_events").insertMany(docs);
  return docs;
};

const getOwnerShopOrThrow = async (ownerId) => {
  const shop = await getSingleOwnerShop(ownerId);
  if (!shop) {
    const error = new Error("Create your shop before viewing analytics.");
    error.statusCode = 404;
    throw error;
  }
  return shop;
};

export const getShopAnalytics = async ({ ownerId, range = "30d" }) => {
  const db = await getMongoDb();
  const shop = await getOwnerShopOrThrow(ownerId);
  const start = getRangeStart(range);
  const eventFilter = { shopId: shop.id, createdAt: { $gte: start } };
  const [products, events] = await Promise.all([
    db.collection("products").find({ shopId: shop.id }).toArray(),
    db.collection("shop_events").find(eventFilter).toArray(),
  ]);
  const productById = new Map(products.map((product) => [product.id, product]));
  const summary = {
    totalProducts: products.length,
    publishedProducts: products.filter((product) => product.status === "published").length,
    draftProducts: products.filter((product) => product.status === "draft").length,
    outOfStockProducts: products.filter((product) => product.availability === "out_of_stock").length,
    productViews: events.filter((event) => event.eventType === "product_view").length,
    tryOnClicks: events.filter((event) => event.eventType === "tryon_started").length,
    stylistMatches: events.filter((event) => event.eventType === "stylist_product_recommended").length,
    feedbackCount: events.filter((event) => event.eventType === "product_feedback").length,
  };
  summary.conversionRate = summary.productViews
    ? Number((summary.tryOnClicks / summary.productViews).toFixed(4))
    : 0;

  const productStats = new Map();
  products.forEach((product) => {
    productStats.set(product.id, {
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl || "",
      status: product.status,
      views: 0,
      tryOns: 0,
      stylistMatches: 0,
      feedbackCount: 0,
      ratingTotal: 0,
      averageRating: 0,
    });
  });

  events.forEach((event) => {
    if (!event.productId) return;
    const stats =
      productStats.get(event.productId) ||
      {
        productId: event.productId,
        name: productById.get(event.productId)?.name || event.productId,
        imageUrl: productById.get(event.productId)?.imageUrl || "",
        status: productById.get(event.productId)?.status || "",
        views: 0,
        tryOns: 0,
        stylistMatches: 0,
      };
    if (event.eventType === "product_view") stats.views += 1;
    if (event.eventType === "tryon_started") stats.tryOns += 1;
    if (event.eventType === "stylist_product_recommended") stats.stylistMatches += 1;
    if (event.eventType === "product_feedback") {
      stats.feedbackCount += 1;
      stats.ratingTotal += Number(event.metadata?.rating || 0);
      stats.averageRating = stats.feedbackCount
        ? Number((stats.ratingTotal / stats.feedbackCount).toFixed(2))
        : 0;
    }
    productStats.set(event.productId, stats);
  });

  const topProducts = [...productStats.values()]
    .map((item) => ({
      ...item,
      conversionRate: item.views ? Number((item.tryOns / item.views).toFixed(4)) : 0,
      totalEngagement: item.views + item.tryOns + item.stylistMatches + item.feedbackCount,
    }))
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, 10);

  return {
    range: normalizeRange(range),
    shop: { id: shop.id, name: shop.name },
    summary,
    topProducts,
  };
};

export const getShopInsights = async ({ ownerId, range = "30d" }) => {
  const db = await getMongoDb();
  const shop = await getOwnerShopOrThrow(ownerId);
  const start = getRangeStart(range);
  const events = await db
    .collection("shop_events")
    .find({
      shopId: shop.id,
      createdAt: { $gte: start },
      eventType: { $in: ["tryon_started", "stylist_product_recommended", "product_feedback"] },
    })
    .toArray();
  const distinctUsers = new Set(events.map((event) => event.userId).filter(Boolean));

  if (events.length < PRIVACY_THRESHOLD || distinctUsers.size < PRIVACY_THRESHOLD) {
    return {
      range: normalizeRange(range),
      shop: { id: shop.id, name: shop.name },
      enoughData: false,
      message: "Not enough data yet.",
      minimumEvents: PRIVACY_THRESHOLD,
      eventCount: events.length,
      userCount: distinctUsers.size,
    };
  }

  const gender = new Map();
  const bodyShape = new Map();
  const skinTone = new Map();
  const stylePreferences = new Map();
  const occasions = new Map();
  const budgetBuckets = new Map();
  const styleTags = new Map();
  const colors = new Map();
  const ratings = new Map();

  events.forEach((event) => {
    const profile = event.metadata?.profile || {};
    incrementMap(gender, profile.gender);
    incrementMap(bodyShape, profile.bodyShape);
    incrementMap(skinTone, profile.skinTone);
    (profile.stylePreferences || []).forEach((item) => incrementMap(stylePreferences, item));
    incrementMap(occasions, event.metadata?.occasion);
    incrementMap(budgetBuckets, budgetBucket(event.metadata?.budget));
    (event.metadata?.productStyleTags || []).forEach((item) => incrementMap(styleTags, item));
    (event.metadata?.productColors || []).forEach((item) => incrementMap(colors, item));
    incrementMap(ratings, event.metadata?.rating ? `${event.metadata.rating} stars` : "");
  });

  return {
    range: normalizeRange(range),
    shop: { id: shop.id, name: shop.name },
    enoughData: true,
    eventCount: events.length,
    userCount: distinctUsers.size,
    breakdowns: {
      gender: topEntries(gender),
      bodyShape: topEntries(bodyShape),
      skinTone: topEntries(skinTone),
      stylePreferences: topEntries(stylePreferences),
      occasions: topEntries(occasions),
      budgetBuckets: topEntries(budgetBuckets),
      styleTags: topEntries(styleTags),
      colors: topEntries(colors),
      ratings: topEntries(ratings),
    },
  };
};
