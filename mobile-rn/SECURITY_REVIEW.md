# Dependency security review — 2026-10-16

This is a focused dependency/reachability review, not a penetration-test certification. Credentials are supplied only through process environment variables. Live browser tests disable network traces because request recordings can contain login tokens/passwords. Generated screenshots and DB state snapshots are ignored by Git.

## Applied fixes

- `decode-uri-component` is overridden to **0.5.0**, fixing malformed URI input CPU exhaustion ([upstream advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr)). Expo Router still needs the CommonJS `query-string` 7 interface; the one-line, reproducible patch in `patches/` unwraps the new decoder's default export. `postinstall` reapplies it. A broad query-string major override was rejected after browser testing exposed incompatible namespace exports.
- Xcode's transitive `uuid` is overridden to **11.1.1**, fixing output-buffer bounds handling ([upstream advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq)). Xcode identifier generation and router Unicode/array/query encoding have explicit behavior tests.
- Semver-compatible `npm audit fix --ignore-scripts` was applied. No forced downgrade/major Expo SDK change was used.

## Residual findings

`npm audit --omit=dev --json` reports **18 high, 0 moderate, 0 critical** findings. These are dependency chains rooted in two advisories, not 18 independent runtime vulnerabilities:

| Root package | Usage in this app's dependency tree | Assessment / action |
| --- | --- | --- |
| `braces` <=3.0.3 | Metro/micromatch file-pattern processing | Upstream has no patched release. Do not process untrusted build configuration/glob patterns; keep build tooling isolated. No app-source import was found. Track [advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). |
| `node-forge` <=1.4.0 | Expo CLI / code-signing certificate tooling | Upstream has no patched release. No app-source import was found. Do not accept untrusted signing certificates or expose development servers publicly. Track [advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv). |

Tooling remains under `dependencies` in Expo's package graph, so `--omit=dev` still counts it. That alone does not prove the vulnerable functions ship in a mobile bundle. Conversely, absence of direct app imports is not a complete proof of non-reachability. A release risk decision and upstream follow-up are still required; this review does **not** claim zero vulnerabilities.

Playwright servers bind to localhost and never reuse another run's server. Native credentials use SecureStore; browser credentials remain in memory. Public configuration (`EXPO_PUBLIC_*`) must not contain secrets. No PayOS webhook was forged, and no paid transfer was made during QA. The shop activation was an explicitly authorized, zero-cost `admin_grant`, with before/after snapshots in ignored test artifacts.
