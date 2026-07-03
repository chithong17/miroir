import crypto from "crypto";
import XLSX from "xlsx";
import { getMongoDb } from "./mongo.service.js";
import {
  normalizeProductPayload,
  productNeedsEmbeddingReset,
  toPublicProduct,
} from "./product.service.js";

const COLUMNS = [
  "id",
  "shopSlug",
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
];

const EXAMPLE_ROW = {
  shopSlug: "",
  name: "Linen Relaxed Shirt",
  category: "shirt",
  description: "Lightweight linen shirt with relaxed silhouette.",
  price: 590000,
  gender: "female",
  availability: "in_stock",
  status: "draft",
  colors: "white, beige",
  sizes: "S, M, L",
  styleTags: "minimalist, smart casual, summer",
  occasionTags: "date, office, casual",
  material: "linen",
  fitType: "relaxed",
  imageUrl: "https://example.com/product.jpg",
};

const cleanString = (value) => String(value || "").trim();

const persistJob = async ({ db, job }) => {
  const { _id, ...jobFields } = job;
  await db.collection("product_import_jobs").updateOne(
    { id: job.id },
    { $set: jobFields }
  );
};

const rowToPayload = (row) => {
  const payload = {};

  COLUMNS.forEach((column) => {
    if (row[column] !== undefined && row[column] !== null) {
      payload[column] = row[column];
    }
  });

  if (!cleanString(payload.status)) {
    payload.status = "draft";
  }

  return payload;
};

export const generateProductImportTemplate = () => {
  const workbook = XLSX.utils.book_new();
  const productsSheet = XLSX.utils.json_to_sheet([EXAMPLE_ROW], {
    header: COLUMNS,
  });
  const notes = [
    ["Column", "Notes"],
    ["shopSlug", "Optional. Your account can manage only one shop, so empty rows import into your shop."],
    ["gender", "Allowed values: female, male, unisex."],
    ["availability", "Allowed values: in_stock, out_of_stock."],
    ["status", "Allowed values: draft, published, archived. Empty defaults to draft."],
    ["colors/sizes/styleTags/occasionTags", "Use comma-separated values."],
    ["imageUrl", "Use a public http(s) URL. Embedded Excel images are not imported."],
  ];
  const notesSheet = XLSX.utils.aoa_to_sheet(notes);

  productsSheet["!cols"] = COLUMNS.map(() => ({ wch: 22 }));
  notesSheet["!cols"] = [{ wch: 28 }, { wch: 90 }];

  XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");
  XLSX.utils.book_append_sheet(workbook, notesSheet, "Notes");

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
};

const getOwnerShopsBySlug = async ({ db, ownerId }) => {
  const shops = await db.collection("shops").find({ ownerId }).toArray();
  return {
    shops,
    bySlug: new Map(shops.map((shop) => [shop.slug, shop])),
  };
};

const validateRows = async ({ db, ownerId, rows }) => {
  const { shops, bySlug } = await getOwnerShopsBySlug({ db, ownerId });
  const errors = [];
  const normalizedRows = [];
  const singleShop = shops.length === 1 ? shops[0] : null;

  if (shops.length > 1) {
    errors.push({
      row: 0,
      field: "shopSlug",
      message: "This account has multiple shops from older data. Keep one shop before importing.",
    });
  }

  if (!shops.length) {
    errors.push({
      row: 0,
      field: "shopSlug",
      message: "Create a shop before importing products.",
    });
  }

  for (const [index, rawRow] of rows.entries()) {
    const rowNumber = index + 2;
    const payload = rowToPayload(rawRow);
    const shopSlug = cleanString(payload.shopSlug);
    const shop = shopSlug ? bySlug.get(shopSlug) : singleShop;

    if (!shop) {
      errors.push({
        row: rowNumber,
        field: "shopSlug",
        message: singleShop
          ? "shopSlug must match one of your shops when provided."
          : "shopSlug is required and must match one of your shops.",
      });
      continue;
    }

    if (shop.status !== "active" && payload.status === "published") {
      errors.push({
        row: rowNumber,
        field: "status",
        message: "Cannot publish products for an inactive shop.",
      });
    }

    const { normalized, errors: productErrors } = normalizeProductPayload(
      payload,
      { partial: false }
    );

    productErrors.forEach((message) => {
      errors.push({
        row: rowNumber,
        field: "product",
        message,
      });
    });

    const productId = cleanString(payload.id);

    if (productId) {
      const existing = await db.collection("products").findOne({ id: productId });

      if (existing && !shops.some((candidate) => candidate.id === existing.shopId)) {
        errors.push({
          row: rowNumber,
          field: "id",
          message: "Existing product id belongs to another owner.",
        });
      }
    }

    normalizedRows.push({
      rowNumber,
      productId,
      shopId: shop.id,
      payload: normalized,
      originalPayload: payload,
    });
  }

  return { errors, normalizedRows };
};

