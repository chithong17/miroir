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

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const buildDailySeries = (events = [], range = "30d") => {
  const days = RANGE_DAYS[normalizeRange(range)];
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const buckets = new Map();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - offset);
    const key = toDateKey(date);
    buckets.set(key, {
      date: key,
      views: 0,
      tryOns: 0,
      stylistMatches: 0,
      feedback: 0,
    });
  }

  events.forEach((event) => {
    const bucket = buckets.get(toDateKey(event.createdAt));
    if (!bucket) return;
    if (event.eventType === "product_view") bucket.views += 1;
    if (event.eventType === "tryon_started") bucket.tryOns += 1;
    if (event.eventType === "stylist_product_recommended") bucket.stylistMatches += 1;
    if (event.eventType === "product_feedback") bucket.feedback += 1;
  });

  return [...buckets.values()];
};

const buildSalesSeries = (orders = [], range = "30d") => {
  const days = RANGE_DAYS[normalizeRange(range)];
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const buckets = new Map();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - offset);
    const key = toDateKey(date);
    buckets.set(key, {
      date: key,
      orders: 0,
      collectedRevenue: 0,
      projectedRevenue: 0,
      refunds: 0,
    });
  }

  orders.forEach((order) => {
    const bucket = buckets.get(toDateKey(order.createdAt));
    if (!bucket) return;
    const total = Number(order.total || 0);
    bucket.orders += 1;
    if (order.paymentStatus === "paid") bucket.collectedRevenue += total;
    if (["cod_pending", "awaiting_transfer", "pending_verification"].includes(order.paymentStatus)) {
      bucket.projectedRevenue += total;
    }
    if (["refund_pending", "refunded"].includes(order.paymentStatus)) bucket.refunds += total;
  });

  return [...buckets.values()];
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
    timeSeries: buildDailySeries(events, range),
    topProducts,
  };
};

export const getShopDashboard = async ({ ownerId, range = "30d" }) => {
  const db = await getMongoDb();
  const shop = await getOwnerShopOrThrow(ownerId);
  const normalizedRange = normalizeRange(range);
  const start = getRangeStart(normalizedRange);
  const [analytics, orders, products, fitEvents, fitFeedback, returns] = await Promise.all([
    getShopAnalytics({ ownerId, range: normalizedRange }),
    db.collection("orders").find({ shopId: shop.id, createdAt: { $gte: start } }).sort({ createdAt: -1 }).toArray(),
    db.collection("products").find({ shopId: shop.id }).toArray(),
    db.collection("fit_events").find({ shopId: shop.id, createdAt: { $gte: start } }).toArray(),
    db.collection("fit_feedback").find({ shopId: shop.id, createdAt: { $gte: start } }).toArray(),
    db.collection("order_returns").find({ shopId: shop.id, createdAt: { $gte: start } }).toArray(),
  ]);

  const paymentStatuses = new Map();
  const orderStatuses = new Map();
  const productSales = new Map();
  let collectedRevenue = 0;
  let projectedRevenue = 0;
  let refundValue = 0;
  let completedOrders = 0;

  orders.forEach((order) => {
    const total = Number(order.total || 0);
    incrementMap(paymentStatuses, order.paymentStatus || "unknown");
    incrementMap(orderStatuses, order.orderStatus || "unknown");
    if (order.paymentStatus === "paid") collectedRevenue += total;
    if (["cod_pending", "awaiting_transfer", "pending_verification"].includes(order.paymentStatus)) {
      projectedRevenue += total;
    }
    if (["refund_pending", "refunded"].includes(order.paymentStatus)) refundValue += total;
    if (order.orderStatus === "delivered") completedOrders += 1;

    (order.items || []).forEach((item) => {
      const key = item.productId || item.name || "unknown";
      const existing = productSales.get(key) || {
        productId: item.productId || "",
        name: item.name || "Product",
        quantity: 0,
        orderCount: 0,
        collectedRevenue: 0,
      };
      existing.quantity += Number(item.quantity || 0);
      existing.orderCount += 1;
      if (order.paymentStatus === "paid") {
        existing.collectedRevenue += Number(item.lineTotal || Number(item.unitPrice || 0) * Number(item.quantity || 0));
      }
      productSales.set(key, existing);
    });
  });

  const inventoryHealth = {
    total: products.length,
    published: products.filter((product) => product.status === "published").length,
    draft: products.filter((product) => product.status === "draft").length,
    outOfStock: products.filter((product) => product.availability === "out_of_stock").length,
    needsEmbedding: products.filter((product) => product.embeddingStale || !Array.isArray(product.embedding) || !product.embedding.length).length,
  };
  const fitCount = (type) => fitEvents.filter((item) => item.type === type).length;
  const confidenceDistribution = ["high", "moderate", "low"].map((confidence) => ({ label: confidence, count: fitEvents.filter((item) => item.confidence === confidence).length }));
  const sizeReturns = returns.filter((item) => item.reasonCode === "size_or_fit").length;

  return {
    range: normalizedRange,
    shop: { id: shop.id, name: shop.name },
    summary: {
      totalOrders: orders.length,
      completedOrders,
      collectedRevenue,
      projectedRevenue,
      refundValue,
      averageOrderValue: orders.length ? Math.round(collectedRevenue / orders.length) : 0,
      pendingOrders: orders.filter((order) => ["pending_confirmation", "preparing"].includes(order.orderStatus)).length,
    },
    salesSeries: buildSalesSeries(orders, normalizedRange),
    orderStatusBreakdown: topEntries(orderStatuses, 10),
    paymentStatusBreakdown: topEntries(paymentStatuses, 10),
    funnel: {
      views: analytics.summary.productViews,
      tryOns: analytics.summary.tryOnClicks,
      stylistMatches: analytics.summary.stylistMatches,
      feedback: analytics.summary.feedbackCount,
      orders: orders.length,
      paidOrders: orders.filter((order) => order.paymentStatus === "paid").length,
    },
    fitFinder: {
      opened: fitCount("opened"), recommended: fitCount("recommended"), applied: fitCount("applied"), addToCart: fitCount("add_to_cart"), checkout: fitCount("checkout"),
      confidenceDistribution,
      feedback: {
        total: fitFeedback.length,
        tooSmall: fitFeedback.filter((item) => item.outcome === "too_small").length,
        trueToSize: fitFeedback.filter((item) => item.outcome === "true_to_size").length,
        tooLarge: fitFeedback.filter((item) => item.outcome === "too_large").length,
      },
      sizeReturnCount: sizeReturns,
      sizeReturnRate: returns.length ? Number((sizeReturns / returns.length).toFixed(4)) : 0,
    },
    topProducts: [...productSales.values()]
      .sort((left, right) => right.collectedRevenue - left.collectedRevenue || right.quantity - left.quantity)
      .slice(0, 10),
    inventoryHealth,
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
