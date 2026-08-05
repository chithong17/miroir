import {
  createPiApiTask,
  getPiApiTaskStatus,
} from "../services/piapi.service.js";
import axios from "axios";
import https from "https";
import { uploadImageBuffer } from "../services/cloudinary.service.js";
import { getCatalogProduct } from "../services/catalog.service.js";
import { trackShopEvent } from "../services/shopAnalytics.service.js";
import { getRawUserById } from "../services/userAuth.service.js";
import { findResultUrl } from "../utils/findResultUrl.js";

const parseBatchSize = (rawValue) => {
  const parsed = Number.parseInt(rawValue ?? "1", 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

const validateTryOnInput = ({ tryOnType, files }) => {
  const hasModelImage = Boolean(files.modelImage?.[0]);
  const hasDressImage = Boolean(files.dressImage?.[0]);
  const hasUpperImage = Boolean(files.upperImage?.[0]);
  const hasLowerImage = Boolean(files.lowerImage?.[0]);

  if (!hasModelImage) {
    return "Model image is required.";
  }

  if (!["dress", "upper_lower"].includes(tryOnType)) {
    return "tryOnType must be either 'dress' or 'upper_lower'.";
  }

  if (tryOnType === "dress" && !hasDressImage) {
    return "dressImage is required when tryOnType is 'dress'.";
  }

  if (tryOnType === "upper_lower" && !hasUpperImage && !hasLowerImage) {
    return "At least one of upperImage or lowerImage is required for upper_lower try-on.";
  }

  if (hasDressImage && (hasUpperImage || hasLowerImage)) {
    return "dressImage cannot be sent together with upperImage or lowerImage.";
  }

  return null;
};

const uploadRequiredImages = async (files) => {
  const uploadEntries = [
    ["model_input", files.modelImage?.[0]],
    ["dress_input", files.dressImage?.[0]],
    ["upper_input", files.upperImage?.[0]],
    ["lower_input", files.lowerImage?.[0]],
  ];

  const uploaded = await Promise.all(
    uploadEntries.map(async ([key, file]) => {
      if (!file) {
        return [key, undefined];
      }

      const result = await uploadImageBuffer(file.buffer, file.originalname);
      return [key, result.secure_url];
    })
  );

  return Object.fromEntries(uploaded);
};

export const createTryOnTask = async (req, res, next) => {
  try {
    const { tryOnType } = req.body;
    const batchSize = parseBatchSize(req.body.batchSize);
    const validationError = validateTryOnInput({
      tryOnType,
      files: req.files || {},
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const imageUrls = await uploadRequiredImages(req.files || {});

    const taskResponse = await createPiApiTask({
      tryOnType,
      batchSize,
      imageUrls,
    });

    const taskId =
      taskResponse?.data?.task_id ||
      taskResponse?.task_id ||
      taskResponse?.data?.id ||
      taskResponse?.id;

    if (!taskId) {
      console.error("Unexpected PiAPI task creation response:", taskResponse);
      return res.status(502).json({
        success: false,
        message: "PiAPI did not return a task id.",
      });
    }

    console.log(`PiAPI task created successfully: ${taskId}`);

    return res.status(201).json({
      success: true,
      taskId,
      message: "Try-on task created successfully",
    });
  } catch (error) {
    next(error);
  }
};

const httpsAgent = new https.Agent({
  minVersion: "TLSv1.2",
});

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isLowerCategory = (value = "") => {
  const normalized = normalizeText(value);
  return [
    "bottom",
    "pants",
    "trousers",
    "jeans",
    "skirt",
    "shorts",
    "chan vay",
    "quan",
  ].some((keyword) => normalized.includes(keyword));
};

const isDressCategory = (value = "") => {
  const normalized = normalizeText(value);
  return ["dress", "dam", "vay lien", "one-piece", "one piece", "jumpsuit"].some(
    (keyword) => normalized.includes(keyword)
  );
};

const extractTaskId = (taskResponse) =>
  taskResponse?.data?.task_id ||
  taskResponse?.task_id ||
  taskResponse?.data?.id ||
  taskResponse?.id;

const uploadRemoteImageUrl = async (imageUrl, fallbackName = "catalog-garment") => {
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    httpsAgent,
    timeout: 30000,
    headers: {
      "User-Agent": "MIROIR/1.0",
    },
  });

  const contentType = response.headers?.["content-type"] || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("Selected product image URL did not return an image.");
  }

  const uploaded = await uploadImageBuffer(
    Buffer.from(response.data),
    `${fallbackName}.jpg`
  );

  return uploaded.secure_url;
};

export const createCatalogTryOnTask = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required." });
    }

    const user = await getRawUserById(req.user.id);
    const { product } = await getCatalogProduct(productId);
    let modelInput = user?.profile?.modelImageUrl || "";

    if (req.file) {
      const uploaded = await uploadImageBuffer(req.file.buffer, req.file.originalname);
      modelInput = uploaded.secure_url;
    }

    if (!modelInput) {
      return res.status(400).json({
        success: false,
        message: "Upload a model image or save one in your profile before trying on.",
      });
    }

    if (!product.imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Selected product does not have an imageUrl.",
      });
    }

    const garmentInput = await uploadRemoteImageUrl(product.imageUrl, product.id);
    const categoryText = `${product.category || ""} ${product.name || ""}`;
    const isLower = isLowerCategory(categoryText);
    const isDress = !isLower && isDressCategory(categoryText);
    const tryOnType = isDress ? "dress" : "upper_lower";
    const imageUrls = {
      model_input: modelInput,
      dress_input: isDress ? garmentInput : undefined,
      upper_input: !isDress && !isLower ? garmentInput : undefined,
      lower_input: isLower ? garmentInput : undefined,
    };

    const taskResponse = await createPiApiTask({
      tryOnType,
      batchSize: parseBatchSize(req.body.batchSize),
      imageUrls,
    });
    const taskId = extractTaskId(taskResponse);

    if (!taskId) {
      return res.status(502).json({
        success: false,
        message: "PiAPI did not return a task id.",
      });
    }

    await trackShopEvent({
      eventType: "tryon_started",
      shopId: product.shopId,
      productId: product.id,
      userId: req.user.id,
      metadata: {
        taskId,
        tryOnType,
        source: "catalog_tryon",
        profile: {
          gender: user?.profile?.gender || "",
          bodyShape: user?.profile?.bodyShape || "",
          skinTone: user?.profile?.skinTone || "",
          stylePreferences: user?.profile?.stylePreferences || [],
        },
        productStyleTags: product.styleTags || [],
        productColors: product.colors || [],
      },
    });

    return res.status(201).json({
      success: true,
      taskId,
      productId: product.id,
      tryOnType,
      message: "Catalog try-on task created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomTryOnTask = async (req, res, next) => {
  try {
    const { tryOnType } = req.body;
    const files = req.files || {};
    const hasDressImage = Boolean(files.dressImage?.[0]);
    const hasUpperImage = Boolean(files.upperImage?.[0]);
    const hasLowerImage = Boolean(files.lowerImage?.[0]);

    if (!["dress", "upper_lower"].includes(tryOnType)) {
      return res.status(400).json({
        success: false,
        message: "tryOnType must be either 'dress' or 'upper_lower'.",
      });
    }

    if (tryOnType === "dress" && !hasDressImage) {
      return res.status(400).json({
        success: false,
        message: "dressImage is required when tryOnType is 'dress'.",
      });
    }

    if (tryOnType === "upper_lower" && !hasUpperImage && !hasLowerImage) {
      return res.status(400).json({
        success: false,
        message: "At least one of upperImage or lowerImage is required for upper_lower try-on.",
      });
    }

    const user = await getRawUserById(req.user.id);
    const imageUrls = await uploadRequiredImages(files);

    if (!imageUrls.model_input) {
      imageUrls.model_input = user?.profile?.modelImageUrl || "";
    }

    if (!imageUrls.model_input) {
      return res.status(400).json({
        success: false,
        message: "Upload a model image or save one in your profile before trying on.",
      });
    }

    const taskResponse = await createPiApiTask({
      tryOnType,
      batchSize: parseBatchSize(req.body.batchSize),
      imageUrls,
    });
    const taskId = extractTaskId(taskResponse);

    if (!taskId) {
      return res.status(502).json({
        success: false,
        message: "PiAPI did not return a task id.",
      });
    }

    return res.status(201).json({
      success: true,
      taskId,
      tryOnType,
      message: "Custom try-on task created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTryOnTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const taskResponse = await getPiApiTaskStatus(taskId);
    const rawTaskData = taskResponse?.data || taskResponse;
    const status = rawTaskData?.status || "pending";
    const output = rawTaskData?.output;
    const errorMessage =
      rawTaskData?.error?.message ||
      rawTaskData?.message ||
      rawTaskData?.error_message ||
      "Task failed to complete.";

    if (status === "failed") {
      return res.status(200).json({
        success: false,
        status: "failed",
        errorMessage,
        raw: rawTaskData,
      });
    }

    const resultUrl = status === "completed" ? findResultUrl(output) : null;

    return res.status(200).json({
      success: true,
      status,
      resultUrl,
      raw: rawTaskData,
    });
  } catch (error) {
    next(error);
  }
};
