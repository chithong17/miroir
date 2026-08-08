import axios from "axios";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 90000);
const GEMINI_RETRY_COUNT = Number(process.env.GEMINI_RETRY_COUNT || 1);

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

export const generateEmbedding = async (text) => {
  const apiKey = getApiKey();
  const model = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
  const url = `${GEMINI_BASE_URL}/models/${model}:embedContent?key=${apiKey}`;

  let response;

  try {
    response = await axios.post(
      url,
      {
        model: `models/${model}`,
        content: {
          parts: [{ text }],
        },
      },
      { timeout: 30000 }
    );
  } catch (error) {
    throw new Error(getGeminiErrorMessage(error, "embedding", model));
  }

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

const isTransientGeminiError = (error) => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return (
    !status ||
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
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
    { timeout: GEMINI_TIMEOUT_MS }
  );

export const generateStylistRecommendation = async (payload) => {
  const apiKey = getApiKey();
  const model = process.env.GEMINI_GENERATION_MODEL || "gemini-3.5-flash";
  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = `You are MIROIR AI Stylist.
You are a professional fashion consultant.
You MUST ONLY recommend products that appear in the provided retrievedProducts context.
Never invent products.
Never recommend products outside the retrieved context.
Use outfit templates and fashion rules only as guidance.
Use the user's prompt as the primary styling brief.
Use body measurements, body shape, skin tone, style preferences, budget, occasion, customer feedback, user memory, and fit review summaries only when they are provided.
Return up to desiredOutfitCount distinct complete outfits. Prefer variety across silhouettes, colors, and categories while staying faithful to the prompt.
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

  let response;

  for (let attempt = 0; attempt <= GEMINI_RETRY_COUNT; attempt += 1) {
    try {
      response = await postGeminiGeneration({
        url,
        systemPrompt,
        payload,
        model,
      });
      break;
    } catch (error) {
      if (attempt >= GEMINI_RETRY_COUNT || !isTransientGeminiError(error)) {
        throw new Error(getGeminiErrorMessage(error, "generation", model));
      }
    }
  }

  if (!response) {
    throw new Error(`Gemini generation failed for model "${model}": no response`);
  }

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
