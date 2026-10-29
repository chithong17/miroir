# MIROIR React Native

## Current release direction: boutique commerce

The current RN experience focuses on boutique discovery and shopping, plus a separate shop operations workspace. Try-On and Stylist have been removed from this app. Customer tabs are Discover, Saved, Orders and Account. Body-photo/measurement onboarding and external digital-plan purchases are no longer part of the mobile experience.

See [STORE_RESUBMISSION.md](STORE_RESUBMISSION.md) for the implemented scope, review path and remaining iOS/store requirements. The migration and acceptance notes below describe historical work and are not proof that the current release is ready for App Review.

Migration in progress; see [MIGRATION.md](MIGRATION.md) for the full scope and unchecked parity gates. The Flutter app in `../mobile` is preserved.

## Run

Use Node 22 or newer. Run `npm install`, copy `.env.example` to `.env` and configure the API URL. Android emulator uses `10.0.2.2`; a physical device needs the backend machine's LAN address. Environment variables beginning with `EXPO_PUBLIC_` are public configuration, never secrets.

Run `npm start` or `npm run android`. Run `npm run web` for browser development. Native iOS builds require macOS or a configured remote build environment.

## Verify

- `npx tsc --noEmit`
- `npx expo export --platform web`
- `npm test`
- `npm run test:e2e` (uses installed Microsoft Edge; fixture APIs, no real payments/orders)
- `npx expo export --platform android --platform ios --output-dir dist-native` (JavaScript bundle verification only)

Also run `npm run lint` and `npm run test:api` (read-only public checks against Render by default; override `EXPO_PUBLIC_API_BASE_URL` to target another backend). Browser fixture tests do not prove authenticated production flows or Android/iOS device behavior.

## Current implementation

Implemented: customer/owner authentication, onboarding/profile, marketplace/product/shop/favorites, catalog/custom try-on and polling, stylist/feedback, cart/address/checkout/orders, return/refund evidence, customer/shop chat, subscriptions and owner shop/product/dashboard management. Original Flutter color tokens/assets are reused. All implementation stays in this separate folder; device and complete visual/live integration acceptance remain open (see MIGRATION.md).

Verified: lint, TypeScript, 20 behavior tests, 20 fixture browser flows, four unmocked browser flows (customer, owner, real Try-on/Stylist and guest catalog), web export, Android/iOS Hermes exports and 21 authenticated/public API checks. See the latest acceptance scope in MIGRATION.md. Native Android installation and complete visual comparison remain open; iOS native acceptance is deferred by the user. SECURITY_REVIEW.md documents remaining upstream audit findings. No actual paid settlement was tested. Do not treat passing JS exports as a native binary build.

Development application identifiers use `com.miroir.mobile.dev` so the Flutter backup can remain installed independently.

## Native build preparation

`npx expo prebuild --platform android --no-install` generates the Android project from app configuration. `npm run android` then needs a supported JDK plus Android command-line/platform/build tools and a connected device/emulator. The current QA environment uses JDK 21 and the full SDK at `D:\sdk`. The x86_64 debug APK compiled, installed and passed customer/owner native smoke checks on Android 34. It requires Metro and is not a standalone ARM phone release. On Windows use a short Gradle cache path and Ninja 1.12+; `MIROIR_NINJA_EXECUTABLE` configures the app CMake plugin without manually editing generated native files.

`eas.json` includes internal APK and production AAB profiles for a future configured builder. No cloud build, production signing, store submission, or deployment has been performed. Set the backend public API/socket URLs for the target build before building; emulator defaults are not production endpoints. iOS compilation requires macOS/Xcode or an authorized remote builder.

`scripts/build-android-qa.ps1` reproduces a locally debug-signed, bundled QA APK. It requires explicit SDK/JDK, short Gradle cache, Ninja executable and HTTPS API paths; it never uploads or publishes the build. This QA signature must not replace the original Flutter production signing identity.
