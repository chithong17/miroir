import { getAdminById, loginAdmin } from "../services/adminAuth.service.js";

export const login = async (req, res, next) => {
  try {
    const result = await loginAdmin(req.body || {});
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const admin = await getAdminById(req.admin.id);
    return res.json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};
