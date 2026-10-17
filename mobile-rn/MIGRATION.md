# Flutter → React Native migration

The Flutter application in `../mobile` remains the reference and backup. All migration changes live in this directory. Backend contracts remain shared.

## Required parity

### Acceptance scope — 2026-10-16 (supersedes historical checkpoints below)

The user selected Android acceptance first; iOS native acceptance is deferred, not passed.

Final handoff scope: user will test the physical Android phone through Expo. The additional standalone ARM64/x86_64 release-variant build was stopped at the user's request to conserve time/tokens; no successful standalone release APK is claimed. Use `npx expo start --lan --go` from this directory with the phone and PC on the same network. Local `.env` public API/socket URLs target Render. The completed debug APK/emulator evidence below remains valid.

- [x] Lint, TypeScript, 20 behavior tests, 20 fixture browser scenarios.
- [x] Four unmocked browser scenarios: customer navigation, owner navigation, guest catalog/image, and real custom Try-on plus Stylist results.
- [x] 21 authenticated/public contract checks, including owner premium analytics after the authorized plan grant.
- [x] Web production and Android/iOS Hermes JavaScript exports (not native binaries).
- [x] Dependency security review recorded in SECURITY_REVIEW.md; 18 high production audit findings remain in inherited chains without upstream patched releases. This is not a clean audit or risk acceptance.
- [x] Authorized shop GROWTH grant through 2026-11-16; an existing unpaid pending checkout was cancelled first. No payment was made and no paid webhook was fabricated.
- [x] Android debug APK compiled and installed on the dedicated Android 34 x86_64 emulator. Real customer login, catalog data/images, all four primary tabs, and secure session restoration after force-stop/relaunch passed. Owner login, real shop details, premium dashboard values and active subscription display also passed.
- [ ] Exhaustive native acceptance, ARM physical-device testing and standalone release packaging. Emulator smoke coverage does not certify all native flows.
- [ ] Full screen-by-screen visual parity. Flutter reference screenshots exist; onboarding and Saved Items omissions were corrected, but complete pixel parity is not certified.
- [ ] Actual paid settlement/webhook acceptance. Unpaid checkout/grant verification does not prove a monetary transaction.
- [ ] iOS native acceptance — deferred by user.

Flutter `../mobile` remains unchanged. Credentials, DB snapshots and live-test artifacts are excluded from source control. Live AI uses public sample images rather than a customer's personal photo.

Local Android tooling is available at `D:\sdk`, using JDK 21, Gradle cache `D:\miroir-qa-gradle`, and a dedicated Android 34 x86_64 QA emulator. Older notes saying only platform-tools are installed are obsolete. A CMake config plugin bounds object paths; Windows Ninja 1.12.1 is available for long-path compatibility. No EAS upload or cloud build has been performed.

Android build: `assembleDebug --max-workers=1 -PreactNativeArchitectures=x86_64` succeeded (484 tasks). APK: `android/app/build/outputs/apk/debug/app-debug.apk`, SHA-256 `42C1B58923A37CCCF5D438251CC7106E31E0C6A24D2EA2F4082C785BAE669A3B`. It is a debug x86_64 emulator APK requiring Metro on port 8081, not a standalone ARM phone release. Runtime screenshots are in ignored `test-results/android/`; no ReactNativeJS/AndroidRuntime error was observed during the customer checks.

- [x] Foundation: Expo, TypeScript, navigation, API configuration, secure credentials, preferences, lifecycle handling.
- [x] Shared UI: moss/glass theme, buttons, fields, cards, loading, empty, error and success states.
- [x] Entry: onboarding, guest, customer registration/login, password reset, profile onboarding/editor, session restore/logout.
- [x] Marketplace: products/outfits, filtering/pagination, product and shop detail, feedback, favorites.
- [x] Try-on: catalog/custom upload, dress/upper-lower selection, validation, task polling, result and global status bubble.
- [x] Stylist: recommendation, profile inputs, feedback.
- [x] Commerce: variants, cart, addresses/provinces/wards, checkout, orders/cancellation, notifications.
- [x] Returns: customer request/images, shipment/images, escalation; owner decision/receipt/refund proof.
- [x] Chat: customer/shop inbox, messages, image attachments, context cards, pagination, read/unread and reconnect.
- [x] Payments: plans/paywall, external checkout, return links, status and subscription refresh.
- [x] Owner: separate authentication/session, shop editor, product CRUD/images/archive/restore, dashboard/analytics/insights.
- [x] Automated checks: type checking, behavior tests, production bundle, Android/iOS Hermes bundles and fixture-based critical E2E flows.
- [ ] Release verification: native binary/device testing, full screen-by-screen Flutter comparison, authenticated live API/AI/payment verification and dependency security review.

