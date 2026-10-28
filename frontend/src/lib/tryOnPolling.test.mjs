import test from "node:test";
import assert from "node:assert/strict";
import { shouldRetryTryOnPoll, tryOnPollDelay } from "./tryOnPolling.mjs";

test("temporary polling errors do not terminate a running image task", () => {
  for (const status of [undefined, 408, 429, 500, 502, 503, 504]) {
    assert.equal(shouldRetryTryOnPoll({ response: status ? { status } : undefined }), true);
  }
  for (const status of [400, 401, 403, 404, 409]) {
    assert.equal(shouldRetryTryOnPoll({ response: { status } }), false);
  }
});

test("polling backs off and caps the delay at thirty seconds", () => {
  assert.deepEqual([0, 1, 2, 3, 100].map(tryOnPollDelay), [5000, 10000, 20000, 30000, 30000]);
});
