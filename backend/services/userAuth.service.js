import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getMongoDb } from "./mongo.service.js";
import { buildSubscriptionSummary, getPremiumShopIds } from "./subscription.service.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const cleanString = (value) => String(value || "").trim();

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured.");
    error.statusCode = 503;
    throw error;
  }
  return process.env.JWT_SECRET;
};

export const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  status: user.status,
  profile: user.profile || {},
  favoriteProductIds: user.favoriteProductIds || [],
  profileCompleted: Boolean(user.profileCompleted),
  profileSkipped: Boolean(user.profileSkipped),
  subscription: buildSubscriptionSummary({
    accountType: "user",
    subscription: user.subscription,
  }),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const signUserToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: "user",
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

export const verifyUserToken = (token) => jwt.verify(token, getJwtSecret());

export const registerUser = async ({ email, password, name }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password || !cleanString(name)) {
    const error = new Error("email, password, and name are required.");
    error.statusCode = 400;
    throw error;
  }

  if (String(password).length < 6) {
    const error = new Error("Password must be at least 6 characters.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const existing = await db.collection("users").findOne({ email: normalizedEmail });

  if (existing) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const now = new Date();
  const user = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    name: cleanString(name),
    status: "active",
    profile: {},
    profileCompleted: false,
    profileSkipped: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("users").insertOne(user);
  return { user: toPublicUser(user), token: signUserToken(user) };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    const error = new Error("email and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const user = await db.collection("users").findOne({ email: normalizedEmail });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("This user account is not active.");
    error.statusCode = 403;
    throw error;
  }

  return { user: toPublicUser(user), token: signUserToken(user) };
};

export const getRawUserById = async (userId) => {
  const db = await getMongoDb();
  return db.collection("users").findOne({ id: userId });
};

export const getUserById = async (userId) => {
  const user = await getRawUserById(userId);
  return user ? toPublicUser(user) : null;
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const normalizeProfile = (body = {}) => {
  const profile = {
    gender: cleanString(body.gender),
    bodyShape: cleanString(body.bodyShape),
    skinTone: cleanString(body.skinTone),
    stylePreferences: Array.isArray(body.stylePreferences)
      ? body.stylePreferences.map(cleanString).filter(Boolean)
      : String(body.stylePreferences || "")
          .split(",")
          .map(cleanString)
          .filter(Boolean),
    measurements: {
      height: toPositiveNumber(body.height ?? body.measurements?.height),
      weight: toPositiveNumber(body.weight ?? body.measurements?.weight),
      bust: toPositiveNumber(body.bust ?? body.measurements?.bust),
      waist: toPositiveNumber(body.waist ?? body.measurements?.waist),
      hips: toPositiveNumber(body.hips ?? body.measurements?.hips),
      shoulder: toPositiveNumber(body.shoulder ?? body.measurements?.shoulder),
    },
    modelImageUrl: cleanString(body.modelImageUrl),
    modelImagePublicId: cleanString(body.modelImagePublicId),
    fitPreference: ["slim", "regular", "relaxed"].includes(body.fitPreference) ? body.fitPreference : undefined,
    fitConsentAt: body.fitConsent === true ? new Date() : body.fitConsent === false ? null : undefined,
  };

  Object.keys(profile.measurements).forEach((key) => {
    if (profile.measurements[key] === undefined) delete profile.measurements[key];
  });
  Object.keys(profile).forEach((key) => {
    if (
      profile[key] === "" || profile[key] === undefined ||
      (Array.isArray(profile[key]) && profile[key].length === 0) ||
      (key === "measurements" && Object.keys(profile.measurements).length === 0)
    ) {
      delete profile[key];
    }
  });

  return profile;
};

export const updateUserProfile = async ({ userId, body }) => {
  const db = await getMongoDb();
  const user = await db.collection("users").findOne({ id: userId });
  if (!user) {
    const error = new Error("User was not found.");
    error.statusCode = 404;
    throw error;
  }

  const patch = {
    profile: {
      ...(user.profile || {}),
      ...normalizeProfile(body),
    },
    profileCompleted: true,
    profileSkipped: false,
    updatedAt: new Date(),
  };

  await db.collection("users").updateOne({ id: userId }, { $set: patch });
  return toPublicUser({ ...user, ...patch });
};

export const skipUserProfile = async ({ userId }) => {
  const db = await getMongoDb();
  const user = await db.collection("users").findOne({ id: userId });
  if (!user) {
    const error = new Error("User was not found.");
    error.statusCode = 404;
    throw error;
  }

  const patch = { profileSkipped: true, updatedAt: new Date() };
  await db.collection("users").updateOne({ id: userId }, { $set: patch });
  return toPublicUser({ ...user, ...patch });
};

export const toggleUserFavoriteProduct = async (userId, productId) => {
  const db = await getMongoDb();
  const user = await db.collection("users").findOne({ id: userId });
  if (!user) throw new Error("User not found");

  const favoriteProductIds = user.favoriteProductIds || [];
  const isFavorited = favoriteProductIds.includes(productId);

  if (!isFavorited) {
    const product = await db.collection("products").findOne({ id: productId, status: "published", variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } } });
    const activeShopIds = product ? await getPremiumShopIds([product.shopId]) : new Set();
    if (!product || !activeShopIds.has(product.shopId)) {
      const error = new Error("Product is not available."); error.statusCode = 404; throw error;
    }
  }

  const updateOp = isFavorited
    ? { $pull: { favoriteProductIds: productId } }
    : { $addToSet: { favoriteProductIds: productId } };

  await db.collection("users").updateOne({ id: userId }, updateOp);
  const updatedUser = await db.collection("users").findOne({ id: userId });
  return updatedUser.favoriteProductIds || [];
};

export const getUserFavoriteProducts = async (userId) => {
  const db = await getMongoDb();
  const user = await db.collection("users").findOne({ id: userId });
  if (!user) throw new Error("User not found");

  const favoriteProductIds = user.favoriteProductIds || [];
  if (favoriteProductIds.length === 0) return { products: [], shops: [] };

  const products = await db.collection("products").find({ id: { $in: favoriteProductIds }, status: "published", variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } } }).toArray();
  const shopIds = [...new Set(products.map(p => p.shopId))];
  const activePaidShopIds = await getPremiumShopIds(shopIds);
  const shops = await db.collection("shops").find({ id: { $in: [...activePaidShopIds] }, status: "active" }).toArray();
  const visibleShopIds = new Set(shops.map((shop) => shop.id));
  
  // Note: we can import toPublicProduct and withShopInfo from catalog.service.js but since we only have toPublicProduct in product.service.js, we should probably do a quick mapping or let the controller handle it.
  // We need to return them in a format similar to listCatalogProducts.
  // I'll return the raw products and shops, and the controller will format them.
  return { products: products.filter((product) => visibleShopIds.has(product.shopId)), shops };
};


