import assert from "node:assert/strict";
import test from "node:test";
import { calculateWelcomeDiscount, claimWelcomeOffer, createWelcomeOffer, restoreWelcomeOffer, returnDiscountAmount } from "../services/welcomeOffer.service.js";
import { toPublicUser } from "../services/userAuth.service.js";

const item = (price, quantity = 1, available = true) => ({
  productId: `p${price}`, variantId: `v${price}`, product: { name: "Test", price }, quantity, available,
});
const groups = [
  { shop: { id: "a" }, items: [item(100000, 10)] },
  { shop: { id: "b" }, items: [item(250001, 3), item(900000, 1, false)] },
];

test("new gift is public and existing accounts do not receive a retroactive gift", () => {
  const offer = createWelcomeOffer(new Date("2026-10-27"));
  assert.equal(offer.status, "available");
  assert.equal(offer.percent, 40);
  assert.deepEqual(toPublicUser({ welcomeOffer: offer }).welcomeOffer, offer);
  assert.equal(toPublicUser({}).welcomeOffer, null);
});

test("40% applies to exactly one highest-priced available unit across shops", () => {
  const discount = calculateWelcomeDiscount(groups, createWelcomeOffer());
  assert.equal(discount.shopId, "b");
  assert.equal(discount.amount, 100000);
  assert.equal(discount.quantity, 1);
  assert.equal(discount.productId, "p250001");
});

test("used, missing, empty and unavailable gifts produce no discount", () => {
  assert.equal(calculateWelcomeDiscount(groups, null), null);
  assert.equal(calculateWelcomeDiscount(groups, { status: "redeemed" }), null);
  assert.equal(calculateWelcomeDiscount([], createWelcomeOffer()), null);
  assert.equal(calculateWelcomeDiscount([{ shop: { id: "a" }, items: [item(100, 1, false)] }], createWelcomeOffer()), null);
});

test("atomic claim allows only one checkout and restore is scoped to its order", async () => {
  let offer = createWelcomeOffer();
  const session = {};
  const db = { collection(name) {
    assert.equal(name, "users");
    return { async updateOne(filter, update, options) {
      assert.equal(options.session, session);
      if (filter["welcomeOffer.status"] !== offer.status ||
          (filter["welcomeOffer.redeemedOrderId"] && filter["welcomeOffer.redeemedOrderId"] !== offer.redeemedOrderId)) return { modifiedCount: 0 };
      for (const [key, value] of Object.entries(update.$set)) offer[key.split(".")[1]] = value;
      return { modifiedCount: 1 };
    } };
  } };
  const results = await Promise.allSettled(["one", "two"].map(orderId => claimWelcomeOffer({ db, session, userId: "u", orderId, now: new Date() })));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(results.find(r => r.status === "rejected").reason.statusCode, 409);
  await restoreWelcomeOffer({ db, session, order: { id: "two", userId: "u", discount: { type: "welcome" } } });
  assert.equal(offer.status, "redeemed");
  await restoreWelcomeOffer({ db, session, order: { id: "one", userId: "u", discount: { type: "welcome" } } });
  assert.equal(offer.status, "available");
});

test("partial returns never refund the discount and preserve integer VND totals", () => {
  const source = { productId: "p", variantId: "v", quantity: 3 };
  const order = { discount: { type: "welcome", productId: "p", variantId: "v", amount: 100000 } };
  const parts = [0, 1, 2].map(reserved => returnDiscountAmount(order, source, 1, reserved));
  assert.equal(parts.reduce((a, b) => a + b, 0), 100000);
  assert.equal(returnDiscountAmount(order, source, 3), 100000);
  assert.equal(returnDiscountAmount(order, { ...source, variantId: "other" }, 1), 0);
});
