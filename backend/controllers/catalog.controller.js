import {
  getCatalogProduct,
  getCatalogShop,
  listCatalogOutfits,
  listCatalogProducts,
} from "../services/catalog.service.js";
import { submitProductFeedback as submitProductFeedbackService } from "../services/productFeedback.service.js";
import { trackShopEvent } from "../services/shopAnalytics.service.js";
import { PLAN_CODES } from "../services/subscription.service.js";

export const listProducts = async (req, res, next) => {
  try {
    const result = await listCatalogProducts(req.query || {}, {
      viewerIsPremium: Boolean(req.user?.subscription?.isPremium),
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const listOutfits = async (req, res, next) => {
  try {
    const result = await listCatalogOutfits(req.query || {});
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getShop = async (req, res, next) => {
  try {
    if (!req.user?.subscription?.isPremium) {
      return res.status(403).json({
        success: false,
        message: "MIROIR Premium is required to view shop details.",
        subscriptionRequired: true,
        planCode: PLAN_CODES.USER_PREMIUM_MONTHLY,
      });
    }

    const shop = await getCatalogShop(req.params.shopId);
    return res.json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { product, shop } = await getCatalogProduct(req.params.productId);
    const viewerIsPremium = Boolean(req.user?.subscription?.isPremium);
    await trackShopEvent({
      eventType: "product_view",
      shopId: product.shopId,
      productId: product.id,
      metadata: {
        source: "catalog_product_detail",
        category: product.category,
        productStyleTags: product.styleTags || [],
        productColors: product.colors || [],
      },
    });
    return res.json({
      success: true,
      product: {
        ...product,
        embedding: undefined,
        shop: viewerIsPremium
          ? {
              id: shop.id,
              name: shop.name,
              slug: shop.slug,
              description: shop.description || "",
              logoUrl: shop.logoUrl || "",
              coverUrl: shop.coverUrl || "",
              contact: shop.contact || {},
            }
          : null,
        premiumShopDetailsRequired: !viewerIsPremium,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitProductFeedback = async (req, res, next) => {
  try {
    const result = await submitProductFeedbackService({
      productId: req.params.productId,
      userId: req.user.id,
      body: req.body || {},
    });
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
