import { Genlook, GenlookError } from "@genlook/api";
import axios from "axios";

const getGenlookApiKey = () => {
  const apiKey = process.env.GENLOOK_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error("Missing GENLOOK_API_KEY in .env");
    error.statusCode = 503;
    error.code = "GENLOOK_NOT_CONFIGURED";
    throw error;
  }
  return apiKey;
};

let client;
const getClient = () => {
  if (!client) {
    client = new Genlook({
      apiKey: getGenlookApiKey(),
      timeoutMs: 60_000,
      maxRetries: 2,
      userAgent: "miroir-backend/1.0",
    });
  }
  return client;
};

export const prepareGenlookImageUrl = (url, kind = "product") => {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }
  if (url.includes("/image/upload/f_jpg,q_auto:good,c_pad,")) return url;
  const dimensions = kind === "person" ? "w_1200,h_1500" : "w_1200,h_1200";
  return url.replace(
    "/image/upload/",
    `/image/upload/f_jpg,q_auto:good,c_pad,${dimensions},b_white/`,
  );
};

const uploadPersonImage = async (imageUrl) => {
  const preparedUrl = prepareGenlookImageUrl(imageUrl, "person");
  const response = await axios.get(preparedUrl, {
    responseType: "arraybuffer",
    timeout: 45_000,
    headers: { "User-Agent": "MIROIR/1.0" },
  });
  const mimeType = String(response.headers?.["content-type"] || "image/jpeg").split(";")[0];
  const uploaded = await getClient().images.upload(Buffer.from(response.data), {
    mimeType,
    crop: false,
    keepForDays: 1,
  });
  return uploaded.imageId;
};

const productFromUrl = (url, title) =>
  url
    ? {
        title,
        images: [{ source: { url: prepareGenlookImageUrl(url, "product") } }],
      }
    : null;

export const normalizeGenlookStatus = (rawStatus) => {
  const status = String(rawStatus || "").toUpperCase();
  if (status === "COMPLETED") return "completed";
  if (status === "FAILED" || status === "CANCELLED") return "failed";
  return "pending";
};

const normalizeError = (error) => {
  if (!(error instanceof GenlookError)) return error;
  error.statusCode = error.status || error.statusCode || 502;
  error.provider = "genlook";
  return error;
};

export const createGenlookTask = async ({ tryOnType, imageUrls }) => {
  const products =
    tryOnType === "dress"
      ? [productFromUrl(imageUrls.dress_input, "Dress")]
      : [
          productFromUrl(imageUrls.upper_input, "Upper garment"),
          productFromUrl(imageUrls.lower_input, "Lower garment"),
        ];

  try {
    const personImageId = await uploadPersonImage(imageUrls.model_input);
    const response = await getClient().tryOn.create({
      person: { image: { source: { id: personImageId } } },
      products: products.filter(Boolean),
    });

    return {
      data: {
        task_id: response.generationId,
        status: normalizeGenlookStatus(response.status),
        provider: "genlook",
      },
    };
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getGenlookTaskStatus = async (taskId) => {
  try {
    const response = await getClient().generations.retrieve(taskId);
    const status = normalizeGenlookStatus(response.status);
    return {
      data: {
        task_id: response.generationId || taskId,
        status,
        provider: "genlook",
        output: response.resultImageUrl
          ? { images: [{ url: response.resultImageUrl }] }
          : null,
        error:
          status === "failed"
            ? {
                code: response.errorCode || "GENLOOK_GENERATION_FAILED",
                message: response.errorMessage || response.message || "Genlook generation failed.",
              }
            : null,
      },
    };
  } catch (error) {
    throw normalizeError(error);
  }
};