## Release constraints

Keep the existing application identifiers and signing credentials for a store upgrade, but use distinct development identifiers while both applications are installed. Flutter preferences are not automatically readable by JavaScript: plan a one-time native migration or an explicit re-login before production cutover. iOS native builds and device verification require macOS/Xcode or a configured remote builder.

## Current evidence

Inventory: 63 Dart source files, approximately 15,688 nonempty lines and 6 test files. The source README describes an older scaffold and is not an authoritative parity specification. Source implementations and backend routes are authoritative.

Implementation and validation are in progress. No feature or platform parity is claimed until its gate above has evidence.

### Implementation checkpoint

Historical progress notes follow. Statements such as "still outstanding" or earlier test counts describe that checkpoint only; use the dated acceptance scope above for current status. In particular, the deployed backend supports paid shop plans, not paid customer plans.

- Expo Router now owns the entry point and routes; app lifecycle triggers query focus and customer refresh.
- Customer profile supports flat measurement payloads matching Flutter, profile photo upload, save and skip.
- Marketplace routes implement catalog products/outfits, applied filters and pagination, favorites, product detail and review submission.
- Native permissions and secure-store/router configuration are declared in app.json.
- TypeScript passed after these changes. Device behavior, visual parity and full commerce/AI/owner integration remain unverified and incomplete.
- Try-on now implements catalog/custom uploads, image validation, global task state, non-overlapping foreground polling, completion bubble and late-response invalidation on reset/session changes.
- Stylist now implements recommendation/profile/budget payloads, results, product navigation, warnings/tips and positive/negative feedback.
- Four primary navigation destinations are wired. Remaining commerce, payment, chat and owner routes still require implementation.
- Verification checkpoint: `npx tsc --noEmit`, `npx expo export --platform web`, and three behavior tests in `node --test tests/try-on.test.cjs` passed. Tests cover selection validation, stale create responses after reset, and completed-task state. These are not device or end-to-end tests.
- Commerce implementation now includes product variant/quantity selection, cart groups/update/removal, recipient addresses with backend-compatible province/district/ward selection, checkout with per-shop cash/bank-transfer methods and retry-stable idempotency key, order listing/cancellation and notifications/read state. Returns, richer order details and device/backend runtime verification remain outstanding.
- Customer return routes now implement item quantities, refund bank fields, multipart evidence, return list/detail/history/instructions, shipment tracking with mandatory receipt image, and escalation after rejection/72-hour deadline. Owner return decisions/receipt/refund remain outstanding. Backend image attachment objects are normalized for rendering rather than assuming URL strings.
- Customer payment screens now implement plans, persisted pending checkout per account, HTTPS checkout launch, foreground/status polling, paid-state account refresh and callback/cancel routes. Backend payment return/cancel URLs are server-configured; production app links require deployment configuration and real-device verification. No live payment was created during verification.
- Customer chat now implements inbox/unread, paginated/deduplicated messages, multipart images, stable retry message IDs, context cards, focused read marking, and Socket.IO foreground reconnect with focus cleanup. Product/order contact actions open conversations with context. Shop actor API exists but owner session/UI wiring remains outstanding.
- Owner foundation now includes a separate secure session, restore/subscription refresh/logout, owner login/registration/password reset, guarded owner routes, shop creation/editor/contact fields and logo/cover upload through the supported `/shop-products/upload-image` endpoint (active subscription required by backend). Product management, analytics, owner commerce/returns, shop chat and owner billing remain outstanding.
- Owner products now implement list/status filters, create/editor/photo upload, SKU/color/size/stock/active variants preserving existing variant IDs and metadata, publish/draft, archive/restore and recoverable trash. Dashboard/analytics, owner commerce/returns, shop chat and billing remain outstanding.
- Owner commerce now includes order list/recipient/items, valid status transitions, cancellation decisions, payment confirmation/rejection, return evidence/refund account review, approve/reject with mandatory text, returned-goods receipt and multipart refund proof. Customer cancellation buttons now use backend's actual `pending_confirmation` state. Owner order refund-after-cancellation, dashboard, shop chat, notifications and billing still require work.
- Shop chat now shares actor-aware inbox/conversation screens with separate owner tokens and cache keys, foreground socket lifecycle, message/image/context pagination and read actions. Owner orders can open customer conversation with order context. Shop notifications/read actions are wired into owner center. Dashboard, owner billing, runtime/visual/device QA and remaining parity gaps are still outstanding.
- Dashboard now renders sales/finance, engagement, discovery funnel, inventory, fit-finder feedback/confidence, order/payment breakdowns, top products, daily selectable revenue/order/view/try-on charts and audience breakdowns for 7/30/90-day ranges. Missing/tier-restricted/null financial values show a dash, and simulated data/insufficient audience data are labeled from backend responses. Owner billing and final parity/runtime QA remain outstanding.
- Owner subscription uses shared billing UI with owner token/refresh and account-type-scoped pending checkout storage; owner return/cancel callback routes exist. Current backend returns no paid customer plans, now explicitly explained in UI.
- Shop detail route now loads shop profile/contact/images and paginated shop products and opens chat. Browser runtime test tooling is being installed; device, visual, session edge cases and full feature parity remain unverified.
- Browser runtime checkpoint: the first three Edge/Playwright tests passed (guest marketplace/product/shop/AI navigation with no page errors; customer login and exact variant cart payload; independent owner login/products route). Checkout/chat runtime cases are being added. These use intercepted fixture APIs, not a live backend or native device.
- Browser runtime: five scenarios passed after adding checkout address/payment-method/idempotency payload and product-context chat multipart cases.
- Customer order detail now renders recipient, item images, bank account/QR, transfer receipt upload/reporting, cancellation, return entry and status timeline. A browser test for transfer reporting is added; native/live-backend verification remains open.
- Six browser runtime scenarios now pass, including order bank instructions and mocked transfer reporting.
- Expo compatibility check found AsyncStorage 3.x incompatible with the installed Expo SDK; it is now pinned to the expected 2.2.x version and `expo install --check` passes.
- Android prebuild completed; generated manifest includes secure-store backup exclusions, image permissions and `miroir-dev` callback intent. Local SDK inspection found platform-tools only (no platform/build-tools), so this is not proof of a compiled Android app. iOS native verification remains open.
- English/Vietnamese language persistence and the same navigation/account translation scope as Flutter are implemented. Original brand assets were copied into the new app without changing Flutter.
- Primary destinations now use Expo Router Tabs so form/filter state survives tab changes. Try-on completion is marked seen only while its tab is focused. Onboarding implements three branded slides with Next/Previous/Skip/completion.
- Eight Edge runtime scenarios passed, including stylist draft retention across tabs, persisted Vietnamese navigation/account language after reload, and onboarding forward/back/completion. Typecheck also passed. All browser API scenarios remain fixture-based rather than live backend/native evidence.
- Session hardening: authenticated 401s notify the matching customer/owner store only; logout invalidates in-memory identity immediately, late profile refresh/mutation cannot revive it, and changing customer identity remounts navigation. Two session behavior tests pass. Nine browser scenarios passed together; the tenth (owner expiry/customer isolation) passed on a targeted rerun after fixing a locator to exclude retained hidden tab content. No native/live-backend session verification is claimed.
- Marketplace visual parity improved against Flutter home/card source: greeting/avatar, quick actions, search with collapsed advanced filters, two-column compact product cards and direct Try-on action. Price ranges are validated before applying filters. Inspected a 375px screenshot; no horizontal overflow. All eleven browser scenarios passed together, including session isolation and filter payload/layout checks. Native visual parity and remaining screen layouts remain open.
- Two additional AI runtime scenarios passed on Edge: catalog photo multipart upload with polling/completion while Home is focused and bubble navigation to result; Stylist nested budget/profile recommendation followed by outfit/product feedback. A custom upper/lower multipart case is being verified. All AI responses are mocked and do not establish live model/backend quality.
- Custom upper/lower photo multipart runtime case also passed, including omission of unselected lower/dress fields.
- Owner cancelled-order refunds now require a transfer receipt and send `mark_refunded` to the order payment endpoint; customer payment proof and recorded refund proof are visible for reconciliation. Three owner-commerce behavior tests passed. Account health check is implemented.

