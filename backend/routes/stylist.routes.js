import { Router } from "express";
import {
  recommendOutfit,
  submitStylistFeedback,
} from "../controllers/stylist.controller.js";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import { requireUserPremium } from "../middlewares/subscription.middleware.js";

const router = Router();

router.post("/recommend", requireUser, requireUserPremium, recommendOutfit);
router.post("/feedback", submitStylistFeedback);

export default router;
