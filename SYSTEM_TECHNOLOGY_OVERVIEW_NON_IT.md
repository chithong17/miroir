# MIROIR - Giải thích công nghệ trong dự án cho người không chuyên IT

Tài liệu này giải thích các công nghệ, dịch vụ bên thứ ba và cách chúng hoạt động trong dự án MIROIR bằng ngôn ngữ dễ hiểu. Mục tiêu là giúp người không biết lập trình vẫn nắm được hệ thống gồm những phần nào, mỗi phần có tác dụng gì và chúng phối hợp với nhau ra sao.

## 1. MIROIR là hệ thống gì?

MIROIR là một nền tảng thời trang có AI, gồm website, mobile app và backend. Người dùng có thể xem sản phẩm thời trang, thử đồ bằng AI, nhận gợi ý phối đồ từ AI Stylist, lưu sản phẩm yêu thích và nâng cấp Premium. Chủ shop có thể đăng sản phẩm, quản lý cửa hàng, nhập sản phẩm bằng Excel và xem thống kê. Admin có thể quản lý shop, chủ shop, sản phẩm và gói thanh toán.

Có thể hình dung MIROIR như một trung tâm thương mại số:

- Người dùng là khách đi xem và thử đồ.
- Shop owner là cửa hàng đưa sản phẩm lên hệ thống.
- Admin là ban quản lý trung tâm.
- AI là trợ lý giúp thử đồ và tư vấn phối đồ.
- Backend là khu vực vận hành phía sau, nơi xử lý dữ liệu và kết nối các dịch vụ.

## 2. Bức tranh tổng thể của hệ thống

Dự án có 3 phần chính:

| Phần | Công nghệ chính | Vai trò |
| --- | --- | --- |
| Web frontend | React, Vite, Tailwind CSS, Axios | Website người dùng, shop owner và admin thao tác |
| Backend API | Node.js, Express, MongoDB | Xử lý nghiệp vụ, lưu dữ liệu, gọi AI, thanh toán, upload ảnh |
| Mobile app | Flutter, Dart, Dio | Ứng dụng mobile cho user và shop owner |

Các dịch vụ bên thứ ba quan trọng:

| Dịch vụ | Dùng để làm gì |
| --- | --- |
| MongoDB | Lưu dữ liệu hệ thống như user, shop, sản phẩm, thanh toán, analytics |
| Cloudinary | Lưu ảnh người dùng và ảnh sản phẩm |
| PiAPI/Kling Try-on | Tạo ảnh thử đồ bằng AI |
| Google Gemini | Tạo gợi ý phối đồ và tạo embedding để tìm sản phẩm phù hợp |
| PayOS | Tạo link thanh toán và cập nhật trạng thái thanh toán |

## 3. Frontend web là gì?

Frontend web là phần người dùng nhìn thấy và bấm vào trên trình duyệt. Ví dụ: trang đăng nhập, marketplace sản phẩm, trang thử đồ, dashboard shop, dashboard admin.

Dự án dùng các công nghệ chính sau cho frontend:

### React

React là thư viện dùng để xây giao diện website.

Hiểu đơn giản: React giúp chia giao diện thành nhiều “mảnh” nhỏ. Ví dụ:

- Nút đăng nhập là một mảnh.
- Card sản phẩm là một mảnh.
- Form tạo sản phẩm là một mảnh.
- Bảng analytics là một mảnh.

Khi dữ liệu thay đổi, React giúp cập nhật lại đúng phần giao diện cần thay đổi mà không cần tải lại toàn bộ trang.

Ví dụ trong MIROIR:

- Khi user bấm yêu thích sản phẩm, biểu tượng yêu thích đổi trạng thái.
- Khi shop owner chọn khoảng thời gian analytics, số liệu được cập nhật.
- Khi admin chọn một shop, danh sách sản phẩm của shop đó được hiển thị.

### Vite

Vite là công cụ giúp chạy và build frontend.

Hiểu đơn giản: Vite giống như “máy dựng sân khấu” cho website. Khi lập trình viên sửa giao diện, Vite giúp website cập nhật rất nhanh trong lúc phát triển. Khi chuẩn bị đưa lên môi trường thật, Vite đóng gói code thành các file tối ưu hơn để trình duyệt tải nhanh.

