# Chẩn đoán Try-On — 28/10/2026

## Đã xác nhận

- Backend đang dùng PiAPI, `model: kling`, `task_type: ai_try_on`, `service_mode: public`.
- Tác vụ `5713d371-042c-45f5-9246-f8fd507bb37f` được tạo thành công lúc 16:36:24, PiAPI bắt đầu xử lý và trả `10000 / Internal error.` lúc 16:42:25 (giờ Việt Nam).
- Tác vụ `6e839dbe-1af1-479b-83ec-df43d46a35e0` được tạo thành công lúc 16:37:42, trả cùng lỗi lúc 16:44:43.
- Cả hai tác vụ có `consume: 0` và log `restored frozen points`. Đây là hoàn điểm cho tác vụ lỗi, không phải thông báo hết số dư.
- Ảnh người của tác vụ đầu: JPEG 387 × 516, tải được HTTP 200. Ảnh áo: JPEG 1200 × 1200, tải được HTTP 200.
- PiAPI không trả chi tiết nguyên nhân nội bộ (`detail: null`). Chưa có bằng chứng để khẳng định ảnh người, ảnh áo hoặc hàng đợi là nguyên nhân gốc.
- `the task does not belong to the current account` là lỗi riêng khi đọc tác vụ thuộc tài khoản API trước khi đổi key.
- `ReferenceError: data is not defined` trong `shopAdvice.service.js` thuộc worker báo cáo shop, tách biệt với hai tác vụ Try-On trên.

## Tái hiện trực tiếp

Tạo tác vụ trực tiếp PiAPI, bỏ qua frontend và backend MIROIR, dùng đúng cặp ảnh của tác vụ lỗi:

- Task ID: `c07a1508-7f2c-4c80-93a7-db5d3b2d387d`.
- Payload: `model_input`, `upper_input`, `batch_size: 1`, không có trường ảnh rỗng.
- API nhận tác vụ. Key thử trên máy thuộc tài khoản khác key server; phép thử này xác minh cấu trúc yêu cầu và cặp ảnh, không đại diện hoàn toàn cho tài khoản đang deploy.
- Thử bỏ `batch_size` bị API từ chối `Invalid input`; ứng dụng hiện đã gửi `batch_size: 1` nên không cần bỏ trường này.
- Một đối chứng dùng cùng ảnh người và ảnh đầm công khai của sản phẩm từng có lượt thành công, gửi đúng trường `dress_input`: task `920f4548-1824-4728-ad9d-643b0c3affa4`.
- Một phép thử ban đầu gửi ảnh đầm vào `upper_input` không được dùng làm cơ sở kết luận.

### Kết quả cuối

- Phép tái hiện đúng cặp ảnh lỗi: PiAPI trả `10000 / Internal error.` lúc 16:53:14, sau khoảng 8 phút 21 giây.
- Đối chứng gửi đúng `dress_input`: PiAPI trả cùng lỗi lúc 16:52:21, sau khoảng 6 phút 20 giây.
- Cả hai đều có `consume: 0` và `restored frozen points`.
- Đã tái hiện lỗi ngoài ứng dụng MIROIR, trên tài khoản API khác, và với hai ảnh trang phục khác nhau. Lỗi không chỉ do giao diện MIROIR hoặc key hiện tại trên Render.
- Hai phép thử vẫn dùng cùng ảnh người; chưa thể loại trừ hoàn toàn vấn đề xử lý ảnh người đó. Không có cơ sở khẳng định cả dịch vụ đang sập hoặc toàn bộ ảnh đầu vào đều sẽ thất bại.

## Đã sửa trong ứng dụng

- Khi lấy trạng thái gặp lỗi mạng, HTTP 408/429/5xx: giữ tác vụ đang chạy, kiểm tra lại với thời gian chờ tăng dần từ 5 đến tối đa 30 giây.
- Không tự tạo lại tác vụ sinh ảnh, tránh phát sinh lượt tính phí trùng.
- Lỗi tác vụ thuộc tài khoản API cũ trả HTTP 409 và hướng dẫn tạo lượt mới, thay vì HTTP 500 chung chung.
- Lỗi nội bộ PiAPI có thông báo tiếng Việt kèm mã 10000; giữ task ID và mã lỗi để đối chiếu.
- Log trạng thái lỗi có task ID, không ghi đoạn API key hoặc URL ảnh đầu vào trong service PiAPI.

## Cách xử lý phần còn lại

1. Deploy cả backend và frontend để áp dụng xử lý lỗi mới.
2. Với tác vụ cũ sau đổi tài khoản API, đóng thông báo rồi tạo lượt mới.
3. Với lỗi xử lý `10000`, gửi task ID và thời gian trên cho hỗ trợ PiAPI để họ tra log xử lý nội bộ. Không gửi API key.
4. Nếu PiAPI xác nhận lỗi dịch vụ kéo dài, cần đổi tuyến xử lý hoặc tích hợp nhà cung cấp Try-On khác; đổi key cùng dịch vụ không đảm bảo giải quyết được lỗi.

Tài liệu đối chiếu: https://piapi.ai/docs/kling-api/virtual-try-on-api

## Kiểm tra code

- 3 kiểm thử phân loại lỗi backend đạt.
- 2 kiểm thử retry/backoff frontend đạt.
- Build frontend và kiểm tra cú pháp controller/service backend đạt.

## Bản sửa và kiểm thử bổ sung

- Sửa `getProStrategyReport`: dữ liệu nguồn được tạo trước hai nhánh báo cáo demo/AI, tránh `ReferenceError: data is not defined` khi lưu báo cáo.
- Worker đối soát đóng theo dõi tác vụ khi nhận `TRYON_ACCOUNT_CHANGED`, lưu lý do và không phát sinh khoản tính phí. Lỗi mạng, 401, 429, 5xx vẫn giữ tác vụ để đối soát lại.
- Lưu mã và thông báo lỗi xử lý PiAPI vào tác vụ đối soát thất bại.
- 11 kiểm thử liên quan đạt, gồm 6 kiểm thử hồi quy mới cho báo cáo và đối soát. Build frontend thành công.
- Toàn bộ backend: 88/90 đạt. Hai lỗi ngoài thay đổi: kiểm thử commerce kỳ vọng phiên bản địa chỉ `NSO-2026-08-05` trong khi dữ liệu là `OPENAPI-2026-10-07`; kiểm thử shopPlans import `requireProShopSubscription` không được middleware export.
- Đã truy vấn trực tiếp task trong log Render `649e9928-2aff-4d5e-a3b0-9979033d6a65` bằng key cấu hình local: PiAPI trả HTTP 400 `the task does not belong to the current account`. Chưa đọc được trạng thái cuối bằng key local; không coi đây là bằng chứng task đó thất bại khi được đọc bằng key trên Render.
- Chưa deploy bản sửa, chưa xác nhận một lượt sinh ảnh mới thành công. Bản sửa xử lý lỗi ứng dụng không đảm bảo khắc phục lỗi nội bộ `10000` của nhà cung cấp.
