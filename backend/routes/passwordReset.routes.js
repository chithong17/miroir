import { Router } from "express";
import { confirm, request, verify } from "../controllers/passwordReset.controller.js";
const router = Router();
router.post("/password-reset/request", request);
router.post("/password-reset/verify", verify);
router.post("/password-reset/confirm", confirm);
export default router;
