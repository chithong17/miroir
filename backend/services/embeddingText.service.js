import crypto from "crypto";

const cleanArray = (value) =>
  Array.isArray(value) ? value.filter(Boolean).map(String).join(", ") : "";

const line = (label, value) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return "";
  }

  return `${label}: ${Array.isArray(value) ? cleanArray(value) : value}`;
};

export const buildProductEmbeddingText = (product) =>
  [
    line("Name", product.name),
    line("Category", product.category),
    line("Description", product.description),
    line("Colors", product.colors),
    line("Style tags", product.styleTags || product.style_tags),
    line("Occasion tags", product.occasionTags || product.occasions),
    line("Material", product.material),
    line("Gender", product.gender),
    line("Fit type", product.fitType || product.fit_type),
  ]
    .filter(Boolean)
    .join("\n");

export const buildOutfitEmbeddingText = (outfit) =>
  [
    line("Occasion", outfit.occasion),
    line("Style", outfit.style),
    line("Gender", outfit.gender),
    line("Season", outfit.season),
    line("Items", outfit.items),
    line("Description", outfit.description),
  ]
    .filter(Boolean)
    .join("\n");

export const buildFashionRuleEmbeddingText = (rule) =>
  [
    line("Body shape", rule.bodyShape),
    line("Skin tone", rule.skinTone),
    line("Occasion", rule.occasion),
    line("Recommendation", rule.recommendation),
    line("Recommended colors", rule.recommendedColors),
    line("Avoid colors", rule.avoidColors),
    line("Style tags", rule.styleTags),
  ]
    .filter(Boolean)
    .join("\n");

export const hashEmbeddingText = (text) =>
  crypto.createHash("sha256").update(text).digest("hex");

export const getEmbeddingTextBuilder = (collectionName) => {
  if (collectionName === "products") {
    return buildProductEmbeddingText;
  }

  if (collectionName === "outfits") {
    return buildOutfitEmbeddingText;
  }

  if (collectionName === "fashion_rules") {
    return buildFashionRuleEmbeddingText;
  }

  throw new Error(`Unsupported embedding collection: ${collectionName}`);
};
