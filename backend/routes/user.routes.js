import { Router } from "express";
import {
  saveMyProfile,
  skipMyProfile,
  uploadMyProfilePhoto,
} from "../controllers/user.controller.js";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import { uploadProductImage } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(requireUser);
router.put("/me/profile", saveMyProfile);
router.patch("/me/profile/skip", skipMyProfile);
router.post("/me/profile-photo", uploadProductImage, uploadMyProfilePhoto);

export default router;
