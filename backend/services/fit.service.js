import crypto from "node:crypto";
import { getMongoDb } from "./mongo.service.js";

const SUPPORTED = ["top", "bottom", "dress", "outerwear"];
const BODY_ZONES = { top: ["chest", "waist", "hips", "shoulder"], dress: ["chest", "waist", "hips", "shoulder"], outerwear: ["chest", "waist", "hips", "shoulder"], bottom: ["waist", "hips"] };
const PROFILE_KEYS = { chest: "bust", waist: "waist", hips: "hips", shoulder: "shoulder" };
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const fail = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
const clean = (value) => String(value || "").trim();
const positive = (value) => { const result = Number(value); return Number.isFinite(result) && result > 0 ? result : null; };
const anonymousActorKey = (userId) => crypto.createHash("sha256").update(String(userId || "")).digest("hex");

export const fitDataStatus = (product) => {
  if (!SUPPORTED.includes(product.fitCategory)) return "unavailable";
  const zones = BODY_ZONES[product.fitCategory];
  const ready = (product.variants || []).filter((variant) => variant.active !== false && zones.every((zone) => positive(variant.fitMeasurements?.[zone])));
  if (ready.length) return "measured";
  return (product.variants || []).some((variant) => SIZE_ORDER.includes(clean(variant.size).toUpperCase())) ? "estimated" : "unavailable";
};

const targetEase = (preference, intent, zone) => {
  const base = { slim: { chest: 6, waist: 4, hips: 5, shoulder: 0.5 }, regular: { chest: 12, waist: 8, hips: 9, shoulder: 1.5 }, relaxed: { chest: 18, waist: 14, hips: 15, shoulder: 3 } }[preference] || { chest: 12, waist: 8, hips: 9, shoulder: 1.5 };
  const intentOffset = intent === "slim" ? -3 : intent === "relaxed" ? 4 : 0;
  return Math.max(0, base[zone] + (zone === "shoulder" ? intentOffset / 4 : intentOffset));
};
const normalizeProfile = (profile = {}, override = {}) => ({
  ...profile,
  ...override,
  measurements: { ...(profile.measurements || {}), ...(override.measurements || {}), ...Object.fromEntries(["height", "weight", "bust", "waist", "hips", "shoulder"].filter((key) => override[key] !== undefined).map((key) => [key, override[key]])) },
});
const zoneResult = (garment, body, target, zone) => {
  if (!garment || !body) return { zone, status: "insufficient_data", ease: null };
  const ease = Number((garment - body).toFixed(1));
  const tolerance = zone === "shoulder" ? 1.5 : 4;
  return { zone, ease, status: ease < Math.max(0, target - tolerance) ? "tight" : ease > target + tolerance ? "relaxed" : "regular" };
};
const sizeIndex = (size) => SIZE_ORDER.indexOf(clean(size).toUpperCase());

const estimateByLabel = (variants, profile) => {
  const bmi = positive(profile.measurements?.weight) && positive(profile.measurements?.height) ? (profile.measurements.weight / ((profile.measurements.height / 100) ** 2)) : null;
  if (!bmi) return null;
  const target = bmi < 18.5 ? 1 : bmi < 23 ? 2 : bmi < 25 ? 3 : bmi < 30 ? 4 : 5;
  const ranked = variants.map((variant) => ({ variant, distance: Math.abs((sizeIndex(variant.size) < 0 ? 99 : sizeIndex(variant.size)) - target) })).filter((item) => item.distance < 90).sort((a, b) => a.distance - b.distance);
  return ranked.length ? ranked.map((item) => item.variant) : null;
};

