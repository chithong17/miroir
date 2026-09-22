# KỊCH BẢN VIDEO DEMO NỀN TẢNG MIROIR

> **Định dạng:** Product Demo & Promo Video  
> **Thời lượng:** 05 phút 30 giây  
> **Ngôn ngữ:** Tiếng Việt  
> **Thông điệp:** *MIROIR — Fit your business, free your mind*

---

## I. NGUYÊN TẮC NỘI DUNG

Kịch bản này bám theo luồng đang có trong frontend và backend của dự án. Khi quay và lồng tiếng, cần giữ đúng các nguyên tắc sau:

- **Fit Finder và Virtual Try-On là hai tính năng khác nhau.**
  - Fit Finder dùng số đo người dùng và dữ liệu từng biến thể để đề xuất size, đồng thời mô phỏng các vùng vừa, chật hoặc rộng.
  - Virtual Try-On dùng ảnh người và ảnh trang phục để tạo ảnh thử đồ bằng AI.
- Không khẳng định kết quả AI xuất hiện “tức thì” hoặc “trong vài giây”. Đây là tác vụ bất đồng bộ; giao diện có trạng thái xử lý và tiếp tục theo dõi tác vụ ở nền.
- Không dùng các tuyên bố tuyệt đối như “chính xác hoàn hảo”, “giữ nguyên mọi nếp vải” hoặc “an tâm tuyệt đối”.
- Stylist AI chỉ đề xuất các sản phẩm có trong catalog được backend truy xuất; kết quả có thể gồm tối đa 5 outfit.
- Giỏ hàng được nhóm theo shop. Khi checkout, hệ thống tạo một đơn riêng cho từng shop và cho phép chọn phương thức thanh toán theo từng shop.
- Chuyển khoản chỉ khả dụng khi shop đã cấu hình thông tin ngân hàng; tiền mặt là thanh toán khi nhận hàng.
- Dữ liệu Customer Insights là dữ liệu tổng hợp, ẩn danh. Hệ thống chỉ hiển thị khi đạt ngưỡng tối thiểu về số lượt tương tác và số người dùng.
- Seller Center có các gói dịch vụ và giới hạn tính năng theo gói. Không trình bày mọi tính năng như thể luôn khả dụng với mọi tài khoản.

---

## II. LUỒNG NGHIỆP VỤ DÙNG TRONG VIDEO

| Bước | Màn hình / route | Nghiệp vụ thể hiện |
| :--- | :--- | :--- |
| 1 | `/` hoặc `/hero2` | Landing page, mô hình 3D quần cargo tương tác, điều hướng song ngữ |
| 2 | `/signup`, `/onboarding/profile`, `/app/profile` | Tạo tài khoản khách hàng, lưu ảnh người mẫu, giới tính, dáng người, tone da, phong cách và số đo |
| 3 | `/products` hoặc `/app` | Tìm kiếm, lọc sản phẩm, xem catalog sản phẩm và outfit |
| 4 | `/products/:id` hoặc `/app/products/:id` | Xem chi tiết, biến thể, tồn kho và dùng Fit Finder để đề xuất size |
| 5 | `/stylist` hoặc `/app/stylist` | Nhập yêu cầu và ngân sách; nhận outfit được tạo từ catalog hiện có |
| 6 | `/try-on?productId=...` | Thử sản phẩm marketplace hoặc tải trang phục riêng; tải/chọn ảnh người; chờ và xem kết quả AI |
| 7 | `/app/cart`, `/app/checkout` | Chọn màu, size, số lượng; giỏ hàng theo shop; địa chỉ và phương thức thanh toán theo shop |
| 8 | `/app/orders/:id`, `/app/messages` | Theo dõi trạng thái đơn, thanh toán và trao đổi với shop |
| 9 | `/login`, `/shop/dashboard` | Đăng nhập bằng tài khoản chủ shop và mở Seller Center |
| 10 | Seller: `products`, `import`, product workspace | Quản lý sản phẩm, biến thể, tồn kho, trạng thái và nhập Excel |
| 11 | Seller: `orders`, `messages` | Xử lý đơn, đối soát thanh toán, thông báo và chat theo ngữ cảnh đơn hàng |
| 12 | Seller: `analytics`, `insights`, `billing` | Theo dõi doanh thu, funnel tương tác, dữ liệu khách hàng ẩn danh và gói dịch vụ |

---

## III. KỊCH BẢN QUAY CHI TIẾT

