# MIROIR - Danh sách chức năng hệ thống để verify

Tài liệu này tổng hợp chức năng hiện có từ frontend web, backend API và mobile Flutter trong repo. Dùng như checklist verify end-to-end theo từng vai trò.

## 1. Phạm vi hệ thống

- [ ] Web frontend: landing, auth, user app, try-on studio, shop dashboard, admin dashboard, payment result.
- [ ] Backend API: auth, catalog, try-on, stylist, user profile/favorites, shop owner, shop products, admin, payment/subscription, analytics/insights.
- [ ] Mobile Flutter: customer auth/onboarding, marketplace, favorites, try-on, stylist, account, shop owner center, payment/paywall.
- [ ] Tích hợp ngoài: MongoDB, Cloudinary upload, PiAPI try-on, Gemini/embedding/stylist retrieval, PayOS payment.

## 2. Vai trò và quyền

### Guest/anonymous

- [ ] Xem landing page.
- [ ] Truy cập trang login/register.
- [ ] Xem catalog sản phẩm public nếu endpoint public được gọi không có token.
- [ ] Không xem chi tiết shop premium-only.
- [ ] Không favorite, feedback, try-on catalog/custom, stylist, profile, payment cá nhân nếu chưa đăng nhập.

### User thường

- [ ] Đăng ký tài khoản user.
- [ ] Đăng nhập user.
- [ ] Lấy thông tin user hiện tại.
- [ ] Hoàn tất onboarding profile hoặc skip profile.
- [ ] Upload ảnh model/profile.
- [ ] Xem marketplace sản phẩm.
- [ ] Tìm kiếm/lọc/pagination sản phẩm.
- [ ] Xem outfits.
- [ ] Favorite/unfavorite sản phẩm.
- [ ] Xem danh sách favorites.
- [ ] Xem modal/detail sản phẩm.
- [ ] Gửi feedback/rating sản phẩm.
- [ ] Try-on sản phẩm catalog trong quota free.
- [ ] Try-on custom garment trong quota free.
- [ ] Theo dõi trạng thái task try-on.
- [ ] Xem quota try-on free 5 lượt/tháng.
- [ ] Bị chặn và thấy CTA nâng cấp khi hết quota.
- [ ] Không dùng AI stylist nếu chưa Premium.
- [ ] Không xem thông tin shop đầy đủ nếu chưa Premium.
- [ ] Tạo thanh toán gói `USER_PREMIUM_MONTHLY`.
- [ ] Kiểm tra trạng thái thanh toán sau redirect.

### User Premium

- [ ] Có `subscription.isPremium = true` khi gói còn hạn.
- [ ] Dùng try-on không bị giới hạn 5 lượt/tháng.
- [ ] Dùng AI stylist recommendation.
- [ ] Xem thông tin shop trên product/shop detail nếu backend trả về.
- [ ] Gửi feedback từ product detail, try-on result hoặc stylist context.
- [ ] Product list vẫn lọc/sắp xếp đúng, có shop info khi đủ quyền.

### Shop owner

- [ ] Đăng ký shop owner.
- [ ] Đăng nhập shop owner.
- [ ] Trạng thái shop owner mới có thể là pending và cần admin duyệt.
- [ ] Xem dashboard shop owner.
- [ ] Tạo shop của mình.
- [ ] Chỉ có tối đa một shop cho một shop owner theo service hiện tại.
- [ ] Cập nhật shop profile: name, slug, description, logoUrl, coverUrl, contact, status.
- [ ] Deactivate shop của mình.
- [ ] Xem danh sách sản phẩm shop.
- [ ] Xem trạng thái subscription shop owner.
- [ ] Tạo thanh toán gói `SHOP_OWNER_MONTHLY`.
- [ ] Nếu chưa có subscription active: bị chặn create/update/upload/import product, analytics, insights.

### Shop owner Premium

