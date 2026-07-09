import { Router } from "express";
import {
  getProduct,
  getShop,
  listOutfits,
  listProducts,
} from "../controllers/catalog.controller.js";

const router = Router();

router.get("/products", listProducts);
router.get("/products/:productId", getProduct);
router.get("/outfits", listOutfits);
router.get("/shops/:shopId", getShop);

export default router;
