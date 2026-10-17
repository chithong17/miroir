# Plan sửa UI React Native theo Flutter gốc

Ngày rà soát: 16/10/2026. Trạng thái: chỉ audit và lên plan, chưa triển khai sửa UI trong lượt này.

## 1. Phạm vi và mức độ bằng chứng

- Đã kiểm kê 35 route `.tsx` không tính `_layout`, lần theo component dùng chung và các màn không có route riêng: onboarding, chọn đăng nhập, customer login/register/reset, owner login/register/reset, profile onboarding.
- Đã rà cấu trúc JSX của các nhóm màn và đối chiếu cấu trúc widget Flutter tương ứng. Ba ảnh người dùng gửi xác nhận trực tiếp vấn đề trên Conversation, Addresses và Product Detail.
- Đây là audit source và bằng chứng ảnh hiện có, KHÔNG phải xác nhận đã mở/chụp đủ mọi màn và mọi trạng thái trên điện thoại. Các mục dưới đây là backlog, không phải kết quả nghiệm thu.
- Flutter `../mobile` là nguồn chuẩn về cấu trúc, bố cục, phân cấp thao tác và nội dung. Không redesign theo sở thích, không sao chép sơ đồ route RN hiện tại rồi coi đó là chuẩn.
- Giữ nguyên API contracts, token customer/shop độc lập, cache/session, retry identity và logic nghiệp vụ đã kiểm thử. Không sửa backend hay ghi dữ liệu thật để làm audit UI.

## 2. Nguyên nhân gốc cần sửa trước

1. `src/components/ui.tsx`: `Button` chỉ là alias của nút pill; thiếu phân biệt navigation row, text action, radio/checkbox, chip, destructive action và CTA. Container mặc định kéo các nút thành toàn chiều ngang.
2. `Screen` mặc định là một ScrollView chứa cả header, danh sách, form và hành động. Vì vậy Back bị đẩy vào nội dung; composer và thanh thanh toán không cố định.
3. Card dùng như container mặc định, nhiều card lồng card; nội dung phụ có kích thước/shadow ngang với nội dung chính.
4. `_layout.tsx` tắt native header nhưng nhiều trang chưa có app header thay thế, dùng nút Back/Account/Owner center full-width.
5. `TaskMonitor.tsx` dùng pill chữ lớn, tọa độ `bottom: 88` cố định, không phối hợp bàn phím, bottom navigation và CTA của màn. Flutter dùng bubble tròn gọn có progress/error/unread.
6. Nhiều form sinh từ tên field bằng `Object.entries`: lộ label kỹ thuật, tất cả giá trị đều nhập text thay vì control đúng loại.
7. Test hiện chủ yếu xác nhận API/điều hướng, chưa chặn sai lệch bố cục; Product Detail còn có nút Back ẩn riêng phục vụ test. Cần test trên control người dùng thực sự thấy.

Không sửa bằng cách thu nhỏ tất cả nút hoặc đổi radius toàn app: vấn đề chính là sai loại component và sai cấu trúc màn.

## 3. Quy tắc triển khai

- Điều hướng quay lại: header có icon back và title; không thêm một hàng CTA Back/Inbox/Account vào body.
- Mỗi vùng tác vụ có một hành động chính nổi bật; hành động phụ dùng text/icon/row/menu đúng Flutter. Không cấm hai hành động hợp lệ đặt cạnh nhau, không ép mọi hành động thành pill.
- Giá trị chọn dùng chip/radio/checkbox/dropdown/selector; không dùng CTA toàn chiều ngang làm mọi lựa chọn.
- Danh sách là row/card tóm tắt có thể chạm. Không bung toàn bộ form xử lý cho từng item trong list.
- Modal/dialog/bottom sheet bám cách Flutter chia tác vụ. Có thể giữ route RN để deep link nhưng phần trình bày phải đúng flow.
- Composer, thanh mua hàng và tổng thanh toán nằm đúng vị trí của Flutter, xử lý safe area và bàn phím. Không áp một sticky footer cho những màn Flutter không có.
- Nhãn hiển thị rõ nghĩa, trạng thái nghiệp vụ không lộ raw enum. Rà tiếng Việt/Anh theo phạm vi Flutter thực sự hỗ trợ, không chỉ đổi nhãn tab.
- Không để bubble, tab bar hoặc bàn phím che control; vùng chạm tối thiểu 44, focus và label accessibility phải có trên control thật.
- Icon bánh răng nổi trong ảnh chưa xác định từ source app; không tự kết luận là UI MIROIR, kiểm tra nguồn Expo/dev/OS trước khi đưa vào phạm vi sửa.

