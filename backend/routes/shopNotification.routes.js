import { Router } from "express";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";
import { readShopNotification, shopNotifications } from "../controllers/notification.controller.js";
const router = Router();
router.use(requireShopOwner);
router.get("/", shopNotifications);
router.patch("/:id/read", readShopNotification);
export default router;
