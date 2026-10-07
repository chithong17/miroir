import { GHNAdapter } from "./providers/ghn/GHNAdapter.js";
import { GHTKAdapter } from "./providers/ghtk/GHTKAdapter.js";

/**
 * Factory class to instantiate the correct Shipping Adapter based on provider name.
 */
export class ShippingProviderFactory {
  /**
   * Get the correct shipping provider adapter instance
   * @param {string} providerName - e.g., "GHN", "GHTK"
   * @returns {IShippingProvider}
   */
  static getProvider(providerName) {
    switch (providerName) {
      case "GHN":
        return new GHNAdapter();
      case "GHTK":
        return new GHTKAdapter();
      default:
        throw new Error(`Shipping provider '${providerName}' is not supported or not implemented yet.`);
    }
  }
}
