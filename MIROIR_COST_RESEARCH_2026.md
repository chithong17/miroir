# Nghiên cứu chi phí vận hành MIROIR theo quy mô người dùng

> Cập nhật: 03/08/2026 (Asia/Ho_Chi_Minh)  
> Đơn vị quy đổi dùng để lập ngân sách: **1 USD = 26.500 VND**. Đây là tỷ giá kế hoạch được làm tròn, không phải cam kết tỷ giá của ngân hàng.  
> Phạm vi: chi phí dịch vụ trực tiếp để vận hành web, mobile và backend hiện có. Không tự gán giá cho nhân sự, marketing, pháp lý hay kế toán vì chưa có scope/báo giá.

## 1. Kết luận ngắn

- Với mô hình sử dụng cơ sở trong tài liệu này, chi phí nhà cung cấp ước tính khoảng **1,52 triệu/tháng ở 100 MAU**, **5,50 triệu ở 1.000 MAU**, **52,50 triệu ở 10.000 MAU**, và **489,06 triệu ở 100.000 MAU**. Nên giữ ngân sách cao hơn 10%, tương ứng khoảng **1,67; 6,06; 57,76; và 537,97 triệu VND/tháng**.
- Đây là core supplier cost; bảng chưa cộng Apple/Google publishing fee, commission mobile subscription, domain, payroll, marketing, pháp lý và thuế doanh nghiệp. Các khoản có evidence cố định được tách ở phần 7; khoản phụ thuộc pháp nhân/scope được để `TBD cần quote` thay vì đoán.
- **PiAPI/Kling chiếm phần lớn chi phí**: giá niêm yết là 0,07 USD cho mỗi ảnh virtual try-on output, tương đương khoảng **1.855 VND/lượt** theo tỷ giá kế hoạch.
- Gói user Premium hiện tại là **49.000 VND/30 ngày** và ghi “không giới hạn”. Một premium user dùng khoảng **25 lượt try-on/tháng trên web**, hoặc khoảng **21 lượt nếu doanh thu chịu phí store 15%**, đã tiêu hết phần doanh thu còn lại trước cả fixed cost. “Unlimited” hiện không an toàn về unit economics.
- Với giả định 5% MAU mua Premium, free user dùng trung bình 2 lượt/tháng, premium user dùng 10 lượt/tháng và 4 yêu cầu Stylist/tháng, **doanh thu Premium user đơn thuần không bù được chi phí nền tảng**. Doanh thu từ Shop Owner có thể bù một phần nhưng phải được theo dõi riêng.
- Chi phí Cloudinary trong bảng chỉ đạt được nếu ảnh try-on tạm được xoá sau 7 ngày. Code hiện tại **không thực hiện việc này**, nên storage tăng lũy kế và có thể buộc nâng plan rất nhanh.
- Có một rủi ro billing nghiêm trọng: route `POST /api/tryon/` hiện không có auth/quota, trong khi hai route mới mới có `requireUserTryOnAccess`. Ngoài ra server không chặn `batchSize > 1`. Phải sửa trước khi public production.

## 2. Kiến trúc nào thực sự phát sinh chi phí

Đây không phải mô hình giả định từ một SaaS chung; các thành phần sau được xác nhận trực tiếp từ repository:

