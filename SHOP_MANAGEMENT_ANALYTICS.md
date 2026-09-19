# Phân tích trong trang Shop Management được thu thập ra sao

Tài liệu này giải thích luồng dữ liệu cho phần **Analytics** và **Customer Insights** của trang Shop Management.

## 1. Tổng quan luồng dữ liệu

Shop Management không đọc số liệu từ một bảng thống kê có sẵn. Hệ thống ghi lại các hành vi quan trọng của user thành từng event trong MongoDB collection `shop_events`, sau đó khi shop owner mở trang analytics thì backend mới tổng hợp lại theo khoảng thời gian.

Luồng chính:

1. User thao tác với sản phẩm/shop trên catalog, try-on, stylist hoặc feedback.
2. Backend gọi `trackShopEvent()` hoặc `trackShopEvents()`.
3. Event được lưu vào collection `shop_events`.
4. Dashboard gọi:
   - `GET /api/shops/me/analytics?range=7d|30d|90d`
   - `GET /api/shops/me/insights?range=7d|30d|90d`
5. Backend lọc event theo `shopId` của shop owner đang đăng nhập và `createdAt >= ngày bắt đầu`.
6. Backend tính tổng, tỷ lệ, top product và các breakdown rồi trả về frontend/mobile.

File chính:

- `backend/services/shopAnalytics.service.js`
- `backend/routes/shop.routes.js`
- `backend/controllers/shop.controller.js`
- `frontend/src/api/shopApi.js`
- `frontend/src/pages/ShopDashboardPage.jsx`
- `mobile/lib/features/account/data/owner_shop_service.dart`
- `mobile/lib/features/account/presentation/controllers/shop_dashboard_controller.dart`

## 2. Event được lưu như thế nào

Mỗi event trong `shop_events` có dạng:

```js
{
  id,
  eventType,
  shopId,
  productId,
  userId,
  metadata,
  createdAt
}
```

Hàm ghi event nằm trong `backend/services/shopAnalytics.service.js`:

- `trackShopEvent(...)`: ghi 1 event.
- `trackShopEvents(...)`: ghi nhiều event cùng lúc.

Nếu thiếu `eventType` hoặc `shopId` thì event sẽ không được ghi. Điều này đảm bảo analytics luôn gắn được với một shop cụ thể.

## 3. Các loại event đang được thu thập

### 3.1 `product_view`

Phát sinh khi user mở chi tiết sản phẩm trong catalog.

Nguồn:

- `backend/controllers/catalog.controller.js`
- Hàm `getProduct`

Metadata hiện có:

- `source: "catalog_product_detail"`
- `category`
- `productStyleTags`
- `productColors`

Lưu ý: event `product_view` hiện không truyền `userId`. Nó được dùng để đếm lượt xem và tính conversion rate, nhưng không được dùng trong Customer Insights vì insights cần tín hiệu có `userId` để đảm bảo ngưỡng riêng tư.

### 3.2 `tryon_started`

Phát sinh khi user bắt đầu try-on từ một sản phẩm catalog.

Nguồn:

- `backend/controllers/tryon.controller.js`
- Hàm `createCatalogTryOnTask`

Metadata hiện có:

- `taskId`
- `tryOnType`
- `source: "catalog_tryon"`
- `profile.gender`
- `profile.bodyShape`
- `profile.skinTone`
- `profile.stylePreferences`
- `productStyleTags`
- `productColors`

Event này có `userId`, nên được dùng cho cả Analytics và Customer Insights.

### 3.3 `stylist_product_recommended`

Phát sinh khi AI stylist/retrieval trả về các sản phẩm được recommend trong outfit.

Nguồn:

- `backend/controllers/stylist.controller.js`
- Hàm `recommendOutfit`

Cách ghi:

- Backend gom các product duy nhất xuất hiện trong danh sách outfit.
- Mỗi product có `shopId` sẽ tạo một event `stylist_product_recommended`.

Metadata hiện có:

- `prompt`
- `occasion`
- `budget`
- `profile.gender`
- `profile.bodyShape`
- `profile.skinTone`
- `profile.stylePreferences`
- `productStyleTags`
- `productColors`

Event này cho biết sản phẩm của shop đã được AI stylist đưa vào gợi ý bao nhiêu lần.

### 3.4 `product_feedback`

Phát sinh khi user gửi feedback/rating cho sản phẩm.

Nguồn:

- `backend/services/productFeedback.service.js`
- Hàm `submitProductFeedback`

Backend đồng thời:

- Lưu review vào `product_feedback_reviews`.
- Cập nhật tổng hợp review vào `product_review_summaries`.
- Ghi event `product_feedback` vào `shop_events`.

Metadata hiện có:

- `rating`
- `comment`
- `fitFeedback`
- `context`
- `productStyleTags`
- `productColors`

## 4. API Analytics tính những gì

Endpoint:

```http
GET /api/shops/me/analytics?range=30d
Authorization: Bearer <shop_owner_token>
```

Route:

- `backend/routes/shop.routes.js`
- `router.get("/me/analytics", requireActiveShopSubscription, myShopAnalytics)`

Controller:

- `backend/controllers/shop.controller.js`
- `myShopAnalytics`

Service:

- `backend/services/shopAnalytics.service.js`
- `getShopAnalytics`

Điều kiện truy cập:

- Phải đăng nhập bằng shop owner token.
- Phải có subscription shop owner đang active, vì route có middleware `requireActiveShopSubscription`.
- Shop owner phải có shop. Nếu chưa có shop, backend trả lỗi `Create your shop before viewing analytics.`

Khoảng thời gian:

- Chấp nhận `7d`, `30d`, `90d`.
- Giá trị khác sẽ tự động về `30d`.
- Backend lấy các event có `createdAt >= now - range`.

Dữ liệu được đọc:

- Collection `products`: tất cả product có `shopId` của shop.
- Collection `shop_events`: các event của shop trong range.

Phần `summary` gồm:

- `totalProducts`: tổng số product của shop.
- `publishedProducts`: số product có `status === "published"`.
- `draftProducts`: số product có `status === "draft"`.
- `outOfStockProducts`: số product có `availability === "out_of_stock"`.
- `productViews`: số event `product_view`.
- `tryOnClicks`: số event `tryon_started`.
- `stylistMatches`: số event `stylist_product_recommended`.
- `feedbackCount`: số event `product_feedback`.
- `conversionRate`: `tryOnClicks / productViews`, làm tròn 4 chữ số thập phân. Nếu không có view thì bằng `0`.

Phần `topProducts`:

Với mỗi product, backend tính:

- `views`
- `tryOns`
- `stylistMatches`
- `feedbackCount`
- `averageRating`
- `conversionRate = tryOns / views`
- `totalEngagement = views + tryOns + stylistMatches + feedbackCount`

Sau đó sắp xếp giảm dần theo `totalEngagement` và lấy tối đa 10 product.

## 5. API Customer Insights tính những gì

Endpoint:

```http
GET /api/shops/me/insights?range=30d
Authorization: Bearer <shop_owner_token>
```

Route:

- `backend/routes/shop.routes.js`
- `router.get("/me/insights", requireActiveShopSubscription, myShopInsights)`

Service:

- `backend/services/shopAnalytics.service.js`
- `getShopInsights`

Insights chỉ đọc 3 loại event:

- `tryon_started`
- `stylist_product_recommended`
- `product_feedback`

Lý do: đây là các event có tín hiệu về profile/user intent tốt hơn, và thường có `userId`.

### Ngưỡng riêng tư

Backend đặt `PRIVACY_THRESHOLD = 3`.

Nếu:

- tổng số event < 3, hoặc
- số user riêng biệt có `userId` < 3

thì API sẽ trả:

```js
{
  enoughData: false,
  message: "Not enough data yet.",
  minimumEvents: 3,
  eventCount,
  userCount
}
```

