import assert from "node:assert/strict";
import test from "node:test";
import { RETURN_STATUSES, getReturnDeliveryDate, isReturnWindowOpen } from "../services/return.service.js";

test("return workflow declares the complete manual-return state machine", () => {
  assert.deepEqual(RETURN_STATUSES, ["requested", "approved", "rejected", "return_shipped", "received", "refund_pending", "refunded", "disputed"]);
});

test("return window uses deliveredAt and falls back to delivered history for legacy orders", () => {
  const now = new Date("2026-08-07T00:00:00.000Z").getTime();
  const legacy = { statusHistory: [{ status: "shipping", createdAt: new Date("2026-07-30") }, { status: "delivered", createdAt: new Date("2026-08-01T00:00:00.000Z") }] };
  assert.equal(getReturnDeliveryDate(legacy).toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(isReturnWindowOpen(legacy, now), true);
  assert.equal(isReturnWindowOpen({ deliveredAt: new Date("2026-07-30T23:59:59.999Z") }, now), false);
});
