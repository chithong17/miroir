import assert from "node:assert/strict";
import test from "node:test";
import { generateShopReportWithRetry } from "../services/shopAdvice.service.js";

test("shop AI report retries a temporary 503 and returns the generated text", async () => {
  let calls = 0;
  const delays = [];
  const result = await generateShopReportWithRetry(async () => {
    calls += 1;
    if (calls === 1) throw Object.assign(new Error("Service Unavailable"), { status: 503 });
    return "Gợi ý từ số liệu shop";
  }, async (delay) => delays.push(delay));

  assert.equal(result, "Gợi ý từ số liệu shop");
  assert.equal(calls, 2);
  assert.deepEqual(delays, [500]);
});

test("shop AI report stops after three temporary failures and hides provider details", async () => {
  let calls = 0;
  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(
      generateShopReportWithRetry(async () => {
        calls += 1;
        throw Object.assign(new Error("Provider URL and API details"), { status: 503 });
      }, async () => {}),
      (error) => error.statusCode === 503 && error.message === "Dịch vụ AI đang bận. Vui lòng thử lại sau."
    );
    assert.equal(calls, 3);
  } finally {
    console.error = originalError;
  }
});

test("shop AI report does not retry permanent provider failures", async () => {
  let calls = 0;
  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(generateShopReportWithRetry(async () => {
      calls += 1;
      throw Object.assign(new Error("Invalid API key"), { status: 400 });
    }, async () => {}), { statusCode: 502, message: "Không tạo được phân tích AI lúc này. Vui lòng thử lại sau." });
    assert.equal(calls, 1);
  } finally {
    console.error = originalError;
  }
});
