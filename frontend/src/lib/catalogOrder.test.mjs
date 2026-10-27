import assert from "node:assert/strict";
import test from "node:test";
import { mixCatalogProducts } from "./catalogOrder.js";

const products = Array.from({ length: 103 }, (_, i) => ({ id: `product-${i}`, shopId: `shop-${Math.floor(i / 15)}` }));
test("mixed pagination retains every product exactly once", () => {
  const mixed = mixCatalogProducts(products, 42);
  const pages = Array.from({ length: Math.ceil(mixed.length / 12) }, (_, i) => mixed.slice(i * 12, (i + 1) * 12));
  assert.equal(new Set(pages.flat().map((p) => p.id)).size, products.length);
  assert.deepEqual(new Set(mixed.map((p) => p.id)), new Set(products.map((p) => p.id)));
  assert.ok(new Set(pages[0].map((p) => p.shopId)).size > 1);
});
test("the same seed is stable regardless of database order, and different visits can differ", () => {
  assert.deepEqual(mixCatalogProducts(products, 42), mixCatalogProducts([...products].reverse(), 42));
  assert.notDeepEqual(mixCatalogProducts(products, 42), mixCatalogProducts(products, 43));
  assert.equal(products[0].id, "product-0");
  assert.deepEqual(mixCatalogProducts([], 42), []);
});
