import { getShopShippingConfig, updateShopShippingConfig, calculateShippingRates } from "../services/shipping/shipping.service.js";
import { getSingleOwnerShop } from "../services/shop.service.js";

/**
 * Controller handling shop shipping settings
 */

/**
 * GET /api/shipping-configs/me
 * Lấy danh sách cấu hình vận chuyển của Shop hiện tại
 */
export const getMyShippingConfigs = async (req, res, next) => {
  try {
    const shop = await getSingleOwnerShop(req.owner.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    const shopId = shop.id;
    const configs = await getShopShippingConfig(shopId);

    // Mask the API tokens before sending to Frontend
    const maskedConfigs = configs.map(config => {
      const { credentials, ...rest } = config;
      let maskedCredentials = { ...credentials };
      if (maskedCredentials.api_token) {
        maskedCredentials.api_token = "******" + maskedCredentials.api_token.slice(-4);
      }
      return {
        ...rest,
        credentials: maskedCredentials
      };
    });

    res.json({ success: true, data: maskedConfigs });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/shipping-configs/me/:provider
 * Cập nhật cấu hình vận chuyển cho một hãng cụ thể (vd: GHN)
 */
export const updateMyShippingConfig = async (req, res, next) => {
  try {
    const shop = await getSingleOwnerShop(req.owner.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    const shopId = shop.id;
    const provider = req.params.provider.toUpperCase();
    
    const existingConfigs = await getShopShippingConfig(shopId);
    const existingConfig = existingConfigs.find(c => c.provider === provider);

    const { is_active, credentials, shop_code, pickup_address, environment } = req.body;

    const configData = {
      is_active: Boolean(is_active),
      environment: environment || "SANDBOX"
    };

    if (shop_code) configData.shop_code = shop_code;
    if (pickup_address) configData.pickup_address = pickup_address;

    if (credentials) {
      configData.credentials = { ...(existingConfig?.credentials || {}) };
      
      if (credentials.client_id !== undefined) {
        configData.credentials.client_id = credentials.client_id;
      }
      
      if (credentials.api_token && !credentials.api_token.startsWith("******")) {
        configData.credentials.api_token = credentials.api_token;
      }
    }

    const updatedConfig = await updateShopShippingConfig(shopId, provider, configData);

    res.json({ success: true, data: updatedConfig });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/shipping-rates
 * Dành cho khách mua hàng: Lấy danh sách phí vận chuyển
 */
export const calculateShippingRatesForCheckout = async (req, res, next) => {
  try {
    const { shopId, deliveryAddress, itemsWeight, itemsValue } = req.body;
    
    if (!shopId || !deliveryAddress) {
      return res.status(400).json({ success: false, message: "Missing shopId or deliveryAddress" });
    }

    const rates = await calculateShippingRates(shopId, {
      deliveryAddress,
      itemsWeight: itemsWeight || 1000, // default 1kg
      itemsValue: itemsValue || 0
    });

    res.json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
};
