import crypto from "node:crypto";

export const MOCK_SEED = "shop-commerce-demo-v2";
export const SCENARIOS = [
  { id: "steady", name: "Bán hàng ổn định", orders: 96, costRatio: 0.58, mismatchEvery: 9, returnEvery: 16 },
  { id: "size_attention", name: "Cần cải thiện size", orders: 72, costRatio: 0.82, mismatchEvery: 2, returnEvery: 6 },
  { id: "new_shop", name: "Shop mới, ít dữ liệu", orders: 12, costRatio: null, mismatchEvery: 0, returnEvery: 0 },
];

export const buildShopSimulation = ({ shop, products = [], scenario = SCENARIOS[0], now = new Date() }) => {
  const id = (kind, index) => `${MOCK_SEED}-${crypto.createHash("sha256").update(`${shop.id}:${kind}:${index}`).digest("hex").slice(0, 24)}`;
  const at = (days, minutes = 0) => new Date(now.getTime() - days * 86400000 + minutes * 60000);
  const tagged = (doc) => ({ ...doc, mockSeed: MOCK_SEED, mockScenario: scenario.id });
  const fallback = [
    { name: "[Mẫu] Áo cotton cơ bản", category: "tops", price: 320000 },
    { name: "[Mẫu] Quần ống rộng", category: "pants", price: 520000 },
    { name: "[Mẫu] Váy midi", category: "dress", price: 690000 },
  ].map((product, i) => tagged({ ...product, id: id("product", i), shopId: shop.id, status: "draft", gender: "female", description: "Sản phẩm mô phỏng cho báo cáo shop.", colors: ["beige"], sizes: ["S", "M", "L"], styleTags: ["minimalist"], availability: "in_stock", imageUrl: "", embeddingStale: true, variants: ["S", "M", "L"].map((size, j) => ({ id: id("variant", i * 3 + j), sku: `DEMO-${id("sku", i).slice(-8)}-${size}`, size, color: "beige", stockQuantity: 40, active: true })), createdAt: at(90), updatedAt: now }));
  const catalog = products.length ? products.slice(0, 6) : fallback;
  const collections = { products: products.length ? [] : fallback, orders: [], order_cost_snapshots: [], shop_events: [], fit_events: [], fit_feedback: [], order_returns: [] };
  const addEvent = (eventType, i, product, userId, createdAt, metadata = {}) => {
    collections.shop_events.push(tagged({ id: id(`event-${eventType}`, i), shopId: shop.id, productId: product.id, userId, eventType, createdAt, metadata: { mockSeed: MOCK_SEED, productStyleTags: product.styleTags || ["casual"], productColors: product.colors || [], ...metadata } }));
  };
  for (let i = 0; i < scenario.orders; i += 1) {
    const days = i < Math.ceil(scenario.orders * 0.7) ? 1 + (i % 27) : 32 + (i % 52);
    const createdAt = at(days, -i);
    const product = catalog[i % 5 < 3 ? 0 : (i % catalog.length)];
    const variant = product.variants?.[i % Math.max(1, product.variants?.length || 1)] || { id: id(`legacy-${product.id}`, 0), size: product.sizes?.[0] || "M", color: product.colors?.[0] || "beige", sku: "DEMO-HISTORICAL" };
    const userId = id("customer", i % 24);
    const quantity = i % 4 === 0 ? 2 : 1;
    const unitPrice = Number(product.price) > 0 ? Number(product.price) : 320000;
    const item = { productId: product.id, variantId: variant.id, name: product.name, imageUrl: product.imageUrl || "", sku: variant.sku || "DEMO", color: variant.color || "", size: variant.size || "M", unitPrice, quantity, lineTotal: unitPrice * quantity };
    const pending = i % 10 === 7;
    const cancelled = i % 10 === 9;
    const delivered = !pending && !cancelled;
    const deliveredAt = delivered ? new Date(createdAt.getTime() + 2 * 3600000) : null;
    const order = tagged({
      id: id("order", i), orderCode: `DEMO${id("code", i).slice(-16).toUpperCase()}`, shopId: shop.id, userId,
      ownerIdSnapshot: shop.ownerId, commissionRateSnapshot: 0, billingCycleIdSnapshot: null,
      shopSnapshot: { id: shop.id, name: shop.name, logoUrl: shop.logoUrl || "" },
      recipient: { name: `Khách mô phỏng ${String(i % 24 + 1).padStart(2, "0")}`, phone: "", fullAddress: "Địa chỉ mô phỏng", addressLine: "Địa chỉ mô phỏng" },
      items: [item], subtotal: item.lineTotal, total: item.lineTotal, shippingFee: 0,
      paymentMethod: pending || i % 2 ? "cash" : "bank_transfer", paymentStatus: pending || cancelled ? "cod_pending" : "paid",
      orderStatus: pending ? "preparing" : cancelled ? "cancelled" : "delivered", deliveredAt, paidAt: deliveredAt,
      expiresAt: null, paymentDueAt: null, paymentSnapshot: null, refund: null, paymentProof: null,
      createdAt, updatedAt: deliveredAt || createdAt,
      statusHistory: [{ status: "pending_confirmation", actorType: "system", note: "Đơn mô phỏng", createdAt }, { status: pending ? "preparing" : cancelled ? "cancelled" : "delivered", actorType: "system", note: "Trạng thái mô phỏng", createdAt: new Date(createdAt.getTime() + 2 * 3600000) }],
    });
    collections.orders.push(order);
    collections.order_cost_snapshots.push(tagged({ id: id("cost", i), orderId: order.id, shopId: shop.id, items: [{ productId: product.id, variantId: variant.id, quantity, costPrice: scenario.costRatio == null ? null : Math.round(unitPrice * scenario.costRatio / 1000) * 1000 }], createdAt }));
    const profile = { gender: i % 5 ? "female" : "unisex", bodyShape: ["pear", "rectangle", "hourglass"][i % 3], skinTone: ["warm", "neutral", "cool"][i % 3], stylePreferences: i % 2 ? ["minimalist", "casual"] : ["office", "modern"] };
    for (let j = 0; j < 7 + i % 5; j += 1) addEvent("product_view", i * 20 + j, product, userId, new Date(createdAt.getTime() - (j + 3) * 60000));
    if (i % 2 === 0) addEvent("tryon_started", i, product, userId, new Date(createdAt.getTime() - 120000), { profile });
    if (i % 3 === 0) addEvent("stylist_product_recommended", i, product, userId, new Date(createdAt.getTime() - 60000), { profile, occasion: i % 2 ? "daily" : "office", budget: { min: 200000, max: i % 2 ? 650000 : 1200000 } });
    if (scenario.id !== "new_shop") {
      const types = ["opened", "recommended", ...(i % 4 ? ["applied"] : []), ...(i % 4 && delivered ? ["add_to_cart", "checkout"] : [])];
      types.forEach((type, j) => collections.fit_events.push(tagged({ id: id(`fit-${type}`, i), actorKey: userId, shopId: shop.id, productId: product.id, variantId: variant.id, type, confidence: i % 3 ? "high" : "moderate", dataStatus: "measured", createdAt: new Date(createdAt.getTime() - (6 - j) * 60000) })));
      if (delivered) {
        const mismatch = scenario.mismatchEvery && i % scenario.mismatchEvery === 0;
        const outcome = mismatch ? (i % 4 ? "too_large" : "too_small") : "true_to_size";
        const feedbackAt = new Date(createdAt.getTime() + 4 * 3600000);
        collections.fit_feedback.push(tagged({ id: id("feedback", i), actorKey: userId, orderId: order.id, productId: product.id, shopId: shop.id, variantId: variant.id, outcome, createdAt: feedbackAt }));
        addEvent("product_feedback", i, product, userId, feedbackAt, { profile, rating: mismatch ? 3 : 5, fitFeedback: outcome, comment: "Phản hồi mô phỏng" });
        if (scenario.returnEvery && i % scenario.returnEvery === 0) {
          const returnedAt = new Date(createdAt.getTime() + 8 * 3600000);
          const returnedItem = { ...item, quantity: 1, lineTotal: unitPrice };
          collections.order_returns.push(tagged({ id: id("return", i), orderId: order.id, orderCode: order.orderCode, shopId: shop.id, userId, items: [returnedItem], reasonCode: mismatch ? "size_or_fit" : "damaged", reason: mismatch ? "Mô phỏng: sản phẩm không vừa" : "Mô phỏng: lỗi sản phẩm", refundAmount: unitPrice, status: "refunded", attachments: [], refundAccount: { bankName: "Mô phỏng", accountNumber: "", accountHolder: "Khách mô phỏng" }, refund: { amount: unitPrice, note: "Hoàn tiền mô phỏng", refundedAt: returnedAt }, history: [{ status: "refunded", actorType: "system", note: "Mô phỏng", createdAt: returnedAt }], createdAt: returnedAt, updatedAt: returnedAt, billingSyncedAt: returnedAt }));
        }
      }
    }
  }
  return { scenario, collections };
};
