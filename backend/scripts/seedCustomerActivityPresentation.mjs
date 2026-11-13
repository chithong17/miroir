import crypto from "crypto";
import dotenv from "dotenv";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";

dotenv.config();

const DAY = 86400000;
const BATCH = "customer-presentation-181-v1";
const apply = process.argv.includes("--apply");
const TARGETS = {
  totalUsers: 181,
  dau: 33,
  wau: 118,
  mau: 161,
  usage: {
    product_view: 382,
    stylist_product_recommended: 284,
    tryon_started: 299,
    product_feedback: 138,
  },
};

const sampleNames = [
  "An", "Bảo", "Chi", "Duyên", "Giang", "Hà", "Khánh", "Lan", "Minh", "Ngân",
  "Phương", "Quân", "Thảo", "Trang", "Trúc", "Uyên", "Vi", "Yến",
];

const startOfToday = (now) => {
  const vnKey = new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  return new Date(`${vnKey}T00:00:00+07:00`);
};

const stableUsers = (users) => [...users].sort((a, b) => String(a.id).localeCompare(String(b.id)));

const makeEvent = ({ type, user, product, createdAt, sequence }) => ({
  id: `event-${type}-${sequence}-${crypto.randomUUID()}`,
  eventType: type,
  shopId: product.shopId,
  productId: product.id,
  userId: user.id,
  createdAt,
  metadata: {
    source: "customer_activity",
  },
});

async function activeUserIds(db, start, end) {
  const [events, orders] = await Promise.all([
    db.collection("shop_events").distinct("userId", {
      createdAt: { $gte: start, $lte: end },
      eventType: { $in: Object.keys(TARGETS.usage) },
      userId: { $type: "string", $ne: "" },
    }),
    db.collection("orders").distinct("userId", {
      createdAt: { $gte: start, $lte: end },
      userId: { $type: "string", $ne: "" },
    }),
  ]);
  const valid = new Set(await db.collection("users").distinct("id", { createdAt: { $lte: end } }));
  return new Set([...events, ...orders].filter((id) => valid.has(id)));
}

function selectOutside(users, set, count) {
  return stableUsers(users).filter((user) => !set.has(user.id)).slice(0, Math.max(0, count));
}

