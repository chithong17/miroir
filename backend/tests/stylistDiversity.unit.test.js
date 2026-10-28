import test from "node:test";
import assert from "node:assert/strict";
import { selectDiverseProducts, diversifyRecommendation } from "../services/stylistDiversity.service.js";
import { retrieveStylistContext } from "../services/retrieval.service.js";
import { classifyOutfitProduct } from "../services/outfitFallback.service.js";

const product = (id, category, shopId = "a", score = 0.8) => ({ id, name: `${category} ${id}`, category, shopId, rerankScore: score, vectorScore: score, imageUrl: `${id}.jpg`, gender: "unisex", price: 100000, status: "published", availability: "in_stock", variants: [{ id: `v-${id}`, active: true, stockQuantity: 5, costPrice: 30000 }] });
const separates = count => Array.from({ length: count }, (_, i) => [product(`top-${i}`, "Top", i % 2 ? "b" : "a"), product(`bottom-${i}`, "Pants", i % 2 ? "a" : "b")]).flat();

test("product context reserves core categories and balances shops despite a top-heavy ranking", () => {
  const ranked = [...Array.from({ length: 80 }, (_, i) => product(`top-${i}`, "Top", "a", 1)), ...Array.from({ length: 6 }, (_, i) => product(`bottom-${i}`, "Pants", "b", 0.6)), ...Array.from({ length: 6 }, (_, i) => product(`dress-${i}`, "Dress", "c", 0.5))];
  const selected = selectDiverseProducts(ranked);
  assert.equal(selected.length, 30);
  assert.equal(new Set(selected.map(p => p.id)).size, 30);
  for (const role of ["top", "bottom", "one-piece"]) assert(selected.filter(p => classifyOutfitProduct(p) === role).length >= 5);
  assert.equal(new Set(selected.map(p => p.shopId)).size, 3);
});

test("two tops and two bottoms yield two outfits instead of four recycled combinations", () => {
  const products = separates(2);
  const recommendation = { outfits: [
    { items: [{ productId: "top-0" }, { productId: "bottom-0" }] },
    { items: [{ productId: "top-0" }, { productId: "bottom-1" }] },
    { items: [{ productId: "top-1" }, { productId: "bottom-0" }] },
    { items: [{ productId: "top-1" }, { productId: "bottom-1" }] },
  ] };
  const result = diversifyRecommendation({ recommendation, products, prompt: "birthday", count: 5 });
  assert.equal(result.outfits.length, 2);
  const ids = result.outfits.flatMap(o => o.items.map(i => i.product.id));
  assert.equal(new Set(ids).size, 4);
  assert.deepEqual(result.recommended_outfit.items, result.outfits[0].items);
});

test("fallback supplies unused garments when AI repeats itself, without exposing cost prices", () => {
  const products = separates(6);
  const recommendation = { outfits: Array.from({ length: 5 }, (_, i) => ({ id: `ai-${i}`, items: [{ productId: "top-0" }, { productId: "bottom-0" }] })) };
  const result = diversifyRecommendation({ recommendation, products, prompt: "birthday", count: 5, budget: { max: 250000 } });
  assert.equal(result.outfits.length, 5);
  const ids = result.outfits.flatMap(o => o.items.map(i => i.product.id));
  assert.equal(new Set(ids).size, 10);
  for (const outfit of result.outfits) {
    assert.equal(outfit.items.length, 2);
    assert(outfit.items.every(i => !i.product.variants.some(v => "costPrice" in v)));
    assert(outfit.items.reduce((sum, item) => sum + item.product.price, 0) <= 250000);
  }
  assert.equal(diversifyRecommendation({ recommendation, products, count: 5, budget: { max: 150000 } }).outfits.length, 0);
});

test("same garment photo under different product IDs cannot bypass outfit diversity", () => {
  const products = separates(2);
  products.find(p => p.id === "top-1").imageUrl = "top-0.jpg?size=large";
  const result = diversifyRecommendation({ recommendation: {}, products, prompt: "birthday", count: 5 });
  assert.equal(result.outfits.length, 1);
});

