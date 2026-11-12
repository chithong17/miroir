# Kế hoạch tính năng Doanh thu Admin từ các gói Shop

## 1. Mục tiêu

Xây dựng một khu vực **Doanh thu** trong Admin Dashboard để admin theo dõi tiền thực thu từ shop, bao gồm:

- Phí mua và gia hạn từng gói `STARTER_A`, `STARTER_B`, `GROWTH`.
- Phí Try-On vượt hạn mức.
- Hoa hồng trên đơn hàng của gói có commission.
- Tổng hợp theo thời gian, theo gói và theo từng shop.
- Danh sách giao dịch chi tiết để đối soát PayOS.

Phiên bản đầu dùng nguyên tắc **cash basis**: doanh thu được ghi nhận tại `paidAt` khi hệ thống xác nhận đã thu tiền thành công.

## 2. Nguồn dữ liệu và nguyên tắc chống cộng trùng

### Nguồn sự thật về tiền đã thu

Collection `payment_orders`, với điều kiện:

```js
{
  status: "paid",
  paidAt: { $gte: from, $lt: to },
  amount: { $gt: 0 }
}
```

Sử dụng `payment_orders.amount` thực tế đã thanh toán, không dùng giá hiện tại trong `payment_plans`, vì giao dịch có thể đã áp dụng prorate hoặc credit.

### Phân loại doanh thu

- `invoiceId == null` và có `planCode`: doanh thu bán/gia hạn gói.
- Có `invoiceId`: doanh thu phí phát sinh.
  - Đọc snapshot `billing_invoices.entries` để tách `tryon_overage` và `commission`.
- `grantType` là `trial` hoặc `admin_grant`, hoặc `amount == 0`: không tính doanh thu, nhưng có thể hiển thị trong thống kê gói được cấp miễn phí.

### Không được cộng trực tiếp

- Không cộng `billing_cycles.amountPaid`: đây là snapshot chu kỳ, có thể trùng với `payment_orders`.
- Không cộng toàn bộ `billing_invoices.amount`: invoice chưa chắc đã thanh toán.
- Không cộng `billing_entries` độc lập: entry có thể chưa được lập hóa đơn hoặc chưa thu tiền.

### Chỉ số công nợ

`billing_invoices` vẫn là nguồn để tính:

- Công nợ chưa thu: `status in ["unpaid", "overdue"]`.
- Nợ quá hạn: `status == "overdue"`.
- Phí đã phát sinh nhưng chưa xuất hóa đơn: tổng `billing_entries.amount` có `invoiceId: null`.

Các chỉ số này không được cộng vào doanh thu thực thu.

## 3. Chỉ số nghiệp vụ

### KPI tổng quan

- `grossCollected`: tổng tiền thực thu trong kỳ.
- `planRevenue`: tiền mua/gia hạn gói.
- `overageRevenue`: phí Try-On vượt hạn mức đã thu.
- `commissionRevenue`: hoa hồng đơn hàng đã thu.
- `paidTransactions`: số giao dịch thanh toán thành công.
- `payingShops`: số owner/shop có giao dịch trả tiền khác nhau.
- `averageRevenuePerPayingShop`: `grossCollected / payingShops`.
- `outstandingAmount`: tổng invoice chưa thanh toán và quá hạn.
- `overdueAmount`: tổng invoice quá hạn.

### KPI theo từng gói

Mỗi gói trả về:

- `planCode`, `planName`.
- `revenue`: số tiền thực thu của gói.
- `transactions`: số giao dịch trả phí.
- `newSubscriptions`: mua gói khi trước đó chưa có cycle trả phí.
- `renewals`: giao dịch gia hạn cùng gói.
- `upgradesOrChanges`: giao dịch đổi gói.
- `activeShops`: số shop đang active ở gói đó tại thời điểm truy vấn.
- `grantedSubscriptions`: số lượt admin cấp miễn phí, không tính vào revenue.
- `share`: tỷ trọng doanh thu gói trên tổng plan revenue.

