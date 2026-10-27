const rank = (id, seed) => {
  let hash = 2166136261;
  for (const char of `${seed}:${id}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
  return (hash ^ (hash >>> 16)) >>> 0;
};

export const mixCatalogProducts = (products, seed) => products
  .map((product) => ({ product, rank: rank(product.id, seed) }))
  .sort((a, b) => a.rank - b.rank || String(a.product.id).localeCompare(String(b.product.id)))
  .map(({ product }) => product);