> **Nhịp dựng:** Voiceover không chạy liên tục. Sau mỗi ý, giữ 2–5 giây cho thao tác thật trên giao diện, trạng thái tải dữ liệu và chuyển cảnh. Không cắt bỏ trạng thái xử lý của AI theo cách khiến người xem hiểu sai tốc độ thực tế.

### PHẦN 1 — MỞ ĐẦU VÀ THIẾT LẬP HỒ SƠ (00:00 - 00:42)

#### Phân cảnh 1: Landing Page và mô hình sản phẩm 3D

- **Thời lượng:** 00:00 - 00:20 (20 giây)
- **Màn hình:** `/` hoặc `/hero2`
- **Thao tác quay:**
  - Mở trang chủ ở chế độ toàn màn hình.
  - Di chuyển con trỏ ngang màn hình để mô hình **quần cargo 3D** đổi góc nhìn nhẹ.
  - Giữ và kéo ngang trực tiếp trên mô hình để xoay 360 độ.
  - Bấm nút `VI | EN` một lần để thể hiện giao diện song ngữ, sau đó trở lại tiếng Việt.
- **On-screen text:** *MIROIR — Một hành trình thời trang được kết nối*
- **Voiceover:**
  > *"Một lựa chọn thời trang tốt không bắt đầu ở nút mua hàng. Nó bắt đầu từ việc hiểu sản phẩm, hiểu người mặc và kết nối đúng dữ liệu. Với người mua, đó là hành trình chọn đúng món đồ và đúng kích cỡ. Với người bán, đó là khả năng nhìn thấy nhu cầu phía sau mỗi tương tác. MIROIR đưa hai phía ấy vào cùng một hệ thống."*

---

#### Phân cảnh 2: Tạo tài khoản và hoàn thiện hồ sơ cá nhân

- **Thời lượng:** 00:20 - 00:42 (22 giây)
- **Màn hình:** `/signup` → `/onboarding/profile` hoặc `/app/profile`
- **Thao tác quay:**
  - Ở màn hình đăng ký, chọn vai trò **Khách hàng** và tạo tài khoản.
  - Mở hồ sơ cá nhân; tải một ảnh toàn thân để có thể dùng lại khi thử đồ.
  - Chọn giới tính, dáng người, tone da và phong cách yêu thích.
  - Nhập các số đo đang được hệ thống hỗ trợ: chiều cao, cân nặng, vai, ngực, eo và mông; nhấn **Lưu hồ sơ**.
- **On-screen text:** *Một hồ sơ — dùng xuyên suốt trải nghiệm*
- **Voiceover:**
  > *"Để hành trình ấy mang tính cá nhân, người dùng có thể lưu ảnh toàn thân, phong cách yêu thích và các số đo cơ thể trong hồ sơ riêng. Dáng người và tone da hỗ trợ quá trình gợi ý phong cách; còn chiều cao, cân nặng cùng số đo vai, ngực, eo và mông phục vụ việc tìm size. Dữ liệu được tái sử dụng ở đúng bước, thay vì phải nhập lại nhiều lần."*

---

### PHẦN 2 — HÀNH TRÌNH NGƯỜI MUA (00:42 - 03:25)

#### Phân cảnh 3: Khám phá Marketplace và Outfit

- **Thời lượng:** 00:42 - 01:04 (22 giây)
- **Màn hình:** `/products` hoặc `/app`
- **Thao tác quay:**
  - Chuyển giữa tab **Sản phẩm** và **Outfit**.
  - Tìm kiếm theo tên; thử bộ lọc danh mục, giới tính và khoảng giá.
  - Chuyển trang bằng điều khiển phân trang.
  - Đánh dấu yêu thích một sản phẩm, sau đó bấm **Chi tiết** để mở modal thông tin nhanh.
  - Kết cảnh tại sản phẩm đã chọn; dùng cut sang trang chi tiết đầy đủ của chính sản phẩm đó ở phân cảnh kế tiếp.
- **On-screen text:** *Catalog có thể tìm kiếm, lọc và lưu yêu thích*
- **Voiceover:**
  > *"Khi hồ sơ đã sẵn sàng, người mua bước vào catalog của các shop đang hoạt động. Tại đây, sản phẩm và outfit được tổ chức thành một không gian khám phá chung. Người dùng có thể tìm theo tên, thu hẹp lựa chọn bằng danh mục, giới tính hoặc khoảng giá, rồi lưu lại những thiết kế mình quan tâm. Từ một danh sách rộng, hành trình dần tập trung vào sản phẩm phù hợp nhất."*

---

