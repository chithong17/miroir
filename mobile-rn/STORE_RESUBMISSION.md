# Miroir boutique commerce release

## Product scope

Miroir connects boutique shoppers with the shops behind the pieces. Customers browse actual shop products, inspect materials and available sizes, save a shortlist, ask a shop a product-linked question, and manage physical-goods orders and returns. Owners manage their catalog, stock, orders, return requests and customer conversations in a separate authenticated workspace.

The App Store-facing product remains the React Native app. A narrowly scoped backend change was added because Apple requires account deletion for every account type offered in the app; the Flutter client remains outside this change.

## Implemented

- Removed Try-On and Stylist routes, feature stores, global task monitor and product entry points. Old AI links no longer open these features.
- Discover, Saved, Orders and Account form the customer navigation. Existing /saved and /orders URLs are preserved by moving their routes into the tab group.
- Replaced promotional AI onboarding with boutique discovery, product-linked conversations and shop operations. Owner sign-in is reachable from the entry screen and discovery screen.
- Removed body-photo/measurement onboarding and collection of those fields from the RN profile screen. Previously stored backend data is not automatically deleted by this UI change.
- Discovery shows real boutiques represented in current catalog results, product materials, stocked sizes, search, price/category filters and actionable empty states. Boutique links are not a complete shop directory and have no invented verification claims.
- Catalog and shop grids use 2/3/4 columns; page width is bounded. Product detail uses a two-column layout on wide screens. Portrait lock was removed.
- Owner next-actions panel shows server-derived orders awaiting confirmation, orders to prepare/ship and unread messages. Failures show unavailable counts and retry instead of fabricated zeros.
- Removed AI metrics from the owner dashboard display while preserving existing backend contracts.
- Product/shop contact creates or resolves a real conversation before navigating, with product context retained.
- Failed customer account deletion retains the session and reports an error. It no longer silently signs out as if deletion succeeded.
- External digital-plan checkout was removed from the mobile UI for all roles/platforms. Existing billing URLs show access status and refresh only. Physical-product checkout remains separate. Backend shop access restrictions remain in force.
- Updated in-app privacy/terms text and photo permission purposes to match commerce use. The previous unverified 24-hour AI-photo deletion claim was removed.
- Added credential-confirmed owner account deletion for active and pending registrations. It revokes the owner login, closes owned boutiques, removes their catalog, queues unreferenced catalog media for cleanup and preserves transaction records needed for support and disputes.
- Removed the public backend key diagnostic and gated development diagnostic routes outside production.

## Before submitting a new binary

- Identify the source and signing identity of rejected build 1.0 (6). Keep the existing app's correct bundle ID and signing configuration; do not create a duplicate store listing.
- Build and test an actual signed iOS binary on iPhone and iPad, including landscape, large text, keyboard, offline recovery, image permissions, checkout and returns. Web fixtures and JavaScript exports do not establish native acceptance.
- Confirm that real production inventory, shop contact data and product images are accurate and licensed. Test a complete buyer/seller order lifecycle with designated test data.
- Confirm owner access entitlements on the review account. This RN change does not grant shop permissions or remove backend subscription gates.
- Deploy the backend owner-deletion endpoint and the updated public policy before distributing the new binary. Confirm the production endpoint from a designated disposable owner fixture; never test deletion against a real merchant.
- Operator confirmed by the user: Tien Ngoc Huynh (individual Apple Developer account). Support: miroirofficial20@gmail.com. Public policy: https://www.miroir.id.vn/privacy. The local website policy now explicitly scopes the mobile commerce app and provides direct customer/owner deletion, but these changes are not public until the website and backend are deployed.
- Build number is set to 7, following rejected build 6. Confirm `com.miroir.mobile` is the existing App Store listing's bundle identifier before signing.
- Replace AI-centric App Store descriptions, screenshots, keywords and review notes. Explain the boutique shopping/operations journey using features that the reviewer can actually access.
- Record a short device demo and provide stable customer/owner review accounts without real-money purchase requirements.
- Gather TestFlight feedback and document substantive changes before resubmitting under 4.3(b). Removing AI is a product decision, not an assurance of App Review approval.

## Suggested review path

Customer: browse as guest → inspect a product and its boutique → sign in → save a piece → contact the shop with product context → choose a stocked variant → checkout → track order/return.

Owner: enter boutique workspace → sign in with owner review account → inspect next actions → manage product variants/stock → process an order → reply to a customer → inspect returns and sales metrics.

Do not claim a native build, App Store submission, real settlement or completed TestFlight evaluation unless separately performed.

## Validation performed for this change

- 19 behavior tests passed, including successful/failed customer deletion and buyer/seller API contracts.
- 22 fixture browser flows passed, including checkout, transfer evidence, buyer/seller returns, product stock editing, archive/restore, session isolation, pending-owner registration, credential-confirmed owner deletion and the four-column iPad viewport.
- Three targeted browser flows were repeated after support identity/policy changes: public privacy/support access, owner work queue and iPad grid; all passed.
- TypeScript passed. ESLint passed with existing unused-import warnings. Heuristic design validators were executed; their raw report is retained under test-results and is not an App Review readiness score (it flags token definitions and icon sizes without understanding rendered controls).
- iOS and Android Hermes exports succeeded. These are JavaScript bundles, not signed native binaries.
- The supplied public privacy URL returned HTTP 200 on October 29, 2026. Its deployed rendered content was not visually inspected. The local website policy source now includes the mobile-specific commerce scope, operator identity and direct owner deletion, but still requires deployment and live visual verification.
- The new owner-deletion backend tests passed. The full backend suite currently has 93 passing and two pre-existing failures outside this release work: an outdated address-snapshot expectation and a removed shop-plan middleware export. Do not describe the entire backend suite as green until those owners resolve their contracts.
- Screenshots under test-results use fixture products/shops and do not demonstrate production inventory or image quality.
