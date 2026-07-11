import {
  FREE_TRYON_LIMIT,
  PLAN_CODES,
  getMonthlyTryOnUsage,
  isSubscriptionActive,
} from "../services/subscription.service.js";

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

export const requireUserPremium = (req, res, next) => {
  if (isSubscriptionActive(req.user?.subscription, PLAN_CODES.USER_PREMIUM_MONTHLY)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "MIROIR Premium is required for this feature.",
    subscriptionRequired: true,
    planCode: PLAN_CODES.USER_PREMIUM_MONTHLY,
  });
};

export const requireUserTryOnAccess = async (req, res, next) => {
  try {
    if (isSubscriptionActive(req.user?.subscription, PLAN_CODES.USER_PREMIUM_MONTHLY)) {
      req.tryOnAccess = {
        isPremium: true,
        usage: null,
      };
      return next();
    }

    const usage = await getMonthlyTryOnUsage(req.user.id);

    if (usage.count >= FREE_TRYON_LIMIT) {
      return res.status(403).json({
        success: false,
        message: "Free accounts are limited to 5 try-on attempts per month.",
        subscriptionRequired: true,
        planCode: PLAN_CODES.USER_PREMIUM_MONTHLY,
        usage,
      });
    }

    req.tryOnAccess = {
      isPremium: false,
      usage,
    };
    return next();
  } catch (error) {
    next(error);
  }
};
