import axios from "axios";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 90000);

const envNumber = (name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let embeddingRequestChain = Promise.resolve();
let lastEmbeddingRequestAt = 0;

const scheduleEmbeddingRequest = (request) => {
  const run = async () => {
    const minimumInterval = envNumber("GEMINI_EMBEDDING_MIN_INTERVAL_MS", 750, {
      min: 0,
      max: 10000,
    });
    const remaining = minimumInterval - (Date.now() - lastEmbeddingRequestAt);
    if (remaining > 0) await wait(remaining);
    lastEmbeddingRequestAt = Date.now();
    return request();
  };
  const scheduled = embeddingRequestChain.then(run, run);
  embeddingRequestChain = scheduled.catch(() => undefined);
  return scheduled;
};

const parseRetryDuration = (value) => {
  const raw = String(value || "").trim();
  const seconds = raw.match(/^(\d+(?:\.\d+)?)s$/i);
  if (seconds) return Math.ceil(Number(seconds[1]) * 1000);
  return null;
};

const getServerRetryDelayMs = (error) => {
  const retryAfter = error?.response?.headers?.["retry-after"];
  if (retryAfter !== undefined) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
    const date = Date.parse(String(retryAfter));
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }

  const details = error?.response?.data?.error?.details;
  const retryInfo = Array.isArray(details)
    ? details.find((item) => String(item?.["@type"] || "").endsWith("google.rpc.RetryInfo"))
    : null;
  return parseRetryDuration(retryInfo?.retryDelay);
};

export const isTransientGeminiError = (error) => {
  if (!axios.isAxiosError(error)) return Boolean(error?.retryable);
  const status = error.response?.status;
  return !status || [408, 429, 500, 502, 503, 504].includes(status);
};

export const getGeminiRetryDelayMs = (
  error,
  attempt,
  {
    baseDelayMs = envNumber("GEMINI_RETRY_BASE_DELAY_MS", 1000, { min: 100, max: 60000 }),
    maxDelayMs = envNumber("GEMINI_RETRY_MAX_DELAY_MS", 30000, { min: 1000, max: 120000 }),
    random = Math.random,
  } = {}
) => {
  const exponential = baseDelayMs * (2 ** Math.max(0, attempt));
  const jitter = Math.floor(exponential * 0.25 * random());
  const serverDelay = getServerRetryDelayMs(error) || 0;
  return Math.min(maxDelayMs, Math.max(serverDelay, exponential + jitter));
};

const toGeminiServiceError = (error, action, model) => {
  const wrapped = new Error(getGeminiErrorMessage(error, action, model), { cause: error });
  const status = Number(error?.response?.status || error?.statusCode);
  wrapped.statusCode = status === 429 ? 503 : status || 502;
  wrapped.code = status === 429 ? "GEMINI_RATE_LIMITED" : "GEMINI_REQUEST_FAILED";
  wrapped.retryable = isTransientGeminiError(error);
  wrapped.retryAfterMs = getServerRetryDelayMs(error) || undefined;
  return wrapped;
};

const requestWithRetry = async ({ action, model, retryCount, request }) => {
  let lastError;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (!isTransientGeminiError(error) || attempt >= retryCount) break;
      await wait(getGeminiRetryDelayMs(error, attempt));
    }
  }
  throw toGeminiServiceError(lastError, action, model);
};

const getGeminiErrorMessage = (error, action, model) => {
  if (!axios.isAxiosError(error)) {
    return error.message;
  }

  const status = error.response?.status;
  const apiMessage =
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message;

  return `Gemini ${action} failed for model "${model}"${
    status ? ` with status ${status}` : ""
  }: ${apiMessage}`;
};

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error("Gemini is not configured. Set GEMINI_API_KEY.");
    error.statusCode = 503;
    throw error;
  }

  return apiKey;
};

const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const error = new Error("Groq is not configured. Set GROQ_API_KEY.");
    error.statusCode = 503;
    throw error;
  }

  return apiKey;
};

