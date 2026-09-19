# MIROIR - Danh sách chức năng dành cho người không biết code

Tài liệu này dùng cho tester, BA, founder, người vận hành hoặc người mới vào dự án. Mục tiêu là hiểu hệ thống MIROIR có những gì, ai dùng phần nào, và cần kiểm tra bằng thao tác trên giao diện như thế nào.

Không cần biết code, API hay database để dùng tài liệu này.

## 1. MIROIR là gì?

MIROIR là hệ thống thời trang có các nhóm chức năng chính:

- Cho người dùng xem sản phẩm thời trang.
- Cho người dùng thử đồ bằng AI.
- Cho người dùng nhận gợi ý phối đồ từ AI Stylist.
- Cho người dùng lưu sản phẩm yêu thích.
- Cho người dùng nâng cấp Premium để mở thêm quyền.
- Cho shop đăng và quản lý sản phẩm.
- Cho shop xem thống kê hiệu quả sản phẩm.
- Cho admin quản lý shop, chủ shop, sản phẩm và gói thanh toán.

## 2. Các nhóm người dùng trong hệ thống

### Khách chưa đăng nhập

Khách chưa đăng nhập là người chỉ mở website/app nhưng chưa có tài khoản.

Cần kiểm tra:

- [ ] Mở được trang giới thiệu.
- [ ] Xem được nút đăng nhập/đăng ký.
- [ ] Có thể xem một số sản phẩm công khai.
- [ ] Không thao tác được các chức năng cần tài khoản như yêu thích, thử đồ, AI Stylist, thanh toán.
- [ ] Khi bấm vào chức năng cần đăng nhập, hệ thống yêu cầu đăng nhập hoặc chuyển đến trang đăng nhập.

### Người dùng thường

Người dùng thường là khách hàng đã đăng ký tài khoản nhưng chưa trả phí Premium.

Cần kiểm tra:

- [ ] Đăng ký tài khoản mới.
- [ ] Đăng nhập bằng email và mật khẩu.
- [ ] Đăng xuất.
- [ ] Cập nhật hồ sơ cá nhân.
- [ ] Bỏ qua bước cập nhật hồ sơ nếu được cho phép.
- [ ] Tải ảnh cá nhân/ảnh model lên.
- [ ] Xem danh sách sản phẩm.
- [ ] Tìm kiếm sản phẩm.
- [ ] Lọc sản phẩm theo danh mục, giới tính, khoảng giá.
- [ ] Chuyển trang danh sách sản phẩm.
- [ ] Xem chi tiết sản phẩm.
- [ ] Thêm sản phẩm vào yêu thích.
- [ ] Xóa sản phẩm khỏi yêu thích.
- [ ] Xem danh sách sản phẩm yêu thích.
- [ ] Xem danh sách outfit/phối đồ.
- [ ] Dùng thử đồ AI trong giới hạn miễn phí.
- [ ] Thấy số lượt thử đồ còn lại trong tháng.
- [ ] Khi hết lượt miễn phí, hệ thống hiển thị lời mời nâng cấp Premium.
- [ ] Không dùng được AI Stylist nếu chưa Premium.
- [ ] Không xem đầy đủ thông tin shop nếu chưa Premium.
- [ ] Có thể mua gói Premium.
- [ ] Sau khi thanh toán thành công, tài khoản chuyển thành Premium.

### Người dùng Premium

Người dùng Premium là khách hàng đã mua gói trả phí.

Cần kiểm tra:

- [ ] Giao diện hiển thị trạng thái Premium.
- [ ] Không còn bị giới hạn 5 lượt thử đồ mỗi tháng.
- [ ] Dùng được AI Stylist.
- [ ] Xem được thông tin shop đầy đủ nếu hệ thống có dữ liệu shop.
- [ ] Gửi đánh giá sản phẩm.
- [ ] Gửi đánh giá sau khi thử đồ.
- [ ] Gửi đánh giá cho sản phẩm được AI Stylist gợi ý.
- [ ] Khi gói hết hạn, tài khoản quay về quyền thường.

### Chủ shop

Chủ shop là người quản lý cửa hàng trên MIROIR.

Cần kiểm tra:

- [ ] Đăng ký tài khoản chủ shop.
- [ ] Đăng nhập tài khoản chủ shop.
- [ ] Nếu tài khoản chưa được admin duyệt, hệ thống hiển thị đúng trạng thái.
- [ ] Sau khi được admin duyệt, chủ shop vào được dashboard.
- [ ] Tạo thông tin shop.
- [ ] Cập nhật tên shop.
- [ ] Cập nhật đường dẫn/slug shop.
- [ ] Cập nhật mô tả shop.
- [ ] Cập nhật logo shop.
- [ ] Cập nhật ảnh bìa shop.
- [ ] Cập nhật thông tin liên hệ shop.
- [ ] Tạm ngưng shop.
- [ ] Xem danh sách sản phẩm của shop.
- [ ] Nếu chưa mua gói shop trả phí, không tạo/sửa/import sản phẩm được.
- [ ] Có thể mua gói dành cho chủ shop.

### Chủ shop trả phí

Chủ shop trả phí là chủ shop đã mua gói shop owner.

Cần kiểm tra:

- [ ] Tạo sản phẩm mới.
- [ ] Cập nhật thông tin sản phẩm.
- [ ] Tải ảnh sản phẩm.
- [ ] Đưa sản phẩm từ nháp sang xuất bản.
- [ ] Chuyển sản phẩm về lưu trữ.
- [ ] Khôi phục sản phẩm đã lưu trữ.
- [ ] Chuyển sản phẩm vào thùng rác.
- [ ] Xóa hẳn sản phẩm nếu giao diện/app có chức năng này.
- [ ] Tải file mẫu Excel để nhập sản phẩm.
- [ ] Nhập sản phẩm bằng Excel.
- [ ] Xem kết quả nhập Excel: thành công, thất bại, lỗi từng dòng.
- [ ] Xem thống kê shop.
- [ ] Xem insight khách hàng.
- [ ] Sản phẩm của shop trả phí được ưu tiên hiển thị hơn shop chưa trả phí.

### Admin

Admin là người quản trị toàn hệ thống.

Cần kiểm tra:

- [ ] Đăng nhập admin.
- [ ] Đăng xuất admin.
- [ ] Xem danh sách chủ shop.
- [ ] Duyệt chủ shop.
- [ ] Từ chối chủ shop.
- [ ] Vô hiệu hóa chủ shop.
- [ ] Xem danh sách shop.
- [ ] Tìm kiếm shop.
- [ ] Lọc shop theo trạng thái.
- [ ] Tạo shop.
- [ ] Gán shop cho chủ shop.
- [ ] Cập nhật thông tin shop.
- [ ] Tạm ngưng shop.
- [ ] Mở shop để quản lý sản phẩm.
- [ ] Xem sản phẩm của từng shop.
- [ ] Tìm kiếm sản phẩm.
- [ ] Lọc sản phẩm theo trạng thái.
- [ ] Tạo sản phẩm cho shop.
- [ ] Cập nhật sản phẩm.
- [ ] Lưu trữ sản phẩm.
- [ ] Khôi phục sản phẩm.
- [ ] Chuyển sản phẩm vào thùng rác.
- [ ] Xuất danh sách sản phẩm ra Excel.
- [ ] Xuất danh sách sản phẩm thiếu thông tin ra Excel.
- [ ] Nhập sản phẩm từ Excel.
- [ ] Xem kết quả nhập Excel.
- [ ] Xem danh sách gói thanh toán.
- [ ] Cập nhật tên gói.
- [ ] Cập nhật mô tả gói.
- [ ] Cập nhật giá gói.
- [ ] Cập nhật thời hạn gói.
- [ ] Cập nhật quyền lợi của gói.

## 3. Các màn hình chính cần kiểm tra

### Trang giới thiệu

- [ ] Trang hiển thị đẹp trên desktop.
- [ ] Trang hiển thị đẹp trên mobile.
- [ ] Có nút đăng nhập.
- [ ] Có nút đăng ký.
- [ ] Có nút vào trải nghiệm chính nếu đã đăng nhập.
- [ ] Nếu đã đăng nhập user, vào đúng khu vực user.
- [ ] Nếu đã đăng nhập shop, vào đúng dashboard shop.
- [ ] Nếu đã đăng nhập admin, vào đúng dashboard admin.

### Trang đăng nhập/đăng ký

- [ ] Đăng ký user thành công.
- [ ] Đăng nhập user thành công.
- [ ] Đăng ký chủ shop thành công.
- [ ] Đăng nhập chủ shop thành công.
- [ ] Đăng nhập admin thành công.
- [ ] Email sai hiển thị lỗi.
- [ ] Mật khẩu sai hiển thị lỗi.
- [ ] Form không bị vỡ giao diện trên mobile.
- [ ] Sau đăng nhập chuyển đến đúng trang.