## 4. Ma trận toàn bộ route

P0: sai cấu trúc lớn/cản thao tác; P1: cần dựng lại một phần đáng kể; P2: đối chiếu và tinh chỉnh, không có nghĩa đã đạt parity.

| Route / màn | Ưu tiên | Hiện trạng xác định từ source | Hướng sửa theo Flutter |
| --- | --- | --- | --- |
| `/chat` | P0 | Card tiêu đề lớn + nút Open conversation cho từng cuộc chat | Inbox row: avatar, tên, preview, thời gian, unread; chạm cả row; header back |
| `/chat/[id]` | P0 | Message là Card toàn ngang; context card rất lớn; composer nằm cuối ScrollView | Bubble trái/phải giới hạn chiều rộng; timestamp nhỏ/read receipt; context thumbnail; list cuộn độc lập; composer ảnh/text/send cố định |
| `/owner/chat` | P0 | Re-export inbox customer, cùng lỗi bố cục | Dùng inbox layout đã sửa, giữ actor shop và đúng tên/header |
| `/owner/chat/[id]` | P0 | Re-export Conversation, cùng lỗi bố cục | Cùng bubble/composer đã sửa; giữ actor, customer context và phiên owner độc lập |
| `/addresses` | P0 | Danh sách và form thêm chung trang; mỗi tỉnh/huyện/xã là nút lớn | Saved places + Add address; form trong dialog như Flutter; địa giới trong picker, không bung hàng chục CTA; giữ phân cấp API hiện cần |
| `/product/[id]` | P0 | AddToCart bung inline; Try-on/View bag/Visit/Contact xếp dọc; review là text fields; Back ẩn cho test | Khôi phục thanh đáy giá/chat/add-to-cart; chọn biến thể trong sheet với chip và stepper; shop row gọn; fit/rating controls đúng Flutter; bỏ control test ẩn |
| `/cart` | P0 | Card lồng card; ảnh lớn; trừ/cộng/xóa thành ba nút dọc | Item tile có thumbnail, variant, giá, stepper ngang và remove icon; shop group, tổng/checkout đúng bố cục Flutter |
| `/checkout` | P0 | Mỗi địa chỉ có nút Deliver here; payment methods là CTA dọc | Radio address rows, quản lý địa chỉ là action phụ, dropdown/radio payment theo shop; tổng và Place order theo Flutter |
| `/owner` | P0 | Menu phẳng hơn 10 nút lớn, mất phân cấp Owner Center | Khôi phục shell/panel theo `_OverviewPanel`, `_ProductsPanel`, `_AnalyticsPanel`, `_ProfilePanel`, premium panel; giữ URL con cho deep link |
| `/orders` | P1 | Tất cả item, contact và form hủy bung trong list; trạng thái raw | Order summary card/tile + status pill; Orders/Returns tabs như Flutter; detail khi chạm; lý do hủy chỉ khi chọn hành động |
| `/order/[id]` | P1 | Mỗi item ảnh/card lớn; form hủy luôn hiện khi eligible; history text | Delivery/payment sections, item rows, timeline; receipt preview gọn; hành động theo trạng thái trong dialog/section đúng Flutter |
| `/returns` | P1 | Card lớn và nút View return lặp | Return summary/tile trong flow Orders/Returns; chạm row mở detail, badge/trạng thái rõ |
| `/returns/create` | P1 | Mỗi sản phẩm một card và ô nhập quantity mặc định 0; label technical | Checkbox chọn sản phẩm + quantity hợp lệ, lý do multiline, proof thumbnail strip, nhóm tài khoản hoàn tiền, một submit |
| `/returns/[id]` | P1 | Evidence là ảnh toàn ngang lồng card; history text dài | Status summary, item rows, evidence gallery, timeline; chỉ hiện tác vụ shipment/escalation phù hợp trạng thái |
| `/notifications` | P1 | Mỗi notice có Mark as read và View orders lớn | Notification list row, unread dot/style, thao tác chạm và điều hướng đúng ngữ cảnh; không lặp CTA |
| `/shop/[id]` | P1 | Header Back full-width; sản phẩm xếp một card toàn ngang; phân trang hai nút dọc | Cover/logo/header theo SliverAppBar Flutter; metadata và chat action gọn; collection grid, loading-more/phân trang đúng reference |
| `/saved` | P1 | Tái dùng toàn Marketplace: greeting, promo, search/categories/view tabs không thuộc Saved Items | Màn favorites riêng: back/title, count/grid, empty state và unfavorite; không mang nguyên Home vào |
| `/profile` | P1 | Mọi thuộc tính là text field; số đo xếp dọc; back/skip/save như CTA ngang vai | Gender dropdown, nhóm field và measurement Wrap theo Flutter; photo area, save/skip đúng cấp; phân biệt onboarding/edit |
| `/owner/shop` | P1 | Form dài sinh từ toàn bộ key; URL ảnh lộ cạnh control upload | Shop editor sheet theo Flutter; logo/cover upload previews, nhóm tên/mô tả/liên hệ; không bắt nhập URL kỹ thuật để upload |
| `/owner/products` | P1 | Năm status là năm nút dọc; mỗi item Edit/Archive/Trash đều lớn | Filter chip/tab row; product row/card gọn, edit khi chạm, overflow menu/confirm archive/trash/restore |
| `/owner/products/edit` | P1 | Form toàn key; gender/status là nút dọc; card variant dài với nhiều action | Product editor sheet/sections theo Flutter; chọn gender/status gọn; variant editor, toggle active và remove icon; save rõ; giữ SKU/id/stock metadata |
| `/owner/orders` | P1 | Tất cả order detail/action/note/proof bung trên list; card lồng card | List tóm tắt; mở detail sheet như ShopCommerce Flutter; action theo trạng thái, reason/receipt trong dialog |
| `/owner/returns` | P1 | Evidence, refund account, form quyết định bung cho từng yêu cầu | List tóm tắt + detail sheet; approve/reject/receive/refund theo stage; proof gallery và confirm phù hợp |
| `/owner/notifications` | P1 | Mark read/Shop orders lặp nút lớn | Cùng notification row đã sửa cho customer, giữ endpoint/session owner |
| `/owner/dashboard` | P1 | Performance/Audience là nút dọc; KPI thành danh sách dài; chart đơn giản khác Flutter | Range chips, panel switch, metric grid, charts/legend/funnel/top-product tiles theo Flutter; giữ nhãn dữ liệu mô phỏng/null/gated |
| `/owner/payments` | P1 | Toàn bộ plan bung card, mỗi plan CTA; current plan chỉ báo active chung | Premium panel/paywall như Flutter, phân biệt gói đang dùng/chọn gói; CTA checkout và trạng thái rõ |
| `/owner/payments/return` | P1 | Render lại nguyên trang chọn gói | Trình bày rõ checking/success/pending/failure dựa trên status thật, refresh subscription; không coi callback là đã trả tiền |
| `/owner/payments/cancel` | P1 | Render lại nguyên trang chọn gói | State hủy/chưa trả + quay lại phù hợp; kiểm tra status thật, tránh CTA lặp |
| `/payments` | P1 | Customer vẫn có mục Premium dù backend hiện không có paid customer plans | Theo account/all-features-included reference và backend: thông tin quyền truy cập gọn, không gợi mua gói không tồn tại |
| `/payments/return` | P1 | Dùng cùng Payments, không có presentation riêng cho callback | Guard customer context và trình bày trạng thái phù hợp; không gọi billing shop bằng customer token |
| `/payments/cancel` | P1 | Cùng vấn đề callback và ngữ cảnh customer | State/cách quay lại rõ, không mở flow mua gói customer giả |
| `/try-on` | P1 | Upload tiles thành card dọc với nút Choose lớn; Reset lớn; result/status presentation chưa giống | Upload grid/tappable tiles, catalog-prefill layout, preview/result và lỗi theo Flutter; reset action phụ; giữ polling/task state |
| `/stylist` | P1 | Optional profile mặc định mở; input count text thay selector; View product lặp trong result | Expansion/profile controls theo Flutter, count selector, outfit tiles và feedback gọn; giữ prompt/budget/payload/results |
| `/` (Home) | P2 | Có core style nhưng còn view switch/filter và product-card action khác reference | So sánh header/badges, promo crop, category chips, product grid, filter flow, count/pagination; không thêm control chỉ để expose API |
| `/account` | P2 | Signed-in đã có menu row, guest vẫn 5 nút dọc; có menu customer Premium và diagnostics | Đối chiếu guest/signed-in Flutter, language selector, menu grouping và subscription copy; diagnostics không chiếm flow người dùng |

