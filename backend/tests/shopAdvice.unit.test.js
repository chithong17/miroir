import assert from "node:assert/strict";
import test from "node:test";
import { buildShopDashboard } from "../services/shopAnalytics.service.js";
import { applyAdviceRanking, buildAdviceReport } from "../services/shopAdviceReport.service.js";
import { buildShopSimulation, SCENARIOS } from "../scripts/shopSimulationData.js";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../services/commerce.service.js";

const shop = { id: "test-shop", ownerId: "test-owner", name: "Shop thử nghiệm" };
const aggregate = (data = {}) => buildShopDashboard({ shop, analytics: { summary: {} }, ...data });
const line = (variantId, quantity = 1) => ({ productId: "p1", name: "Áo", variantId, quantity, unitPrice: 100000, lineTotal: quantity * 100000 });
const order = (id, status, items = [line("m")]) => ({ id, paymentStatus: status, orderStatus: "delivered", subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0), total: items.reduce((sum, item) => sum + item.lineTotal, 0), createdAt: new Date(), items });

test("AOV and best sellers count paid orders only, each product once per order", () => {
  const dashboard = aggregate({ orders: [order("paid", "paid", [line("m"), line("l", 2)]), order("pending", "cod_pending"), { ...order("cancelled", "cod_pending"), orderStatus: "cancelled" }, { ...order("expired", "awaiting_transfer"), orderStatus: "expired" }] });
  assert.equal(dashboard.summary.averageOrderValue, 300000);
  assert.equal(dashboard.summary.paidOrders, 1);
  assert.equal(dashboard.summary.projectedRevenue, 100000);
  assert.equal(dashboard.topProducts[0].quantity, 3);
  assert.equal(dashboard.topProducts[0].orderCount, 1);
  assert.equal(dashboard.topProducts[0].collectedRevenue, 300000);
});

test("missing lines in a cost snapshot prevent unsupported margin claims", () => {
  const dashboard = aggregate({ orders: [order("o1", "paid", [line("m"), line("l", 2)])], costSnapshots: [{ orderId: "o1", items: [{ variantId: "m", quantity: 1, costPrice: 60000 }] }] });
  assert.equal(dashboard.finance.missingCostItems, 2);
  assert.equal(dashboard.finance.marginRate, null);
  assert.equal(buildAdviceReport(dashboard).sections.find((item) => item.id === "pricing").status, "insufficient");
});

test("refunded units remove both revenue and their cost from gross profit", () => {
  const dashboard = aggregate({ orders: [order("o1", "paid", [line("m", 2)])], costSnapshots: [{ orderId: "o1", items: [{ variantId: "m", quantity: 2, costPrice: 60000 }] }], financeReturns: [{ orderId: "o1", refundAmount: 100000, items: [{ variantId: "m", quantity: 1 }] }] });
  assert.equal(dashboard.finance.eligibleRevenue, 100000);
  assert.equal(dashboard.finance.knownCost, 60000);
  assert.equal(dashboard.finance.grossProfit, 40000);
  assert.equal(dashboard.finance.marginRate, 0.4);
});

test("zero-data report supplies collection actions and never NaN or an invented margin", () => {
  const report = buildAdviceReport(aggregate());
  assert.equal(report.sections.length, 3);
  assert.ok(report.sections.every((section) => section.status === "insufficient" && section.actions.length > 0));
  assert.doesNotMatch(JSON.stringify(report), /NaN|Infinity|undefined/);
});

test("return evidence uses requests as its denominator, not sales", () => {
  const report = buildAdviceReport(aggregate({ returns: [{ reasonCode: "size_or_fit" }, { reasonCode: "other" }] }));
  const source = report.sections.find((section) => section.id === "sizing").evidence.find((item) => item.id === "size-returns");
  assert.equal(source.value, "1 / 2 yêu cầu");
  assert.match(source.formula, /không phải tỷ lệ trên đơn/);
});

test("AI can only reorder verified sections, rejecting missing, duplicate or invented IDs", () => {
  const report = buildAdviceReport(aggregate());
  for (const invalid of [null, [], ["pricing", "pricing", "promotion"], ["sizing", "pricing", "invented"]]) assert.equal(applyAdviceRanking(report, invalid), report);
  const ranked = applyAdviceRanking(report, ["promotion", "pricing", "sizing"]);
  assert.equal(ranked.source, "ai_ranked");
  assert.deepEqual(ranked.sections[0], report.sections.find((section) => section.id === "promotion"));
});

test("simulation IDs are repeatable, scoped by shop, and have consistent order/refund totals", () => {
  const now = new Date("2026-09-15T12:00:00Z");
  for (const scenario of SCENARIOS) {
    const first = buildShopSimulation({ shop, scenario, now }).collections;
    const second = buildShopSimulation({ shop, scenario, now }).collections;
    assert.deepEqual(first, second);
    const other = buildShopSimulation({ shop: { ...shop, id: "other" }, scenario, now }).collections;
    assert.notEqual(first.orders[0].id, other.orders[0].id);
    for (const docs of Object.values(first)) {
      assert.equal(new Set(docs.map((doc) => doc.id)).size, docs.length);
      assert.ok(docs.every((doc) => doc.mockSeed && doc.shopId === shop.id && new Date(doc.createdAt) <= now));
    }
    for (const sale of first.orders) {
      assert.ok(PAYMENT_STATUSES.includes(sale.paymentStatus));
      assert.ok(ORDER_STATUSES.includes(sale.orderStatus));
      assert.equal(sale.total, sale.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
      assert.equal(sale.commissionRateSnapshot, 0);
      assert.equal(sale.billingSyncNeededAt, undefined);
    }
    for (const refund of first.order_returns) {
      const sale = first.orders.find((item) => item.id === refund.orderId);
      assert.ok(sale && refund.refundAmount <= sale.total);
      assert.ok(refund.createdAt > sale.deliveredAt);
    }
    const dashboard = aggregate({ orders: first.orders, products: first.products, fitEvents: first.fit_events, fitFeedback: first.fit_feedback, returns: first.order_returns, financeReturns: first.order_returns, costSnapshots: first.order_cost_snapshots });
    assert.equal(dashboard.dataQuality.mockOrderCount, scenario.orders);
    assert.equal(dashboard.dataQuality.realOrderCount, 0);
    const report = buildAdviceReport(dashboard);
    assert.equal(report.sections.find((item) => item.id === "pricing").status, scenario.costRatio == null ? "insufficient" : "observed");
    if (scenario.id === "size_attention") assert.equal(report.sections[0].id, "sizing");
  }
});

test("simulation covers 7, 30 and 90 days and retains real catalog fields", () => {
  const now = new Date("2026-09-15T12:00:00Z");
  const product = { id: "real-product", name: "Áo thực tế", price: 555000, variants: [{ id: "v", size: "L", color: "white" }] };
  const original = structuredClone(product);
  const { collections } = buildShopSimulation({ shop, products: [product], now });
  assert.deepEqual(product, original);
  assert.equal(collections.products.length, 0);
  const counts = [7, 30, 90].map((days) => collections.orders.filter((sale) => sale.createdAt >= new Date(now.getTime() - days * 86400000)).length);
  assert.ok(counts[0] > 0 && counts[1] > counts[0] && counts[2] > counts[1]);
  assert.equal(collections.orders[0].items[0].unitPrice, product.price);
});
