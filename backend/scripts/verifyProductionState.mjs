import { getMongoDb, closeMongoConnection } from "../services/mongo.service.js";
import { getCustomerAnalytics } from "../services/customerAnalytics.service.js";
import dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });

async function verify() {
  const db = await getMongoDb();
  console.log("=== BẮT ĐẦU KIỂM TRA HỆ THỐNG SAU KHI APPLY ===");

  const totalUsers = await db.collection("users").countDocuments();
  const demoUsers = await db.collection("users").countDocuments({ name: { $regex: "Demo", $options: "i" } });
  const invalidEmailUsers = await db.collection("users").countDocuments({ email: { $regex: "example\\.invalid$", $options: "i" } });
  const simUsers = await db.collection("users").countDocuments({ "simulation.isSimulation": true });
  const simEvents = await db.collection("shop_events").countDocuments({ "metadata.isSimulation": true });
  const simBatchEvents = await db.collection("shop_events").countDocuments({ "metadata.simulationBatch": { $exists: true } });

  console.log("1. Kiểm tra tài khoản người dùng:");
  console.log("   - Tổng tài khoản:", totalUsers);
  console.log("   - Tài khoản có tên chứa 'Demo':", demoUsers);
  console.log("   - Tài khoản có email '@example.invalid':", invalidEmailUsers);
  console.log("   - Tài khoản có cờ 'simulation':", simUsers);

  console.log("\n2. Kiểm tra sự kiện hoạt động:");
  console.log("   - Sự kiện có cờ 'isSimulation':", simEvents);
  console.log("   - Sự kiện có cờ 'simulationBatch':", simBatchEvents);

  console.log("\n3. Thống kê Customer Analytics (API Admin):");
  const analytics = await getCustomerAnalytics({ query: { range: "30d" }, db });
  console.log("   - Tổng tài khoản (summary.total):", analytics.summary.total);
  console.log("   - Tài khoản hoạt động trong kỳ:", analytics.summary.activeInRange);
  console.log("   - Tỷ lệ hoạt động (summary.activityRate):", analytics.summary.activityRate + "%");
  console.log("   - DAU:", analytics.insights.dau);
  console.log("   - WAU:", analytics.insights.wau);
  console.log("   - MAU:", analytics.insights.mau);
  console.log("   - Lượt xem sản phẩm (product_view):", analytics.usage.product_view);
  console.log("   - Lượt AI Stylist gợi ý (stylist_product_recommended):", analytics.usage.stylist_product_recommended);
  console.log("   - Lượt bắt đầu thử đồ (tryon_started):", analytics.usage.tryon_started);
  console.log("   - Lượt phản hồi sản phẩm (product_feedback):", analytics.usage.product_feedback);

  console.log("\n4. Thống kê Try-on theo Shop (Top 5):");
  const tryOns = await db.collection("shop_events").aggregate([
    { $match: { eventType: "tryon_started" } },
    { $group: { _id: "$shopId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]).toArray();

  const shops = await db.collection("shops").find({}).toArray();
  const shopMap = new Map(shops.map(s => [s.id, s.name]));
  for (const t of tryOns) {
    console.log(`   - ${shopMap.get(t._id) || t._id}: ${t.count} lượt`);
  }

  console.log("\n5. Mẫu 5 khách hàng mới cập nhật trong danh sách Admin:");
  const sampleNew = await db.collection("users").find({}).sort({ createdAt: -1 }).limit(5).toArray();
  sampleNew.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.name} | ${u.email} | ${u.phone} | Trạng thái: ${u.status} | Hồ sơ: ${u.profileCompleted ? 'Đã hoàn tất' : 'Chưa'}`);
  });

  const success = (
    totalUsers === 181 &&
    demoUsers === 0 &&
    invalidEmailUsers === 0 &&
    simUsers === 0 &&
    simEvents === 0 &&
    analytics.insights.mau === 161 &&
    analytics.insights.wau === 118 &&
    analytics.insights.dau === 33
  );

  console.log(`\nKết quả xác minh: ${success ? "HOÀN TOÀN HỢP LỆ VÀ ĐẠT CHUẨN PRODUCTION!" : "CHƯA ĐẠT CHUẨN!"}`);
  await closeMongoConnection();
}

verify().catch(console.error);