### Màn/trạng thái không có route riêng

| Màn | Ưu tiên | Việc cần làm |
| --- | --- | --- |
| Onboarding 3 bước | P2 | So từng slide/card/footer/dots/snap với Flutter trên màn thấp và text scale lớn; không coi bản vẽ mini-phone hiện tại là đã đúng |
| Auth choice | P2 | Đối chiếu hero/glass card/login/register/guest spacing và safe area |
| Customer login/register | P2 | Đối chiếu form/switch/keyboard; một submit, secondary links, không thêm Back full-width trùng icon |
| Customer password reset/OTP/new password | P1 | Header/copy/control theo từng stage; không dùng nguyên auth form mơ hồ; rà resend/back/error theo Flutter |
| Profile onboarding | P1 | Dùng profile layout đã sửa nhưng có skip/required state đúng, không mất phân biệt với edit profile |
| Owner login/register/reset | P1 | Hiện là Card form và các nút mode xếp dọc; chuyển về auth panel/mode switch/link đúng Owner Center Flutter |
| Global Try-on bubble và task states | P0 | Bubble tròn gọn như Flutter, progress/unread/error/timeout; kiểm tra với chat composer, address dialog, checkout footer và bàn phím |
| Global headers/bottom nav/offline/loading/error | P0 | Header thống nhất, safe area/content insets, action semantics, offline banner không đẩy/che control; kiểm tra tab state preservation |

