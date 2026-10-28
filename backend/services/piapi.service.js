import axios from "axios";
import https from "https";
import { normalizePiApiError } from "../utils/piapiErrors.js";

const PIAPI_BASE_URL = "https://api.piapi.ai/api/v1";
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 10000,
  timeout: 30000,
});

const getPiApiKey = () => {
  const apiKey = process.env.PIAPI_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing PIAPI_KEY in .env");
  }

  return apiKey;
};

const piapiClient = axios.create({
  baseURL: PIAPI_BASE_URL,
  httpsAgent,
  timeout: 60000,
});

const isTimeoutError = (error) =>
  error?.code === "ECONNABORTED" ||
  error?.message?.toLowerCase().includes("timeout");

const isTransientNetworkError = (error) => {
  if (isTimeoutError(error)) return true;
  const msg = error?.message?.toLowerCase() || "";
  const code = error?.code;
  return (
    code === "ECONNRESET" ||
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    code === "EAI_AGAIN" ||
    code === "ENOTFOUND" ||
    msg.includes("socket disconnected") ||
    msg.includes("socket hang up") ||
    msg.includes("tls connection") ||
    msg.includes("network socket") ||
    msg.includes("network error")
  );
};

const compactObject = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, fieldValue]) =>
        fieldValue !== undefined && fieldValue !== null && fieldValue !== "",
    ),
  );

export const createPiApiTask = async ({ tryOnType, batchSize, imageUrls }, maxRetries = 1) => {
  const apiKey = getPiApiKey();

  const input =
    tryOnType === "dress"
      ? compactObject({
          model_input: imageUrls.model_input,
          dress_input: imageUrls.dress_input,
          batch_size: Number(batchSize) || 1,
        })
      : compactObject({
          model_input: imageUrls.model_input,
          upper_input: imageUrls.upper_input,
          lower_input: imageUrls.lower_input,
          batch_size: Number(batchSize) || 1,
        });

  const payload = {
    model: "kling",
    task_type: "ai_try_on",
    input,
    config: {
      service_mode: "public",
    },
  };

  console.log("Creating PiAPI task with input keys:", Object.keys(input));

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await piapiClient.post("/task", payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        timeout: 60000,
      });

      console.log("PiAPI create task success:", {
        status: response.status,
        taskId: response.data?.data?.task_id,
        taskStatus: response.data?.data?.status,
      });

      return response.data;
    } catch (error) {
      if (isTransientNetworkError(error) && attempt < maxRetries) {
        console.warn(`PiAPI create task transient network error (attempt ${attempt + 1}), retrying...`, error.message);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      console.error("PiAPI create task error:", {
        status: error.response?.status,
        message: normalizePiApiError(error).message,
        inputKeys: Object.keys(input),
      });

      throw normalizePiApiError(error);
    }
  }
};

export const getPiApiTaskStatus = async (taskId, maxRetries = 2) => {
  const apiKey = getPiApiKey();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await piapiClient.get(`/task/${taskId}`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        timeout: 30000,
      });

      if (response.data?.data?.status === "failed") {
        console.warn("PiAPI generation failed:", {
          taskId,
          code: response.data.data.error?.code,
          message: response.data.data.error?.message,
        });
      }
      return response.data;
    } catch (error) {
      const isTransient = isTransientNetworkError(error);

      if (isTransient && attempt < maxRetries) {
        console.warn(
          `PiAPI get task transient network error (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`,
          error.message,
        );
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      console.warn("PiAPI get task error:", {
        taskId,
        status: error.response?.status,
        message: normalizePiApiError(error).message,
      });

      if (isTransient) {
        return {
          code: 200,
          data: {
            task_id: taskId,
            status: "pending",
            output: {
              works: null,
            },
            error: {
              code: 0,
              message: "",
            },
          },
          message: "PiAPI status check temporarily interrupted. Polling will continue.",
        };
      }

      throw normalizePiApiError(error);
    }
  }
};

