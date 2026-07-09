import axios from "axios";
import https from "https";

const PIAPI_BASE_URL = "https://api.piapi.ai/api/v1";
const httpsAgent = new https.Agent({
  minVersion: "TLSv1.2",
});

const getPiApiKey = () => {
  const apiKey = process.env.PIAPI_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing PIAPI_KEY in .env");
  }

  return apiKey;
};

const describeApiKey = (apiKey) => {
  if (!apiKey) {
    return {
      present: false,
      prefix: "",
      suffix: "",
      length: 0,
      hasLeadingOrTrailingWhitespace: false,
    };
  }

  const normalizedKey = apiKey.trim();

  return {
    present: true,
    prefix: normalizedKey.slice(0, 4),
    suffix: normalizedKey.slice(-4),
    length: normalizedKey.length,
    hasLeadingOrTrailingWhitespace: normalizedKey !== apiKey,
  };
};

const piapiClient = axios.create({
  baseURL: PIAPI_BASE_URL,
  httpsAgent,
  timeout: 120000,
});

const isTimeoutError = (error) =>
  error?.code === "ECONNABORTED" ||
  error?.message?.toLowerCase().includes("timeout");

const compactObject = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, fieldValue]) =>
        fieldValue !== undefined && fieldValue !== null && fieldValue !== "",
    ),
  );

export const createPiApiTask = async ({ tryOnType, batchSize, imageUrls }) => {
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
  console.log("PiAPI key runtime info:", describeApiKey(process.env.PIAPI_KEY));

  try {
    const response = await piapiClient.post("/task", payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });

    console.log("PiAPI create task success:", {
      status: response.status,
      taskId: response.data?.data?.task_id,
      taskStatus: response.data?.data?.status,
    });

    return response.data;
  } catch (error) {
    console.error("PiAPI create task status:", error.response?.status);
    console.error(
      "PiAPI create task key info:",
      describeApiKey(process.env.PIAPI_KEY),
    );
    console.error(
      "PiAPI create task payload:",
      JSON.stringify(payload, null, 2),
    );
    console.error(
      "PiAPI create task error:",
      error.response?.data || error.message,
    );

    throw new Error(
      error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to create try-on task with PiAPI.",
    );
  }
};

export const getPiApiTaskStatus = async (taskId) => {
  const apiKey = getPiApiKey();

  try {
    const response = await piapiClient.get(`/task/${taskId}`, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      timeout: 120000,
    });

    return response.data;
  } catch (error) {
    console.error("PiAPI get task status code:", error.response?.status);
    console.error(
      "PiAPI get task error:",
      error.response?.data || error.message,
    );

    if (isTimeoutError(error)) {
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
        message: "PiAPI status request timeout. Continue polling.",
      };
    }

    throw new Error(
      error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to fetch try-on task status from PiAPI.",
    );
  }
};
