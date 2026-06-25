import { getUserFashionMemory, recordFashionFeedback } from "../services/fashionMemory.service.js";
import { generateStylistRecommendation } from "../services/gemini.service.js";
import {
  enrichRecommendation,
  findInvalidProductIds,
} from "../services/groundingValidation.service.js";
import { retrieveStylistContext } from "../services/retrieval.service.js";

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

const validateRecommendationRequest = (body) => {
  if (!body || typeof body !== "object") {
    return "Request body is required.";
  }

  if (!body.userId) {
    return "userId is required.";
  }

  if (!body.measurements || typeof body.measurements !== "object") {
    return "measurements are required.";
  }

  if (!isNumber(Number(body.budget?.max))) {
    return "budget.max is required.";
  }

  if (!body.occasion) {
    return "occasion is required.";
  }

  if (!body.skinTone) {
    return "skinTone is required.";
  }

  return null;
};

const buildGenerationPayload = ({ body, memory, context }) => ({
  userProfile: {
    userId: body.userId,
    measurements: body.measurements,
    bodyShape: body.bodyShape,
    skinTone: body.skinTone,
    gender: body.gender,
    stylePreferences: body.stylePreferences || [],
    budget: body.budget,
    occasion: body.occasion,
    feedback: body.feedback || "",
  },
  userMemory: memory || {},
  retrievedProducts: context.products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    colors: product.colors || [],
    sizes: product.sizes || [],
    styleTags: product.styleTags || [],
    occasionTags: product.occasionTags || product.occasions || [],
    material: product.material,
    fitType: product.fitType,
    rerankScore: product.rerankScore,
  })),
  reviewSummaries: context.reviewSummaries,
  retrievedOutfits: context.outfits,
  retrievedFashionRules: context.fashionRules,
  outputRules: {
    allowedProductIds: context.products.map((product) => product.id),
    productDetailsMustComeFromBackend: true,
  },
});

export const recommendOutfit = async (req, res, next) => {
  try {
    const validationError = validateRecommendationRequest(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const memory = await getUserFashionMemory(req.body.userId);
    const context = await retrieveStylistContext({
      request: req.body,
      memory,
    });

    if (!context.products.length) {
      return res.status(200).json({
        success: true,
        noMatch: true,
        message: "No eligible products were found for this styling request.",
        analysis: {
          bodyShape: req.body.bodyShape || "",
          skinTone: req.body.skinTone || "",
          styleMatch: "No product context was available for generation.",
        },
        recommended_outfit: {
          score: 0,
          items: [],
          whyItMatches: "",
        },
        alternatives: [],
        fitWarnings: [],
        fashionTips: [],
      });
    }

    const generationPayload = buildGenerationPayload({
      body: req.body,
      memory,
      context,
    });
    let recommendation = await generateStylistRecommendation(generationPayload);
    const allowedProductIds = new Set(context.products.map((product) => product.id));
    let invalidProductIds = findInvalidProductIds({
      recommendation,
      allowedProductIds,
    });

    if (invalidProductIds.length) {
      recommendation = await generateStylistRecommendation({
        ...generationPayload,
        correction: {
          invalidProductIds,
          instruction:
            "Regenerate the same schema using only product IDs from allowedProductIds.",
        },
      });
      invalidProductIds = findInvalidProductIds({
        recommendation,
        allowedProductIds,
      });
    }

    if (invalidProductIds.length) {
      return res.status(502).json({
        success: false,
        message:
          "Gemini returned product IDs outside the retrieved context after retry.",
        invalidProductIds,
      });
    }

    return res.json({
      success: true,
      ...enrichRecommendation({
        recommendation,
        products: context.products,
      }),
      retrieval: {
        productCount: context.products.length,
        outfitCount: context.outfits.length,
        fashionRuleCount: context.fashionRules.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitStylistFeedback = async (req, res, next) => {
  try {
    const memory = await recordFashionFeedback(req.body);

    return res.status(201).json({
      success: true,
      memory,
    });
  } catch (error) {
    next(error);
  }
};
