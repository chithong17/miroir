import { getAdminById, verifyAdminToken } from "../services/adminAuth.service.js";

export const requireAdmin = async (req, res, next) => {
  try {
    const authorization = req.get("authorization") || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Admin bearer token is required.",
      });
    }

    const payload = verifyAdminToken(token);

    if (payload.role !== "admin" || !payload.adminId) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }

    const admin = await getAdminById(payload.adminId);

    if (!admin || admin.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Admin account is not active.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired admin token.",
      });
    }

    next(error);
  }
};