- [ ] Tạo sản phẩm.
- [ ] Cập nhật sản phẩm.
- [ ] Upload ảnh sản phẩm lên Cloudinary.
- [ ] Archive sản phẩm.
- [ ] Restore sản phẩm.
- [ ] Move to trash sản phẩm.
- [ ] Hard delete sản phẩm nếu dùng API permanent/mobile flow.
- [ ] Download Excel import template.
- [ ] Import sản phẩm từ Excel.
- [ ] Xem kết quả import: status, totalRows, successCount, failedCount, errors.
- [ ] Xem analytics theo range `7d`, `30d`, `90d`.
- [ ] Xem customer insights ẩn danh theo range `7d`, `30d`, `90d`.
- [ ] Product của shop premium được ưu tiên hiển thị trong marketplace/retrieval theo logic backend.

### Admin

- [ ] Đăng nhập admin.
- [ ] Lấy thông tin admin hiện tại.
- [ ] Xem danh sách shop owners theo status.
- [ ] Approve shop owner.
- [ ] Reject shop owner.
- [ ] Deactivate shop owner.
- [ ] Xem danh sách shops, tìm kiếm, lọc status.
- [ ] Tạo shop.
- [ ] Assign shop cho active shop owner.
- [ ] Cập nhật shop.
- [ ] Deactivate/delete shop.
- [ ] Mở shop để quản lý sản phẩm.
- [ ] Xem sản phẩm theo shop.
- [ ] Tìm kiếm/lọc sản phẩm theo status/category/missing enrichment.
- [ ] Tạo sản phẩm cho shop.
- [ ] Cập nhật sản phẩm cho shop.
- [ ] Archive sản phẩm.
- [ ] Restore sản phẩm về draft.
- [ ] Move to trash sản phẩm.
- [ ] Export products Excel: all.
- [ ] Export products Excel: missing enrichment.
- [ ] Import products Excel.
- [ ] Xem kết quả import Excel.
- [ ] Xem danh sách payment plans.
- [ ] Cập nhật payment plan: name, description, amount, durationDays, features.

## 3. Web frontend routes cần verify

- [ ] `/`: redirect theo token admin/shop/user hoặc hiển thị landing page.
- [ ] `/login`: unified auth page cho user/shop/admin tùy tab/role.
- [ ] `/register`: unified register page cho user/shop.
- [ ] `/onboarding/profile`: onboarding profile user.
- [ ] `/app` và `/app/products`: user product marketplace.
- [ ] `/app/outfits`: user outfits.
- [ ] `/app/favorites`: user favorites.
- [ ] `/app/stylist`: AI stylist trong user app.
- [ ] `/app/try-on`: try-on studio trong app.
- [ ] `/app/profile`: user profile.
- [ ] `/app/shops/:shopId`: public/premium shop page.
- [ ] `/try-on`: standalone try-on studio.
- [ ] `/stylist`: redirect sang `/app/stylist`.
- [ ] `/shop/register`: register shop owner.
- [ ] `/shop/dashboard`: shop owner dashboard.
- [ ] `/admin/dashboard`: admin dashboard.
- [ ] `/payment/success`: payment result success.
- [ ] `/payment/cancel`: payment result cancel.

## 4. User app features

- [ ] Load user bằng token từ localStorage key `miroir_user_token`.
- [ ] Logout xóa user token.
- [ ] Hiển thị banner subscription Free/Premium.
- [ ] Hiển thị quota try-on free nếu có `subscription.usage`.
- [ ] CTA upgrade lấy giá từ payment plans, fallback 49.000 VND.
- [ ] Tạo checkout và redirect sang PayOS checkout URL.
- [ ] Product tab: gọi catalog products.
- [ ] Product filters: search, category, gender, minPrice, maxPrice.
- [ ] Pagination prev/next.
- [ ] Product card: ảnh, tên, giá, tags/status liên quan.
- [ ] Product detail modal.
- [ ] Favorite toggle từ card/detail.
- [ ] Try-on từ product mở try-on studio với product được chọn.
- [ ] Favorites tab load từ `/users/me/favorites`.
- [ ] Outfits tab load từ `/catalog/outfits`.
- [ ] Stylist tab lấy recommendation từ `/stylist/recommend`.
- [ ] Stylist bị paywall khi user chưa Premium.
- [ ] Profile tab cho sửa profile và upload profile photo.
- [ ] Profile fields: gender, bodyShape, skinTone, stylePreferences, height, weight, shoulder, bust, waist, hips.
- [ ] Product feedback form validate rating 1-5 và gửi đúng context.

## 5. Try-on features