Nghĩa là shop chưa đủ mẫu để hiện insight, tránh việc shop owner suy ra hành vi của một user riêng lẻ.

### Các breakdown được tính

Khi đủ ngưỡng riêng tư, API trả `breakdowns`:

- `gender`: từ `metadata.profile.gender`.
- `bodyShape`: từ `metadata.profile.bodyShape`.
- `skinTone`: từ `metadata.profile.skinTone`.
- `stylePreferences`: từ `metadata.profile.stylePreferences`.
- `occasions`: từ `metadata.occasion`.
- `budgetBuckets`: từ `metadata.budget`.
- `styleTags`: từ `metadata.productStyleTags`.
- `colors`: từ `metadata.productColors`.
- `ratings`: từ `metadata.rating`.

Budget được gom nhóm theo `max`:

- `< 300000`: `Under 300k`
- `< 700000`: `300k-700k`
- `< 1500000`: `700k-1.5m`
- còn lại: `Over 1.5m`

Mỗi breakdown được sắp xếp theo số lượng giảm dần và lấy tối đa 8 mục.

## 6. Frontend/web dashboard hiển thị ra sao

File:

- `frontend/src/pages/ShopDashboardPage.jsx`
- `frontend/src/api/shopApi.js`

Khi shop owner vào tab Analytics:

- `loadAnalytics(range)` gọi `getShopAnalytics({ range })`.
- Nếu chưa có active shop plan thì không gọi API và hiện paywall.
- UI hiện các metric summary và bảng top products.

Khi shop owner vào tab Customer Insights:

- `loadInsights(range)` gọi `getShopInsights({ range })`.
- Nếu API trả `enoughData: false`, UI hiện trạng thái chưa đủ mẫu.
- Nếu đủ dữ liệu, UI hiện các `InsightCard` cho gender, body shape, skin tone, style preferences, occasions, budget, style tags, colors, ratings.

Range control trên UI có 3 lựa chọn:

- `7d`
- `30d`
- `90d`

## 7. Mobile shop management đọc dữ liệu ra sao

File:

- `mobile/lib/features/account/data/owner_shop_service.dart`
- `mobile/lib/features/account/presentation/controllers/shop_dashboard_controller.dart`

Mobile cũng dùng đúng 2 endpoint:

- `/shops/me/analytics`
- `/shops/me/insights`

Trong `ShopDashboardController.loadAnalytics`, mobile gọi cả analytics và insights cùng range mặc định `30d`, sau đó lưu vào:

- `_analytics`
- `_insights`

Mobile không tự tính lại analytics. Backend vẫn là nguồn sự thật.

## 8. Mock data cho test dashboard

File:

- `backend/scripts/seedShopInsightsMock.js`

Script này tạo dữ liệu mẫu vào `shop_events` cho một shop để test Analytics/Insights. Nó tạo các event mẫu:

- `product_view`
- `tryon_started`
- `stylist_product_recommended`
- `product_feedback`

Script cũng tạo fallback products nếu shop chưa có sản phẩm.

Lệnh npm trong backend:

```bash
npm run seed:shop-insights
```

## 9. Tóm tắt ngắn gọn

Analytics của Shop Management được thu thập bằng event tracking:

- Xem chi tiết sản phẩm -> `product_view`
- Try-on sản phẩm catalog -> `tryon_started`
- AI stylist recommend sản phẩm -> `stylist_product_recommended`
- User gửi feedback/rating -> `product_feedback`

Tất cả event được lưu vào `shop_events`. Khi dashboard cần xem, backend lọc theo shop của owner và range ngày, sau đó tính:

- tổng sản phẩm,
- tổng view/try-on/stylist match/feedback,
- conversion rate,
- top products,
- insight về user/style/budget/màu sắc/rating nếu đủ ngưỡng riêng tư.

Backend là nơi tổng hợp và bảo vệ quyền riêng tư; frontend và mobile chỉ gọi API để hiển thị.
