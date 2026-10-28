import test from "node:test";
import assert from "node:assert/strict";
import { reconcileTryOnTask } from "../services/billing.service.js";
import { normalizePiApiError } from "../utils/piapiErrors.js";

const fixture = () => {
  const updates = [];
  const settlements = [];
  return {
    updates, settlements,
    args: { task: { taskId: "task-1" }, now: new Date("2026-10-28T12:00:00Z"), db: { collection: () => ({ updateOne: async (...args) => updates.push(args) }) } },
    settle: async (value) => settlements.push(value),
  };
};

test("account mismatch ends worker polling without charging for images", async () => {
  const f = fixture();
  const error = normalizePiApiError({ response: { status: 400, data: { message: "the task does not belong to the current account" } } });
  await reconcileTryOnTask(f.args, { getStatus: async () => { throw error; }, settle: f.settle });
  assert.equal(f.updates.length, 1);
  assert.deepEqual(f.updates[0][0], { taskId: "task-1", completedAt: { $exists: false } });
  assert.equal(f.updates[0][1].$set.completedAt, f.args.now);
  assert.equal(f.updates[0][1].$set.failureCode, "TRYON_ACCOUNT_CHANGED");
  assert.equal(f.settlements.length, 0);
});

test("temporary errors and invalid credentials leave tasks available for reconciliation", async () => {
  for (const status of [401, 429, 503]) {
    const f = fixture();
    const error = normalizePiApiError({ response: { status } });
    await assert.rejects(reconcileTryOnTask(f.args, { getStatus: async () => { throw error; }, settle: f.settle }), error);
    assert.equal(f.updates.length, 0);
    assert.equal(f.settlements.length, 0);
  }
});

test("provider generation failure is terminal and retains its diagnostic code", async () => {
  const f = fixture();
  await reconcileTryOnTask(f.args, { getStatus: async () => ({ data: { status: "failed", error: { code: 10000, message: "Internal error." } } }), settle: f.settle });
  assert.equal(f.updates[0][1].$set.failureCode, 10000);
  assert.equal(f.updates[0][1].$set.failed, true);
  assert.equal(f.settlements.length, 0);
});

test("completed tasks settle distinct output images and pending tasks remain open", async () => {
  const f = fixture();
  await reconcileTryOnTask(f.args, { getStatus: async () => ({ data: { status: "completed", output: { images: [{ url: "https://img.test/a.png" }, { url: "https://img.test/a.png" }] } } }), settle: f.settle });
  assert.deepEqual(f.settlements, [{ taskId: "task-1", imageCount: 1 }]);
  await reconcileTryOnTask(f.args, { getStatus: async () => ({ data: { status: "pending" } }), settle: f.settle });
  assert.equal(f.updates.length, 0);
  assert.equal(f.settlements.length, 1);
});
