# MIROIR - Tài liệu kiến trúc và luồng hoạt động kỹ thuật

Tài liệu này dành cho developer, technical lead, solution architect hoặc người review kỹ thuật. Nội dung tập trung vào kiến trúc hệ thống, module backend, luồng dữ liệu chính, tích hợp bên thứ ba, phân quyền, AI retrieval, payment, analytics và các điểm cần chú ý khi vận hành/mở rộng.

## 1. Tổng quan kiến trúc

MIROIR hiện là hệ thống full-stack gồm:

- `frontend/`: React SPA cho user, shop owner và admin.
- `mobile/`: Flutter app cho user và shop owner.
- `backend/`: Node.js/Express API, đóng vai trò orchestration layer.
- MongoDB: persistence chính, đồng thời dùng MongoDB Atlas Vector Search cho retrieval.
- Third-party services:
  - Cloudinary: object/media hosting cho ảnh.
  - PiAPI/Kling: async virtual try-on task.
  - Google Gemini: embedding + generation cho AI Stylist.
  - PayOS: checkout/payment/webhook.

Sơ đồ logic:

```text
React Web / Flutter Mobile
        |
        | HTTP JSON / multipart-form / Bearer token
        v
Node.js Express Backend
        |
        |-- MongoDB: users, shops, products, payments, events, embeddings
        |-- Cloudinary: image upload/storage
        |-- PiAPI: virtual try-on async task
        |-- Gemini: embeddings + stylist generation
        |-- PayOS: checkout link + webhook verification
```

Backend là điểm tập trung business rules. Frontend/mobile không tự quyết định quyền Premium, giá gói, trạng thái thanh toán, analytics, eligibility catalog hay kết quả AI hợp lệ.

## 2. Runtime và entrypoint backend

Entrypoint backend: `backend/server.js`.

Các bước khởi động chính:

1. Load environment variables bằng `dotenv.config()`.
2. Kiểm tra env bắt buộc:
   - `PIAPI_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Configure Cloudinary.
4. Khởi tạo Express app.
5. Bật CORS theo:
   - `FRONTEND_URL`
   - localhost/127.0.0.1 dev origins
   - Vercel preview origin cùng project slug
6. Mount routes dưới `/api`.
7. Global error handler xử lý lỗi file size, file type, `.xlsx`, và lỗi chung.

Route mount hiện tại:

```js
app.use("/api/tryon", tryOnRoutes);
app.use("/api/stylist", stylistRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/user-auth", userAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shop-auth", shopAuthRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/shop-products", shopProductRoutes);
```

Health endpoint:

```http
GET /api/health
```

## 3. Layering backend

Backend đi theo pattern tương đối rõ:

```text
routes -> middlewares -> controllers -> services -> MongoDB / third-party
```

### Routes

Routes khai báo endpoint, middleware auth/subscription/upload và controller handler.

Ví dụ:

- `backend/routes/shop.routes.js`
- `backend/routes/shopProduct.routes.js`
- `backend/routes/catalog.routes.js`
- `backend/routes/payment.routes.js`

### Middlewares

Middlewares xử lý cross-cutting concerns:

- Auth:
  - `userAuth.middleware.js`
  - `shopAuth.middleware.js`
  - `adminAuth.middleware.js`
  - `paymentAuth.middleware.js`
- Subscription/entitlement:
  - `subscription.middleware.js`
- File upload:
  - `upload.middleware.js`

### Controllers

Controllers nhận `req`, chuẩn hóa input mức request, gọi service, trả response.

Controllers không nên chứa quá nhiều business logic nặng. Logic chính đang nằm ở services.

### Services

Services chứa business rules và tích hợp:

- Auth: `userAuth.service.js`, `shopAuth.service.js`, `adminAuth.service.js`
- Catalog: `catalog.service.js`
- Products/import: `product.service.js`, `productImport.service.js`
- Shop: `shop.service.js`, `shopAnalytics.service.js`
- AI: `gemini.service.js`, `retrieval.service.js`, `embeddingText.service.js`
- Try-on: `piapi.service.js`, `cloudinary.service.js`
- Payments: `payment.service.js`, `subscription.service.js`
- Admin: `admin.service.js`

## 4. Frontend web architecture

Frontend là React SPA, build bằng Vite.

Các API client nằm trong:

- `frontend/src/api/userApi.js`
- `frontend/src/api/shopApi.js`
- `frontend/src/api/adminApi.js`
- `frontend/src/api/catalogApi.js`
- `frontend/src/api/stylistApi.js`
- `frontend/src/api/tryonApi.js`

Token được lưu ở `localStorage` theo từng role:

- User: `miroir_user_token`
- Shop owner: `miroir_shop_owner_token`
- Admin: `miroir_admin_token`

Frontend dùng Axios instance theo từng nhóm API, tự gắn `Authorization: Bearer <token>` nếu có.

Các trang chính:

- User app: `UserAppPage.jsx`, `TryOnStudioPage.jsx`, `StylistPage.jsx`
- Shop owner: `ShopDashboardPage.jsx`, `ShopAuthPage.jsx`
- Admin: `AdminDashboardPage.jsx`, `AdminLoginPage.jsx`
- Payment callback: `PaymentResultPage.jsx`

Frontend không giữ source of truth cho subscription. Nó chỉ render dựa trên response từ backend/payment profile.

## 5. Mobile architecture

Mobile app dùng Flutter/Dart.

Các service HTTP chính:

- `mobile/lib/core/network/api_client.dart`
- `mobile/lib/features/customer/data/customer_service.dart`
- `mobile/lib/features/marketplace/data/catalog_service.dart`
- `mobile/lib/features/try_on/data/try_on_service.dart`
- `mobile/lib/features/stylist/data/stylist_service.dart`
- `mobile/lib/features/payments/data/payment_service.dart`
- `mobile/lib/features/account/data/owner_shop_service.dart`

State/session:

- `AppSessionController` giữ user/shop token và trạng thái subscription.
- `shared_preferences` dùng để persist token local.
- Dio dùng cho HTTP.

Mobile cũng gọi cùng backend API như web. Không có backend riêng cho mobile.

## 6. Data model cấp cao

Các collection quan trọng trong MongoDB:

| Collection | Vai trò |
| --- | --- |
| `users` | Tài khoản user, profile, subscription |
| `shop_owners` | Tài khoản shop owner, approval status, subscription |
| `admins` | Tài khoản admin |
| `shops` | Shop profile, ownerId, status |
| `products` | Catalog product, shopId, status, availability, embedding |
| `outfits` | Outfit mẫu, có thể tham gia retrieval |
| `fashion_rules` | Rule/style knowledge, có thể tham gia retrieval |
| `payment_plans` | Override cấu hình plan |
| `payment_orders` | Payment order, PayOS info, status |
| `shop_events` | Event analytics của shop |
| `product_feedback_reviews` | Review/raw feedback |
| `product_review_summaries` | Summary review theo product |
| `tryon_usage` hoặc usage liên quan subscription | Đếm quota try-on free theo tháng |

Các entity thường dùng field `id` dạng UUID/string riêng, không phụ thuộc trực tiếp vào Mongo `_id` trong API public.

## 7. Auth và authorization

### User/shop/admin auth

Ba nhóm tài khoản có auth flow riêng:

- User: `/api/user-auth`
- Shop owner: `/api/shop-auth`
- Admin: `/api/admin-auth`

Mật khẩu được hash bằng `bcryptjs`. Sau login, backend cấp JWT bằng `jsonwebtoken`.

JWT payload phân biệt account type hoặc context tùy service:

- User token cho user APIs.
- Shop owner token cho shop APIs.
- Admin token cho admin APIs.

Middleware tương ứng verify token và attach account vào request:

- `req.user`
- `req.owner`
- `req.admin`

### Permission model

Permission hiện dựa trên:

- Role/token type.
- Account status.
- Subscription state.
- Resource ownership.

Ví dụ:

- Shop owner chỉ sửa shop/product thuộc owner đó.
- User Free bị chặn AI Stylist và bị quota try-on.
- Shop owner chưa Premium bị chặn create/update/upload/import product và analytics.
- Admin có API riêng để quản lý shop/product/payment plan.

## 8. Subscription và entitlement

Plan mặc định:

- `USER_PREMIUM_MONTHLY`
- `SHOP_OWNER_MONTHLY`

Service chính:

- `backend/services/subscription.service.js`
- `backend/services/payment.service.js`

Subscription được lưu trực tiếp trong document `users` hoặc `shop_owners`:

```js
subscription: {
  planCode,
  status: "active",
  expiresAt,
  lastPaymentOrderCode,
  updatedAt
}
```

Entitlement summary được build ở backend để frontend/mobile render:

- `isPremium`
- plan/status/expiresAt
- usage/quota với user try-on nếu áp dụng

### User Premium

Cho phép:

- Dùng AI Stylist.
- Try-on không bị quota free.
- Xem shop info đầy đủ nếu backend trả.

### Shop owner Premium

Cho phép:

- Create/update/upload/import product.
- Xem analytics.
- Xem customer insights.
- Product được premium boost trong marketplace/retrieval.

## 9. Payment flow với PayOS

Service chính: `backend/services/payment.service.js`.

### Create checkout

Luồng:

1. Client gọi `POST /api/payments/create` với token user hoặc shop owner.
2. `paymentAuth.middleware.js` xác định account type.
3. Backend lấy plan bằng `getPaymentPlan`.
4. Kiểm tra `plan.accountType === account.accountType`.
5. Tạo `payment_orders` status `pending`.
6. Gọi PayOS `paymentRequests.create`.
7. Lưu `checkoutUrl`, `paymentLinkId`, raw response.
8. Trả `checkoutUrl` cho client.

Order code được tạo từ timestamp + random, ép tối đa 15 chữ số.

### Webhook

Endpoint webhook verify qua PayOS SDK:

1. PayOS gửi webhook.
2. Backend gọi `payos.webhooks.verify(body)`.
3. Tìm `payment_orders` theo `orderCode`.
4. Nếu order đã `paid`, trả `alreadyProcessed`.
5. Nếu success/code/amount hợp lệ, gọi `activateSubscription`.
6. Nếu không hợp lệ, mark failed.

`activateSubscription`:

- Lấy plan duration.
- Nếu subscription hiện tại còn hạn, cộng dồn từ `currentExpiresAt`.
- Nếu đã hết hạn, bắt đầu từ `now`.
- Update `users` hoặc `shop_owners`.
- Update `payment_orders.status = "paid"`.

### Payment status sync

`GET /api/payments/status/:orderCode` có fallback sync với PayOS nếu order đang `pending` hoặc `failed`.

Điểm này giúp xử lý trường hợp webhook đến chậm hoặc user quay lại app trước khi webhook được xử lý.

## 10. Catalog và marketplace eligibility

Catalog public đi qua `catalog.service.js`.

Các rule chính:

- Chỉ product thuộc shop active.
- Product phải `status === "published"`.
- Product phải còn hàng (`availability === "in_stock"` hoặc compatible legacy value).
- Filter theo search/category/gender/minPrice/maxPrice/shopId.
- Gender filter có thể include `unisex`.
- Sort có premium shop boost, sau đó theo updated time.

Shop info visibility:

- Anonymous/free user không thấy đầy đủ shop info.
- Premium user có thể thấy shop info đầy đủ theo response backend.

Catalog product detail ghi event `product_view` cho shop analytics.

## 11. Product management và import/export

Shop owner product APIs:

- `/api/shop-products`
- Cần shop owner token.
- Các mutation quan trọng cần active shop subscription.

Product status:

- `draft`
- `published`
- `archived`
- `trashed`

Availability:

- `in_stock`
- `out_of_stock`

Khi field liên quan embedding thay đổi, product được set:

```js
embeddingStale = true
embeddingTextHash = null
embeddingUpdatedAt = null
```

Điều này cho phép batch job embed lại sản phẩm sau.

### Excel import

Service:

- `productImport.service.js`
- `xlsxImage.service.js`
- `admin.service.js` cho admin import/export.

Flow:

1. Upload `.xlsx` qua Multer.
2. Parse workbook bằng `xlsx`.
3. Normalize rows.
4. Validate required fields/enums/ownership.
5. Insert/update products.
6. Lưu import job/result hoặc trả result.

Admin import/export rộng hơn shop owner import vì admin có quyền thao tác nhiều shop và export mode `all/missing`.

## 12. Image upload flow

Multer nhận file upload trong backend.

Cloudinary service:

- `configureCloudinary()`
- `uploadImageBuffer(...)`

Flow:

```text
Client file upload
 -> Express route + Multer memory storage
 -> service receives buffer
 -> Cloudinary upload
 -> secure_url/public_id
 -> MongoDB stores URL/publicId
```

Ứng dụng:

- Product image upload.
- User profile/model image.
- Try-on input images.
- Remote product image upload lại sang Cloudinary trước khi gửi PiAPI.

## 13. Try-on architecture

Services/controllers:

- `backend/controllers/tryon.controller.js`
- `backend/services/piapi.service.js`
- `backend/services/cloudinary.service.js`
- `backend/utils/findResultUrl.js`

Có 3 flow:

1. Legacy standalone `POST /api/tryon`
2. Catalog try-on `POST /api/tryon/catalog`
3. Custom try-on `POST /api/tryon/custom`

### Catalog try-on flow

1. User gửi `productId`, optional model image.
2. Backend lấy user raw profile và product detail.
3. Nếu request có model image mới, upload lên Cloudinary.
4. Nếu không có, dùng `user.profile.modelImageUrl`.
5. Product image được fetch remote rồi upload lại lên Cloudinary để có URL ổn định.
6. Backend suy luận `tryOnType`:
   - dress/jumpsuit/one-piece -> `dress`
   - lower category -> `upper_lower` với lower input
   - còn lại -> `upper_lower` với upper input
7. Gọi PiAPI create task.
8. Nếu user Free, increment monthly try-on usage.
9. Ghi `shop_events` event `tryon_started`.
10. Trả `taskId`.

### Polling status

Client poll:

```http
GET /api/tryon/:taskId
```

Backend gọi PiAPI get status, normalize response:

- `pending`
- `completed` + `resultUrl`
- `failed` + `errorMessage`

`findResultUrl.js` chịu trách nhiệm tìm URL output trong nhiều response shape khác nhau.

## 14. AI Stylist architecture

Controller:

- `backend/controllers/stylist.controller.js`

Services:

- `retrieval.service.js`
- `gemini.service.js`
- `groundingValidation.service.js`
- `fashionMemory.service.js`
- `reviewSummary.service.js`

### High-level flow

```text
User prompt/profile
 -> build retrieval request
 -> load user fashion memory
 -> generate embedding for query text
 -> MongoDB vector search products/outfits/fashion_rules
 -> filter/rerank products
 -> build Gemini generation payload
 -> Gemini returns recommendation JSON
 -> validate product IDs
 -> enrich with backend product details
 -> track shop recommendation events
 -> response to client
```

### Retrieval

`retrieveStylistContext`:

1. Build query text từ prompt, occasion, gender, body shape, skin tone, style preferences, feedback và memory.
2. Generate embedding bằng Gemini.
3. Vector search song song:
   - `products`
   - `outfits`
   - `fashion_rules`
4. Product vector search có filter:
   - budget min/max
   - gender/unisex
   - availability in stock
5. Sau vector search:
   - lọc product `published`
   - lọc product có `shopId`
   - chỉ giữ shop active
   - attach public shop summary
6. Load review summaries.
7. Rerank bằng rule-based score:
   - style tag match
   - occasion tag match
   - favorite colors
   - liked/disliked styles
   - fit preference
   - review fit signals
   - premium shop boost `+0.08`
8. Sort theo `rerankScore`, slice top 30.

### Generation

`recommendOutfit` build payload gồm:

- prompt
- user profile
- user memory
- retrieved products top 18
- review summaries
- retrieved outfits
- fashion rules
- output rules với `allowedProductIds`

Gemini được yêu cầu trả structured recommendation. Nếu generation fail, backend fallback bằng catalog ranking.

### Grounding validation

Backend kiểm tra product IDs trong response Gemini:

- Nếu có invalid product ID, retry Gemini với correction.
- Nếu vẫn invalid, trả `502`.
- Sau đó enrich recommendation bằng product details từ retrieved context.

Điểm quan trọng: AI output không được tin tuyệt đối; backend validate để tránh hallucination product.

### Analytics side effect

Sau khi recommendation được enrich, backend dedupe product được recommend và ghi event:

```text
stylist_product_recommended
```

Event này phục vụ shop analytics và customer insights.

## 15. Embedding pipeline

Script:

```bash
npm run embed:products
npm run embed:outfits
npm run embed:fashion-rules
```

Entry:

- `backend/scripts/embedCollection.js`

Embedding text được build trong:

- `embeddingText.service.js`

Quy trình:

1. Lấy document từ collection.
2. Build text đại diện.
3. Hash text để phát hiện thay đổi.
4. Nếu hash không đổi và đã có embedding, skip.
5. Nếu product có `embeddingStale`, embed lại.
6. Gọi Gemini embedding.
7. Update:
   - `embedding`
   - `embeddingTextHash`
   - `embeddingUpdatedAt`
   - `embeddingStale = false` với product

MongoDB cần vector index tương ứng:

- `products_embedding_index`
- `outfits_embedding_index`
- `fashion_rules_embedding_index`

Tên index có thể override bằng env:

- `MONGODB_PRODUCT_VECTOR_INDEX`
- `MONGODB_OUTFIT_VECTOR_INDEX`
- `MONGODB_FASHION_RULE_VECTOR_INDEX`

## 16. Shop analytics architecture

Service:

- `backend/services/shopAnalytics.service.js`

Event store:

- `shop_events`

Event types chính:

- `product_view`
- `tryon_started`
- `stylist_product_recommended`
- `product_feedback`

### Event producers

| Event | Producer |
| --- | --- |
| `product_view` | `catalog.controller.getProduct` |
| `tryon_started` | `tryon.controller.createCatalogTryOnTask` |
| `stylist_product_recommended` | `stylist.controller.recommendOutfit` |
| `product_feedback` | `productFeedback.service.submitProductFeedback` |

### Analytics endpoint

```http
GET /api/shops/me/analytics?range=7d|30d|90d
```

Yêu cầu:

- shop owner auth
- active shop subscription
- owner có shop

Backend đọc:

- products theo `shopId`
- events theo `shopId` + `createdAt >= start`

Tính:

- product inventory summary
- engagement counts
- conversion rate
- top products theo total engagement
- average rating từ feedback events

### Insights endpoint

```http
GET /api/shops/me/insights?range=7d|30d|90d
```

Chỉ dùng events:

- `tryon_started`
- `stylist_product_recommended`
- `product_feedback`

Privacy threshold:

```js
PRIVACY_THRESHOLD = 3
```

Nếu event count hoặc distinct user count < 3, trả `enoughData: false`.

Nếu đủ, trả breakdown:

- gender
- bodyShape
- skinTone
- stylePreferences
- occasions
- budgetBuckets
- styleTags
- colors
- ratings

## 17. Product feedback và review summaries

Service:

- `productFeedback.service.js`
- `reviewSummary.service.js`

Flow:

1. User gửi rating/comment/fitFeedback/context.
2. Backend validate rating 1-5.
3. Tìm product.
4. Insert `product_feedback_reviews`.
5. Query toàn bộ reviews của product.
6. Build summary:
   - `ratingCount`
   - `averageRating`
   - `summary`
   - `fitSignals`
   - `commonFeedback`
7. Upsert `product_review_summaries`.
8. Track `product_feedback` event cho shop analytics.

Review summaries cũng được dùng làm tín hiệu rerank trong AI Stylist.

## 18. Admin architecture

Admin API nằm dưới:

```http
/api/admin
/api/admin-auth
```

Admin capabilities:

- Shop owner approval/reject/deactivate.
- Shop CRUD/deactivate.
- Product CRUD theo shop.
- Product archive/restore/trash.
- Excel import/export.
- Payment plan management.

Admin service gom nhiều business rules:

- Validate shop owner active trước khi assign shop.
- Validate một owner không có nhiều shop.
- Validate product ownership theo shop.
- Validate import row.
- Mark `embeddingStale` khi dữ liệu product thay đổi.

Admin dashboard web hiện là consumer chính của admin APIs.

## 19. Environment variables quan trọng

Nhóm backend:

| Env | Vai trò |
| --- | --- |
| `PORT` | Port backend |
| `FRONTEND_URL` | Origin frontend production |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB_NAME` | Database name |
| `JWT_SECRET` | Secret ký user/shop JWT |
| `ADMIN_JWT_SECRET` | Secret ký admin JWT, fallback `JWT_SECRET` |
| `JWT_EXPIRES_IN` | JWT expiry |
| `PIAPI_KEY` | API key PiAPI |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud |
| `CLOUDINARY_API_KEY` | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret |
| `CLOUDINARY_FOLDER` | Folder upload optional |
| `GEMINI_API_KEY` | Google Gemini key |
| `GEMINI_EMBEDDING_MODEL` | Embedding model override |
| `GEMINI_GENERATION_MODEL` | Generation model override |
| `PAYOS_CLIENT_ID` | PayOS client |
| `PAYOS_API_KEY` | PayOS key |
| `PAYOS_CHECKSUM_KEY` | PayOS webhook/checksum key |
| `PAYMENT_RETURN_URL` | Return URL sau payment |
| `PAYMENT_CANCEL_URL` | Cancel URL sau payment |
| `MONGODB_PRODUCT_VECTOR_INDEX` | Product vector index override |
| `MONGODB_OUTFIT_VECTOR_INDEX` | Outfit vector index override |
| `MONGODB_FASHION_RULE_VECTOR_INDEX` | Fashion rules vector index override |

Nhóm frontend:

| Env | Vai trò |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL backend API |

Không commit secret thật vào Git.

## 20. Deployment notes

Repo có dấu hiệu deploy split:

- Frontend: Vercel (`frontend/vercel.json`).
- Backend: Render (`render.yaml`, `DEPLOY_BACKEND_RENDER.md`).
- MongoDB Atlas: DB + vector search.
- Cloudinary/PiAPI/Gemini/PayOS: managed external services.

CORS backend có support Vercel preview origin cùng project slug, nhưng production cần `FRONTEND_URL` đúng.

Khi deploy backend cần đảm bảo:

- Env bắt buộc không thiếu.
- MongoDB network access cho hosting provider.
- Webhook PayOS trỏ đúng backend public URL.
- Payment return/cancel URLs trỏ đúng frontend public URL.
- Vector indexes đã tạo trước khi dùng AI Stylist retrieval.

## 21. Error handling và failure modes

### Try-on

Failure points:

- Upload ảnh lỗi.
- Product thiếu imageUrl.
- Remote product image không tải được hoặc không phải image.
- PiAPI create task lỗi.
- PiAPI status timeout.
- Task failed.

Backend đã normalize một số lỗi, nhưng UX phụ thuộc client polling.

### Gemini

Failure points:

- Missing `GEMINI_API_KEY`.
- Embedding/generation timeout/error.
- Response không parse được JSON.
- Response có product ID ngoài context.

Backend có fallback catalog ranking khi generation fail, và có validation/retry cho invalid product IDs.

### Payment

Failure points:

- PayOS env missing.
- Create checkout fail.
- Webhook đến chậm hoặc không đến.
- Webhook amount/status không khớp.

Backend có status sync với PayOS khi client hỏi order status.

### Analytics

Failure points:

- Shop owner chưa có shop.
- Shop owner chưa Premium.
- Event thiếu userId làm insights không đủ distinct users.
- Dữ liệu thấp hơn privacy threshold.

## 22. Technical debt và điểm cần kiểm tra

Các điểm nên review trước production:

- `GET /api/debug/piapi-key` đang expose prefix/suffix/length của key; nên disable/remove ở production.
- Legacy `POST /api/tryon` có thể không cùng auth/subscription gate với catalog/custom try-on; cần quyết định có giữ public không.
- Mobile có flow gọi `/api/shops/upload-image` trong service, cần verify backend route tương ứng đã có hay chưa.
- `GET /api/payments/status/:orderCode` không nhất thiết auth theo behavior hiện tại; cần đánh giá bảo mật.
- `POST /api/stylist/feedback` cần kiểm tra auth expectation nếu feedback gắn user memory.
- Cần có index MongoDB phù hợp cho các query/filter thường dùng ngoài vector index.
- Cần lifecycle/job rõ ràng để chạy embed lại product có `embeddingStale`.
- Analytics hiện event store đơn giản; khi traffic lớn nên cân nhắc aggregation/indexing hoặc pre-compute.
- Product view hiện không gắn `userId`, nên không tham gia insights privacy distinct user count.

## 23. Gợi ý mở rộng kiến trúc

Nếu hệ thống tăng traffic hoặc scope:

- Tách async jobs:
  - embedding job
  - analytics aggregation job
  - try-on callback/poll worker
  - import Excel job queue
- Thêm queue:
  - BullMQ/Redis hoặc managed queue
- Thêm object validation:
  - Zod/Joi cho request payload
- Chuẩn hóa response/error contract.
- Thêm observability:
  - structured logging
  - request id
  - metrics cho PiAPI/Gemini/PayOS latency/error rate
- Thêm integration tests cho các flow chính:
  - auth
  - payment webhook idempotency
  - shop product ownership
  - catalog eligibility
  - stylist grounding validation
- Thêm migration/index management cho MongoDB.

## 24. Luồng end-to-end quan trọng

### User Free -> Premium -> Stylist

```text
Register/Login
 -> profile onboarding
 -> marketplace
 -> try-on quota free
 -> payment create USER_PREMIUM_MONTHLY
 -> PayOS checkout
 -> webhook/status sync
 -> users.subscription active
 -> AI Stylist allowed
 -> retrieval + Gemini generation
```

### Shop owner -> product -> marketplace -> analytics

```text
Shop owner register
 -> admin approve
 -> shop owner login
 -> create shop
 -> payment create SHOP_OWNER_MONTHLY
 -> subscription active
 -> create/import product
 -> publish product
 -> product appears in catalog if shop active + in stock
 -> user views/try-ons/feedback/stylist
 -> shop_events accumulated
 -> analytics/insights generated on demand
```

### Stylist recommendation

```text
Premium user request
 -> build query text
 -> Gemini embedding
 -> MongoDB vector search
 -> eligibility filter active shop + published + stock
 -> rerank with profile/memory/review/premium boost
 -> Gemini generation with allowedProductIds
 -> grounding validation
 -> enrich products
 -> track recommendation events
 -> return recommendation
```

### Payment idempotency

```text
payment_orders pending
 -> PayOS webhook
 -> verify checksum
 -> find order
 -> if already paid: no-op
 -> validate success + code + amount
 -> activate subscription
 -> mark order paid
```

## 25. Kết luận kỹ thuật

MIROIR hiện đi theo kiến trúc monolithic backend + multi-client frontend/mobile. Backend là orchestration layer tích hợp database, media storage, AI services và payment. Các boundary nghiệp vụ tương đối rõ: auth/subscription, catalog eligibility, product management, try-on, stylist retrieval/generation, payment và analytics.

Điểm kỹ thuật cốt lõi của hệ thống nằm ở:

- Entitlement/subscription gate thống nhất cho user/shop owner.
- Catalog eligibility bảo đảm chỉ sản phẩm hợp lệ xuất hiện public.
- AI Stylist dùng retrieval + grounding validation để hạn chế hallucination.
- Try-on xử lý async task qua PiAPI.
- Shop analytics dựa trên event tracking thay vì số liệu nhập tay.
- Payment có webhook idempotency và status sync fallback.
