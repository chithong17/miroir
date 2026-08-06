import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { formatOrderCode, generateOrderCode, normalizeBuyNowItems, normalizeOrderCode } from "../services/commerce.service.js";
import { normalizeProductPayload } from "../services/product.service.js";
import { buildProductEmbeddingText, hashEmbeddingText } from "../services/embeddingText.service.js";

test("order code uses Vietnam timestamp and copy-safe compact form", () => {
  const code = generateOrderCode(new Date("2026-08-05T07:27:09.381Z"));
  assert.match(code, /^MIR260805142709381[A-Z0-9]{4}$/);
  assert.equal(normalizeOrderCode(formatOrderCode(code)), code);
  assert.equal(normalizeOrderCode("mir-260805 142709381-a7k2"), "MIR260805142709381A7K2");
});

test("variants validate stock and derive search colors, sizes and availability", () => {
  const result = normalizeProductPayload({
    name: "Áo", category: "Top", description: "Test", price: 100000,
    gender: "unisex", availability: "out_of_stock",
    variants: [
      { sku: "A-M", color: "Trắng", size: "M", stockQuantity: 2, active: true },
      { sku: "A-L", color: "Trắng", size: "L", stockQuantity: 0, active: true },
    ],
  });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.normalized.colors, ["Trắng"]);
  assert.deepEqual(result.normalized.sizes, ["M", "L"]);
  assert.equal(result.normalized.availability, "in_stock");
});

test("buy-now items require an explicit product variant and positive quantity", () => {
  assert.deepEqual(normalizeBuyNowItems([{ productId: "p1", variantId: "v1", quantity: 2 }]), [
    { productId: "p1", variantId: "v1", quantity: 2 },
  ]);
  assert.throws(() => normalizeBuyNowItems([{ productId: "p1", quantity: 1 }]), /productId and variantId/);
  assert.throws(() => normalizeBuyNowItems([{ productId: "p1", variantId: "v1", quantity: 0 }]), /positive integer/);
});

test("bundled NSO location snapshot contains the full two-level catalog", () => {
  const dataset = JSON.parse(readFileSync(new URL("../data/vn-admin-units.json", import.meta.url), "utf8"));
  assert.equal(dataset.datasetVersion, "NSO-2026-08-05");
  assert.equal(dataset.provinces.length, 34);
  assert.equal(dataset.provinces.reduce((sum, item) => sum + item.wards.length, 0), 3321);
});

test("product embedding text builder and hashing logic", () => {
  const p1 = {
    name: "Classic T-Shirt",
    category: "Tops",
    description: "100% cotton tee.",
    colors: ["red", "blue"],
    gender: "unisex",
  };

  const text1 = buildProductEmbeddingText(p1);
  const hash1 = hashEmbeddingText(text1);

  // If we change price (which is NOT an embedding field), the embedding text and hash should remain identical
  const p2 = {
    ...p1,
    price: 250000,
  };

  const text2 = buildProductEmbeddingText(p2);
  const hash2 = hashEmbeddingText(text2);

  assert.equal(text1, text2);
  assert.equal(hash1, hash2);

  // If we change description (which IS an embedding field), the embedding text and hash should change
  const p3 = {
    ...p1,
    description: "Updated description.",
  };

  const text3 = buildProductEmbeddingText(p3);
  const hash3 = hashEmbeddingText(text3);

  assert.notEqual(text1, text3);
  assert.notEqual(hash1, hash3);
});
