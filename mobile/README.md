# MIROIR Mobile

Flutter mobile client for the MIROIR backend.

## Current state

This folder contains a hand-crafted Flutter base scaffold:

- app theme and shared design tokens
- bottom navigation shell
- starter screens for Home, Try On, Stylist, and Account
- API config and service placeholders for the existing backend
- feature-first folder structure for future expansion

Because Flutter SDK is not installed in the current environment, platform folders such as `android/`, `ios/`, `web/`, `windows/`, `macos/`, and `linux/` were not generated yet.

## Next step after installing Flutter

From this folder:

```bash
flutter create .
flutter pub get
flutter run
```

If `flutter create .` warns about overwriting files, keep the existing `lib/`, `pubspec.yaml`, and `analysis_options.yaml`.

## Suggested backend base URL

Use your existing backend:

- Android emulator: `http://10.0.2.2:5000/api`
- iOS simulator: `http://127.0.0.1:5000/api`
- Physical device: use your machine LAN IP, for example `http://192.168.x.x:5000/api`
