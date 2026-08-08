import assert from "node:assert/strict";
import test from "node:test";
import { fitDataStatus } from "../services/fit.service.js";

test("Fit Finder marks a fully measured apparel variant as measured", () => {
  assert.equal(fitDataStatus({
    fitCategory: "top",
    variants: [{ active: true, size: "M", fitMeasurements: { chest: 104, waist: 88, hips: 102, shoulder: 44 } }],
  }), "measured");
});

test("Fit Finder falls back to label-only estimate and rejects unknown categories", () => {
  assert.equal(fitDataStatus({ fitCategory: "bottom", variants: [{ active: true, size: "L" }] }), "estimated");
  assert.equal(fitDataStatus({ fitCategory: "shoes", variants: [{ active: true, size: "42" }] }), "unavailable");
});