test("a full clothing set is one complete outfit and genders are not mixed", () => {
  const set = { ...product("set", "Set"), name: "Set Áo Camisole & Chân Váy Bút Chữ A", gender: "female" };
  assert.equal(classifyOutfitProduct(set), "one-piece");
  const top = { ...product("male-top", "Top"), gender: "male" };
  const pants = { ...product("male-pants", "Pants"), gender: "male" };
  const skirt = { ...product("female-skirt", "Skirt"), gender: "female" };
  const coat = { ...product("female-coat", "Jacket"), gender: "female" };
  const result = diversifyRecommendation({ recommendation: { outfits: [{ items: [{ productId: top.id }, { productId: skirt.id }] }] }, products: [set, top, pants, skirt, coat], prompt: "birthday", count: 5 });
  assert.equal(result.outfits.length, 2);
  for (const outfit of result.outfits) assert(new Set(outfit.items.map(i => i.product.gender).filter(g => g !== "unisex")).size <= 1);
  const withSet = result.outfits.find(o => o.items.some(i => i.product.id === "set"));
  assert(!withSet.items.some(i => [top.id, pants.id, skirt.id].includes(i.product.id)));
});

test("optional layers are not recycled when complete outfits without them are available", () => {
  const products = [...separates(5), product("coat", "Jacket")];
  const result = diversifyRecommendation({ recommendation: {}, products, prompt: "birthday with a jacket", count: 5 });
  assert.equal(result.outfits.length, 5);
  assert.equal(result.outfits.filter(o => o.items.some(i => i.product.id === "coat")).length, 1);
});

test("cardigan and camisole set is a primary top, never an extra layer over Oxford + jeans", () => {
  const shirt = product("oxford", "Shirt"), jeans = product("jeans", "Jeans");
  const bundle = { ...product("cardigan-set", "Set"), name: "Set Áo Khoác Cardigan Len Mỏng & Áo Hai Dây Đen" };
  assert.equal(classifyOutfitProduct(bundle), "top");
  const recommendation = { outfits: [{ items: [shirt, jeans, bundle].map(p => ({ productId: p.id })) }] };
  const result = diversifyRecommendation({ recommendation, products: [shirt, jeans, bundle], prompt: "đi sinh nhật", count: 5 });
  assert.equal(result.outfits.length, 1);
  assert.equal(result.outfits[0].items.length, 2);
  assert(result.outfits.every(o => o.items.filter(i => classifyOutfitProduct(i.product) === "top").length === 1));
  const onlyBundle = diversifyRecommendation({ recommendation: {}, products: [bundle, jeans], prompt: "đi sinh nhật", count: 5 });
  assert.deepEqual(onlyBundle.outfits[0].items.map(i => i.product.id), [bundle.id, jeans.id]);
});

test("complete matching sets stand alone and unknown clothing cannot be added as a hidden layer", () => {
  const set = { ...product("full-set", "Set"), name: "Set Áo Sơ Mi & Quần Short" };
  const jacket = product("coat", "Jacket"), unknown = product("unknown", "Unknown");
  const result = diversifyRecommendation({ recommendation: { outfits: [{ items: [{ productId: set.id }, { productId: unknown.id }] }] }, products: [set, jacket, unknown], prompt: "birthday", count: 5 });
  assert.equal(result.outfits.length, 1);
  assert.deepEqual(result.outfits[0].items.map(i => i.product.id), [set.id]);
});

test("valid AI styling is preferred over forcing catalog combinations for shop variety", () => {
  const products = separates(6);
  const recommendation = { outfits: [
    { title: "AI classic", items: [{ productId: "top-0" }, { productId: "bottom-0" }] },
    { title: "AI casual", items: [{ productId: "top-1" }, { productId: "bottom-1" }] },
  ] };
  const result = diversifyRecommendation({ recommendation, products, prompt: "birthday", count: 5 });
  assert.deepEqual(result.outfits.slice(0, 2).map(outfit => outfit.title), ["AI classic", "AI casual"]);
});

