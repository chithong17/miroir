import { Router } from "express";
import {
  createMyShop,
  deleteMyShop,
  listMyShops,
  myShopAnalytics,
  myShopDashboard,
  myShopInsights,
  myShopAdvice,
  myShopStrategy,
  updateMyShop,
  uploadMyShopQr,
} from "../controllers/shop.controller.js";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";
import { requireActiveShopSubscription, requireGrowthShopSubscription, requireProShopSubscription } from "../middlewares/subscription.middleware.js";
import { uploadProductImage } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(requireShopOwner);
router.get("/me", listMyShops);
router.get("/me/analytics", requireActiveShopSubscription, myShopAnalytics);
router.get("/me/dashboard", requireActiveShopSubscription, myShopDashboard);
router.get("/me/insights", requireProShopSubscription, myShopInsights);
router.get("/me/advice", requireGrowthShopSubscription, myShopAdvice);
router.get("/me/strategy", requireProShopSubscription, myShopStrategy);
router.post("/me/payment-qr", uploadProductImage, uploadMyShopQr);
router.post("/", createMyShop);
router.put("/:id", updateMyShop);
router.delete("/:id", deleteMyShop);

export default router;
