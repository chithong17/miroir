# Stylist: đa dạng sản phẩm và outfit

## Thay đổi

- Lấy chủ shop active có gói Growth hoặc gói cũ tương đương còn hiệu lực, không bị đình chỉ; lấy shop active của các chủ shop đó.
- Đưa `shopId` vào bộ lọc vector trước giới hạn tìm kiếm. Lấy tối đa 120 ứng viên rồi chọn 30 sản phẩm, dành chỗ cho áo/quần/váy và giảm việc một shop chiếm toàn bộ ngữ cảnh. AI nhận tối đa 30 sản phẩm.
- Giữ điều kiện giới tính, giá, availability, trạng thái đăng bán và biến thể còn hàng. Nếu vector ít kết quả, thiếu nhóm đồ chính hoặc index đang cập nhật, bổ sung từ catalog đủ điều kiện. Không dùng sản phẩm từ shop ngoài danh sách hợp lệ.
- Gộp gợi ý AI với các tổ hợp catalog làm nguồn dự phòng. Chỉ trả bộ có áo + quần/váy hoặc một váy/set hoàn chỉnh. Set có cả áo và phần thân dưới được tính là một bộ hoàn chỉnh.
- Set cardigan + áo hai dây chiếm vị trí áo chính, không phải áo khoác phụ để cộng vào sơ mi + quần. Không nhận bộ có hai nhóm áo chính hoặc món không rõ vai trò.
- Nhánh catalog mặc định ghép áo + quần/váy, hoặc dùng riêng set hoàn chỉnh. Chỉ tự thêm áo khoác khi yêu cầu có nhắc đến khoác/layering/thời tiết lạnh.
- Ưu tiên bộ AI đã vượt qua kiểm tra cấu trúc/ngân sách; không ép đổi sang tổ hợp catalog chỉ để tăng số shop khác nhau.
- Mỗi món chính chỉ xuất hiện một lần trong các outfit trả về. Ảnh sản phẩm giống nhau dưới ID khác nhau cũng không vượt qua kiểm tra này. Lớp khoác/phụ kiện có thể được tái sử dụng.
- Không ghép giới tính male/female trong cùng bộ khi catalog có thông tin giới tính. Không tự suy ra giới tính cho sản phẩm để trống hoặc unisex.
- Tổng giá outfit phải nằm trong ngân sách được gửi lên. Thiếu lựa chọn hợp lệ thì trả ít outfit hơn, không cố đủ 5 bộ. Không đủ bộ hoàn chỉnh sẽ có thông báo `noMatch`.

## Vector index

Index sản phẩm cần trường `{ "type": "filter", "path": "shopId" }`. Script giữ nguyên các trường, số chiều vector và cấu hình hiện có; chỉ bổ sung bộ lọc còn thiếu.

Chạy trong `backend`, dùng cấu hình MongoDB đúng môi trường:

```powershell
npm run index:stylist:dry
npm run index:stylist
```

Atlas cập nhật index bất đồng bộ. Chờ index `READY` và queryable. Có thể chạy lại script, trường đã tồn tại sẽ không được thêm trùng.

Ngày 28/10/2026, index online `products_embedding_index` đã được bổ sung `shopId` và xác nhận `READY`. Cấu hình trước thay đổi được lưu cục bộ tại `outputs/stylist-vector-index-before.json`. Không đổi sản phẩm, tồn kho, gói đăng ký hoặc tạo lại embedding.

## Deploy và kiểm tra

Tính năng này cần deploy **backend**. Không cần sửa frontend hoặc app mobile.

```powershell
node --test tests/stylistDiversity.unit.test.js tests/stylistFallback.unit.test.js tests/geminiRetry.unit.test.js
```

Kiểm thử service với DB online: lấy 30 sản phẩm từ 3 shop đủ điều kiện cho yêu cầu “đi sinh nhật”, thay vì 4 sản phẩm của một shop. Số outfit thực tế phụ thuộc catalog, giới tính và ngân sách. Các lần kiểm tra service không gọi `trackShopEvents`, tránh cộng hoạt động thử vào analytics.
