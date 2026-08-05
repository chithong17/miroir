import { Router } from "express";
import {
  recommendOutfit,
  submitStylistFeedback,
} from "../controllers/stylist.controller.js";
import { requireUser } from "../middlewares/userAuth.middleware.js";

const router = Router();

router.post("/recommend", requireUser, recommendOutfit);
router.post("/feedback", submitStylistFeedback);

export default router;
