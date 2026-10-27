# Địa chỉ sau sáp nhập trên web MIROIR

## Hành vi

- Web dùng tỉnh/thành và phường/xã mới. API `/locations/...` cũ vẫn giữ nguyên; API mới nằm dưới `/locations/v2/...`.
- Request lưu địa chỉ mới gửi `addressVersion: "v2"`. Backend xác thực mã tỉnh/phường từ snapshot cục bộ, không tin tên do trình duyệt gửi.
- Địa chỉ cũ được đối chiếu khi web đọc danh sách với `addressVersion=v2`. Chỉ tự chuyển trường hợp cả phường cũ chuyển về một phường mới; trường hợp chia một phần hoặc không tìm được mã thì yêu cầu khách xác nhận bằng cách sửa trong sổ địa chỉ. Bước đọc này không ghi database.
- Đơn cũ không bị sửa. Đơn mới lưu địa chỉ hành chính và thông tin khu vực vận chuyển riêng.
- Shop chưa bật GHN/GHTK giữ chính sách 10.000đ; trên 500.000đ tiền hàng sau giảm giá, riêng mỗi shop, được miễn phí. Không bắt buộc khu vực cũ cho loại giao này.
- Với GHN/GHTK, phường mới có nhiều khu vực nguồn sẽ có thêm lựa chọn “Khu vực giao hàng (địa chỉ cũ)”. Dùng cùng địa bàn đã xác nhận để báo phí và tạo vận đơn, không tự chọn khu vực đầu tiên. Web cấu hình shop có thêm địa chỉ lấy hàng và số điện thoại.
- API tạo đơn kiểm tra lại báo phí của hãng theo địa chỉ thật và tiền hàng ở server. Phí thay đổi thì yêu cầu tải lại checkout.
- GHTK không còn trả phí hoặc mã vận đơn giả khi API thất bại, kể cả sandbox.

## Nguồn dữ liệu và giới hạn

- Danh mục hai cấp: https://provinces.open-api.vn/api/v2/?depth=2 — snapshot `OPENAPI-V2-2026-10-27`, 34 tỉnh/thành, 3.321 phường/xã.
- Bảng đối chiếu: https://github.com/sunshine-tech/VietnamProvinces, gói `vietnam-provinces` phiên bản `2026.9.0`, file `_ward_conversion_2025.py`. Metadata và SHA-256 có trong `backend/data/vn-ward-conversion.json`. Dữ liệu đối chiếu được trích từ bảng literal bằng AST, không chạy mã tải về. Nguồn khai báo GPL-3.0-or-later: https://www.gnu.org/licenses/gpl-3.0.html; giữ metadata nguồn khi phân phối bảng dữ liệu này.
- Bảng đối chiếu có 10 mã cũ không tồn tại trong snapshot cũ đang có của dự án. Các mã đó không được suy đoán; địa chỉ liên quan sẽ yêu cầu xác nhận. Một số phường mới có thể chưa có đối chiếu carrier sử dụng được.
- GHN có API tạo đơn hai cấp mới, nhưng tài liệu báo phí hiện yêu cầu mã quận/huyện và phường cũ. Bản này dùng cầu nối địa bàn cũ nhất quán cho cả báo phí và tạo vận đơn.
- API địa chỉ cũ vẫn đọc được dữ liệu cũ. Mobile không được sửa; cần kiểm thử riêng trước khi dùng mobile để chỉnh sửa các địa chỉ v2 được tạo trên web.

Tài liệu hãng đã kiểm tra:

- https://developer.ghn.vn/vi/docs/order/calculate-fee
- https://developer.ghn.vn/vi/docs/order/create
- https://developer.ghn.vn/vi/docs/master-data/get-ward-new
- https://api.ghtk.vn/docs/submit-order/calculate-shipping-fee/
- https://api.ghtk.vn/docs/submit-order/submit-order-express/

## Chuyển đổi địa chỉ đã lưu (tùy chọn)

Chạy tại thư mục `backend`, với cấu hình database của môi trường cần thao tác:

```sh
# Chỉ xem trước, không ghi database
node scripts/migrateAddressesV2.js

# Chuyển những địa chỉ đối chiếu chắc chắn; lưu nguyên bản trong MongoDB
node scripts/migrateAddressesV2.js --apply

# Xem trước khôi phục
node scripts/migrateAddressesV2.js --rollback

# Khôi phục địa chỉ chưa bị người dùng chỉnh sửa sau chuyển đổi
node scripts/migrateAddressesV2.js --rollback --apply
```

Script không đụng đến collection orders. Địa chỉ không rõ không được chuyển hàng loạt. Khi khôi phục, script không ghi đè chỉnh sửa mới hơn của người dùng. Bản triển khai này chưa chạy chuyển đổi lên database thật.

## Cập nhật snapshot

Tại thư mục gốc repository:

```sh
python backend/scripts/syncVietnamLocationsV2.py
```

Script kiểm tra số tỉnh/phường, mã trùng và checksum gói đối chiếu trước khi ghi. Không ghi đè `vn-admin-units.json` cũ. Nếu nguồn thay đổi cơ cấu hoặc phiên bản, cần xem xét và kiểm thử lại trước khi đổi các điều kiện kiểm tra.

## Triển khai

1. Deploy backend trước, kiểm tra các API v1 vẫn chạy và v2 trả danh mục đúng.
2. Deploy frontend. Shop bật hãng vận chuyển cần xác nhận địa chỉ lấy hàng, khu vực cũ và điện thoại trong cấu hình vận chuyển.
3. Kiểm thử bằng tài khoản sandbox của từng shop: địa chỉ sau sáp nhập, địa chỉ cũ, địa chỉ cần xác nhận; báo phí và tạo vận đơn phải cùng khu vực.
4. Thử giỏ nhiều shop, mua ngay, ưu đãi 40%, mặc định 10k và mốc 500k.
5. Chỉ chạy migration `--apply` sau khi đã xem kết quả dry-run. Có thể vận hành mà chưa chạy apply vì web có lớp đối chiếu khi đọc.

Rollback frontend có thể đưa biểu mẫu về bản cũ; backend nên giữ hỗ trợ v2 để không làm hỏng các địa chỉ mới đã phát sinh. Không rollback bằng cách xóa danh mục hoặc đổi nội dung đơn cũ.
