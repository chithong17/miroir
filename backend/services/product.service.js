import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";
import { getOwnerShop, getSingleOwnerShop } from "./shop.service.js";

const PRODUCT_STATUSES = ["draft", "published", "archived", "trashed"];
const AVAILABILITIES = ["in_stock", "out_of_stock"];
const GENDERS = ["female", "male", "unisex"];
const EMBEDDING_FIELDS = [
  "name",
  "category",
  "description",
  "colors",
  "styleTags",
  "occasionTags",
  "material",
  "gender",
  "fitType",
];

const cleanString = (value) => String(value || "").trim();

const asStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => cleanString(item))
      .filter(Boolean);
  }

  return [];
};

const parsePrice = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const normalizeVariants = (value) => {
  if (!Array.isArray(value)) return { variants: undefined, errors: ["variants must be an array."] };
  const errors = [];
  const ids = new Set();
  const skus = new Set();
  const variants = value.map((item, index) => {
    const id = cleanString(item?.id) || crypto.randomUUID();
    const sku = cleanString(item?.sku).toUpperCase();
    const color = cleanString(item?.color);
    const size = cleanString(item?.size);
    const stockQuantity = Number(item?.stockQuantity);
    if (!sku) errors.push(`variants[${index}].sku is required.`);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      errors.push(`variants[${index}].stockQuantity must be a non-negative integer.`);
    }
    if (ids.has(id)) errors.push(`Duplicate variant id: ${id}.`);
    if (skus.has(sku)) errors.push(`Duplicate SKU in product: ${sku}.`);
    ids.add(id);
    skus.add(sku);
    return { id, sku, color, size, stockQuantity, active: item?.active !== false };
  });
  return { variants, errors };
};

const applyVariantDerivedFields = (normalized) => {
  if (!normalized.variants) return;
  normalized.colors = [...new Set(normalized.variants.map((item) => item.color).filter(Boolean))];
  normalized.sizes = [...new Set(normalized.variants.map((item) => item.size).filter(Boolean))];
  normalized.availability = normalized.variants.some(
    (item) => item.active && item.stockQuantity > 0
  ) ? "in_stock" : "out_of_stock";
};

export const productNeedsEmbeddingReset = (body) =>
  EMBEDDING_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(body, field));

export const toPublicProduct = (product) => ({
  id: product.id,
  shopId: product.shopId,
  name: product.name,
  category: product.category,
  description: product.description || "",
  colors: product.colors || [],
  sizes: product.sizes || [],
  variants: product.variants || [],
  price: product.price,
  gender: product.gender,
  availability: product.availability,
  imageUrl: product.imageUrl || "",
  imagePublicId: product.imagePublicId || "",
  styleTags: product.styleTags || [],
  occasionTags: product.occasionTags || [],
  material: product.material || "",
  fitType: product.fitType || "",
  status: product.status,
  embeddingStale: Boolean(product.embeddingStale),
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  embeddingUpdatedAt: product.embeddingUpdatedAt,
});