### Tailwind CSS

Tailwind CSS là công cụ viết giao diện nhanh bằng các class có sẵn.

Hiểu đơn giản: thay vì tự viết nhiều dòng CSS cho từng nút, từng khung, Tailwind cung cấp các “mảnh style” nhỏ để ghép lại. Nhờ vậy giao diện dễ thống nhất hơn.

Ví dụ:

- Màu nền.
- Khoảng cách.
- Kích thước chữ.
- Bo góc.
- Border.
- Layout dạng lưới.

### Axios

Axios là thư viện giúp frontend gọi backend.

Hiểu đơn giản: khi người dùng bấm nút, frontend cần hỏi backend hoặc gửi dữ liệu cho backend. Axios giống như người đưa thư giữa giao diện và máy chủ.

Ví dụ:

- Người dùng đăng nhập: frontend gửi email/mật khẩu lên backend.
- Shop owner tạo sản phẩm: frontend gửi thông tin sản phẩm lên backend.
- Dashboard shop xem analytics: frontend gọi API lấy số liệu.

## 4. Backend là gì?

Backend là phần chạy phía sau, người dùng không nhìn thấy trực tiếp. Nó chịu trách nhiệm xử lý logic chính của hệ thống.

Backend của MIROIR làm các việc như:

- Đăng ký, đăng nhập.
- Kiểm tra quyền user, shop owner, admin.
- Lưu và đọc dữ liệu từ MongoDB.
- Upload ảnh lên Cloudinary.
- Gọi AI try-on qua PiAPI.
- Gọi Gemini để tạo gợi ý phối đồ.
- Tạo link thanh toán PayOS.
- Tính analytics cho shop.
- Import/export sản phẩm bằng Excel.

### Node.js

Node.js là môi trường để chạy JavaScript ở phía server.

Thông thường JavaScript hay được biết đến là ngôn ngữ chạy trên trình duyệt. Node.js cho phép dùng JavaScript để viết backend. Nhờ đó frontend và backend đều có thể dùng cùng một ngôn ngữ chính.

### Express

Express là framework giúp xây backend API bằng Node.js.

Hiểu đơn giản: Express giúp backend tạo các “cửa tiếp nhận yêu cầu”. Mỗi cửa có một địa chỉ gọi là API endpoint.

Ví dụ:

- `/api/user-auth/login`: đăng nhập user.
- `/api/catalog/products`: lấy danh sách sản phẩm.
- `/api/tryon/catalog`: tạo yêu cầu thử đồ bằng AI.
- `/api/shops/me/analytics`: lấy analytics của shop.

Khi frontend hoặc mobile gọi một endpoint, Express nhận yêu cầu, chuyển cho controller/service xử lý, rồi trả kết quả về.

### API là gì?

API là cách các phần mềm nói chuyện với nhau.

Ví dụ đời thường: khi bạn gọi món ở nhà hàng, bạn không vào bếp tự nấu mà nói với nhân viên phục vụ. Nhân viên chuyển yêu cầu vào bếp, bếp xử lý rồi trả món ra.

Trong MIROIR:

- Frontend/mobile là khách gọi món.
- API là nhân viên nhận yêu cầu.
- Backend service là bếp xử lý.
- Database/dịch vụ AI/thanh toán là kho nguyên liệu hoặc đối tác hỗ trợ.

## 5. MongoDB dùng để làm gì?

MongoDB là cơ sở dữ liệu chính của dự án.

Hiểu đơn giản: MongoDB là nơi lưu trữ dữ liệu lâu dài. Nếu tắt mở lại hệ thống, dữ liệu vẫn còn ở đó.

MIROIR lưu các loại dữ liệu như:

- Tài khoản user.
- Tài khoản shop owner.
- Tài khoản admin.
- Shop.
- Sản phẩm.
- Sản phẩm yêu thích.
- Feedback/rating.
- Gói thanh toán.
- Đơn thanh toán.
- Dữ liệu analytics của shop.
- Embedding phục vụ tìm kiếm AI.

### MongoDB khác gì Excel?

