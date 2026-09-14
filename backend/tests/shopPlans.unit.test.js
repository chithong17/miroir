import test from "node:test";
import assert from "node:assert/strict";
import { addMonth, PAYMENT_PLANS } from "../services/subscription.service.js";
import { commissionTarget, overageDelta, quotePlanChange } from "../services/billing.service.js";
import { normalizeProductPayload, toPublicProduct } from "../services/product.service.js";
import { findResultUrls } from "../utils/findResultUrl.js";
import { requireActiveShopSubscription, requireGrowthShopSubscription, requireProShopSubscription } from "../middlewares/subscription.middleware.js";
import { isTrialEligible } from "../services/planGrant.service.js";

test("monthly cycles clamp dates at the end of short months", () => {
  assert.equal(addMonth(new Date("2026-01-31T10:20:00Z")).toISOString(), "2026-02-28T10:20:00.000Z");
  assert.equal(addMonth(new Date("2028-01-31T10:20:00Z")).toISOString(), "2028-02-29T10:20:00.000Z");
  assert.equal(addMonth(new Date("2026-02-28T10:20:00Z"), 31).toISOString(), "2026-03-31T10:20:00.000Z");
});

test("four shop plans expose fixed quotas, overage prices and commission", () => {
  assert.deepEqual(Object.values(PAYMENT_PLANS).map(({ amount, commissionRate, tryOnQuota, overagePrice }) => [amount, commissionRate, tryOnQuota, overagePrice]), [
    [99000, 0.025, 30, 3000], [199000, 0, 30, 3000], [349000, 0, 60, 2500], [599000, 0, 120, 2000],
  ]);
});

test("plan switch prorates the unused period and carries excess credit", async () => {
  const now = Date.now();
  const quote = await quotePlanChange({
    owner: { subscription: { planCode: "PRO_INSIGHT", status: "active", startsAt: new Date(now - 10 * 86400000), expiresAt: new Date(now + 20 * 86400000), amountPaid: 599000, creditBalance: 5000 } },
    plan: PAYMENT_PLANS.STARTER_A,
  });
  assert.equal(quote.payable, 0);
  assert.ok(quote.remainingCredit > 300000);
});

test("prepaid renewal becomes credit when switching plans immediately", async () => {
  const now = Date.now();
  const quote = await quotePlanChange({ owner: { subscription: { planCode: "STARTER_A", status: "active", startsAt: new Date(now - 15 * 86400000), expiresAt: new Date(now + 15 * 86400000), amountPaid: 99000, pendingRenewal: { planSnapshot: PAYMENT_PLANS.STARTER_A } } }, plan: PAYMENT_PLANS.GROWTH });
  assert.equal(quote.prepaidRenewalCredit, 99000);
  assert.ok(quote.payable < 349000);
});

test("free grants replace the current period and retain paid time as credit", async () => {
  const now = Date.now();
  const owner = { subscription: { planCode: "GROWTH", status: "active", startsAt: new Date(now - 10 * 86400000), expiresAt: new Date(now + 20 * 86400000), amountPaid: 349000 } };
  const quote = await quotePlanChange({ owner, plan: { ...PAYMENT_PLANS.GROWTH, amount: 0 }, forceChange: true });
  assert.equal(quote.payable, 0);
  assert.ok(quote.remainingCredit > 200000);
  assert.equal(quote.proratedCredit, quote.remainingCredit);
});

test("trial is available only before the first activated plan", () => {
  assert.equal(isTrialEligible({}), true);
  assert.equal(isTrialEligible({ trialUsedAt: new Date() }), false);
  assert.equal(isTrialEligible({ subscription: { planCode: "STARTER_A", status: "inactive" } }), false);
});

test("cost price validates per SKU and is hidden from public product DTOs", () => {
  const product = { id: "p", variants: [{ id: "v", sku: "SKU", size: "M", color: "", stockQuantity: 1, costPrice: 120000, active: true }] };
  assert.equal(toPublicProduct(product).variants[0].costPrice, undefined);
  assert.equal(toPublicProduct(product, { includeCost: true }).variants[0].costPrice, 120000);
  const invalid = normalizeProductPayload({ variants: [{ sku: "SKU", size: "M", color: "", stockQuantity: 1, costPrice: -1 }] }, { partial: true });
  assert.match(invalid.errors.join(" "), /costPrice/);
  const omitted = normalizeProductPayload({ variants: [{ sku: "SKU", size: "M", color: "", stockQuantity: 1 }] }, { partial: true });
  assert.equal(Object.prototype.hasOwnProperty.call(omitted.normalized.variants[0], "costPrice"), false);
});

test("Try-On results count distinct generated images", () => {
  assert.deepEqual(findResultUrls({ images: [{ url: "https://img.test/a.png" }, { url: "https://img.test/b.png" }, { url: "https://img.test/a.png" }] }), ["https://img.test/a.png", "https://img.test/b.png"]);
});

test("overage only charges the images beyond remaining quota", () => {
  assert.equal(overageDelta({ before: 29, added: 4, quota: 30 }), 3);
  assert.equal(overageDelta({ before: 12, added: 2, quota: 30 }), 0);
});

test("commission accrues on delivered paid goods and reverses refunded goods", () => {
  assert.equal(commissionTarget({ subtotal: 100000, rate: 0.025, orderStatus: "preparing", paymentStatus: "paid" }), 0);
  assert.equal(commissionTarget({ subtotal: 100000, rate: 0.025, orderStatus: "delivered", paymentStatus: "paid" }), 2500);
  assert.equal(commissionTarget({ subtotal: 100000, rate: 0.025, orderStatus: "delivered", paymentStatus: "paid", refundedAmount: 40000 }), 1500);
  assert.equal(commissionTarget({ subtotal: 100000, rate: 0.025, orderStatus: "delivered", paymentStatus: "refunded" }), 0);
});

test("shop API gates distinguish basic, Growth and Pro rights", () => {
  const check = (middleware, planCode, status = "active") => {
    let allowed = false; let responseStatus = null;
    middleware({ owner: { subscription: { planCode, status, expiresAt: new Date(Date.now() + 86400000) } } }, { status(code) { responseStatus = code; return this; }, json() { return this; } }, () => { allowed = true; });
    return { allowed, responseStatus };
  };
  assert.equal(check(requireActiveShopSubscription, "STARTER_A").allowed, true);
  assert.equal(check(requireGrowthShopSubscription, "STARTER_A").responseStatus, 403);
  assert.equal(check(requireGrowthShopSubscription, "GROWTH").allowed, true);
  assert.equal(check(requireProShopSubscription, "GROWTH").responseStatus, 403);
  assert.equal(check(requireProShopSubscription, "PRO_INSIGHT").allowed, true);
  assert.equal(check(requireActiveShopSubscription, "PRO_INSIGHT", "suspended").responseStatus, 403);
});
