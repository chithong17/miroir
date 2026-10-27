import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { listV2Provinces, listV2Wards, resolveV2Location, migrateAddressView, getLegacyDeliveryAreas, normalizeCarrierAddress } from "../services/locationV2.service.js";
import { normalizeRecipient, listAddresses, resolveCheckoutRecipient } from "../services/address.service.js";
import { calculateShippingRates, createShippingOrder } from "../services/shipping/shipping.service.js";
import { resolveCheckoutShipping } from "../services/shipping/defaultShipping.js";
import { ShippingProviderFactory } from "../services/shipping/ShippingProviderFactory.js";
import { GHNAdapter } from "../services/shipping/providers/ghn/GHNAdapter.js";
import { GHTKAdapter } from "../services/shipping/providers/ghtk/GHTKAdapter.js";

const old = { id: "address", userId: "user", provinceCode: "1", districtCode: "1", wardCode: "4", recipientName: "Customer", phone: "0901234567", addressLine: "123 Street", fullAddress: "Original address" };
const modern = { ...old, addressVersion: "v2", provinceCode: "1", wardCode: "4", districtCode: "", carrierLegacyWardCode: "4" };
const config = { provider: "GHN", is_active: true, environment: "SANDBOX", pickup_address: { ...resolveV2Location(modern), address_detail: "456 Street", phone: "0901234567" } };
const dbWithConfigs = (configs) => ({ collection: () => ({ find: () => ({ toArray: async () => configs }) }) });

test("post-merger snapshot contains 34 provinces and 3321 unique wards", () => {
  const provinces = listV2Provinces();
  assert.equal(provinces.length, 34);
  const wards = provinces.flatMap((p) => listV2Wards(p.code));
  assert.equal(wards.length, 3321);
  assert.equal(new Set(wards.map((w) => w.code)).size, 3321);
  assert.throws(() => listV2Wards("99999"), { statusCode: 400 });
});

test("two-level address validates province/ward, ignores spoofed names and omits district", () => {
  const recipient = normalizeRecipient({ ...modern, provinceName: "Spoof", wardName: "Spoof" });
  assert.equal(recipient.provinceName, "Thành phố Hà Nội");
  assert.equal(recipient.wardName, "Phường Ba Đình");
  assert.equal(recipient.districtName, "");
  assert.equal(recipient.fullAddress, "123 Street, Phường Ba Đình, Thành phố Hà Nội");
  assert.throws(() => normalizeRecipient({ ...modern, provinceCode: "79" }), { statusCode: 400 });
  assert.throws(() => normalizeRecipient({ ...modern, carrierLegacyWardCode: "999999" }), { statusCode: 400 });
  assert.equal(normalizeRecipient(old).wardName, "Phường Trúc Bạch"); // Legacy API remains compatible.
});

test("legacy migration converts whole wards only and preserves original address", () => {
  const converted = migrateAddressView(old);
  assert.equal(converted.addressVersion, "v2");
  assert.equal(converted.carrierLegacyWardCode, "4");
  assert.equal(converted.legacyAddress.fullAddress, "Original address");
  assert.equal(old.fullAddress, "Original address");
  assert.equal(migrateAddressView({ ...old, wardCode: "16" }).requiresAddressConfirmation, true);
  assert.equal(migrateAddressView({ ...old, districtCode: "999" }).requiresAddressConfirmation, true);
  assert.equal(migrateAddressView(converted), converted);
});

test("new wards with multiple legacy sources require explicit carrier area, never first match", () => {
  assert(getLegacyDeliveryAreas("1", "4").length > 1);
  const unconfirmed = resolveV2Location({ provinceCode: "1", wardCode: "4" });
  assert.equal(unconfirmed.carrierAddress, null);
  assert.throws(() => normalizeCarrierAddress(unconfirmed), { statusCode: 400 });
  const confirmed = normalizeCarrierAddress(resolveV2Location(modern));
  assert.equal(confirmed.wardName, "Phường Trúc Bạch");
  assert.equal(confirmed.districtName, "Quận Ba Đình");
  assert.equal(confirmed.administrativeAddress.wardName, "Phường Ba Đình");
});

test("saved-address checkout resolves unique conversions and blocks ambiguous old wards", async () => {
  const database = (address) => ({ collection: () => ({ findOne: async () => address }) });
  const args = { userId: "user", body: { addressId: "address", addressVersion: "v2" } };
  const recipient = await resolveCheckoutRecipient({ ...args, db: database(old) });
  assert.equal(recipient.addressVersion, "v2");
  assert.equal(recipient.carrierLegacyWardCode, "4");
  await assert.rejects(resolveCheckoutRecipient({ ...args, db: database({ ...old, wardCode: "16" }) }), { statusCode: 409 });
  const legacyRecipient = await resolveCheckoutRecipient({ ...args, body: { addressId: "address" }, db: database(old) });
  assert.equal(legacyRecipient.fullAddress, "Original address");
});

