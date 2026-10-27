import crypto from "node:crypto";

export const CATALOG_SALES_SEED = "catalog-sales-allocation-v1";
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const buildCatalogSales = ({ products, users, now = new Date() }) => {
  if (!users.length) throw new Error("At least one customer is required.");
  if (new Set(products.map((p) => p.id)).size !== products.length) throw new Error("Duplicate product IDs.");
  if (new Set(users.map((u) => u.id)).size !== users.length) throw new Error("Duplicate customer IDs.");
  const ranked = [...products].sort((a, b) => hash(a.id).localeCompare(hash(b.id)));
  const buyers = [...users].sort((a, b) => hash(a.id).localeCompare(hash(b.id)));
  const allocations = [];
  const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  const productQuantities = new Map();
  for (let i = 0; i < ranked.length; i += 1) {
    const product = ranked[i];
    const percentile = (i + 0.5) / ranked.length;
    const quantity = percentile < 0.30 ? 0 : percentile < 0.65 ? 1 : percentile < 0.87 ? 2 : percentile < 0.97 ? 3 : 4;
    distribution[quantity] += 1;
    productQuantities.set(product.id, quantity);
    for (let unit = 0; unit < quantity; unit += 1) {
      const buyer = buyers[allocations.length % buyers.length];
      allocations.push({
        id: `${CATALOG_SALES_SEED}-${hash(`${product.id}:${unit}`).slice(0, 32)}`,
        productId: product.id, shopId: product.shopId, userId: buyer.id, quantity: 1,
        source: "user-requested-random-allocation", seed: CATALOG_SALES_SEED,
        allocatedAt: now,
      });
    }
  }
  return { allocations, distribution, productQuantities };
};
