import { Router } from "express";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import { uploadOrderAttachments, uploadProductImage } from "../middlewares/upload.middleware.js";
import { createMyDispute, myDispute, myDisputes, replyMyDispute } from "../controllers/dispute.controller.js";
import {
  addToMyCart, cancelMyOrder, checkout, myCart, myOrder, myOrders, previewMyBuyNow,
  removeMyCartItem, reportMyTransfer, setMyCartAddress, updateMyCartItem,
} from "../controllers/commerce.controller.js";

const router = Router();
router.use(requireUser);
router.get("/cart", myCart);
router.post("/cart/items", addToMyCart);
router.put("/cart/items/:productId/:variantId", updateMyCartItem);
router.delete("/cart/items/:productId/:variantId", removeMyCartItem);
router.patch("/cart/address", setMyCartAddress);
router.post("/buy-now/preview", previewMyBuyNow);
router.post("/checkout", checkout);
router.get("/me", myOrders);
router.get("/me/:orderId", myOrder);
router.post("/me/:orderId/transfer-reported", uploadProductImage, reportMyTransfer);
router.post("/me/:orderId/cancel", cancelMyOrder);
router.get("/disputes/me", myDisputes);
router.get("/disputes/me/:disputeId", myDispute);
router.post("/me/:orderId/disputes", uploadOrderAttachments, createMyDispute);
router.post("/disputes/me/:disputeId/messages", uploadOrderAttachments, replyMyDispute);
export default router;
