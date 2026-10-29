import test from "node:test";
import assert from "node:assert/strict";
import { createOwnerAccountDeletion } from "../services/ownerDeletion.service.js";
import { processAccountMediaDeletionJobs } from "../services/accountMediaDeletion.service.js";

const matches = (row, filter) => Object.entries(filter).every(([key, value]) => value?.$in ? value.$in.includes(row[key]) : row[key] === value);
function fixture({ status = "active", failDelete = false } = {}) {
  let data = {
    shop_owners: [{ id: "o1", email: "owner@example.test", passwordHash: "hash", status }, { id: "o2", email: "other@example.test" }],
    shops: [{ id: "s1", ownerId: "o1", contact: { email: "owner@example.test" }, paymentSettings: { accountNumber: "private" } }, { id: "s2", ownerId: "o2" }],
    products: [{ id: "p1", shopId: "s1", imagePublicId: "miroir/own", imageUrl: "https://example.test/own.jpg" }, { id: "p2", shopId: "s2" }],
    orders: [{ id: "order1", shopId: "s1", userId: "u1" }],
    chat_messages: [{ id: "m1", text: "retained transaction conversation" }],
    password_reset_otps: [{ email: "owner@example.test", accountType: "shop_owner" }, { email: "owner@example.test", accountType: "user" }],
    notifications: [{ audienceType: "shop", audienceId: "o1" }, { audienceType: "user", audienceId: "o1" }],
    account_media_deletions: [],
  };
  const db = { collection(name) { data[name] ||= []; return {
    findOne: async filter => data[name].find(row => matches(row, filter)),
    find: filter => ({ toArray: async () => data[name].filter(row => matches(row, filter)) }),
    insertMany: async rows => data[name].push(...rows),
    deleteMany: async filter => { if (name === "products" && failDelete) throw new Error("Database unavailable"); data[name] = data[name].filter(row => !matches(row, filter)); },
    deleteOne: async filter => { data[name] = data[name].filter(row => !matches(row, filter)); },
    replaceOne: async (filter, value) => { data[name] = data[name].map(row => matches(row, filter) ? value : row); },
  }; } };
  const disconnected = [];
  const remove = createOwnerAccountDeletion({ compare: async (password, hash) => password === "correct-password" && hash === "hash", disconnect: id => disconnected.push(id), transact: async work => {
    const before = structuredClone(data);
    try { return await work(db, {}); } catch (error) { data = before; throw error; }
  } });
  return { remove, read: () => data, disconnected };
}
const input = { email: " Owner@example.test ", password: "correct-password", confirmation: "DELETE" };

test("owner deletion authenticates, closes only owned shops and retains transaction records", async () => {
  const f = fixture();
  assert.equal((await f.remove({ ...input, ownerId: "o2" })).success, true);
  assert.deepEqual(f.read().shop_owners.map(o => o.id), ["o2"]);
  assert.deepEqual(f.read().products.map(p => p.id), ["p2"]);
  assert.equal(f.read().shops[0].status, "inactive");
  assert.equal(f.read().shops[0].ownerId, undefined);
  assert.equal(f.read().shops[0].contact, undefined);
  assert.equal(f.read().shops[0].paymentSettings, undefined);
  assert.equal(f.read().shops[1].ownerId, "o2");
  assert.equal(f.read().orders.length, 1);
  assert.equal(f.read().chat_messages.length, 1);
  assert.equal(f.read().password_reset_otps[0].accountType, "user");
  assert.equal(f.read().notifications[0].audienceType, "user");
  assert.equal(f.read().account_media_deletions[0].publicId, "miroir/own");
  assert.deepEqual(f.disconnected, ["s1"]);
});
test("pending owners can delete without waiting for approval", async () => {
  const f = fixture({ status: "pending" });
  assert.equal((await f.remove(input)).success, true);
});
test("bad credentials and missing explicit confirmation do not delete anything", async () => {
  const f = fixture(); const before = structuredClone(f.read());
  await assert.rejects(f.remove({ ...input, password: "incorrect" }), { statusCode: 401 });
  await assert.rejects(f.remove({ ...input, email: "absent@example.test" }), { statusCode: 401 });
  await assert.rejects(f.remove({ ...input, confirmation: "" }), { statusCode: 400 });
  assert.deepEqual(f.read(), before);
});
test("transaction failure keeps account, catalog and cleanup jobs intact", async () => {
  const f = fixture({ failDelete: true }); const before = structuredClone(f.read());
  await assert.rejects(f.remove(input), /Database unavailable/);
  assert.deepEqual(f.read(), before); assert.deepEqual(f.disconnected, []);
});

test("media cleanup preserves shared assets and retries provider failures", async () => {
  const rows = [{ id: "shared", publicId: "shared", status: "pending" }, { id: "own", publicId: "own", status: "pending" }, { id: "retry", publicId: "retry", status: "pending" }];
  const destroyed = []; const updates = []; const removed = [];
  const db = { collection: () => ({
    find: () => ({ limit: () => ({ toArray: async () => rows }) }),
    findOneAndUpdate: async ({ id }) => rows.find(r => r.id === id),
    updateOne: async ({ id }, change) => updates.push({ id, change }),
    deleteOne: async ({ id }) => removed.push(id),
  }) };
  await processAccountMediaDeletionJobs({ db, retained: async (_db, job) => job.id === "shared", destroy: async id => { if (id === "retry") throw new Error("Provider unavailable"); destroyed.push(id); } });
  assert.deepEqual(destroyed, ["own"]); assert.deepEqual(removed, ["own"]);
  assert.equal(updates.find(u => u.id === "shared").change.$set.retainedReference, true);
  assert.equal(updates.find(u => u.id === "retry").change.$set.status, "pending");
});
