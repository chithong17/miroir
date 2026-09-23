import assert from "node:assert/strict";
import test from "node:test";
import {
  getGeminiRetryDelayMs,
  isTransientGeminiError,
} from "../services/gemini.service.js";

const axiosError = ({ status, headers = {}, details = [] } = {}) => ({
  isAxiosError: true,
  response: status ? {
    status,
    headers,
    data: { error: { details } },
  } : undefined,
});

test("Gemini retry classification only accepts transient HTTP failures", () => {
  assert.equal(isTransientGeminiError(axiosError({ status: 429 })), true);
  assert.equal(isTransientGeminiError(axiosError({ status: 503 })), true);
  assert.equal(isTransientGeminiError(axiosError()), true);
  assert.equal(isTransientGeminiError(axiosError({ status: 400 })), false);
  assert.equal(isTransientGeminiError(axiosError({ status: 403 })), false);
});

test("Gemini retry delay uses exponential backoff without exceeding the cap", () => {
  const error = axiosError({ status: 429 });
  assert.equal(getGeminiRetryDelayMs(error, 0, { baseDelayMs: 1000, maxDelayMs: 30000, random: () => 0 }), 1000);
  assert.equal(getGeminiRetryDelayMs(error, 2, { baseDelayMs: 1000, maxDelayMs: 30000, random: () => 0 }), 4000);
  assert.equal(getGeminiRetryDelayMs(error, 10, { baseDelayMs: 1000, maxDelayMs: 30000, random: () => 0 }), 30000);
});

test("Gemini retry delay honors Retry-After and google.rpc.RetryInfo", () => {
  const headerError = axiosError({ status: 429, headers: { "retry-after": "3" } });
  assert.equal(getGeminiRetryDelayMs(headerError, 0, { baseDelayMs: 1000, maxDelayMs: 30000, random: () => 0 }), 3000);

  const detailError = axiosError({
    status: 429,
    details: [{
      "@type": "type.googleapis.com/google.rpc.RetryInfo",
      retryDelay: "2.5s",
    }],
  });
  assert.equal(getGeminiRetryDelayMs(detailError, 0, { baseDelayMs: 1000, maxDelayMs: 30000, random: () => 0 }), 2500);
});
