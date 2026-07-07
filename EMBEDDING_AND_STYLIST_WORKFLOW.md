# Quy trình Embedding và AI Stylist của MIROIR

Tài liệu này mô tả chi tiết cách sản phẩm được lưu, dữ liệu nào được đưa vào embedding, khi nào sản phẩm cần embed lại, và khi người dùng sử dụng AI Stylist thì backend xử lý request như thế nào.

## 1. Tổng quan kiến trúc

AI Stylist dùng MongoDB Atlas làm database chính và dùng Atlas Vector Search để tìm sản phẩm, outfit mẫu, và fashion rule gần nghĩa nhất với nhu cầu của người dùng.

Hệ thống có hai nhóm dữ liệu quan trọng:

1. Dữ liệu nghiệp vụ gốc:
   - Sản phẩm của shop.
   - Hồ sơ shop.
   - Outfit template.
   - Fashion rule.
   - Review summary.
   - User fashion memory.

2. Dữ liệu phục vụ AI search:
   - `embedding`: vector số do Gemini tạo ra.
   - `embeddingTextHash`: hash của đoạn text đã dùng để tạo embedding.
   - `embeddingUpdatedAt`: thời điểm embedding được cập nhật gần nhất.
   - `embeddingStale`: cờ riêng cho sản phẩm, dùng để biết sản phẩm có cần embed lại không.

Luồng tổng quát:

```text
Shop owner tạo/import sản phẩm
        |
        v
MongoDB collection: products
        |
        v
npm run embed:products
        |
        v
Gemini Embedding API tạo vector
        |
        v
products.embedding được lưu vào MongoDB
        |
        v
Atlas Vector Search index vector
        |
        v
Người dùng gọi AI Stylist
        |
        v
Backend tạo query embedding và vector search
        |
        v
Gemini Generation tạo outfit recommendation
        |
        v
Backend validate product ID và trả product detail thật từ database
```

## 2. Product được lưu ở đâu

Sản phẩm được lưu trong MongoDB collection:

```text
products
```

Backend kết nối MongoDB thông qua:

```text
backend/services/mongo.service.js
```

Tên database lấy từ biến môi trường:

```env
MONGODB_URI=...
MONGODB_DB_NAME=miroir
```

Các file chính liên quan đến product:

```text
backend/services/product.service.js
backend/services/productImport.service.js
backend/controllers/shopProduct.controller.js
backend/routes/shopProduct.routes.js
```

API product của shop owner đi qua route prefix:

```text
/api/shop-products
```

## 3. Product schema hiện tại

Một product trong MongoDB thường có dạng:

```json
{
  "id": "product-id",
  "shopId": "shop-id",
  "name": "Linen Shirt",
  "category": "shirt",
  "description": "Lightweight linen shirt...",
  "colors": ["white", "beige"],
  "sizes": ["S", "M", "L"],
  "price": 590000,
  "gender": "female",
  "availability": "in_stock",
  "imageUrl": "https://...",
  "imagePublicId": "cloudinary-public-id",
  "styleTags": ["minimalist", "smart casual"],
  "occasionTags": ["date", "office"],
  "material": "linen",
  "fitType": "relaxed",
  "status": "published",
  "embeddingStale": false,
  "embedding": [0.01, -0.02],
  "embeddingTextHash": "sha256-hash",
  "embeddingUpdatedAt": "2026-07-04T00:00:00.000Z",
  "createdAt": "2026-07-04T00:00:00.000Z",
  "updatedAt": "2026-07-04T00:00:00.000Z"
}
```

### 3.1 Field do shop owner quản lý

Theo flow import Excel hiện tại, shop owner chỉ import các field:

```text
id
name
price
availability
sizes
material
imageUrl
```

Nếu file Excel có ảnh thật được chèn vào row sản phẩm, backend sẽ đọc ảnh đó, upload lên Cloudinary, rồi lưu:

```text
imageUrl
imagePublicId
```

File xử lý upload ảnh:

```text
backend/services/cloudinary.service.js
```

File extract ảnh trong Excel:

```text
backend/services/xlsxImage.service.js
```

### 3.2 Field do manager/system quản lý

Các field này không nằm trong template Excel của shop owner:

```text
category
description
gender
status
colors
styleTags
occasionTags
fitType
```

Lý do: đây là các field ảnh hưởng trực tiếp đến phân loại, trạng thái publish, và chất lượng recommendation của AI Stylist. Manager/system nên quản lý các field này để dữ liệu đồng nhất hơn.

### 3.3 Field phục vụ embedding

```text
embedding
embeddingTextHash
embeddingUpdatedAt
embeddingStale
```

`embedding` là mảng vector số do Gemini Embedding API tạo ra. Atlas Vector Search dùng field này để tìm sản phẩm gần nghĩa với request của người dùng.

`embeddingTextHash` là hash SHA-256 của đoạn text dùng để tạo embedding. Nếu text không đổi và product đã có embedding, script sẽ bỏ qua để tiết kiệm API call.

`embeddingUpdatedAt` là thời điểm embedding được tạo/cập nhật gần nhất.

`embeddingStale` cho biết product có cần embed lại không. Nếu `true`, dashboard hiện `needs embed`. Nếu `false`, dashboard hiện `ready`.

## 4. Product đi vào database bằng những cách nào

### 4.1 Tạo product bằng dashboard

Frontend:

```text
frontend/src/pages/ShopDashboardPage.jsx
```

API:

```http
POST /api/shop-products
```

Backend flow:

```text
createShopProduct -> createProduct
```

Khi tạo product, backend:

1. Lấy `shopId` từ body hoặc từ shop duy nhất của owner.
2. Kiểm tra shop tồn tại và thuộc owner đang đăng nhập.
3. Validate payload sản phẩm.
4. Tạo `id` bằng UUID nếu user không nhập.
5. Set `embeddingStale: true`.
6. Set `createdAt` và `updatedAt`.
7. Insert vào collection `products`.

Kết quả: product mới tạo sẽ hiện `needs embed` cho đến khi chạy script embed.

### 4.2 Update product bằng dashboard

API:

```http
PUT /api/shop-products/:id
```

Backend flow:

```text
updateShopProduct -> updateProduct
```

Nếu update các field ảnh hưởng AI, backend sẽ reset trạng thái embedding:

```js
const EMBEDDING_FIELDS = [
  "name",
  "category",
  "description",
  "colors",
  "styleTags",
  "occasionTags",
  "material",
  "gender",
  "fitType",
];
```

Khi một trong các field trên được gửi trong body update, backend set:

```js
embeddingStale = true
embeddingTextHash = null
embeddingUpdatedAt = null
```

Điều này báo cho hệ thống biết product cần được embed lại.

### 4.3 Import product bằng Excel

API:

```http
GET /api/shop-products/import-template
POST /api/shop-products/import
GET /api/shop-products/import-jobs/:id
```

Template Excel hiện tại chỉ gồm:

```text
id, name, price, availability, sizes, material, imageUrl
```

Import flow:

```text
Shop owner upload .xlsx
        |
        v
Multer đọc file vào memory
        |
        v
XLSX đọc sheet Products
        |
        v
Validate từng dòng
        |
        v
Extract ảnh nhúng theo từng row
        |
        v
Upload ảnh lên Cloudinary
        |
        v
Insert/update products
        |
        v
Lưu product_import_jobs
```

Import job được lưu ở collection:

```text
product_import_jobs
```

Nếu row có `id` trùng product đã tồn tại và product đó thuộc đúng shop owner, backend update product đó.

Nếu row không có `id`, backend tạo UUID mới.

Product mới từ import được set default:

```js
status: "draft"
category: ""
description: ""
gender: "unisex"
colors: []
styleTags: []
occasionTags: []
fitType: ""
embeddingStale: true
```

Lưu ý quan trọng: product mới import mặc định là `draft`, nên AI Stylist sẽ không recommend product đó cho đến khi manager/system publish:

```js
status: "published"
```

## 5. Dữ liệu nào được embed

File build embedding text:

```text
backend/services/embeddingText.service.js
```

Product embedding text được build từ:

```js
Name
Category
Description
Colors
Style tags
Occasion tags
Material
Gender
Fit type
```

Code hiện tại:

```js
export const buildProductEmbeddingText = (product) =>
  [
    line("Name", product.name),
    line("Category", product.category),
    line("Description", product.description),
    line("Colors", product.colors),
    line("Style tags", product.styleTags || product.style_tags),
    line("Occasion tags", product.occasionTags || product.occasions),
    line("Material", product.material),
    line("Gender", product.gender),
    line("Fit type", product.fitType || product.fit_type),
  ]
    .filter(Boolean)
    .join("\n");
```

Product embedding hiện không include:

```text
price
availability
sizes
imageUrl
imagePublicId
shopId
status
reviews
```

Lý do:

- `price`, `availability`, `status` phù hợp để filter hơn là đưa vào embedding.
- `sizes` quan trọng cho hiển thị và fit, nhưng hiện tại chưa đưa vào embedding text.
- `imageUrl` không có giá trị ngữ nghĩa cho text embedding.
- Review summary được load riêng trong recommendation flow, không trộn vào product embedding.

Ví dụ product:

```json
{
  "name": "Linen Shirt",
  "category": "shirt",
  "description": "Lightweight linen shirt with relaxed silhouette.",
  "colors": ["white", "beige"],
  "styleTags": ["minimalist", "smart casual", "summer"],
  "occasionTags": ["date", "office", "casual"],
  "material": "linen",
  "gender": "female",
  "fitType": "relaxed"
}
```

Text thực tế đưa vào Gemini Embedding sẽ gần như:

```text
Name: Linen Shirt
Category: shirt
Description: Lightweight linen shirt with relaxed silhouette.
Colors: white, beige
Style tags: minimalist, smart casual, summer
Occasion tags: date, office, casual
Material: linen
Gender: female
Fit type: relaxed
```

## 6. Embedding được tạo bằng cách nào

Script:

```text
backend/scripts/embedCollection.js
```

Commands:

```bash
cd backend
npm run embed:products
npm run embed:outfits
npm run embed:fashion-rules
```

Trong `backend/package.json`:

```json
{
  "embed:products": "node scripts/embedCollection.js products",
  "embed:outfits": "node scripts/embedCollection.js outfits",
  "embed:fashion-rules": "node scripts/embedCollection.js fashion_rules"
}
```

### 6.1 Embed script làm gì

Với mỗi document trong collection:

1. Lấy text builder theo collection.
2. Build text từ document.
3. Tạo `embeddingTextHash` bằng SHA-256.
4. Nếu text rỗng, skip.
5. Nếu document đã có cùng `embeddingTextHash` và đã có `embedding`, skip.
6. Nếu cần embed:
   - Gọi Gemini Embedding API.
   - Lưu `embedding`.
   - Lưu `embeddingTextHash`.
   - Lưu `embeddingUpdatedAt`.
   - Nếu collection là `products`, set `embeddingStale: false`.

### 6.2 Gemini Embedding API

File:

```text
backend/services/gemini.service.js
```

Hàm:

```js
generateEmbedding(text)
```

Model lấy từ:

```env
GEMINI_EMBEDDING_MODEL=...
```

Nếu không set env, code dùng mặc định:

```text
gemini-embedding-001
```

Response phải có:

```js
response.data.embedding.values
```

Đây chính là vector được lưu vào MongoDB.

### 6.3 Khi nào product cần embed lại

Product cần embed lại khi:

- Vừa tạo product mới.
- Import product mới.
- Manager/system update field ảnh hưởng AI:
  - `name`
  - `category`
  - `description`
  - `colors`
  - `styleTags`
  - `occasionTags`
  - `material`
  - `gender`
  - `fitType`

Dashboard hiện:

```text
needs embed
```

khi:

```js
embeddingStale === true
```

Sau khi chạy:

```bash
npm run embed:products
```

Nếu thành công, backend set:

```js
embeddingStale: false
```

Dashboard sẽ hiện:

```text
ready
```

## 7. Atlas Vector Search index

Lưu `embedding` vào MongoDB chưa đủ. Atlas cần Vector Search Index để query bằng `$vectorSearch`.

Product index name lấy từ env:

```env
MONGODB_PRODUCT_VECTOR_INDEX=products_embedding_index
```

Product index cần có vector field:

```json
{
  "type": "vector",
  "path": "embedding",
  "numDimensions": 768,
  "similarity": "cosine"
}
```

`numDimensions` phải bằng độ dài mảng `embedding` do Gemini trả về. Nếu đổi embedding model và dimension thay đổi, phải sửa index.

### 7.1 Filter fields

Trong `$vectorSearch`, field nào nằm trong `filter` thì field đó phải được khai báo trong Atlas Vector Search Index:

```json
{
  "type": "filter",
  "path": "fieldName"
}
```

Code hiện tại filter product trực tiếp trong `$vectorSearch` theo:

```text
price
gender
availability
occasionTags
```

`status` hiện đã được lọc sau vector search trong backend, nên không bắt buộc phải là Vector Search filter nữa. Tuy nhiên vẫn có thể thêm `status` vào index nếu sau này muốn filter trực tiếp trong Atlas.

