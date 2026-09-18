---
name: editorial-papercut-auth
description: >-
  Comprehensive guide, architecture, and reusable templates for building a luxury editorial login and signup interface. Features a dual-surface desktop card (minimal form on the left, layered paper-cut visual reveal on the right), a frosted-glass mobile overlay, zero-scroll 100dvh viewport locking, brand color synchronization, and multi-role switching.
---

# Editorial Paper-Cut Auth Skill

This skill documents the complete design system, responsive architecture, visual prompt engineering, and reusable code patterns to implement a **high-end luxury editorial login & signup page** across any modern web application.

---

## 1. Design System & Aesthetic Architecture

### Core Aesthetic Pillars
1. **Dual-Surface Split Card (Desktop $\ge$ 1024px / `lg`)**:
   - **Left Surface (54%)**: Minimalist, warm-white editorial form canvas (`rounded-[32px]`, `bg-white`, soft inner glow).
   - **Right Surface (46%)**: Deep tactile artwork reveal mimicking organic, multi-layered cut paper sheets peeling back to reveal domain-specific blueprints, 3D contour meshes, or high-tech telemetry.
2. **Frosted Glass Mobile Overlay (Mobile & Tablet $<$ 1024px)**:
   - Full-bleed paper-cut background artwork with a subtle dark scrim (`bg-black/15`).
   - Floating frosted glass card (`bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.18)]`).
3. **Zero-Scroll Viewport Locking (`100dvh`)**:
   - The entire authentication screen fits snugly into the browser viewport without page scrollbars.
   - Uses `h-[100dvh] max-h-[100dvh] overflow-hidden` on the page root.
   - Any overflow on constrained laptop heights (e.g. 768p with Windows 125% scaling) is handled gracefully within the form column (`overflow-y-auto`).

---

## 2. Color Palette & Token Synchronization

To adapt this design to any brand:

| Element | Miroir Default | Generic Token | Usage Guideline |
| :--- | :--- | :--- | :--- |
| **Page Ambient BG** | `#F4F1EC` | `bg-neutral-100` | Soft warm off-white / bone ambient canvas |
| **Card Surface** | `#FFFFFF` | `bg-white` | Crisp white card surface |
| **Primary Brand Accent** | `#B3D07E` | `var(--brand-accent)` | Signature color for titles, buttons, focus rings |
| **Button Text** | `#FFFFFF` (`text-white`) | `text-white` | White with `drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]` |
| **Button Glow** | `rgba(179,208,126,0.45)` | `rgba(var(--accent-rgb), 0.45)` | Soft diffuse colored drop shadow |
| **Hover Button BG** | `#A3C46C` | Darken accent by ~8-10% | Subtle tactile feedback on hover/active |
| **Input Background** | `#FAF9F7` | `bg-neutral-50` | Muted neutral pill background with thin border |
| **Input Focus Ring** | `#B3D07E` / 30% | `ring-[brand]/30` | Luminous focus ring |
| **Text Links** | `#6F9535` | High-contrast accent | Readable on light background ($>4.5:1$ contrast) |

---

## 3. Viewport Budget & Spacing Strategy

To achieve a seamless **no-scroll fit** on desktop and mobile viewports:

```
+-------------------------------------------------------------------+
|  Header: h ~ 52px (py-2.5 sm:py-3 px-6 sm:px-12) [shrink-0]      |
+-------------------------------------------------------------------+
|                                                                   |
|  Main Canvas: flex-1 flex items-center justify-center             |
|                                                                   |
|  +--------------------------- Split Card ----------------------+  |
|  | Left: 54% Form Column       | Right: 46% Paper-Cut Artwork  |  |
|  | - Logo + Brandmark          | - Multi-layered depth waves   |  |
|  | - Editorial Title (24-26px) | - Visual domain schematics    |  |
|  | - Subtitle (12px)           | - Aspect ratio fill           |  |
|  | - Role Switcher (optional)  |                               |  |
|  | - Inputs (py-2 text-xs/sm)  |                               |  |
|  | - Submit Button (py-2.5/3)  |                               |  |
|  | - Alternate Link            |                               |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
|  (Footer removed for maximum vertical cleanliness)                |
+-------------------------------------------------------------------+
```

