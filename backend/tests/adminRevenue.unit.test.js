import assert from "node:assert/strict";
import test from "node:test";
import { parseRevenueRange, summarizeRevenueData } from "../services/adminRevenue.service.js";

const owners = [{ id: "owner-1", name: "Thong", email: "shop@example.test", subscription: { planCode: "GROWTH", status: "active", expiresAt: new Date("2099-01-01") } }];
const shops = [{ id: "shop-1", ownerId: "owner-1", name: "Thong Fashion" }];
const plans = [{ code: "GROWTH", name: "Growth" }];

test("revenue uses paid payment amounts and does not count free grants", () => {
  const result = summarizeRevenueData({ owners, shops, plans, orders: [
    { id: "p1", status: "paid", accountId: "owner-1", planCode: "GROWTH", amount: 300000, paidAt: new Date("2026-11-10T03:00:00Z"), planSnapshot: { name: "Growth" } },
    { id: "free", status: "paid", accountId: "owner-1", planCode: "GROWTH", amount: 0, grantType: "admin_grant", paidAt: new Date("2026-11-10T04:00:00Z") },
    { id: "pending", status: "pending", accountId: "owner-1", planCode: "GROWTH", amount: 349000, createdAt: new Date("2026-11-10T05:00:00Z") },
    { id: "user-payment", status: "paid", accountId: "user-1", accountType: "user", planCode: "USER_PREMIUM_MONTHLY", amount: 49000, paidAt: new Date("2026-11-10T05:00:00Z") },
  ] });
  assert.equal(result.summary.grossCollected, 300000);
  assert.equal(result.summary.paidTransactions, 1);
  assert.equal(result.plans[0].grantedSubscriptions, 1);
  assert.equal(result.shops[0].total, 300000);
});

test("paid invoice is split into overage and commission without double counting", () => {
  const invoices = [{ id: "inv-1", ownerId: "owner-1", amount: 45000, status: "paid", entries: [
    { type: "tryon_overage", amount: 25000 }, { type: "commission", amount: 20000 },
  ] }];
  const orders = [{ id: "p2", status: "paid", accountId: "owner-1", planCode: "INVOICE", invoiceId: "inv-1", amount: 45000, paidAt: new Date("2026-11-10T03:00:00Z") }];
  const result = summarizeRevenueData({ owners, shops, plans, orders, invoices });
  assert.equal(result.summary.grossCollected, 45000);
  assert.equal(result.summary.overageRevenue, 25000);
  assert.equal(result.summary.commissionRevenue, 20000);
  assert.equal(result.summary.planRevenue, 0);
});

test("report range is inclusive by local calendar day and capped", () => {
  const range = parseRevenueRange({ from: "2026-11-01", to: "2026-11-30" });
  assert.equal(range.from.toISOString(), "2026-10-31T17:00:00.000Z");
  assert.equal(range.toExclusive.toISOString(), "2026-11-30T17:00:00.000Z");
  assert.throws(() => parseRevenueRange({ from: "2025-01-01", to: "2026-12-31" }), /366/);
});

