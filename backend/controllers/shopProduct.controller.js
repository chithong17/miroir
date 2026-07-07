import { uploadImageBuffer } from "../services/cloudinary.service.js";
import {
  archiveProduct,
  createProduct,
  getOwnerProduct,
  hardDeleteProduct,
  listOwnerProducts,
  restoreProduct,
  toPublicProduct,
  trashProduct,
  updateProduct,
} from "../services/product.service.js";
import {
  generateProductImportTemplate,
  getImportJob,
  importProductsFromWorkbook,
} from "../services/productImport.service.js";

export const listProducts = async (req, res, next) => {
  try {
    const products = await listOwnerProducts({
      ownerId: req.owner.id,
      query: req.query || {},
    });

    return res.json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await getOwnerProduct({
      ownerId: req.owner.id,
      productId: req.params.id,
    });

    return res.json({
      success: true,
      product: toPublicProduct(product),
    });
  } catch (error) {
    next(error);
  }
};

export const createShopProduct = async (req, res, next) => {
  try {
    const product = await createProduct({
      ownerId: req.owner.id,
      body: req.body || {},
    });

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateShopProduct = async (req, res, next) => {
  try {
    const product = await updateProduct({
      ownerId: req.owner.id,
      productId: req.params.id,
      body: req.body || {},
    });

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const archiveShopProduct = async (req, res, next) => {
  try {
    const product = await archiveProduct({
      ownerId: req.owner.id,
      productId: req.params.id,
    });

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShopProduct = async (req, res, next) => {
  try {
    const product = await trashProduct({
      ownerId: req.owner.id,
      productId: req.params.id,
    });

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const restoreShopProduct = async (req, res, next) => {
  try {
    const product = await restoreProduct({
      ownerId: req.owner.id,
      productId: req.params.id,
    });

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteShopProduct = async (req, res, next) => {
  try {
    const product = await hardDeleteProduct({
      ownerId: req.owner.id,
      productId: req.params.id,
    });

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "image file is required.",
      });
    }

    const result = await uploadImageBuffer(req.file.buffer, req.file.originalname);

    return res.status(201).json({
      success: true,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadImportTemplate = async (_req, res, next) => {
  try {
    const buffer = generateProductImportTemplate();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="miroir-product-import-template.xlsx"'
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

    const result = await importProductsFromWorkbook({
      ownerId: req.owner.id,
      file: req.file,
    });

    return res.status(result.status === "failed" ? 400 : 201).json({
      success: result.status !== "failed",
      importJob: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductImportJob = async (req, res, next) => {
  try {
    const importJob = await getImportJob({
      ownerId: req.owner.id,
      jobId: req.params.id,
    });

    return res.json({
      success: true,
      importJob,
    });
  } catch (error) {
    next(error);
  }
};
