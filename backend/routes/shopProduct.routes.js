import { Router } from "express";
import {
  archiveShopProduct,
  createShopProduct,
  deleteShopProduct,
  downloadImportTemplate,
  getProduct,
  getProductImportJob,
  hardDeleteShopProduct,
  importProducts,
  listProducts,
  restoreShopProduct,
  updateShopProduct,
  uploadProductImage,
  updateShopProductsAI,
  getShopProductsAIJob,
} from "../controllers/shopProduct.controller.js";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";
import { requireActiveShopSubscription } from "../middlewares/subscription.middleware.js";
import {
  uploadProductImage as uploadProductImageMiddleware,
  uploadProductImportFile,
} from "../middlewares/upload.middleware.js";

const router = Router();

router.use(requireShopOwner);
router.get("/", listProducts);
router.post("/", requireActiveShopSubscription, createShopProduct);
router.post(
  "/upload-image",
  requireActiveShopSubscription,
  uploadProductImageMiddleware,
  uploadProductImage
);
router.get("/import-template", downloadImportTemplate);
router.post(
  "/import",
  requireActiveShopSubscription,
  uploadProductImportFile,
  importProducts
);
router.get("/import-jobs/:id", getProductImportJob);
router.post("/update-ai", requireActiveShopSubscription, updateShopProductsAI);
router.get("/ai-jobs/:id", getShopProductsAIJob);
router.get("/:id", getProduct);
router.put("/:id", requireActiveShopSubscription, updateShopProduct);
router.patch("/:id/archive", archiveShopProduct);
router.patch("/:id/restore", restoreShopProduct);
router.delete("/:id/permanent", hardDeleteShopProduct);
router.delete("/:id", deleteShopProduct);

export default router;