## Environment verification gates (current)

| Gate | Evidence | Status |
| --- | --- | --- |
| Flutter backup | No migration changes to `../mobile` | Preserved |
| Expo dependencies | Pinned to Expo SDK 57 (`~57.0.0`) for device Expo Go compatibility | Passed |
| Web runtime | 19/19 scenarios passed in Playwright smoke suite, fixture APIs | Full mock E2E verified |
| Unit / Behavior | 18/18 scenarios passed in Node.js test runner | Passed |
| Type check | `tsc --noEmit` 0 errors | Passed |
| Web production bundle | `expo export --platform web` (1,013 modules) in `dist/` | Passed |
| Native JS bundle | Hermes `.hbc` for Android (1,385 modules) & iOS (1,291 modules) in `dist-native/` | Passed |
| Real backend (Render) | Nine read-only public contract checks: health, catalog/list/detail/shop/outfits, plans and province/district/ward | Public APIs passed; authenticated flows not verified |
| Android native project | Expo Android prebuild succeeded | Generated, not compiled |
| Android build tools | Local SDK contains `platform-tools` only; Java 24 available | Build prerequisites incomplete |
| iOS | Windows host, no macOS/Xcode/remote build session configured | Not verified |
| Visual parity | Marketplace screenshot reviewed at 375px; other screens still require review | In progress |

