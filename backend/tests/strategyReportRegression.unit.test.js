import test from "node:test";
import assert from "node:assert/strict";
import { getProStrategyReport } from "../services/shopAdvice.service.js";

for (const enoughData of [false, true]) {
  test(`strategy report saves its source data for ${enoughData ? "AI" : "demo"} reports`, async () => {
    const writes = [];
    const dashboard = { summary: { orders: enoughData ? 10 : 0 }, finance: {}, inventoryHealth: {}, topProducts: [] };
    const insights = { enoughData, breakdowns: { gender: [] }, message: "Not enough orders" };
    let generated = 0;
    const report = await getProStrategyReport({ ownerId: "owner", cycleId: "cycle" }, {
      getDb: async () => ({ collection: () => ({ findOne: async () => null, updateOne: async (...args) => writes.push(args) }) }),
      getDashboard: async () => dashboard,
      getInsights: async () => insights,
      generateReport: async ({ data }) => {
        generated += 1;
        assert.deepEqual(data.summary, dashboard.summary);
        return JSON.stringify({ additionalAdvice: "Advice", priorities: [] });
      },
    });
    assert.equal(writes.length, 1);
    assert.equal(writes[0][1].$set, report);
    assert.deepEqual(report.data.summary, dashboard.summary);
    assert.deepEqual(report.data.insights, enoughData ? insights.breakdowns : { enoughData: false, message: insights.message });
    assert.ok(report.structuredData);
    assert.equal(generated, enoughData ? 1 : 0);
  });
}