export const recommendFit = async ({ userId, productId, profileOverride = {}, fitPreference }) => {
  const db = await getMongoDb();
  const [user, product] = await Promise.all([db.collection("users").findOne({ id: userId }), db.collection("products").findOne({ id: productId, status: "published" })]);
  if (!user || !product) fail("Product was not found.", 404);
  if (!user.profile?.fitConsentAt) fail("Fit Finder requires your consent before using body measurements.", 409);
  const profile = normalizeProfile(user.profile, profileOverride);
  const preference = ["slim", "regular", "relaxed"].includes(fitPreference) ? fitPreference : profile.fitPreference || "regular";
  const status = fitDataStatus(product);
  const sellable = (product.variants || []).filter((variant) => variant.active !== false && Number(variant.stockQuantity) > 0);
  if (status === "unavailable" || !sellable.length) return { dataStatus: "unavailable", confidence: "low", recommendedVariantId: null, alternatives: [], zoneFits: [], message: "Shop chưa có đủ dữ liệu để gợi ý size cho sản phẩm này." };
  if (status === "estimated") {
    const ranked = estimateByLabel(sellable, profile);
    if (!ranked) return { dataStatus: "unavailable", confidence: "low", recommendedVariantId: null, alternatives: [], zoneFits: [], message: "Cần chiều cao và cân nặng để ước tính size." };
    return { dataStatus: "estimated", confidence: "low", recommendedVariantId: ranked[0].id, alternatives: ranked.slice(1, 3).map((variant, index) => ({ variantId: variant.id, label: index ? "Rộng hơn" : "Ôm hơn" })), zoneFits: [], message: "Đây là ước tính theo nhãn size, chiều cao và cân nặng; shop chưa cung cấp số đo garment." };
  }
  const zones = BODY_ZONES[product.fitCategory];
  const scored = sellable.map((variant) => {
    const zoneFits = zones.map((zone) => zoneResult(positive(variant.fitMeasurements?.[zone]), positive(profile.measurements?.[PROFILE_KEYS[zone]]), targetEase(preference, product.fitIntent, zone), zone));
    const missing = zoneFits.some((zone) => zone.status === "insufficient_data");
    const tight = zoneFits.some((zone) => zone.status === "tight");
    const score = tight || missing ? -1000 : zoneFits.reduce((sum, zone) => sum - Math.abs(zone.ease - targetEase(preference, product.fitIntent, zone.zone)), 0);
    return { variant, zoneFits, score, missing, tight };
  }).sort((a, b) => b.score - a.score);
  const usable = scored.filter((item) => !item.tight && !item.missing);
  if (!usable.length) return { dataStatus: "measured", confidence: "low", recommendedVariantId: null, alternatives: [], zoneFits: scored[0]?.zoneFits || [], message: "Không có size nào đạt mức vừa vặn an toàn theo số đo đã nhập." };
  const best = usable[0]; const second = usable[1];
  return { dataStatus: "measured", confidence: second && Math.abs(best.score - second.score) < 4 ? "moderate" : "high", recommendedVariantId: best.variant.id, alternatives: usable.slice(1, 3).map((item) => ({ variantId: item.variant.id, label: sizeIndex(item.variant.size) < sizeIndex(best.variant.size) ? "Ôm hơn" : "Rộng hơn" })), zoneFits: best.zoneFits, message: `Size ${best.variant.size || "đề xuất"} phù hợp nhất với kiểu mặc ${preference}.` };
};

export const trackFitEvent = async ({ userId, body }) => {
  const db = await getMongoDb(); const now = new Date();
  const types = ["opened", "recommended", "applied", "add_to_cart", "checkout"];
  if (!types.includes(body.type)) fail("Invalid fit event type.");
  const event = { id: crypto.randomUUID(), actorKey: anonymousActorKey(userId), productId: clean(body.productId), shopId: clean(body.shopId), variantId: clean(body.variantId), type: body.type, dataStatus: clean(body.dataStatus), confidence: clean(body.confidence), createdAt: now };
  await db.collection("fit_events").insertOne(event); return event;
};

export const createFitFeedback = async ({ userId, orderId, item, outcome }) => {
  if (!["too_small", "true_to_size", "too_large"].includes(outcome)) fail("Invalid fit outcome.");
  const db = await getMongoDb(); const order = await db.collection("orders").findOne({ id: orderId, userId, orderStatus: "delivered" });
  if (!order) fail("Delivered order was not found.", 404);
  const line = order.items.find((entry) => entry.variantId === item.variantId);
  if (!line) fail("Order item was not found.", 404);
  const feedback = { id: crypto.randomUUID(), actorKey: anonymousActorKey(userId), orderId, productId: line.productId, shopId: order.shopId, variantId: line.variantId, outcome, createdAt: new Date() };
  await db.collection("fit_feedback").insertOne(feedback); return feedback;
};
