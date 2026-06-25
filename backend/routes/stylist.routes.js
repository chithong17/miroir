import { Router } from "express";
import {
  recommendOutfit,
  submitStylistFeedback,
} from "../controllers/stylist.controller.js";

const router = Router();

router.post("/recommend", recommendOutfit);
router.post("/feedback", submitStylistFeedback);

export default router;