Product index khuyến nghị:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "price"
    },
    {
      "type": "filter",
      "path": "gender"
    },
    {
      "type": "filter",
      "path": "availability"
    },
    {
      "type": "filter",
      "path": "occasionTags"
    },
    {
      "type": "filter",
      "path": "status"
    }
  ]
}
```

Nếu gặp lỗi:

```text
Path 'xxx' needs to be indexed as filter
```

nghĩa là code đang dùng `xxx` trong `$vectorSearch.filter`, nhưng Atlas index chưa khai báo:

```json
{
  "type": "filter",
  "path": "xxx"
}
```

## 8. Người dùng sử dụng AI Stylist thì backend xử lý ra sao

Route:

```text
POST /api/stylist/recommend
```

Controller:

```text
backend/controllers/stylist.controller.js
```

Các service chính:

```text
backend/services/retrieval.service.js
backend/services/gemini.service.js
backend/services/groundingValidation.service.js
backend/services/fashionMemory.service.js
```

### 8.1 Request đầu vào

Ví dụ request:

```json
{
  "userId": "demo-user",
  "measurements": {
    "height": 165,
    "weight": 52,
    "bust": 84,
    "waist": 66,
    "hips": 90,
    "shoulder": 38
  },
  "bodyShape": "triangle",
  "skinTone": "warm",
  "gender": "female",
  "stylePreferences": ["minimalist", "smart casual"],
  "budget": {
    "min": 0,
    "max": 1500000
  },
  "occasion": "date",
  "feedback": "I prefer relaxed fit."
}
```

Backend validate các field bắt buộc:

```text
userId
measurements
budget.max
occasion
skinTone
```

### 8.2 Lấy user fashion memory

Controller gọi:

```js
getUserFashionMemory(req.body.userId)
```

Collection:

```text
user_fashion_memory
```

Memory có thể gồm:

```text
likedStyles
dislikedStyles
favoriteColors
avoidedColors
fitPreference
preferredCategories
dislikedCategories
preferredOccasions
sizeHints
```

Memory giúp AI biết user từng thích/không thích style, màu, category, hoặc fit nào.

### 8.3 Build stylist query text

File:

```text
backend/services/retrieval.service.js
```

Hàm:

```js
buildStylistQueryText({ request, memory })
```

Text query gồm:

```text
Occasion
Gender
Body shape
Skin tone
Style preferences
Feedback
Liked styles
Disliked styles
Favorite colors
Fit preference
```

Ví dụ:

```text
Occasion: date
Gender: female
Body shape: triangle
Skin tone: warm
Style preferences: minimalist, smart casual
Feedback: I prefer relaxed fit.
Liked styles: minimalist
Favorite colors: black, beige
Fit preference: relaxed
```

Backend đưa text này vào Gemini Embedding API để tạo `queryVector`.

### 8.4 Vector search product, outfit, fashion rule

Sau khi có `queryVector`, backend gọi 3 vector search song song:

```text
products
outfits
fashion_rules
```

#### Product vector search

Collection:

```text
products
```

Index:

```text
products_embedding_index
```

Filter product hiện tại:

```text
budget.max -> price <= max
budget.min -> price >= min
gender -> gender in [request.gender, "unisex"]
availability -> in_stock hoặc true
occasion -> occasionTags match request.occasion
```

Sau khi Atlas trả product về, backend lọc tiếp:

```text
product.status === "published"
shopId tồn tại
shop đang active
```

Shop active được kiểm tra bằng:

```js
getActiveShopsByIds(...)
```

Collection:

```text
shops
```

#### Outfit vector search

Collection:

```text
outfits
```

Index:

```text
outfits_embedding_index
```

Filter:

```text
gender in [request.gender, "unisex"]
```

Outfit template chỉ là guidance cho Gemini, không phải product thật.

#### Fashion rule vector search

Collection:

```text
fashion_rules
```

Index:

```text
fashion_rules_embedding_index
```

Code hiện tại không filter thêm cho `fashion_rules`.

### 8.5 Rerank product

Sau khi lấy product từ vector search và lọc shop/status, backend tính `rerankScore`.

Hàm:

```js
scoreProduct({ product, request, memory, reviewSummary })
```

Điểm bắt đầu là:

```js
product.vectorScore
```

Sau đó cộng/trừ thêm:

```text
+0.2 nếu styleTags match stylePreferences
+0.2 nếu occasionTags match occasion
+0.12 nếu colors match favoriteColors
+0.12 nếu styleTags match likedStyles
+0.08 nếu fitType match fitPreference
+0.06 nếu review trueToSize
+0.05 nếu comfortScore >= 4.3
-0.2 nếu styleTags match dislikedStyles
-0.2 nếu colors match avoidedColors
-0.15 nếu category nằm trong dislikedCategories
```

Cuối cùng sort theo `rerankScore` giảm dần và lấy tối đa 30 product.

### 8.6 Load review summaries

Review summary collection:

```text
product_review_summaries
```

Backend load review summary theo product IDs:

```js
getReviewSummariesByProductIds(productIds)
```

Review summary không nằm trong product embedding. Nó được đưa vào Gemini generation payload riêng để Gemini cân nhắc fit/comfort.

### 8.7 Nếu không có product hợp lệ

Nếu sau retrieval không còn product nào, API trả:

```json
{
  "success": true,
  "noMatch": true,
  "message": "No eligible products were found for this styling request.",
  "recommended_outfit": {
    "score": 0,
    "items": []
  }
}
```

Khi gặp case này, kiểm tra:

```text
product có embedding chưa
product có status published chưa
shop có active chưa
availability có in_stock chưa
gender có match không
occasionTags có match occasion không
budget có quá thấp không
Atlas index đã ready chưa
```

### 8.8 Build payload cho Gemini Generation

Controller build payload gồm:

```text
userProfile
userMemory
retrievedProducts
reviewSummaries
retrievedOutfits
retrievedFashionRules
outputRules
```

`retrievedProducts` chỉ chứa product backend cho phép recommend:

```json
{
  "id": "P001",
  "name": "Linen Shirt",
  "category": "shirt",
  "price": 590000,
  "colors": ["white"],
  "sizes": ["S", "M"],
  "styleTags": ["minimalist"],
  "occasionTags": ["date"],
  "material": "linen",
  "fitType": "relaxed",
  "shop": {
    "id": "...",
    "name": "...",
    "slug": "...",
    "logoUrl": "..."
  },
  "rerankScore": 0.91
}
```

`outputRules` gồm:

```json
{
  "allowedProductIds": ["P001", "P002"],
  "productDetailsMustComeFromBackend": true
}
```

### 8.9 Gemini tạo recommendation

Hàm:

```js
generateStylistRecommendation(payload)
```

Model lấy từ:

```env
GEMINI_GENERATION_MODEL=...
```

Nếu không set env, code dùng mặc định:

```text
gemini-3.5-flash
```

System prompt bắt buộc Gemini:

```text
MUST ONLY recommend products that appear in retrievedProducts
Never invent products
Never recommend products outside retrieved context
Return JSON only
```

Schema output:

```json
{
  "analysis": {
    "bodyShape": "",
    "skinTone": "",
    "styleMatch": ""
  },
  "recommended_outfit": {
    "score": 0,
    "items": [
      {
        "productId": "",
        "reason": ""
      }
    ],
    "whyItMatches": ""
  },
  "alternatives": [],
  "fitWarnings": [],
  "fashionTips": []
}
```

### 8.10 Grounding validation

Sau khi Gemini trả JSON, backend không tin ngay. Backend validate product IDs bằng:

```text
backend/services/groundingValidation.service.js
```

Hàm:

```js
findInvalidProductIds({ recommendation, allowedProductIds })
```

Nếu Gemini recommend product ID không nằm trong retrieved context:

1. Backend gọi Gemini lại một lần.
2. Gửi correction:

```text
Regenerate the same schema using only product IDs from allowedProductIds.
```

3. Validate lại.
4. Nếu vẫn sai, API trả `502`.

Mục tiêu: Gemini không được tự bịa product ngoài database.

### 8.11 Enrich recommendation trước khi trả frontend

Gemini chỉ trả `productId` và `reason`. Backend map ID đó về product detail thật bằng:

```js
enrichRecommendation({ recommendation, products })
```

Response frontend nhận được có:

```json
{
  "product": {
    "id": "P001",
    "name": "Linen Shirt",
    "category": "shirt",
    "price": 590000,
    "colors": ["white"],
    "sizes": ["S", "M"],
    "imageUrl": "https://...",
    "availability": "in_stock",
    "shop": {}
  },
  "reason": "..."
}
```

Điều này đảm bảo product detail luôn đến từ backend/database, không đến từ nội dung Gemini tự sinh.

## 9. Feedback và user memory

Route:

```text
POST /api/stylist/feedback
```

Controller:

```text
submitStylistFeedback
```

Service:

```text
backend/services/fashionMemory.service.js
```

Request ví dụ:

```json
{
  "userId": "demo-user",
  "productIds": ["P001", "P002"],
  "outfitId": "manual-test-001",
  "eventType": "liked",
  "reason": "I like the minimalist style."
}
```

Các `eventType` hợp lệ theo setup guide:

```text
liked
disliked
tried_on
purchased
returned
```

### 9.1 Lưu raw feedback event

Mỗi feedback event được insert vào:

```text
fashion_feedback_events
```

Document ví dụ:

```json
{
  "userId": "demo-user",
  "productIds": ["P001"],
  "outfitId": "manual-test-001",
  "eventType": "liked",
  "reason": "...",
  "createdAt": "..."
}
```

### 9.2 Cập nhật memory

Service lấy product theo `productIds`, rồi rút ra các signal:

```text
styleTags
colors
category
fitType
```

Nếu event là positive:

```text
liked
purchased
tried_on
```

thì update:

```text
likedStyles
favoriteColors
preferredCategories
fitPreference
```

Nếu event là negative:

```text
disliked
returned
```

thì update:

```text
dislikedStyles
avoidedColors
dislikedCategories
```

Memory này sẽ được dùng ở những lần recommend sau.

## 10. Trạng thái product trong AI Stylist

Một product có thể nằm trong MongoDB nhưng không được AI Stylist recommend nếu:

1. Chưa có `embedding`.
2. Atlas Vector Search index chưa ready.
3. `status !== "published"`.
4. Shop của product không active.
5. `availability` không phải `in_stock`.
6. `gender` không match request.
7. `occasionTags` không match request occasion.
8. `price` nằm ngoài budget.
9. Product bị rerank thấp và bị cắt sau limit.

Checklist để product có thể được recommend:

```text
products.embedding tồn tại
products.embeddingStale === false
products.status === "published"
products.availability === "in_stock"
products.gender match user gender hoặc "unisex"
products.occasionTags chứa request.occasion
products.price nằm trong budget
shops.status === "active"
Atlas products_embedding_index Ready
```

## 11. Quy trình vận hành khuyến nghị

### 11.1 Sau khi shop owner import product

1. Shop owner import Excel.
2. Product mới vào `products` với `status: "draft"`.
3. Manager/system bổ sung các field AI:

```text
category
description
gender
colors
styleTags
occasionTags
fitType
status
```

4. Manager publish product:

```text
status = "published"
```

5. Chạy:

```bash
cd backend
npm run embed:products
```

6. Kiểm tra dashboard product AI column:

```text
ready
```

7. Test AI Stylist request.

### 11.2 Sau khi manager sửa field AI

1. Update field AI của product.
2. Backend set `embeddingStale: true`.
3. Chạy:

```bash
npm run embed:products
```

4. Product trở lại `ready`.

### 11.3 Sau khi đổi Gemini embedding model

1. Chạy embed lại data.
2. Kiểm tra length của `embedding`.
3. Sửa Atlas Vector Search `numDimensions` cho khớp.
4. Chờ index rebuild xong.
5. Test recommendation.

## 12. Troubleshooting

### 12.1 Dashboard vẫn hiện needs embed sau khi chạy embed

Kiểm tra:

```text
script có set embeddingStale: false chưa
product có bị skip do text rỗng không
product có embedding không
backend/frontend đã reload chưa
database trong .env có đúng database dashboard đang đọc không
```

Query mẫu trong MongoDB:

```js
db.products.findOne(
  { id: "PRODUCT_ID" },
  {
    id: 1,
    embeddingStale: 1,
    embeddingUpdatedAt: 1,
    embeddingTextHash: 1,
    embedding: { $slice: 3 }
  }
)
```

### 12.2 PlanExecutor error: Path needs to be indexed as filter

Ví dụ:

```text
Path 'availability' needs to be indexed as filter
```

Nghĩa là `$vectorSearch.filter` đang dùng `availability`, nhưng Atlas index chưa khai báo:

```json
{
  "type": "filter",
  "path": "availability"
}
```

Cách sửa: vào Atlas Search index JSON, thêm field filter đó, save, rồi đợi index chuyển sang `Ready`.

### 12.3 Vector index dimension error

Kiểm tra length của embedding:

```js
db.products.findOne({ embedding: { $exists: true } }).embedding.length
```

Giá trị này phải bằng `numDimensions` trong Atlas Vector Search Index.

### 12.4 AI Stylist trả noMatch

Kiểm tra product:

```js
db.products.find({
  status: "published",
  availability: "in_stock",
  embedding: { $exists: true }
})
```

Kiểm tra shop:

```js
db.shops.find({ status: "active" })
```

Kiểm tra occasion:

```js
db.products.find({ occasionTags: "date" })
```

Kiểm tra budget:

```js
db.products.find({ price: { $lte: 1500000 } })
```

### 12.5 Gemini returned product IDs outside retrieved context

Backend đã có grounding validation. Nếu gặp lỗi này:

1. Gemini lần đầu recommend product ngoài context.
2. Backend retry một lần với correction.
3. Nếu vẫn sai, backend trả `502`.

Cách giảm lỗi:

```text
giữ retrievedProducts gọn và rõ ràng
đảm bảo product id ổn định
tăng chất lượng product name/category/description/styleTags
kiểm tra model generation
```

## 13. Các file quan trọng

Product:

```text
backend/services/product.service.js
backend/services/productImport.service.js
backend/services/xlsxImage.service.js
backend/controllers/shopProduct.controller.js
backend/routes/shopProduct.routes.js
frontend/src/pages/ShopDashboardPage.jsx
```

Embedding:

```text
backend/scripts/embedCollection.js
backend/services/embeddingText.service.js
backend/services/gemini.service.js
```

Stylist:

```text
backend/controllers/stylist.controller.js
backend/services/retrieval.service.js
backend/services/groundingValidation.service.js
backend/services/fashionMemory.service.js
backend/routes/stylist.routes.js
```

MongoDB setup:

```text
MONGODB_STYLIST_SETUP.md
```

## 14. Tóm tắt ngắn gọn

Product được lưu trong MongoDB collection `products`.

Embedding được tạo bằng script:

```bash
npm run embed:products
```

Product embedding text gồm:

```text
name, category, description, colors, styleTags, occasionTags, material, gender, fitType
```

AI Stylist không query product trực tiếp bằng keyword. Quy trình là:

1. Tạo text từ request user và memory.
2. Embed text đó thành vector.
3. Dùng Atlas Vector Search tìm product/outfit/rule gần nghĩa.
4. Lọc product theo price, gender, availability, occasion, status, active shop.
5. Rerank bằng style/color/fit/review.
6. Đưa context đã lọc vào Gemini.
7. Validate Gemini chỉ dùng product IDs được phép.
8. Map product IDs về product detail thật trong database.
9. Trả response cho frontend.

Nguyên tắc quan trọng nhất:

```text
Gemini chỉ được recommend product nằm trong retrievedProducts.
Product detail trả về user phải đến từ backend/database, không đến từ Gemini tự bịa.
```
## Current prompt-first Stylist update

AI Stylist now treats the user prompt as the only required input.

Request:

```json
{
  "prompt": "Hom nay toi muon mot chiec vay cho buoi tiec sinh nhat.",
  "desiredOutfitCount": 5,
  "userId": "demo-user",
  "gender": "female",
  "budget": { "max": 1500000 },
  "profile": {
    "skinTone": "warm",
    "bodyShape": "triangle",
    "stylePreferences": ["minimalist"],
    "measurements": { "height": 165 }
  }
}
```

Only `prompt` is required. `userId`, `gender`, `budget`, and every `profile`
field are optional. Missing profile data must not block recommendation.

Response now includes multiple outfits:

```json
{
  "success": true,
  "outfits": [
    {
      "id": "outfit-1",
      "title": "Birthday dress look",
      "score": 91,
      "items": [],
      "whyItMatches": "",
      "fitWarnings": [],
      "fashionTips": []
    }
  ],
  "recommended_outfit": {}
}
```

`recommended_outfit` remains as a backward-compatible alias for the first
outfit. The default output count is 5 and the backend clamps
`desiredOutfitCount` to the range 1..5.

Retrieval uses `Prompt: ...` as the main embedding query. `occasionTags`,
`styleTags`, and `fitType` are soft rerank signals only. The product vector
search no longer hard-filters by `occasionTags`; hard filters are limited to
catalog eligibility such as published product, active shop, in-stock status,
and optional budget/gender constraints when the request provides them.
