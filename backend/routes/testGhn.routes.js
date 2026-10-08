import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/ghn', async (req, res) => {
  const { token, shopId, isProd } = req.query;
  const baseURL = isProd === '1' ? 'https://online-gateway.ghn.vn' : 'https://dev-online-gateway.ghn.vn';
  
  try {
    const response = await axios({
      method: 'GET',
      url: `${baseURL}/shiip/public-api/v2/shop/all`,
      headers: {
        "Content-Type": "application/json",
        "Token": token
      }
    });
    
    res.json({ success: true, url: baseURL, data: response.data });
  } catch (error) {
    res.status(500).json({
      success: false,
      url: baseURL,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
  }
});

router.get('/ghn-fee', async (req, res) => {
  const { token, shopId, isProd } = req.query;
  const baseURL = isProd === '1' ? 'https://online-gateway.ghn.vn' : 'https://dev-online-gateway.ghn.vn';
  
  try {
    const payload = {
      from_district_id: 1442,
      from_ward_code: "21211",
      service_type_id: 2,
      to_district_id: 1452,
      to_ward_code: "21012",
      weight: 500,
      insurance_value: 0
    };
    const response = await axios({
      method: 'POST',
      url: `${baseURL}/shiip/public-api/v2/shipping-order/fee`,
      headers: {
        "Content-Type": "application/json",
        "Token": token,
        "ShopId": shopId ? Number(shopId) : undefined
      },
      data: payload
    });
    
    res.json({ success: true, url: baseURL, payload, data: response.data });
  } catch (error) {
    res.status(500).json({
      success: false,
      url: baseURL,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
  }
});

export default router;
