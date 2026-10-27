import test from "node:test";
import assert from "node:assert/strict";
import { activeCarrierConfigs, defaultShippingRate, resolveCheckoutShipping } from "../services/shipping/defaultShipping.js";
import { calculateShippingRates, createShippingOrder } from "../services/shipping/shipping.service.js";
import { ShippingProviderFactory } from "../services/shipping/ShippingProviderFactory.js";

const database = (configs) => ({ collection(name) {
  assert.equal(name, "shop_shipping_configs");
  return { find: () => ({ toArray: async () => configs }) };
} });

test("default shipping is 10k and free only strictly above 500k", () => {
  for (const value of [0, 100000, 499999, 500000]) assert.equal(defaultShippingRate(value).fee, 10000);
  for (const value of [500001, 600000]) assert.equal(defaultShippingRate(value).fee, 0);
  assert.equal(defaultShippingRate(300000).provider, "DEFAULT");
  for (const invalid of [-1, NaN, Infinity, 1.5]) assert.throws(() => defaultShippingRate(invalid), { statusCode: 400 });
});

test("unset and disabled carrier configs expose a real default quote", async () => {
  for (const configs of [[], [{ provider: "GHN", is_active: false }], [{ provider: "GHTK", is_active: false }]]) {
    const rates = await calculateShippingRates("shop", { itemsValue: 500000 }, { db: database(configs) });
    assert.equal(rates.length, 1);
    assert.equal(rates[0].fee, 10000);
    assert.equal(rates[0].service_id, "SHOP_DEFAULT");
    const free = await calculateShippingRates("shop", { itemsValue: 500001 }, { db: database(configs) });
    assert.equal(free[0].fee, 0);
  }
});

test("checkout overrides any client fee with the server-side default policy", async () => {
  const args = { db: database([]), session: {}, shopId: "shop" };
  const paid = await resolveCheckoutShipping({ ...args, itemsValue: 360000, selected: { provider: "DEFAULT", fee: 0 } });
  assert.equal(paid.fee, 10000);
  const free = await resolveCheckoutShipping({ ...args, itemsValue: 600000, selected: { provider: "DEFAULT", fee: 999999 } });
  assert.equal(free.fee, 0);
  assert.equal((await resolveCheckoutShipping({ ...args, itemsValue: 100000 })).fee, 10000);
});

test("threshold is evaluated separately per shop using discounted merchandise value", async () => {
  const args = { db: database([]), session: {}, selected: null };
  const first = await resolveCheckoutShipping({ ...args, shopId: "a", itemsValue: 300000 });
  const second = await resolveCheckoutShipping({ ...args, shopId: "b", itemsValue: 300000 });
  assert.equal(first.fee + second.fee, 20000);
  // A 600k product with a 40% welcome discount leaves 360k of merchandise.
  assert.equal(defaultShippingRate(600000 - 240000).fee, 10000);
});

test("enabled carriers retain their selected fee and reject stale default selection", async () => {
  for (const provider of ["GHN", "GHTK"]) {
    const args = { db: database([{ provider, is_active: true }]), shopId: "shop", itemsValue: 900000 };
    const result = await resolveCheckoutShipping({ ...args, selected: { provider, service_id: "standard", fee: 25000 } });
    assert.equal(result.fee, 25000);
    for (const selected of [undefined, { provider: "DEFAULT", fee: 0 }, { provider, fee: -1 }, { provider, fee: null }]) {
      await assert.rejects(resolveCheckoutShipping({ ...args, selected }), { statusCode: 409 });
    }
  }
  assert.equal(activeCarrierConfigs([{ provider: "OTHER", is_active: true }]).length, 0);
});

test("carrier API failure does not silently switch to default shipping", async (t) => {
  const original = ShippingProviderFactory.getProvider;
  t.after(() => { ShippingProviderFactory.getProvider = original; });
  ShippingProviderFactory.getProvider = () => ({ calculateFee: async () => { throw new Error("test carrier unavailable"); } });
  await assert.rejects(calculateShippingRates("shop", { itemsValue: 900000 }, { db: database([{ provider: "GHN", is_active: true }]) }));
});

test("shop-managed default shipping creates no external carrier order", async () => {
  assert.deepEqual(await createShippingOrder("shop", { shippingProvider: "DEFAULT" }), { provider: "DEFAULT", managedByShop: true });
});
