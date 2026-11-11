import { createGenlookTask, getGenlookTaskStatus } from "./genlook.service.js";
import { createPiApiTask, getPiApiTaskStatus } from "./piapi.service.js";

const providerName = () => (process.env.TRYON_PROVIDER || "piapi").trim().toLowerCase();

const provider = () => {
  const name = providerName();
  if (name === "genlook") {
    return { name, create: createGenlookTask, getStatus: getGenlookTaskStatus };
  }
  if (name === "piapi") {
    return { name, create: createPiApiTask, getStatus: getPiApiTaskStatus };
  }
  const error = new Error(`Unsupported TRYON_PROVIDER: ${name}`);
  error.statusCode = 503;
  error.code = "TRYON_PROVIDER_UNSUPPORTED";
  throw error;
};

export const getTryOnProviderName = () => provider().name;
export const createTryOnProviderTask = (input) => provider().create(input);
export const getTryOnProviderTaskStatus = (taskId) => provider().getStatus(taskId);

