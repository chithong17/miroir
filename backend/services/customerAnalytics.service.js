import { getMongoDb } from "./mongo.service.js";

const DAY = 86400000;
const OFFSET = 7 * 3600000;
export const customerDateKey = (date) => new Date(new Date(date).getTime() + OFFSET).toISOString().slice(0, 10);
export const customerWindow = (range = "30d", now = new Date()) => {
  const days = new Map([["7d", 7], ["30d", 30], ["90d", 90]]).get(range) || 30;
  const today = new Date(`${customerDateKey(now)}T00:00:00+07:00`);
  return { days, start: new Date(today.getTime() - (days - 1) * DAY), end: now, today };
};
export const customerReportingWindow = (query = {}, now = new Date()) => {
  if (!query.month) return customerWindow(query.range, now);
  const month = String(query.month);
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match || month < "2000-01" || month > customerDateKey(now).slice(0, 7)) {
    throw Object.assign(new Error("Tháng thống kê không hợp lệ."), { statusCode: 400 });
  }
  const start = new Date(`${month}-01T00:00:00+07:00`);
  const next = new Date(Date.UTC(Number(match[1]), Number(match[2]), 1) - OFFSET);
  const end = new Date(Math.min(now.getTime(), next.getTime() - 1));
  const today = new Date(`${customerDateKey(now)}T00:00:00+07:00`);
  const lastDay = new Date(`${customerDateKey(end)}T00:00:00+07:00`);
  return { start, end, today, month, days: Math.round((lastDay - start) / DAY) + 1 };
};
export const fillCustomerDays = (rows, window) => {
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return Array.from({ length: window.days }, (_, index) => {
    const date = customerDateKey(new Date(window.start.getTime() + index * DAY));
    return { date, count: counts.get(date) || 0 };
  });
};
const customerOnly = (now) => [
  { $lookup: { from: "users", localField: "userId", foreignField: "id", as: "customer", pipeline: [{ $match: { createdAt: { $lte: now } } }, { $project: { _id: 1 } }] } },
  { $match: { "customer.0": { $exists: true } } },
];
export const getCustomerAnalytics = async ({ query = {}, now = new Date(), db: suppliedDb } = {}) => {
  const db = suppliedDb || await getMongoDb();
  const window = customerReportingWindow(query, now);
  const dateFilter = { $gte: window.start, $lte: window.end };
  const users = db.collection("users");
  const page = Math.min(100000, Math.max(1, Math.floor(Number(query.page) || 1)));
  const limit = 20;
  const search = String(query.search || "").trim().slice(0, 100);
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = {
    createdAt: { $lte: now },
    ...(search ? { $or: [{ name: { $regex: escaped, $options: "i" } }, { email: { $regex: escaped, $options: "i" } }] } : {}),
    ...(query.status === "active" ? { status: "active" } : query.status === "other" ? { status: { $ne: "active" } } : {}),
  };
  const activityTypes = ["product_view", "tryon_started", "stylist_product_recommended", "product_feedback"];
  const [total, today, new7d, new30d, newInRange, completedProfiles, enabled, daily, activity, orders, customers, matching] = await Promise.all([
    users.countDocuments({ createdAt: { $lte: now } }),
    users.countDocuments({ createdAt: { $gte: window.today, $lte: now } }),
    users.countDocuments({ createdAt: { $gte: customerWindow("7d", now).start, $lte: now } }),
    users.countDocuments({ createdAt: { $gte: customerWindow("30d", now).start, $lte: now } }),
    users.countDocuments({ createdAt: dateFilter }),
    users.countDocuments({ profileCompleted: true, createdAt: { $lte: now } }),
    users.countDocuments({ status: "active", createdAt: { $lte: now } }),
    users.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray(),
    db.collection("shop_events").aggregate([
      { $match: { createdAt: dateFilter, userId: { $type: "string", $ne: "" }, eventType: { $in: activityTypes } } },
      ...customerOnly(now),
      { $group: { _id: { userId: "$userId", type: "$eventType" }, count: { $sum: 1 } } },
    ]).toArray(),
    db.collection("orders").aggregate([
      { $match: { createdAt: dateFilter } }, ...customerOnly(now),
      { $group: { _id: "$userId", count: { $sum: 1 }, paid: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "paid"] }, { $not: [{ $in: ["$orderStatus", ["cancelled", "expired"]] }] }] }, 1, 0] } } } },
    ]).toArray(),
    users.find(filter, { projection: { _id: 0, id: 1, name: 1, email: 1, status: 1, createdAt: 1, profileCompleted: 1, profileSkipped: 1 } })
      .sort({ createdAt: -1, id: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
    users.countDocuments(filter),
  ]);
  const activeIds = new Set(activity.map((entry) => entry._id.userId));
  orders.forEach((entry) => activeIds.add(entry._id));
  const usage = Object.fromEntries(activityTypes.map((type) => [type, activity.filter((entry) => entry._id.type === type).reduce((sum, entry) => sum + entry.count, 0)]));
  return {
    generatedAt: now, timezone: "Asia/Ho_Chi_Minh", range: window.month || `${window.days}d`, month: window.month || null, start: window.start, end: window.end,
    summary: { total, today, new7d, new30d, newInRange, completedProfiles, enabled, activeInRange: activeIds.size,
      activityRate: total ? Math.round(activeIds.size / total * 1000) / 10 : 0,
      orders: orders.reduce((sum, entry) => sum + entry.count, 0), payingCustomers: orders.filter((entry) => entry.paid > 0).length },
    usage, daily: fillCustomerDays(daily, window), customers,
    pagination: { page, limit, total: matching, totalPages: Math.max(1, Math.ceil(matching / limit)) },
  };
};