test("ordinary fallback prioritizes separate shirt and bottom pairs before bundles", () => {
  const fullSet = { ...product("full-set", "Set"), name: "Set Áo & Chân Váy" };
  const upperSet = { ...product("upper-set", "Set"), name: "Set Cardigan & Áo Hai Dây" };
  const products = [fullSet, upperSet, ...separates(5)];
  const result = diversifyRecommendation({ recommendation: {}, products, prompt: "đi sinh nhật", count: 5 });
  assert.equal(result.outfits.length, 5);
  assert(result.outfits.every(o => o.items.length === 2 && o.items.every(i => ![fullSet.id, upperSet.id].includes(i.product.id))));
});

function retrievalFixture({ missingIndex = false, noShops = false, thin = false } = {}) {
  const calls = [], products = separates(20);
  const owner = { id: "owner", status: "active", subscription: { status: "active", planCode: "GROWTH", expiresAt: new Date("2099-01-01") } };
  const db = { collection(name) { return {
    find(filter) {
      calls.push({ name, filter });
      let result = name === "shop_owners" ? noShops ? [] : [owner, { ...owner, id: "expired", subscription: { ...owner.subscription, expiresAt: new Date("2000-01-01") } }, { ...owner, id: "starter", subscription: { ...owner.subscription, planCode: "STARTER_A" } }] : name === "shops" ? [{ id: "a", ownerId: "owner", status: "active" }, { id: "b", ownerId: "owner", status: "active" }] : name === "products" ? products : [];
      const cursor = { project() { return this; }, sort() { return this; }, limit(n) { result = result.slice(0, n); return this; }, async toArray() { return result; } };
      return cursor;
    },
    aggregate(pipeline) {
      calls.push({ name, pipeline });
      if (name === "products" && missingIndex) throw new Error("Path 'shopId' needs to be indexed as filter");
      return { async toArray() { return name === "products" ? [...(thin ? products.slice(0, 4) : products), product("forbidden", "Top", "starter", 10)] : []; } };
    },
  }; } };
  return { db, calls };
}

test("vector query filters eligible shops before its limit, preserving budget and gender", async () => {
  const { db, calls } = retrievalFixture();
  const result = await retrieveStylistContext({ db, request: { prompt: "birthday", gender: "female", budget: { max: 200000 } }, memory: {}, embed: async () => [1, 0], readReviews: async () => [] });
  const query = calls.find(c => c.name === "products" && c.pipeline)?.pipeline;
  assert.deepEqual(query[0].$vectorSearch.filter.$and.find(f => f.shopId), { shopId: { $in: ["a", "b"] } });
  assert.deepEqual(query[0].$vectorSearch.filter.$and.find(f => f.gender), { gender: { $in: ["female", "unisex"] } });
  assert.deepEqual(query[0].$vectorSearch.filter.$and.find(f => f.price), { price: { $lte: 200000 } });
  assert.equal(query[0].$vectorSearch.limit, 120);
  assert.equal(query[1].$match.status, "published");
  assert(result.products.every(p => ["a", "b"].includes(p.shopId)));
  assert.equal(result.products.length, 30);
  assert.deepEqual(calls.find(c => c.name === "shops").filter.ownerId.$in, ["owner"]);
});

test("thin vector results and an index being rebuilt both fall back to the eligible catalog", async () => {
  for (const options of [{ thin: true }, { missingIndex: true }]) {
    const { db, calls } = retrievalFixture(options);
    const result = await retrieveStylistContext({ db, request: { prompt: "birthday" }, embed: async () => [1, 0], readReviews: async () => [] });
    assert.equal(result.products.length, 30);
    assert.equal(result.retrievalMode, options.missingIndex ? "catalog_fallback" : "vector_catalog");
    const filter = calls.find(c => c.name === "products" && c.filter)?.filter;
    assert.deepEqual(filter.$and.find(f => f.shopId), { shopId: { $in: ["a", "b"] } });
    assert.equal(filter.$and.find(f => f.variants).variants.$elemMatch.stockQuantity.$gt, 0);
  }
});

test("no eligible shop returns no products without calling embedding", async () => {
  const { db } = retrievalFixture({ noShops: true });
  const result = await retrieveStylistContext({ db, request: { prompt: "birthday" }, embed: async () => assert.fail("No embedding call expected") });
  assert.equal(result.products.length, 0);
});