export const normalizeProductPayload = (body, { partial = false } = {}) => {
  const normalized = {};
  const errors = [];
  const requireField = (field, label = field) => {
    if (!partial && !cleanString(body[field])) {
      errors.push(`${label} is required.`);
    }
  };

  ["name", "category", "description", "gender", "availability"].forEach((field) =>
    requireField(field)
  );

  if (!partial && body.price === undefined) {
    errors.push("price is required.");
  }

  ["name", "category", "description", "material", "fitType", "imageUrl", "imagePublicId"].forEach(
    (field) => {
      if (body[field] !== undefined) normalized[field] = cleanString(body[field]);
    }
  );

  ["colors", "sizes", "styleTags", "occasionTags"].forEach((field) => {
    if (body[field] !== undefined) normalized[field] = asStringArray(body[field]);
  });

  if (body.price !== undefined) {
    const price = parsePrice(body.price);
    if (price === undefined) {
      errors.push("price must be a non-negative number.");
    } else {
      normalized.price = price;
    }
  }

  if (body.variants !== undefined) {
    const result = normalizeVariants(body.variants);
    errors.push(...result.errors);
    normalized.variants = result.variants;
    applyVariantDerivedFields(normalized);
  }

  if (body.gender !== undefined) {
    if (!GENDERS.includes(body.gender)) {
      errors.push(`gender must be one of: ${GENDERS.join(", ")}.`);
    } else {
      normalized.gender = body.gender;
    }
  }

  if (body.availability !== undefined) {
    if (!AVAILABILITIES.includes(body.availability)) {
      errors.push(`availability must be one of: ${AVAILABILITIES.join(", ")}.`);
    } else {
      normalized.availability = body.availability;
    }
  }

  if (body.status !== undefined) {
    if (!PRODUCT_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${PRODUCT_STATUSES.join(", ")}.`);
    } else {
      normalized.status = body.status;
    }
  } else if (!partial) {
    normalized.status = "draft";
  }

  if (body.imageUrl && !/^https?:\/\/\S+$/i.test(body.imageUrl)) {
    errors.push("imageUrl must be a valid http(s) URL.");
  }

  applyVariantDerivedFields(normalized);

  return { normalized, errors };
};

const ensureShopSkusUnique = async ({ db, shopId, productId, variants = [] }) => {
  const skus = variants.map((item) => item.sku).filter(Boolean);
  if (!skus.length) return;
  const existing = await db.collection("products").findOne({
    shopId,
    id: { $ne: productId },
    "variants.sku": { $in: skus },
  });
  if (existing) {
    const error = new Error("SKU must be unique within the shop.");
    error.statusCode = 409;
    throw error;
  }
};

export const listOwnerProducts = async ({ ownerId, query }) => {
  const db = await getMongoDb();
  const shop = await getSingleOwnerShop(ownerId);

  if (!shop) {
    return [];
  }

  const filter = { shopId: shop.id };

  if (query.shopId) {
    if (query.shopId !== shop.id) {
      return [];
    }
    filter.shopId = query.shopId;
  }
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const products = await db
    .collection("products")
    .find(filter)
    .sort({ updatedAt: -1 })
    .toArray();

  return products.map(toPublicProduct);
};

export const getOwnerProduct = async ({ ownerId, productId }) => {
  const db = await getMongoDb();
  const product = await db.collection("products").findOne({ id: productId });

  if (!product) {
    const error = new Error("Product was not found.");
    error.statusCode = 404;
    throw error;
  }

  await getOwnerShop({ ownerId, shopId: product.shopId });
  return product;
};

export const createProduct = async ({ ownerId, body }) => {
  let shopId = cleanString(body.shopId);

  if (!shopId) {
    const ownerShop = await getSingleOwnerShop(ownerId);

    if (!ownerShop) {
      const error = new Error("Create your shop before adding products.");
      error.statusCode = 400;
      throw error;
    }

    shopId = ownerShop.id;
  }

  const shop = await getOwnerShop({ ownerId, shopId });

  if (shop.status !== "active" && body.status === "published") {
    const error = new Error("Cannot publish a product for an inactive shop.");
    error.statusCode = 400;
    throw error;
  }

  const { normalized, errors } = normalizeProductPayload(body);

  if (errors.length) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const product = {
    id: cleanString(body.id) || crypto.randomUUID(),
    shopId,
    ...normalized,
    embeddingStale: true,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getMongoDb();
  await ensureShopSkusUnique({ db, shopId, productId: product.id, variants: product.variants });
  const existing = await db.collection("products").findOne({ id: product.id });

  if (existing) {
    const error = new Error("Product id is already used.");
    error.statusCode = 409;
    throw error;
  }

  await db.collection("products").insertOne(product);
  return toPublicProduct(product);
};

export const updateProduct = async ({ ownerId, productId, body }) => {
  const db = await getMongoDb();
  const product = await getOwnerProduct({ ownerId, productId });
  const nextShopId = product.shopId;
  const shop = await getOwnerShop({ ownerId, shopId: nextShopId });
  const { normalized, errors } = normalizeProductPayload(body, { partial: true });

  if (errors.length) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  if (normalized.variants) {
    await ensureShopSkusUnique({
      db,
      shopId: nextShopId,
      productId: product.id,
      variants: normalized.variants,
    });
  }

  if (shop.status !== "active" && normalized.status === "published") {
    const error = new Error("Cannot publish a product for an inactive shop.");
    error.statusCode = 400;
    throw error;
  }

  const patch = {
    ...normalized,
    shopId: nextShopId,
    updatedAt: new Date(),
  };

  if (productNeedsEmbeddingReset(body)) {
    patch.embeddingStale = true;
    patch.embeddingTextHash = null;
    patch.embeddingUpdatedAt = null;
  }

  await db.collection("products").updateOne({ id: product.id }, { $set: patch });
  return toPublicProduct({ ...product, ...patch });
};

export const archiveProduct = async ({ ownerId, productId }) => {
  const db = await getMongoDb();
  const product = await getOwnerProduct({ ownerId, productId });
  const patch = {
    status: "archived",
    updatedAt: new Date(),
  };

  await db.collection("products").updateOne({ id: product.id }, { $set: patch });
  return toPublicProduct({ ...product, ...patch });
};

export const trashProduct = async ({ ownerId, productId }) => {
  const db = await getMongoDb();
  const product = await getOwnerProduct({ ownerId, productId });
  const patch = {
    status: "trashed",
    updatedAt: new Date(),
  };

  await db.collection("products").updateOne({ id: product.id }, { $set: patch });

  return toPublicProduct({ ...product, ...patch });
};

export const restoreProduct = async ({ ownerId, productId }) => {
  const db = await getMongoDb();
  const product = await getOwnerProduct({ ownerId, productId });
  const patch = {
    status: "draft",
    updatedAt: new Date(),
  };

  await db.collection("products").updateOne({ id: product.id }, { $set: patch });

  return toPublicProduct({ ...product, ...patch });
};

export const hardDeleteProduct = async ({ ownerId, productId }) => {
  const db = await getMongoDb();
  const product = await getOwnerProduct({ ownerId, productId });

  await db.collection("products").deleteOne({ id: product.id });

  return toPublicProduct(product);
};

export const productEnums = {
  PRODUCT_STATUSES,
  AVAILABILITIES,
  GENDERS,
};
