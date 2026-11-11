import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGenlookStatus, prepareGenlookImageUrl } from "../services/genlook.service.js";

test("normalizes Genlook terminal statuses", () => {
  assert.equal(normalizeGenlookStatus("COMPLETED"), "completed");
  assert.equal(normalizeGenlookStatus("FAILED"), "failed");
  assert.equal(normalizeGenlookStatus("CANCELLED"), "failed");
});

test("normalizes Genlook work-in-progress statuses as pending", () => {
  assert.equal(normalizeGenlookStatus("QUEUED"), "pending");
  assert.equal(normalizeGenlookStatus("PROCESSING"), "pending");
  assert.equal(normalizeGenlookStatus(undefined), "pending");
});

test("prepares Cloudinary inputs at a safe Genlook resolution", () => {
  const source = "https://res.cloudinary.com/demo/image/upload/v1/miroir/photo.png";
  assert.equal(
    prepareGenlookImageUrl(source, "person"),
    "https://res.cloudinary.com/demo/image/upload/f_jpg,q_auto:good,c_pad,w_1200,h_1500,b_white/v1/miroir/photo.png",
  );
  assert.equal(
    prepareGenlookImageUrl(source, "product"),
    "https://res.cloudinary.com/demo/image/upload/f_jpg,q_auto:good,c_pad,w_1200,h_1200,b_white/v1/miroir/photo.png",
  );
  assert.equal(prepareGenlookImageUrl("https://example.com/photo.jpg"), "https://example.com/photo.jpg");
});
