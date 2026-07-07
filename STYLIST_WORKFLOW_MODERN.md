# Modern AI Stylist Workflow

Tài liệu này mô tả luồng AI Stylist hiện đại của MIROIR sau khi chuyển sang kiến trúc **prompt-first**. Mục tiêu của flow mới là để người dùng chỉ cần nhập một câu tự nhiên, ví dụ:

```text
I want a dress for my party.
```

Backend sẽ dùng prompt đó làm tín hiệu chính để tìm sản phẩm thật trong catalog, tạo nhiều outfit phù hợp, validate product ID, enrich dữ liệu sản phẩm từ database, rồi trả về frontend.

## 1. Tóm tắt luồng hiện tại

AI Stylist hiện không còn bắt người dùng phải điền occasion, style preference, số đo, màu da, dáng người. Các field đó vẫn có thể dùng để cá nhân hóa, nhưng đều là optional.

Luồng tổng quát:

```text
User nhập prompt ở frontend
        |
        v
Frontend build request POST /api/stylist/recommend
        |
        v
Backend validate: chỉ bắt buộc prompt
        |
        v
Nếu có userId: load user fashion memory
        |
        v
Build query text từ prompt + optional profile + memory
        |
        v
Gemini Embedding tạo query vector
        |
        v
Atlas Vector Search tìm products, outfits, fashion_rules
        |
        v
Backend lọc product eligible: published, active shop, shopId tồn tại
        |
        v
Backend rerank product bằng vectorScore + optional memory/profile signals
        |
        v
Gemini Generation tạo tối đa 5 outfits
        |
        v
Backend validate productId chỉ nằm trong retrieved context
        |
        v
Backend enrich product detail thật từ database
        |
        v
Frontend render nhiều outfit và cho feedback từng outfit
```

Nếu Gemini Generation timeout hoặc lỗi, backend không trả trắng. Backend sẽ dùng fallback để tạo outfit từ top retrieved products.

## 2. Frontend flow

Frontend chính nằm ở:

```text
frontend/src/pages/StylistPage.jsx
frontend/src/api/stylistApi.js
```

### 2.1 Input chính

Input chính là textarea `prompt`.

Ví dụ:

```text
I want a dress for my party.
```

Hoặc:

```text
Hôm nay tôi muốn một chiếc váy cho buổi tiệc sinh nhật.
```

Frontend luôn gửi:

```json
{
  "prompt": "I want a dress for my party.",
  "desiredOutfitCount": 5
}
```

### 2.2 Optional profile

Người dùng có thể mở panel optional profile. Các field optional gồm:

```text
userId
gender
skinTone
bodyShape
stylePreferences
feedback / notes
budgetMin
budgetMax
height
weight
bust
waist
hips
shoulder
```

Nếu field nào rỗng thì frontend không đưa field đó vào payload. Điều này quan trọng vì backend không nên bị ép filter theo thông tin người dùng không cung cấp.

### 2.3 Payload frontend gửi

Prompt-only payload:

```json
{
  "prompt": "I want a dress for my party.",
  "desiredOutfitCount": 5
}
```

Payload có optional profile:

```json
{
  "prompt": "I want a dress for my party.",
  "userId": "demo-user",
  "gender": "female",
  "budget": {
    "min": 0,
    "max": 1500000
  },
  "profile": {
    "skinTone": "warm",
    "bodyShape": "triangle",
    "stylePreferences": ["minimalist", "smart casual"],
    "feedback": "I prefer relaxed fit.",
    "measurements": {
      "height": 165,
      "weight": 52,
      "bust": 84,
      "waist": 66,
      "hips": 90,
      "shoulder": 38
    }
  },
  "desiredOutfitCount": 5
}
```

### 2.4 Render kết quả

Frontend nhận response có `outfits`.

Mỗi outfit được render thành một nhóm riêng:

```text
Outfit title
Score
Why it matches
Product cards
Fit warnings
Fashion tips
Feedback buttons
Try On link
```

Feedback được gửi theo từng outfit, không phải toàn bộ response.

## 3. API contract

Endpoint chính:

```http
POST /api/stylist/recommend
```

### 3.1 Request mới

Field bắt buộc duy nhất:

```text
prompt
```

Các field optional:

```text
userId
gender
budget
profile
desiredOutfitCount
```

`desiredOutfitCount` mặc định là `5`. Backend clamp giá trị này trong range:

```text
1..5
```

Nếu client gửi `desiredOutfitCount = 99`, backend vẫn chỉ dùng `5`.

Nếu client không gửi hoặc gửi sai kiểu, backend dùng default `5`.

### 3.2 Response thành công

Response chính:

```json
{
  "success": true,
  "analysis": {
    "bodyShape": "",
    "skinTone": "",
    "styleMatch": ""
  },
  "outfits": [
    {
      "id": "outfit-1",
      "title": "Party dress look",
      "score": 91,
      "items": [
        {
          "product": {
            "id": "product-id",
            "name": "Chân váy lụa",
            "category": "dress",
            "price": 590000,
            "colors": [],
            "sizes": [],
            "imageUrl": "",
            "availability": "in_stock",
            "shop": {
              "id": "shop-id",
              "name": "Shop A",
              "slug": "shop-a",
              "logoUrl": ""
            }
          },
          "reason": "Why this item matches."
        }
      ],
      "whyItMatches": "",
      "fitWarnings": [],
      "fashionTips": []
    }
  ],
  "recommended_outfit": {
    "score": 91,
    "items": [],
    "whyItMatches": ""
  },
  "alternatives": [],
  "fitWarnings": [],
  "fashionTips": [],
  "retrieval": {
    "productCount": 20,
    "outfitCount": 2,
    "fashionRuleCount": 2
  }
}
```

### 3.3 Backward compatibility

Response vẫn giữ:

```text
recommended_outfit
```

Field này là alias cho outfit đầu tiên trong `outfits`.

Lý do giữ lại: tránh làm hỏng code cũ đang đọc `recommended_outfit`.

### 3.4 No match response

Nếu backend không tìm được product eligible sau vector search và post-filter:

```json
{
  "success": true,
  "noMatch": true,
  "message": "No eligible products were found for this styling request.",
  "analysis": {
    "bodyShape": "",
    "skinTone": "",
    "styleMatch": "No product context was available for generation."
  },
  "recommended_outfit": {
    "score": 0,
    "items": [],
    "whyItMatches": ""
  },
  "outfits": [],
  "alternatives": [],
  "fitWarnings": [],
  "fashionTips": []
}
```

## 4. Backend controller flow

Controller chính:

```text
backend/controllers/stylist.controller.js
```

### 4.1 Validate request

Backend chỉ validate:

```text
body tồn tại
body.prompt là string không rỗng
```

Những field sau không còn bắt buộc:

```text
userId
measurements
budget.max
occasion
skinTone
bodyShape
stylePreferences
gender
```

Nếu thiếu prompt:

```json
{
  "success": false,
  "message": "prompt is required."
}
```

### 4.2 Normalize desired outfit count

Backend dùng function normalize để đảm bảo số outfit nằm trong range an toàn:

```text
missing / invalid -> 5
less than 1 -> 1
greater than 5 -> 5
valid integer -> giữ nguyên
```

### 4.3 Build retrieval request

Backend gom dữ liệu từ body và profile:

```js
{
  prompt,
  gender,
  occasion,
  bodyShape,
  skinTone,
  stylePreferences,
  feedback,
  budget,
  desiredOutfitCount
}
```

Lưu ý:

```text
prompt là tín hiệu chính.
profile chỉ là tín hiệu phụ.
field rỗng sẽ thành string rỗng hoặc array rỗng.
```

### 4.4 Load user fashion memory

Nếu request có `userId`, backend gọi:

```text
getUserFashionMemory(userId)
```

Memory có thể chứa:

```text
likedStyles
dislikedStyles
favoriteColors
avoidedColors
fitPreference
preferredCategories
dislikedCategories
```

Nếu không có `userId`, memory là `null`. Flow vẫn chạy bình thường.

## 5. Query text và embedding

Service chính:

```text
backend/services/retrieval.service.js
backend/services/gemini.service.js
```

### 5.1 Build stylist query text

Backend tạo text để embed:

```text
Prompt: I want a dress for my party.
Gender: female
Body shape: triangle
Skin tone: warm
Style preferences: minimalist, smart casual
Feedback: I prefer relaxed fit.
Liked styles: minimalist
Favorite colors: beige
Fit preference: relaxed
```

Nếu user chỉ nhập prompt, query text chỉ là:

```text
Prompt: I want a dress for my party.
```

### 5.2 Vì sao prompt là chính

Vector search dựa trên embedding của query text. Vì dòng đầu tiên luôn là:

```text
Prompt: ...
```

nên semantic intent của người dùng là tín hiệu mạnh nhất.

Ví dụ prompt:

```text
I want a dress for my party.
```

sẽ gần nghĩa với product embedding có:

```text
Category: dress
Occasion tags: party
Name: Chân váy lụa
Name: Chân váy tennis
```

### 5.3 Gemini embedding

Backend gọi:

```text
generateEmbedding(queryText)
```

Env:

```env
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

Gemini trả về vector. Hiện data đang dùng vector dimension:

```text
3072
```

Vector này được đưa vào Atlas `$vectorSearch`.

## 6. Product retrieval

Product retrieval dùng Atlas Vector Search trên collection:

```text
products
```

Index env:

```env
MONGODB_PRODUCT_VECTOR_INDEX=products_embedding_index
```

Pipeline chính:

```js
[
  {
    $vectorSearch: {
      index: "products_embedding_index",
      path: "embedding",
      queryVector,
      numCandidates: 200,
      limit: 40,
      filter
    }
  },
  {
    $addFields: {
      vectorScore: { $meta: "vectorSearchScore" }
    }
  },
  {
    $project: {
      embedding: 0
    }
  }
]
```

### 6.1 Hard filters trong vector search

Hiện tại filter trong `$vectorSearch` chỉ dùng các field có thể filter trực tiếp trong Atlas index:

```text
availability
gender nếu request có gender
price nếu request có budget
```

Luôn lọc availability:

```js
{
  $or: [
    { availability: "in_stock" },
    { availability: true }
  ]
}
```

Nếu có budget:

```js
{ price: { $lte: budget.max } }
{ price: { $gte: budget.min } }
```

Nếu có gender:

```js
{ gender: { $in: [request.gender, "unisex"] } }
```

### 6.2 Những gì không còn là hard filter trong vector search

Các field sau không còn ép filter trực tiếp trong Atlas Vector Search:

```text
occasionTags
styleTags
fitType
status
shop status
skinTone
bodyShape
measurements
```

Lý do:

```text
occasionTags/styleTags/fitType có thể thiếu hoặc không đồng nhất.
Prompt-first cần semantic search rộng hơn.
status từng gây lỗi "Path 'status' needs to be indexed as filter".
shop status nằm ở collection shops, không filter trực tiếp trong products vector index.
```

### 6.3 Post-filter sau vector search

Sau khi Atlas trả raw products, backend lọc eligibility:

```js
product.status === "published"
product.shopId tồn tại
shop của product đang active
```

Active shop được lấy bằng:

```text
getActiveShopsByIds(shopIds)
```

Shop active nghĩa là:

```js
shops.status === "active"
```

Nếu product có embedding nhưng không có `status`, không có `shopId`, hoặc shop không active, product đó sẽ không được recommend.

### 6.4 Vì sao product mẫu có thể không được trả

Một product có thể gần nghĩa với prompt nhưng vẫn bị loại nếu:

```text
status không phải published
shopId thiếu
shop inactive
availability không in_stock
gender không match khi request có gender
price ngoài budget khi request có budget
```

Ví dụ product seed cũ có:

```text
Name: Warm Beige Midi Dress
Category: dress
Embedding: có
Status: thiếu
ShopId: thiếu
```

Product này có thể xuất hiện trong raw vector search, nhưng sẽ bị post-filter loại vì không thuộc active shop và không published.

## 7. Outfit template và fashion rule retrieval

Ngoài products, backend còn tìm context phụ:

```text
outfits
fashion_rules
```

### 7.1 Outfit vector search

Collection:

```text
outfits
```

Index env:

```env
MONGODB_OUTFIT_VECTOR_INDEX=outfits_embedding_index
```

Limit:

```text
5
```

Nếu request có gender, outfit search filter:

```js
{ gender: { $in: [request.gender, "unisex"] } }
```

Outfit templates chỉ là guidance cho Gemini. Chúng không phải sản phẩm thật.

### 7.2 Fashion rule vector search

Collection:

```text
fashion_rules
```

Index env:

```env
MONGODB_FASHION_RULE_VECTOR_INDEX=fashion_rules_embedding_index
```

Limit:

```text
10
```

Fashion rules giúp Gemini có thêm ngữ cảnh về dáng người, tone da, màu sắc, style harmony. Nếu user không cung cấp profile thì rules vẫn có thể được retrieve theo semantic prompt, nhưng không được dùng như điều kiện bắt buộc.

## 8. Rerank products

Sau post-filter, backend rerank products.

Base score:

```text
product.vectorScore
```

Bonus / penalty:

```text
+0.20 nếu product.styleTags match request.stylePreferences
+0.12 nếu product.occasionTags match request.occasion
+0.12 nếu product.colors match memory.favoriteColors
+0.12 nếu product.styleTags match memory.likedStyles
+0.08 nếu product.fitType match memory.fitPreference
+0.06 nếu reviewSummary.fitSignals.trueToSize
+0.05 nếu reviewSummary.fitSignals.comfortScore >= 4.3
-0.20 nếu product.styleTags match memory.dislikedStyles
-0.20 nếu product.colors match memory.avoidedColors
-0.15 nếu product.category nằm trong memory.dislikedCategories
```

Quan trọng:

```text
Nếu request không có occasion thì occasionTags không cộng điểm.
Nếu request không có stylePreferences thì styleTags không cộng điểm.
Nếu không có userId thì memory null, các điểm memory không áp dụng.
```

Sau rerank:

```text
sort desc theo rerankScore
slice top 30
```

Trong generation payload, backend chỉ gửi top 18 products cho Gemini để giảm payload và giảm nguy cơ timeout.

## 9. Review summaries

Backend lấy review summaries sau khi biết product eligible:

```text
getReviewSummariesByProductIds(productIds)
```

Collection:

```text
product_review_summaries
```

Fields dùng:

```text
productId
summary
fitSignals
commonFeedback
updatedAt
```

Review summaries không nằm trong product embedding. Chúng chỉ được đưa vào generation payload để Gemini cân nhắc fit, comfort, warning.

## 10. Generation payload

Sau retrieval, backend build payload cho Gemini:

```json
{
  "prompt": "I want a dress for my party.",
  "userProfile": {
    "userId": "",
    "measurements": {},
    "bodyShape": "",
    "skinTone": "",
    "gender": "",
    "stylePreferences": [],
    "budget": null,
    "occasion": "",
    "feedback": ""
  },
  "userMemory": {},
  "desiredOutfitCount": 5,
  "retrievedProducts": [],
  "reviewSummaries": [],
  "retrievedOutfits": [],
  "retrievedFashionRules": [],
  "outputRules": {
    "allowedProductIds": [],
    "productDetailsMustComeFromBackend": true
  }
}
```

### 10.1 retrievedProducts

Mỗi product gửi cho Gemini gồm:

```text
id
name
category
price
colors
sizes
styleTags
occasionTags
material
fitType
shop
rerankScore
```

Không gửi `embedding` cho Gemini.

### 10.2 outputRules

`allowedProductIds` là danh sách ID backend cho phép Gemini dùng.

Gemini phải tuân thủ:

```text
Chỉ recommend product nằm trong allowedProductIds.
Không invent product.
Không dùng product ngoài retrieved context.
```

## 11. Gemini Generation

Service:

```text
backend/services/gemini.service.js
```

Env:

```env
GEMINI_GENERATION_MODEL=gemini-3.5-flash
```

Timeout:

```text
60000 ms
```

System prompt yêu cầu:

```text
Use the user's prompt as the primary styling brief.
Use optional profile only when provided.
Return up to desiredOutfitCount distinct complete outfits.
Use only products in retrievedProducts.
Return JSON only.
Set recommended_outfit to first outfit for backward compatibility.
```

Schema Gemini phải trả:

```json
{
  "analysis": {
    "bodyShape": "",
    "skinTone": "",
    "styleMatch": ""
  },
  "outfits": [
    {
      "id": "",
      "title": "",
      "score": 0,
      "items": [
        {
          "productId": "",
          "reason": ""
        }
      ],
      "whyItMatches": "",
      "fitWarnings": [],
      "fashionTips": []
    }
  ],
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

## 12. Fallback khi Gemini timeout

Gemini Generation đôi khi timeout hoặc lỗi. Flow hiện tại không để request fail trắng.

Nếu `generateStylistRecommendation` throw error, backend gọi:

```text
buildFallbackRecommendation({ body, context })
```

Fallback sẽ:

```text
Lấy top retrieved products.
Tạo số outfit theo desiredOutfitCount.
Mỗi outfit có primary product + một vài product phụ.
Set reason đơn giản dựa trên catalog match.
Set styleMatch nói rõ đây là fallback.
```

Ví dụ với prompt:

```text
I want a dress for my party.
```

Fallback có thể trả:

```text
Outfit 1: Chân váy lụa, Chân váy tennis, Quần tây đen
Outfit 2: Chân váy tennis, Quần tây đen, Áo hay dây
```

Mục tiêu của fallback:

```text
Không để user thấy "không có sản phẩm" chỉ vì Gemini generation timeout.
Vẫn trả product thật, đã qua retrieval và eligibility filter.
```

## 13. Grounding validation

Service:

```text
backend/services/groundingValidation.service.js
```

### 13.1 Validate product IDs

Backend kiểm tra tất cả productId trong:

```text
outfits[*].items[*].productId
recommended_outfit.items[*].productId
alternatives[*].productId
```

Nếu có productId không nằm trong `allowedProductIds`, backend coi đó là invalid.

### 13.2 Retry correction

Nếu Gemini trả invalid product IDs, backend gọi Gemini lần nữa với correction:

```text
Regenerate the same schema using only product IDs from allowedProductIds.
Check every productId inside outfits, recommended_outfit, and alternatives.
```

Nếu correction cũng fail hoặc timeout, backend dùng fallback.

Nếu sau retry/fallback vẫn còn invalid IDs, backend trả:

```json
{
  "success": false,
  "message": "Gemini returned product IDs outside the retrieved context after retry.",
  "invalidProductIds": []
}
```

Trong flow bình thường, fallback dùng product IDs từ context nên không bị invalid.

## 14. Enrichment

Gemini chỉ trả:

```text
productId
reason
```

Backend không tin Gemini về thông tin sản phẩm. Backend enrich từ `context.products`.

Mỗi item sau enrich:

```json
{
  "product": {
    "id": "product-id",
    "name": "Chân váy lụa",
    "category": "dress",
    "price": 590000,
    "colors": [],
    "sizes": [],
    "imageUrl": "",
    "availability": "in_stock",
    "shop": {}
  },
  "reason": "..."
}
```

Điều này đảm bảo:

```text
Tên sản phẩm là dữ liệu thật.
Giá là dữ liệu thật.
Ảnh là dữ liệu thật.
Shop là dữ liệu thật.
Gemini không invent product detail.
```

## 15. Feedback flow

Endpoint:

```http
POST /api/stylist/feedback
```

Frontend gửi feedback theo từng outfit:

```json
{
  "userId": "demo-user",
  "productIds": ["product-1", "product-2"],
  "outfitId": "outfit-1",
  "eventType": "liked",
  "reason": "I prefer relaxed fit."
}
```

### 15.1 eventType

Các event type hiện có:

```text
liked
disliked
tried_on
purchased
returned
```

### 15.2 Nếu không có userId

Nếu thiếu `userId`, backend không lưu memory cá nhân và trả:

```json
{
  "success": true,
  "memory": null
}
```

Flow UI vẫn không lỗi.

### 15.3 Nếu có userId

Backend:

```text
Lưu raw event vào fashion_feedback_events.
Load products theo productIds.
Trích signals: styles, colors, categories, fitType.
Update user_fashion_memory.
```

Positive events:

```text
liked
purchased
tried_on
```

sẽ update:

```text
likedStyles
favoriteColors
preferredCategories
fitPreference
```

Negative events:

```text
disliked
returned
```

sẽ update:

```text
dislikedStyles
avoidedColors
dislikedCategories
```

Memory này sẽ được dùng ở những request sau nếu user gửi cùng `userId`.

## 16. Mongo connection behavior

Service:

```text
backend/services/mongo.service.js
```

Mongo connection hiện có:

```text
client
db
connectionPromise
```

Lý do có `connectionPromise`:

```text
retrieveStylistContext chạy 3 vector search song song.
Nếu server cold-start và cả 3 cùng gọi getMongoDb(), có thể tạo nhiều connection đồng thời.
connectionPromise giúp mọi caller chờ chung một connection đang mở.
```

Flow:

```text
Nếu db đã có -> return db
Nếu connectionPromise đang có -> return connectionPromise
Nếu chưa có -> tạo MongoClient, connect, set db, return db
Nếu connect lỗi -> reset connectionPromise và client
```

Điều này tránh race condition khi request đầu tiên gọi AI Stylist.

## 17. Điều kiện để product được AI Stylist recommend

Một product cần:

```text
Có embedding trong products.embedding
Có availability in_stock hoặc true
Có status published
Có shopId
Shop tương ứng status active
Nếu request có gender thì product.gender phải match gender hoặc unisex
Nếu request có budget thì price phải nằm trong budget
```

Product không cần bắt buộc có:

```text
occasionTags
styleTags
fitType
description
colors
sizes
review summary
```

Nhưng nếu thiếu các field đó thì chất lượng semantic search/generation có thể kém hơn.

## 18. Ví dụ thực tế: prompt "I want a dress for my party."

### 18.1 Request

```json
{
  "prompt": "I want a dress for my party.",
  "desiredOutfitCount": 5
}
```

### 18.2 Query text

```text
Prompt: I want a dress for my party.
```

### 18.3 Vector Search

Atlas tìm products gần nghĩa với prompt.

Ví dụ top product eligible:

```text
Chân váy lụa
Chân váy tennis
Quần tây đen
Áo hay dây
Quần jean suông
```

### 18.4 Backend post-filter

Backend loại sản phẩm không eligible:

```text
draft
archived
trashed
missing shopId
shop inactive
out_of_stock
```

### 18.5 Generation hoặc fallback

Nếu Gemini trả kịp, response có outfit được stylist viết tự nhiên.

Nếu Gemini timeout, fallback vẫn trả:

```text
Outfit 1: Chân váy lụa, Chân váy tennis, Quần tây đen
Outfit 2: Chân váy tennis, Quần tây đen, Áo hay dây
...
```

## 19. Các lỗi thường gặp và cách hiểu

### 19.1 `prompt is required.`

Request thiếu prompt hoặc prompt rỗng.

Fix:

```json
{
  "prompt": "I want a dress for my party."
}
```

### 19.2 `No eligible products were found for this styling request.`

Vector search có thể không tìm được product eligible sau filter.

Kiểm tra:

```text
Product có embedding chưa?
Product status có published không?
Product availability có in_stock không?
Product có shopId không?
Shop có active không?
Nếu gửi gender, product gender có match không?
Nếu gửi budget, price có nằm trong budget không?
```

### 19.3 `Path 'status' needs to be indexed as filter`

Lỗi này xảy ra khi dùng `status` trong `$vectorSearch.filter` nhưng Atlas index chưa khai báo `status` là filter field.

Hiện workflow đã tránh lỗi này bằng cách:

```text
Không filter status trong $vectorSearch.
Filter status ở backend sau vector search.
```

### 19.4 `Path 'availability' needs to be indexed as filter`

Lỗi này nghĩa là Atlas Vector Search index chưa khai báo `availability` là filter field.

Vì workflow hiện vẫn filter availability trong `$vectorSearch`, index cần có:

```json
{
  "type": "filter",
  "path": "availability"
}
```

Nếu dùng gender/budget filter, index cũng cần các filter paths tương ứng:

```json
{
  "type": "filter",
  "path": "gender"
}
```

```json
{
  "type": "filter",
  "path": "price"
}
```

### 19.5 Gemini generation timeout

Nếu Gemini Generation quá 60 giây, backend log:

```text
Gemini stylist generation failed, using fallback
```

Response vẫn thành công vì backend dùng fallback outfit từ retrieved products.

### 19.6 Backend không load code mới

Nếu đã sửa code nhưng frontend vẫn thấy lỗi cũ:

```text
Restart backend port 5000.
Hard refresh frontend.
```

## 20. Debug checklist nhanh

### 20.1 Test health

```http
GET http://localhost:5000/api/health
```

Expected:

```json
{
  "success": true,
  "message": "MIROIR backend is running"
}
```

### 20.2 Test recommend endpoint

```http
POST http://localhost:5000/api/stylist/recommend
Content-Type: application/json

{
  "prompt": "I want a dress for my party.",
  "desiredOutfitCount": 5
}
```

Expected:

```text
success = true
outfits.length > 0
retrieval.productCount > 0
```

### 20.3 Nếu backend trả productCount > 0 nhưng outfits = 0

Kiểm tra:

```text
Gemini có trả productId hợp lệ không?
Grounding enrichment có filter hết item không?
Fallback có được gọi không?
```

### 20.4 Nếu productCount = 0

Kiểm tra database:

```text
products.embedding tồn tại
products.status = published
products.availability = in_stock
products.shopId tồn tại
shops.status = active
```

### 20.5 Nếu request chậm

Các điểm có thể chậm:

```text
Gemini embedding
Atlas Vector Search
Gemini generation
Mongo cold start
```

Hiện Mongo cold start đã được giảm rủi ro bằng `connectionPromise`.

## 21. Vai trò của từng file

```text
frontend/src/pages/StylistPage.jsx
```

UI prompt-first, optional profile, render nhiều outfit, gửi feedback theo outfit.

```text
frontend/src/api/stylistApi.js
```

Axios client gọi `/api/stylist/recommend` và `/api/stylist/feedback`.

```text
backend/controllers/stylist.controller.js
```

Validate request, load memory, gọi retrieval, gọi Gemini, fallback, validate grounding, trả response.

```text
backend/services/retrieval.service.js
```

Build query text, tạo query embedding, chạy Atlas Vector Search, post-filter, rerank.

```text
backend/services/gemini.service.js
```

Gọi Gemini Embedding và Gemini Generation.

```text
backend/services/groundingValidation.service.js
```

Validate product IDs, enrich product detail thật từ backend context.

```text
backend/services/fashionMemory.service.js
```

Lưu feedback event và update user fashion memory.

```text
backend/services/mongo.service.js
```

Quản lý Mongo connection dùng chung.

```text
backend/services/reviewSummary.service.js
```

Load review summaries cho product đã retrieve.

```text
backend/services/shop.service.js
```

Load active shops để đảm bảo chỉ recommend product từ shop active.

## 22. Nguyên tắc thiết kế hiện tại

### 22.1 Prompt-first

Người dùng không cần hiểu hệ thống field nội bộ. Prompt là nguồn intent chính.

### 22.2 Profile optional

Profile giúp cá nhân hóa nhưng không được chặn recommendation.

### 22.3 Grounded catalog

AI chỉ được recommend sản phẩm thật trong catalog đã retrieve.

### 22.4 Fail soft

Nếu Gemini generation lỗi, vẫn trả fallback từ product ranking.

### 22.5 Soft semantic matching

`occasionTags`, `styleTags`, `fitType` là tín hiệu mềm, không phải điều kiện bắt buộc.

### 22.6 Eligibility vẫn nghiêm ngặt

Product vẫn phải published, in stock, thuộc active shop.