V1 có thể phân loại `newSubscriptions/renewals/upgradesOrChanges` dựa trên `previousCycleId`, `renewalScheduled` và plan của cycle trước. Nếu dữ liệu lịch sử thiếu, trả `unknown` thay vì suy đoán sai.

## 4. Backend

### Service mới

Tạo `backend/services/adminRevenue.service.js` gồm:

- `parseRevenueRange(query)`.
- `getAdminRevenueOverview({ from, to, timezone })`.
- `getAdminRevenueByPlan({ from, to })`.
- `listAdminRevenueTransactions(filters)`.
- `getAdminShopRevenueDetail({ ownerId, from, to })`.
- `exportAdminRevenueCsv(filters)`.

Mặc định timezone báo cáo là `Asia/Ho_Chi_Minh`; lưu và lọc bằng UTC, chỉ quy đổi timezone khi xác định đầu/cuối ngày và khi hiển thị.

### API đề xuất

```text
GET /api/admin/revenue/overview
GET /api/admin/revenue/plans
GET /api/admin/revenue/transactions
GET /api/admin/revenue/shops/:ownerId
GET /api/admin/revenue/export.csv
```

Query dùng chung:

```text
from=2026-11-01
to=2026-11-30
planCode=GROWTH
type=plan|tryon_overage|commission
status=paid|unpaid|overdue
search=shop-name-or-email
page=1
limit=20
```

### Response overview

```json
{
  "success": true,
  "range": {
    "from": "2026-11-01T00:00:00+07:00",
    "to": "2026-12-01T00:00:00+07:00",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  "summary": {
    "grossCollected": 0,
    "planRevenue": 0,
    "overageRevenue": 0,
    "commissionRevenue": 0,
    "paidTransactions": 0,
    "payingShops": 0,
    "averageRevenuePerPayingShop": 0,
    "outstandingAmount": 0,
    "overdueAmount": 0
  },
  "timeSeries": [
    {
      "date": "2026-11-01",
      "planRevenue": 0,
      "overageRevenue": 0,
      "commissionRevenue": 0,
      "total": 0
    }
  ]
}
```

### Response giao dịch

Mỗi dòng cần có:

- `paymentOrderId`, `orderCode`.
- `paidAt`, `amount`, `status`.
- `revenueType`.
- `planCode` và plan snapshot tại thời điểm mua.
- `ownerId`, owner name/email.
- `shopId`, shop name.
- `invoiceId` nếu là phí phát sinh.
- Chi tiết entry: commission hoặc Try-On overage.
- `grantType`, `renewalScheduled`, `cycleId` để đối soát.

Không trả `paymentRaw`, webhook raw hoặc dữ liệu nhạy cảm ra frontend.

### Index MongoDB cần bổ sung

```js
payment_orders: { status: 1, paidAt: -1 }
payment_orders: { planCode: 1, status: 1, paidAt: -1 }
payment_orders: { accountId: 1, status: 1, paidAt: -1 }
billing_invoices: { ownerId: 1, status: 1, paidAt: -1 }
shops: { ownerId: 1 }
```

## 5. Admin Dashboard

### Navigation

Thêm mục **Doanh thu** riêng trong `AdminShell`, không nhét vào màn hình chỉnh sửa gói.

### Bố cục màn hình

1. Bộ lọc đầu trang:
   - Hôm nay, 7 ngày, 30 ngày, tháng này, tùy chỉnh.
   - Gói dịch vụ.
   - Loại doanh thu.
   - Shop hoặc email owner.

2. KPI cards:
   - Tổng thực thu.
   - Doanh thu gói.
   - Phí phát sinh đã thu.
   - Công nợ chưa thu.

3. Biểu đồ:
   - Line/stacked bar doanh thu theo ngày.
   - Bar chart doanh thu theo gói.

4. Bảng theo gói:
   - Gói, doanh thu, giao dịch, shop trả phí, tỷ trọng, active shop.
   - Click một gói để lọc bảng giao dịch.

