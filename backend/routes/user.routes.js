import { Router } from "express";
import {
  saveMyProfile,
  skipMyProfile,
  uploadMyProfilePhoto,
  toggleFavoriteProduct,
  listFavoriteProducts,
} from "../controllers/user.controller.js";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import { uploadProductImage } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(requireUser);
router.put("/me/profile", saveMyProfile);
router.patch("/me/profile/skip", skipMyProfile);
router.post("/me/profile-photo", uploadProductImage, uploadMyProfilePhoto);
router.get("/me/favorites", listFavoriteProducts);
router.post("/me/favorites/:productId/toggle", toggleFavoriteProduct);

export default router;
