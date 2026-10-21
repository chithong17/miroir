import test from "node:test";
import assert from "node:assert/strict";
import { grantShopPlan, isTrialEligible } from "../services/planGrant.service.js";
import { updatePaymentPlan, buildSubscriptionSummary } from "../services/subscription.service.js";
import { claimTrial } from "../controllers/payment.controller.js";

test("trial eligibility is false for new, previous and existing trial accounts", () => {
  for (const owner of [{}, {trialUsedAt:new Date()}, {subscription:{planCode:"GROWTH",grantType:"trial"}}]) {
    assert.equal(isTrialEligible(owner),false);
  }
});

test("direct trial grants fail before accessing the database", async () => {
  await assert.rejects(grantShopPlan({ownerId:"fixture",planCode:"GROWTH",grantType:"trial"}), error => error.statusCode === 410);
});

test("legacy trial endpoint rejects without creating an activation", async () => {
  let failure;
  await claimTrial({paymentAccount:{id:"fixture"},body:{planCode:"GROWTH"}}, {
    status(){assert.fail("Retired trial must not return a success response");},
  }, error => {failure=error;});
  assert.equal(failure.statusCode,410);
});

test("admin cannot reenable trials using the old plan setting", async () => {
  await assert.rejects(updatePaymentPlan({planCode:"GROWTH",body:{amount:349000,trialEnabled:true}}), error => error.statusCode === 400);
});

test("historical grants retain their original expiry and source", () => {
  const expiresAt=new Date(Date.now()+86400000);
  const summary=buildSubscriptionSummary({accountType:"shop_owner",subscription:{planCode:"GROWTH",status:"active",grantType:"trial",expiresAt}});
  assert.equal(summary.isPremium,true);
  assert.equal(summary.grantType,"trial");
  assert.equal(summary.expiresAt,expiresAt);
});
