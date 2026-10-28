import test from "node:test";
import assert from "node:assert/strict";
import { normalizePiApiError, describeTryOnFailure } from "../utils/piapiErrors.js";

test("tasks belonging to a previous API account are permanent conflicts, not server outages", () => {
  const result = normalizePiApiError({ response: { status: 400, data: { message: "the task does not belong to the current account" } } });
  assert.equal(result.statusCode, 409);
  assert.equal(result.code, "TRYON_ACCOUNT_CHANGED");
  assert.match(result.message, /tài khoản API trước/);
});

test("transient upstream failures remain retryable while invalid requests stay permanent", () => {
  assert.equal(normalizePiApiError({ code: "ECONNRESET" }).statusCode, 503);
  assert.equal(normalizePiApiError({ response: { status: 502 } }).statusCode, 503);
  assert.equal(normalizePiApiError({ response: { status: 429 } }).statusCode, 429);
  assert.equal(normalizePiApiError({ response: { status: 401 } }).statusCode, 401);
});

test("provider internal errors identify the service without inventing an input or balance cause", () => {
  assert.match(describeTryOnFailure({ code: 10000, message: "Internal error." }), /PiAPI 10000/);
  assert.equal(describeTryOnFailure({ code: 123, message: "Invalid model image" }), "Invalid model image");
});