Excel phù hợp với dữ liệu nhỏ, nhập tay, con người mở lên xem trực tiếp.

MongoDB phù hợp với hệ thống phần mềm:

- Nhiều người dùng cùng lúc.
- Dữ liệu thay đổi liên tục.
- Cần tìm kiếm nhanh.
- Backend có thể đọc/ghi tự động.
- Có thể lưu dữ liệu phức tạp như danh sách màu sắc, tag phong cách, thông tin profile.

### Collection là gì?

Trong MongoDB, collection gần giống như một “bảng dữ liệu”.

Ví dụ:

- `users`: lưu user.
- `shops`: lưu shop.
- `products`: lưu sản phẩm.
- `payment_orders`: lưu đơn thanh toán.
- `shop_events`: lưu các event dùng cho analytics.

## 6. Cloudinary dùng để làm gì?

Cloudinary là dịch vụ lưu trữ và quản lý ảnh.

Trong MIROIR, ảnh không nên lưu trực tiếp trong backend vì ảnh thường nặng và cần tải nhanh. Thay vào đó, backend upload ảnh lên Cloudinary, sau đó Cloudinary trả về một đường link ảnh.

MIROIR dùng Cloudinary cho:

- Ảnh sản phẩm.
- Ảnh người dùng/model để thử đồ.
- Ảnh input cho AI try-on.
- Có thể dùng cho logo/cover shop nếu flow upload được hỗ trợ.

Cách hoạt động cơ bản:

1. User hoặc shop owner chọn ảnh trên web/mobile.
2. Frontend/mobile gửi ảnh lên backend.
3. Backend gửi ảnh đó lên Cloudinary.
4. Cloudinary lưu ảnh và trả về URL.
5. Backend lưu URL vào MongoDB.
6. Khi cần hiển thị, web/mobile dùng URL đó để tải ảnh.

Lợi ích:

- Ảnh tải nhanh hơn.
- Backend nhẹ hơn.
- Dễ quản lý ảnh.
- Dễ dùng lại ảnh trong nhiều màn hình.

## 7. PiAPI/Kling Try-on dùng để làm gì?

PiAPI là dịch vụ trung gian để gọi mô hình AI try-on, trong dự án đang dùng cho chức năng thử đồ.

Hiểu đơn giản: user gửi ảnh người mẫu và ảnh quần áo, AI sẽ tạo ra ảnh mới mô phỏng người đó đang mặc món đồ.

Trong MIROIR, flow try-on hoạt động như sau:

1. User chọn sản phẩm hoặc upload ảnh trang phục.
2. User có ảnh model cá nhân hoặc upload ảnh model mới.
3. Backend đưa ảnh lên Cloudinary để có URL.
4. Backend gửi URL ảnh sang PiAPI.
5. PiAPI tạo một “task” xử lý AI và trả về `taskId`.
6. Frontend/mobile cứ vài giây hỏi backend task đã xong chưa.
7. Backend hỏi PiAPI trạng thái task.
8. Khi task hoàn tất, PiAPI trả ảnh kết quả.
9. Frontend/mobile hiển thị ảnh thử đồ cho user.

Tại sao không trả kết quả ngay?

Vì tạo ảnh AI mất thời gian. Hệ thống không thể bắt user đứng chờ một request dài. Vì vậy AI xử lý dạng bất đồng bộ:

- Gửi yêu cầu trước.
- Nhận mã task.
- Kiểm tra trạng thái nhiều lần.
- Khi xong thì lấy kết quả.

## 8. Google Gemini dùng để làm gì?

Gemini là dịch vụ AI của Google. Trong MIROIR, Gemini được dùng cho hai nhóm việc chính:

1. Tạo embedding để hỗ trợ tìm kiếm sản phẩm phù hợp.
2. Tạo gợi ý phối đồ bằng AI Stylist.

### Embedding là gì?

Embedding là cách biến nội dung chữ thành một dạng số để máy tính hiểu mức độ liên quan.

Ví dụ con người đọc câu:

> “Tôi muốn outfit công sở thanh lịch, màu trung tính, ngân sách dưới 1 triệu.”

