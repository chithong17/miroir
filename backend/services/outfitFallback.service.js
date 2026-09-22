const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();

export const classifyOutfitProduct = (product = {}) => {
  const text = normalize(`${product.category || ""} ${product.name || ""}`);
  if (/\b(dress|dam|jumpsuit)\b/.test(text)) return "one-piece";
  if (/\b(jacket|blazer|cardigan|coat|hoodie|ao khoac)\b/.test(text)) return "outerwear";
  if (/\b(pants?|trousers?|jeans?|shorts?|skirt|culottes?|quan|chan vay)\b/.test(text)) return "bottom";
  if (/\b(top|shirts?|t-shirt|tee|blouse|sweater|ao thun|ao so mi)\b/.test(text)) return "top";
  if (/\b(shoes?|sneakers?|heels?|boots?|sandals?|giay|dep)\b/.test(text)) return "shoes";
  if (/\b(bag|belt|hat|scarf|jewelry|tui|that lung|mu|khan)\b/.test(text)) return "accessory";
  return "other";
};

const partyPrompt = (prompt) => /sinh nhat|du tiec|party|birthday|event/.test(normalize(prompt));
const partyBottomRank = (product) => /skirt|chan vay/.test(normalize(`${product.category} ${product.name}`)) ? 0 : 1;
const reasonFor = (product, role, prompt) => ({
  top: `${product.name} là lớp áo chính, phù hợp với yêu cầu “${prompt}”.`,
  bottom: `${product.name} hoàn thiện phần thân dưới và tạo tỷ lệ cân đối cho set đồ.`,
  outerwear: `${product.name} được dùng làm lớp khoác để hoàn thiện tổng thể.`,
  "one-piece": `${product.name} tạo thành trang phục liền mạch cho yêu cầu “${prompt}”.`,
  shoes: `${product.name} bổ sung phần giày cho set đồ.`,
  accessory: `${product.name} là điểm nhấn phụ kiện cho tổng thể.`,
  other: `${product.name} là lựa chọn bổ sung từ catalog hiện có.`,
}[role]);

const signature = (items) => items.map((item) => item.id).sort().join("|");

export const buildCoherentFallbackOutfits = ({
  products = [],
  prompt = "",
  desiredOutfitCount = 5,
}) => {
  const buckets = {
    top: [], bottom: [], outerwear: [], "one-piece": [], shoes: [], accessory: [], other: [],
  };
  products.forEach((product) => buckets[classifyOutfitProduct(product)].push(product));
  if (partyPrompt(prompt)) buckets.bottom.sort((a, b) => partyBottomRank(a) - partyBottomRank(b));

  const candidates = [];
  const seen = new Set();
  const addCandidate = (items, type) => {
    const uniqueItems = [...new Map(items.filter(Boolean).map((item) => [item.id, item])).values()];
    if (!uniqueItems.length) return;
    const key = signature(uniqueItems);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ items: uniqueItems, type });
  };

  buckets["one-piece"].forEach((piece, index) => {
    addCandidate([
      piece,
      buckets.outerwear[index % Math.max(1, buckets.outerwear.length)],
      buckets.shoes[index % Math.max(1, buckets.shoes.length)],
      buckets.accessory[index % Math.max(1, buckets.accessory.length)],
    ], "one-piece");
  });

  for (let offset = 0; offset < Math.max(buckets.top.length, buckets.bottom.length); offset += 1) {
    const top = buckets.top[offset % Math.max(1, buckets.top.length)];
    const bottom = buckets.bottom[offset % Math.max(1, buckets.bottom.length)];
    if (!top || !bottom) continue;
    addCandidate([
      top,
      bottom,
      buckets.outerwear[offset % Math.max(1, buckets.outerwear.length)],
      buckets.shoes[offset % Math.max(1, buckets.shoes.length)],
      buckets.accessory[offset % Math.max(1, buckets.accessory.length)],
    ], "separates");
  }

  // Build additional unique top/bottom combinations if the catalog has enough variety.
  for (const top of buckets.top) {
    for (const bottom of buckets.bottom) {
      if (candidates.length >= desiredOutfitCount) break;
      const index = candidates.length;
      addCandidate([
        top,
        bottom,
        buckets.outerwear[index % Math.max(1, buckets.outerwear.length)],
      ], "separates");
    }
  }

  if (!candidates.length) {
    // Do not manufacture five duplicate outfits when the catalog is incomplete.
    [...buckets.top, ...buckets.bottom, ...buckets.outerwear, ...buckets.other]
      .slice(0, desiredOutfitCount)
      .forEach((product) => addCandidate([product], "single"));
  }

  return candidates.slice(0, desiredOutfitCount).map((candidate, index) => {
    const labels = candidate.items.map((item) => item.name).join(" + ");
    return {
      id: `fallback-outfit-${index + 1}`,
      title: candidate.type === "single" ? `Gợi ý sản phẩm: ${labels}` : `Phối đồ: ${labels}`,
      score: Math.max(72, 84 - index * 2),
      items: candidate.items.map((product) => ({
        productId: product.id,
        reason: reasonFor(product, classifyOutfitProduct(product), prompt),
      })),
      whyItMatches: candidate.type === "single"
        ? `Catalog hiện chỉ đủ dữ liệu để đề xuất riêng ${labels}; đây chưa phải một outfit hoàn chỉnh.`
        : `Kết hợp ${labels} thành một set có lớp chính và phần thân dưới rõ ràng cho yêu cầu “${prompt}”.`,
      fitWarnings: [],
      fashionTips: ["Kiểm tra màu, size và biến thể còn hàng trước khi thêm vào giỏ."],
    };
  });
};
