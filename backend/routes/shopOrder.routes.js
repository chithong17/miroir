import { Router } from "express";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";
import { uploadOrderAttachments, uploadProductImage } from "../middlewares/upload.middleware.js";
import { ownerDispute, ownerDisputes, replyOwnerDispute } from "../controllers/dispute.controller.js";
import {
  changeShopOrderStatus, changeShopPayment, resolveShopCancellation, shopOrder, shopOrders,
} from "../controllers/commerce.controller.js";

const router = Router();
router.use(requireShopOwner);
router.get("/", shopOrders);
router.get("/:orderId", shopOrder);
router.patch("/:orderId/status", changeShopOrderStatus);
router.patch("/:orderId/cancellation", resolveShopCancellation);
router.patch("/:orderId/payment", uploadProductImage, changeShopPayment);
router.get("/disputes/all", ownerDisputes);
router.get("/disputes/:disputeId", ownerDispute);
router.post("/disputes/:disputeId/messages", uploadOrderAttachments, replyOwnerDispute);
export default router;
