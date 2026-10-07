import axios from "axios";
import { IShippingProvider } from "../IShippingProvider.js";

/**
 * Adapter for Giao Hang Nhanh (GHN) API
 */
export class GHNAdapter extends IShippingProvider {
  constructor() {
    super();
    // Use Sandbox environment explicitly to protect from accidental real shipments
    this.isSandbox = process.env.SHIPPING_ENVIRONMENT === "SANDBOX" || !process.env.SHIPPING_ENVIRONMENT;
    
    // Default to Sandbox Gateway, can switch to prod later if configured
    this.baseURL = this.isSandbox 
      ? "https://dev-online-gateway.ghn.vn"
      : "https://online-gateway.ghn.vn";
  }

  /**
   * Helper to perform HTTP requests to GHN
   */
  async request(method, endpoint, data, config) {
    if (!config?.credentials?.api_token) {
      throw new Error("GHN API Token is missing in shop config");
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          "Content-Type": "application/json",
          "Token": config.credentials.api_token,
          ...(config.credentials.client_id ? { "ShopId": config.credentials.client_id } : {})
        },
        data,
        timeout: 5000 // 5 seconds timeout
      });

      return response.data;
    } catch (error) {
      // Map raw GHN error to our internal error structure
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`[GHN Error] ${errorMsg}`);
    }
  }

  async calculateFee(req, config) {
    // TODO: Map internal DTO to GHN Request format
    // Example endpoint: /shiip/public-api/v2/shipping-order/fee
    return {
      provider: "GHN",
      fee: 30000, // Mock for MVP
      service: "Giao Hàng Nhanh",
      estimated_delivery: "2-3 days"
    };
  }

  async createOrder(req, config) {
    // TODO: Map internal DTO to GHN Create Order request
    // Example endpoint: /shiip/public-api/v2/shipping-order/create
    if (this.isSandbox) {
      console.log("[GHNAdapter] Sandbox: Creating mock order...");
    }
    
    return {
      provider: "GHN",
      tracking_code: `MOCK_GHN_${Date.now()}`,
      provider_order_id: `MOCK_ID_${Date.now()}`
    };
  }

  async cancelOrder(trackingCode, config) {
    // TODO: Implement cancel logic
    return true;
  }

  async trackOrder(trackingCode, config) {
    // TODO: Implement tracking logic
    return {
      status: "READY_TO_PICK",
      updatedAt: new Date()
    };
  }
}
