# TripGlide Mobile App – Design Specification

## 1. Tổng quan giao diện

**Tên app gợi ý:** TripGlide  
**Loại app:** Travel booking / khám phá tour du lịch  
**Phong cách:** Modern, clean, minimal, premium travel  
**Mục tiêu UI:** Giúp người dùng tìm điểm đến, xem chi tiết tour, lịch trình và đặt tour nhanh.

Giao diện dùng nhiều khoảng trắng, bo góc lớn, ảnh du lịch lớn, màu đen làm màu nhấn chính và các card nổi trên nền sáng.

---

## 2. Phong cách thiết kế

### Visual style

- Nền chính màu trắng hoặc xám rất nhạt.
- Card bo góc lớn, tạo cảm giác mềm mại và hiện đại.
- Ảnh destination là điểm nhấn chính.
- Button đen bo tròn, tạo cảm giác cao cấp.
- Icon line/simple, không quá nhiều chi tiết.
- Giao diện ít màu, tập trung vào ảnh.

### Keywords

`clean`, `minimal`, `rounded`, `travel`, `premium`, `modern`, `mobile first`, `image-focused`.

---

## 3. Bảng màu

| Mục đích | Màu | Hex gợi ý |
|---|---:|---|
| Background chính | Off White | `#F7F8FA` |
| Card / Surface | White | `#FFFFFF` |
| Text chính | Near Black | `#171A1C` |
| Text phụ | Gray | `#7A7F85` |
| Border nhẹ | Light Gray | `#E8EAED` |
| Primary Button | Charcoal Black | `#1D2225` |
| Chip chưa chọn | Soft Gray | `#F1F2F4` |
| Chip đang chọn | Charcoal Black | `#1D2225` |
| Accent phụ | Sky Blue | `#AEE7F2` |
| Rating / Star | Dark | `#171A1C` |

---

## 4. Typography

### Font gợi ý

- **iOS:** SF Pro Display / SF Pro Text
- **Android:** Inter / Roboto
- **Figma/Web:** Inter

### Text styles

| Style | Size | Weight | Dùng cho |
|---|---:|---:|---|
| Display / Page title | 24px | 700 | Tên địa điểm, tiêu đề chính |
| Section title | 20px | 700 | “Select your next trip”, “Upcoming tours” |
| Card title | 18px | 700 | Tên tour/card |
| Body | 15px | 400 | Mô tả, nội dung lịch trình |
| Caption | 13px | 400 | Review, ngày, giá, phụ đề |
| Button | 15px | 600 | Text trong button |
| Chip | 14px | 500 | Tabs, category |

---

## 5. Layout chung

### Kích thước màn hình tham chiếu

- iPhone 14/15 Pro: `393 x 852`
- Safe area top: `44px`
- Safe area bottom: `34px`

### Spacing system

| Token | Giá trị |
|---|---:|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| xxl | 32px |

### Border radius

| Component | Radius |
|---|---:|
| Button lớn | 28px |
| Card lớn | 24px |
| Card nhỏ | 18px |
| Chip | 20px |
| Icon button | 50% / circle |

---

## 6. Component chính

## 6.1 Header Home

### Thành phần

- Greeting: `Hello, Vanessa`
- Subtitle: `Welcome to TripGlide`
- Avatar tròn bên phải
- Padding trái/phải: `24px`
- Khoảng cách top: theo safe area

### Gợi ý dùng trong app khác

Nếu không phải app du lịch, có thể đổi thành:

```text
Hello, Player
Ready for your next adventure?
```

---

## 6.2 Search Bar

### Thành phần

- Container trắng, bo góc `24px`
- Icon search bên trái
- Placeholder: `Search`
- Nút filter tròn màu đen bên phải

### Kích thước

```text
Height: 56px
Radius: 28px
Horizontal padding: 16px
```

### Trạng thái

- Default: nền trắng, text xám
- Focused: border đen nhẹ hoặc shadow nhẹ
- Filter active: icon filter đổi nền đen

---

## 6.3 Category Chips

Dùng để lọc khu vực/tour.

### Ví dụ

```text
Asia
Europe
South America
North America
```

### Style

- Chip chưa chọn: nền `#F1F2F4`, text xám đậm
- Chip đang chọn: nền `#1D2225`, text trắng
- Height: `36px`
- Radius: `18px`

---

## 6.4 Destination Card lớn

Card chính ở màn hình Home.

### Thành phần

- Ảnh nền lớn
- Overlay gradient đen ở phía dưới
- Tên quốc gia nhỏ
- Tên thành phố lớn
- Rating và số review
- Nút “See more”
- Nút arrow tròn
- Nút heart ở góc phải trên

### Layout

```text
Width: full container
Height: 320px
Radius: 24px
Image: cover
Overlay bottom: black gradient 45%
```

### Text trên card

```text
Brazil
Rio de Janeiro
★ 5.0    143 reviews
```

### CTA

```text
See more    →
```

---

## 6.5 Bottom Navigation

### Thành phần

- Thanh nav màu đen bo tròn dạng pill
- 4 icon: Home, List, Favorite, Grid/Menu
- Icon đang chọn có nền trắng tròn

### Kích thước

```text
Height: 72px
Horizontal margin: 24px
Radius: 36px
Bottom position: 24px + safe area
```

