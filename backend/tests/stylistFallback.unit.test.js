import assert from "node:assert/strict";
import test from "node:test";
import { enrichRecommendation } from "../services/groundingValidation.service.js";
import {
  buildCoherentFallbackOutfits,
  classifyOutfitProduct,
} from "../services/outfitFallback.service.js";

const product = (id, name, category) => ({ id, name, category, price: 100000 });

test("fallback classifies the catalog roles used by current demo products", () => {
  assert.equal(classifyOutfitProduct(product("1", "Áo thun tay dài", "Top")), "top");
  assert.equal(classifyOutfitProduct(product("2", "Quần tây đen", "Pants")), "bottom");
  assert.equal(classifyOutfitProduct(product("3", "Áo khoác da dáng lửng", "jacket")), "outerwear");
  assert.equal(classifyOutfitProduct(product("4", "Chân váy tennis", "Skirt")), "bottom");
});

test("fallback builds distinct wearable outfits instead of duplicate sliding windows", () => {
  const products = [
    product("top-1", "Áo thun lệch vai", "T-shirt"),
    product("top-2", "Áo sơ mi caro", "Shirt"),
    product("bottom-1", "Quần tây đen", "Pants"),
    product("bottom-2", "Chân váy tennis", "Skirt"),
    product("outer-1", "Áo khoác da", "Jacket"),
  ];
  const outfits = buildCoherentFallbackOutfits({
    products,
    prompt: "outfit đi sinh nhật",
    desiredOutfitCount: 5,
  });

  assert.ok(outfits.length >= 2);
  const signatures = outfits.map((outfit) =>
    outfit.items.map((item) => item.productId).sort().join("|")
  );
  assert.equal(new Set(signatures).size, outfits.length);
  outfits.forEach((outfit) => {
    const roles = outfit.items.map((item) =>
      classifyOutfitProduct(products.find((entry) => entry.id === item.productId))
    );
    assert.equal(roles.filter((role) => role === "top").length, 1);
    assert.equal(roles.filter((role) => role === "bottom").length, 1);
  });
  assert.equal(outfits[0].items.some((item) => item.productId === "bottom-2"), true);
});

test("fallback returns fewer results when only one complete combination exists", () => {
  const outfits = buildCoherentFallbackOutfits({
    products: [
      product("top", "Áo thun tay dài", "Top"),
      product("bottom", "Quần tây đen", "Pants"),
      product("outer", "Áo khoác da", "Jacket"),
    ],
    prompt: "outfit đi sinh nhật",
    desiredOutfitCount: 5,
  });
  assert.equal(outfits.length, 1);
  assert.deepEqual(outfits[0].items.map((item) => item.productId), ["top", "bottom", "outer"]);
});

test("enriched stylist products retain sellable variants and omit cost price", () => {
  const result = enrichRecommendation({
    recommendation: {
      outfits: [{ id: "o1", items: [{ productId: "p1", reason: "Test" }] }],
    },
    products: [{
      ...product("p1", "Áo", "Top"),
      status: "published",
      availability: "in_stock",
      shopId: "shop-1",
      variants: [
        { id: "v1", active: true, stockQuantity: 10, size: "M", costPrice: 50000 },
        { id: "v2", active: true, stockQuantity: 0, size: "L", costPrice: 50000 },
      ],
    }],
  });
  const enriched = result.outfits[0].items[0].product;
  assert.equal(enriched.shopId, "shop-1");
  assert.equal(enriched.variants.length, 1);
  assert.equal(enriched.variants[0].id, "v1");
  assert.equal("costPrice" in enriched.variants[0], false);
});
