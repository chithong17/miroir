import { uploadImageBuffer } from "../services/cloudinary.service.js";
import { toPublicProduct } from "../services/product.service.js";
import {
  skipUserProfile,
  updateUserProfile,
} from "../services/userAuth.service.js";

export const saveMyProfile = async (req, res, next) => {
  try {
    const user = await updateUserProfile({
      userId: req.user.id,
      body: req.body || {},
    });
    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const skipMyProfile = async (req, res, next) => {
  try {
    const user = await skipUserProfile({ userId: req.user.id });
    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const uploadMyProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "image file is required." });
    }

    const result = await uploadImageBuffer(req.file.buffer, req.file.originalname);
    const user = await updateUserProfile({
      userId: req.user.id,
      body: {
        modelImageUrl: result.secure_url,
        modelImagePublicId: result.public_id,
      },
    });

    return res.status(201).json({
      success: true,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      user,
    });
  } catch (error) {
    next(error);
  }
};

import { toggleUserFavoriteProduct, getUserFavoriteProducts } from "../services/userAuth.service.js";

export const toggleFavoriteProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const favoriteProductIds = await toggleUserFavoriteProduct(req.user.id, productId);
    return res.json({ success: true, favoriteProductIds });
  } catch (error) {
    next(error);
  }
};

export const listFavoriteProducts = async (req, res, next) => {
  try {
    const { products, shops } = await getUserFavoriteProducts(req.user.id);
    
    const publicShop = (shop) => ({
      id: shop.id,
      name: shop.name,
      displayName: shop.name,
      slug: shop.slug,
      description: shop.description || "",
      logoUrl: shop.logoUrl || "",
      coverUrl: shop.coverUrl || "",
      contact: {
        address: shop.contact?.address || "",
        email: shop.contact?.email || "",
        phone: shop.contact?.phone || "",
      },
    });

    const shopById = new Map(shops.map((shop) => [shop.id, publicShop(shop)]));
    const formattedProducts = products.map((product) => ({
      ...toPublicProduct(product),
      shop: shopById.get(product.shopId) || null,
    }));

    return res.json({ success: true, products: formattedProducts });
  } catch (error) {
    next(error);
  }
};