### Tab gợi ý

| Icon | Chức năng |
|---|---|
| Home | Trang chính |
| List | Tour / lịch trình |
| Heart | Yêu thích |
| Grid | Menu / profile |

---

## 7. Màn hình Detail Destination

## 7.1 Hero Image

### Thành phần

- Ảnh destination ở top
- Back button tròn bên trái
- Favorite button tròn bên phải
- Ảnh chiếm khoảng 35–40% chiều cao màn hình
- Bottom sheet trắng bo góc lớn nằm chồng lên ảnh

### Style

```text
Hero height: 300px
Image: cover
Bottom sheet radius top-left/top-right: 28px
```

---

## 7.2 Destination Info Sheet

### Thành phần

- Tên địa điểm: `Rio de Janeiro`
- Quốc gia + icon lá cờ nhỏ
- Rating chip bên phải
- Link review
- Mô tả ngắn
- Read more
- Section: Upcoming tours

### Layout

```text
Padding: 24px
Title size: 24px bold
Body line-height: 1.45
```

---

## 7.3 Upcoming Tour Card

### Thành phần

- Ảnh tour
- Tên tour
- Thời lượng: `8 days`
- Giá: `from $659/person`
- Rating + số review
- Nút arrow tròn màu đen

### Style

```text
Card width: 260px
Image height: 150px
Radius: 20px
Card background: white
```

---

## 8. Màn hình Tour Schedule / Booking

## 8.1 Top Bar

### Thành phần

- Back button
- Title: `Iconic Brazil`
- Date range: `Wed, Oct 21 – Sun, Nov 1`
- Heart button

### Style

- Title center
- Nút tròn hai bên
- Nền trắng/xám nhạt

---

## 8.2 Tab Navigation

### Tabs

```text
Tour schedule
Accommodation
Booking details
```

### Style

- Tab đang chọn: nền đen, text trắng
- Tab chưa chọn: nền xám nhạt, text xám
- Scroll ngang nếu nhiều tab

---

## 8.3 Schedule Accordion Card

### Thành phần

- Ảnh thumbnail bên trái
- Day label: `Day 1`
- Title: `Arrival to Rio de Janeiro`
- Icon arrow up/down
- Nội dung theo buổi:
  - Morning
  - Afternoon
  - Evening

### Style card mở

```text
Background: #F7F8FA
Radius: 20px
Padding: 16px
```

### Style card đóng

```text
Background: white
Border: 1px solid #E8EAED
Radius: 20px
Height: 96px
```

---

## 8.4 Bottom CTA

### Button

```text
Book a tour
```

### Style

```text
Position: sticky bottom
Height: 64px
Radius: 28px
Background: #1D2225
Text: white, 600
Margin: 24px
```

---

## 9. User Flow

```text
Home
  ↓ chọn destination
Destination Detail
  ↓ chọn tour
Tour Schedule
  ↓ bấm Book a tour
Booking Details / Payment
```

---

## 10. Screens cần thiết cho app hoàn chỉnh

### Core screens

1. Splash Screen
2. Onboarding
3. Login / Register
4. Home
5. Search Results
6. Destination Detail
7. Tour Detail
8. Tour Schedule
9. Booking Form
10. Payment
11. Booking Success
12. Favorites
13. Profile
14. Settings

---

## 11. Gợi ý chuyển style này sang app/game khác

Nếu dùng phong cách này cho game hoặc app đồ án:

### Với app quản lý / booking

- Giữ nền sáng, card bo góc lớn.
- Dùng ảnh lớn làm điểm nhấn.
- Button đen làm CTA chính.
- Tabs dạng chip để lọc nội dung.

### Với game mobile

Có thể biến đổi thành:

- Bottom nav → thanh HUD bo tròn.
- Destination card → card chọn màn chơi/map.
- Rating → độ khó/số sao.
- Book a tour → Start Mission.
- Upcoming tours → nhiệm vụ/challenge.
- Favorite → đánh dấu map yêu thích.

---

## 12. Design tokens

```css
:root {
  --color-bg: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-text: #171A1C;
  --color-muted: #7A7F85;
  --color-border: #E8EAED;
  --color-primary: #1D2225;
  --color-chip: #F1F2F4;

  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 24px;
  --radius-xl: 28px;
  --radius-pill: 999px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-xxl: 32px;
}
```

---

## 13. Prompt dùng để tạo UI tương tự

```text
Design a modern mobile travel booking app UI with a clean white background, large rounded destination image cards, black pill buttons, soft gray category chips, minimal line icons, premium spacing, and iOS-style rounded components. Include home screen, destination detail screen, and tour schedule screen.
```

---

## 14. Checklist khi dựng lại trên Figma

- [ ] Dùng frame iPhone 14/15 Pro.
- [ ] Set layout grid: 4 columns hoặc margin 24px.
- [ ] Tạo color styles.
- [ ] Tạo text styles.
- [ ] Tạo component: button, chip, card, bottom nav.
- [ ] Dùng ảnh chất lượng cao, crop cover.
- [ ] Card luôn bo góc lớn.
- [ ] Button chính luôn màu đen.
- [ ] Giữ khoảng trắng nhiều, không nhồi chữ.
- [ ] Tạo prototype flow: Home → Detail → Schedule → Booking.
