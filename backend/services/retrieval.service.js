import { generateEmbedding } from "./gemini.service.js";
import { getMongoDb } from "./mongo.service.js";
import { getReviewSummariesByProductIds } from "./reviewSummary.service.js";
import { getActiveShopsByIds } from "./shop.service.js";

const asArray = (value) => (Array.isArray(value) ? value : []);

const intersects = (left = [], right = []) => {
  const normalized = new Set(asArray(left).map((item) => String(item).toLowerCase()));
  return asArray(right).some((item) => normalized.has(String(item).toLowerCase()));
};

export const buildStylistQueryText = ({ request, memory }) =>
  [
    `Prompt: ${request.prompt || ""}`,
    request.occasion ? `Occasion: ${request.occasion}` : "",
    request.gender ? `Gender: ${request.gender}` : "",
    request.bodyShape ? `Body shape: ${request.bodyShape}` : "",
    request.skinTone ? `Skin tone: ${request.skinTone}` : "",
    asArray(request.stylePreferences).length
      ? `Style preferences: ${asArray(request.stylePreferences).join(", ")}`
      : "",
    request.feedback ? `Feedback: ${request.feedback}` : "",
    memory?.likedStyles?.length
      ? `Liked styles: ${memory.likedStyles.join(", ")}`
      : "",
    memory?.dislikedStyles?.length
      ? `Disliked styles: ${memory.dislikedStyles.join(", ")}`
      : "",
    memory?.favoriteColors?.length
      ? `Favorite colors: ${memory.favoriteColors.join(", ")}`
      : "",
    memory?.fitPreference ? `Fit preference: ${memory.fitPreference}` : "",
  ]
    .filter(Boolean)
    .join("\n");

const buildProductFilter = (request) => {
  const filter = {};
  const and = [];

  const maxBudget = Number(request.budget?.max);
  const minBudget = Number(request.budget?.min);

  if (Number.isFinite(maxBudget) && maxBudget > 0) {
    and.push({ price: { $lte: maxBudget } });
  }

  if (Number.isFinite(minBudget) && minBudget > 0) {
    and.push({ price: { $gte: minBudget } });
  }

  if (request.gender) {
    and.push({ gender: { $in: [request.gender, "unisex"] } });
  }

  and.push({
    $or: [{ availability: "in_stock" }, { availability: true }],
  });

  if (and.length) {
    filter.$and = and;
  }

  return filter;
};

const vectorSearch = async ({
  collectionName,
  indexName,
  queryVector,
  filter,
  limit = 20,
  numCandidates = 100,
}) => {
  const db = await getMongoDb();

  return db
    .collection(collectionName)
    .aggregate([
      {
        $vectorSearch: {
          index: indexName,
          path: "embedding",
          queryVector,
          numCandidates,
          limit,
          ...(filter ? { filter } : {}),
        },
      },
      {
        $addFields: {
          vectorScore: { $meta: "vectorSearchScore" },
        },
      },
      {
        $project: {
          embedding: 0,
        },
      },
    ])
    .toArray();
};

const scoreProduct = ({ product, request, memory, reviewSummary }) => {
  let score = product.vectorScore || 0;

  const styleTags = product.styleTags || product.style_tags || [];
  const occasionTags = product.occasionTags || product.occasions || [];
  const fitType = product.fitType || product.fit_type;

  if (intersects(styleTags, request.stylePreferences)) score += 0.2;
  if (request.occasion && intersects(occasionTags, [request.occasion])) score += 0.12;
  if (intersects(product.colors, memory?.favoriteColors)) score += 0.12;
  if (intersects(styleTags, memory?.likedStyles)) score += 0.12;
  if (fitType && fitType === memory?.fitPreference) score += 0.08;
  if (reviewSummary?.fitSignals?.trueToSize) score += 0.06;
  if (reviewSummary?.fitSignals?.comfortScore >= 4.3) score += 0.05;
  if (intersects(styleTags, memory?.dislikedStyles)) score -= 0.2;
  if (intersects(product.colors, memory?.avoidedColors)) score -= 0.2;
  if (memory?.dislikedCategories?.includes(product.category)) score -= 0.15;

  return score;
};

export const retrieveStylistContext = async ({ request, memory }) => {
  const queryText = buildStylistQueryText({ request, memory });
  const queryVector = await generateEmbedding(queryText);
  const productFilter = buildProductFilter(request);

  const [rawProducts, outfits, fashionRules] = await Promise.all([
    vectorSearch({
      collectionName: "products",
      indexName: process.env.MONGODB_PRODUCT_VECTOR_INDEX || "products_embedding_index",
      queryVector,
      filter: productFilter,
      limit: 40,
      numCandidates: 200,
    }),
    vectorSearch({
      collectionName: "outfits",
      indexName: process.env.MONGODB_OUTFIT_VECTOR_INDEX || "outfits_embedding_index",
      queryVector,
      filter: request.gender ? { gender: { $in: [request.gender, "unisex"] } } : undefined,
      limit: 5,
      numCandidates: 50,
    }),
    vectorSearch({
      collectionName: "fashion_rules",
      indexName:
        process.env.MONGODB_FASHION_RULE_VECTOR_INDEX ||
        "fashion_rules_embedding_index",
      queryVector,
      limit: 10,
      numCandidates: 50,
    }),
  ]);

  const activeShops = await getActiveShopsByIds([
    ...new Set(rawProducts.map((product) => product.shopId).filter(Boolean)),
  ]);
  const activeShopById = new Map(activeShops.map((shop) => [shop.id, shop]));
  const shopFilteredProducts = rawProducts
    .filter(
      (product) =>
        product.status === "published" &&
        product.shopId &&
        activeShopById.has(product.shopId)
    )
    .map((product) => {
      const shop = activeShopById.get(product.shopId);

      return {
        ...product,
        shop: shop
          ? {
              id: shop.id,
              name: shop.name,
              slug: shop.slug,
              logoUrl: shop.logoUrl,
            }
          : undefined,
      };
    });

  if (!shopFilteredProducts.length) {
    return {
      products: [],
      outfits,
      fashionRules,
      reviewSummaries: [],
      queryText,
    };
  }

  const reviewSummaries = await getReviewSummariesByProductIds(
    shopFilteredProducts.map((product) => product.id)
  );
  const reviewByProductId = new Map(
    reviewSummaries.map((summary) => [summary.productId, summary])
  );
  const products = shopFilteredProducts
    .map((product) => ({
      ...product,
      rerankScore: scoreProduct({
        product,
        request,
        memory,
        reviewSummary: reviewByProductId.get(product.id),
      }),
    }))
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, 30);

  const selectedProductIds = new Set(products.map((product) => product.id));

  return {
    products,
    outfits,
    fashionRules,
    reviewSummaries: reviewSummaries.filter((summary) =>
      selectedProductIds.has(summary.productId)
    ),
    queryText,
  };
};
