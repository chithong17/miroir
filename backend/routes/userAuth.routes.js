import { Router } from "express";
import { login, me, register } from "../controllers/userAuth.controller.js";
import { requireUser } from "../middlewares/userAuth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireUser, me);

export default router;