Con người hiểu câu này liên quan đến blazer, áo sơ mi, quần tây, màu đen/trắng/beige.

Máy tính thì không hiểu nghĩa như con người. Embedding giúp biến câu đó và thông tin sản phẩm thành các dãy số. Sau đó hệ thống so sánh các dãy số để tìm sản phẩm gần nghĩa nhất.

### Vector search là gì?

Vector search là tìm kiếm theo ý nghĩa, không chỉ theo chữ giống nhau.

Ví dụ user nhập “đi hẹn hò nhẹ nhàng”, sản phẩm có thể không ghi đúng chữ “hẹn hò” nhưng có tag “date”, “romantic”, “dress”, “pastel”. Vector search giúp tìm những sản phẩm có ý nghĩa gần với nhu cầu đó.

Trong MIROIR:

- Sản phẩm, outfit và fashion rules được tạo embedding.
- Khi user hỏi AI Stylist, hệ thống cũng tạo embedding cho yêu cầu đó.
- MongoDB tìm các sản phẩm/outfit/rule có embedding gần nhất.
- Sau đó Gemini dùng dữ liệu tìm được để tạo gợi ý phối đồ.

### AI Stylist hoạt động ra sao?

AI Stylist không tự bịa sản phẩm tùy ý. Backend trước tiên lấy các sản phẩm thật trong catalog, sau đó đưa danh sách đó cho Gemini để chọn và giải thích.

Luồng đơn giản:

1. User nhập nhu cầu phối đồ.
2. Backend lấy profile user: giới tính, dáng người, tông da, phong cách yêu thích.
3. Backend tìm sản phẩm phù hợp bằng embedding/vector search.
4. Backend gửi danh sách sản phẩm thật cho Gemini.
5. Gemini tạo outfit, lý do phối đồ, cảnh báo fit, tips thời trang.
6. Backend kiểm tra lại product ID để tránh AI trả sản phẩm không tồn tại.
7. Frontend/mobile hiển thị kết quả.

Điểm quan trọng: AI Stylist dựa trên dữ liệu sản phẩm thật của hệ thống, không chỉ trả lời chung chung.

## 9. PayOS dùng để làm gì?

PayOS là dịch vụ thanh toán.

MIROIR dùng PayOS để bán các gói:

- User Premium.
- Shop Owner Premium.

Cách hoạt động cơ bản:

1. User hoặc shop owner bấm nâng cấp.
2. Frontend/mobile gọi backend để tạo đơn thanh toán.
3. Backend tạo `payment_order` trong MongoDB.
4. Backend gọi PayOS để tạo link thanh toán.
5. User được chuyển sang trang thanh toán của PayOS.
6. Sau khi thanh toán, PayOS thông báo kết quả về backend qua webhook.
7. Backend cập nhật đơn thanh toán thành paid/cancelled/failed.
8. Backend kích hoạt Premium cho tài khoản.
9. User quay lại app và thấy quyền mới.

### Webhook là gì?

Webhook là cách một dịch vụ bên ngoài chủ động báo tin cho hệ thống của mình.

Ví dụ: PayOS giống như ngân hàng. Khi khách trả tiền xong, PayOS gửi thông báo về backend: “đơn này đã thanh toán”. Backend dựa vào đó để mở quyền Premium.

Nếu không có webhook, hệ thống sẽ phải tự hỏi PayOS liên tục, kém hiệu quả hơn.

## 10. Excel/XLSX dùng để làm gì?

Dự án dùng thư viện `xlsx` để đọc và ghi file Excel.

Tính năng liên quan:

- Shop owner tải file mẫu Excel để nhập sản phẩm.
- Shop owner upload file Excel để import nhiều sản phẩm cùng lúc.
- Admin export danh sách sản phẩm ra Excel.
- Admin import sản phẩm bằng Excel.

Tại sao cần Excel?

Với shop có nhiều sản phẩm, nhập từng sản phẩm trên form rất mất thời gian. Excel giúp chuẩn bị dữ liệu hàng loạt nhanh hơn.

Flow import cơ bản:

1. Shop owner/admin tải file mẫu.
2. Điền danh sách sản phẩm vào Excel.
3. Upload file lên hệ thống.
4. Backend đọc từng dòng.
5. Backend kiểm tra lỗi: thiếu tên, giá sai, trạng thái sai, v.v.
6. Dòng hợp lệ được tạo/cập nhật sản phẩm.
7. Dòng lỗi được báo rõ trong kết quả import.

## 11. Đăng nhập và bảo mật dùng công nghệ gì?

Dự án dùng các công nghệ chính:

- `bcryptjs` để mã hóa mật khẩu.
- `jsonwebtoken` để tạo token đăng nhập.
- Middleware để kiểm tra quyền truy cập.

### Mật khẩu được lưu như thế nào?

Hệ thống không nên lưu mật khẩu thật dạng chữ rõ.

Khi user đăng ký:

1. User nhập mật khẩu.
2. Backend dùng `bcryptjs` để biến mật khẩu thành chuỗi hash.
3. Backend lưu chuỗi hash vào MongoDB.

Khi user đăng nhập:

1. User nhập mật khẩu.
2. Backend hash/so sánh mật khẩu nhập vào với chuỗi đã lưu.
3. Nếu khớp, backend cho đăng nhập.

Nhờ vậy, nếu database bị lộ, người khác cũng không đọc được mật khẩu gốc ngay lập tức.

### Token/JWT là gì?

JWT là một loại “vé đăng nhập”.

Sau khi đăng nhập thành công, backend đưa cho frontend/mobile một token. Những lần gọi API sau, frontend/mobile gửi token này kèm theo để chứng minh “tôi là user đã đăng nhập”.

Ví dụ:

- User token dùng cho marketplace, favorite, try-on, AI Stylist.
- Shop owner token dùng cho dashboard shop.
- Admin token dùng cho dashboard admin.

Backend kiểm tra token trước khi cho truy cập các chức năng quan trọng.

## 12. Upload file dùng Multer để làm gì?

Multer là thư viện backend dùng để nhận file upload.

Trong MIROIR, Multer hỗ trợ:

- Upload ảnh model.
- Upload ảnh sản phẩm.
- Upload ảnh trang phục custom.
- Upload file Excel `.xlsx`.

Hiểu đơn giản: khi user chọn file trên máy, frontend/mobile gửi file lên backend. Multer là người nhận file, kiểm tra loại file, rồi chuyển file đó cho bước xử lý tiếp theo.

Ví dụ:

- Nếu là ảnh, backend có thể gửi lên Cloudinary.
- Nếu là Excel, backend dùng `xlsx` để đọc dữ liệu.

## 13. Mobile app dùng công nghệ gì?

Mobile app của MIROIR dùng Flutter và Dart.

### Flutter

Flutter là framework để xây app mobile. Một codebase có thể chạy trên nhiều nền tảng như Android, iOS hoặc web tùy cấu hình.

Trong MIROIR, Flutter dùng để xây:

- Đăng nhập/đăng ký user.
- Onboarding hồ sơ.
- Marketplace.
- Chi tiết sản phẩm.
- Favorite.
- Try-on.
- AI Stylist.
- Account.
- Owner center cho shop owner.
- Thanh toán/paywall.

### Dart

Dart là ngôn ngữ lập trình dùng với Flutter.

Nếu React/Node.js dùng JavaScript thì Flutter dùng Dart.

### Dio

Dio là thư viện mobile dùng để gọi API backend.

Nó có vai trò tương tự Axios ở frontend web.

Ví dụ:

- Mobile gọi `/api/catalog/products` để lấy sản phẩm.
- Mobile gọi `/api/tryon/catalog` để tạo task try-on.
- Mobile gọi `/api/payments/create` để tạo thanh toán.

### image_picker

`image_picker` giúp app mobile chọn ảnh từ máy người dùng.

Ví dụ:

- Chọn ảnh model.
- Chọn ảnh trang phục custom.
- Chọn ảnh sản phẩm khi shop owner đăng sản phẩm.

### shared_preferences

`shared_preferences` giúp mobile lưu dữ liệu nhỏ trên máy người dùng.

Trong MIROIR, nó thường dùng để lưu token đăng nhập. Nhờ đó khi user tắt mở app, app vẫn nhớ trạng thái đăng nhập.

