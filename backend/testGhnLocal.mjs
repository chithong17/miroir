import axios from 'axios';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Nhập GHN Token của bạn (bấm chuột phải để Paste): ', async (token) => {
  token = token.trim();
  if (!token) {
    console.log("Bạn chưa nhập token!");
    rl.close();
    return;
  }
  
  rl.question('Nhập GHN Shop ID của bạn (ví dụ 5565356): ', async (shopId) => {
    shopId = shopId.trim();
    
    console.log(`\nĐang gọi thử API Sandbox (dev-online-gateway.ghn.vn) với Token: ${token} và ShopID: ${shopId}...\n`);
    
    try {
      // Test 1: Lấy danh sách tỉnh thành (để test Token cơ bản)
      console.log(">>> TEST 1: Lấy danh sách Tỉnh/Thành...");
      const res1 = await axios.get('https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province', {
        headers: {
          'Token': token,
          'ShopId': Number(shopId)
        }
      });
      
      if (res1.data && res1.data.code !== 200) {
        console.log(`[TEST 1 THẤT BẠI] GHN trả về lỗi: ${res1.data.message}`);
      } else {
        console.log(`[TEST 1 THÀNH CÔNG] Đã lấy được ${res1.data.data.length} tỉnh thành.`);
      }
      
    } catch (error) {
      console.log(`[TEST 1 THẤT BẠI CỰC ĐỘ] ${error.response?.data?.message || error.message}`);
    }
    
    try {
      // Test 2: Lấy thông tin các Shop của tài khoản này
      console.log("\n>>> TEST 2: Xác minh Shop ID...");
      const res2 = await axios.post('https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shop/all', {
        offset: 0,
        limit: 50,
        client_phone: ""
      }, {
        headers: {
          'Token': token
        }
      });
      
      if (res2.data && res2.data.code !== 200) {
         console.log(`[TEST 2 THẤT BẠI] GHN trả về lỗi: ${res2.data.message}`);
      } else {
         const shops = res2.data.data.shops;
         console.log(`[TEST 2 THÀNH CÔNG] Tài khoản của bạn có ${shops.length} cửa hàng.`);
         const foundShop = shops.find(s => s._id.toString() === shopId || s.shop_id.toString() === shopId);
         if (foundShop) {
           console.log(`  -> TUYỆT VỜI! Shop ID ${shopId} có tồn tại và hợp lệ với Token này.`);
         } else {
           console.log(`  -> LỖI: Không tìm thấy Shop ID ${shopId} trong tài khoản này! Danh sách các Shop ID hợp lệ của bạn là:`);
           shops.forEach(s => console.log(`     - Shop ID: ${s._id} | Tên shop: ${s.name}`));
         }
      }
    } catch (error) {
      console.log(`[TEST 2 THẤT BẠI CỰC ĐỘ] ${error.response?.data?.message || error.message}`);
    }

    rl.close();
  });
});
