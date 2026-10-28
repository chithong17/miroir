import { classifyOutfitProduct, buildCoherentFallbackOutfits, areOutfitGendersCompatible } from "./outfitFallback.service.js";
import { enrichRecommendation } from "./groundingValidation.service.js";

const coreRoles = ["top", "bottom", "one-piece"];
const visualKey = product => String(product.imageUrl || product.image_url || product.id).split("?")[0];

export function selectDiverseProducts(products, { limit = 30, coreTarget = 5 } = {}) {
  const remaining = [...new Map(products.map(product => [product.id, product])).values()];
  const selected = [], shops = new Map(), roles = new Map();
  const take = role => {
    let best = -1, score = -Infinity;
    remaining.forEach((product, index) => {
      const type = classifyOutfitProduct(product);
      if (role && type !== role) return;
      const value = Number(product.rerankScore ?? product.vectorScore ?? 0) - (shops.get(product.shopId) || 0) * 0.07 - (role ? 0 : (roles.get(type) || 0) * 0.04);
      if (value > score) { score = value; best = index; }
    });
    if (best < 0) return false;
    const [product] = remaining.splice(best, 1), type = classifyOutfitProduct(product);
    selected.push(product); shops.set(product.shopId, (shops.get(product.shopId) || 0) + 1); roles.set(type, (roles.get(type) || 0) + 1);
    return true;
  };
  // Reserve main garments before accessory-heavy or single-shop results consume the context.
  for (let round = 0; round < coreTarget && selected.length < limit; round++) for (const role of coreRoles) if (selected.length < limit) take(role);
  while (selected.length < limit && take()) { /* fill remaining slots by relevance and diversity */ }
  return selected;
}

export function selectDiverseOutfits(outfits, { count = 5, budget, preferred = new Set() } = {}) {
  const candidates = outfits.filter(outfit => {
    const roles = outfit.items.map(item => classifyOutfitProduct(item.product));
    const tops = roles.filter(role => role === "top").length;
    const bottoms = roles.filter(role => role === "bottom").length;
    const pieces = roles.filter(role => role === "one-piece").length;
    const complete = ((pieces === 1 && tops === 0 && bottoms === 0) || (pieces === 0 && tops === 1 && bottoms === 1)) && !roles.includes("other") && roles.filter(role => role === "outerwear").length <= 1;
    const total = outfit.items.reduce((sum, item) => sum + Number(item.product.price || 0), 0);
    return complete && areOutfitGendersCompatible(outfit.items.map(item => item.product)) && !(Number(budget?.max) > 0 && total > Number(budget.max)) && !(Number(budget?.min) > 0 && total < Number(budget.min));
  });
  const selected = [], usedCore = new Set(), usedItems = new Set();
  while (selected.length < count) {
    let best = -1, score = -Infinity;
    candidates.forEach((outfit, index) => {
      const main = outfit.items.filter(item => coreRoles.includes(classifyOutfitProduct(item.product)));
      if (main.some(item => usedCore.has(visualKey(item.product)))) return;
      const key = outfit.items.map(item => item.product.id).sort().join("|");
      const value = (preferred.has(key) ? 2 : 0) - index * 0.01 - outfit.items.filter(item => usedItems.has(visualKey(item.product))).length * 0.5;
      if (value > score) { score = value; best = index; }
    });
    if (best < 0) break;
    const [outfit] = candidates.splice(best, 1);
    selected.push(outfit);
    outfit.items.forEach(item => usedItems.add(visualKey(item.product)));
    for (const { product } of outfit.items) if (coreRoles.includes(classifyOutfitProduct(product))) {
      usedCore.add(visualKey(product));
    }
  }
  return selected;
}

export function diversifyRecommendation({ recommendation, products, prompt, count = 5, budget }) {
  const aiOutfits = recommendation.outfits?.length ? recommendation.outfits : recommendation.recommended_outfit ? [recommendation.recommended_outfit] : [];
  const fallback = buildCoherentFallbackOutfits({ products, prompt, desiredOutfitCount: Math.max(20, count * 6) });
  const productById = new Map(products.map(product => [product.id, product]));
  const minimal = fallback.map((outfit, index) => {
    const items = outfit.items.filter(item => coreRoles.includes(classifyOutfitProduct(productById.get(item.productId))));
    const names = items.map(item => productById.get(item.productId).name).join(" + ");
    return { ...outfit, id: `${outfit.id}-minimal`, items, title: `Phối đồ ${index + 1}`, whyItMatches: `Kết hợp ${names} thành trang phục hoàn chỉnh cho yêu cầu “${prompt}”.` };
  });
  const candidates = [...aiOutfits.slice(0, count * 2), ...fallback, ...minimal];
  const enriched = enrichRecommendation({ recommendation: { ...recommendation, outfits: candidates }, products, desiredOutfitCount: candidates.length });
  const preferred = new Set(aiOutfits.map(outfit => [...new Set((outfit.items || []).map(item => item.productId))].sort().join("|")));
  const outfits = selectDiverseOutfits(enriched.outfits, { count, budget, preferred });
  const first = outfits[0];
  return { ...enriched, outfits, recommended_outfit: { score: first?.score || 0, items: first?.items || [], whyItMatches: first?.whyItMatches || "" } };
}
