import test from "node:test";
import assert from "node:assert/strict";
import { customerChange, customerInsightWindows, mergeCustomerActivity } from "../services/customerInsights.service.js";
import { customerReportingWindow } from "../services/customerAnalytics.service.js";

test("DAU WAU MAU use Vietnam calendar days and end at the selected endpoint", () => {
  const now = new Date("2026-10-28T03:00:00Z");
  const windows = customerInsightWindows(customerReportingWindow({ range: "30d" }, now));
  assert.equal(windows.dau.start.toISOString(), "2026-10-27T17:00:00.000Z");
  assert.equal(windows.wau.start.toISOString(), "2026-10-21T17:00:00.000Z");
  assert.equal(windows.mau.start.toISOString(), "2026-09-28T17:00:00.000Z");
  assert.equal(windows.mau.end, now);
  assert.equal(windows.previous.end.getTime() + 1, windows.selected.start.getTime());
  assert.equal(windows.previous.end - windows.previous.start, windows.selected.end - windows.selected.start);
  const september = customerInsightWindows(customerReportingWindow({ month: "2026-09" }, now));
  assert.equal(september.dau.start.toISOString(), "2026-09-29T17:00:00.000Z");
});

test("activities and orders deduplicate users across sources and days, orders are not feature events", () => {
  const windows = { dau: {}, wau: {}, mau: {}, selected: {}, previous: {}, previousMau: {} };
  const daily = [{ date: "2026-10-27" }, { date: "2026-10-28" }, { date: "2026-10-29" }];
  const events = { source: "shop_events", result: {
    periods: [{ _id: "a", dau: 1, wau: 1, mau: 1 }, { _id: "b", wau: 1, mau: 1 }],
    daily: [{ _id: "2026-10-27", userIds: ["a", "b"], count: 8 }, { _id: "2026-10-28", userIds: ["a"], count: 4 }],
  } };
  const orders = { source: "orders", result: {
    periods: [{ _id: "a", dau: 1, wau: 1, mau: 1 }, { _id: "c", wau: 1, mau: 1 }],
    daily: [{ _id: "2026-10-27", userIds: ["a", "c"], count: 2 }],
  } };
  const result = mergeCustomerActivity([events, orders], windows, daily);
  assert.equal(result.counts.dau, 1);
  assert.equal(result.counts.wau, 3);
  assert.equal(result.counts.mau, 3);
  assert.deepEqual(result.daily, [{ date: "2026-10-27", activeUsers: 3, featureEvents: 8 }, { date: "2026-10-28", activeUsers: 1, featureEvents: 4 }, { date: "2026-10-29", activeUsers: 0, featureEvents: 0 }]);
});

test("period comparison handles increases, decreases and a zero baseline without infinity", () => {
  assert.equal(customerChange(98, 80).percent, 22.5);
  assert.equal(customerChange(8, 10).percent, -20);
  assert.equal(customerChange(5, 0).percent, null);
  assert.equal(customerChange(0, 0).percent, 0);
});