#### Phân cảnh 4: Chi tiết sản phẩm và Fit Finder

- **Thời lượng:** 01:04 - 01:38 (34 giây)
- **Màn hình:** `/app/products/:productId`
- **Thao tác quay:**
  - Mở trực tiếp route chi tiết đầy đủ của sản phẩm đã chọn ở phân cảnh 3. Không mô tả đây là điều hướng tự động từ modal Marketplace vì UI hiện tại chưa có nút chuyển sang route này.
  - Cho thấy tên, giá, mô tả, chất liệu, dáng sản phẩm, màu và size đang bán.
  - Mở **Tìm size phù hợp** từ khu vực chọn biến thể.
  - Chọn kiểu mặc: ôm vừa, regular hoặc rộng thoải mái.
  - Kiểm tra số đo, tích đồng ý sử dụng số đo cho Fit Finder và bấm phân tích.
  - Hiển thị size được đề xuất, độ tin cậy và đánh giá từng vùng cơ thể nếu sản phẩm có đủ dữ liệu.
  - So sánh các size trên mô phỏng Fit Live, sau đó bấm **Dùng size đề xuất**.
- **On-screen text:** *Fit Finder — Gợi ý size từ số đo và dữ liệu biến thể*
- **Voiceover:**
  > *"Từ sản phẩm đã chọn, MIROIR đi sâu hơn vào câu hỏi quan trọng nhất: nên chọn size nào. Trước hết, người dùng chọn kiểu mặc mình mong muốn và đồng ý cho hệ thống sử dụng số đo. Fit Finder sau đó đối chiếu hồ sơ cơ thể với dữ liệu của từng biến thể còn hàng, đưa ra size phù hợp, mức độ tin cậy và đánh giá theo từng vùng như vai, ngực, eo hoặc mông. Người dùng vẫn có thể so sánh các size khác trước khi áp dụng. Nếu shop chưa cung cấp đủ số đo may mặc, MIROIR nói rõ kết quả chỉ là ước tính thay vì đưa ra một kết luận chắc chắn."*

---

#### Phân cảnh 5: Stylist AI gợi ý từ catalog thật

- **Thời lượng:** 01:38 - 02:07 (29 giây)
- **Màn hình:** `/stylist` hoặc `/app/stylist`
- **Thao tác quay:**
  - Nhập yêu cầu cụ thể, ví dụ: *"Phối đồ đi làm tối giản, màu trung tính"*.
  - Nhập ngân sách tối đa và bấm tạo gợi ý.
  - Chờ trạng thái tạo kết quả; sau đó lướt qua các outfit được trả về.
  - Mở một sản phẩm trong outfit hoặc bấm **Thử đồ** trên sản phẩm muốn xem tiếp.
- **On-screen text:** *Stylist AI — Gợi ý có căn cứ từ catalog hiện có*
- **Voiceover:**
  > *"Sau khi giải quyết câu chuyện kích cỡ, Stylist AI tiếp tục hỗ trợ câu hỏi: món đồ này nên được kết hợp như thế nào. Người mua chỉ cần mô tả dịp sử dụng, phong cách mong muốn và ngân sách tối đa. Hệ thống kết hợp yêu cầu đó với hồ sơ đã có, truy xuất sản phẩm thực sự tồn tại trong catalog và tạo tối đa năm phương án phối đồ. Mỗi outfit đều giải thích lý do phù hợp, đồng thời dẫn về từng sản phẩm để người dùng xem chi tiết, mua hoặc chuyển sang thử đồ."*

---

#### Phân cảnh 6: Virtual Try-On bằng ảnh

- **Thời lượng:** 02:07 - 02:37 (30 giây)
- **Màn hình:** `/try-on?productId=:productId`
- **Thao tác quay:**
  - Sản phẩm vừa chọn xuất hiện trong tab **Từ Marketplace**.
  - Dùng ảnh đã lưu trong hồ sơ hoặc tải một ảnh người mới.
  - Bấm **Thử đồ ngay** và giữ nguyên trạng thái **Đang tạo kết quả** trên hình đủ lâu để người xem hiểu đây là tác vụ AI.
  - Trong lúc xử lý, làm nổi bật bubble trạng thái toàn cục; kết quả có thể tiếp tục được theo dõi khi chuyển trang.
  - Khi hoàn tất, chuyển giữa **Ảnh gốc** và **Kết quả AI**.
  - Cho thấy lựa chọn thứ hai **Tải ảnh**, hỗ trợ đầm liền hoặc bộ áo và quần do người dùng tải lên.
