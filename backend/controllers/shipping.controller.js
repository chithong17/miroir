import { getShopShippingConfig, updateShopShippingConfig, calculateShippingRates } from "../services/shipping/shipping.service.js";
import { getSingleOwnerShop } from "../services/shop.service.js";
import { resolveV2Location, migrateAddressView, normalizeCarrierAddress } from "../services/locationV2.service.js";

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
      const pickup = config.pickup_address;
      const migrated = req.query.addressVersion === "v2" && pickup && pickup.addressVersion !== "v2"
        ? migrateAddressView({ ...pickup, provinceCode: pickup.provinceCode || pickup.province_code, districtCode: pickup.districtCode || pickup.district_code, wardCode: pickup.wardCode || pickup.ward_code, addressLine: pickup.address_detail })
        : pickup;
      return {
        ...rest,
        ...(migrated ? { pickup_address: migrated } : {}),
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
    if (pickup_address?.addressVersion === "v2") {
      const location = resolveV2Location(pickup_address);
      if (!String(pickup_address.address_detail || "").trim() || !String(pickup_address.phone || "").trim()) {
        const error = new Error("Vui lòng nhập địa chỉ chi tiết và số điện thoại lấy hàng."); error.statusCode = 400; throw error;
      }
      normalizeCarrierAddress(location);
      configData.pickup_address = { ...location, address_detail: String(pickup_address.address_detail).trim(), phone: String(pickup_address.phone).trim(), contact_name: String(pickup_address.contact_name || shop.name).trim() };
      if (existingConfig?.pickup_address && existingConfig.pickup_address.addressVersion !== "v2") {
        configData.legacy_pickup_address = existingConfig.legacy_pickup_address || existingConfig.pickup_address;
      }
    } else if (pickup_address) configData.pickup_address = pickup_address;
    if (configData.is_active && !configData.pickup_address && !existingConfig?.pickup_address) {
      const error = new Error("Vui lòng nhập địa chỉ lấy hàng trước khi bật vận chuyển."); error.statusCode = 400; throw error;
    }

    if (credentials) {
      configData.credentials = { ...(existingConfig?.credentials || {}) };
      
      if (credentials.client_id !== undefined) {
        configData.credentials.client_id = String(credentials.client_id).trim();
      }
      
      if (credentials.api_token && !credentials.api_token.startsWith("******")) {
        configData.credentials.api_token = String(credentials.api_token).trim();
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