5. Bảng giao dịch:
   - Thời gian, shop, gói/loại phí, mã thanh toán, số tiền, trạng thái.
   - Click dòng để mở drawer chi tiết.

6. Khu vực công nợ:
   - Invoice chưa trả/quá hạn.
   - Owner/shop, hạn thanh toán, breakdown commission/overage.

7. Nút xuất CSV theo đúng bộ lọc hiện tại.

### Trạng thái UI bắt buộc

- Loading skeleton.
- Empty state khi chưa có giao dịch.
- Error state có nút tải lại.
- Dữ liệu một phần khi overview tải được nhưng transactions lỗi.
- Responsive cho tablet/mobile admin.

## 6. Quy tắc tính toán quan trọng

- Khoảng ngày dùng `[from, toExclusive)` để tránh trùng giao dịch lúc 00:00.
- Tiền lưu dưới dạng integer VND, không dùng số thực.
- Giao dịch `pending`, `failed`, `cancelled` không tính doanh thu.
- Giao dịch admin cấp miễn phí không tính doanh thu.
- Giá gói thay đổi sau này không làm thay đổi lịch sử; dùng `planSnapshot` và `payment_orders.amount`.
- Phí invoice đã thanh toán chỉ tính một lần từ payment order có `invoiceId`.
- Phần credit/proration: doanh thu là số tiền thực trả, không phải giá niêm yết.
- Nếu bổ sung refund, lưu `refundedAmount`, `refundedAt`; net revenue bằng `amount - refundedAmount`.

## 7. Kiểm thử

### Unit test

- Chỉ `paid` mới được tính.
- Admin grant/trial giá 0 không được tính.
- Một payment order invoice không bị cộng hai lần.
- Đúng breakdown commission và Try-On overage.
- Prorate/credit dùng số tiền thực trả.
- Ranh giới ngày theo `Asia/Ho_Chi_Minh`.
- Legacy plan được normalize về `GROWTH` nhưng vẫn giữ snapshot lịch sử.

### Integration test

- PayOS webhook paid làm overview tăng đúng một lần.
- Webhook gọi lặp không làm doanh thu tăng gấp đôi.
- Thanh toán invoice cập nhật revenue và giảm outstanding.
- Filter theo shop, plan, loại phí và khoảng ngày.
- Pagination ổn định khi nhiều giao dịch cùng thời điểm.

### Frontend test

- Format VND và ngày giờ Việt Nam.
- Bộ lọc cập nhật cả KPI, chart và table.
- Drill-down shop/gói giữ nguyên range.
- CSV phản ánh đúng bộ lọc.

## 8. Lộ trình triển khai

### Giai đoạn 1 — Nền dữ liệu và API

- Thêm index.
- Xây service aggregate doanh thu.
- Thêm overview, plans và transactions API.
- Viết unit/integration test.

### Giai đoạn 2 — UI Admin

- Thêm navigation Doanh thu.
- KPI, biểu đồ, bảng theo gói và giao dịch.
- Filter, pagination, loading/error/empty states.

### Giai đoạn 3 — Chi tiết và đối soát

- Drawer chi tiết giao dịch.
- Trang chi tiết doanh thu từng shop.
- Công nợ và CSV export.

### Giai đoạn 4 — Hoàn thiện tài chính

- Refund/adjustment nếu nghiệp vụ yêu cầu.
- So sánh PayOS settlement với payment order.
- Cảnh báo giao dịch lệch số tiền hoặc webhook thiếu.

## 9. Tiêu chí hoàn thành V1

- Admin xem được tổng tiền thực thu trong một khoảng ngày.
- Phân biệt được doanh thu từng gói và phí phát sinh.
- Drill-down đến từng shop và từng payment order.
- Không cộng trùng payment order, billing cycle và invoice.
- Dữ liệu lịch sử không đổi khi admin sửa giá gói.
- Có kiểm thử webhook idempotency và timezone.
- Có thể xuất CSV để đối soát.