- [ ] Standalone legacy try-on API `POST /api/tryon` vẫn tạo task với ảnh upload.
- [ ] Catalog try-on dùng `POST /api/tryon/catalog`.
- [ ] Custom try-on dùng `POST /api/tryon/custom`.
- [ ] Poll task bằng `GET /api/tryon/:taskId`.
- [ ] Try-on type `dress` yêu cầu model image và dress image, hoặc dùng model image đã lưu nếu có.
- [ ] Try-on type `upper_lower` yêu cầu model image và upper/lower image.
- [ ] Catalog try-on yêu cầu `productId` và garment image lấy từ product.
- [ ] Nếu product thiếu `imageUrl`, backend trả lỗi rõ ràng.
- [ ] Nếu user free hết quota, API trả `403` có `subscriptionRequired: true`.
- [ ] Sau khi task tạo thành công, free usage tăng đúng 1 lần.
- [ ] Kết quả completed có `resultUrl`.
- [ ] Failed task hiển thị lỗi.
- [ ] Feedback/rating chỉ hiện cho try-on từ catalog product, không hiện cho custom garment.

## 6. Stylist features

- [ ] User Premium gọi `POST /api/stylist/recommend`.
- [ ] User Free nhận `403` và frontend/mobile hiện paywall.
- [ ] Payload stylist dùng profile/user inputs: gender, body shape, skin tone, style preferences, occasion, budget, feedback.
- [ ] Backend retrieval dùng catalog/product data, style tags, budget và boost shop premium.
- [ ] Response có recommendation/outfit/products để render.
- [ ] Ghi event `stylist_product_recommended` cho analytics shop nếu product được recommend.
- [ ] Gửi stylist feedback bằng `POST /api/stylist/feedback`.

## 7. Catalog/shop public features

- [ ] `GET /api/catalog/products` chỉ trả product thuộc shop active, product published, availability `in_stock`.
- [ ] Filter `shopId`, `category`, `gender`, `minPrice`, `maxPrice`, `search`.
- [ ] Gender filter trả cả item `unisex`.
- [ ] Pagination giới hạn limit tối đa 48.
- [ ] Sort ưu tiên shop owner premium, sau đó `updatedAt`.
- [ ] Anonymous/free user không thấy shop info đầy đủ.
- [ ] Premium user thấy shop info đầy đủ nếu backend trả `product.shop`.
- [ ] `GET /api/catalog/products/:productId` trả detail product published/in_stock và shop active.
- [ ] `GET /api/catalog/outfits` hỗ trợ search/gender/pagination và map product trong outfit.
- [ ] `GET /api/catalog/shops/:shopId` trả public shop nếu premium, anonymous/free bị ẩn/chặn theo logic hiện tại.
- [ ] Product view/try-on/feedback/stylist events được ghi cho shop analytics.

## 8. Profile/favorites features

- [ ] `PUT /api/users/me/profile` lưu profile và đánh dấu profile completed.
- [ ] `PATCH /api/users/me/profile/skip` đánh dấu profile skipped.
- [ ] `POST /api/users/me/profile-photo` upload ảnh profile/model.
- [ ] `GET /api/users/me/favorites` trả danh sách favorite products.
- [ ] `POST /api/users/me/favorites/:productId/toggle` thêm/xóa favorite.
- [ ] Auth middleware chặn user inactive hoặc token sai/hết hạn.

## 9. Payment/subscription features

- [ ] `GET /api/payments/plans` trả danh sách plans hiện tại.
- [ ] Plan mặc định: `USER_PREMIUM_MONTHLY`, accountType `user`, 49.000 VND, 30 ngày.
- [ ] Plan mặc định: `SHOP_OWNER_MONTHLY`, accountType `shop_owner`, 349.000 VND, 30 ngày.
- [ ] Admin override plan trong collection `payment_plans`.
- [ ] `POST /api/payments/create` tạo PayOS order/link theo token hiện tại.
- [ ] User không mua được shop plan, shop owner không mua được user plan.
- [ ] Không nhận amount từ client khi tạo payment.
- [ ] `POST /api/payments/payos-webhook` verify webhook PayOS.
- [ ] Webhook paid active/cộng hạn subscription.
- [ ] Webhook lặp không cộng hạn nhiều lần.
- [ ] `GET /api/payments/status/:orderCode` sync status với PayOS khi pending/failed.
- [ ] `GET /api/payments/me` trả subscription summary hiện tại.
- [ ] Payment result page đọc `orderCode`, hiển thị paid/pending/cancelled/failed.

