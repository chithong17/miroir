import { test } from "node:test";
import assert from "node:assert/strict";
import { subscriptionState, hasCurrentPlan, normalizePlan, dateLabel } from "./adminMetrics.js";

const now = Date.parse("2026-10-20T05:00:00Z");
const owner = (patch = {}) => ({ subscription: { planCode: "GROWTH", status: "active", expiresAt: "2026-11-20T05:00:00Z", ...patch } });

test("only active, unexpired and unsuspended subscriptions count as current", () => {
  assert.equal(hasCurrentPlan(owner(), now), true);
  assert.equal(subscriptionState(owner({ expiresAt: "2026-10-27T05:00:00Z" }), now), "expiring");
  assert.equal(hasCurrentPlan(owner({ expiresAt: "2026-10-27T05:00:00Z" }), now), true);
  assert.equal(subscriptionState(owner({ expiresAt: "2026-10-20T05:00:00Z" }), now), "expired");
  assert.equal(hasCurrentPlan(owner({ suspendedAt: "2026-10-19T05:00:00Z" }), now), false);
  assert.equal(subscriptionState(owner({ status: "inactive" }), now), "inactive");
  assert.equal(hasCurrentPlan(owner({ expiresAt: "invalid" }), now), false);
});

test("free, unassigned and missing subscriptions never count as subscribed", () => {
  for (const value of [undefined, {}, { subscription: null }, owner({ planCode: "FREE" })]) {
    assert.equal(subscriptionState(value, now), "free");
    assert.equal(hasCurrentPlan(value, now), false);
  }
});

test("trials and admin grants retain their valid subscription status", () => {
  for (const grantType of ["trial", "admin_grant"]) assert.equal(hasCurrentPlan(owner({ grantType }), now), true);
  assert.equal(normalizePlan("SHOP_OWNER_MONTHLY"), "GROWTH");
  assert.equal(normalizePlan("PRO_INSIGHT"), "GROWTH");
  assert.equal(normalizePlan("STARTER_A"), "STARTER_A");
});

test("date labels handle missing dates and Vietnam midnight boundaries", () => {
  assert.equal(dateLabel(null), "—");
  assert.equal(dateLabel("invalid"), "—");
  assert.equal(dateLabel("2026-10-19T18:00:00Z"), "20/10/2026");
});
