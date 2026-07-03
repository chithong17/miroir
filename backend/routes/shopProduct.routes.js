import { Router } from "express";
import {
  createShopProduct,
  deleteShopProduct,
  downloadImportTemplate,
  getProduct,
  getProductImportJob,
  importProducts,
  listProducts,
  updateShopProduct,
  uploadProductImage,
} from "../controllers/shopProduct.controller.js";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";
import {
  uploadProductImage as uploadProductImageMiddleware,
  uploadProductImportFile,
} from "../middlewares/upload.middleware.js";

const router = Router();

router.use(requireShopOwner);
router.get("/", listProducts);
router.post("/", createShopProduct);
router.post("/upload-image", uploadProductImageMiddleware, uploadProductImage);
router.get("/import-template", downloadImportTemplate);
router.post("/import", uploadProductImportFile, importProducts);
router.get("/import-jobs/:id", getProductImportJob);
router.get("/:id", getProduct);
router.put("/:id", updateShopProduct);
router.delete("/:id", deleteShopProduct);

export default router;
