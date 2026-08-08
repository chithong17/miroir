import { Router } from "express";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import { createFitEvent, getFitRecommendation } from "../controllers/fit.controller.js";

const router = Router();
router.use(requireUser);
router.post("/recommendations", getFitRecommendation);
router.post("/events", createFitEvent);
export default router;
