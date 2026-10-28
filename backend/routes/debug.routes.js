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

router.get('/piapi-balance', async (req, res) => {
  try {
    const key = process.env.PIAPI_KEY?.trim();
    if (!key) return res.status(400).json({ error: "Missing PIAPI_KEY" });
    const { default: axios } = await import('axios');
    const response = await axios.get('https://api.piapi.ai/account/info', {
      headers: { 'x-api-key': key }
    });
    res.json({
      success: true,
      keyPrefix: key.slice(0, 4) + '...' + key.slice(-4),
      accountName: response.data?.data?.name,
      pointRemain: response.data?.data?.wallet?.point_remain,
      equivalentInUsd: response.data?.data?.equivalent_in_usd,
      maxKlingConcurrency: response.data?.data?.max_kling_concurrency,
      rawWallet: response.data?.data?.wallet,
    });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

router.get('/piapi-task/:taskId', async (req, res) => {
  try {
    const key = process.env.PIAPI_KEY?.trim();
    if (!key) return res.status(400).json({ error: "Missing PIAPI_KEY" });
    const { default: axios } = await import('axios');
    const response = await axios.get(`https://api.piapi.ai/api/v1/task/${req.params.taskId}`, {
      headers: { 'x-api-key': key }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

export default router;