### Critical CSS Classes for No-Scroll:
- Root wrapper: `relative flex h-[100dvh] max-h-[100dvh] w-full flex-col justify-between overflow-hidden`
- Main container: `relative z-20 flex flex-1 w-full items-center justify-center px-4 py-1 sm:py-2 overflow-hidden`
- Card container: `w-full max-w-[960px] xl:max-w-[1000px] max-h-[calc(100dvh-84px)] rounded-[32px] overflow-hidden`
- Form column: `w-[54%] px-8 py-5 xl:px-10 xl:py-7 flex flex-col justify-center overflow-y-auto`

---

## 4. Visual Asset Generation Recipe

The signature right-hand surface relies on a high-fidelity **layered paper-cut illustration** revealing intricate domain telemetry.

### Prompt Template for Image Generation:
```text
Clean layered paper-cut illustration, minimal luxury design style, [PRIMARY_COLOR] and white color palette.
On top, smooth organic curved sheets of white paper are peeled back and layered with realistic tactile paper drop shadows.
Underneath the paper openings, reveal a sophisticated [DOMAIN_KEYWORDS] visual world:
[SCHEMATICS_LIST], fine blueprint lines, vector wireframe geometry, measuring curves, subtle telemetry curves, soft glowing accents.
Refined studio lighting, macro photography depth, premium architectural aesthetic, ultra-high resolution, clean composition.
```

### Domain Examples:
1. **Fashion-Tech (Miroir)**:
   - Primary: Forest green `#1A3322` and mint `#B3D07E`.
   - Underneath: Garment silhouettes, tailoring chalk marks, measuring tape bezier curves, 3D female body wireframe contour grid, drape tension vectors.
2. **FinTech / Wealth Management**:
   - Primary: Deep navy `#0B192C` and gold `#D4AF37`.
   - Underneath: Candlestick flow paths, algorithmic telemetry lines, circular asset distribution rings, golden ratio spirals.
3. **Health-Tech / BioTech**:
   - Primary: Midnight teal `#0A2628` and bioluminescent cyan `#26D0CE`.
   - Underneath: DNA double-helix blueprints, heartbeat telemetry pulses, protein fold ribbons, molecular grid lattices.
4. **Architecture / Real Estate**:
   - Primary: Slate graphite `#1E2022` and warm terracotta `#E07A5F`.
   - Underneath: Isometric floor plans, CAD elevations, tension cabling wireframes, golden mean structural arches.

---

## 5. Complete Reusable Component Pattern (React + Tailwind CSS)

See [AuthTemplate.jsx](./examples/AuthTemplate.jsx) for the complete, plug-and-play React implementation.

### Key Interaction Features:
- **Instant Toggle**: Smooth state transition between `mode="login"` and `mode="signup"`.
- **Role Switcher**: Integrated pill toggle (e.g. Client vs. Merchant / User vs. Business) in registration mode.
- **Password Visibility**: Integrated eye icon inside password input.
- **Loading State**: Animated SVG spinner inside the primary button with `disabled` handling.
- **Accessible & Internationalized**: Supports bilingual text dictionaries (`isVi` / `en`).

---

## 6. Implementation Checklist for New Projects

When porting this layout into a new project:
1. **Copy Component**: Duplicate [AuthTemplate.jsx](./examples/AuthTemplate.jsx) into `src/pages/AuthPage.jsx` or your framework's page directory.
2. **Set Brand Color**: Replace `#B3D07E` (and corresponding hover `#A3C46C`) with your brand hex code.
3. **Supply Visual Assets**:
   - Save the papercut illustration to `public/auth/artwork_papercut.jpg`.
   - Save the ambient background texture to `public/auth/ambient_bg.jpg`.
   - Place your brand logo at `public/logo.png`.
4. **Hook into Auth API**: Connect `handleSubmit` to your auth provider (Supabase, Firebase, NextAuth, Custom REST/GraphQL API).
5. **Verify Viewport Fit**:
   - Open browser DevTools, test responsive presets: 1366x768, 1920x1080, iPad Air (820x1180), and iPhone 14 Pro (393x852).
   - Ensure zero page scrollbar appears and elements are vertically balanced.
