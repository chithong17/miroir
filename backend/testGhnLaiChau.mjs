import axios from "axios";

const cache = { provinces: null, districts: {}, wards: {} };

async function request(method, endpoint, params) {
  const response = await axios({
    method,
    url: `https://dev-online-gateway.ghn.vn${endpoint}`,
    headers: {
      "Content-Type": "application/json",
      "Token": "543cb00c-7729-11ef-ba38-ea081387d8ef" // test token
    },
    params,
    timeout: 5000
  });
  return response.data;
}

async function resolveLocation(provinceName, districtName, wardName) {
  const clean = (str) => str ? str.replace(/tỉnh|thành phố|tp\.|tp|quận|huyện|thị xã|phường|xã|thị trấn/gi, "").trim().toLowerCase() : "";
  
  if (!cache.provinces) {
    const res = await request("GET", "/shiip/public-api/master-data/province", null);
    cache.provinces = res.data;
  }
  const tp = clean(provinceName);
  const province = cache.provinces.find(p => clean(p.ProvinceName) === tp || (p.NameExtension && p.NameExtension.some(ext => clean(ext) === tp)));
  if (!province) throw new Error("Cannot map province: " + provinceName);

  if (!cache.districts[province.ProvinceID]) {
    const res = await request("GET", "/shiip/public-api/master-data/district", { province_id: province.ProvinceID });
    cache.districts[province.ProvinceID] = res.data;
  }
  const td = clean(districtName);
  const district = cache.districts[province.ProvinceID].find(d => clean(d.DistrictName) === td || (d.NameExtension && d.NameExtension.some(ext => clean(ext) === td)));
  if (!district) {
      console.log("Available districts:", cache.districts[province.ProvinceID].map(d => d.DistrictName));
      throw new Error("Cannot map district: " + districtName);
  }

  let wardCode = null;
  if (wardName) {
    if (!cache.wards[district.DistrictID]) {
      const res = await request("GET", "/shiip/public-api/master-data/ward", { district_id: district.DistrictID });
      cache.wards[district.DistrictID] = res.data;
    }
    const tw = clean(wardName);
    const ward = cache.wards[district.DistrictID].find(w => clean(w.WardName) === tw || (w.NameExtension && w.NameExtension.some(ext => clean(ext) === tw)));
    if (!ward) {
        console.log("Available wards:", cache.wards[district.DistrictID].map(w => w.WardName));
        throw new Error("Cannot map ward: " + wardName);
    }
    wardCode = ward.WardCode;
  }

  return { provinceId: province.ProvinceID, districtId: district.DistrictID, wardCode };
}

async function run() {
  try {
    const loc = await resolveLocation("Tỉnh Lai Châu", "Huyện Mường Tè", "Xã Mù Cả");
    console.log("Success:", loc);
  } catch (e) {
    console.error(e.message);
  }
}
run();