## 5. Thứ tự thực hiện và đầu ra

### Đợt 0 — Chốt baseline, không sửa API

- [ ] Tạo paired screenshots Flutter/RN cùng dữ liệu, kích thước viewport, text scale, ngôn ngữ và trạng thái.
- [ ] Chốt frame chuẩn cho Chat, Addresses, Product Detail, Cart, Checkout, Owner Center trước khi sửa lan rộng.
- [ ] Gắn mỗi mục với reference widget/source + ảnh; phân biệt sai lệch đã thấy và phần cần kiểm tra trên máy.

### Đợt 1 — Foundation UI (phụ thuộc chung)

- [ ] App header/back/title/actions; screen layout có scroll region riêng và optional fixed footer.
- [ ] Tách navigation row, icon/text action, selection chip/radio/checkbox, stepper, status pill, primary/destructive CTA.
- [ ] Modal/dialog/sheet, compact image attachments và confirmation pattern.
- [ ] Sửa global task bubble và cơ chế tránh overlap; không đổi task/API state machine ngoài điều cần cho presentation.
- [ ] Bỏ nút ẩn phục vụ test; cập nhật test dùng control thật, giữ accessibility labels.

### Đợt 2 — Customer flow ưu tiên (P0)

- [ ] Chat customer + shop (dùng chung UI, tách actor).
- [ ] Addresses list + add dialog/location pickers.
- [ ] Product detail + variant sheet + bottom purchase bar.
- [ ] Cart item layout + Checkout selections.
- [ ] Owner Center shell thay menu nút phẳng.

Nghiệm thu từng nhóm bằng paired screenshots và tương tác, trước khi chuyển nhóm tiếp; không đợi cuối toàn migration mới xem UI.

### Đợt 3 — Customer còn lại (P1)

- [ ] Orders/returns list và detail, cancellation/return/shipment dialogs.
- [ ] Notifications, shop collection, saved items riêng.
- [ ] Profile/onboarding profile, Try-on, Stylist.
- [ ] Customer access/payment messaging và callbacks hợp lệ.

