import axios from "axios";
import { IShippingProvider } from "../IShippingProvider.js";

const cache = {
  provinces: null,
  districts: {},
  wards: {}
};

/**
 * Adapter for Giao Hang Nhanh (GHN) API
 */
export class GHNAdapter extends IShippingProvider {
  constructor() {
    super();
    this.isSandbox = process.env.SHIPPING_ENVIRONMENT === "SANDBOX" || !process.env.SHIPPING_ENVIRONMENT;
    this.baseURL = this.isSandbox 
      ? "https://dev-online-gateway.ghn.vn"
      : "https://online-gateway.ghn.vn";
  }

  async request(method, endpoint, data, config, params = null) {
    if (!config?.credentials?.api_token) {
      throw new Error("GHN API Token is missing in shop config");
    }

    const isConfigSandbox = config.environment === "SANDBOX" || this.isSandbox;
    const dynamicBaseURL = isConfigSandbox ? "https://dev-online-gateway.ghn.vn" : "https://online-gateway.ghn.vn";

    try {
      const response = await axios({
        method,
        url: `${dynamicBaseURL}${endpoint}`,
        headers: {
          "Content-Type": "application/json",
          "Token": config.credentials.api_token,
          ...(config.credentials.client_id ? { "ShopId": Number(config.credentials.client_id) } : {})
        },
        data,
        params,
        timeout: 5000
      });
      
      const resBody = response.data;
      if (resBody && resBody.code && resBody.code !== 200) {
        throw new Error(`[GHN API Error] Code: ${resBody.code}, Message: ${resBody.message}`);
      }
      
      return resBody;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`[GHN Request Error] ${errorMsg}`);
    }
  }

  async resolveLocation(provinceName, districtName, wardName, config) {
    const clean = (str) => {
      if (!str) return "";
      let s = str.replace(/tỉnh|thành phố|tp\.|tp|quận|huyện|thị xã|phường|xã|thị trấn/gi, "").trim().toLowerCase();
      s = s.replace(/òa/g, "oà").replace(/óa/g, "oá").replace(/ỏa/g, "oả").replace(/õa/g, "oã").replace(/ọa/g, "oạ");
      s = s.replace(/òe/g, "oè").replace(/óe/g, "oé").replace(/ỏe/g, "oẻ").replace(/õe/g, "oẽ").replace(/ọe/g, "oẹ");
      s = s.replace(/ùy/g, "uỳ").replace(/úy/g, "uý").replace(/ủy/g, "uỷ").replace(/ũy/g, "uỹ").replace(/ụy/g, "uỵ");
      return s;
    };
    
    // 1. Province
    if (!cache.provinces) {
      const res = await this.request("GET", "/shiip/public-api/master-data/province", null, config);
      if (!res || !res.data) throw new Error("GHN API returned empty province data");
      cache.provinces = res.data;
    }
    const tp = clean(provinceName);
    const province = cache.provinces.find(p => clean(p.ProvinceName) === tp) 
                  || cache.provinces.find(p => p.NameExtension && p.NameExtension.some(ext => clean(ext) === tp));
    if (!province) throw new Error("Cannot map province: " + provinceName);

    // 2. District
    if (!cache.districts[province.ProvinceID]) {
      const res = await this.request("GET", "/shiip/public-api/master-data/district", null, config, { province_id: province.ProvinceID });
      if (!res || !res.data) throw new Error(`GHN API returned empty district data for province_id: ${province.ProvinceID}`);
      cache.districts[province.ProvinceID] = res.data;
    }
    const td = clean(districtName);
    const district = cache.districts[province.ProvinceID].find(d => clean(d.DistrictName) === td) 
                  || cache.districts[province.ProvinceID].find(d => d.NameExtension && d.NameExtension.some(ext => clean(ext) === td));
    if (!district) throw new Error("Cannot map district: " + districtName);

    // 3. Ward (Optional)
    let wardCode = null;
    if (wardName) {
      if (!cache.wards[district.DistrictID]) {
        const res = await this.request("GET", "/shiip/public-api/master-data/ward", null, config, { district_id: district.DistrictID });
        if (!res || !res.data) throw new Error(`GHN API returned empty ward data for district_id: ${district.DistrictID}`);
        cache.wards[district.DistrictID] = res.data;
      }
      const tw = clean(wardName);
      const ward = cache.wards[district.DistrictID].find(w => clean(w.WardName) === tw) 
                || cache.wards[district.DistrictID].find(w => w.NameExtension && w.NameExtension.some(ext => clean(ext) === tw));
      if (!ward) throw new Error("Cannot map ward: " + wardName);
      wardCode = ward.WardCode;
    }

    console.log(`[GHN resolveLocation] ${provinceName} -> ${province.ProvinceID}, ${districtName} -> ${district.DistrictID}, ${wardName} -> ${wardCode}`);
    return { provinceId: province.ProvinceID, districtId: district.DistrictID, wardCode };
  }

  async calculateFee(req, config) {
    console.log(`[GHN calculateFee] Initiating for GHN ShopId: ${config.credentials?.client_id || 'Not set'}`);
    const deliveryAddress = req.deliveryAddress || {};
    const pickupAddress = config.pickup_address || {};

    const toLoc = await this.resolveLocation(
      deliveryAddress.province || deliveryAddress.provinceName || "Hồ Chí Minh",
      deliveryAddress.district || deliveryAddress.districtName || "Quận 1",
      deliveryAddress.ward || deliveryAddress.wardName,
      config
    );

    const fromLoc = await this.resolveLocation(
      pickupAddress.province_name || "Hà Nội",
      pickupAddress.district_name || "Quận Đống Đa",
      pickupAddress.ward_name,
      config
    );

    // If the shop's database address is missing the ward, GHN will crash because the shop
    // might not have a fallback address configured on the GHN portal either.
    // So we pick the first available ward in that district to get an accurate fee estimate.
    let finalFromWardCode = fromLoc.wardCode;
    if (!finalFromWardCode && fromLoc.districtId) {
      if (!cache.wards[fromLoc.districtId]) {
        const res = await this.request("GET", "/shiip/public-api/master-data/ward", null, config, { district_id: fromLoc.districtId });
        cache.wards[fromLoc.districtId] = res?.data || [];
      }
      if (cache.wards[fromLoc.districtId].length > 0) {
        finalFromWardCode = cache.wards[fromLoc.districtId][0].WardCode;
      }
    }

    const payload = {
      shop_id: config.credentials.client_id ? Number(config.credentials.client_id) : undefined,
      from_district_id: fromLoc.districtId,
      from_ward_code: finalFromWardCode,
      service_type_id: 2, // Standard
      to_district_id: toLoc.districtId,
      to_ward_code: toLoc.wardCode,
      weight: req.itemsWeight || 500,
      insurance_value: req.itemsValue || 0
    };

    console.log(`[GHN calculateFee] Calling API /fee with from_district_id: ${payload.from_district_id}, to_district_id: ${payload.to_district_id}`);
    const res = await this.request("POST", "/shiip/public-api/v2/shipping-order/fee", payload, config);
    console.log(`[GHN calculateFee] API Response total fee: ${res.data?.total}`);
    
    return {
      provider: "GHN",
      service_id: "GHN_STD",
      service_name: "Giao Hàng Nhanh",
      fee: res.data?.total || 0,
      expected_delivery_time: "Dự kiến 2-3 ngày"
    };
  }

  async createOrder(req, config) {
    const toLoc = await this.resolveLocation(
      req.recipient.provinceName,
      req.recipient.districtName || req.recipient.provinceName,
      req.recipient.wardName,
      config
    );

    const payload = {
      payment_type_id: 1, // Seller pays
      note: req.recipient.note,
      required_note: "CHOXEMHANGKHONGTHU",
      client_order_code: req.orderCode,
      to_name: req.recipient.name,
      to_phone: req.recipient.phone,
      to_address: req.recipient.addressLine,
      to_ward_code: toLoc.wardCode,
      to_district_id: toLoc.districtId,
      weight: 500, // gram
      service_type_id: 2,
      items: req.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        weight: 500
      }))
    };

    const res = await this.request("POST", "/shiip/public-api/v2/shipping-order/create", payload, config);

    return {
      provider: "GHN",
      tracking_code: res.data.order_code,
      provider_order_id: res.data.order_code
    };
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
