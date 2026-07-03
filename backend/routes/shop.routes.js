import { Router } from "express";
import {
  createMyShop,
  deleteMyShop,
  listMyShops,
  updateMyShop,
} from "../controllers/shop.controller.js";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";

const router = Router();

router.use(requireShopOwner);
router.get("/me", listMyShops);
router.post("/", createMyShop);
router.put("/:id", updateMyShop);
router.delete("/:id", deleteMyShop);

export default router;
