import {
  getCatalogProduct,
  getCatalogShop,
  listCatalogOutfits,
  listCatalogProducts,
} from "../services/catalog.service.js";

export const listProducts = async (req, res, next) => {
  try {
    const result = await listCatalogProducts(req.query || {});
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
    const shop = await getCatalogShop(req.params.shopId);
    return res.json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { product, shop } = await getCatalogProduct(req.params.productId);
    return res.json({
      success: true,
      product: {
        ...product,
        embedding: undefined,
        shop: {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          description: shop.description || "",
          logoUrl: shop.logoUrl || "",
          coverUrl: shop.coverUrl || "",
          contact: shop.contact || {},
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