- **On-screen text:** *Virtual Try-On — Tạo ảnh thử đồ từ người và trang phục*
- **Voiceover:**
  > *"Từ gợi ý vừa nhận, người mua có thể đưa một sản phẩm sang Virtual Try-On. Với sản phẩm marketplace, ảnh trang phục đã được chọn sẵn; người dùng chỉ cần dùng ảnh toàn thân trong hồ sơ hoặc tải một ảnh mới. Ngoài ra, chế độ tải ảnh riêng còn hỗ trợ đầm liền hoặc bộ áo và quần. Sau khi bắt đầu, tác vụ AI tiếp tục xử lý ở nền và trạng thái được hiển thị xuyên suốt. Khi hoàn tất, người dùng chuyển qua lại giữa ảnh gốc và kết quả để quan sát tổng thể trước khi đi đến quyết định mua."*

---

#### Phân cảnh 7: Chọn biến thể, giỏ hàng và checkout theo shop

- **Thời lượng:** 02:37 - 03:04 (27 giây)
- **Màn hình:** Kết quả Try-On → `/app/cart` → `/app/checkout`
- **Thao tác quay:**
  - Từ kết quả thử đồ marketplace, mở hành động mua hàng.
  - Chọn màu, size còn tồn kho và số lượng; bấm **Thêm vào giỏ**.
  - Mở giỏ hàng để cho thấy sản phẩm được nhóm theo từng shop.
  - Tại checkout, chọn địa chỉ đã lưu hoặc nhập địa chỉ mới.
  - Chọn **Tiền mặt — thanh toán khi nhận hàng**; lướt qua tùy chọn **Chuyển khoản** và chú thích rằng tùy chọn này chỉ bật khi shop đã cấu hình.
  - Bấm **Đặt hàng**.
- **On-screen text:** *Kiểm tra biến thể và thanh toán riêng theo từng shop*
- **Voiceover:**
  > *"Nếu kết quả phù hợp, người mua tiếp tục chọn đúng màu, size và số lượng còn trong kho rồi thêm vào giỏ. MIROIR nhóm sản phẩm theo từng shop để tổng tiền và biến thể luôn rõ ràng. Tại checkout, người dùng có thể chọn địa chỉ đã lưu hoặc nhập người nhận mới, sau đó chọn tiền mặt khi nhận hàng hay chuyển khoản nếu shop đã cấu hình. Một lần checkout có thể tạo nhiều đơn, nhưng mỗi đơn vẫn có shop, mã đơn, trạng thái xử lý và trạng thái thanh toán riêng."*

---

#### Phân cảnh 8: Theo dõi đơn hàng và trao đổi với shop

- **Thời lượng:** 03:04 - 03:25 (21 giây)
- **Màn hình:** `/app/orders/:orderId` → `/app/messages`
- **Thao tác quay:**
  - Hiển thị màn hình chi tiết đơn vừa tạo với mã đơn, trạng thái đơn và trạng thái thanh toán.
  - Lướt qua lịch sử trạng thái.
  - Mở cuộc trò chuyện liên quan đến đơn hàng và gửi một câu hỏi cho shop.
- **On-screen text:** *Đơn hàng, thanh toán và hội thoại trong cùng ngữ cảnh*
- **Voiceover:**
  > *"Sau khi đơn được tạo, hành trình không dừng lại. Người mua có thể xem sản phẩm, người nhận, tổng thanh toán và toàn bộ timeline cập nhật trong trang chi tiết đơn. Trạng thái xử lý được tách khỏi trạng thái thanh toán để tránh nhầm lẫn. Khi cần xác nhận size, thời gian giao hàng hoặc một vấn đề phát sinh, cuộc trò chuyện với shop được mở ngay từ chính đơn hàng đó."*

---

### PHẦN 3 — HÀNH TRÌNH NGƯỜI BÁN (03:25 - 05:09)

#### Phân cảnh 9: Đăng nhập chủ shop và trang Tổng quan

- **Thời lượng:** 03:25 - 03:49 (24 giây)
- **Màn hình:** `/login` → `/shop/dashboard`
- **Thao tác quay:**
  - Đăng nhập bằng tài khoản chủ shop đã được phê duyệt.
  - Mở trang **Tổng quan** trong Seller Center.
  - Lướt qua tổng doanh thu, đơn phát sinh, sản phẩm bán chạy, đơn cần xử lý và tin nhắn chưa đọc.
  - Bấm một thẻ điều hướng để cho thấy dashboard dẫn trực tiếp tới phân hệ liên quan.