### Đợt 4 — Owner workspaces (P1)

- [ ] Owner auth, shop editor, product list/editor/variants.
- [ ] Shop orders/returns detail sheets và confirmations.
- [ ] Analytics layout/charts, shop notifications, premium/paywall/callback states.

### Đợt 5 — Parity polish và regression (P2 + toàn app)

- [ ] Home/account/onboarding/customer auth/bottom navigation theo reference.
- [ ] Rà label/i18n, typography, icon, shadow, radius, spacing, ảnh, badge và empty/loading/error states.
- [ ] Lint/typecheck/behavior/E2E; thêm visual screenshot assertions cho các frame đã chốt, không chỉ kiểm tra text có tồn tại.
- [ ] Bàn giao checklist điện thoại Expo theo từng flow; iOS native vẫn ngoài đợt Android hiện tại.

## 6. Điều kiện đóng từng màn

1. Có ảnh Flutter và RN cạnh nhau cho cùng trạng thái/dữ liệu, gồm top, vùng giữa, cuối màn hoặc modal liên quan. Ghi nhận mọi khác biệt được chủ động giữ lại; không tự tuyên bố pixel-perfect.
2. Không có navigation/selection bị trình bày như CTA lớn; không có hàng nút dọc chỉ để mở từng item trong danh sách; không có card lồng card vô lý.
3. Không che control ở màn 360/390/430dp, bàn phím mở, gesture/3-button navigation và text scale lớn. Những bố cục footer/composer bắt buộc kiểm tra native, không chỉ web.
4. Đủ guest/authenticated/owner/gated/empty/loading/error và các trạng thái nghiệp vụ của màn.
5. API payload, route context, pagination, draft preservation, customer/shop session isolation và mutation retry không bị hồi quy.
6. Các thao tác thật tạo đơn, gửi chat, thay ảnh/profile, hoàn tiền phải dùng fixture/test data hoặc có phạm vi cho phép rõ; không tạo giao dịch tiền thật để chứng minh UI.

## 7. Các điểm không được đánh dấu hoàn tất bằng test cũ

- 20 behavior/20 browser tests trước đây không phải bằng chứng visual parity.
- API trả 200 không chứng minh màn dễ dùng hoặc đúng Flutter.
- Một screenshot viewport không đủ nghiệm thu cả trang dài, phần dưới bàn phím và bottom sheet.
- Không coi P2 là “không cần sửa”; đó là các màn ít sai cấu trúc hơn, vẫn cần đối chiếu.
- Không cam kết thời gian hoàn tất toàn bộ trước khi chốt baseline đợt 0; chia nghiệm thu theo đợt để tránh lặp lại báo xong sớm.

## 8. Reference chính đã đối chiếu

- `src/components/ui.tsx`, `src/components/BottomNav.tsx`, `src/features/try-on/TaskMonitor.tsx`, `app/_layout.tsx`.
- Flutter `features/chat/presentation/chat_pages.dart`: inbox ListTile, message bubble, context thumbnail, fixed composer.
- Flutter `features/commerce/presentation/commerce_pages.dart`: add-to-cart sheet, cart item tile, checkout RadioListTile/dropdown, address dialog, orders/returns tabs, detail/notification rows.
- Flutter `features/commerce/presentation/shop_commerce_page.dart`: shop commerce list/detail sheets và action dialogs.
- Flutter `features/marketplace/presentation/product_detail_page.dart`: bottomNavigationBar giá/chat/cart, shop section; `shop_detail_page.dart`: SliverAppBar/collection.
- Flutter `features/account/presentation/owner_center_page.dart`: owner panels, mode switch, editor sheets, metric grid/chart; `favorite_products_page.dart`: màn saved riêng.
- Flutter `features/customer/presentation/user_profile_onboarding_page.dart`: gender dropdown và measurement Wrap.
- Flutter `features/try_on/presentation/try_on_page.dart`, `features/stylist/presentation/stylist_page.dart`, `features/payments/presentation/premium_paywall_sheet.dart`, `shared/widgets/try_on_status_bubble.dart`.
