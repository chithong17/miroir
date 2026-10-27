import axios from "axios";

/**
 * GHTK Adapter cho môi trường Sandbox
 * Endpoints:
 * - Staging (Test): https://services-staging.ghtklab.com
 * - Production: https://services.giaohangtietkiem.vn
 */
export class GHTKAdapter {
  constructor() {
    this.isSandbox = process.env.SHIPPING_ENVIRONMENT !== "PRODUCTION";
    // Mặc định luôn dùng Sandbox trừ khi cấu hình PRODUCTION
    this.baseURL = this.isSandbox 
      ? "https://services-staging.ghtklab.com" 
      : "https://services.giaohangtietkiem.vn";
  }

  getBaseUrl(config) {
    if (config.environment === "PRODUCTION") return "https://services.giaohangtietkiem.vn";
    if (config.environment === "SANDBOX") return "https://services-staging.ghtklab.com";
    return this.baseURL;
  }

  _getHeaders(config) {
    if (!config || !config.credentials || !config.credentials.api_token) {
      throw new Error("GHTK Adapter requires an API token in the configuration.");
    }
    return {
      "Token": config.credentials.api_token,
      "Content-Type": "application/json"
    };
  }

  async calculateFee(req, config) {
    try {
      // Mocking request parameters to GHTK format
      const deliveryAddress = req.deliveryAddress || {};
      const params = {
        pick_province: config.pickup_address.province_name,
        pick_district: config.pickup_address.district_name,
        province: deliveryAddress.provinceName || deliveryAddress.province,
        district: deliveryAddress.districtName || deliveryAddress.district,
        pick_ward: config.pickup_address.ward_name,
        ward: deliveryAddress.wardName || deliveryAddress.ward,
        address: deliveryAddress.addressLine || deliveryAddress.address_detail,
        weight: req.itemsWeight || 500, // gram
        value: req.itemsValue || 0,
        deliver_option: "none"
      };

      const response = await axios.get(`${this.getBaseUrl(config)}/services/shipment/fee`, {
        headers: this._getHeaders(config),
        params,
        timeout: 5000
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to calculate GHTK fee.");
      }

      const fee = response.data.fee.fee;

      return {
        provider: "GHTK",
        service_id: "GHTK_STD",
        service_name: "Giao Hàng Tiết Kiệm",
        fee: fee,
        expected_delivery_time: "Dự kiến 2-4 ngày"
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`[GHTK Error] ${errorMsg}`);
    }
  }

  async createOrder(req, config) {
    try {
      const payload = {
        products: req.items.map(i => ({
          name: i.name,
          weight: 0.5,
          quantity: i.quantity
        })),
        order: {
          id: req.orderCode,
          pick_name: config.shop_name || "Shop",
          pick_address: config.pickup_address.address_detail,
          pick_province: config.pickup_address.province_name,
          pick_district: config.pickup_address.district_name,
          pick_tel: config.pickup_address.phone,
          pick_ward: config.pickup_address.ward_name,
          tel: req.recipient.phone,
          name: req.recipient.name,
          address: req.recipient.addressLine,
          province: req.recipient.provinceName,
          district: req.recipient.districtName,
          ward: req.recipient.wardName,
          hamlet: "Khác",
          is_freeship: 1,
          pick_money: req.paymentMethod === "cash" ? req.total : 0,
          note: req.recipient.note
        }
      };

      const response = await axios.post(`${this.getBaseUrl(config)}/services/shipment/order`, payload, {
        headers: this._getHeaders(config),
        timeout: 5000
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create GHTK order.");
      }

      return {
        provider: "GHTK",
        tracking_code: response.data.order.label,
        provider_order_id: response.data.order.partner_id
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`[GHTK Error] ${errorMsg}`);
    }
  }

  async cancelOrder(trackingCode, config) {
    return true;
  }

  async trackOrder(trackingCode, config) {
    return {
      status: "READY_TO_PICK",
      updatedAt: new Date()
    };
  }
}