test("default shipping still accepts a new address without carrier mapping and enforces 500k boundary", async () => {
  const deliveryAddress = resolveV2Location({ provinceCode: "1", wardCode: "4" });
  for (const [itemsValue, fee] of [[500000, 10000], [500001, 0]]) {
    const rates = await calculateShippingRates("shop", { deliveryAddress, itemsValue }, { db: dbWithConfigs([]) });
    assert.equal(rates[0].fee, fee);
    assert.equal((await resolveCheckoutShipping({ db: dbWithConfigs([]), shopId: "shop", itemsValue, recipient: deliveryAddress })).fee, fee);
  }
});

test("carrier fee uses confirmed legacy destination and pickup, rejecting unconfirmed mapping", async (t) => {
  const original = ShippingProviderFactory.getProvider;
  t.after(() => { ShippingProviderFactory.getProvider = original; });
  let observed;
  ShippingProviderFactory.getProvider = () => ({ calculateFee: async (request, settings) => {
    observed = { request, settings }; return { provider: "GHN", service_id: "GHN_STD", fee: 25000 };
  } });
  const db = dbWithConfigs([config]);
  const rates = await calculateShippingRates("shop", { deliveryAddress: resolveV2Location(modern), itemsValue: 360000 }, { db });
  assert.equal(rates[0].fee, 25000);
  assert.equal(observed.request.deliveryAddress.wardName, "Phường Trúc Bạch");
  assert.equal(observed.settings.pickup_address.ward_name, "Phường Trúc Bạch");
  assert.equal(observed.settings.pickup_address.district_name, "Quận Ba Đình");
  await assert.rejects(calculateShippingRates("shop", { deliveryAddress: resolveV2Location({ provinceCode: "1", wardCode: "4" }) }, { db }), { statusCode: 400 });
  await assert.rejects(resolveCheckoutShipping({ db, shopId: "shop", itemsValue: 360000, recipient: resolveV2Location(modern), selected: { provider: "GHN", service_id: "GHN_STD", fee: 0 } }), { statusCode: 409 });
});

test("GHN fee and order use same catalog codes, never an arbitrary pickup ward", async () => {
  const adapter = new GHNAdapter();
  const calls = [];
  adapter.request = async (method, endpoint, payload) => {
    calls.push({ endpoint, payload });
    if (endpoint.endsWith('/province')) return { data: [{ ProvinceID: 1, ProvinceName: "Thành phố Hà Nội" }] };
    if (endpoint.endsWith('/district')) return { data: [{ DistrictID: 2, DistrictName: "Quận Ba Đình" }] };
    if (endpoint.endsWith('/ward')) return { data: [{ WardCode: "carrier-4", WardName: "Phường Trúc Bạch" }] };
    if (endpoint.endsWith('/fee')) return { data: { total: 25000 } };
    return { data: { order_code: "TEST" } };
  };
  const recipient = normalizeCarrierAddress({ ...normalizeRecipient(modern), name: "Customer" });
  const settings = { credentials: { client_id: 1 }, pickup_address: { province_name: recipient.provinceName, district_name: recipient.districtName, ward_name: recipient.wardName, address_detail: "456 Street", phone: "0901234567" } };
  await adapter.calculateFee({ deliveryAddress: recipient, itemsValue: 100000, itemsWeight: 1000 }, settings);
  await adapter.createOrder({ recipient, orderCode: "ORDER", items: [], paymentMethod: "cash", total: 125000 }, settings);
  const fee = calls.find(call => call.endpoint.endsWith('/fee')).payload;
  const order = calls.find(call => call.endpoint.endsWith('/create')).payload;
  assert.equal(fee.to_ward_code, order.to_ward_code);
  assert.equal(fee.to_district_id, order.to_district_id);
  assert.equal(order.from_ward_name, recipient.wardName);
  assert.equal(order.cod_amount, 125000);
  await assert.rejects(adapter.calculateFee({ deliveryAddress: recipient }, { ...settings, pickup_address: { ...settings.pickup_address, ward_name: "" } }));
});

test("GHTK does not turn carrier API failures into fabricated shipping quotes/orders", async () => {
  const adapter = new GHTKAdapter();
  adapter._getHeaders = () => { throw new Error("test invalid credentials"); };
  await assert.rejects(adapter.calculateFee({ deliveryAddress: {} }, { pickup_address: {} }), /test invalid credentials/);
  await assert.rejects(adapter.createOrder({ items: [], recipient: {} }, { pickup_address: {} }), /test invalid credentials/);
});
