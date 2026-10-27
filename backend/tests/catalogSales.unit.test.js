import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalogSales } from "../scripts/catalogSalesData.js";

const products = Array.from({ length: 180 }, (_, i) => ({ id: `product-${i}`, shopId: `shop-${i % 6}` }));
const users = Array.from({ length: 97 }, (_, i) => ({ id: `customer-${i}` }));
const now = new Date("2026-10-27T12:00:00Z");

test("allocation covers 0 to 4 units, favors 0/1/2, and references existing buyers", () => {
  const { allocations, distribution, productQuantities } = buildCatalogSales({ products, users, now });
  assert.equal(productQuantities.size, 180);
  assert.ok(Object.values(distribution).every((count) => count > 0));
  assert.ok(distribution[0] + distribution[1] + distribution[2] > distribution[3] + distribution[4]);
  assert.equal(new Set(allocations.map((a) => a.id)).size, allocations.length);
  assert.equal(new Set(allocations.map((a) => a.userId)).size, 97);
  const totals = new Map();
  for (const sale of allocations) {
    assert.ok(users.some((u) => u.id === sale.userId));
    const product = products.find((p) => p.id === sale.productId);
    assert.equal(sale.shopId, product.shopId);
    assert.equal(sale.quantity, 1);
    totals.set(sale.productId, (totals.get(sale.productId) || 0) + sale.quantity);
  }
  for (const [id, quantity] of productQuantities) {
    assert.ok(quantity >= 0 && quantity <= 4);
    assert.equal(totals.get(id) || 0, quantity);
  }
});

test("stable IDs and buyer assignments survive query-order changes without duplicates", () => {
  const a = buildCatalogSales({ products, users, now });
  const b = buildCatalogSales({ products: [...products].reverse(), users: [...users].reverse(), now });
  assert.deepEqual(a.allocations, b.allocations);
});

test("invalid membership is rejected before generating references", () => {
  assert.throws(() => buildCatalogSales({ products, users: [] }), /customer/);
  assert.throws(() => buildCatalogSales({ products: [products[0], products[0]], users }), /Duplicate product/);
  assert.throws(() => buildCatalogSales({ products, users: [users[0], users[0]] }), /Duplicate customer/);
});
