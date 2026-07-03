import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";
import { getOwnerShop, getSingleOwnerShop } from "./shop.service.js";

const PRODUCT_STATUSES = ["draft", "published", "archived"];
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

  return { normalized, errors };
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

export const productEnums = {
  PRODUCT_STATUSES,
  AVAILABILITIES,
  GENDERS,
};
