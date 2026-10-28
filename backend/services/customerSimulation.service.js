import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";

const DAY = 86400000;
const BATCH_ID = "activity-rate-88-v1";

export async function simulateActiveCustomers({ targetMau = 88, now = new Date() } = {}) {
  const db = await getMongoDb();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);

  // 1. Get active shops and products
  const shops = await db.collection("shops").find({ status: "active" }).toArray();
  const shopIds = shops.map((s) => s.id);
  const products = await db.collection("products").find({ shopId: { $in: shopIds }, status: "published" }).toArray();

  if (!shops.length || !products.length) {
    throw new Error("Không tìm thấy shop hoặc sản phẩm để tạo sự kiện hoạt động.");
  }

  // 2. Find currently active user IDs in last 30 days
  const [activeEvents, activeOrders] = await Promise.all([
    db.collection("shop_events").distinct("userId", {
      createdAt: { $gte: thirtyDaysAgo, $lte: now },
      eventType: { $in: ["product_view", "tryon_started", "stylist_product_recommended", "product_feedback"] },
      userId: { $type: "string", $ne: "" },
    }),
    db.collection("orders").distinct("userId", {
      createdAt: { $gte: thirtyDaysAgo, $lte: now },
      userId: { $type: "string", $ne: "" },
    }),
  ]);

  const currentlyActiveSet = new Set([...activeEvents, ...activeOrders]);

  // 3. Find candidate customer users
  const allCustomers = await db.collection("users").find({ createdAt: { $lte: now } }).sort({ createdAt: 1 }).toArray();
  const needed = Math.max(0, targetMau - currentlyActiveSet.size);

  if (needed === 0) {
    return {
      message: `Hệ thống đã có ${currentlyActiveSet.size} khách hàng hoạt động trong 30 ngày (đã đạt hoặc vượt mức ${targetMau}).`,
      currentMau: currentlyActiveSet.size,
      targetMau,
      addedUsers: 0,
    };
  }

  const inactiveCustomers = allCustomers.filter((u) => !currentlyActiveSet.has(u.id));
  const selectedUsers = inactiveCustomers.slice(0, needed);

  const eventTypes = ["product_view", "stylist_product_recommended", "tryon_started", "product_feedback"];
  const newEvents = [];

  for (const user of selectedUsers) {
    const userRegTime = new Date(user.createdAt || thirtyDaysAgo).getTime();
    const minTime = Math.max(userRegTime, thirtyDaysAgo.getTime());
    const maxTime = now.getTime();

    // Create 2-4 events for each user spread out over the last 30 days
    const eventCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < eventCount; i++) {
      const eventTime = new Date(minTime + Math.random() * (maxTime - minTime));
      const product = products[Math.floor(Math.random() * products.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      newEvents.push({
        id: `sim-${crypto.randomUUID()}`,
        eventType,
        shopId: product.shopId,
        productId: product.id,
        userId: user.id,
        createdAt: eventTime,
        metadata: {
          isSimulation: true,
          simulationBatch: BATCH_ID,
          source: "customer_activity_simulation",
        },
      });
    }
  }

  if (newEvents.length) {
    await db.collection("shop_events").insertMany(newEvents);
  }

  return {
    success: true,
    batchId: BATCH_ID,
    previousMau: currentlyActiveSet.size,
    newMau: currentlyActiveSet.size + selectedUsers.length,
    targetMau,
    activatedUsersCount: selectedUsers.length,
    eventsCreatedCount: newEvents.length,
  };
}

export async function simulateProductViews({ targetViews = 146, now = new Date() } = {}) {
  const db = await getMongoDb();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);

  // 1. Check current product_view events in 30d window for valid users
  const currentViewsAgg = await db.collection("shop_events").aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo, $lte: now },
        userId: { $type: "string", $ne: "" },
        eventType: "product_view",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "id",
        as: "customer",
        pipeline: [{ $match: { createdAt: { $lte: now } } }, { $project: { _id: 1 } }],
      },
    },
    { $match: { "customer.0": { $exists: true } } },
    { $count: "total" },
  ]).toArray();

  const currentViews = currentViewsAgg[0]?.total || 0;
  const needed = targetViews - currentViews;

  if (needed <= 0) {
    return {
      message: `Lượt xem sản phẩm hiện tại (${currentViews}) đã đạt hoặc vượt mục tiêu (${targetViews}).`,
      currentViews,
      targetViews,
      addedViews: 0,
    };
  }

  // 2. Active shops and products
  const shops = await db.collection("shops").find({ status: "active" }).toArray();
  const shopIds = shops.map((s) => s.id);
  const products = await db.collection("products").find({ shopId: { $in: shopIds }, status: "published" }).toArray();

  if (!shops.length || !products.length) {
    throw new Error("Không tìm thấy shop hoặc sản phẩm để tạo lượt xem.");
  }

  // 3. Candidate users
  const users = await db.collection("users").find({ createdAt: { $lte: now } }).toArray();
  if (!users.length) {
    throw new Error("Không tìm thấy khách hàng nào trong hệ thống.");
  }

  const VIEWS_BATCH_ID = "views-boost-14x-v1";
  const newEvents = [];

  for (let i = 0; i < needed; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const userRegTime = new Date(user.createdAt || thirtyDaysAgo).getTime();
    const minTime = Math.max(userRegTime, thirtyDaysAgo.getTime());
    const maxTime = now.getTime();
    const eventTime = new Date(minTime + Math.random() * (maxTime - minTime));
    const product = products[Math.floor(Math.random() * products.length)];

    newEvents.push({
      id: `view-${crypto.randomUUID()}`,
      eventType: "product_view",
      shopId: product.shopId,
      productId: product.id,
      userId: user.id,
      createdAt: eventTime,
      metadata: {
        isSimulation: true,
        simulationBatch: VIEWS_BATCH_ID,
        source: "customer_views_boost",
      },
    });
  }

  if (newEvents.length) {
    await db.collection("shop_events").insertMany(newEvents);
  }

  return {
    success: true,
    batchId: VIEWS_BATCH_ID,
    previousViews: currentViews,
    newViews: currentViews + newEvents.length,
    targetViews,
    addedViews: newEvents.length,
  };
}

export async function revertActiveCustomerSimulation() {
  const db = await getMongoDb();
  const result = await db.collection("shop_events").deleteMany({
    "metadata.simulationBatch": { $in: [BATCH_ID, "views-boost-14x-v1"] },
  });
  return {
    success: true,
    deletedCount: result.deletedCount,
  };
}
