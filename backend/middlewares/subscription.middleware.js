import { PLAN_CODES, isSubscriptionActive, isGrowthPlan } from "../services/subscription.service.js";

export const requireActiveShopSubscription = (req, res, next) => {
  if (isSubscriptionActive(req.owner?.subscription) && req.owner.subscription.status !== "suspended") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Active shop owner subscription is required.",
    subscriptionRequired: true,
    planCode: PLAN_CODES.STARTER_A,
  });
};

export const requireGrowthShopSubscription = (req, res, next) => {
  if (isSubscriptionActive(req.owner?.subscription) && req.owner.subscription.status !== "suspended" && isGrowthPlan(req.owner.subscription.planCode)) return next();
  return res.status(403).json({ success: false, message: "Growth or Pro Insight plan is required.", subscriptionRequired: true });
};