- **On-screen text:** *Seller Center — Một nơi để theo dõi hoạt động của shop*
- **Voiceover:**
  > *"Cuộc trò chuyện ấy đưa chúng ta sang phía còn lại của nền tảng: Seller Center. Sau khi đăng nhập bằng tài khoản chủ shop đã được phê duyệt, người bán nhìn thấy tổng quan hoạt động của cửa hàng, từ doanh thu và đơn phát sinh đến sản phẩm nổi bật, đơn đang chờ xử lý và hội thoại chưa đọc. Các thẻ trên dashboard không chỉ để theo dõi; chúng còn dẫn người bán đến đúng phân hệ cần hành động tiếp theo."*

---

#### Phân cảnh 10: Quản lý sản phẩm, biến thể và nhập Excel

- **Thời lượng:** 03:49 - 04:18 (29 giây)
- **Màn hình:** Seller `products` → product workspace → `import`
- **Thao tác quay:**
  - Chuyển danh sách sản phẩm giữa dạng lưới và bảng; tìm theo tên hoặc SKU, lọc theo trạng thái.
  - Mở một sản phẩm để chỉnh thông tin, biến thể màu/size, tồn kho và trạng thái draft/published.
  - Quay lại danh sách, chọn **Nhập Excel**.
  - Tải file mẫu, chọn một file `.xlsx`, thực hiện import.
  - Hiển thị kết quả thật: tổng số dòng, số tạo thành công, số thất bại và danh sách lỗi nếu có.
- **On-screen text:** *Quản lý từng sản phẩm hoặc nhập hàng loạt có đối soát*
- **Voiceover:**
  > *"Từ bảng tổng quan, người bán đi vào danh mục sản phẩm và quản lý dữ liệu đến từng biến thể. Danh sách có thể chuyển giữa dạng lưới và bảng, tìm theo tên hoặc SKU, rồi lọc theo trạng thái. Trong workspace, shop chỉnh nội dung, màu, size, tồn kho và quyết định sản phẩm đang là bản nháp hay đã xuất bản. Khi cần xử lý nhiều mặt hàng, shop tải file Excel mẫu, nhập dữ liệu hàng loạt và nhận lại kết quả đối soát gồm số dòng thành công, số dòng thất bại cùng nguyên nhân cụ thể."*

---

#### Phân cảnh 11: Xử lý đơn hàng, thanh toán và tin nhắn

- **Thời lượng:** 04:18 - 04:42 (24 giây)
- **Màn hình:** Seller `orders` → `messages`
- **Thao tác quay:**
  - Tìm đơn vừa tạo theo mã đơn.
  - Mở chi tiết, xác nhận đơn và chuyển trạng thái theo luồng xử lý hợp lệ.
  - Chỉ ra nhãn **Tiền mặt — chưa thu** hoặc trạng thái đối soát chuyển khoản tương ứng.
  - Mở chat từ ngữ cảnh đơn hàng; trả lời khách bằng tin nhắn thường hoặc một mẫu trả lời nhanh.
- **On-screen text:** *Đơn hàng và hội thoại được nối bằng cùng một mã đơn*
- **Voiceover:**
  > *"Khi đơn mới xuất hiện, shop có thể tìm theo mã, mở chi tiết, xác nhận và cập nhật theo những bước chuyển trạng thái hợp lệ. Phần thanh toán được theo dõi riêng: đơn COD ở trạng thái chưa thu, còn giao dịch chuyển khoản có thể chờ khách báo hoặc chờ shop đối soát. Thông báo giúp người bán nhận biết việc cần xử lý, và cuộc trò chuyện gắn với đơn giúp shop phản hồi khách mà không mất ngữ cảnh."*

---

#### Phân cảnh 12: Analytics, Customer Insights và gói dịch vụ

- **Thời lượng:** 04:42 - 05:09 (27 giây)
- **Màn hình:** Seller `analytics` → `insights` → `billing`
- **Thao tác quay:**
  - Mở **Phân tích** và lướt qua doanh thu, đơn hàng, COGS/lãi gộp khi có đủ dữ liệu chi phí, cùng funnel lượt xem → thử đồ → Stylist → đơn hàng.
  - Chuyển sang **Thấu hiểu khách hàng**; hiển thị các nhóm như giới tính, dáng người, tone da, phong cách, ngân sách và mức độ hài lòng.
  - Làm nổi bật thông báo ngưỡng riêng tư nếu chưa đủ ít nhất 3 tương tác từ 3 người dùng riêng biệt.
  - Mở **Gói & thanh toán** để cho thấy quota Try-On, gói hiện tại, báo giá và lịch sử hóa đơn.