### Trang onboarding hồ sơ

- [ ] Hiển thị form nhập thông tin cá nhân.
- [ ] Chọn giới tính.
- [ ] Chọn dáng người.
- [ ] Chọn tông da.
- [ ] Chọn phong cách yêu thích.
- [ ] Nhập chiều cao.
- [ ] Nhập cân nặng.
- [ ] Nhập số đo vai.
- [ ] Nhập số đo ngực.
- [ ] Nhập số đo eo.
- [ ] Nhập số đo hông.
- [ ] Upload ảnh model.
- [ ] Lưu hồ sơ thành công.
- [ ] Bỏ qua hồ sơ thành công.
- [ ] Sau khi lưu/bỏ qua chuyển vào app chính.

### Trang marketplace sản phẩm

- [ ] Sản phẩm hiển thị ảnh, tên, giá.
- [ ] Sản phẩm hết hàng không xuất hiện trong danh sách public.
- [ ] Sản phẩm chưa xuất bản không xuất hiện trong danh sách public.
- [ ] Search theo tên sản phẩm hoạt động.
- [ ] Filter theo danh mục hoạt động.
- [ ] Filter theo giới tính hoạt động.
- [ ] Filter theo giá thấp nhất/cao nhất hoạt động.
- [ ] Chuyển trang trước/sau hoạt động.
- [ ] Bấm vào sản phẩm mở chi tiết.
- [ ] Bấm yêu thích đổi trạng thái đúng.
- [ ] Người chưa đăng nhập không favorite được.
- [ ] User Premium thấy thông tin shop nếu có.
- [ ] User thường không thấy thông tin shop đầy đủ.

### Trang chi tiết sản phẩm

- [ ] Hiển thị ảnh sản phẩm.
- [ ] Hiển thị tên sản phẩm.
- [ ] Hiển thị giá.
- [ ] Hiển thị mô tả.
- [ ] Hiển thị màu sắc/kích cỡ/chất liệu nếu có.
- [ ] Có nút thử đồ.
- [ ] Có nút yêu thích.
- [ ] Có form đánh giá nếu user đã đăng nhập.
- [ ] Đánh giá 1-5 sao gửi thành công.
- [ ] Gửi nhận xét sản phẩm thành công.
- [ ] Đóng modal/trang chi tiết không lỗi.

### Trang yêu thích

- [ ] Hiển thị đúng các sản phẩm đã yêu thích.
- [ ] Xóa khỏi yêu thích thì sản phẩm biến mất khỏi danh sách.
- [ ] Nếu chưa có sản phẩm yêu thích, hiển thị trạng thái rỗng dễ hiểu.

### Trang outfits

- [ ] Hiển thị danh sách phối đồ.
- [ ] Search outfit hoạt động.
- [ ] Filter giới tính hoạt động.
- [ ] Outfit hiển thị các sản phẩm liên quan nếu có.
- [ ] Bấm sản phẩm trong outfit mở được chi tiết.

### Try-on Studio

- [ ] Chọn sản phẩm từ marketplace rồi mở try-on.
- [ ] Upload ảnh model.
- [ ] Nếu user đã có ảnh model, hệ thống cho dùng ảnh đã lưu.
- [ ] Chọn kiểu thử váy/đầm.
- [ ] Chọn kiểu thử áo và quần.
- [ ] Upload ảnh trang phục custom.
- [ ] Bấm tạo ảnh thử đồ.
- [ ] Trong lúc xử lý, giao diện hiển thị trạng thái đang xử lý.
- [ ] Khi thành công, hiển thị ảnh kết quả.
- [ ] Khi thất bại, hiển thị lỗi dễ hiểu.
- [ ] User thường dùng được trong giới hạn miễn phí.
- [ ] Hết lượt miễn phí thì hiện nút nâng cấp.
- [ ] User Premium không bị chặn bởi giới hạn lượt.
- [ ] Sau try-on sản phẩm platform, có thể gửi đánh giá.
- [ ] Sau try-on trang phục custom, không hiện feedback sản phẩm platform.

### AI Stylist

