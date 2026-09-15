import {
  createShop,
  deactivateShop,
  listOwnerShops,
  updateShop,
} from "../services/shop.service.js";
import {
  getShopAnalytics,
  getShopDashboard,
  getShopInsights,
} from "../services/shopAnalytics.service.js";
import { uploadImageBuffer } from "../services/cloudinary.service.js";
import { getSingleOwnerShop } from "../services/shop.service.js";
import { isGrowthPlan } from "../services/subscription.service.js";
import { getGrowthAdvice, getProStrategyReport } from "../services/shopAdvice.service.js";

export const myShopAdvice = async (req, res, next) => {
  try { res.json({ success: true, advice: await getGrowthAdvice(req.owner.id, req.query.range || "30d") }); }
  catch (error) { next(error); }
};

export const myShopStrategy = async (req, res, next) => {
  try { res.json({ success: true, report: await getProStrategyReport({ ownerId: req.owner.id, cycleId: req.owner.subscription?.cycleId }) }); }
  catch (error) { next(error); }
};

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

export const myShopAnalytics = async (req, res, next) => {
  try {
    const analytics = await getShopAnalytics({
      ownerId: req.owner.id,
      range: req.query.range || "30d",
    });
    const basic = !isGrowthPlan(req.owner.subscription?.planCode);
    return res.json({ success: true, analytics: basic ? { range: analytics.range, shop: analytics.shop, summary: analytics.summary, timeSeries: analytics.timeSeries } : analytics });
  } catch (error) {
    next(error);
  }
};

export const myShopInsights = async (req, res, next) => {
  try {
    const insights = await getShopInsights({
      ownerId: req.owner.id,
      range: req.query.range || "30d",
    });
    return res.json({ success: true, insights });
  } catch (error) {
    next(error);
  }
};

export const myShopDashboard = async (req, res, next) => {
  try {
    const dashboard = await getShopDashboard({
      ownerId: req.owner.id,
      range: req.query.range || "30d",
    });
    const basic = !isGrowthPlan(req.owner.subscription?.planCode);
    return res.json({ success: true, dashboard: basic ? { range: dashboard.range, shop: dashboard.shop, tier: "basic", summary: { totalOrders: dashboard.summary.totalOrders, collectedRevenue: dashboard.summary.collectedRevenue }, inventoryHealth: dashboard.inventoryHealth } : { ...dashboard, tier: req.owner.subscription?.planCode === "PRO_INSIGHT" ? "pro" : "growth" } });
  } catch (error) {
    next(error);
  }
};

export const uploadMyShopQr = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "QR image is required." });
    const shop = await getSingleOwnerShop(req.owner.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop was not found." });
    const uploaded = await uploadImageBuffer(req.file.buffer, req.file.originalname);
    const updated = await updateShop({
      ownerId: req.owner.id,
      shopId: shop.id,
      body: { paymentSettings: { ...(shop.paymentSettings || {}), qrImageUrl: uploaded.secure_url, qrImagePublicId: uploaded.public_id } },
    });
    return res.json({ success: true, shop: updated, qrImageUrl: uploaded.secure_url, qrImagePublicId: uploaded.public_id });
  } catch (error) { next(error); }
};
