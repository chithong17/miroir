import axios from "axios";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

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
  const model = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
  const url = `${GEMINI_BASE_URL}/models/${model}:embedContent?key=${apiKey}`;

  const response = await axios.post(
    url,
    {
      model: `models/${model}`,
      content: {
        parts: [{ text }],
      },
    },
    { timeout: 30000 }
  );

  const values = response.data?.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini embedding response did not include values.");
  }

  return values;
};

const parseGeminiJson = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
};

export const generateStylistRecommendation = async (payload) => {
  const apiKey = getApiKey();
  const model = process.env.GEMINI_GENERATION_MODEL || "gemini-1.5-flash";
  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = `You are MIROIR AI Stylist.
You are a professional fashion consultant.
You MUST ONLY recommend products that appear in the provided retrievedProducts context.
Never invent products.
Never recommend products outside the retrieved context.
Use outfit templates and fashion rules only as guidance.
Analyze body measurements, body shape, skin tone, style preferences, budget, occasion, customer feedback, user memory, and fit review summaries.
Return JSON only using this schema:
{
  "analysis": {
    "bodyShape": "",
    "skinTone": "",
    "styleMatch": ""
  },
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
}`;

  const response = await axios.post(
    url,
    {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.35,
      },
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
    { timeout: 60000 }
  );

  const text =
    response.data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

  if (!text) {
    throw new Error("Gemini generation response was empty.");
  }

  return parseGeminiJson(text);
};
