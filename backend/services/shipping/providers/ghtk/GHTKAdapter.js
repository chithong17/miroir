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
      const params = {
        pick_province: req.pick_province || "Hà Nội",
        pick_district: req.pick_district || "Quận Đống Đa",
        province: req.province || "Hồ Chí Minh",
        district: req.district || "Quận 1",
        weight: req.weight || 500, // gram
        value: req.value || 0,
        deliver_option: "none"
      };

      const response = await axios.get(`${this.baseURL}/services/shipment/fee`, {
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
      if (this.isSandbox) {
        console.warn("[GHTK Sandbox] API failed or token invalid, falling back to mock fee.");
        return {
          provider: "GHTK",
          service_id: "GHTK_STD",
          service_name: "Giao Hàng Tiết Kiệm (Sandbox Mock)",
          fee: 25000,
          expected_delivery_time: "Dự kiến 2-3 ngày"
        };
      }
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
          pick_address: config.pickup_address?.address_detail || "123 Đường",
          pick_province: config.pickup_address?.province_name || "Hà Nội",
          pick_district: config.pickup_address?.district_name || "Quận Đống Đa",
          pick_tel: "0909090909",
          tel: req.recipient.phone,
          name: req.recipient.name,
          address: req.recipient.addressLine,
          province: req.recipient.provinceName,
          district: req.recipient.districtName || req.recipient.provinceName,
          is_freeship: 1,
          pick_money: 0,
          note: req.recipient.note
        }
      };

      const response = await axios.post(`${this.baseURL}/services/shipment/order`, payload, {
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
      if (this.isSandbox) {
        console.warn("[GHTK Sandbox] API failed or token invalid, falling back to mock order.");
        return {
          provider: "GHTK",
          tracking_code: `GHTK_TEST_${Date.now()}`,
          provider_order_id: req.orderCode
        };
      }
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
