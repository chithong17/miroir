# Plan: Làm Rõ Và Triển Khai 3 Feature Premium Cho Shop Owner

## Summary
- Hiện tại gói shop owner đã có payment/subscription gate cho đăng sản phẩm, nhưng 3 quyền “dashboard phân tích”, “ưu tiên hiển thị”, “truy cập insight khách hàng” chưa có hành vi dữ liệu rõ ràng.
- Đề xuất triển khai theo 3 lớp:
  - **Analytics Dashboard**: số liệu hiệu suất shop/sản phẩm.
  - **Priority Visibility**: shop trả phí được ưu tiên trong marketplace và AI Stylist retrieval.
  - **Customer Insights**: insight tổng hợp, ẩn danh, không lộ thông tin cá nhân nhạy cảm.

## Feature Definition

### Dashboard Phân Tích
- Shop owner premium xem được:
  - Tổng sản phẩm, published/draft/out of stock.
  - Lượt xem sản phẩm.
  - Lượt click “Try on”.
  - Lượt sản phẩm xuất hiện trong kết quả stylist.
  - Top sản phẩm theo view/try-on/stylist match.
  - Tỉ lệ chuyển đổi đơn giản: `tryOnClicks / productViews`.
- Shop owner free chỉ thấy dashboard cơ bản hiện tại và CTA nâng cấp.

### Ưu Tiên Hiển Thị
- Marketplace `/api/catalog/products` ưu tiên sản phẩm từ shop premium khi sort mặc định.
- AI Stylist retrieval cộng điểm nhẹ cho sản phẩm thuộc shop premium.
- Không phá chất lượng kết quả:
  - Chỉ boost trong nhóm sản phẩm hợp lệ: active shop, published, in stock.
  - Premium boost không vượt qua filter search/category/gender/budget.
- Admin có thể chỉnh mức boost sau này, nhưng v1 hardcode nhẹ:
  - Marketplace sort: premium shop trước, sau đó `updatedAt`.
  - Stylist rerank: cộng `+0.08` vào `rerankScore` cho shop premium.

### Truy Cập Insight Khách Hàng
- Shop owner premium xem insight tổng hợp ẩn danh:
  - Phân bổ gender/bodyShape/skinTone/stylePreferences từ user đã dùng try-on/stylist với sản phẩm shop.
  - Top occasion prompt liên quan sản phẩm shop.
  - Khoảng ngân sách phổ biến.
  - Top style tags/colors được quan tâm.
- Không hiển thị email, tên, userId raw, ảnh người dùng, hoặc profile cá nhân từng người.
- Với nhóm dữ liệu nhỏ, áp dụng ngưỡng privacy:
  - Chỉ hiển thị breakdown khi có ít nhất 3 user/event trong nhóm.
  - Nếu ít hơn, trả “Not enough data yet”.

## Implementation Changes

### Event Tracking
- Thêm collection `shop_events` để ghi event:
  - `product_view`
  - `tryon_started`
  - `stylist_product_recommended`
- Mỗi event lưu:
  - `shopId`, `productId`, `userId` nếu có, `eventType`, `metadata`, `createdAt`.
- Ghi event tại:
  - `getCatalogProduct`: product detail view.
  - `createCatalogTryOnTask`: try-on started sau khi tạo PiAPI task thành công.
  - `recommendOutfit`: sau khi enrich recommendation, ghi các product được recommend.

### Analytics API
- Thêm route shop owner premium:
  - `GET /api/shops/me/analytics?range=7d|30d|90d`
  - Trả metrics tổng quan, top products, conversion.
- Thêm route insight premium:
  - `GET /api/shops/me/insights?range=30d|90d`
  - Trả customer insight tổng hợp, áp privacy threshold.
- Dùng `requireShopOwner` + `requireActiveShopSubscription` cho 2 API này.

### Priority Visibility
- Trong catalog listing:
  - Join/lookup shop owner subscription hoặc tính premium shop ids.
  - Sort mặc định: premium products trước, rồi `updatedAt`.
- Trong stylist retrieval:
  - Khi lấy active shops, xác định shop owner premium.
  - Cộng boost nhẹ vào `scoreProduct` hoặc sau `scoreProduct`.
  - Trả metadata nội bộ `premiumBoostApplied`, không cần expose public.

### Frontend Shop Dashboard
- Thêm tab/sidebar item:
  - `Analytics`
  - `Customer Insights`
- Nếu chưa premium:
  - Hiển thị paywall với mô tả quyền lợi.
- Nếu premium:
  - Analytics view hiển thị metric cards + top product table.
  - Insights view hiển thị các breakdown dạng compact cards/bar list.
- Giữ UI quiet, dashboard-style, không marketing hero.

## Test Plan
- Free shop owner:
  - Không gọi được analytics/insights API.
  - Vẫn thấy CTA nâng cấp.
- Premium shop owner:
  - Gọi được analytics/insights.
  - Analytics trả đúng count theo `shop_events`.
- Product tracking:
  - Product detail tạo `product_view`.
  - Try-on thành công tạo `tryon_started`.
  - Stylist recommendation tạo `stylist_product_recommended`.
- Priority:
  - Marketplace default sort đưa sản phẩm premium shop lên trước khi filter giống nhau.
  - Stylist score của premium product được boost nhưng vẫn tôn trọng budget/gender/availability.
- Privacy:
  - Insight group dưới 3 events/users không trả breakdown chi tiết.

## Assumptions
- “Insight khách hàng” là dữ liệu tổng hợp ẩn danh, không phải danh sách khách hàng cá nhân.
- V1 chưa cần biểu đồ phức tạp; metric cards và bảng top products là đủ.
- “Ưu tiên hiển thị” là boost nhẹ, không đảm bảo luôn đứng đầu mọi kết quả.
- Các event mới chỉ áp dụng từ lúc triển khai trở đi; dữ liệu cũ không có tracking sẽ không tự suy ngược được.
