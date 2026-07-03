import { getShopOwnerById, verifyOwnerToken } from "../services/shopAuth.service.js";

export const requireShopOwner = async (req, res, next) => {
  try {
    const authorization = req.get("authorization") || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Bearer token is required.",
      });
    }

    const payload = verifyOwnerToken(token);
    const owner = await getShopOwnerById(payload.ownerId);

    if (!owner || owner.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Shop owner account is not active.",
      });
    }

    req.owner = owner;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    next(error);
  }
};
