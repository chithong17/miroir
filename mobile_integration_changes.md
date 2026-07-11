# MIROIR Payment, Subscription, Analytics, Feedback - Mobile Integration Notes

Tài liệu này tổng hợp các thay đổi đã làm ở backend và frontend để team mobile có thể tích hợp tiếp.

## 1. Nguyên tắc chung

- Backend là nguồn sự thật cho plan, trạng thái subscription, quota try-on, quyền xem dữ liệu shop và quyền dùng feature premium.
- Mobile không tự quyết định user là Free/Premium bằng local state. Luôn đọc từ API `/me` hoặc `/api/payments/me`.
- Frontend web hiện tại chỉ render theo dữ liệu backend trả về. Mobile nên làm tương tự.
- PayOS dùng payment link theo tháng, chưa phải recurring subscription tự động.
- User Free có 5 lượt try-on/tháng.
- User Premium không giới hạn try-on và được dùng AI stylist/phối đồ theo sự kiện.
- Shop Owner Premium được đăng/sửa/import/upload sản phẩm, xem analytics, xem customer insights và được boost hiển thị.

## 2. Plan và giá

Backend định nghĩa 2 gói trả phí:

| Plan code | Account type | Giá mặc định | Thời hạn | Quyền |
| --- | --- | ---: | ---: | --- |
| `USER_PREMIUM_MONTHLY` | `user` | 49.000 VND | 30 ngày | Không giới hạn thử đồ, phối đồ theo sự kiện, tư vấn phong cách AI |
| `SHOP_OWNER_MONTHLY` | `shop_owner` | 349.000 VND | 30 ngày | Đăng sản phẩm lên nền tảng, tiếp cận user MIROIR, dashboard phân tích, ưu tiên hiển thị, truy cập insight khách hàng |

Admin có thể chỉnh giá/thời hạn/features trong collection `payment_plans`. Mobile nên gọi API lấy plans thay vì hardcode giá.

## 3. Backend thay đổi chính

### 3.1 Payment và subscription

Đã thêm payment service dùng PayOS:

- Tạo payment order.
- Tạo PayOS checkout URL.
- Xử lý webhook PayOS.
- Sync lại trạng thái order khi user quay về success/cancel.
- Khi paid, active/cộng hạn subscription 30 ngày hoặc theo `durationDays` hiện tại của plan.
- Chống webhook lặp làm cộng hạn nhiều lần.

Các collection liên quan:

- `payment_orders`
- `payment_plans`
- `users.subscription`
- `shop_owners.subscription`

### 3.2 Quota try-on cho user Free

Đã thêm collection `usage_counters`:

- `accountType: "user"`
- `accountId`
- `feature: "tryon"`
- `period: "YYYY-MM"`
- `count`
- `limit`

Rule:

- User Free: tối đa 5 try-on/tháng.
- User Premium: không bị giới hạn 5 lượt.
- Chỉ tăng quota sau khi tạo PiAPI task thành công.

### 3.3 Gate quyền theo plan

Backend đã gate các feature:

- `/api/tryon/catalog`: user Free bị giới hạn 5 lượt/tháng, user Premium không giới hạn.
- `/api/tryon/custom`: user Free bị giới hạn 5 lượt/tháng, user Premium không giới hạn.
- `/api/stylist/recommend`: yêu cầu user Premium.
- Shop product create/update/upload/import: yêu cầu Shop Owner Premium.
- Shop analytics/insights: yêu cầu Shop Owner Premium.
- Xem tên shop/thông tin shop của product: yêu cầu User Premium.

### 3.4 Product shop info chỉ cho User Premium

Catalog product list/detail hiện dùng optional user auth.

Nếu user là Premium:

```json
{
  "product": {
    "id": "product-id",
    "name": "Dress",
    "shop": {
      "id": "shop-id",
      "name": "Shop Name",
      "slug": "shop-name",
      "description": "...",
      "logoUrl": "...",
      "coverUrl": "...",
      "contact": {
        "address": "...",
        "phone": "...",
        "email": "..."
      }
    },
    "premiumShopDetailsRequired": false
  }
}
```

Nếu user Free/anonymous:

```json
{
  "product": {
    "id": "product-id",
    "name": "Dress",
    "shop": null,
    "premiumShopDetailsRequired": true
  }
}
```

Route `/api/catalog/shops/:shopId` cũng đã bị chặn cho user không Premium để tránh lộ tên/địa chỉ shop qua `shopId`.

### 3.5 Feedback/rating sản phẩm

Đã thêm service feedback cho product.

Collection:

- `product_feedback_reviews`
- `product_review_summaries`
- `shop_events` với `eventType: "product_feedback"`

Feedback gồm:

- `rating`: số nguyên 1-5
- `fitFeedback`: `true_to_size`, `runs_small`, `runs_large`, `not_sure`
- `comment`
- `context`: `product`, `tryon`, `stylist`

Backend validate:

- Bắt buộc login user.
- Product phải tồn tại.
- Rating phải từ 1 đến 5.
- Sau khi lưu review, backend cập nhật summary cho product và ghi event analytics cho shop.

