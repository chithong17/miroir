import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const cleanString = (value) => String(value || "").trim();

const toPublicShop = (shop) => ({
  id: shop.id,
  ownerId: shop.ownerId,
  name: shop.name,
  slug: shop.slug,
  description: shop.description || "",
  logoUrl: shop.logoUrl || "",
  coverUrl: shop.coverUrl || "",
  contact: shop.contact || {},
  status: shop.status,
  createdAt: shop.createdAt,
  updatedAt: shop.updatedAt,
});

const ensureUniqueSlug = async ({ db, slug, shopId }) => {
  const existing = await db.collection("shops").findOne({
    slug,
    ...(shopId ? { id: { $ne: shopId } } : {}),
  });

  if (existing) {
    const error = new Error("Shop slug is already used.");
    error.statusCode = 409;
    throw error;
  }
};

export const listOwnerShops = async (ownerId) => {
  const db = await getMongoDb();
  const shops = await db
    .collection("shops")
    .find({ ownerId })
    .sort({ createdAt: 1 })
    .limit(1)
    .toArray();

  return shops.map(toPublicShop);
};

export const getSingleOwnerShop = async (ownerId) => {
  const db = await getMongoDb();
  return db.collection("shops").findOne({ ownerId }, { sort: { createdAt: 1 } });
};

export const getOwnerShop = async ({ ownerId, shopId }) => {
  const db = await getMongoDb();
  const shop = await db.collection("shops").findOne({ id: shopId, ownerId });

  if (!shop) {
    const error = new Error("Shop was not found.");
    error.statusCode = 404;
    throw error;
  }

  return shop;
};

export const createShop = async ({ ownerId, body }) => {
  const name = cleanString(body.name);

  if (!name) {
    const error = new Error("Shop name is required.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const existingOwnerShop = await db.collection("shops").findOne({ ownerId });

  if (existingOwnerShop) {
    const error = new Error("This shop owner already has a shop.");
    error.statusCode = 409;
    throw error;
  }

  const slug = slugify(body.slug || name);

  if (!slug) {
    const error = new Error("Shop slug is required.");
    error.statusCode = 400;
    throw error;
  }

  await ensureUniqueSlug({ db, slug });

  const now = new Date();
  const shop = {
    id: crypto.randomUUID(),
    ownerId,
    name,
    slug,
    description: cleanString(body.description),
    logoUrl: cleanString(body.logoUrl),
    coverUrl: cleanString(body.coverUrl),
    contact: body.contact && typeof body.contact === "object" ? body.contact : {},
    status: ["active", "inactive"].includes(body.status) ? body.status : "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("shops").insertOne(shop);
  return toPublicShop(shop);
};

export const updateShop = async ({ ownerId, shopId, body }) => {
  const db = await getMongoDb();
  const shop = await getOwnerShop({ ownerId, shopId });
  const patch = {
    updatedAt: new Date(),
  };

  if (body.name !== undefined) {
    const name = cleanString(body.name);
    if (!name) {
      const error = new Error("Shop name cannot be empty.");
      error.statusCode = 400;
      throw error;
    }
    patch.name = name;
  }

  if (body.slug !== undefined) {
    const slug = slugify(body.slug);
    if (!slug) {
      const error = new Error("Shop slug cannot be empty.");
      error.statusCode = 400;
      throw error;
    }
    await ensureUniqueSlug({ db, slug, shopId: shop.id });
    patch.slug = slug;
  }

  ["description", "logoUrl", "coverUrl"].forEach((field) => {
    if (body[field] !== undefined) {
      patch[field] = cleanString(body[field]);
    }
  });

  if (body.contact !== undefined) {
    patch.contact = body.contact && typeof body.contact === "object" ? body.contact : {};
  }

  if (body.status !== undefined) {
    if (!["active", "inactive"].includes(body.status)) {
      const error = new Error("Shop status must be active or inactive.");
      error.statusCode = 400;
      throw error;
    }
    patch.status = body.status;
  }

  await db.collection("shops").updateOne({ id: shop.id }, { $set: patch });
  return toPublicShop({ ...shop, ...patch });
};

export const deactivateShop = async ({ ownerId, shopId }) => {
  const db = await getMongoDb();
  const shop = await getOwnerShop({ ownerId, shopId });
  const patch = {
    status: "inactive",
    updatedAt: new Date(),
  };

  await db.collection("shops").updateOne({ id: shop.id }, { $set: patch });
  return toPublicShop({ ...shop, ...patch });
};

export const getActiveShopsByIds = async (shopIds) => {
  if (!shopIds.length) return [];

  const db = await getMongoDb();
  return db
    .collection("shops")
    .find({ id: { $in: shopIds }, status: "active" })
    .project({ _id: 0 })
    .toArray();
};
