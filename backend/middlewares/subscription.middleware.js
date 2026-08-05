import { PLAN_CODES, isSubscriptionActive } from "../services/subscription.service.js";

export const requireActiveShopSubscription = (req, res, next) => {
  if (isSubscriptionActive(req.owner?.subscription, PLAN_CODES.SHOP_OWNER_MONTHLY)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Active shop owner subscription is required.",
    subscriptionRequired: true,
    planCode: PLAN_CODES.SHOP_OWNER_MONTHLY,
  });
};
