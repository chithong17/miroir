import { Router } from "express";
import {
  createCatalogTryOnTask,
  createCustomTryOnTask,
  createTryOnTask,
  getTryOnTaskStatus,
} from "../controllers/tryon.controller.js";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import {
  uploadCatalogTryOnImage,
  uploadTryOnImages,
} from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/", uploadTryOnImages, createTryOnTask);

router.post(
  "/catalog",
  requireUser,
  uploadCatalogTryOnImage,
  createCatalogTryOnTask,
);

router.post(
  "/custom",
  requireUser,
  uploadTryOnImages,
  createCustomTryOnTask,
);

router.get("/:taskId", getTryOnTaskStatus);

export default router;
