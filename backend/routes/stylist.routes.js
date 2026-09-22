import { Router } from "express";
import {
  recommendOutfit,
  submitStylistFeedback,
} from "../controllers/stylist.controller.js";
import { optionalUser } from "../middlewares/userAuth.middleware.js";

const router = Router();

router.post("/recommend", optionalUser, recommendOutfit);
router.post("/feedback", submitStylistFeedback);

export default router;
