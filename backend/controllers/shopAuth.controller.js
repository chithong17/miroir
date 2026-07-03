import {
  loginShopOwner,
  registerShopOwner,
} from "../services/shopAuth.service.js";

export const register = async (req, res, next) => {
  try {
    const result = await registerShopOwner(req.body || {});
    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginShopOwner(req.body || {});
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
