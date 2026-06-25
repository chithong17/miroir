import {
  createPiApiTask,
  getPiApiTaskStatus,
} from "../services/piapi.service.js";
import { uploadImageBuffer } from "../services/cloudinary.service.js";
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