| Thành phần | Evidence trong code | Cách phát sinh chi phí |
| --- | --- | --- |
| PiAPI/Kling | [`backend/services/piapi.service.js`](backend/services/piapi.service.js#L77) gửi `model: "kling"`, `task_type: "ai_try_on"`, `service_mode: "public"` | Theo số ảnh output; frontend/mobile đều gửi `batchSize=1` |
| Cloudinary | [`backend/controllers/tryon.controller.js`](backend/controllers/tryon.controller.js#L48) upload ảnh model/garment; catalog garment cũng bị download rồi upload lại ở dòng 157–177 | Storage ảnh gốc và bandwidth khi PiAPI tải ảnh; thêm bandwidth catalog |
| Gemini | [`backend/services/gemini.service.js`](backend/services/gemini.service.js#L35) dùng `gemini-embedding-001`; dòng 73 dùng `gemini-3.5-flash` | Embedding cho mỗi truy vấn Stylist; generation theo input/output token |
| MongoDB Atlas | [`backend/services/retrieval.service.js`](backend/services/retrieval.service.js#L129) dùng embedding và 3 vector searches; các collection account, product, event, payment nằm trong MongoDB | Cluster theo giờ/ops; production lớn cần dedicated tier |
| Render | [`render.yaml`](render.yaml#L1) khai báo một Node web service `miroir-backend` | Instance backend, workspace và egress vượt quota |
| Vercel | Frontend là React/Vite và trỏ API qua [`frontend/.env.example`](frontend/.env.example#L1) | Commercial deployment cần Pro thay vì Hobby |
| payOS | [`backend/package.json`](backend/package.json) và payment service dùng `@payos/node` | payOS hiện công bố miễn phí gateway; có rủi ro phí App Store/Google Play nếu bán digital subscription trong mobile |

Giá gói hiện trong code:

- User Premium: **49.000 VND/30 ngày** tại [`backend/services/subscription.service.js`](backend/services/subscription.service.js#L15).
- Shop Owner: **349.000 VND/30 ngày** tại cùng file, dòng 28.
- Free quota: **5 try-on/tháng** tại cùng file, dòng 40.

## 3. Evidence giá chính thức

Giá dưới đây được lấy từ tài liệu/trang chính thức vào ngày cập nhật tài liệu. Giá nhà cung cấp có thể đổi nên cần đối chiếu invoice/dashboard mỗi tháng.

| Dịch vụ | Giá/giới hạn dùng trong mô hình | Evidence chính thức |
| --- | --- | --- |
| PiAPI Kling Virtual Try-On | **0,07 USD/output image PAYG** | [PiAPI Virtual Try-On API](https://piapi.ai/docs/kling-api/virtual-try-on-api) |
| PiAPI subscription | Free 0 USD; Creator **15 USD/tháng** kèm 10 USD bonus credit và 5 concurrent Kling jobs; Pro **60 USD** kèm 60 USD bonus và 20 jobs; Enterprise **100 USD**, 60 jobs, không bonus credit | [PiAPI pricing](https://piapi.ai/pricing) |
| PiAPI top-up | Tài liệu billing công bố bonus 3% từ top-up trên 650 USD, 5% trên 2.700 USD, 7% trên 5.400 USD, 9% trên 10.800 USD. Không trừ khoản này trong bảng vì phải xác nhận còn áp dụng trong dashboard trước khi nạp | [PiAPI billing](https://piapi.ai/docs/billings) |
| Gemini 3.5 Flash | Standard: **1,50 USD/1M input tokens**, **9 USD/1M output tokens** | [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash) |
| Gemini embedding-001 | Standard: **0,15 USD/1M input tokens** | [Gemini API pricing – Embedding](https://ai.google.dev/gemini-api/docs/pricing#gemini-embedding) |
| Cloudinary Free | 0 USD; **25 credits/tháng** | [Cloudinary pricing](https://cloudinary.com/pricing) |
| Cloudinary Plus | **99 USD/tháng**, 225 credits | [Cloudinary pricing](https://cloudinary.com/pricing) |
| Cloudinary Advanced | **249 USD/tháng**, 600 credits | [Cloudinary pricing](https://cloudinary.com/pricing) |
| Cloudinary Advanced Extra / Pro | **549 USD/1.350 credits**; **1.099 USD/2.750 credits** | [Cloudinary plan comparison](https://cloudinary.com/pricing/compare-plans) |
| Cloudinary credit | 1 credit = 1 GB storage **hoặc** 1 GB image bandwidth **hoặc** 1.000 transformations; thực tế các phần storage + bandwidth + transformation được cộng lại | [Cloudinary billing docs](https://cloudinary.com/documentation/billing_and_plans) |
| MongoDB Atlas Flex | **8–30 USD/30 ngày**, 5 GB, 100 ops/s base, có Vector Search | [Atlas Flex costs](https://www.mongodb.com/docs/atlas/billing/atlas-flex-costs/) |
| MongoDB dedicated | Dedicated cluster bắt đầu khoảng **60 USD/tháng**; tài liệu cho ví dụ M30 AWS mặc định khoảng **388 USD/tháng** | [Atlas billing breakdown](https://www.mongodb.com/docs/atlas/billing/billing-breakdown-optimization/), [Atlas invoice example](https://www.mongodb.com/docs/atlas/billing/invoice-breakdown/) |
| Render compute | Starter 0,5 vCPU/512 MB **7 USD/tháng**; Standard 1 vCPU/2 GB **25 USD/tháng** | [Render comparison/pricing article](https://render.com/articles/render-vs-railway) |
| Render workspace | Hobby 0 USD; Pro **25 USD/tháng**. Hobby mới gồm 5 GB bandwidth, vượt mức là 0,15 USD/GB | [Render workspace changes](https://render.com/docs/new-workspace-plans), [Render bandwidth](https://render.com/docs/outbound-bandwidth) |
| Vercel | Pro **20 USD/tháng**, có 20 USD usage credit; Hobby chỉ dành cho personal, non-commercial use | [Vercel pricing](https://vercel.com/pricing), [Vercel fair-use](https://vercel.com/docs/limits/fair-use-guidelines) |
| payOS | Từ 23/01/2026: miễn phí khởi tạo, duy trì và giao dịch không giới hạn | [payOS](https://payos.vn/) |
| Apple Developer | **99 USD/năm**; qualifying subscriptions có commission 15%, mức chuẩn có thể là 30% | [Apple Developer membership](https://developer.apple.com/programs/whats-included/) |
| Google Play | **25 USD một lần** để mở developer account; auto-renewing subscriptions thường chịu **15% service fee** | [Play Console registration](https://support.google.com/googleplay/android-developer/answer/6112435), [Play service fees](https://support.google.com/googleplay/android-developer/answer/112622) |

## 4. Giả định sử dụng — phần phải thay bằng số thật sau launch

Không có traffic log/billing export trong repository, nên không thể gọi bất kỳ con số user-cost nào là “actual”. Bảng chính dùng một kịch bản cơ sở có công thức rõ ràng:

### 4.1 User và AI usage

- `MAU` là số user thực sự hoạt động trong tháng, không phải tổng account đã đăng ký.
- 95% là Free, mỗi Free MAU dùng trung bình **2 try-on/tháng**.
- 5% là Premium, mỗi Premium MAU dùng trung bình **10 try-on + 4 Stylist requests/tháng**.
- Suy ra trung bình toàn hệ thống:
  - `try-on / MAU = 95% × 2 + 5% × 10 = 2,4`;
  - `Stylist request / MAU = 5% × 4 = 0,2`.
- Mỗi try-on sinh đúng 1 output vì các client hiện gửi `batchSize=1`. Server vẫn phải cưỡng chế giá trị này.
- PiAPI cost: `try-on count × 0,07 USD`.

### 4.2 Gemini token

Một Stylist request trong code gồm 1 embedding query, 1 generation và có thể thêm 1 correction generation nếu model trả product ID sai. Model nhận tối đa 18 products cùng outfit/rule/review context.

Mô hình dùng:

- 6.000 input tokens và 1.500 output/thinking tokens cho một generation;
- 5% request cần correction, tức trung bình 1,05 generation/request;
- 200 tokens cho embedding query.

```text
Gemini/request
= 1,05 × [(6.000 / 1M × $1,50) + (1.500 / 1M × $9)]
  + (200 / 1M × $0,15)
= $0,023655 ≈ 627 VND
```

Phải log `usageMetadata.promptTokenCount`, `candidatesTokenCount` và correction rate để thay giả định này bằng số thật.

### 4.3 Cloudinary

Giả định cơ sở:

- Trung bình 1,5 ảnh được upload cho mỗi try-on, 1,5 MB/ảnh → **2,25 MB/try-on**.
- PiAPI phải tải lượng ảnh này một lần → bandwidth try-on gần bằng lượng upload.
- Ảnh tạm được xoá sau 7 ngày → storage trung bình `monthly upload × 7/30`.
- Mỗi MAU xem 20 ảnh thumbnail catalog/tháng, trung bình 150 KB/ảnh → **3 MB bandwidth/MAU/tháng**.
- Chưa tính video vì MIROIR hiện không có video generation/delivery.

| MAU | Upload try-on/tháng | Storage trung bình nếu TTL 7 ngày | Try-on bandwidth | Catalog bandwidth | Credits ước tính | Plan dùng trong bảng |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 100 | 0,54 GB | 0,13 GB | 0,54 GB | 0,30 GB | ~0,97 | Free |
| 1.000 | 5,40 GB | 1,26 GB | 5,40 GB | 3 GB | ~9,66 | Free |
| 10.000 | 54 GB | 12,60 GB | 54 GB | 30 GB | ~96,60 | Plus, 99 USD |
| 100.000 | 540 GB | 126 GB | 540 GB | 300 GB | ~966 | Advanced Extra, 549 USD |

Đây là lý do TTL là điều kiện bắt buộc. Nếu không xoá ảnh:

- 10.000 MAU thêm khoảng 54 GB storage mỗi tháng. Credit ước tính sẽ là khoảng 138 ở tháng 1, 192 ở tháng 2, 246 ở tháng 3... chưa tính transformation; từ tháng 3 đã vượt Plus 225.
- 100.000 MAU cần khoảng 1.380 credits ngay tháng đầu, đã vượt Advanced Extra 1.350; tháng 2 khoảng 1.920 credits, tháng 4 khoảng 3.000 credits và vượt cả Pro 2.750.
- Code try-on chỉ giữ `secure_url`, không giữ `public_id` và không gọi `cloudinary.uploader.destroy`; vì vậy hiện chưa thể thực hiện cleanup đúng cách.

### 4.4 Hosting/database sizing

Số user không tự động suy ra CPU/RAM. Các tier sau là **budget target**, không phải tuyên bố capacity; phải chạy load test trước khi mua dài hạn.

- 100–1.000 MAU: 1 Render Starter 7 USD + Atlas Flex base 8 USD.
- 10.000 MAU: Render Pro workspace 25 USD + 2 Standard instances 50 USD; Atlas M10 budget 60 USD.
- 100.000 MAU: Render Pro workspace 25 USD + 4 Standard instances 100 USD; Atlas M30 budget 388 USD.
- Vercel Pro 20 USD ở mọi mức vì đây là sản phẩm thương mại. 1 TB transfer và 10M Edge Requests được công bố trong Pro pricing; cần cộng overage nếu invoice vượt quota.
- Render egress chưa cộng riêng vì API chủ yếu trả JSON/URL, ảnh được phân phối từ Cloudinary. Phải theo dõi 5 GB Hobby bandwidth ở hai mức nhỏ.

### 4.5 PiAPI subscription/concurrency

- 100 MAU: dùng Creator 15 USD có 10 USD bonus credit; với 16,80 USD usage, cash PiAPI là khoảng **21,80 USD**.
- 1.000 và 10.000 MAU: dùng Pro 60 USD có 60 USD bonus; do usage lớn hơn 60 USD, tổng cash bằng PAYG usage nhưng có 20 concurrent jobs.
- 100.000 MAU: budget Enterprise 100 USD + PAYG usage vì Enterprise không công bố bonus credit; đổi lại có 60 concurrent jobs.
- Bảng không trừ top-up bonus 3–9%. Đây có thể là khoản tiết kiệm sau khi xác nhận điều khoản trực tiếp với PiAPI.

## 5. Chi phí theo từng mức user

### 5.1 Bảng chi tiết — kịch bản cơ sở

| MAU | Try-on/tháng | Stylist/tháng | PiAPI cash | Gemini | Render | Vercel | MongoDB | Cloudinary | Tổng USD/tháng | Tổng VND/tháng | Budget +10% |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 240 | 20 | $21,80 | $0,47 | $7 | $20 | $8 | $0 | **$57,27** | **1.517.655đ** | **1.669.421đ** |
| 1.000 | 2.400 | 200 | $168,00 | $4,73 | $7 | $20 | $8 | $0 | **$207,73** | **5.504.845đ** | **6.055.330đ** |
| 10.000 | 24.000 | 2.000 | $1.680,00 | $47,31 | $75 | $20 | $60 | $99 | **$1.981,31** | **52.504.715đ** | **57.755.187đ** |
| 100.000 | 240.000 | 20.000 | $16.900,00 | $473,10 | $125 | $20 | $388 | $549 | **$18.455,10** | **489.060.150đ** | **537.966.165đ** |

`Budget +10%` là quỹ dự phòng cho chênh lệch tỷ giá/card fee, thuế nhà cung cấp nếu có, retry, token lệch giả định và overage nhỏ. Đây **không phải** một mức thuế pháp định.

### 5.2 Sensitivity theo hành vi user

Chi phí AI biến đổi trên mỗi MAU, chưa gồm hosting/database/media fixed tier:

| Mức dùng | Try-on/MAU | Stylist/MAU | AI cost/MAU/tháng |
| --- | ---: | ---: | ---: |
| Light | 0,5 | 0,05 | ~$0,0362 ≈ **959đ** |
| Base | 2,4 | 0,20 | ~$0,1727 ≈ **4.577đ** |
| Heavy | 5,0 | 0,50 | ~$0,3618 ≈ **9.588đ** |

Công thức để cập nhật nhanh:

```text
AI cost USD/month
= MAU × try-on_per_MAU × 0,07
 + MAU × stylist_per_MAU × 0,023655
```

Mỗi khi số lượt try-on thực tế tăng thêm 1/MAU, ngân sách tăng khoảng **1.855 VND × MAU/tháng**. Đây là biến nhạy nhất.

## 6. Unit economics và doanh thu

### 6.1 Một user Premium 49.000đ

Trong kịch bản 10 try-on + 4 Stylist:

```text
Try-on variable cost = 10 × 1.855 = 18.550đ
Stylist variable cost = 4 × 627 ≈ 2.508đ
Tổng variable cost ≈ 21.058đ
Contribution trước fixed cost trên web/payOS ≈ 49.000 - 21.058 = 27.942đ
```

- Web/payOS: payOS công bố phí gateway 0đ, nên contribution trước fixed cost khoảng **57% doanh thu**.
- Mobile IAP với store fee 15%: net revenue còn 41.650đ; contribution còn khoảng **20.592đ**.
- Với 4 Stylist request cố định, điểm variable break-even xấp xỉ **25 try-on/tháng trên web** hoặc **21 try-on/tháng khi chịu store fee 15%**.
- Vì vậy không nên quảng cáo unlimited thực sự ở 49.000đ. Một cấu trúc có thể kiểm soát là 49.000đ gồm khoảng 10 try-on + 4 Stylist; lượt thêm bán theo credit. Muốn gross margin 50% riêng trên try-on, giá lượt thêm tối thiểu theo công thức là `1.855 / (1 - 50%) = 3.710đ/lượt`, chưa gồm fixed cost.

### 6.2 Free quota

- Nếu một Free user dùng đủ 5 lượt, acquisition subsidy riêng PiAPI là **9.275đ/user/tháng**.
- Với trung bình 2 lượt như mô hình, subsidy là **3.710đ/Free MAU/tháng**.
- Ở mix 95% Free dùng 2 lượt và 5% Premium dùng 10 lượt + 4 Stylist, conversion break-even chỉ riêng variable AI cost khoảng **11,7% trên web** hoặc **15,3% nếu toàn bộ Premium chịu store fee 15%**. Fixed infrastructure làm ngưỡng thực tế cao hơn.

### 6.3 So doanh thu hiện tại với bảng cost

Giả định chỉ 5% MAU trả User Premium 49.000đ và chưa có store fee:

| MAU | Premium users (5%) | Doanh thu User Premium | Supplier cost cơ sở | Chênh lệch trước nhân sự/marketing/thuế |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 5 | 245.000đ | 1.517.655đ | **-1.272.655đ** |
| 1.000 | 50 | 2.450.000đ | 5.504.845đ | **-3.054.845đ** |
| 10.000 | 500 | 24.500.000đ | 52.504.715đ | **-28.004.715đ** |
| 100.000 | 5.000 | 245.000.000đ | 489.060.150đ | **-244.060.150đ** |

Doanh thu Shop Owner phải được cộng theo số shop trả tiền thực tế:

```text
Monthly plan revenue
= 49.000 × paid_user_count
 + 349.000 × paid_shop_owner_count
```

Trong kịch bản trên, cần tối thiểu khoảng 4, 9, 81 và 700 Shop Owner trả phí tương ứng ở bốn mức MAU để bù phần thiếu, trước store fee, thuế, refund, payroll và marketing. Đây chỉ là phép chia chênh lệch cho 349.000đ, không phải dự báo số shop.

## 7. Mobile payment: chi phí và rủi ro policy đang bị bỏ sót

Mobile app hiện gọi cùng flow payOS để mở Premium. Tuy nhiên:

- Apple guideline 3.1.1 yêu cầu dùng In-App Purchase khi unlock subscription/feature trong app; multi-platform app có thể cho user dùng subscription đã mua trên web nhưng nếu bán trong app thì IAP phải có. Xem [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase).
- Google Play cũng yêu cầu Play Billing cho app feature/digital subscription, trừ các chương trình/ngoại lệ cụ thể. Xem [Google Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738).
- Vì MIROIR Premium unlock AI Stylist và unlimited try-on trong app, nên budget mobile phải chuẩn bị **15% subscription fee** và công sức tích hợp StoreKit/Play Billing, thay vì giả định payOS 0đ cho mọi channel.

Chi phí publish chưa nằm trong bảng monthly core:

| Khoản | Cash cost theo tỷ giá kế hoạch |
| --- | ---: |
| Apple Developer Program | 99 USD/năm ≈ **2.623.500đ/năm** (tương đương 218.625đ/tháng) |
| Google Play Console | 25 USD một lần ≈ **662.500đ** |
| Domain | Không gán số vì phụ thuộc TLD/registrar; lấy quote tại ngày mua. Cloudflare Registrar công bố bán/renew at-cost, không markup: [evidence](https://developers.cloudflare.com/registrar/) |

## 8. Rủi ro có thể làm bill vượt dự toán

### P0 — phải sửa trước public launch

1. **Unauthenticated paid endpoint:** [`backend/routes/tryon.routes.js`](backend/routes/tryon.routes.js#L14) mount `POST /` chỉ với upload middleware; không có `requireUser` và `requireUserTryOnAccess`. Bất kỳ ai gọi endpoint này có thể tạo PiAPI task ngoài quota.
2. **Không giới hạn batch phía server:** `parseBatchSize()` chỉ ép số nhỏ hơn 1 về 1, không có max. Client bình thường gửi 1 nhưng attacker có thể gửi số lớn; PiAPI tính theo output image.
3. **Quota race condition:** middleware đọc counter trước, còn counter chỉ tăng sau khi PiAPI task được tạo. Nhiều request đồng thời có thể cùng vượt qua check 5 lượt. Cần atomic reservation/idempotency trước khi gọi vendor.
4. **Không có rate limit/budget circuit breaker:** chưa thấy user/IP/API-key rate limiter hoặc daily PiAPI spending cap.

### P1 — ảnh hưởng cost sau khi có traffic

1. Lưu `public_id` cho mọi transient upload và xoá khi task completed/failed hoặc TTL tối đa 7 ngày.
2. Nếu PiAPI chấp nhận URL catalog Cloudinary hiện có, không download rồi re-upload cùng garment ở mỗi lượt.
3. Ép resize/compress client hoặc Cloudinary upload preset; 10 MB/file hiện là validation max chứ không phải kích thước mục tiêu.
4. Bỏ “unlimited” hoặc thêm fair-use quota/credit packs. Cảnh báo khi user tiến gần 15–20 try-on/tháng.
5. Dùng webhook PiAPI thay cho client polling nếu phù hợp. Poll status không được báo giá theo output, nhưng tạo tải API/backend không cần thiết và khó kiểm soát trạng thái cleanup.
6. Tách queue/background worker khi concurrency tăng; tránh giữ HTTP process làm orchestration duy nhất.

## 9. Số liệu phải thu trong 30 ngày đầu để thay estimate bằng actual

Tạo dashboard theo ngày và theo plan:

- `MAU`, Free/Premium/Shop Owner active, conversion và churn.
- Số PiAPI task requested/completed/failed, `batch_size`, cost/output, top-up và frozen quota.
- Try-on/user: p50, p90, p95, p99; tách Free/Premium và catalog/custom.
- Gemini prompt/output/thinking tokens, correction rate, error/fallback rate.
- Cloudinary new GB, total managed storage, bandwidth, transformations, asset age; số asset cleanup thành công/thất bại.
- MongoDB ops/s p95, storage/index size, vector search latency, connections, CPU/memory.
- Render CPU/RAM/request latency/concurrency/egress; Vercel transfer/edge requests.
- Doanh thu gross/net theo channel: payOS web, Apple, Google; refund, failed payment và store fee.

Sau 30 ngày, dùng công thức:

```text
Actual COGS/user
= (PiAPI invoice + Gemini invoice + Cloudinary usage-related cost)
 / MAU

Contribution margin
= (net subscription revenue - variable AI/media cost)
 / net subscription revenue
```

Không dùng số account đăng ký làm mẫu số vì account không active sẽ làm cost/user trông thấp giả tạo.

## 10. Những khoản chưa được cộng — cần báo giá riêng

- Lương/contractor/on-call, customer support và content moderation.
- Marketing/CAC, promotion, affiliate và commission cho shop.
- Thành lập doanh nghiệp, kế toán, hóa đơn điện tử, tư vấn thuế, VAT/withholding tax; cần tư vấn theo pháp nhân và invoice thực tế.
- Privacy policy/terms, DPA, security review, penetration test và xử lý dữ liệu ảnh cơ thể.
- Refund/chargeback/fraud, email/SMS/OTP nếu bổ sung sau này.
- Backup/DR ngoài tier nêu trên, observability trả phí, support SLA và multi-region.
- Chi phí phát triển StoreKit/Google Play Billing và migration subscription.

Các khoản này không phải bằng 0; chúng được để ở trạng thái **TBD cần quote** để tránh tạo một con số không có evidence.

## 11. Quyết định đề xuất

1. Trước pilot: khóa endpoint, clamp `batchSize=1`, atomic quota, rate limit và hard spending alert.
2. Pilot 100–1.000 MAU: dùng Creator/Pro PiAPI tùy concurrency, Render Starter, Atlas Flex, Vercel Pro, Cloudinary Free; đặt ngân sách tối thiểu theo cột `Budget +10%`.
3. Thay Premium “unlimited 49k” bằng quota đo được. Điểm khởi đầu có căn cứ chi phí là khoảng **10 try-on + 4 Stylist/30 ngày**; bán thêm theo credit.
4. Cleanup Cloudinary 7 ngày trước khi chạy campaign; nếu không, bảng Cloudinary hoàn toàn không còn đúng sau vài tháng.
5. Trước 10.000 MAU: load test, bật queue/worker, chọn Mongo dedicated, chuẩn bị Render multi-instance và kiểm tra PiAPI concurrency/top-up contract.
6. Nếu phát hành mobile có bán plan trong app: tích hợp IAP và đưa 15% store fee vào pricing; không dựa vào payOS-only flow.

---

### Ghi chú về độ tin cậy

- **Giá vendor:** evidence chính thức, kiểm tra ngày 03/08/2026.
- **Kiến trúc và lỗ hổng cost:** đọc trực tiếp từ repository hiện tại.
- **Usage/user, token/request, kích thước ảnh và instance capacity:** giả định có công thức, không phải số đo production.
- **Bảng tổng:** là budget estimate có thể audit và thay input, không phải invoice forecast được bảo đảm.
