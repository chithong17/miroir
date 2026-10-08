import axios from "axios";

const testToken = "543cb00c-7729-11ef-ba38-ea081387d8ef"; // public token from docs

async function run() {
  try {
    const res = await axios.get("https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province", {
      headers: { Token: testToken }
    });
    console.log("Provinces:", res.data.data.slice(0, 2));
    
    const hcm = res.data.data.find(p => p.ProvinceName.includes("Hồ Chí Minh"));
    if (hcm) {
      console.log("HCM ProvinceID:", hcm.ProvinceID);
      const resD = await axios.get("https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district", {
        headers: { Token: testToken },
        params: { province_id: hcm.ProvinceID }
      });
      console.log("Districts:", resD.data.data.slice(0, 2));
      
      const q1 = resD.data.data.find(d => d.DistrictName.includes("Quận 1"));
      if (q1) {
        console.log("Q1 DistrictID:", q1.DistrictID);
        const resW = await axios.get("https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=" + q1.DistrictID, {
          headers: { Token: testToken }
        });
        console.log("Wards:", resW.data.data.slice(0, 2));
      }
    }
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}

run();