- **On-screen text:** *Dữ liệu tổng hợp để vận hành — không phơi bày hồ sơ cá nhân*
- **Voiceover:**
  > *"Khi hoạt động tích lũy đủ dữ liệu, Seller Center tổng hợp chúng thành góc nhìn vận hành: doanh thu, đơn hàng, hiệu quả sản phẩm và hành trình từ lượt xem đến thử đồ, gợi ý rồi mua hàng. Customer Insights tiếp tục nhóm các tín hiệu về dáng người, tone da, phong cách và ngân sách, nhưng chỉ hiển thị dữ liệu ẩn danh khi đạt ngưỡng riêng tư. Cuối cùng, mục Gói và thanh toán cho shop biết gói hiện tại, quyền lợi, quota Try-On, báo giá và lịch sử hóa đơn liên quan."*

---

### PHẦN 4 — KẾT THÚC (05:09 - 05:30)

#### Phân cảnh 13: Khép kín hai hành trình

- **Thời lượng:** 05:09 - 05:30 (21 giây)
- **Màn hình:** Chuyển nhanh giữa kết quả Try-On, đơn hàng và Seller Overview; kết ở Hero Page.
- **Thao tác quay:**
  - Match cut từ sản phẩm trong kết quả Try-On sang chính sản phẩm trong đơn hàng.
  - Match cut tiếp sang đơn hàng đó trong Seller Center.
  - Trở về Hero Page, logo MIROIR và nút **Bắt đầu ngay**.
- **On-screen text:**
  - *Hiểu lựa chọn của người mua.*
  - *Kết nối vận hành của người bán.*
  - *MIROIR — Fit your business, free your mind.*
- **Voiceover:**
  > *"Từ hồ sơ, lựa chọn sản phẩm và kết quả thử đồ của người mua, đến đơn hàng, hội thoại và dữ liệu vận hành của người bán, MIROIR giữ các bước quan trọng trong cùng một hệ thống. Không thay người dùng quyết định, MIROIR cung cấp thêm căn cứ để lựa chọn rõ ràng hơn và vận hành nhất quán hơn. MIROIR — Fit your business, free your mind."*

---

## IV. BẢNG TIMECODE VÀ VOICEOVER THU ÂM

