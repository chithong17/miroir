import { getRawShopOwnerById, verifyOwnerToken } from "../services/shopAuth.service.js";
import { getRawUserById, verifyUserToken } from "../services/userAuth.service.js";

const parseBearerToken = (req) => {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  return scheme === "Bearer" ? token : "";
};

export const requirePaymentAccount = async (req, res, next) => {
  try {
    const token = parseBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Bearer token is required.",
      });
    }

    try {
      const payload = verifyUserToken(token);
      if (payload.role === "user" && payload.userId) {
        const user = await getRawUserById(payload.userId);
        if (user?.status === "active") {
          req.paymentAccount = {
            ...user,
            accountType: "user",
          };
          return next();
        }
      }
    } catch (_error) {
      // Try shop owner token below.
    }

    try {
      const payload = verifyOwnerToken(token);
      if (payload.ownerId) {
        const owner = await getRawShopOwnerById(payload.ownerId);
        if (owner?.status === "active") {
          req.paymentAccount = {
            ...owner,
            accountType: "shop_owner",
          };
          return next();
        }
      }
    } catch (_error) {
      // Fall through to unauthorized response.
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  } catch (error) {
    next(error);
  }
};