- [ ] User thường thấy paywall/nâng cấp Premium.
- [ ] User Premium mở được AI Stylist.
- [ ] Nhập nhu cầu phối đồ.
- [ ] Chọn dịp sử dụng nếu có.
- [ ] Nhập ngân sách nếu có.
- [ ] Gửi yêu cầu.
- [ ] Nhận kết quả gợi ý.
- [ ] Kết quả có sản phẩm phù hợp nếu dữ liệu có sẵn.
- [ ] Mở chi tiết sản phẩm được gợi ý.
- [ ] Gửi feedback cho stylist nếu có giao diện.

### Hồ sơ người dùng

- [ ] Xem thông tin hồ sơ hiện tại.
- [ ] Sửa thông tin cá nhân.
- [ ] Upload/cập nhật ảnh model.
- [ ] Lưu thay đổi.
- [ ] Sau khi reload trang, thông tin vẫn còn.

### Thanh toán

- [ ] Hiển thị đúng gói User Premium.
- [ ] Hiển thị đúng gói Shop Owner.
- [ ] Giá hiển thị theo cấu hình hiện tại.
- [ ] Bấm nâng cấp tạo được link thanh toán.
- [ ] Người dùng được chuyển sang trang thanh toán.
- [ ] Sau thanh toán thành công, quay về trang kết quả.
- [ ] Trang kết quả hiển thị thành công.
- [ ] Sau thanh toán thành công, quyền Premium được cập nhật.
- [ ] Nếu thanh toán bị hủy, trang kết quả hiển thị hủy.
- [ ] Nếu thanh toán đang chờ, trang kết quả hiển thị đang xử lý.
- [ ] Nếu thanh toán lỗi, hiển thị thông báo lỗi.

## 4. Dashboard chủ shop

### Tổng quan tài khoản shop

- [ ] Hiển thị trạng thái gói hiện tại.
- [ ] Nếu chưa trả phí, hiển thị lời mời nâng cấp.
- [ ] Nếu đã trả phí, hiển thị quyền shop owner premium.
- [ ] Có nút thanh toán/nâng cấp.

### Quản lý shop

- [ ] Tạo shop mới.
- [ ] Không cho tạo shop thứ hai nếu tài khoản đã có shop.
- [ ] Cập nhật tên shop.
- [ ] Cập nhật slug.
- [ ] Cập nhật mô tả.
- [ ] Cập nhật logo.
- [ ] Cập nhật ảnh bìa.
- [ ] Cập nhật địa chỉ.
- [ ] Cập nhật email liên hệ.
- [ ] Cập nhật số điện thoại.
- [ ] Tạm ngưng shop.

### Quản lý sản phẩm shop

- [ ] Xem danh sách sản phẩm.
- [ ] Tạo sản phẩm.
- [ ] Sửa sản phẩm.
- [ ] Upload ảnh sản phẩm.
- [ ] Chọn trạng thái nháp.
- [ ] Chọn trạng thái xuất bản.
- [ ] Chọn còn hàng/hết hàng.
- [ ] Nhập giá hợp lệ.
- [ ] Không cho nhập giá âm.
- [ ] Chọn giới tính phù hợp.
- [ ] Nhập màu sắc.
- [ ] Nhập kích cỡ.
- [ ] Nhập chất liệu.
- [ ] Nhập tag phong cách.
- [ ] Nhập tag dịp sử dụng.
- [ ] Lưu trữ sản phẩm.
- [ ] Khôi phục sản phẩm.
- [ ] Chuyển sản phẩm vào thùng rác.
- [ ] Xóa hẳn sản phẩm nếu có nút.

### Nhập sản phẩm bằng Excel

- [ ] Tải file mẫu.
- [ ] Điền file mẫu với dữ liệu hợp lệ.
- [ ] Import thành công.
- [ ] Import file thiếu tên sản phẩm hiển thị lỗi.
- [ ] Import file giá sai hiển thị lỗi.
- [ ] Import file ảnh hợp lệ hoạt động.
- [ ] Kết quả import hiển thị số dòng thành công/thất bại.

### Analytics shop

- [ ] Chọn khoảng thời gian 7 ngày.
- [ ] Chọn khoảng thời gian 30 ngày.
- [ ] Chọn khoảng thời gian 90 ngày.
- [ ] Xem tổng số sản phẩm.
- [ ] Xem số sản phẩm published.
- [ ] Xem số sản phẩm draft.
- [ ] Xem số sản phẩm hết hàng.
- [ ] Xem lượt xem sản phẩm.
- [ ] Xem lượt bấm thử đồ.
- [ ] Xem lượt sản phẩm được AI Stylist gợi ý.
- [ ] Xem số feedback.
- [ ] Xem tỷ lệ chuyển đổi.
- [ ] Xem top sản phẩm.
- [ ] Xem rating trung bình nếu có feedback.