### 3.6 Shop analytics và customer insights

Đã thêm event tracking vào `shop_events`:

- `product_view`
- `tryon_started`
- `stylist_product_recommended`
- `product_feedback`

Analytics cho Shop Owner Premium:

- Tổng sản phẩm.
- Published/draft/out of stock.
- Product views.
- Try-on clicks.
- Stylist matches.
- Feedback count.
- Top products theo engagement.
- Conversion đơn giản: `tryOnClicks / productViews`.
- Average rating theo product.

Customer insights cho Shop Owner Premium:

- Gender/body shape/skin tone/style preferences.
- Occasion prompt.
- Budget range.
- Style tags/colors.
- Ratings.
- Có privacy threshold: nhóm dữ liệu quá nhỏ trả `Not enough data yet`, không lộ userId/email/tên/ảnh cá nhân.

### 3.7 Priority visibility

Đã thêm ưu tiên hiển thị cho Shop Owner Premium:

- Marketplace default sort ưu tiên product của shop premium trước, sau đó theo `updatedAt`.
- Stylist retrieval cộng boost nhẹ cho product thuộc shop premium.
- Boost không bỏ qua filter về shop active, product published, stock, gender, category, budget.

## 4. API mobile cần tích hợp

### 4.1 User auth/me

Mobile nên gọi `/api/users/me` sau login/app start để lấy subscription.

Response user có:

```json
{
  "subscription": {
    "planCode": "FREE",
    "status": "inactive",
    "expiresAt": null,
    "isPremium": false,
    "features": [],
    "usage": {
      "feature": "tryon",
      "period": "2026-07",
      "count": 2,
      "limit": 5,
      "remaining": 3
    }
  }
}
```

Với Premium:

```json
{
  "subscription": {
    "planCode": "USER_PREMIUM_MONTHLY",
    "status": "active",
    "expiresAt": "2026-08-10T00:00:00.000Z",
    "isPremium": true,
    "features": [
      "Không giới hạn số lần thử đồ",
      "Phối đồ theo sự kiện",
      "Tư vấn phong cách AI"
    ],
    "usage": null
  }
}
```

### 4.2 Lấy danh sách plan

```http
GET /api/payments/plans
```

Dùng để hiển thị giá hiện tại. Không hardcode 49k/349k trên mobile ngoài fallback.

### 4.3 Tạo payment user

```http
POST /api/payments/create
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "planCode": "USER_PREMIUM_MONTHLY"
}
```

Response có `checkoutUrl`. Mobile mở PayOS checkout bằng WebView/in-app browser/external browser.

### 4.4 Tạo payment shop owner

```http
POST /api/payments/create
Authorization: Bearer <shop_owner_token>
Content-Type: application/json

{
  "planCode": "SHOP_OWNER_MONTHLY"
}
```

Backend tự nhận account type theo token. User token không được mua shop plan, shop owner token không được mua user plan.

### 4.5 Kiểm tra payment status sau redirect

```http
GET /api/payments/status/:orderCode
```

Sau khi status là `paid`, mobile nên gọi lại `/me` tương ứng để refresh subscription.

### 4.6 Payment profile hiện tại

```http
GET /api/payments/me
Authorization: Bearer <token>
```

Dùng để refresh nhanh plan/subscription sau thanh toán.

### 4.7 Catalog products

```http
GET /api/catalog/products
Authorization: Bearer <user_token_optional>
```

Mobile nên gửi user token nếu có. Nếu user Premium, response có `product.shop`. Nếu Free/anonymous, `product.shop` là `null`.

### 4.8 Catalog product detail

```http
GET /api/catalog/products/:productId
Authorization: Bearer <user_token_optional>
```

Rule hiển thị shop tương tự product list.

### 4.9 Shop detail

```http
GET /api/catalog/shops/:shopId
Authorization: Bearer <user_token>
```

Chỉ User Premium được gọi thành công. User Free/anonymous nhận `403`.

### 4.10 Submit product feedback/rating

```http
POST /api/catalog/products/:productId/feedback
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "rating": 5,
  "fitFeedback": "true_to_size",
  "comment": "Form đẹp, lên dáng tốt",
  "context": "tryon"
}
```

`context` có thể là:

- `product`: feedback từ product detail/modal.
- `tryon`: feedback sau khi tạo try-on thành công.
- `stylist`: feedback từ product được recommend bởi stylist.

### 4.11 Try-on catalog product

```http
POST /api/tryon/catalog
Authorization: Bearer <user_token>
Content-Type: multipart/form-data
```

Gửi:

- `productId`
- `modelImage` nếu user upload ảnh mới

Nếu user Free hết lượt, backend trả `403` với `subscriptionRequired: true`. Mobile hiển thị CTA nâng cấp Premium.

### 4.12 Try-on custom garment

```http
POST /api/tryon/custom
Authorization: Bearer <user_token>
Content-Type: multipart/form-data
```

Gửi:

