import { getMongoDb } from "../mongo.service.js";
import { ShippingProviderFactory } from "./ShippingProviderFactory.js";
import { activeCarrierConfigs, defaultShippingRate } from "./defaultShipping.js";
import { normalizeCarrierAddress } from "../locationV2.service.js";

/**
 * Service to manage Shipping Configurations and interact with Providers
 */

/**
 * Lấy cấu hình vận chuyển của một Shop
 */
export const getShopShippingConfig = async (shopId, { db: suppliedDb, session } = {}) => {
  const db = suppliedDb || await getMongoDb();
  return db.collection("shop_shipping_configs").find({ shopId }, { session }).toArray();
};

/**
 * Cập nhật cấu hình vận chuyển cho một Shop
 */
export const updateShopShippingConfig = async (shopId, provider, configData) => {
  const db = await getMongoDb();
  
  const updateDoc = {
    $set: {
      ...configData,
      updatedAt: new Date()
    },
    $setOnInsert: {
      createdAt: new Date(),
      shopId: shopId,
      provider
    }
  };

  const result = await db.collection("shop_shipping_configs").findOneAndUpdate(
    { shopId, provider },
    updateDoc,
    { upsert: true, returnDocument: 'after' }
  );

  return result;
};

/**
 * Gọi nhiều hãng vận chuyển để tính phí giao hàng (dùng lúc Checkout)
 */
export const calculateShippingRates = async (shopId, rateRequestData, options = {}) => {
  const configs = await getShopShippingConfig(shopId, options);
  const activeConfigs = activeCarrierConfigs(configs);

  if (activeConfigs.length === 0) {
    return [defaultShippingRate(rateRequestData.itemsValue ?? 0)];
  }
  const sourceAddress = rateRequestData.deliveryAddress || {};
  const deliveryAddress = normalizeCarrierAddress({
    ...sourceAddress,
    provinceName: sourceAddress.provinceName || sourceAddress.province,
    districtName: sourceAddress.districtName || sourceAddress.district,
    wardName: sourceAddress.wardName || sourceAddress.ward,
    addressLine: sourceAddress.addressLine || sourceAddress.address_detail,
  });

  // Gọi song song tất cả các hãng đang được bật
  const promises = activeConfigs.map(async (config) => {
    try {
      const rawPickup = config.pickup_address || {};
      const pickup = normalizeCarrierAddress({ ...rawPickup,
        provinceName: rawPickup.provinceName || rawPickup.province_name,
        districtName: rawPickup.districtName || rawPickup.district_name,
        wardName: rawPickup.wardName || rawPickup.ward_name,
      });
      const providerConfig = { ...config, pickup_address: { ...rawPickup, ...pickup,
        province_name: pickup.provinceName, district_name: pickup.districtName, ward_name: pickup.wardName } };
      const adapter = ShippingProviderFactory.getProvider(config.provider);
      return await adapter.calculateFee({ ...rateRequestData, deliveryAddress }, providerConfig);
    } catch (error) {
      console.error(`[ShippingRates] Error from ${config.provider}:`, error.message);
      return { error: `${config.provider}: ${error.message}` };
    }
  });

  const results = await Promise.all(promises);
  
  const validResults = results.filter(res => res && !res.error && Number.isSafeInteger(res.fee) && res.fee >= 0);
  
  if (activeConfigs.length > 0 && validResults.length === 0) {
    const error = new Error("Không thể tính phí vận chuyển. Shop cần kiểm tra địa chỉ lấy hàng, danh mục địa bàn hoặc cấu hình hãng vận chuyển.");
    error.statusCode = 409;
    throw error;
  }

  return validResults;
};

/**
 * Tạo vận đơn trên hãng vận chuyển khi Shop xác nhận giao hàng
 */
export const createShippingOrder = async (shopId, orderData) => {
  if (orderData.shippingProvider === "DEFAULT") {
    return { provider: "DEFAULT", managedByShop: true };
  }
  const configs = await getShopShippingConfig(shopId);
  const provider = orderData.shippingProvider;
  
  if (!provider) {
    throw new Error("Order does not have a selected shipping provider.");
  }
  
  const config = configs.find(c => c.provider === provider && c.is_active);
  if (!config) {
    throw new Error(`Shipping provider ${provider} is not active or configured.`);
  }

  const adapter = ShippingProviderFactory.getProvider(provider);
  const rawPickup = config.pickup_address || {};
  const pickup = normalizeCarrierAddress({ ...rawPickup,
    provinceName: rawPickup.provinceName || rawPickup.province_name,
    districtName: rawPickup.districtName || rawPickup.district_name,
    wardName: rawPickup.wardName || rawPickup.ward_name,
  });
  return await adapter.createOrder({ ...orderData, recipient: normalizeCarrierAddress(orderData.recipient) }, {
    ...config, pickup_address: { ...rawPickup, ...pickup, province_name: pickup.provinceName, district_name: pickup.districtName, ward_name: pickup.wardName },
  });
};