export const generateEmbedding = async (text) => {
  const apiKey = getApiKey();
  const model = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
  const url = `${GEMINI_BASE_URL}/models/${model}:embedContent?key=${apiKey}`;

  const response = await requestWithRetry({
    action: "embedding",
    model,
    retryCount: envNumber("GEMINI_EMBEDDING_RETRY_COUNT", 4, { min: 0, max: 8 }),
    request: () => scheduleEmbeddingRequest(() => axios.post(
      url,
      {
        model: `models/${model}`,
        content: {
          parts: [{ text }],
        },
      },
      {
        timeout: envNumber("GEMINI_EMBEDDING_TIMEOUT_MS", 30000, {
          min: 1000,
          max: 120000,
        }),
      }
    )),
  });

  const values = response.data?.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini embedding response did not include values.");
  }

  return values;
};

const parseGeminiJson = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const unfenced = fenced ? fenced[1].trim() : trimmed;
  const jsonMatch = unfenced.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : unfenced;
  return JSON.parse(jsonText);
};

const shouldOmitSamplingConfig = (model) => /^gemini-3/i.test(model);

const STYLIST_ITEM_SCHEMA = {
  type: "OBJECT",
  properties: {
    productId: { type: "STRING" },
    reason: { type: "STRING" },
  },
  required: ["productId", "reason"],
};

const STYLIST_OUTFIT_SCHEMA = {
  type: "OBJECT",
  properties: {
    id: { type: "STRING" },
    title: { type: "STRING" },
    score: { type: "NUMBER" },
    items: { type: "ARRAY", items: STYLIST_ITEM_SCHEMA },
    whyItMatches: { type: "STRING" },
    fitWarnings: { type: "ARRAY", items: { type: "STRING" } },
    fashionTips: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "id",
    "title",
    "score",
    "items",
    "whyItMatches",
    "fitWarnings",
    "fashionTips",
  ],
};

const STYLIST_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    analysis: {
      type: "OBJECT",
      properties: {
        bodyShape: { type: "STRING" },
        skinTone: { type: "STRING" },
        styleMatch: { type: "STRING" },
      },
      required: ["bodyShape", "skinTone", "styleMatch"],
    },
    outfits: { type: "ARRAY", items: STYLIST_OUTFIT_SCHEMA },
    recommended_outfit: {
      type: "OBJECT",
      properties: {
        score: { type: "NUMBER" },
        items: { type: "ARRAY", items: STYLIST_ITEM_SCHEMA },
        whyItMatches: { type: "STRING" },
      },
      required: ["score", "items", "whyItMatches"],
    },
    alternatives: { type: "ARRAY", items: STYLIST_ITEM_SCHEMA },
    fitWarnings: { type: "ARRAY", items: { type: "STRING" } },
    fashionTips: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "analysis",
    "outfits",
    "recommended_outfit",
    "alternatives",
    "fitWarnings",
    "fashionTips",
  ],
};

const buildGenerationConfig = (model) => ({
  responseMimeType: "application/json",
  responseSchema: STYLIST_RESPONSE_SCHEMA,
  ...(!shouldOmitSamplingConfig(model) ? { temperature: 0.35 } : {}),
});

const postGeminiGeneration = async ({ url, systemPrompt, payload, model }) =>
  axios.post(
    url,
    {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: buildGenerationConfig(model),
      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify(payload),
            },
          ],
        },
      ],
    },
    {
      timeout: envNumber("GEMINI_TIMEOUT_MS", 90000, {
        min: 1000,
        max: 180000,
      }),
    }
  );

const getGroqErrorMessage = (error, model) => {
  if (!axios.isAxiosError(error)) return error.message;

  const status = error.response?.status;
  const apiMessage =
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message;

  return `Groq generation failed for model "${model}"${
    status ? ` with status ${status}` : ""
  }: ${apiMessage}`;
};

const postGroqGeneration = async ({ apiKey, systemPrompt, payload, model }) =>
  axios.post(
    GROQ_CHAT_COMPLETIONS_URL,
    {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(payload) },
      ],
      temperature: 0.35,
      response_format: { type: "json_object" },
    },
    {
      timeout: GROQ_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

const requestGroqWithRetry = async ({ model, request }) => {
  const retryCount = envNumber("GROQ_RETRY_COUNT", 1, { min: 0, max: 5 });
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (!isTransientGeminiError(error) || attempt >= retryCount) break;
      await wait(getGeminiRetryDelayMs(error, attempt));
    }
  }

  throw new Error(getGroqErrorMessage(lastError, model));
};

