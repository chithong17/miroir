import snapshot from "../data/catalogSoldCounts.json" with { type: "json" };

// Prefer the live API, including a legitimate zero, during rolling deployments.
export const getProductSoldCount = (product) => {
  const count = product?.soldCount ?? snapshot.counts[product?.id] ?? 0;
  return Math.max(0, Math.trunc(Number(count) || 0));
};
