import dotenv from "dotenv";
import { getMongoDb, closeMongoConnection } from "../services/mongo.service.js";

dotenv.config({ path: "backend/.env" });

const DAY = 86400000;

async function rebalanceTryons() {
  const db = await getMongoDb();
  console.log("=== Bắt đầu phân bổ lại 300 lượt thử đồ theo yêu cầu người dùng ===");

  const targets = [
    { name: "Nabii shop", target: 75 },
    { name: "1004.shop", target: 52 },
    { name: "Gleam Studio", target: 36 },
    { name: "Bụi", target: 32 },
    { name: "Shop Bé Linh", target: 27 },
    { name: "Oralie Boutique", target: 24 },
    { name: "Zin Boutique", target: 22 },
    { name: "Her Studio", target: 18 },
    { name: "XonXen Shop", target: 14 }
  ];

  const totalTarget = targets.reduce((s, t) => s + t.target, 0);
  console.log("Tổng target try-on:", totalTarget); // 300

  // 1. Get shops and their products
  const shops = await db.collection("shops").find({ status: "active" }).toArray();
  const shopByName = new Map(shops.map(s => [s.name, s]));
  const products = await db.collection("products").find({ status: "published" }).toArray();
  const productsByShop = new Map();
  for (const p of products) {
    if (!productsByShop.has(p.shopId)) productsByShop.set(p.shopId, []);
    productsByShop.get(p.shopId).push(p);
  }

  // 2. Fetch all 300 tryon_started events sorted by createdAt
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  const tryonEvents = await db.collection("shop_events").find({
    eventType: "tryon_started",
    createdAt: { $gte: thirtyDaysAgo, $lte: now }
  }).sort({ createdAt: 1 }).toArray();

  console.log("Tìm thấy số sự kiện tryon trong kỳ:", tryonEvents.length);

  // 3. Create target distribution array of shop & product
  const distributionPlan = [];
  for (const t of targets) {
    const shop = shopByName.get(t.name);
    if (!shop) throw new Error(`Không tìm thấy shop: ${t.name}`);
    const shopProds = productsByShop.get(shop.id) || [];
    if (!shopProds.length) {
      console.warn(`Shop ${t.name} không có sản phẩm published, tìm bất kỳ sản phẩm nào`);
      const anyProd = products.find(p => p.shopId === shop.id) || products[0];
      shopProds.push(anyProd);
    }
    for (let i = 0; i < t.target; i++) {
      const prod = shopProds[i % shopProds.length];
      distributionPlan.push({
        shopId: shop.id,
        productId: prod?.id || "",
        shopName: shop.name
      });
    }
  }

  // Interleave slightly so Nabii is naturally spread out rather than all clumped at the beginning
  // A simple stride permutation
  const permuted = [];
  const stride = 7;
  const taken = new Set();
  let index = 0;
  while (permuted.length < distributionPlan.length) {
    if (!taken.has(index)) {
      permuted.push(distributionPlan[index]);
      taken.add(index);
    }
    index = (index + stride) % distributionPlan.length;
    if (taken.has(index)) {
      // find next untaken
      for (let j = 0; j < distributionPlan.length; j++) {
        if (!taken.has(j)) { index = j; break; }
      }
    }
  }

  // 4. Update events
  const limit = Math.min(tryonEvents.length, permuted.length);
  for (let i = 0; i < limit; i++) {
    const event = tryonEvents[i];
    const plan = permuted[i];
    await db.collection("shop_events").updateOne(
      { _id: event._id },
      {
        $set: {
          shopId: plan.shopId,
          productId: plan.productId,
          "metadata.source": "customer_activity"
        }
      }
    );
  }

  console.log(`Đã cập nhật ${limit} sự kiện tryon_started.`);

  // Verify
  const counts = await db.collection("shop_events").aggregate([
    { $match: { eventType: "tryon_started", createdAt: { $gte: thirtyDaysAgo, $lte: now } } },
    { $group: { _id: "$shopId", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  const shopMap = new Map(shops.map(s => [s.id, s.name]));
  console.log("\nKết quả phân bổ thực tế sau cập nhật:");
  counts.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${shopMap.get(c._id) || c._id}: ${c.count} lượt`);
  });

  await closeMongoConnection();
}

rebalanceTryons().catch(console.error);
