import { Router } from "express";
import { getMyShippingConfigs, updateMyShippingConfig } from "../controllers/shipping.controller.js";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";

const router = Router();

// Phải là chủ shop mới có quyền thao tác cấu hình vận chuyển
router.use(requireShopOwner);

router.get("/me", getMyShippingConfigs);
router.put("/me/:provider", updateMyShippingConfig);

export default router;
