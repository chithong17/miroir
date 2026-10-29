import {
  loginShopOwner,
  registerShopOwner,
} from "../services/shopAuth.service.js";
import { deleteShopOwnerAccount } from "../services/ownerDeletion.service.js";

export const deleteAccount = async (req, res, next) => {
  try { return res.json(await deleteShopOwnerAccount(req.body || {})); }
  catch (error) { next(error); }
};

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
