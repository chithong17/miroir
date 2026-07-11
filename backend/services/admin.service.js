import crypto from "crypto";
import XLSX from "xlsx";
import { getMongoDb } from "./mongo.service.js";
import {
  productEnums,
  productNeedsEmbeddingReset,
  toPublicProduct,
} from "./product.service.js";
import {
  listPaymentPlans,
  updatePaymentPlan,
} from "./subscription.service.js";

const SHOP_STATUSES = ["active", "inactive"];
const EXCEL_COLUMNS = [
  "id",
  "name",
  "category",
  "description",
  "price",
  "gender",
  "availability",
  "status",
  "colors",
  "sizes",
  "styleTags",
  "occasionTags",
  "material",
  "fitType",
  "imageUrl",
  "imagePublicId",
];
const ARRAY_FIELDS = ["colors", "sizes", "styleTags", "occasionTags"];
const TEXT_FIELDS = [
  "name",
  "category",
  "description",
  "material",
  "fitType",
  "imageUrl",
  "imagePublicId",
];
const ENRICHMENT_FIELDS = [
  "category",
  "description",
  "gender",
  "colors",
  "styleTags",
  "occasionTags",
  "material",
  "fitType",
];

const cleanString = (value) => String(value || "").trim();

const slugify = (value) =>
  cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
  if (cleanString(value) === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const toPublicOwner = (owner) => ({
  id: owner.id,
  email: owner.email,
  name: owner.name,
  status: owner.status,
  createdAt: owner.createdAt,
  updatedAt: owner.updatedAt,
});

const toPublicShop = (shop, owner = null, productCount = 0) => ({
  id: shop.id,
  ownerId: shop.ownerId || "",
  owner: owner ? toPublicOwner(owner) : null,
  name: shop.name,
  slug: shop.slug,
  description: shop.description || "",
  logoUrl: shop.logoUrl || "",
  coverUrl: shop.coverUrl || "",
  contact: shop.contact || {},
  status: shop.status,
  productCount,
  createdAt: shop.createdAt,
  updatedAt: shop.updatedAt,
});

const assertUniqueSlug = async ({ db, slug, shopId }) => {
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

const getActiveOwner = async ({ db, ownerId }) => {
  if (!ownerId) return null;

  const owner = await db.collection("shop_owners").findOne({ id: ownerId });

  if (!owner) {
    const error = new Error("Shop owner was not found.");
    error.statusCode = 404;
    throw error;
  }

  if (owner.status !== "active") {
    const error = new Error("Shop owner must be active before assignment.");
    error.statusCode = 400;
    throw error;
  }

  return owner;
};

const assertOwnerAvailable = async ({ db, ownerId, shopId }) => {
  if (!ownerId) return;

  const existingShop = await db.collection("shops").findOne({
    ownerId,
    ...(shopId ? { id: { $ne: shopId } } : {}),
  });

  if (existingShop) {
    const error = new Error("This shop owner is already assigned to another shop.");
    error.statusCode = 409;
    throw error;
  }
};

const getShopById = async ({ db, shopId }) => {
  const shop = await db.collection("shops").findOne({ id: shopId });

  if (!shop) {
    const error = new Error("Shop was not found.");
    error.statusCode = 404;
    throw error;
  }

  return shop;
};

const productMissingEnrichment = (product) =>
  ENRICHMENT_FIELDS.some((field) => {
    const value = product[field];
    if (Array.isArray(value)) return value.length === 0;
    return cleanString(value) === "";
  });

const productRow = (product) => ({
  id: product.id,
  name: product.name || "",
  category: product.category || "",
  description: product.description || "",
  price: product.price ?? "",
  gender: product.gender || "unisex",
  availability: product.availability || "in_stock",
  status: product.status || "draft",
  colors: (product.colors || []).join(", "),
  sizes: (product.sizes || []).join(", "),
  styleTags: (product.styleTags || []).join(", "),
  occasionTags: (product.occasionTags || []).join(", "),
  material: product.material || "",
  fitType: product.fitType || "",
  imageUrl: product.imageUrl || "",
  imagePublicId: product.imagePublicId || "",
});

export const listAdminShopOwners = async ({ status = "pending" } = {}) => {
  const db = await getMongoDb();
  const filter = status && status !== "all" ? { status } : {};
  const owners = await db
    .collection("shop_owners")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return owners.map(toPublicOwner);
};

export const listAdminPaymentPlans = async () => listPaymentPlans();

export const updateAdminPaymentPlan = async ({ planCode, body }) =>
  updatePaymentPlan({ planCode, body });

export const setShopOwnerStatus = async ({ ownerId, status }) => {
  if (!["active", "pending", "rejected", "inactive"].includes(status)) {
    const error = new Error("Invalid shop owner status.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const owner = await db.collection("shop_owners").findOne({ id: ownerId });

  if (!owner) {
    const error = new Error("Shop owner was not found.");
    error.statusCode = 404;
    throw error;
  }

  const patch = { status, updatedAt: new Date() };
  await db.collection("shop_owners").updateOne({ id: ownerId }, { $set: patch });
  return toPublicOwner({ ...owner, ...patch });
};

export const listAdminShops = async ({ search = "", status = "all" } = {}) => {
  const db = await getMongoDb();
  const filter = {};
  const term = cleanString(search);

  if (status && status !== "all") {
    filter.status = status;
  }

  if (term) {
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { slug: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
    ];
  }

  const shops = await db.collection("shops").find(filter).sort({ updatedAt: -1 }).toArray();
  const ownerIds = [...new Set(shops.map((shop) => shop.ownerId).filter(Boolean))];
  const shopIds = shops.map((shop) => shop.id);
  const [owners, productCounts] = await Promise.all([
    ownerIds.length
      ? db.collection("shop_owners").find({ id: { $in: ownerIds } }).toArray()
      : [],
    shopIds.length
      ? db
          .collection("products")
          .aggregate([
            { $match: { shopId: { $in: shopIds } } },
            { $group: { _id: "$shopId", count: { $sum: 1 } } },
          ])
          .toArray()
      : [],
  ]);
  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
  const countByShopId = new Map(productCounts.map((item) => [item._id, item.count]));

  return shops.map((shop) =>
    toPublicShop(shop, ownerById.get(shop.ownerId), countByShopId.get(shop.id) || 0)
  );
};

export const createAdminShop = async ({ body }) => {
  const db = await getMongoDb();
  const name = cleanString(body.name);

  if (!name) {
    const error = new Error("Shop name is required.");
    error.statusCode = 400;
    throw error;
  }

  const slug = slugify(body.slug || name);
  if (!slug) {
    const error = new Error("Shop slug is required.");
    error.statusCode = 400;
    throw error;
  }

  const ownerId = cleanString(body.ownerId);
  const owner = await getActiveOwner({ db, ownerId });
  await assertOwnerAvailable({ db, ownerId });
  await assertUniqueSlug({ db, slug });

  const now = new Date();
  const shop = {
    id: crypto.randomUUID(),
    ownerId: ownerId || null,
    name,
    slug,
    description: cleanString(body.description),
    logoUrl: cleanString(body.logoUrl),
    coverUrl: cleanString(body.coverUrl),
    contact: body.contact && typeof body.contact === "object" ? body.contact : {},
    status: SHOP_STATUSES.includes(body.status) ? body.status : "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("shops").insertOne(shop);
  return toPublicShop(shop, owner, 0);
};

export const updateAdminShop = async ({ shopId, body }) => {
  const db = await getMongoDb();
  const shop = await getShopById({ db, shopId });
  const patch = { updatedAt: new Date() };
  let owner = null;

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
    await assertUniqueSlug({ db, slug, shopId });
    patch.slug = slug;
  }

  if (body.ownerId !== undefined) {
    const ownerId = cleanString(body.ownerId);
    owner = await getActiveOwner({ db, ownerId });
    await assertOwnerAvailable({ db, ownerId, shopId });
    patch.ownerId = ownerId || null;
  } else if (shop.ownerId) {
    owner = await db.collection("shop_owners").findOne({ id: shop.ownerId });
  }

  ["description", "logoUrl", "coverUrl"].forEach((field) => {
    if (body[field] !== undefined) patch[field] = cleanString(body[field]);
  });

  if (body.contact !== undefined) {
    patch.contact = body.contact && typeof body.contact === "object" ? body.contact : {};
  }

  if (body.status !== undefined) {
    if (!SHOP_STATUSES.includes(body.status)) {
      const error = new Error("Shop status must be active or inactive.");
      error.statusCode = 400;
      throw error;
    }
    patch.status = body.status;
  }

  await db.collection("shops").updateOne({ id: shopId }, { $set: patch });
  const productCount = await db.collection("products").countDocuments({ shopId });
  return toPublicShop({ ...shop, ...patch }, owner, productCount);
};

export const deactivateAdminShop = async ({ shopId }) => {
  return updateAdminShop({ shopId, body: { status: "inactive" } });
};

export const listAdminProducts = async ({ shopId, query = {} }) => {
  const db = await getMongoDb();
  await getShopById({ db, shopId });
  const filter = { shopId };
  const term = cleanString(query.search);

  if (query.status && query.status !== "all") filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (term) {
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { category: { $regex: term, $options: "i" } },
      { material: { $regex: term, $options: "i" } },
      { fitType: { $regex: term, $options: "i" } },
    ];
  }

  const products = await db.collection("products").find(filter).sort({ updatedAt: -1 }).toArray();
  const filtered = query.missingOnly === "true" ? products.filter(productMissingEnrichment) : products;
  return filtered.map(toPublicProduct);
};

const normalizeAdminProductPayload = (body, { partial = false } = {}) => {
  const normalized = {};
  const errors = [];

  if (!partial && !cleanString(body.name)) errors.push("name is required.");
  if (!partial && body.price === undefined) errors.push("price is required.");

  TEXT_FIELDS.forEach((field) => {
    if (body[field] !== undefined) normalized[field] = cleanString(body[field]);
  });

  ARRAY_FIELDS.forEach((field) => {
    if (body[field] !== undefined) normalized[field] = asStringArray(body[field]);
  });

  if (body.price !== undefined) {
    const price = parsePrice(body.price);
    if (price === undefined) errors.push("price must be a non-negative number.");
    else normalized.price = price;
  }

  if (body.gender !== undefined) {
    if (!productEnums.GENDERS.includes(body.gender)) {
      errors.push(`gender must be one of: ${productEnums.GENDERS.join(", ")}.`);
    } else {
      normalized.gender = body.gender;
    }
  }

  if (body.availability !== undefined) {
    if (!productEnums.AVAILABILITIES.includes(body.availability)) {
      errors.push(`availability must be one of: ${productEnums.AVAILABILITIES.join(", ")}.`);
    } else {
      normalized.availability = body.availability;
    }
  }

  if (body.status !== undefined) {
    if (!productEnums.PRODUCT_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${productEnums.PRODUCT_STATUSES.join(", ")}.`);
    } else {
      normalized.status = body.status;
    }
  }

  if (normalized.imageUrl && !/^https?:\/\/\S+$/i.test(normalized.imageUrl)) {
    errors.push("imageUrl must be a valid http(s) URL.");
  }

  return { normalized, errors };
};

export const createAdminProduct = async ({ shopId, body }) => {
  const db = await getMongoDb();
  await getShopById({ db, shopId });
  const { normalized, errors } = normalizeAdminProductPayload(body);

  if (errors.length) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  const id = cleanString(body.id) || crypto.randomUUID();
  const existing = await db.collection("products").findOne({ id });
  if (existing) {
    const error = new Error("Product id is already used.");
    error.statusCode = 409;
    throw error;
  }

  const now = new Date();
  const product = {
    id,
    shopId,
    name: normalized.name,
    price: normalized.price,
    category: normalized.category || "",
    description: normalized.description || "",
    gender: normalized.gender || "unisex",
    availability: normalized.availability || "in_stock",
    status: normalized.status || "draft",
    colors: normalized.colors || [],
    sizes: normalized.sizes || [],
    styleTags: normalized.styleTags || [],
    occasionTags: normalized.occasionTags || [],
    material: normalized.material || "",
    fitType: normalized.fitType || "",
    imageUrl: normalized.imageUrl || "",
    imagePublicId: normalized.imagePublicId || "",
    embeddingStale: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("products").insertOne(product);
  return toPublicProduct(product);
};

const getAdminProduct = async ({ db, productId }) => {
  const product = await db.collection("products").findOne({ id: productId });

  if (!product) {
    const error = new Error("Product was not found.");
    error.statusCode = 404;
    throw error;
  }

  return product;
};

export const updateAdminProduct = async ({ productId, body }) => {
  const db = await getMongoDb();
  const product = await getAdminProduct({ db, productId });
  const { normalized, errors } = normalizeAdminProductPayload(body, { partial: true });

  if (errors.length) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  const patch = {
    ...normalized,
    shopId: product.shopId,
    updatedAt: new Date(),
  };

  if (productNeedsEmbeddingReset(body)) {
    patch.embeddingStale = true;
    patch.embeddingTextHash = null;
    patch.embeddingUpdatedAt = null;
  }

  await db.collection("products").updateOne({ id: productId }, { $set: patch });
  return toPublicProduct({ ...product, ...patch });
};

export const setAdminProductStatus = async ({ productId, status }) => {
  return updateAdminProduct({ productId, body: { status } });
};

export const exportAdminProductsWorkbook = async ({ shopId, mode = "all" }) => {
  const products = await listAdminProducts({
    shopId,
    query: { missingOnly: mode === "missing" ? "true" : "false" },
  });
  const workbook = XLSX.utils.book_new();
  const rows = products.length ? products.map(productRow) : [Object.fromEntries(EXCEL_COLUMNS.map((key) => [key, ""]))];
  const sheet = XLSX.utils.json_to_sheet(rows, { header: EXCEL_COLUMNS });
  const notes = [
    ["Column", "Notes"],
    ["id", "Existing id updates product. Empty id creates a new product."],
    ["price", "Required for new rows. Use a non-negative number."],
    ["gender", `Allowed values: ${productEnums.GENDERS.join(", ")}.`],
    ["availability", `Allowed values: ${productEnums.AVAILABILITIES.join(", ")}.`],
    ["status", `Allowed values: ${productEnums.PRODUCT_STATUSES.join(", ")}.`],
    ["list fields", "Use comma-separated values for colors, sizes, styleTags, and occasionTags."],
  ];

  sheet["!cols"] = EXCEL_COLUMNS.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Products");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(notes), "Notes");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

const rowToPayload = (row) => {
  const payload = {};
  EXCEL_COLUMNS.forEach((column) => {
    if (row[column] !== undefined && row[column] !== null) payload[column] = row[column];
  });
  return payload;
};

export const importAdminProductsWorkbook = async ({ shopId, file }) => {
  const db = await getMongoDb();
  await getShopById({ db, shopId });
  const workbook = XLSX.read(file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets.Products || workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  const errors = [];
  const normalizedRows = [];
  const seenNewIds = new Set();

  for (const [index, rawRow] of rows.entries()) {
    const rowNumber = index + 2;
    const payload = rowToPayload(rawRow);
    const productId = cleanString(payload.id);
    const existing = productId ? await db.collection("products").findOne({ id: productId }) : null;

    if (existing && existing.shopId !== shopId) {
      errors.push({
        row: rowNumber,
        field: "id",
        message: "Existing product id belongs to another shop.",
      });
      continue;
    }

    const isCreate = !existing;
    if (isCreate && productId) {
      if (seenNewIds.has(productId)) {
        errors.push({
          row: rowNumber,
          field: "id",
          message: "Duplicate new product id in this file.",
        });
      }
      seenNewIds.add(productId);
    }

    const { normalized, errors: productErrors } = normalizeAdminProductPayload(payload, {
      partial: !isCreate,
    });

    productErrors.forEach((message) => {
      errors.push({ row: rowNumber, field: "product", message });
    });

    normalizedRows.push({ rowNumber, productId, existing, normalized, rawPayload: payload });
  }

  if (errors.length) {
    return {
      status: "failed",
      totalRows: rows.length,
      successCount: 0,
      failedCount: rows.length,
      errors,
    };
  }

  const products = [];

  for (const row of normalizedRows) {
    if (row.existing) {
      const patch = {
        ...row.normalized,
        shopId,
        updatedAt: new Date(),
      };

      if (productNeedsEmbeddingReset(row.rawPayload)) {
        patch.embeddingStale = true;
        patch.embeddingTextHash = null;
        patch.embeddingUpdatedAt = null;
      }

      await db.collection("products").updateOne({ id: row.existing.id }, { $set: patch });
      products.push(toPublicProduct({ ...row.existing, ...patch }));
      continue;
    }

    const product = await createAdminProduct({
      shopId,
      body: {
        ...row.rawPayload,
        id: row.productId || undefined,
      },
    });
    products.push(product);
  }

  return {
    status: "completed",
    totalRows: rows.length,
    successCount: products.length,
    failedCount: 0,
    errors: [],
    products,
  };
};
