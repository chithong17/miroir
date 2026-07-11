# Plan: Triển Khai Payment PayOS Cho Backend Và Frontend MIROIR

## Summary
- Backend Node/Express là nguồn sự thật cho plan, payment status, quota.
- Frontend chỉ gọi API để tạo payment link, redirect sang PayOS, rồi refresh trạng thái sau success/cancel.
- Plan:
  - User free: 5 lần try-on/tháng.
  - User premium: 49.000đ/30 ngày, không giới hạn try-on, dùng stylist AI/phối đồ theo sự kiện.
  - Shop owner: 349.000đ/30 ngày, được đăng sản phẩm, tiếp cận user MIROIR, dashboard phân tích, ưu tiên hiển thị, insight khách hàng.

## Backend Changes
- Cài dependency `@payos/node` trong `backend`.
- Thêm env vào `.env.example`:
  - `PAYOS_CLIENT_ID`
  - `PAYOS_API_KEY`
  - `PAYOS_CHECKSUM_KEY`
  - `PAYMENT_RETURN_URL=http://localhost:5173/payment/success`
  - `PAYMENT_CANCEL_URL=http://localhost:5173/payment/cancel`
- Thêm service payment mới:
  - Khởi tạo PayOS client.
  - Định nghĩa plan cố định trong backend:
    - `USER_PREMIUM_MONTHLY`: `49000`, accountType `user`, duration 30 ngày.
    - `SHOP_OWNER_MONTHLY`: `349000`, accountType `shop_owner`, duration 30 ngày.
  - `createPaymentLink`: tạo `orderCode`, lưu `payment_orders`, gọi PayOS tạo checkout URL.
  - `handleWebhook`: verify webhook, mark order paid, active/cộng hạn subscription.
  - `getCurrentPlan`: tính plan hiện tại dựa trên `subscription.expiresAt > now`.
- Thêm routes:
  - `POST /api/payments/create`
  - `POST /api/payments/payos-webhook`
  - `GET /api/payments/status/:orderCode`
  - `GET /api/payments/me`
- Auth cho `/api/payments/create` hỗ trợ cả user token và shop owner token:
  - Nếu token user thì chỉ được mua `USER_PREMIUM_MONTHLY`.
  - Nếu token shop owner thì chỉ được mua `SHOP_OWNER_MONTHLY`.
- Thêm field `subscription` vào public response của user/shop owner:
  - `planCode`
  - `status`
  - `expiresAt`
  - `features`
- Thêm quota user free:
  - Collection `usage_counters` với `accountId`, `feature: "tryon"`, `period: "YYYY-MM"`, `count`.
  - User free được tối đa 5 try-on/tháng.
  - Chỉ tăng quota sau khi tạo PiAPI task thành công.
- Gate backend:
  - `/api/tryon/catalog` và `/api/tryon/custom`: user premium không giới hạn, user free tối đa 5/tháng.
  - `/api/stylist/recommend`: yêu cầu user premium.
  - `/api/shop-products` create/update/upload/import: yêu cầu shop owner subscription active.
  - Các route đọc/list vẫn cho vào để user thấy paywall và dữ liệu hiện có.

## Frontend Changes
- Thêm API helpers:
  - Trong `userApi.js`: `createUserPayment`, `getUserPaymentMe`, `getPaymentStatus`.
  - Trong `shopApi.js`: `createShopPayment`, `getShopPaymentMe`.
- Thêm route trong `App.jsx`:
  - `/payment/success`
  - `/payment/cancel`
- Thêm page/component payment result:
  - Đọc `orderCode` từ query PayOS redirect.
  - Gọi `/api/payments/status/:orderCode`.
  - Nếu paid, refresh `/me`, rồi điều hướng về `/app` hoặc `/shop/dashboard`.
- User UI:
  - Hiển thị badge `Free` hoặc `Premium`.
  - Free: hiển thị `Còn X/5 lần thử đồ trong tháng`.
  - Hết quota: nút Try on mở CTA thanh toán 49.000đ/tháng.
  - Stylist panel nếu chưa premium thì hiển thị paywall thay vì form generate.
- Shop owner UI:
  - Dashboard hiển thị trạng thái gói 349.000đ/tháng.
  - Nếu chưa active/hết hạn, disable nút tạo/sửa/import/upload product.
  - CTA thanh toán redirect sang PayOS checkout URL.
- Nội dung benefit dùng đúng yêu cầu:
  - Shop: “Đăng sản phẩm lên nền tảng, tiếp cận user MIROIR, dashboard phân tích, ưu tiên hiển thị, truy cập insight khách hàng”.
  - User: “Không giới hạn số lần thử đồ, phối đồ theo sự kiện, tư vấn phong cách AI”.

## Test Plan
- Backend:
  - User free try-on lần 1-5 thành công, lần 6 trả `403`.
  - User free sang tháng mới quota reset.
  - User premium không bị quota 5 lần.
  - User free gọi stylist bị chặn.
  - Shop owner chưa active bị chặn create/import/upload/update product.
  - Webhook PayOS paid active đúng 30 ngày.
  - Webhook gửi lại không cộng hạn lần hai.
- Frontend:
  - User free thấy quota còn lại.
  - Hết quota thấy CTA nâng cấp.
  - Shop owner chưa thanh toán thấy paywall trong dashboard.
  - Success page refresh đúng plan sau khi payment paid.
- Build:
  - Chạy backend syntax/startup check.
  - Chạy `npm run build` trong frontend.

## Assumptions
- Không dùng code Java trong folder `payos`; chỉ tham khảo flow.
- V1 dùng payment link trả từng tháng, mỗi lần paid cộng/kích hoạt 30 ngày.
- Backend không nhận amount từ frontend để tránh sửa giá.
- Frontend không tự quyết định premium/free, chỉ render theo dữ liệu backend trả về.
