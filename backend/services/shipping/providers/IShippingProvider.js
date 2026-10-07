/**
 * Base interface/class for Shipping Providers.
 * All specific provider adapters (e.g., GHNAdapter) MUST extend this class
 * and implement its methods.
 */
export class IShippingProvider {
  /**
   * Tính phí giao hàng
   * @param {Object} req - The shipping rate request (from frontend checkout)
   * @param {Object} config - The ShopShippingConfig from database
   * @returns {Promise<Object>} Shipping fee information
   */
  async calculateFee(req, config) {
    throw new Error("Method 'calculateFee' must be implemented.");
  }

  /**
   * Tạo đơn giao hàng trên hệ thống đối tác
   * @param {Object} req - The create order request
   * @param {Object} config - The ShopShippingConfig from database
   * @returns {Promise<Object>} The created shipping order info (tracking code, etc.)
   */
  async createOrder(req, config) {
    throw new Error("Method 'createOrder' must be implemented.");
  }

  /**
   * Hủy đơn giao hàng
   * @param {string} trackingCode - The order tracking code
   * @param {Object} config - The ShopShippingConfig from database
   * @returns {Promise<boolean>}
   */
  async cancelOrder(trackingCode, config) {
    throw new Error("Method 'cancelOrder' must be implemented.");
  }

  /**
   * Tra cứu trạng thái đơn hàng
   * @param {string} trackingCode - The order tracking code
   * @param {Object} config - The ShopShippingConfig from database
   * @returns {Promise<Object>} Status info
   */
  async trackOrder(trackingCode, config) {
    throw new Error("Method 'trackOrder' must be implemented.");
  }
}
