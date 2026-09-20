import React, { useEffect, useRef, useState } from "react";
import HeroMannequinCanvas from "../components/HeroMannequinCanvas.jsx";
import HeroStorySection from "../components/HeroStorySection.jsx";
import HeroDiscoverySection from "../components/HeroDiscoverySection.jsx";
import HeroEditorialFooter from "../components/HeroEditorialFooter.jsx";
import { useLanguage } from "../i18n.jsx";

export default function HeroPage() {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const revealLayerRef = useRef(null);
  const glowRef = useRef(null);

  const [isInside, setIsInside] = useState(false);
  const isInsideRef = useRef(false);
  const targetPos = useRef({ x: -1000, y: -1000 });
  const currentPos = useRef({ x: -1000, y: -1000 });
  const mousePos = useRef({ normX: 0, normY: 0 });
  const animFrameRef = useRef(null);

  // Ensure body background matches website design
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    document.body.style.backgroundColor = "#FFFFFF";
    document.body.style.color = "#111111";

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
    };
  }, []);

  // Smooth lerp / easing loop for cursor-following spotlight
  useEffect(() => {
    let active = true;

    const updateSpotlight = () => {
      if (!active) return;

      if (isInsideRef.current) {
        // Easing factor (lerp)
        const factor = 0.14;
        currentPos.current.x += (targetPos.current.x - currentPos.current.x) * factor;
        currentPos.current.y += (targetPos.current.y - currentPos.current.y) * factor;

        const x = currentPos.current.x.toFixed(1);
        const y = currentPos.current.y.toFixed(1);

        // 260px reveal radius with soft feathered/glowing edge
        if (revealLayerRef.current) {
          const mask = `radial-gradient(circle 260px at ${x}px ${y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 140px, rgba(0,0,0,0.7) 200px, rgba(0,0,0,0.25) 245px, transparent 260px)`;
          revealLayerRef.current.style.webkitMaskImage = mask;
          revealLayerRef.current.style.maskImage = mask;
        }

        // Ambient glowing edge circle centered at cursor (520px diameter = 260px radius)
        if (glowRef.current) {
          glowRef.current.style.transform = `translate3d(${x - 260}px, ${y - 260}px, 0)`;
        }
      }

      animFrameRef.current = requestAnimationFrame(updateSpotlight);
    };

    animFrameRef.current = requestAnimationFrame(updateSpotlight);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized coordinates for 3D model look-at (-1 to +1)
    const normX = ((e.clientX - rect.left) / (rect.width || window.innerWidth)) * 2 - 1;
    const normY = ((e.clientY - rect.top) / (rect.height || window.innerHeight)) * 2 - 1;

    mousePos.current.normX = Math.max(-1, Math.min(1, normX));
    mousePos.current.normY = Math.max(-1, Math.min(1, normY));

    if (!isInsideRef.current) {
      isInsideRef.current = true;
      setIsInside(true);
      currentPos.current = { x, y };
      targetPos.current = { x, y };
    } else {
      targetPos.current = { x, y };
    }
  };

  const handleMouseLeave = () => {
    isInsideRef.current = false;
    setIsInside(false);
    mousePos.current.normX = 0;
    mousePos.current.normY = 0;
  };

  return (
    <div className="relative w-full bg-[#FFFFFF] text-ink selection:bg-mintSoft selection:text-ink">
      {/* ============================================================ */}
      {/* SECTION 1: EXISTING MIROIR HERO SECTION                      */}
      {/* ============================================================ */}
      <section
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex h-[100dvh] max-h-[100dvh] min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#000000] text-white selection:bg-mintSoft selection:text-ink"
      >
        {/* ============================================================ */}
        {/* 1. Base Image (Night Scene with Moon & Lanterns)              */}
        {/* ============================================================ */}
        <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
          <img
            src="/hero/hero_reveal.jpg"
            alt="Hero Base Artwork (Night)"
            className="h-full w-full object-cover object-[44.5%_bottom]"
            draggable={false}
          />
          {/* Subtle dark tint to preserve contrast for typography while keeping full visual fidelity */}
          <div className="absolute inset-0 bg-black/35" />
        </div>

        {/* ============================================================ */}
        {/* 2. Reveal Image (Day Scene with Cursor Spotlight Mask)        */}
        {/* ============================================================ */}
        <div
          ref={revealLayerRef}
          className={`pointer-events-none absolute inset-0 z-[5] select-none overflow-hidden transition-opacity duration-300 ease-out ${isInside ? "opacity-100" : "opacity-0"
            }`}
          style={{
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            willChange: "mask-image, -webkit-mask-image",
          }}
        >
          <img
            src="/hero/hero_base.jpg"
            alt="Hero Reveal Artwork (Day)"
            className="h-full w-full object-cover object-[44.5%_bottom]"
            draggable={false}
          />
          {/* Subtle matching contrast tint */}
          <div className="absolute inset-0 bg-black/25" />
        </div>

        {/* ============================================================ */}
        {/* 3. Soft Glowing / Feathered Ring at 260px Radius Boundary    */}
        {/* ============================================================ */}
        <div
          ref={glowRef}
          className={`pointer-events-none absolute left-0 top-0 z-[6] rounded-full transition-opacity duration-300 ease-out ${isInside ? "opacity-100" : "opacity-0"
            }`}
          style={{
            width: "520px",
            height: "520px",
            background:
              "radial-gradient(circle, transparent 180px, rgba(179, 208, 126, 0.12) 220px, rgba(179, 208, 126, 0.32) 250px, transparent 260px)",
            boxShadow: "inset 0 0 35px rgba(179, 208, 126, 0.18)",
            willChange: "transform",
          }}
        />

        {/* ============================================================ */}
        {/* 4. Dominant Headline MIROIR (z-[8]: Behind 3D Model)         */}
        {/* ============================================================ */}
        <main className="pointer-events-none absolute inset-0 z-[8] flex flex-col items-center justify-center px-6 text-center sm:px-12 lg:px-20">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-center -translate-y-[20%] transition-transform duration-300">
            {/* Dominant Hero Headline: Floral MIROIR Image with Smooth Diffused Luminous Backlight Halo */}
            <div className="relative flex w-full items-center justify-center">
              {/* Luminous Backlight Halo with high blur and radiant glow */}
              <div
                className="pointer-events-none absolute -inset-x-16 -inset-y-12 sm:-inset-x-28 sm:-inset-y-20 z-0 opacity-10 blur-[70px] sm:blur-[90px] transition-all duration-300"
                style={{
                  background:
                    "radial-gradient(ellipse 85% 65% at 50% 50%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 252, 230, 0.42) 35%, rgba(179, 208, 126, 0.25) 60%, transparent 80%)",
                }}
              />

              <h1 className="sr-only">MIROIR</h1>
              <img
                src="/hero/miroir_headline.png"
                alt="MIROIR"
                className="relative z-10 w-[94%] max-w-[1380px] h-auto object-contain select-none brightness-[1.04] contrast-[1.05] saturate-[1.05] transition-all duration-300 pointer-events-none sm:w-[90%] lg:w-[86%]"
                style={{
                  filter:
                    "drop-shadow(0 0 16px rgba(255, 255, 255, 0.4)) drop-shadow(0 12px 26px rgba(0, 0, 0, 0.85))",
                }}
                draggable={false}
              />
            </div>
          </div>
        </main>

        {/* ============================================================ */}
        {/* 5. 3D Mannequin Model (z-[1000]: Center of Hero, On Rug)     */}
        {/* ============================================================ */}
        <HeroMannequinCanvas mousePos={mousePos} />

        {/* ============================================================ */}
        {/* 6. Top Navigation (Foreground: z-[1010])                     */}
        {/* ============================================================ */}
        <header className="relative z-[1010] flex w-full items-center justify-between px-6 py-4 sm:px-12 sm:py-6 lg:px-20 lg:py-8">
          {/* Brand Logo & Wordmark on a Clear Glass Panel with Reduced Blur */}
          <a
            href="/"
            className="group inline-flex items-center gap-2.5 rounded-full border border-white/40 bg-white/15 px-3.5 py-1.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3),inset_0_1px_1px_0_rgba(255,255,255,0.7)] backdrop-blur-[5px] transition-all duration-300 hover:border-white/70 hover:bg-white/25 hover:shadow-[0_8px_32px_0_rgba(179,208,126,0.35),inset_0_1px_1px_0_rgba(255,255,255,0.9)] sm:px-4 sm:py-2"
          >
            <img
              src="/logo-web.png"
              alt="Miroir Logo"
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-contain shadow-sm transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-display text-xs sm:text-sm font-black uppercase tracking-[0.24em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-colors duration-300 group-hover:text-mintPale">
              MIROIR
            </span>
          </a>

          {/* Center Tagline: "Tôn vinh vóc dáng, tự do phong cách." positioned in center, horizontally level with logo */}
          <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto items-center justify-center z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-mintPale shadow-[0_8px_32px_0_rgba(0,0,0,0.3),inset_0_1px_1px_0_rgba(255,255,255,0.7)] backdrop-blur-[5px] transition-all duration-300 hover:border-white/70 hover:bg-white/25 sm:text-xs sm:px-4 sm:py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
              {t("hero.supportingText")}
            </span>
          </div>

          {/* Center/Right Nav Pill with Clear Glass Effect */}
          <nav className="flex items-center space-x-2 sm:space-x-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-mintPale shadow-[0_8px_32px_0_rgba(0,0,0,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.5)] backdrop-blur-[5px] md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
              3D DIGITAL ATELIER
            </span>
            <div className="flex items-center gap-1 rounded-full border border-white/35 bg-white/10 p-1 shadow-[0_8px_32px_0_rgba(0,0,0,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.5)] backdrop-blur-[5px]">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-200 transition-colors duration-200 hover:bg-white/20 hover:text-white sm:text-xs"
              >
                /INSTAGRAM
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-200 transition-colors duration-200 hover:bg-white/20 hover:text-white sm:text-xs"
              >
                /X
              </a>
            </div>
          </nav>
        </header>

        {/* Center Spacer to preserve vertical flex layout */}
        <div className="flex-1 pointer-events-none" />

        {/* ============================================================ */}
        {/* 7. Bottom Area: Centered CTAs (Foreground: z-[1010])         */}
        {/* ============================================================ */}
        <footer className="relative z-[1010] w-full px-6 pb-2.5 pt-0 sm:px-12 sm:pb-3.5 lg:px-20 lg:pb-4">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-center">
            {/* Centered Website Signature CTA Buttons positioned lower below model feet */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <a
                href="/login"
                className="soft-button !rounded-[20px] !border-mintDeep/40 !bg-white/95 !text-mintDeep hover:!border-mintDeep hover:!bg-mintPale !px-6 !py-2.5 sm:!px-7 sm:!py-3 text-xs sm:text-sm font-extrabold shadow-glass backdrop-blur-xl transition-all duration-300 hover:scale-105"
              >
                <span>{t("hero.signIn")}</span>
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
              <a
                href="/signup"
                className="dark-button !rounded-[20px] !bg-gradient-to-r !from-mintDeep !via-mint !to-mintSoft !text-white !px-7 !py-2.5 sm:!px-8 sm:!py-3 text-xs sm:text-sm font-bold shadow-glow hover:!shadow-glowDeep transition-all duration-300 hover:scale-105"
              >
                <span>{t("hero.signUp")}</span>
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </footer>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: CINEMATIC SCROLL-DRIVEN STORYTELLING SECTION     */}
      {/* ============================================================ */}
      <HeroStorySection />

      {/* ============================================================ */}
      {/* SECTION 3: MIROIR DISCOVERY (EDITORIAL FASHION ARCHIVE)      */}
      {/* ============================================================ */}
      <HeroDiscoverySection />

      {/* ============================================================ */}
      {/* SECTION 4: LUXURY EDITORIAL FOOTER                           */}
      {/* ============================================================ */}
      <HeroEditorialFooter />
    </div>
  );
}
