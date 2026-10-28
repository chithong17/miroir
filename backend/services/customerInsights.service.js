const DAY = 86400000;
const OFFSET = 7 * 3600000;
const dayKey = date => new Date(new Date(date).getTime() + OFFSET).toISOString().slice(0, 10);
const dayStart = date => new Date(`${dayKey(date)}T00:00:00+07:00`);
export const customerChange = (current, previous) => ({ current, previous, percent: previous > 0 ? Math.round((current - previous) / previous * 1000) / 10 : current === 0 ? 0 : null });

export function customerInsightWindows(window) {
  const duration = window.end.getTime() - window.start.getTime() + 1;
  const previous = { start: new Date(window.start.getTime() - duration), end: new Date(window.start.getTime() - 1) };
  const trailing = (end, days) => ({ start: new Date(dayStart(end).getTime() - (days - 1) * DAY), end });
  return { selected: window, previous, dau: trailing(window.end, 1), wau: trailing(window.end, 7), mau: trailing(window.end, 30), previousMau: trailing(previous.end, 30) };
}

export function mergeCustomerActivity(facets, windows, daily) {
  const sets = Object.fromEntries(Object.keys(windows).map(key => [key, new Set()]));
  const days = new Map(daily.map(row => [row.date, { date: row.date, active: new Set(), featureEvents: 0 }]));
  facets.forEach(({ source, result }) => {
    for (const row of result.periods || []) for (const key of Object.keys(sets)) if (row[key]) sets[key].add(row._id);
    for (const row of result.daily || []) {
      const day = days.get(row._id);
      if (!day) continue;
      for (const id of row.userIds || []) day.active.add(id);
      if (source === "shop_events") day.featureEvents += row.count || 0;
    }
  });
  return { counts: Object.fromEntries(Object.entries(sets).map(([key, ids]) => [key, ids.size])), daily: [...days.values()].map(({ date, active, featureEvents }) => ({ date, activeUsers: active.size, featureEvents })) };
}

export async function getCustomerInsights({ db, window, daily, now }) {
  const windows = customerInsightWindows(window);
  const start = new Date(Math.min(...Object.values(windows).map(w => w.start.getTime())));
  const periods = Object.fromEntries(Object.entries(windows).map(([key, w]) => [key, { $max: { $cond: [{ $and: [{ $gte: ["$createdAt", w.start] }, { $lte: ["$createdAt", w.end] }] }, 1, 0] } }]));
  const readActivity = async source => {
    const rows = await db.collection(source).aggregate([
      { $match: { createdAt: { $gte: start, $lte: window.end }, userId: { $type: "string", $ne: "" }, ...(source === "shop_events" ? { eventType: { $in: ["product_view", "tryon_started", "stylist_product_recommended", "product_feedback"] } } : {}) } },
      { $lookup: { from: "users", localField: "userId", foreignField: "id", as: "customer", pipeline: [{ $match: { createdAt: { $lte: now } } }, { $project: { _id: 1 } }] } },
      { $match: { "customer.0": { $exists: true } } },
      { $facet: {
        periods: [{ $group: { _id: "$userId", ...periods } }],
        daily: [{ $match: { createdAt: { $gte: window.start, $lte: window.end } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } }, userIds: { $addToSet: "$userId" }, count: { $sum: 1 } } }],
      } },
    ]).toArray();
    return { source, result: rows[0] || {} };
  };
  const [events, orders, registered, previousRegistered, beforeStart, previousNew] = await Promise.all([
    readActivity("shop_events"), readActivity("orders"),
    db.collection("users").countDocuments({ createdAt: { $lte: window.end } }),
    db.collection("users").countDocuments({ createdAt: { $lte: windows.previous.end } }),
    db.collection("users").countDocuments({ createdAt: { $lt: window.start } }),
    db.collection("users").countDocuments({ createdAt: { $gte: windows.previous.start, $lte: windows.previous.end } }),
  ]);
  const activity = mergeCustomerActivity([events, orders], windows, daily);
  let cumulative = beforeStart;
  const growth = daily.map(row => ({ date: row.date, registered: cumulative += row.count, newUsers: row.count }));
  const newUsers = daily.reduce((sum, row) => sum + row.count, 0);
  return {
    registeredAtEnd: registered,
    dau: activity.counts.dau, wau: activity.counts.wau, mau: activity.counts.mau,
    engagementRate: registered ? Math.round(activity.counts.mau / registered * 1000) / 10 : 0,
    comparison: { start: windows.previous.start, end: windows.previous.end, registered: customerChange(registered, previousRegistered), mau: customerChange(activity.counts.mau, activity.counts.previousMau), newUsers: customerChange(newUsers, previousNew) },
    activityWindows: Object.fromEntries(["dau", "wau", "mau"].map(key => [key, windows[key]])),
    growth, daily: activity.daily,
  };
}