## 10. Shop owner dashboard features

- [ ] `GET /api/shops/me` trả shop của owner hiện tại.
- [ ] `POST /api/shops` tạo shop, validate name/slug unique.
- [ ] `PUT /api/shops/:id` cập nhật shop của owner.
- [ ] `DELETE /api/shops/:id` deactivate shop.
- [ ] `GET /api/shop-products` list product của owner, filter status/category/shopId nếu có.
- [ ] `GET /api/shop-products/:id` get product của owner.
- [ ] `POST /api/shop-products` tạo product, cần active subscription.
- [ ] `PUT /api/shop-products/:id` update product, cần active subscription.
- [ ] `POST /api/shop-products/upload-image` upload ảnh product, cần active subscription.
- [ ] `GET /api/shop-products/import-template` tải Excel template.
- [ ] `POST /api/shop-products/import` import Excel, cần active subscription.
- [ ] `GET /api/shop-products/import-jobs/:id` xem import job.
- [ ] `PATCH /api/shop-products/:id/archive` archive.
- [ ] `PATCH /api/shop-products/:id/restore` restore về draft.
- [ ] `DELETE /api/shop-products/:id` move to trash.
- [ ] `DELETE /api/shop-products/:id/permanent` hard delete.
- [ ] Product payload validate: name, category, description, gender, availability, price.
- [ ] Product enums: status `draft/published/archived/trashed`, availability `in_stock/out_of_stock`, gender `female/male/unisex`.
- [ ] Không publish product cho inactive shop.
- [ ] Thay đổi field embedding-relevant set `embeddingStale = true`.

## 11. Shop analytics/customer insights

- [ ] `GET /api/shops/me/analytics?range=7d|30d|90d` cần shop owner premium.
- [ ] Analytics summary: totalProducts, publishedProducts, draftProducts, outOfStockProducts.
- [ ] Analytics engagement: productViews, tryOnClicks, stylistMatches, feedbackCount.
- [ ] Analytics conversionRate = tryOnClicks / productViews.
- [ ] Top products sort theo total engagement.
- [ ] Average rating theo product từ feedback events.
- [ ] `GET /api/shops/me/insights?range=7d|30d|90d` cần shop owner premium.
- [ ] Insights có privacy threshold tối thiểu 3 events và 3 distinct users.
- [ ] Nếu chưa đủ dữ liệu, trả `enoughData: false`.
- [ ] Nếu đủ dữ liệu, breakdown: gender, bodyShape, skinTone, stylePreferences, occasions, budgetBuckets, styleTags, colors, ratings.
- [ ] Không expose tên/email/ảnh cá nhân user cho shop owner.

## 12. Admin dashboard features

- [ ] Admin auth dùng localStorage key `miroir_admin_token`.
- [ ] `GET /api/admin/shop-owners` lọc status mặc định pending hoặc all.
- [ ] Owner actions: approve, reject, deactivate.
- [ ] `GET /api/admin/shops` có search/status.
- [ ] `POST /api/admin/shops` tạo shop.
- [ ] `PUT /api/admin/shops/:shopId` cập nhật shop.
- [ ] `DELETE /api/admin/shops/:shopId` deactivate shop.
- [ ] Admin shop validate slug unique.
- [ ] Admin chỉ assign shop cho active shop owner.
- [ ] Một shop owner không được assign nhiều shop.
- [ ] `GET /api/admin/shops/:shopId/products` list/filter product.
- [ ] `POST /api/admin/shops/:shopId/products` tạo product.
- [ ] `PUT /api/admin/products/:productId` update product.
- [ ] `DELETE /api/admin/products/:productId` move to trash.
- [ ] `PATCH /api/admin/products/:productId/archive` archive.
- [ ] `PATCH /api/admin/products/:productId/restore` restore về draft.
- [ ] `GET /api/admin/shops/:shopId/products/export?mode=all|missing` export Excel.
- [ ] `POST /api/admin/shops/:shopId/products/import` import Excel.
- [ ] Admin import validate duplicate id, product id thuộc shop khác, required fields, enums.
- [ ] `GET /api/admin/payment-plans` list plans.
- [ ] `PUT /api/admin/payment-plans/:planCode` update plan.

