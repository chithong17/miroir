import crypto from "crypto";
import XLSX from "xlsx";
import { getMongoDb } from "./mongo.service.js";
import { toPublicProduct } from "./product.service.js";
import { uploadImageBuffer } from "./cloudinary.service.js";
import { extractImagesByRowFromWorkbook } from "./xlsxImage.service.js";

const COLUMNS = [
  "id",
  "name",
  "description",
  "price",
  "availability",
  "colors",
  "sizes",
  "imageUrl",
];

const EXAMPLE_ROW = {
  id: "",
  name: "Linen Shirt",
  description: "Breathable everyday linen shirt.",
  price: 590000,
  availability: "in_stock",
  colors: "white, beige",
  sizes: "S, M, L",
  imageUrl: "https://example.com/product.jpg",
};

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

const normalizeShopImportPayload = (payload) => {
  const normalized = {};
  const errors = [];

  if (!cleanString(payload.name)) {
    errors.push("name is required.");
  } else {
    normalized.name = cleanString(payload.name);
  }

  const price = parsePrice(payload.price);
  if (price === undefined) {
    errors.push("price must be a non-negative number.");
  } else {
    normalized.price = price;
  }

  if (!["in_stock", "out_of_stock"].includes(payload.availability)) {
    errors.push("availability must be one of: in_stock, out_of_stock.");
  } else {
    normalized.availability = payload.availability;
  }

  if (payload.sizes !== undefined) {
    normalized.sizes = asStringArray(payload.sizes);
  }

  if (payload.colors !== undefined) {
    normalized.colors = asStringArray(payload.colors);
  }

  if (payload.description !== undefined) {
    normalized.description = cleanString(payload.description);
  }

  const imageUrl = cleanString(payload.imageUrl);
  if (imageUrl) {
    normalized.imageUrl = imageUrl;
  }

  if (imageUrl && !/^https?:\/\/\S+$/i.test(imageUrl)) {
    errors.push("imageUrl must be a valid http(s) URL.");
  }

  return { normalized, errors };
};

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
    ["availability", "Allowed values: in_stock, out_of_stock."],
    ["description", "Optional product description (including fabric material, length, width, waist, etc.) shown to customers and used by AI Stylist."],
    ["colors", "Use comma-separated values, for example: white, beige."],
    ["sizes", "Use comma-separated values, for example: S, M, L."],
    ["imageUrl", "Use a public http(s) URL, or place an image in this row and it will be uploaded."],
    ["manager fields", "Category, gender, status, style tags, occasion tags, and fit type are managed by the system team."],
  ];
  const notesSheet = XLSX.utils.aoa_to_sheet(notes);

  productsSheet["!cols"] = COLUMNS.map((column) => ({
    wch: column === "description" ? 48 : column === "imageUrl" ? 42 : 22,
  }));
  notesSheet["!cols"] = [{ wch: 28 }, { wch: 90 }];

  XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");
  XLSX.utils.book_append_sheet(workbook, notesSheet, "Notes");

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
};

const getOwnerShops = async ({ db, ownerId }) => {
  const shops = await db.collection("shops").find({ ownerId }).toArray();
  return shops;
};

const validateRows = async ({ db, ownerId, rows }) => {
  const shops = await getOwnerShops({ db, ownerId });
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
    const shop = singleShop;

    if (!shop) {
      errors.push({
        row: rowNumber,
        field: "shop",
        message: "Create one shop before importing products.",
      });
      continue;
    }

    const { normalized, errors: productErrors } = normalizeShopImportPayload(payload);

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
    });
  }

  return { errors, normalizedRows };
};

const uploadEmbeddedImages = async ({ file, normalizedRows }) => {
  const imagesByRow = extractImagesByRowFromWorkbook(file.buffer, "Products");

  await Promise.all(
    normalizedRows.map(async (row) => {
      const embeddedImage = imagesByRow.get(row.rowNumber);
      if (!embeddedImage) return;

      const result = await uploadImageBuffer(
        embeddedImage.buffer,
        embeddedImage.fileName || `${row.productId || row.rowNumber}.png`
      );

      row.payload.imageUrl = result.secure_url;
      row.payload.imagePublicId = result.public_id;
    })
  );
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

    await uploadEmbeddedImages({ file, normalizedRows });

    const importedProducts = [];

    for (const row of normalizedRows) {
      const productId = row.productId || crypto.randomUUID();
      const existing = await db.collection("products").findOne({ id: productId });
      const basePatch = {
        ...row.payload,
        shopId: row.shopId,
        updatedAt: new Date(),
      };

      if (existing) {
        await db
          .collection("products")
          .updateOne({ id: productId }, { $set: basePatch });
        importedProducts.push(toPublicProduct({ ...existing, ...basePatch }));
      } else {
        const product = {
          id: productId,
          status: "draft",
          category: "",
          description: "",
          gender: "unisex",
          colors: [],
          styleTags: [],
          occasionTags: [],
          fitType: "",
          embeddingStale: true,
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
