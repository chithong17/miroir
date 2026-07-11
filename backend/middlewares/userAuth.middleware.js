import { getUserById, verifyUserToken } from "../services/userAuth.service.js";

export const requireUser = async (req, res, next) => {
  try {
    const authorization = req.get("authorization") || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ success: false, message: "User bearer token is required." });
    }

    const payload = verifyUserToken(token);
    if (payload.role !== "user" || !payload.userId) {
      return res.status(401).json({ success: false, message: "Invalid user token." });
    }

    const user = await getUserById(payload.userId);
    if (!user || user.status !== "active") {
      return res.status(401).json({ success: false, message: "User account is not active." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Invalid or expired user token." });
    }
    next(error);
  }
};

export const optionalUser = async (req, _res, next) => {
  try {
    const authorization = req.get("authorization") || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return next();
    }

    const payload = verifyUserToken(token);
    if (payload.role !== "user" || !payload.userId) {
      return next();
    }

    const user = await getUserById(payload.userId);
    if (user?.status === "active") {
      req.user = user;
    }

    return next();
  } catch (_error) {
    return next();
  }
};
