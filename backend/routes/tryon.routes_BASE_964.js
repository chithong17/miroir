import { Router } from "express";
import {
  createCatalogTryOnTask,
  createCustomTryOnTask,
  createTryOnTask,
  getTryOnTaskStatus,
} from "../controllers/tryon.controller.js";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import { requireUserTryOnAccess } from "../middlewares/subscription.middleware.js";
import {
  uploadProductImage,
  uploadTryOnImages,
} from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/", uploadTryOnImages, createTryOnTask);
router.post(
  "/catalog",
  requireUser,
  requireUserTryOnAccess,
  uploadProductImage,
  createCatalogTryOnTask
);
router.post(
  "/custom",
  requireUser,
  requireUserTryOnAccess,
  uploadTryOnImages,
  createCustomTryOnTask
);
router.get("/:taskId", getTryOnTaskStatus);

export default router;
