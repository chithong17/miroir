import { Router } from "express";
import {
  createTryOnTask,
  getTryOnTaskStatus,
} from "../controllers/tryon.controller.js";
import { uploadTryOnImages } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/", uploadTryOnImages, createTryOnTask);
router.get("/:taskId", getTryOnTaskStatus);

export default router;