## 13. Mobile Flutter features

- [ ] App session controller lưu/khôi phục user token và shop owner token.
- [ ] Customer auth page: register/login user.
- [ ] User profile onboarding page: save/skip profile, upload profile photo.
- [ ] Home page: marketplace/outfits/navigation theo session.
- [ ] Marketplace controller: search/filter/page products.
- [ ] Product detail page: detail, favorite, try-on, feedback.
- [ ] Favorite products page: list/toggle favorites.
- [ ] Try-on page: catalog/custom try-on, poll status, handle paywall/quota.
- [ ] Stylist page: premium recommendation và feedback.
- [ ] Account page: profile, subscription/payment state.
- [ ] Premium paywall sheet: list plans, create checkout.
- [ ] Owner center page: shop owner auth/dashboard/products/analytics/insights/payment.
- [ ] Mobile payment service: plans, create payment, status, payment me.
- [ ] Mobile gửi Authorization cho public catalog khi user đã login để nhận shop info nếu Premium.

## 14. API endpoint checklist

### Auth

- [ ] `POST /api/user-auth/register`
- [ ] `POST /api/user-auth/login`
- [ ] `GET /api/user-auth/me`
- [ ] `POST /api/shop-auth/register`
- [ ] `POST /api/shop-auth/login`
- [ ] `POST /api/admin-auth/login`
- [ ] `GET /api/admin-auth/me`

### User/profile/favorites

- [ ] `PUT /api/users/me/profile`
- [ ] `PATCH /api/users/me/profile/skip`
- [ ] `POST /api/users/me/profile-photo`
- [ ] `GET /api/users/me/favorites`
- [ ] `POST /api/users/me/favorites/:productId/toggle`

### Catalog/stylist/try-on

- [ ] `GET /api/catalog/products`
- [ ] `GET /api/catalog/products/:productId`
- [ ] `POST /api/catalog/products/:productId/feedback`
- [ ] `GET /api/catalog/outfits`
- [ ] `GET /api/catalog/shops/:shopId`
- [ ] `POST /api/stylist/recommend`
- [ ] `POST /api/stylist/feedback`
- [ ] `POST /api/tryon`
- [ ] `POST /api/tryon/catalog`
- [ ] `POST /api/tryon/custom`
- [ ] `GET /api/tryon/:taskId`

### Payment

- [ ] `GET /api/payments/plans`
- [ ] `POST /api/payments/create`
- [ ] `POST /api/payments/payos-webhook`
- [ ] `GET /api/payments/status/:orderCode`
- [ ] `GET /api/payments/me`

### Shop owner

- [ ] `GET /api/shops/me`
- [ ] `GET /api/shops/me/analytics`
- [ ] `GET /api/shops/me/insights`
- [ ] `POST /api/shops`
- [ ] `PUT /api/shops/:id`
- [ ] `DELETE /api/shops/:id`
- [ ] `GET /api/shop-products`
- [ ] `POST /api/shop-products`
- [ ] `POST /api/shop-products/upload-image`
- [ ] `GET /api/shop-products/import-template`
- [ ] `POST /api/shop-products/import`
- [ ] `GET /api/shop-products/import-jobs/:id`
- [ ] `GET /api/shop-products/:id`
- [ ] `PUT /api/shop-products/:id`
- [ ] `PATCH /api/shop-products/:id/archive`
- [ ] `PATCH /api/shop-products/:id/restore`
- [ ] `DELETE /api/shop-products/:id/permanent`
- [ ] `DELETE /api/shop-products/:id`

### Admin

