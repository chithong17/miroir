import {
  createShop,
  deactivateShop,
  listOwnerShops,
  updateShop,
} from "../services/shop.service.js";

export const listMyShops = async (req, res, next) => {
  try {
    const shops = await listOwnerShops(req.owner.id);
    return res.json({
      success: true,
      shops,
    });
  } catch (error) {
    next(error);
  }
};

export const createMyShop = async (req, res, next) => {
  try {
    const shop = await createShop({
      ownerId: req.owner.id,
      body: req.body || {},
    });

    return res.status(201).json({
      success: true,
      shop,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyShop = async (req, res, next) => {
  try {
    const shop = await updateShop({
      ownerId: req.owner.id,
      shopId: req.params.id,
      body: req.body || {},
    });

    return res.json({
      success: true,
      shop,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMyShop = async (req, res, next) => {
  try {
    const shop = await deactivateShop({
      ownerId: req.owner.id,
      shopId: req.params.id,
    });

    return res.json({
      success: true,
      shop,
    });
  } catch (error) {
    next(error);
  }
};