export const generateStylistRecommendation = async (payload) => {
  const systemPrompt = `You are MIROIR AI Stylist.
You are a professional fashion consultant.
You MUST ONLY recommend products that appear in the provided retrievedProducts context.
Never invent products.
Never recommend products outside the retrieved context.
Use fashion rules only as guidance.
Create every recommendation from retrievedProducts. Do not copy a saved outfit's ID, title, or exact product combination.
When multiple suitable products exist, rotate tops, bottoms, dresses, and outerwear across recommendations for meaningful variety.
Do not repeat an identical product combination. Reuse an item only when the retrieved catalog has no suitable alternative.
Use the user's prompt as the primary styling brief.
Use body measurements, body shape, skin tone, style preferences, budget, occasion, customer feedback, user memory, and fit review summaries only when they are provided.
Return up to desiredOutfitCount distinct complete outfits. Prefer variety across silhouettes, colors, and categories while staying faithful to the prompt.
Every outfit must be structurally wearable: use either one dress/one-piece, or one top plus one bottom. An outerwear item, shoes, or accessories may be added, but outerwear alone is not a complete outfit.
Do not put two tops or two bottoms in the same outfit. Do not repeat an identical product combination across outfits. If the catalog cannot support desiredOutfitCount complete distinct outfits, return fewer outfits instead of duplicates or incomplete combinations.
Return JSON only using this schema:
{
  "analysis": {
    "bodyShape": "",
    "skinTone": "",
    "styleMatch": ""
  },
  "outfits": [
    {
      "id": "",
      "title": "",
      "score": 0,
      "items": [
        {
          "productId": "",
          "reason": ""
        }
      ],
      "whyItMatches": "",
      "fitWarnings": [],
      "fashionTips": []
    }
  ],
  "recommended_outfit": {
    "score": 0,
    "items": [
      {
        "productId": "",
        "reason": ""
      }
    ],
    "whyItMatches": ""
  },
  "alternatives": [],
  "fitWarnings": [],
  "fashionTips": []
}
Set recommended_outfit to the first item in outfits for backward compatibility.`;

  // GROQ_API_KEY automatically enables Groq, while existing environments remain
  // on Gemini until that key is configured. Set STYLIST_GENERATION_PROVIDER
  // explicitly to "groq" or "gemini" when a fixed provider is preferred.
  const provider = (
    process.env.STYLIST_GENERATION_PROVIDER ||
    (process.env.GROQ_API_KEY ? "groq" : "gemini")
  ).toLowerCase();

  if (provider === "groq") {
    const apiKey = getGroqApiKey();
    const model = process.env.GROQ_GENERATION_MODEL || "openai/gpt-oss-20b";
    const response = await requestGroqWithRetry({
      model,
      request: () => postGroqGeneration({ apiKey, systemPrompt, payload, model }),
    });

    try {
      const text = response.data?.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Groq generation response was empty.");
      return parseGeminiJson(text);
    } catch (error) {
      throw new Error(
        `Groq generation returned invalid JSON for model "${model}": ${error.message}`
      );
    }
  }

  if (provider !== "gemini") {
    throw new Error(
      `Unsupported STYLIST_GENERATION_PROVIDER "${provider}". Use "groq" or "gemini".`
    );
  }

  const apiKey = getApiKey();
  const model = process.env.GEMINI_GENERATION_MODEL || "gemini-3.5-flash";
  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

  const response = await requestWithRetry({
    action: "generation",
    model,
    retryCount: envNumber("GEMINI_RETRY_COUNT", 1, { min: 0, max: 5 }),
    request: () => postGeminiGeneration({
      url,
      systemPrompt,
      payload,
      model,
      }),
  });

  try {
    const text =
      response.data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") || "";

    if (!text) {
      throw new Error("Gemini generation response was empty.");
    }

    return parseGeminiJson(text);
  } catch (error) {
    throw new Error(
      `Gemini generation returned invalid JSON for model "${model}": ${error.message}`
    );
  }
};
