const normalizeAlternatives = (alternatives) =>
  Array.isArray(alternatives) ? alternatives : [];

export const findInvalidProductIds = ({ recommendation, allowedProductIds }) => {
  const ids = [];
  const items = recommendation?.recommended_outfit?.items || [];
  const alternatives = normalizeAlternatives(recommendation?.alternatives);

  items.forEach((item) => {
    if (item?.productId && !allowedProductIds.has(item.productId)) {
      ids.push(item.productId);
    }
  });

  alternatives.forEach((item) => {
    if (item?.productId && !allowedProductIds.has(item.productId)) {
      ids.push(item.productId);
    }
  });

  return [...new Set(ids)];
};

export const enrichRecommendation = ({ recommendation, products }) => {
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
      },
      reason: item.reason || "",
    };
  };

  return {
    analysis: recommendation.analysis || {
      bodyShape: "",
      skinTone: "",
      styleMatch: "",
    },
    recommended_outfit: {
      score: recommendation.recommended_outfit?.score || 0,
      items: (recommendation.recommended_outfit?.items || [])
        .filter((item) => productById.has(item.productId))
        .map(enrichItem),
      whyItMatches: recommendation.recommended_outfit?.whyItMatches || "",
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
