import test from "node:test";
import assert from "node:assert/strict";
import { customerDateKey, customerWindow, fillCustomerDays, getCustomerAnalytics } from "../services/customerAnalytics.service.js";
import { requireAdmin } from "../middlewares/adminAuth.middleware.js";

const now = new Date("2026-10-27T03:00:00Z");

test("customer reporting uses Vietnam midnight and inclusive calendar-day windows", () => {
  assert.equal(customerDateKey("2026-10-26T17:00:00Z"), "2026-10-27");
  assert.equal(customerDateKey("2026-10-26T16:59:59Z"), "2026-10-26");
  const window = customerWindow("7d", now);
  assert.equal(window.start.toISOString(), "2026-10-20T17:00:00.000Z");
  assert.equal(window.today.toISOString(), "2026-10-26T17:00:00.000Z");
  assert.equal(window.end, now);
  for (const invalid of ["bad", "__proto__", "constructor", {}]) assert.equal(customerWindow(invalid, now).days, 30);
});

test("registration series fills zero days and keeps exact date boundaries", () => {
  const daily = fillCustomerDays([{ _id: "2026-10-21", count: 2 }, { _id: "2026-10-27", count: 3 }], customerWindow("7d", now));
  assert.equal(daily.length, 7);
  assert.deepEqual(daily[0], { date: "2026-10-21", count: 2 });
  assert.deepEqual(daily[1], { date: "2026-10-22", count: 0 });
  assert.deepEqual(daily.at(-1), { date: "2026-10-27", count: 3 });
});

function fixture({ empty = false } = {}) {
  const calls = [];
  const totals = empty ? Array(8).fill(0) : [3, 1, 2, 3, 2, 1, 3, 1];
  let countIndex = 0;
  const db = { collection(name) {
    calls.push({ collection: name });
    assert(["users", "shop_events", "orders"].includes(name), "must never query shop_owners or admin_users");
    return {
      countDocuments(filter) { calls.push({ countFilter: filter }); return Promise.resolve(totals[countIndex++]); },
      aggregate(pipeline) {
        calls.push({ aggregate: name, pipeline });
        if (name !== "users") {
          const lookup = pipeline.find(stage => stage.$lookup)?.$lookup;
          assert.equal(lookup.from, "users");
          assert.equal(lookup.localField, "userId");
          assert.equal(lookup.foreignField, "id");
          assert.deepEqual(pipeline.find(stage => stage.$match?.["customer.0"]), { $match: { "customer.0": { $exists: true } } });
        }
        return { toArray: async () => empty ? [] : name === "users" ? [{ _id: "2026-10-27", count: 2 }] : name === "shop_events" ? [
          { _id: { userId: "customer-a", type: "product_view" }, count: 4 },
          { _id: { userId: "customer-a", type: "tryon_started" }, count: 2 },
          { _id: { userId: "customer-b", type: "stylist_product_recommended" }, count: 5 },
        ] : [{ _id: "customer-a", count: 2, paid: 1 }] };
      },
      find(filter, options) {
        calls.push({ listFilter: filter, projection: options.projection });
        const cursor = {
          sort() { return cursor; }, skip(value) { calls.push({ skip: value }); return cursor; }, limit(value) { assert.equal(value, 20); return cursor; },
          async toArray() { return []; },
        };
        return cursor;
      },
    };
  } };
  return { db, calls };
}

test("report deduplicates customers across behaviors and orders, not event counts", async () => {
  const { db, calls } = fixture();
  const result = await getCustomerAnalytics({ db, now, query: { range: "7d", search: ".*", page: 2 } });
  assert.equal(result.summary.total, 3);
  assert.equal(result.summary.activeInRange, 2);
  assert.equal(result.summary.activityRate, 66.7);
  assert.equal(result.usage.product_view, 4);
  assert.equal(result.usage.tryon_started, 2);
  assert.equal(result.usage.stylist_product_recommended, 5);
  assert.equal(result.summary.orders, 2);
  assert.equal(result.summary.payingCustomers, 1);
  assert.equal(result.summary.newInRange, 2);
  assert(calls.some(call => call.skip === 20));
  const listing = calls.find(call => call.listFilter);
  assert.equal(listing.listFilter.$or[0].name.$regex, "\\.\\*");
  assert.equal(listing.projection.passwordHash, undefined);
  assert.equal(listing.projection.profile, undefined);
  assert.equal(listing.projection.email, 1);
});

test("empty customer database yields finite zero metrics and a complete zero series", async () => {
  const { db } = fixture({ empty: true });
  const result = await getCustomerAnalytics({ db, now, query: { range: "30d", page: -4 } });
  assert.equal(result.summary.activityRate, 0);
  assert.equal(result.summary.activeInRange, 0);
  assert.equal(result.daily.length, 30);
  assert.equal(result.daily.reduce((sum, row) => sum + row.count, 0), 0);
  assert.equal(result.pagination.page, 1);
  assert.equal(result.pagination.totalPages, 1);
});

test("customer analytics requires admin credentials", async () => {
  let status;
  await requireAdmin({ get: () => "" }, { status(code) { status = code; return this; }, json() {} }, () => assert.fail("Unauthenticated request must not reach analytics"));
  assert.equal(status, 401);
});