### url_launcher

`url_launcher` giúp mobile mở link bên ngoài.

Ví dụ:

- Mở link thanh toán PayOS trong trình duyệt.
- Mở URL ngoài app nếu cần.

## 14. Biến môi trường `.env` dùng để làm gì?

`.env` là file chứa cấu hình riêng của từng môi trường.

Ví dụ:

- Đường dẫn database.
- API key của Cloudinary.
- API key của PiAPI.
- API key Gemini.
- Cấu hình PayOS.
- JWT secret.
- URL frontend/backend.

Tại sao không viết thẳng vào code?

Vì các giá trị này thường là thông tin nhạy cảm hoặc thay đổi theo môi trường:

- Máy local dùng cấu hình khác production.
- Key thật không nên commit lên Git.
- Khi đổi key, không cần sửa code.

Có thể hiểu `.env` như “tủ chìa khóa” của hệ thống. Code biết cần chìa nào, nhưng chìa thật được cất riêng.

## 15. CORS dùng để làm gì?

CORS là cơ chế bảo vệ trình duyệt khi website gọi API từ domain khác.

Ví dụ:

- Frontend chạy ở `http://localhost:5173`.
- Backend chạy ở `http://localhost:5000`.

Dù đều là local, trình duyệt vẫn xem đây là hai nguồn khác nhau. Backend cần bật CORS để cho phép frontend gọi API.

Nếu cấu hình CORS sai, frontend có thể bị trình duyệt chặn dù backend vẫn chạy.

## 16. Nodemon dùng để làm gì?

Nodemon là công cụ hỗ trợ lập trình backend.

Khi lập trình viên sửa file backend, nodemon tự khởi động lại server. Nếu không có nodemon, mỗi lần sửa code phải tắt server và chạy lại thủ công.

Nodemon chủ yếu dùng trong quá trình phát triển, không phải phần nghiệp vụ cho người dùng cuối.

## 17. Các công nghệ phối hợp trong một luồng cụ thể

### Luồng user đăng nhập

1. User nhập email/mật khẩu trên React web hoặc Flutter mobile.
2. Axios/Dio gửi dữ liệu lên Express backend.
3. Backend tìm user trong MongoDB.
4. Backend dùng bcrypt để kiểm tra mật khẩu.
5. Nếu đúng, backend tạo JWT token.
6. Frontend/mobile lưu token.
7. Những lần sau, token được gửi kèm để chứng minh user đã đăng nhập.

### Luồng user thử đồ AI

1. User chọn sản phẩm hoặc upload ảnh trang phục.
2. Frontend/mobile gửi ảnh và thông tin lên backend.
3. Multer nhận file.
4. Backend upload ảnh lên Cloudinary.
5. Backend gửi URL ảnh sang PiAPI.
6. PiAPI xử lý AI và trả `taskId`.
7. Frontend/mobile hỏi trạng thái task định kỳ.
8. Khi hoàn tất, ảnh kết quả được hiển thị.

### Luồng AI Stylist gợi ý phối đồ

1. User nhập nhu cầu phối đồ.
2. Frontend/mobile gửi yêu cầu lên backend.
3. Backend lấy profile user và dữ liệu sản phẩm từ MongoDB.
4. Gemini tạo embedding cho yêu cầu.
5. MongoDB vector search tìm sản phẩm liên quan.
6. Gemini tạo outfit dựa trên sản phẩm thật.
7. Backend kiểm tra kết quả.
8. Frontend/mobile hiển thị outfit và lý do gợi ý.

### Luồng shop owner import sản phẩm bằng Excel

1. Shop owner tải file mẫu.
2. Shop owner điền dữ liệu sản phẩm.
3. Shop owner upload file Excel.
4. Multer nhận file.
5. Thư viện `xlsx` đọc từng dòng.
6. Backend kiểm tra hợp lệ.
7. Backend lưu/cập nhật sản phẩm trong MongoDB.
8. Dashboard hiển thị kết quả dòng nào thành công, dòng nào lỗi.

### Luồng thanh toán Premium

