import { Router } from "express";
import {
  getProduct,
  getShop,
  listOutfits,
  listProducts,
  submitProductFeedback,
} from "../controllers/catalog.controller.js";
import { optionalUser, requireUser } from "../middlewares/userAuth.middleware.js";

const router = Router();

router.get("/products", optionalUser, listProducts);
router.get("/products/:productId", optionalUser, getProduct);
router.post("/products/:productId/feedback", requireUser, submitProductFeedback);
router.get("/outfits", listOutfits);
router.get("/shops/:shopId", optionalUser, getShop);

export default router;
