import { Router } from "express";
import {
  saveMyProfile,
  skipMyProfile,
  uploadMyProfilePhoto,
  toggleFavoriteProduct,
  listFavoriteProducts,
} from "../controllers/user.controller.js";
import {
  createMyAddress, defaultMyAddress, getMyAddresses, removeMyAddress, updateMyAddress,
} from "../controllers/address.controller.js";
import { addToMyCart, myCart, removeMyCartItem, setMyCartAddress, updateMyCartItem } from "../controllers/commerce.controller.js";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import { uploadProductImage } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(requireUser);
router.put("/me/profile", saveMyProfile);
router.patch("/me/profile/skip", skipMyProfile);
router.post("/me/profile-photo", uploadProductImage, uploadMyProfilePhoto);
router.get("/me/favorites", listFavoriteProducts);
router.post("/me/favorites/:productId/toggle", toggleFavoriteProduct);
router.get("/me/addresses", getMyAddresses);
router.post("/me/addresses", createMyAddress);
router.put("/me/addresses/:addressId", updateMyAddress);
router.patch("/me/addresses/:addressId/default", defaultMyAddress);
router.delete("/me/addresses/:addressId", removeMyAddress);
router.get("/me/cart", myCart);
router.post("/me/cart/items", addToMyCart);
router.put("/me/cart/items/:productId/:variantId", updateMyCartItem);
router.delete("/me/cart/items/:productId/:variantId", removeMyCartItem);
router.patch("/me/cart/address", setMyCartAddress);

export default router;