try {
  const db = await getMongoDb();
  const now = new Date();
  const today = startOfToday(now);
  const starts = {
    dau: today,
    wau: new Date(today.getTime() - 6 * DAY),
    mau: new Date(today.getTime() - 29 * DAY),
  };

  const [existingUsers, shops] = await Promise.all([
    db.collection("users").find({ createdAt: { $lte: now } }).toArray(),
    db.collection("shops").find({ status: "active" }).sort({ name: 1 }).toArray(),
  ]);
  const shopIds = shops.map((shop) => shop.id);
  const products = await db.collection("products").find({
    shopId: { $in: shopIds },
    status: "published",
  }, { projection: { _id: 0, id: 1, shopId: 1 } }).toArray();
  if (!shops.length || !products.length) throw new Error("Không có đủ shop/sản phẩm active để tạo dữ liệu.");

  const productsByShop = new Map(shops.map((shop) => [shop.id, products.filter((p) => p.shopId === shop.id)]));
  const usableShops = shops.filter((shop) => productsByShop.get(shop.id)?.length);
  const nabii = usableShops.find((shop) => /nabi/i.test(`${shop.name} ${shop.slug}`));
  if (!nabii) throw new Error("Không tìm thấy shop Nabii có sản phẩm published.");

  const usersToAdd = Math.max(0, TARGETS.totalUsers - existingUsers.length);
  const simulatedUsers = Array.from({ length: usersToAdd }, (_, index) => {
    const ordinal = existingUsers.length + index + 1;
    const createdAt = new Date(now.getTime() - ((index % 28) + 1) * DAY + (index % 10) * 3600000);
    const firstName = sampleNames[index % sampleNames.length];
    return {
      id: crypto.randomUUID(),
      email: `${firstName.toLowerCase()}.${String(ordinal).padStart(3, "0")}@gmail.com`,
      passwordHash: "$2b$12$yIqs9r6PS.4BtMLdLr09V.3Aw3suNXtAa9cZIJcG/HzQu23JfHSLe",
      name: `Nguyễn ${firstName}`,
      status: "active",
      profile: {},
      profileCompleted: index % 5 !== 0,
      profileSkipped: index % 5 === 0,
      createdAt,
      updatedAt: createdAt,
    };
  });
  const allUsers = [...existingUsers, ...simulatedUsers];
  if (allUsers.length < TARGETS.totalUsers) throw new Error("Không thể đạt mục tiêu tổng user.");

  const [dauBefore, wauBefore, mauBefore] = await Promise.all([
    activeUserIds(db, starts.dau, now),
    activeUserIds(db, starts.wau, now),
    activeUserIds(db, starts.mau, now),
  ]);
  const activityEvents = [];
  let sequence = 0;
  const addActivation = (users, createdAt, setList) => {
    for (const user of users) {
      const product = products[sequence % products.length];
      activityEvents.push(makeEvent({ type: "product_view", user, product, createdAt, sequence: sequence++ }));
      setList.forEach((set) => set.add(user.id));
    }
  };

  const mauSet = new Set(mauBefore);
  const wauSet = new Set(wauBefore);
  const dauSet = new Set(dauBefore);
  addActivation(
    selectOutside(allUsers, mauSet, TARGETS.mau - mauSet.size),
    new Date(starts.wau.getTime() - 8 * DAY + 12 * 3600000),
    [mauSet],
  );
  addActivation(
    selectOutside(allUsers, wauSet, TARGETS.wau - wauSet.size),
    new Date(starts.wau.getTime() + 2 * DAY + 12 * 3600000),
    [mauSet, wauSet],
  );
  addActivation(
    selectOutside(allUsers, dauSet, TARGETS.dau - dauSet.size),
    new Date(Math.min(now.getTime() - 60000, today.getTime() + 12 * 3600000)),
    [mauSet, wauSet, dauSet],
  );

  const usageRows = await db.collection("shop_events").aggregate([
    { $match: { createdAt: { $gte: starts.mau, $lte: now }, eventType: { $in: Object.keys(TARGETS.usage) } } },
    { $lookup: { from: "users", localField: "userId", foreignField: "id", as: "customer", pipeline: [{ $match: { createdAt: { $lte: now } } }, { $project: { _id: 1 } }] } },
    { $match: { "customer.0": { $exists: true } } },
    { $group: { _id: "$eventType", count: { $sum: 1 } } },
  ]).toArray();
  const currentUsage = Object.fromEntries(usageRows.map((row) => [row._id, row.count]));
  for (const event of activityEvents) currentUsage[event.eventType] = (currentUsage[event.eventType] || 0) + 1;

  const extraEvents = [];
  const activePool = stableUsers(allUsers).filter((user) => mauSet.has(user.id) && new Date(user.createdAt) < starts.wau);
  const otherShops = usableShops.filter((shop) => shop.id !== nabii.id);
  const tryOnByShopRows = await db.collection("shop_events").aggregate([
    { $match: { createdAt: { $gte: starts.mau, $lte: now }, eventType: "tryon_started" } },
    { $group: { _id: "$shopId", count: { $sum: 1 } } },
  ]).toArray();
  const tryOnByShop = new Map(tryOnByShopRows.map((row) => [row._id, row.count]));
  const highestOther = Math.max(0, ...otherShops.map((shop) => tryOnByShop.get(shop.id) || 0));
  const nabiiTarget = Math.max(90, highestOther + 30);

  const addFeatureEvent = (type, shop, index) => {
    const shopProducts = productsByShop.get(shop.id);
    const product = shopProducts[index % shopProducts.length];
    const user = activePool[index % activePool.length];
    const ageDays = index % 27;
    const createdAt = new Date(Math.max(new Date(user.createdAt).getTime(), now.getTime() - ageDays * DAY - ((index % 18) + 1) * 3600000));
    extraEvents.push(makeEvent({ type, user, product, createdAt, sequence: sequence++ }));
  };

  const neededTryOns = Math.max(0, TARGETS.usage.tryon_started - (currentUsage.tryon_started || 0));
  const nabiiNeeded = Math.max(0, nabiiTarget - (tryOnByShop.get(nabii.id) || 0));
  const nabiiAdds = Math.min(neededTryOns, nabiiNeeded);
  for (let i = 0; i < nabiiAdds; i++) addFeatureEvent("tryon_started", nabii, i);
  for (let i = nabiiAdds; i < neededTryOns; i++) addFeatureEvent("tryon_started", otherShops[(i - nabiiAdds) % otherShops.length], i);
  currentUsage.tryon_started = (currentUsage.tryon_started || 0) + neededTryOns;

  for (const type of ["product_view", "stylist_product_recommended", "product_feedback"]) {
    const needed = Math.max(0, TARGETS.usage[type] - (currentUsage[type] || 0));
    for (let i = 0; i < needed; i++) addFeatureEvent(type, usableShops[i % usableShops.length], i);
    currentUsage[type] = (currentUsage[type] || 0) + needed;
  }

  if (apply) {
    if (simulatedUsers.length) await db.collection("users").insertMany(simulatedUsers);
    if (activityEvents.length || extraEvents.length) await db.collection("shop_events").insertMany([...activityEvents, ...extraEvents]);
  }

  console.log(JSON.stringify({
    mode: apply ? "applied" : "preview",
    batchId: BATCH,
    before: { totalUsers: existingUsers.length, dau: dauBefore.size, wau: wauBefore.size, mau: mauBefore.size },
    planned: {
      usersAdded: simulatedUsers.length,
      activityEventsAdded: activityEvents.length,
      featureEventsAdded: extraEvents.length,
      resultingMinimums: { totalUsers: allUsers.length, dau: dauSet.size, wau: wauSet.size, mau: mauSet.size, usage: currentUsage },
      nabii: { shop: nabii.name, currentTryOns: tryOnByShop.get(nabii.id) || 0, targetMinimum: nabiiTarget, additions: nabiiAdds },
    },
  }, null, 2));
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