### Customer insights

- [ ] Nếu chưa đủ dữ liệu, hiển thị thông báo chưa đủ dữ liệu.
- [ ] Nếu đủ dữ liệu, hiển thị breakdown giới tính.
- [ ] Hiển thị breakdown dáng người.
- [ ] Hiển thị breakdown tông da.
- [ ] Hiển thị breakdown phong cách yêu thích.
- [ ] Hiển thị breakdown dịp sử dụng.
- [ ] Hiển thị breakdown ngân sách.
- [ ] Hiển thị breakdown màu sắc/tag.
- [ ] Hiển thị breakdown rating.
- [ ] Không hiển thị tên/email/ảnh cá nhân của user.

## 5. Dashboard admin

### Quản lý chủ shop

- [ ] Xem danh sách chủ shop chờ duyệt.
- [ ] Xem tất cả chủ shop nếu có filter.
- [ ] Duyệt chủ shop.
- [ ] Từ chối chủ shop.
- [ ] Vô hiệu hóa chủ shop.
- [ ] Sau khi duyệt, chủ shop đăng nhập và dùng được dashboard.
- [ ] Chủ shop bị vô hiệu hóa không đăng nhập/dùng được như bình thường.

### Quản lý shop

- [ ] Xem danh sách shop.
- [ ] Tìm shop theo tên.
- [ ] Lọc shop active/inactive.
- [ ] Tạo shop mới.
- [ ] Gán shop cho chủ shop active.
- [ ] Không gán shop cho chủ shop chưa active.
- [ ] Không gán nhiều shop cho một chủ shop nếu hệ thống không cho phép.
- [ ] Cập nhật shop.
- [ ] Tạm ngưng shop.
- [ ] Shop inactive không hiển thị sản phẩm public như shop active.

### Quản lý sản phẩm admin

- [ ] Chọn một shop để quản lý.
- [ ] Xem sản phẩm của shop đó.
- [ ] Tạo sản phẩm.
- [ ] Sửa sản phẩm.
- [ ] Lọc sản phẩm theo trạng thái.
- [ ] Tìm kiếm sản phẩm.
- [ ] Xem sản phẩm thiếu thông tin.
- [ ] Lưu trữ sản phẩm.
- [ ] Khôi phục sản phẩm.
- [ ] Chuyển vào thùng rác.
- [ ] Sản phẩm published và còn hàng xuất hiện ở marketplace.
- [ ] Sản phẩm draft không xuất hiện ở marketplace.
- [ ] Sản phẩm archived không xuất hiện ở marketplace.
- [ ] Sản phẩm trashed không xuất hiện ở marketplace.
- [ ] Sản phẩm out of stock không xuất hiện ở marketplace public.

### Import/export Excel admin

- [ ] Export toàn bộ sản phẩm của shop.
- [ ] Export sản phẩm thiếu thông tin.
- [ ] File export mở được bằng Excel.
- [ ] Import file hợp lệ thành công.
- [ ] Import file sai hiển thị lỗi.
- [ ] Import product có id cũ thì cập nhật đúng sản phẩm.
- [ ] Import product id thuộc shop khác thì báo lỗi.

### Quản lý gói thanh toán

- [ ] Xem gói User Premium.
- [ ] Xem gói Shop Owner.
- [ ] Cập nhật giá gói.
- [ ] Cập nhật thời hạn gói.
- [ ] Cập nhật mô tả gói.
- [ ] Cập nhật danh sách quyền lợi.
- [ ] Sau khi cập nhật, user/shop nhìn thấy giá mới ở màn hình nâng cấp.
- [ ] Không cho nhập giá âm.
- [ ] Không cho nhập thời hạn nhỏ hơn 1 ngày.

## 6. Mobile app

Nếu kiểm tra mobile Flutter, cần kiểm tra các nhóm sau:

- [ ] Mở app thành công.
- [ ] Đăng ký user.
- [ ] Đăng nhập user.
- [ ] Lưu session sau khi tắt mở app.
- [ ] Onboarding hồ sơ.
- [ ] Marketplace sản phẩm.
- [ ] Chi tiết sản phẩm.
- [ ] Yêu thích sản phẩm.
- [ ] Danh sách yêu thích.
- [ ] Try-on.
- [ ] AI Stylist.
- [ ] Paywall Premium.
- [ ] Thanh toán.
- [ ] Account/profile.
- [ ] Đăng ký/đăng nhập chủ shop.
- [ ] Khu vực owner center.
- [ ] Quản lý shop.
- [ ] Quản lý sản phẩm.
- [ ] Analytics/insights shop.
- [ ] App hiển thị tốt trên màn hình nhỏ.
- [ ] App xử lý lỗi mạng dễ hiểu.

## 7. Các tình huống lỗi cần kiểm tra

- [ ] Đăng nhập sai mật khẩu.
- [ ] Đăng nhập email không tồn tại.
- [ ] Đăng ký email đã tồn tại.
- [ ] Token hết hạn hoặc bị xóa.
- [ ] User bị inactive.
- [ ] Shop owner bị inactive.
- [ ] Admin token sai.
- [ ] Upload file không phải ảnh.
- [ ] Upload ảnh quá nặng nếu hệ thống có giới hạn.
- [ ] Import Excel sai định dạng.
- [ ] Product thiếu trường bắt buộc.
- [ ] Giá sản phẩm âm.
- [ ] Link ảnh sản phẩm không hợp lệ.
- [ ] Thanh toán bị hủy.
- [ ] Thanh toán pending.
- [ ] Thanh toán failed.
- [ ] Try-on thất bại.
- [ ] AI Stylist không có sản phẩm phù hợp.
- [ ] Mất mạng khi đang thao tác.
- [ ] Reload trang giữa lúc đang thanh toán hoặc đang xử lý try-on.

## 8. Checklist luồng nghiệp vụ lớn

### Luồng khách hàng từ mới đến Premium

- [ ] Mở landing page.
- [ ] Đăng ký user.
- [ ] Hoàn tất onboarding.
- [ ] Xem marketplace.
- [ ] Favorite sản phẩm.
- [ ] Try-on sản phẩm.
- [ ] Dùng hết quota free.
- [ ] Nâng cấp Premium.
- [ ] Thanh toán thành công.
- [ ] Quay lại app.
- [ ] Xác nhận tài khoản Premium.
- [ ] Dùng AI Stylist.
- [ ] Try-on tiếp không bị chặn.

### Luồng shop owner từ mới đến bán sản phẩm

- [ ] Đăng ký shop owner.
- [ ] Admin duyệt shop owner.
- [ ] Shop owner đăng nhập.
- [ ] Shop owner tạo shop.
- [ ] Shop owner mua gói trả phí.
- [ ] Shop owner tạo sản phẩm.
- [ ] Shop owner publish sản phẩm.
- [ ] User nhìn thấy sản phẩm trên marketplace.
- [ ] User thử đồ với sản phẩm.
- [ ] User gửi feedback.
- [ ] Shop owner xem analytics.
- [ ] Shop owner xem insights khi đủ dữ liệu.

### Luồng admin quản lý hệ thống

- [ ] Admin đăng nhập.
- [ ] Duyệt shop owner.
- [ ] Tạo/cập nhật shop.
- [ ] Tạo/cập nhật sản phẩm.
- [ ] Import/export Excel.
- [ ] Cập nhật gói thanh toán.
- [ ] Kiểm tra user/shop thấy thay đổi tương ứng.

## 9. Các điểm cần hỏi lại team hoặc kiểm tra kỹ

- [ ] Mobile hiện có chức năng upload ảnh logo/cover shop, nhưng backend hiện tại cần kiểm tra lại xem đã hỗ trợ đúng chưa.
- [ ] Một số chức năng cũ như try-on standalone có thể không yêu cầu đăng nhập; cần xác nhận còn dùng hay sẽ khóa lại.
- [ ] Feedback cho AI Stylist hiện có thể khác feedback sản phẩm; cần thống nhất cách hiển thị cho tester.
- [ ] Trang thanh toán phụ thuộc PayOS, cần có tài khoản/test mode để verify đầy đủ.
- [ ] AI Try-on phụ thuộc dịch vụ bên ngoài, có thể chậm hoặc lỗi nếu thiếu key/cấu hình.
- [ ] AI Stylist phụ thuộc dữ liệu sản phẩm; nếu catalog ít sản phẩm, kết quả có thể nghèo.
- [ ] Customer insights cần đủ dữ liệu và đủ số user khác nhau mới hiển thị.

