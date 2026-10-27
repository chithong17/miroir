import assert from "node:assert/strict";
import test from "node:test";
import snapshot from "../data/catalogSoldCounts.json" with { type: "json" };
import { getProductSoldCount } from "./productSales.js";

const soldId = Object.keys(snapshot.counts).find((id) => snapshot.counts[id] > 0);
test("a missing API field falls back to the exported database count", () => {
  assert.equal(getProductSoldCount({ id: soldId }), snapshot.counts[soldId]);
});
test("live counts override the snapshot, including zero", () => {
  assert.equal(getProductSoldCount({ id: soldId, soldCount: 0 }), 0);
  assert.equal(getProductSoldCount({ id: soldId, soldCount: 7 }), 7);
});
test("unknown products and invalid counts display a nonnegative integer", () => {
  assert.equal(getProductSoldCount({ id: "unknown-product" }), 0);
  assert.equal(getProductSoldCount({ soldCount: -4 }), 0);
  assert.equal(getProductSoldCount({ soldCount: 2.5 }), 2);
});
