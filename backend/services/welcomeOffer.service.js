// A welcome gift applies to one unit, even when the selected line has quantity > 1.
export const createWelcomeOffer = (now = new Date()) => ({
  status: "available", percent: 40, grantedAt: now, redeemedOrderId: null,
});

export const welcomeDiscountForShop = (discount, shopId) =>
  discount && shopId && discount.shopId === shopId ? discount.amount : 0;

export const calculateWelcomeDiscount = (groups, offer) => {
  if (offer?.status !== "available") return null;
  let selected = null;
  for (const group of groups) {
    for (const item of group.items) {
      const price = Number(item.product?.price);
      if (item.available && item.quantity > 0 && Number.isSafeInteger(price) && price > 0 &&
          (!selected || price > selected.unitPrice)) {
        selected = {
          type: "welcome", percent: 40, shopId: group.shop.id,
          productId: item.productId, variantId: item.variantId,
          productName: item.product.name, quantity: 1, unitPrice: price,
          amount: Math.round(price * 0.4),
        };
      }
    }
  }
  return selected;
};

export const claimWelcomeOffer = async ({ db, session, userId, orderId, now }) => {
  const result = await db.collection("users").updateOne(
    { id: userId, "welcomeOffer.status": "available" },
    { $set: { "welcomeOffer.status": "redeemed", "welcomeOffer.redeemedOrderId": orderId, "welcomeOffer.redeemedAt": now } },
    { session },
  );
  if (!result.modifiedCount) {
    const error = new Error("Ưu đãi chào mừng đã được sử dụng. Vui lòng tải lại giỏ hàng.");
    error.statusCode = 409;
    throw error;
  }
};

export const restoreWelcomeOffer = async ({ db, session, order }) => {
  if (order.discount?.type !== "welcome") return;
  await db.collection("users").updateOne(
    { id: order.userId, "welcomeOffer.status": "redeemed", "welcomeOffer.redeemedOrderId": order.id },
    { $set: { "welcomeOffer.status": "available", "welcomeOffer.redeemedOrderId": null }, $unset: { "welcomeOffer.redeemedAt": "" } },
    { session },
  );
};

// Allocate integer VND across partial returns; all units together refund exactly
// the discounted line total, including when the discount is not divisible by quantity.
export const returnDiscountAmount = (order, source, quantity, reserved = 0) => {
  const discount = order.discount;
  if (discount?.type !== "welcome" || discount.productId !== source.productId || discount.variantId !== source.variantId) return 0;
  return Math.floor(discount.amount * (reserved + quantity) / source.quantity)
    - Math.floor(discount.amount * reserved / source.quantity);
};