| Timecode | Phân cảnh | Voiceover |
| :---: | :--- | :--- |
| **00:00 - 00:20** | **PC 1 — Landing & 3D product** | *"Một lựa chọn thời trang tốt không bắt đầu ở nút mua hàng. Nó bắt đầu từ việc hiểu sản phẩm, hiểu người mặc và kết nối đúng dữ liệu. Với người mua, đó là hành trình chọn đúng món đồ và đúng kích cỡ. Với người bán, đó là khả năng nhìn thấy nhu cầu phía sau mỗi tương tác. MIROIR đưa hai phía ấy vào cùng một hệ thống."* |
| **00:20 - 00:42** | **PC 2 — Account & Profile** | *"Để hành trình ấy mang tính cá nhân, người dùng có thể lưu ảnh toàn thân, phong cách yêu thích và các số đo cơ thể trong hồ sơ riêng. Dáng người và tone da hỗ trợ quá trình gợi ý phong cách; còn chiều cao, cân nặng cùng số đo vai, ngực, eo và mông phục vụ việc tìm size. Dữ liệu được tái sử dụng ở đúng bước, thay vì phải nhập lại nhiều lần."* |
| **00:42 - 01:04** | **PC 3 — Marketplace** | *"Khi hồ sơ đã sẵn sàng, người mua bước vào catalog của các shop đang hoạt động. Tại đây, sản phẩm và outfit được tổ chức thành một không gian khám phá chung. Người dùng có thể tìm theo tên, thu hẹp lựa chọn bằng danh mục, giới tính hoặc khoảng giá, rồi lưu lại những thiết kế mình quan tâm. Từ một danh sách rộng, hành trình dần tập trung vào sản phẩm phù hợp nhất."* |
| **01:04 - 01:38** | **PC 4 — Product Detail & Fit Finder** | *"Từ sản phẩm đã chọn, MIROIR đi sâu hơn vào câu hỏi quan trọng nhất: nên chọn size nào. Trước hết, người dùng chọn kiểu mặc mình mong muốn và đồng ý cho hệ thống sử dụng số đo. Fit Finder sau đó đối chiếu hồ sơ cơ thể với dữ liệu của từng biến thể còn hàng, đưa ra size phù hợp, mức độ tin cậy và đánh giá theo từng vùng như vai, ngực, eo hoặc mông. Người dùng vẫn có thể so sánh các size khác trước khi áp dụng. Nếu shop chưa cung cấp đủ số đo may mặc, MIROIR nói rõ kết quả chỉ là ước tính thay vì đưa ra một kết luận chắc chắn."* |
| **01:38 - 02:07** | **PC 5 — Stylist AI** | *"Sau khi giải quyết câu chuyện kích cỡ, Stylist AI tiếp tục hỗ trợ câu hỏi: món đồ này nên được kết hợp như thế nào. Người mua chỉ cần mô tả dịp sử dụng, phong cách mong muốn và ngân sách tối đa. Hệ thống kết hợp yêu cầu đó với hồ sơ đã có, truy xuất sản phẩm thực sự tồn tại trong catalog và tạo tối đa năm phương án phối đồ. Mỗi outfit đều giải thích lý do phù hợp, đồng thời dẫn về từng sản phẩm để người dùng xem chi tiết, mua hoặc chuyển sang thử đồ."* |
| **02:07 - 02:37** | **PC 6 — Virtual Try-On** | *"Từ gợi ý vừa nhận, người mua có thể đưa một sản phẩm sang Virtual Try-On. Với sản phẩm marketplace, ảnh trang phục đã được chọn sẵn; người dùng chỉ cần dùng ảnh toàn thân trong hồ sơ hoặc tải một ảnh mới. Ngoài ra, chế độ tải ảnh riêng còn hỗ trợ đầm liền hoặc bộ áo và quần. Sau khi bắt đầu, tác vụ AI tiếp tục xử lý ở nền và trạng thái được hiển thị xuyên suốt. Khi hoàn tất, người dùng chuyển qua lại giữa ảnh gốc và kết quả để quan sát tổng thể trước khi đi đến quyết định mua."* |
| **02:37 - 03:04** | **PC 7 — Cart & Checkout** | *"Nếu kết quả phù hợp, người mua tiếp tục chọn đúng màu, size và số lượng còn trong kho rồi thêm vào giỏ. MIROIR nhóm sản phẩm theo từng shop để tổng tiền và biến thể luôn rõ ràng. Tại checkout, người dùng có thể chọn địa chỉ đã lưu hoặc nhập người nhận mới, sau đó chọn tiền mặt khi nhận hàng hay chuyển khoản nếu shop đã cấu hình. Một lần checkout có thể tạo nhiều đơn, nhưng mỗi đơn vẫn có shop, mã đơn, trạng thái xử lý và trạng thái thanh toán riêng."* |
| **03:04 - 03:25** | **PC 8 — Order & Chat** | *"Sau khi đơn được tạo, hành trình không dừng lại. Người mua có thể xem sản phẩm, người nhận, tổng thanh toán và toàn bộ timeline cập nhật trong trang chi tiết đơn. Trạng thái xử lý được tách khỏi trạng thái thanh toán để tránh nhầm lẫn. Khi cần xác nhận size, thời gian giao hàng hoặc một vấn đề phát sinh, cuộc trò chuyện với shop được mở ngay từ chính đơn hàng đó."* |
| **03:25 - 03:49** | **PC 9 — Seller Overview** | *"Cuộc trò chuyện ấy đưa chúng ta sang phía còn lại của nền tảng: Seller Center. Sau khi đăng nhập bằng tài khoản chủ shop đã được phê duyệt, người bán nhìn thấy tổng quan hoạt động của cửa hàng, từ doanh thu và đơn phát sinh đến sản phẩm nổi bật, đơn đang chờ xử lý và hội thoại chưa đọc. Các thẻ trên dashboard không chỉ để theo dõi; chúng còn dẫn người bán đến đúng phân hệ cần hành động tiếp theo."* |
| **03:49 - 04:18** | **PC 10 — Products & Excel Import** | *"Từ bảng tổng quan, người bán đi vào danh mục sản phẩm và quản lý dữ liệu đến từng biến thể. Danh sách có thể chuyển giữa dạng lưới và bảng, tìm theo tên hoặc SKU, rồi lọc theo trạng thái. Trong workspace, shop chỉnh nội dung, màu, size, tồn kho và quyết định sản phẩm đang là bản nháp hay đã xuất bản. Khi cần xử lý nhiều mặt hàng, shop tải file Excel mẫu, nhập dữ liệu hàng loạt và nhận lại kết quả đối soát gồm số dòng thành công, số dòng thất bại cùng nguyên nhân cụ thể."* |
| **04:18 - 04:42** | **PC 11 — Orders & Messages** | *"Khi đơn mới xuất hiện, shop có thể tìm theo mã, mở chi tiết, xác nhận và cập nhật theo những bước chuyển trạng thái hợp lệ. Phần thanh toán được theo dõi riêng: đơn COD ở trạng thái chưa thu, còn giao dịch chuyển khoản có thể chờ khách báo hoặc chờ shop đối soát. Thông báo giúp người bán nhận biết việc cần xử lý, và cuộc trò chuyện gắn với đơn giúp shop phản hồi khách mà không mất ngữ cảnh."* |
| **04:42 - 05:09** | **PC 12 — Analytics, Insights & Billing** | *"Khi hoạt động tích lũy đủ dữ liệu, Seller Center tổng hợp chúng thành góc nhìn vận hành: doanh thu, đơn hàng, hiệu quả sản phẩm và hành trình từ lượt xem đến thử đồ, gợi ý rồi mua hàng. Customer Insights tiếp tục nhóm các tín hiệu về dáng người, tone da, phong cách và ngân sách, nhưng chỉ hiển thị dữ liệu ẩn danh khi đạt ngưỡng riêng tư. Cuối cùng, mục Gói và thanh toán cho shop biết gói hiện tại, quyền lợi, quota Try-On, báo giá và lịch sử hóa đơn liên quan."* |
| **05:09 - 05:30** | **PC 13 — CTA** | *"Từ hồ sơ, lựa chọn sản phẩm và kết quả thử đồ của người mua, đến đơn hàng, hội thoại và dữ liệu vận hành của người bán, MIROIR giữ các bước quan trọng trong cùng một hệ thống. Không thay người dùng quyết định, MIROIR cung cấp thêm căn cứ để lựa chọn rõ ràng hơn và vận hành nhất quán hơn. MIROIR — Fit your business, free your mind."* |

