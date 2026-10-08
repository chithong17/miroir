import express from 'express';
import { getShopShippingConfig } from '../services/shipping/shipping.service.js';

const router = express.Router();

router.get('/check-configs', async (req, res) => {
  try {
    // Hardcode shopId for debugging since we don't have auth on this temp route
    const shopId = "6e7fcc62-000e-4956-8175-4a612c6c3084";
    const configs = await getShopShippingConfig(shopId);
    
    // Mask most of the token but show the first 5 chars to verify if it's correct
    const debugConfigs = configs.map(c => {
      let tokenSnippet = "missing";
      if (c.credentials?.api_token) {
        tokenSnippet = c.credentials.api_token.substring(0, 5) + "...";
      }
      return {
        provider: c.provider,
        isActive: c.is_active,
        shopId: c.credentials?.client_id,
        tokenStart: tokenSnippet,
      };
    });
    
    res.json({ success: true, shopId, configs: debugConfigs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