- `tryOnType`: `dress` hoặc `upper_lower`
- `modelImage`
- `dressImage` hoặc `upperImage`/`lowerImage`

Cũng áp dụng quota Free 5 lượt/tháng.

### 4.13 Poll try-on task

```http
GET /api/tryon/:taskId
```

Khi status `completed` và có `resultUrl`, mobile mới được hiển thị form feedback cho product platform tương ứng.

### 4.14 AI stylist

```http
POST /api/stylist/recommend
Authorization: Bearer <user_token>
```

Yêu cầu User Premium. User Free nhận `403` và mobile nên hiển thị paywall.

### 4.15 Shop analytics

```http
GET /api/shops/me/analytics?range=7d
Authorization: Bearer <shop_owner_token>
```

`range` hỗ trợ:

- `7d`
- `30d`
- `90d`

Chỉ Shop Owner Premium gọi được.

### 4.16 Shop customer insights

```http
GET /api/shops/me/insights?range=30d
Authorization: Bearer <shop_owner_token>
```

Chỉ Shop Owner Premium gọi được. Nếu chưa đủ dữ liệu, response có `enoughData: false`.

## 5. Frontend web đã thay đổi gì

### 5.1 User app

- Hiển thị badge `Free`/`Premium`.
- User Free thấy số lượt còn lại: `remaining/5`.
- Hết quota thì CTA nâng cấp Premium.
- Stylist panel bị paywall nếu chưa Premium.
- Product card/detail chỉ hiện shop name/address nếu backend trả `product.shop`.
- Product modal có form feedback/rating.
- Stylist recommendation card có thể mở product detail để feedback.

### 5.2 Try-On Studio

- Hiển thị quota và CTA Premium.
- Nếu try-on bị chặn do hết quota, hiện nút nâng cấp.
- Chỉ hiện feedback/rating sau khi try-on completed, có `resultUrl`, và kết quả đó thuộc đúng platform product hiện tại.
- Không hiện feedback cho custom upload garment.

### 5.3 Shop dashboard

- Hiển thị trạng thái gói Shop Owner.
- Nếu chưa active, disable create/update/import/upload product.
- Có tabs:
  - Products
  - Analytics
  - Customer Insights
- Analytics/Insights hiện paywall nếu shop owner chưa Premium.
- Analytics có metric feedback và average rating.
- Insights có breakdown ratings.

### 5.4 Payment result page

- Có route success/cancel.
- Đọc `orderCode` từ query.
- Gọi payment status.
- Nếu paid, refresh `/me` và điều hướng về app/dashboard.

## 6. Mobile UX đề xuất

### 6.1 User Free

- Marketplace vẫn xem sản phẩm bình thường.
- Không hiển thị tên shop/địa chỉ shop.
- Hiển thị text kiểu: `Thông tin shop dành cho Premium`.
- Hiển thị quota: `Còn X/5 lượt thử đồ trong tháng`.
- Nếu hết lượt, disable hoặc chặn nút Try-on và mở CTA nâng cấp.
- Stylist screen hiển thị paywall.

### 6.2 User Premium

- Hiển thị tên shop và địa chỉ/liên hệ sản phẩm.
- Không hiển thị quota 5 lượt.
- Cho dùng try-on không giới hạn.
- Cho dùng stylist.
- Cho feedback/rating sau try-on hoặc trong product detail.

### 6.3 Shop Owner Free

- Vẫn vào dashboard/shop area được.
- Không được create/update/upload/import product.
- Analytics/Insights hiển thị paywall.

### 6.4 Shop Owner Premium

- Được quản lý sản phẩm.
- Xem analytics.
- Xem customer insights tổng hợp ẩn danh.
- Product được boost trong marketplace/stylist retrieval.

## 7. Lưu ý bảo mật và dữ liệu

- Mobile không nên lưu cache lâu trạng thái Premium. Sau payment hoặc app foreground nên refresh `/me`.
- Không expose dữ liệu cá nhân user cho shop owner.
- Customer insights chỉ là thống kê ẩn danh.
- Không nhận amount từ mobile khi tạo payment; backend tự lấy giá plan.
- Nếu PayOS redirect về mobile deep link sau này, cần cập nhật `PAYMENT_RETURN_URL` và `PAYMENT_CANCEL_URL` tương ứng trong backend env.

## 8. Checklist cho mobile

- Lưu user token và shop owner token tách biệt nếu app có cả hai mode.
- Gửi Authorization cho catalog API nếu user đã login, kể cả endpoint public, để backend biết có được trả shop info hay không.
- Gọi `/api/payments/plans` để lấy giá hiện tại.
- Gọi `/me` sau login, sau payment success, sau try-on thành công.
- Render `subscription.isPremium` thay vì tự tính theo plan code phía client.
- Với product, kiểm tra `product.shop` trước khi render shop name/address.
- Chỉ mở feedback form sau khi try-on task completed và product là platform product.
- Với feedback, luôn gửi `rating` dạng number từ 1 đến 5.
- Với shop analytics/insights, xử lý `403` bằng paywall nâng cấp gói Shop Owner.