1. User/shop owner bấm nâng cấp.
2. Frontend/mobile gọi backend.
3. Backend tạo đơn thanh toán trong MongoDB.
4. Backend gọi PayOS để tạo link.
5. User thanh toán trên PayOS.
6. PayOS gửi webhook về backend.
7. Backend cập nhật trạng thái paid.
8. Backend kích hoạt Premium.

## 18. Tóm tắt vai trò từng công nghệ

| Công nghệ/dịch vụ | Hiểu đơn giản là | Dùng trong MIROIR để |
| --- | --- | --- |
| React | Bộ dựng giao diện web | Tạo website user/shop/admin |
| Vite | Công cụ chạy/build web | Chạy web nhanh khi dev và đóng gói khi deploy |
| Tailwind CSS | Bộ style giao diện | Làm giao diện đẹp và nhất quán |
| Axios | Người đưa thư của web | Gọi API backend từ frontend |
| Flutter | Bộ dựng app mobile | Tạo ứng dụng mobile |
| Dart | Ngôn ngữ của Flutter | Viết logic app mobile |
| Dio | Người đưa thư của mobile | Gọi API backend từ mobile |
| Node.js | Môi trường chạy backend | Chạy server bằng JavaScript |
| Express | Khung tạo API | Nhận và xử lý request từ web/mobile |
| MongoDB | Kho dữ liệu | Lưu user, shop, sản phẩm, thanh toán, analytics |
| Cloudinary | Kho ảnh | Lưu ảnh sản phẩm, ảnh model, ảnh upload |
| PiAPI/Kling | AI tạo ảnh thử đồ | Sinh ảnh user mặc sản phẩm |
| Gemini | AI ngôn ngữ/embedding | Gợi ý phối đồ và tìm sản phẩm theo ý nghĩa |
| PayOS | Cổng thanh toán | Tạo link thanh toán và báo trạng thái thanh toán |
| bcryptjs | Công cụ bảo vệ mật khẩu | Hash và kiểm tra mật khẩu |
| JWT | Vé đăng nhập | Giữ phiên đăng nhập và phân quyền |
| Multer | Bộ nhận file upload | Nhận ảnh và Excel từ web/mobile |
| xlsx | Bộ đọc/ghi Excel | Import/export sản phẩm |
| dotenv | Bộ đọc cấu hình `.env` | Tách key/cấu hình khỏi code |
| CORS | Cổng cho phép web gọi API | Cho frontend gọi backend an toàn |
| Nodemon | Tự restart backend khi dev | Tiện cho lập trình viên |

## 19. Những điểm nên nhấn mạnh khi giải thích dự án

- MIROIR không chỉ là app thử đồ, mà là một hệ sinh thái gồm user, shop owner và admin.
- AI try-on và AI Stylist là hai chức năng AI khác nhau:
  - Try-on tạo ảnh mặc đồ.
  - Stylist tư vấn phối đồ dựa trên sản phẩm thật.
- Backend là trung tâm điều phối: nhận yêu cầu, kiểm tra quyền, lưu dữ liệu, gọi AI, gọi thanh toán.
- MongoDB là nơi lưu dữ liệu lâu dài.
- Cloudinary lưu ảnh để hệ thống nhẹ và tải nhanh.
- PayOS xử lý thanh toán, backend chỉ lưu và xác nhận trạng thái.
- Token/JWT giúp hệ thống biết ai đang đăng nhập và được phép làm gì.
- Analytics của shop đến từ hành vi thật của user như xem sản phẩm, try-on, được AI gợi ý và gửi feedback.

## 20. Cách nói cực ngắn gọn

Nếu cần giải thích trong vài câu:

MIROIR gồm website, mobile app và backend. Website/mobile là nơi người dùng thao tác, backend là nơi xử lý và kết nối dữ liệu. MongoDB lưu thông tin user, shop và sản phẩm. Cloudinary lưu ảnh. PiAPI tạo ảnh thử đồ bằng AI. Gemini hỗ trợ tìm sản phẩm phù hợp và tạo gợi ý phối đồ. PayOS xử lý thanh toán. Các công nghệ như React, Flutter, Node.js và Express giúp xây giao diện, app và API để toàn bộ hệ thống hoạt động cùng nhau.
