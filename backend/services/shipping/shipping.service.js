import { getMongoDb } from "../mongo.service.js";
import { ShippingProviderFactory } from "./ShippingProviderFactory.js";
import { ObjectId } from "mongodb";

/**
 * Service to manage Shipping Configurations and interact with Providers
 */

/**
 * Lấy cấu hình vận chuyển của một Shop
 */
export const getShopShippingConfig = async (shopId) => {
  const db = await getMongoDb();
  return db.collection("shop_shipping_configs").find({ shopId }).toArray();
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
export const calculateShippingRates = async (shopId, rateRequestData) => {
  const configs = await getShopShippingConfig(shopId);
  const activeConfigs = configs.filter(c => c.is_active);

  if (activeConfigs.length === 0) {
    return []; // Shop hasn't enabled any shipping provider
  }

  // Gọi song song tất cả các hãng đang được bật
  const promises = activeConfigs.map(async (config) => {
    try {
      const adapter = ShippingProviderFactory.getProvider(config.provider);
      return await adapter.calculateFee(rateRequestData, config);
    } catch (error) {
      console.error(`[ShippingRates] Error from ${config.provider}:`, error.message);
      return null;
    }
  });

  const results = await Promise.all(promises);
  // Loại bỏ các hãng bị lỗi
  return results.filter(res => res !== null);
};

/**
 * Tạo vận đơn trên hãng vận chuyển khi Shop xác nhận giao hàng
 */
export const createShippingOrder = async (shopId, orderData) => {
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
  return await adapter.createOrder(orderData, config);
};
