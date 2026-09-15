import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
import dotenv from "dotenv";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";
import { getShopDashboard } from "../services/shopAnalytics.service.js";
import { getGrowthAdvice } from "../services/shopAdvice.service.js";
import { MOCK_SEED, SCENARIOS } from "./shopSimulationData.js";

dotenv.config();
try {
  const db = await getMongoDb();
  const shopIds = await db.collection("orders").distinct("shopId", { mockSeed: MOCK_SEED });
  const shops = await db.collection("shops").find({ id: { $in: shopIds } }).sort({ slug: 1 }).toArray();
  const output = [];
  for (const shop of shops) {
    const sample = await db.collection("orders").findOne({ shopId: shop.id, mockSeed: MOCK_SEED });
    const scenario = SCENARIOS.find((entry) => entry.id === sample?.mockScenario);
    assert.equal(await db.collection("orders").countDocuments({ shopId: shop.id, mockSeed: MOCK_SEED }), scenario?.orders, "Simulation must not duplicate orders on re-run.");
    const ranges = [];
    for (const range of ["7d", "30d", "90d"]) {
      const dashboard = await getShopDashboard({ ownerId: shop.ownerId, range });
      assert.equal(dashboard.shop.id, shop.id);
      assert.ok(dashboard.summary.totalOrders > 0);
      assert.ok(dashboard.dataQuality.mockOrderCount > 0);
      ranges.push({ range, orders: dashboard.summary.totalOrders, mockOrders: dashboard.dataQuality.mockOrderCount, paidOrders: dashboard.summary.paidOrders, revenue: dashboard.summary.collectedRevenue, margin: dashboard.finance.marginRate, fitFeedback: dashboard.fitFinder.feedback.total, returns: dashboard.fitFinder.totalReturns });
    }
    const report = await getGrowthAdvice(shop.ownerId, "30d");
    assert.equal(report.version, 2);
    assert.equal(report.range, "30d");
    assert.equal(report.sections.length, 3);
    assert.ok(report.dataQuality.containsMockData);
    assert.equal((await getGrowthAdvice(shop.ownerId, "30d")).id, report.id);
    assert.ok(report.sections.every((section) => section.evidence.every((item) => item.source && item.formula)));
    output.push({ shop: shop.name, source: report.source, ranges });
    if (process.argv.includes("--export-preview") && output.length === 1) {
      const folder = new URL("../../.tmp-shop-advice/", import.meta.url);
      await mkdir(folder, { recursive: true });
      // Export only the report rendered in the UI, never owner or customer data.
      const { ownerId, key, _id, data, ...preview } = report;
      await writeFile(new URL("report.json", folder), JSON.stringify(preview, null, 2));
    }
  }
  assert.ok(output.length > 0, "No simulated shops were found.");
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
