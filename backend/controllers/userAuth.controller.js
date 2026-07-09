import {
  getUserById,
  loginUser,
  registerUser,
} from "../services/userAuth.service.js";

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body || {});
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body || {});
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
