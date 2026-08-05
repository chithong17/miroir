import { Router } from "express";
import { provinces, wards } from "../controllers/location.controller.js";
const router = Router();
router.get("/provinces", provinces);
router.get("/provinces/:provinceCode/wards", wards);
export default router;
