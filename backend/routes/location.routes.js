import { Router } from "express";
import { provinces, districts, wards } from "../controllers/location.controller.js";
const router = Router();
router.get("/provinces", provinces);
router.get("/provinces/:provinceCode/districts", districts);
router.get("/districts/:districtCode/wards", wards);
export default router;
