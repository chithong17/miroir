export const activeCarrierConfigs = (configs) => configs.filter((config) =>
  config.is_active && ["GHN", "GHTK"].includes(config.provider));

export const defaultShippingRate = (itemsValue) => {
  const value = Number(itemsValue);
  if (!Number.isSafeInteger(value) || value < 0) {
    const error = new Error("Invalid merchandise total for shipping.");
    error.statusCode = 400;
    throw error;
  }
  const free = value > 500000;
  return {
    provider: "DEFAULT", service_id: "SHOP_DEFAULT", service_name: "Giao hàng mặc định",
    fee: free ? 0 : 10000,
    expected_delivery_time: "Shop sẽ liên hệ để giao hàng",
    description: free ? "Miễn phí giao hàng cho đơn trên 500.000đ sau giảm giá." : "Phí 10.000đ. Miễn phí với đơn trên 500.000đ sau giảm giá.",
  };
};

// Enforce the shop's default policy from server-side prices, never the client fee.
export const resolveCheckoutShipping = async ({ db, session, shopId, itemsValue, selected }) => {
  const configs = await db.collection("shop_shipping_configs").find({ shopId }, { session }).toArray();
  const active = activeCarrierConfigs(configs);
  if (!active.length) return defaultShippingRate(itemsValue);
  if (!selected || !active.some((config) => config.provider === selected.provider) ||
      !Number.isSafeInteger(selected.fee) || selected.fee < 0) {
    const error = new Error("Phương thức giao hàng đã thay đổi. Vui lòng tải lại trang và chọn phí giao hàng.");
    error.statusCode = 409;
    throw error;
  }
  return { ...selected, fee: Number(selected.fee) };
};
