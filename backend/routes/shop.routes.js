import { Router } from "express";
import {
  createMyShop,
  deleteMyShop,
  listMyShops,
  myShopAnalytics,
  myShopInsights,
  updateMyShop,
} from "../controllers/shop.controller.js";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";
import { requireActiveShopSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

router.use(requireShopOwner);
router.get("/me", listMyShops);
router.get("/me/analytics", requireActiveShopSubscription, myShopAnalytics);
router.get("/me/insights", requireActiveShopSubscription, myShopInsights);
router.post("/", createMyShop);
router.put("/:id", updateMyShop);
router.delete("/:id", deleteMyShop);

export default router;
