const normalizeAlternatives = (alternatives) =>
  Array.isArray(alternatives) ? alternatives : [];

const normalizeOutfits = (recommendation) => {
  if (Array.isArray(recommendation?.outfits) && recommendation.outfits.length) {
    return recommendation.outfits;
  }

  return recommendation?.recommended_outfit
    ? [recommendation.recommended_outfit]
    : [];
};

export const findInvalidProductIds = ({ recommendation, allowedProductIds }) => {
  const ids = [];
  const outfits = normalizeOutfits(recommendation);
  const legacyItems = recommendation?.recommended_outfit?.items || [];
  const alternatives = normalizeAlternatives(recommendation?.alternatives);

  outfits.forEach((outfit) => {
    (outfit?.items || []).forEach((item) => {
      if (item?.productId && !allowedProductIds.has(item.productId)) {
        ids.push(item.productId);
      }
    });
  });

  legacyItems.forEach((item) => {
    if (item?.productId && !allowedProductIds.has(item.productId)) ids.push(item.productId);
  });

  alternatives.forEach((item) => {
    if (item?.productId && !allowedProductIds.has(item.productId)) {
      ids.push(item.productId);
    }
  });

  return [...new Set(ids)];
};

export const enrichRecommendation = ({ recommendation, products, desiredOutfitCount = 5 }) => {
  const productById = new Map(products.map((product) => [product.id, product]));

  const enrichItem = (item) => {
    const product = productById.get(item.productId);

    return {
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        colors: product.colors || [],
        sizes: product.sizes || [],
        imageUrl: product.imageUrl || product.image_url,
        availability: product.availability,
        shop: product.shop,
      },
      reason: item.reason || "",
    };
  };

  const enrichOutfit = (outfit, index) => ({
    id: outfit.id || `outfit-${index + 1}`,
    title: outfit.title || `Outfit ${index + 1}`,
    score: outfit.score || 0,
    items: (outfit.items || [])
      .filter((item) => productById.has(item.productId))
      .map(enrichItem),
    whyItMatches: outfit.whyItMatches || "",
    fitWarnings: Array.isArray(outfit.fitWarnings) ? outfit.fitWarnings : [],
    fashionTips: Array.isArray(outfit.fashionTips) ? outfit.fashionTips : [],
  });

  const outfits = normalizeOutfits(recommendation)
    .slice(0, desiredOutfitCount)
    .map(enrichOutfit)
    .filter((outfit) => outfit.items.length);

  const firstOutfit = outfits[0] || {
    id: "outfit-1",
    title: "",
    score: 0,
    items: [],
    whyItMatches: "",
    fitWarnings: [],
    fashionTips: [],
  };

  return {
    analysis: recommendation.analysis || {
      bodyShape: "",
      skinTone: "",
      styleMatch: "",
    },
    outfits,
    recommended_outfit: {
      score: firstOutfit.score,
      items: firstOutfit.items,
      whyItMatches: firstOutfit.whyItMatches,
    },
    alternatives: (recommendation.alternatives || [])
      .filter((item) => productById.has(item.productId))
      .map(enrichItem),
    fitWarnings: Array.isArray(recommendation.fitWarnings)
      ? recommendation.fitWarnings
      : [],
    fashionTips: Array.isArray(recommendation.fashionTips)
      ? recommendation.fashionTips
      : [],
  };
};