- [ ] `GET /api/admin/payment-plans`
- [ ] `PUT /api/admin/payment-plans/:planCode`
- [ ] `GET /api/admin/shop-owners`
- [ ] `PATCH /api/admin/shop-owners/:ownerId/approve`
- [ ] `PATCH /api/admin/shop-owners/:ownerId/reject`
- [ ] `PATCH /api/admin/shop-owners/:ownerId/deactivate`
- [ ] `GET /api/admin/shops`
- [ ] `POST /api/admin/shops`
- [ ] `PUT /api/admin/shops/:shopId`
- [ ] `DELETE /api/admin/shops/:shopId`
- [ ] `GET /api/admin/shops/:shopId/products`
- [ ] `POST /api/admin/shops/:shopId/products`
- [ ] `GET /api/admin/shops/:shopId/products/export`
- [ ] `POST /api/admin/shops/:shopId/products/import`
- [ ] `PUT /api/admin/products/:productId`
- [ ] `DELETE /api/admin/products/:productId`
- [ ] `PATCH /api/admin/products/:productId/archive`
- [ ] `PATCH /api/admin/products/:productId/restore`

## 15. Luồng verify end-to-end đề xuất

### User Free -> Premium

- [ ] Register user mới.
- [ ] Login user.
- [ ] Hoàn tất onboarding profile, upload ảnh model.
- [ ] Xem marketplace, filter/search/pagination.
- [ ] Favorite một product, kiểm tra tab favorites.
- [ ] Try-on catalog product thành công và usage tăng.
- [ ] Try-on đủ 5 lượt free, lượt tiếp theo bị chặn.
- [ ] Mở stylist, thấy paywall.
- [ ] Tạo payment user Premium.
- [ ] Simulate/hoàn tất PayOS paid.
- [ ] Kiểm tra `/payments/status/:orderCode` là paid.
- [ ] Refresh `/user-auth/me`, user thành Premium.
- [ ] Stylist dùng được.
- [ ] Try-on không bị chặn quota.
- [ ] Product detail hiển thị shop info nếu backend trả.

### Shop owner Free -> Premium

- [ ] Register shop owner.
- [ ] Admin approve shop owner.
- [ ] Login shop owner.
- [ ] Tạo shop.
- [ ] Truy cập dashboard khi chưa Premium.
- [ ] Verify create/update/upload/import product bị chặn.
- [ ] Tạo payment shop owner.
- [ ] Simulate/hoàn tất PayOS paid.
- [ ] Refresh payment/subscription.
- [ ] Create product draft.
- [ ] Upload product image.
- [ ] Publish product.
- [ ] Import Excel template.
- [ ] Archive/restore/trash/permanent delete product.
- [ ] Xem analytics/insights.

### Admin

- [ ] Login admin.
- [ ] Duyệt/reject/deactivate shop owner.
- [ ] Tạo shop và assign owner.
- [ ] Cập nhật shop.
- [ ] Tạo/cập nhật/archive/restore/trash product.
- [ ] Export Excel all/missing.
- [ ] Import Excel success/fail.
- [ ] Cập nhật payment plan và verify user/shop UI lấy giá mới.

## 16. Điểm cần chú ý/verify kỹ

- [ ] Mobile đang gọi `POST /api/shops/upload-image`, nhưng backend routes hiện tại chưa có endpoint này. Cần verify và bổ sung backend hoặc đổi mobile dùng flow upload hiện có.
- [ ] File tài liệu `FRONTEND_SYSTEM_FEATURES_AND_API_SPEC.md` đang mở trong IDE nhưng không tồn tại ở root repo tại thời điểm rà soát.
- [ ] Text tiếng Việt trong một số tài liệu cũ có dấu hiệu mojibake encoding; không ảnh hưởng API nhưng cần kiểm tra khi copy sang docs/UI.
- [ ] `POST /api/stylist/feedback` hiện không yêu cầu auth trong route backend, trong khi mobile gửi token. Cần quyết định verify theo behavior hiện tại hay siết auth.
- [ ] `GET /api/payments/status/:orderCode` backend không yêu cầu auth, mobile service lại gửi token. Cả hai vẫn có thể chạy, nhưng cần thống nhất kỳ vọng bảo mật.
- [ ] Legacy `POST /api/tryon` không yêu cầu user/subscription, trong khi catalog/custom có gate user. Cần xác nhận có còn muốn public legacy route không.
- [ ] Shop owner product import template chỉ cho owner nhập một phần field; admin import/export có bộ field đầy đủ hơn.
- [ ] Hard delete product có ở shop owner API/mobile service, nhưng admin dashboard chỉ move to trash/archive/restore theo UI hiện tại.

