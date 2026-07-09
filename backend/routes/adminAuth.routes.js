import { Router } from "express";
import { login, me } from "../controllers/adminAuth.controller.js";
import { requireAdmin } from "../middlewares/adminAuth.middleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", requireAdmin, me);

export default router;
