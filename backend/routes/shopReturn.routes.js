import { Router } from "express";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";
import { uploadOrderAttachments } from "../middlewares/upload.middleware.js";
import { decideShopReturn, receiveShopReturn, refundShopReturn, shopReturn, shopReturns } from "../controllers/return.controller.js";

const router = Router();
router.use(requireShopOwner);
router.get("/", shopReturns);
router.get("/:returnId", shopReturn);
router.patch("/:returnId/decision", decideShopReturn);
router.patch("/:returnId/received", receiveShopReturn);
router.patch("/:returnId/refund", uploadOrderAttachments, refundShopReturn);
export default router;
