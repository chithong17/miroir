import { getUserFashionMemory, recordFashionFeedback } from "../services/fashionMemory.service.js";
import { generateStylistRecommendation } from "../services/gemini.service.js";
import {
  enrichRecommendation,
  findInvalidProductIds,
} from "../services/groundingValidation.service.js";
import { retrieveStylistContext } from "../services/retrieval.service.js";

const validateRecommendationRequest = (body) => {
  if (!body || typeof body !== "object") {
    return "Request body is required.";
  }

  if (!body.prompt || typeof body.prompt !== "string" || !body.prompt.trim()) {
    return "prompt is required.";
  }

  return null;
};

const normalizeDesiredOutfitCount = (value) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return 5;
  }

  return Math.min(Math.max(parsed, 1), 5);
};

const getProfile = (body) => body.profile || body;

const buildRetrievalRequest = (body) => {
  const profile = getProfile(body);

  return {
    prompt: body.prompt.trim(),
    gender: body.gender || profile.gender || "",
    occasion: profile.occasion || body.occasion || "",
    bodyShape: profile.bodyShape || body.bodyShape || "",
    skinTone: profile.skinTone || body.skinTone || "",
    stylePreferences: profile.stylePreferences || body.stylePreferences || [],
    feedback: profile.feedback || body.feedback || "",
    budget: body.budget,
    desiredOutfitCount: normalizeDesiredOutfitCount(body.desiredOutfitCount),
  };
};

const buildGenerationPayload = ({ body, memory, context }) => ({
  prompt: body.prompt.trim(),
  userProfile: {
    userId: body.userId || "",
    measurements: getProfile(body).measurements || {},
    bodyShape: getProfile(body).bodyShape || "",
    skinTone: getProfile(body).skinTone || "",
    gender: body.gender || getProfile(body).gender || "",
    stylePreferences: getProfile(body).stylePreferences || body.stylePreferences || [],
    budget: body.budget,
    occasion: getProfile(body).occasion || body.occasion || "",
    feedback: getProfile(body).feedback || body.feedback || "",
  },
  userMemory: memory || {},
  desiredOutfitCount: normalizeDesiredOutfitCount(body.desiredOutfitCount),
  retrievedProducts: context.products.slice(0, 18).map((product) => ({
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
    shop: product.shop,
    rerankScore: product.rerankScore,
  })),
  reviewSummaries: context.reviewSummaries,
  retrievedOutfits: context.outfits,
  retrievedFashionRules: context.fashionRules,
  outputRules: {
    allowedProductIds: context.products.slice(0, 18).map((product) => product.id),
    productDetailsMustComeFromBackend: true,
  },
});

const buildFallbackRecommendation = ({ body, context }) => {
  const desiredOutfitCount = normalizeDesiredOutfitCount(body.desiredOutfitCount);
  const products = context.products.slice(0, Math.max(desiredOutfitCount * 3, desiredOutfitCount));

  const outfits = Array.from({ length: desiredOutfitCount }, (_, index) => {
    const primary = products[index] || products[0];
    const extras = products
      .filter((product) => product.id !== primary?.id)
      .slice(index, index + 2);
    const items = [primary, ...extras]
      .filter(Boolean)
      .map((product) => ({
        productId: product.id,
        reason: `Matched to your prompt from the available catalog: ${product.name}.`,
      }));

    return {
      id: `fallback-outfit-${index + 1}`,
      title: index === 0 ? "Best catalog match" : `Catalog match ${index + 1}`,
      score: Math.max(70, Math.round((primary?.rerankScore || 0.7) * 100)),
      items,
      whyItMatches:
        "Gemini styling generation was unavailable, so this outfit was assembled from the highest ranked retrieved products.",
      fitWarnings: [],
      fashionTips: ["Review sizes and availability before trying on."],
    };
  }).filter((outfit) => outfit.items.length);

  return {
    analysis: {
      bodyShape: "",
      skinTone: "",
      styleMatch:
        "Fallback catalog ranking was used because AI generation did not finish in time.",
    },
    outfits,
    recommended_outfit: outfits[0] || {
      score: 0,
      items: [],
      whyItMatches: "",
    },
    alternatives: [],
    fitWarnings: [],
    fashionTips: ["Try a more specific prompt if you want a narrower result."],
  };
};

export const recommendOutfit = async (req, res, next) => {
  try {
    const validationError = validateRecommendationRequest(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const memory = req.body.userId
      ? await getUserFashionMemory(req.body.userId)
      : null;
    const context = await retrieveStylistContext({
      request: buildRetrievalRequest(req.body),
      memory,
    });

    if (!context.products.length) {
      return res.status(200).json({
        success: true,
        noMatch: true,
        message: "No eligible products were found for this styling request.",
        analysis: {
          bodyShape: getProfile(req.body).bodyShape || "",
          skinTone: getProfile(req.body).skinTone || "",
          styleMatch: "No product context was available for generation.",
        },
        recommended_outfit: {
          score: 0,
          items: [],
          whyItMatches: "",
        },
        outfits: [],
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
    let recommendation;

    try {
      recommendation = await generateStylistRecommendation(generationPayload);
    } catch (generationError) {
      console.error("Gemini stylist generation failed, using fallback:", generationError);
      recommendation = buildFallbackRecommendation({
        body: req.body,
        context,
      });
    }

    const allowedProductIds = new Set(context.products.map((product) => product.id));
    let invalidProductIds = findInvalidProductIds({
      recommendation,
      allowedProductIds,
    });

    if (invalidProductIds.length) {
      try {
        recommendation = await generateStylistRecommendation({
          ...generationPayload,
          correction: {
            invalidProductIds,
            instruction:
              "Regenerate the same schema using only product IDs from allowedProductIds. Check every productId inside outfits, recommended_outfit, and alternatives.",
          },
        });
      } catch (generationError) {
        console.error("Gemini stylist correction failed, using fallback:", generationError);
        recommendation = buildFallbackRecommendation({
          body: req.body,
          context,
        });
      }
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

    let enrichedRecommendation = enrichRecommendation({
      recommendation,
      products: context.products,
      desiredOutfitCount: normalizeDesiredOutfitCount(req.body.desiredOutfitCount),
    });

    if (!enrichedRecommendation.outfits.length && context.products.length) {
      enrichedRecommendation = enrichRecommendation({
        recommendation: buildFallbackRecommendation({
          body: req.body,
          context,
        }),
        products: context.products,
        desiredOutfitCount: normalizeDesiredOutfitCount(req.body.desiredOutfitCount),
      });
    }

    return res.json({
      success: true,
      ...enrichedRecommendation,
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