Backend `.env` was not printed or used to start database jobs. Native compilation and live service verification remain required before claiming migration complete.

### Native readiness checkpoint

NetInfo now drives TanStack online state and offline feedback; query reconnect refetch is enabled. Shared forms use iOS keyboard avoidance and bounded desktop content widths. Expo System UI was installed at the SDK-compatible version. EAS internal APK/production AAB profiles are prepared without calling external build/publish services. Android/iOS JavaScript export is being checked separately from native compilation.

Native JavaScript export subsequently passed for both Android (1,279 modules) and iOS (1,330 modules), producing Hermes `.hbc` bundles in ignored `dist-native/`. All 18 behavior tests passed together after this checkpoint.

### Current audit (2026-10-16)

- Final sequential run: lint and TypeScript clean; 19/19 fixture browser scenarios passed (47.6s). A separate, unmocked Edge test against Render passed (11.8s total), loading catalog, opening real product details and confirming the product image decoded before screenshot. This is guest browsing only, not authenticated acceptance.
- Re-run the live browser test in PowerShell: `$env:MIROIR_LIVE_API='https://miroir-backend-l7si.onrender.com/api'; npx playwright test`. Remove that variable afterwards before running fixture tests. Live and fixture artifacts have separate output folders.
- Fixed guest language settings omitted by the profile UI refresh; replaced a stale test assertion against an invisible legacy heading with the visible AI Stylist heading.
- Added SDK-compatible ESLint, `npm run lint` and repeatable read-only `npm run test:api` (nine public requests passed against Render). HTTP success checks include response shapes, not only `/health`.
- Hardened payment polling cleanup/dependencies and persisted-checkout read errors; preserved checkout retry identity without generating IDs during render; return escalation eligibility updates while the screen stays open. Owner draft hydration preserves unsaved edits on background refetch.
- Typecheck and all 18 behavior tests passed. Web and Android/iOS Hermes exports passed; these are not APK/IPA builds.
- `adb devices` found no connected device. Native compilation prerequisites remain incomplete.
- `npm audit --omit=dev --audit-level=high` reports 28 dependency findings (10 moderate, 18 high), including transitive Expo/Metro tooling. No forced audit fix was applied: npm proposes incompatible SDK changes and no available fix for some findings. Release security review remains open.
- Flutter `../mobile` remains unchanged. Original color tokens/assets are reused, but full visual equality is not certified.
- Release acceptance still needs a dedicated customer/shop test account, permission to exercise test orders/AI/payment in an isolated environment, and native device/build access. Production accounts/orders/payments were not created or modified.

Customer return detail now includes shipment and refund proof imagery via the shared evidence renderer. Two targeted browser return scenarios passed: customer item/bank multipart request plus receipt-image shipment, and owner approval/receipt/refund-proof actions.

### Full E2E & runtime parity checkpoint

- Fixed React Native Web raw string / text node errors: resolved empty string evaluation in `UploadImage.tsx` (`{!!uri && ...}`) and inter-brace JSX whitespace across `app/owner/products/index.tsx`, `app/owner/returns.tsx`, `app/owner/orders.tsx`, `app/owner/notifications.tsx`, and `app/notifications.tsx`.
- Refined Playwright locator in `e2e/smoke.spec.ts` (`getByText('Edit product').filter({visible: true})`) to prevent strict-mode ambiguity against retained inactive stack screens.
- Full E2E smoke test suite ran with all 19 scenarios passing (19/19 passed in ~45s): guest browsing, customer authentication, variant add-to-cart, checkout & idempotency, transfer proof reporting, chat pagination & context cards, owner login & product lifecycle (create with stock, archive, restore to draft), owner subscription refresh, dashboard analytics & privacy-gated audience insights, try-on image uploads with polling, stylist recommendations & feedback, customer/owner return progressions.
- Web export verified (`dist/`, 1,012 modules) and Hermes native bundles verified (`dist-native/`, Android 1,279 modules, iOS 1,330 modules).
