import dotenv from "dotenv";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";
import { buildShopSimulation, MOCK_SEED, SCENARIOS } from "./shopSimulationData.js";

dotenv.config();
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const all = args.includes("--all");
const query = args.find((arg) => !arg.startsWith("--")) || process.env.MOCK_SHOP_QUERY || "shop-a";

try {
  const db = await getMongoDb();
  const shops = await db.collection("shops").find(all ? { status: "active" } : { $or: [{ id: query }, { slug: query }, { name: query }] }).sort({ slug: 1, id: 1 }).toArray();
  if (!shops.length) throw new Error(`Không tìm thấy shop "${query}". Dùng id/slug/tên chính xác hoặc --all.`);
  const summary = [];
  for (const [index, shop] of shops.entries()) {
    const existing = await db.collection("orders").findOne({ shopId: shop.id, mockSeed: MOCK_SEED });
    const scenario = SCENARIOS.find((entry) => entry.id === existing?.mockScenario) || SCENARIOS[index % SCENARIOS.length];
    const products = await db.collection("products").find({ shopId: shop.id, status: { $nin: ["trashed", "archived"] }, mockSeed: { $ne: MOCK_SEED } }).sort({ id: 1 }).limit(6).toArray();
    const simulation = buildShopSimulation({ shop, products, scenario });
    if (apply) {
      // Only this shop's tagged simulation is updated. Billing, stock and
      // notifications are not invoked by this analytics fixture.
      for (const [collection, docs] of Object.entries(simulation.collections)) {
        if (!docs.length) continue;
        await db.collection(collection).bulkWrite(docs.map((doc) => ({ replaceOne: { filter: { id: doc.id, shopId: shop.id, mockSeed: MOCK_SEED }, replacement: doc, upsert: true } })));
      }
    }
    summary.push({ shop: shop.name, shopId: shop.id, scenario: scenario.name, ...Object.fromEntries(Object.entries(simulation.collections).map(([name, docs]) => [name, docs.length])) });
  }
  console.log(JSON.stringify({ mode: apply ? "applied" : "preview", mockSeed: MOCK_SEED, shops: summary }, null, 2));
  console.log(apply ? "Mở Thống kê > Gợi ý kinh doanh, chọn 7/30/90 ngày để xem phân tích. Gợi ý tự làm mới khi số liệu thay đổi." : "Thêm --apply để ghi dữ liệu mô phỏng. Chạy lại cập nhật cùng các bản ghi, không nhân đôi.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
