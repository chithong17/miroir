# MIROIR AI Stylist V2 Vector RAG Plan

## Summary
Implement a true Vector RAG stylist flow using MongoDB Atlas Vector Search, Gemini Embeddings for retrieval, and Gemini generation for final recommendations. Gemini must only recommend product ids retrieved from MongoDB vector/context search, and the backend must validate every returned id before sending results to the frontend.

## Key Interfaces
- Add backend env vars:
  - `MONGODB_URI`
  - `MONGODB_DB_NAME`
  - `GEMINI_API_KEY`
  - `GEMINI_EMBEDDING_MODEL`, default Gemini embedding model
  - `GEMINI_GENERATION_MODEL`, default Gemini generation model
- Add `POST /api/stylist/recommend`.
  - Input: measurements, body shape or inferable measurements, skin tone, style preferences, budget, occasion, optional feedback.
  - Output: user analysis, selected outfit, item-level reasons, fit notes, alternatives, warnings, and verified product details.
- Mongo product documents should include rich product fields:
  - `id`, `name`, `category`, `description`, `colors`, `sizes`, `price`, `style_tags`, `occasions`, `image_url`, `reviews`, `embedding`.

## Implementation Changes
- Add product embedding pipeline:
  - Build a searchable product text from name, category, description, colors, sizes, style tags, occasions, and summarized reviews.
  - Generate Gemini embeddings for each product.
  - Store embeddings in MongoDB product documents.
  - Add an admin/backfill script, for example `npm run embed:products`, that embeds products missing `embedding` or products whose searchable text changed.
- Configure MongoDB Atlas Vector Search:
  - Create vector index on `products.embedding`.
  - Use cosine similarity.
  - Keep filterable fields available for hybrid retrieval: price, category, occasions, style tags, colors, sizes.
- Add retrieval service:
  - Convert the user styling request into a retrieval query text, including occasion, style preferences, body/fit needs, skin tone, and feedback.
  - Generate query embedding with Gemini Embedding.
  - Run Atlas Vector Search to retrieve top candidates.
  - Apply hard filters for budget and availability before generation.
  - Use light re-ranking to prefer occasion match, style match, size compatibility, skin-tone color compatibility, and positive fit reviews.
  - Return around 20-40 products as grounded context.
- Add Gemini recommendation service:
  - Pass the MIROIR AI Stylist system prompt plus retrieved products as structured JSON.
  - Require JSON output with product ids only.
  - Ask Gemini to analyze measurements, body shape, skin tone, style preferences, budget, occasion, customer feedback, and fit reviews.
  - Require reasons per item, outfit-level explanation, alternatives, and fit warnings.
- Add grounding validation:
  - Build an allowlist from retrieved MongoDB product ids.
  - Reject or retry once if Gemini returns any product id outside the allowlist.
  - Enrich final response from MongoDB product data, not Gemini-provided product names/prices/images.
  - If retrieval returns no suitable products, return a clear no-match response without calling generation.

## Frontend Flow
- Add a Stylist page or section.
- Collect:
  - measurements
  - body shape if known
  - skin tone
  - style preferences
  - budget
  - occasion
  - optional feedback
- Submit to `/api/stylist/recommend`.
- Display:
  - analysis summary
  - recommended outfit
  - product cards with image, name, price, size/colors, reason, fit note
  - alternatives
  - warnings/no-match states
- Keep current `/try-on` flow unchanged, with optional future handoff from recommended product image to try-on.

## Test Plan
- Embedding/backfill:
  - Products without embeddings are embedded.
  - Products with unchanged searchable text are skipped.
  - Failed embedding calls are logged and do not corrupt existing products.
- Retrieval:
  - Vector search returns semantically relevant products.
  - Budget filter excludes products above max budget.
  - Occasion/style/fit re-ranking changes ordering as expected.
  - Empty result returns a no-match response.
- Gemini grounding:
  - Valid product ids pass.
  - Invented product ids trigger retry or controlled failure.
  - Alternatives are also validated against retrieved context.
- API:
  - Missing required user inputs returns `400`.
  - Successful request returns verified MongoDB product details.
  - Existing `/api/tryon` and `/api/health` continue working.
- Frontend:
  - Form validation works.
  - Loading, success, no-match, and error states render cleanly.
  - Recommendation cards display verified product data only.

## Assumptions
- MongoDB is MongoDB Atlas and supports Atlas Vector Search.
- Gemini is used for both embeddings and generation.
- Product records can be extended with an `embedding` field and optional searchable-text hash/version field.
- Reviews are stored inside product documents or can be joined/summarized before embedding.
- V2 implementation adds stylist recommendation; it does not replace the existing virtual try-on feature.