export const importProductsFromWorkbook = async ({ ownerId, file }) => {
  const db = await getMongoDb();
  const now = new Date();
  const job = {
    id: crypto.randomUUID(),
    ownerId,
    shopId: null,
    fileName: file.originalname,
    status: "processing",
    totalRows: 0,
    successCount: 0,
    failedCount: 0,
    errors: [],
    createdAt: now,
    completedAt: null,
  };

  await db.collection("product_import_jobs").insertOne(job);

  try {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets.Products || workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    job.totalRows = rows.length;

    const { errors, normalizedRows } = await validateRows({
      db,
      ownerId,
      rows,
    });

    if (errors.length) {
      job.status = "failed";
      job.failedCount = rows.length;
      job.errors = errors;
      job.completedAt = new Date();
      await persistJob({ db, job });
      return job;
    }

    const importedProducts = [];

    for (const row of normalizedRows) {
      const productId = row.productId || crypto.randomUUID();
      const existing = await db.collection("products").findOne({ id: productId });
      const basePatch = {
        ...row.payload,
        shopId: row.shopId,
        embeddingStale: true,
        embeddingTextHash: null,
        updatedAt: new Date(),
      };

      if (existing) {
        if (productNeedsEmbeddingReset(row.originalPayload)) {
          basePatch.embeddingUpdatedAt = null;
        }

        await db
          .collection("products")
          .updateOne({ id: productId }, { $set: basePatch });
        importedProducts.push(toPublicProduct({ ...existing, ...basePatch }));
      } else {
        const product = {
          id: productId,
          ...basePatch,
          createdAt: new Date(),
        };
        await db.collection("products").insertOne(product);
        importedProducts.push(toPublicProduct(product));
      }
    }

    const uniqueShopIds = [...new Set(normalizedRows.map((row) => row.shopId))];
    job.shopId = uniqueShopIds.length === 1 ? uniqueShopIds[0] : null;
    job.status = "completed";
    job.successCount = importedProducts.length;
    job.failedCount = 0;
    job.errors = [];
    job.completedAt = new Date();
    job.products = importedProducts;

    await persistJob({
      db,
      job: {
        ...job,
        products: importedProducts.map((product) => product.id),
      },
    });

    return job;
  } catch (error) {
    job.status = "failed";
    job.failedCount = job.totalRows;
    job.errors = [
      {
        row: 0,
        field: "file",
        message: error.message || "Could not parse Excel file.",
      },
    ];
    job.completedAt = new Date();
    await persistJob({ db, job });
    return job;
  }
};

export const getImportJob = async ({ ownerId, jobId }) => {
  const db = await getMongoDb();
  const job = await db
    .collection("product_import_jobs")
    .findOne({ id: jobId, ownerId });

  if (!job) {
    const error = new Error("Import job was not found.");
    error.statusCode = 404;
    throw error;
  }

  return job;
};
