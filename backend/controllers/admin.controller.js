import {
  createAdminProduct,
  createAdminShop,
  deactivateAdminShop,
  exportAdminProductsWorkbook,
  importAdminProductsWorkbook,
  listAdminPaymentPlans,
  listAdminProducts,
  listAdminShopOwners,
  listAdminShops,
  setAdminProductStatus,
  setShopOwnerStatus,
  updateAdminProduct,
  updateAdminPaymentPlan,
  updateAdminShop,
} from "../services/admin.service.js";

export const listPaymentPlans = async (_req, res, next) => {
  try {
    const plans = await listAdminPaymentPlans();
    return res.json({ success: true, plans });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentPlan = async (req, res, next) => {
  try {
    const plan = await updateAdminPaymentPlan({
      planCode: req.params.planCode,
      body: req.body || {},
    });
    return res.json({ success: true, plan });
  } catch (error) {
    next(error);
  }
};

export const listShopOwners = async (req, res, next) => {
  try {
    const owners = await listAdminShopOwners(req.query || {});
    return res.json({ success: true, owners });
  } catch (error) {
    next(error);
  }
};

export const approveShopOwner = async (req, res, next) => {
  try {
    const owner = await setShopOwnerStatus({
      ownerId: req.params.ownerId,
      status: "active",
    });
    return res.json({ success: true, owner });
  } catch (error) {
    next(error);
  }
};

export const rejectShopOwner = async (req, res, next) => {
  try {
    const owner = await setShopOwnerStatus({
      ownerId: req.params.ownerId,
      status: "rejected",
    });
    return res.json({ success: true, owner });
  } catch (error) {
    next(error);
  }
};

export const deactivateShopOwner = async (req, res, next) => {
  try {
    const owner = await setShopOwnerStatus({
      ownerId: req.params.ownerId,
      status: "inactive",
    });
    return res.json({ success: true, owner });
  } catch (error) {
    next(error);
  }
};

export const listShops = async (req, res, next) => {
  try {
    const shops = await listAdminShops(req.query || {});
    return res.json({ success: true, shops });
  } catch (error) {
    next(error);
  }
};

export const createShop = async (req, res, next) => {
  try {
    const shop = await createAdminShop({ body: req.body || {} });
    return res.status(201).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

export const updateShop = async (req, res, next) => {
  try {
    const shop = await updateAdminShop({
      shopId: req.params.shopId,
      body: req.body || {},
    });
    return res.json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

export const deleteShop = async (req, res, next) => {
  try {
    const shop = await deactivateAdminShop({ shopId: req.params.shopId });
    return res.json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

export const listProducts = async (req, res, next) => {
  try {
    const products = await listAdminProducts({
      shopId: req.params.shopId,
      query: req.query || {},
    });
    return res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await createAdminProduct({
      shopId: req.params.shopId,
      body: req.body || {},
    });
    return res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await updateAdminProduct({
      productId: req.params.productId,
      body: req.body || {},
    });
    return res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await setAdminProductStatus({
      productId: req.params.productId,
      status: "trashed",
    });
    return res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const archiveProduct = async (req, res, next) => {
  try {
    const product = await setAdminProductStatus({
      productId: req.params.productId,
      status: "archived",
    });
    return res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const restoreProduct = async (req, res, next) => {
  try {
    const product = await setAdminProductStatus({
      productId: req.params.productId,
      status: "draft",
    });
    return res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const exportProducts = async (req, res, next) => {
  try {
    const buffer = await exportAdminProductsWorkbook({
      shopId: req.params.shopId,
      mode: req.query.mode || "all",
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="miroir-admin-products-${req.params.shopId}.xlsx"`
    );
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const importProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "file is required.",
      });
    }

    const importJob = await importAdminProductsWorkbook({
      shopId: req.params.shopId,
      file: req.file,
    });

    return res.status(importJob.status === "failed" ? 400 : 201).json({
      success: importJob.status !== "failed",
      importJob,
    });
  } catch (error) {
    next(error);
  }
};