---

## V. CHECKLIST DỮ LIỆU DEMO TRƯỚC KHI QUAY

- Tài khoản khách hàng đã đăng nhập, có ảnh toàn thân và hồ sơ số đo hợp lệ.
- Một sản phẩm `published`, còn tồn kho, có ảnh, màu/size và biến thể rõ ràng.
- Để quay Fit Finder đầy đủ, sản phẩm cần có `fitCategory` và số đo may mặc trong `fitMeasurements`; nếu thiếu, chủ động quay trạng thái **ước tính** và nói đúng giới hạn dữ liệu.
- Shop sở hữu sản phẩm phải ở trạng thái hoạt động để xuất hiện đúng trong catalog; cần gói shop còn hiệu lực để checkout và catalog Try-On hoạt động.
- Chuẩn bị một sản phẩm có ảnh phù hợp với Virtual Try-On và một ảnh người toàn thân rõ ràng.
- Tạo sẵn một file Excel hợp lệ và một file có lỗi để có thể quay cả phần kết quả import và đối soát lỗi.
- Chuẩn bị ít nhất một đơn COD; nếu quay chuyển khoản, shop phải cấu hình ngân hàng và QR trước.
- Chuẩn bị đủ dữ liệu analytics. Để quay Customer Insights, cần tối thiểu 3 lượt tương tác từ 3 người dùng riêng biệt.
- Không dùng số liệu giả trong voiceover. Các giá trị doanh thu, lượt thử đồ, tỷ lệ chuyển đổi và quota chỉ đọc khi chúng thực sự xuất hiện trên màn hình.

---

## VI. HƯỚNG DẪN QUAY VÀ HẬU KỲ

1. Quay Chrome hoặc Edge ở 1920×1080, zoom 100%, 60 FPS.
2. Dùng con trỏ chậm và dứt khoát; tránh hover vào nhiều thành phần không liên quan.
3. Giữ trạng thái tải thật của Stylist và Try-On, nhưng có thể cắt rút thời gian chờ bằng jump cut kèm nhãn **“Sau khi AI xử lý”**.
4. Che email, số điện thoại, địa chỉ, số tài khoản và ảnh cá nhân nếu dùng dữ liệu thật.
5. Khi thu âm, đọc với nhịp ấm và rõ; để khoảng nghỉ cho người xem quan sát giao diện thay vì kéo dài thoại để lấp toàn bộ 5 phút 30 giây.
