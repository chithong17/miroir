import { Router } from "express";
import {
  approveShopOwner,
  archiveProduct,
  createProduct,
  createShop,
  deactivateShopOwner,
  deleteProduct,
  deleteShop,
  exportProducts,
  importProducts,
  listPaymentPlans,
  listProducts,
  listShopOwners,
  listShops,
  rejectShopOwner,
  restoreProduct,
  updateProduct,
  updatePaymentPlan,
  updateShop,
} from "../controllers/admin.controller.js";
import { requireAdmin } from "../middlewares/adminAuth.middleware.js";
import { uploadProductImportFile } from "../middlewares/upload.middleware.js";
import { uploadOrderAttachments } from "../middlewares/upload.middleware.js";
import { adminDispute, adminDisputes, updateAdminDispute } from "../controllers/dispute.controller.js";
import { adminNotifications, readAdminNotification } from "../controllers/notification.controller.js";

const router = Router();

router.use(requireAdmin);

router.get("/payment-plans", listPaymentPlans);
router.put("/payment-plans/:planCode", updatePaymentPlan);

router.get("/shop-owners", listShopOwners);
router.patch("/shop-owners/:ownerId/approve", approveShopOwner);
router.patch("/shop-owners/:ownerId/reject", rejectShopOwner);
router.patch("/shop-owners/:ownerId/deactivate", deactivateShopOwner);

router.get("/shops", listShops);
router.post("/shops", createShop);
router.put("/shops/:shopId", updateShop);
router.delete("/shops/:shopId", deleteShop);

router.get("/shops/:shopId/products", listProducts);
router.post("/shops/:shopId/products", createProduct);
router.get("/shops/:shopId/products/export", exportProducts);
router.post("/shops/:shopId/products/import", uploadProductImportFile, importProducts);

router.put("/products/:productId", updateProduct);
router.delete("/products/:productId", deleteProduct);
router.patch("/products/:productId/archive", archiveProduct);
router.patch("/products/:productId/restore", restoreProduct);

router.get("/disputes", adminDisputes);
router.get("/disputes/:disputeId", adminDispute);
router.patch("/disputes/:disputeId", uploadOrderAttachments, updateAdminDispute);
router.get("/notifications", adminNotifications);
router.patch("/notifications/:id/read", readAdminNotification);

export default router;
