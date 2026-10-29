import { Router } from "express";
import { deleteAccount, login, register } from "../controllers/shopAuth.controller.js";
import { accountDeletionRateLimit } from "../middlewares/accountDeletionRateLimit.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.delete("/account", accountDeletionRateLimit, deleteAccount);

export default router;
