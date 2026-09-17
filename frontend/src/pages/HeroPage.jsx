import React, { useEffect, useRef, useState } from "react";
import HeroMannequinCanvas from "../components/HeroMannequinCanvas.jsx";
import HeroStorySection from "../components/HeroStorySection.jsx";
import HeroDiscoverySection from "../components/HeroDiscoverySection.jsx";
import HeroEditorialFooter from "../components/HeroEditorialFooter.jsx";

export default function HeroPage() {
  const containerRef = useRef(null);
  const revealLayerRef = useRef(null);
  const glowRef = useRef(null);

  const [isInside, setIsInside] = useState(false);
  const isInsideRef = useRef(false);
  const targetPos = useRef({ x: -1000, y: -1000 });
  const currentPos = useRef({ x: -1000, y: -1000 });
  const mousePos = useRef({ normX: 0, normY: 0 });
  const animFrameRef = useRef(null);

  // Ensure body background is clean black on this page
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    document.body.style.backgroundColor = "#000000";
    document.body.style.color = "#ffffff";

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
    <div className="relative w-full bg-[#000000] text-white selection:bg-white selection:text-black">
      {/* ============================================================ */}
      {/* SECTION 1: EXISTING MIROIR HERO SECTION (UNMODIFIED)        */}
      {/* ============================================================ */}
      <section
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex h-[100dvh] max-h-[100dvh] min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#000000] text-white selection:bg-white selection:text-black"
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
        className={`pointer-events-none absolute inset-0 z-[5] select-none overflow-hidden transition-opacity duration-300 ease-out ${
          isInside ? "opacity-100" : "opacity-0"
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
        className={`pointer-events-none absolute left-0 top-0 z-[6] rounded-full transition-opacity duration-300 ease-out ${
          isInside ? "opacity-100" : "opacity-0"
        }`}
        style={{
          width: "520px",
          height: "520px",
          background:
            "radial-gradient(circle, transparent 180px, rgba(255, 235, 180, 0.08) 220px, rgba(255, 240, 200, 0.22) 250px, transparent 260px)",
          boxShadow: "inset 0 0 30px rgba(255, 240, 200, 0.12)",
          willChange: "transform",
        }}
      />

      {/* ============================================================ */}
      {/* 4. Dominant Headline MIROIR (z-[8]: Behind 3D Model)         */}
      {/* ============================================================ */}
      <main className="pointer-events-none absolute inset-0 z-[8] flex flex-col items-center justify-center px-6 text-center sm:px-12 lg:px-20">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-center -translate-y-[20%] transition-transform duration-300">
          {/* Supporting Text: Positioned top-left matching reference NEO-CLASSICAL */}
          <div className="mb-2 w-full text-left sm:mb-3 lg:mb-4 px-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-neutral-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-xs md:text-sm">
              Fit your shape, free your style.
            </p>
          </div>

          {/* Dominant Hero Headline: MIROIR Centered behind mannequin */}
          <h1 className="w-full text-center font-display text-[17.5vw] font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] select-none sm:text-[18.5vw] lg:text-[19vw]">
            MIROIR
          </h1>
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
        {/* Brand Logo / Wordmark */}
        <a
          href="/"
          className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-opacity duration-200 hover:opacity-75 sm:text-xs"
        >
          MIROIR
        </a>

        {/* Social / Editorial Navigation Links */}
        <nav className="flex items-center space-x-6 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:space-x-10 sm:text-xs">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-200 hover:text-white"
          >
            /INSTAGRAM
          </a>
          <a
            href="https://behance.net"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-200 hover:text-white"
          >
            /BEHANCE
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-200 hover:text-white"
          >
            /X
          </a>
        </nav>
      </header>

      {/* Center Spacer to preserve vertical flex layout */}
      <div className="flex-1 pointer-events-none" />

      {/* ============================================================ */}
      {/* 7. Bottom Area: Description & CTAs (Foreground: z-[1010])    */}
      {/* ============================================================ */}
      <footer className="relative z-[1010] w-full px-6 py-6 sm:px-12 sm:py-8 lg:px-20 lg:py-10">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-start justify-between gap-8 md:flex-row md:items-end md:gap-12">
          {/* Bottom Left: Description Paragraph */}
          <div className="max-w-xs sm:max-w-sm md:max-w-md">
            <p className="text-xs font-normal leading-relaxed tracking-wide text-neutral-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-sm sm:leading-relaxed">
              Discover a smarter way to dress with virtual try-on and personalized fit technology designed to help you find styles that truly suit you.
            </p>
          </div>

          {/* Bottom Right: CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-start md:self-end">
            <a
              href="/login"
              className="group inline-flex items-center justify-center border border-white/60 bg-black/40 backdrop-blur-md px-5 py-2.5 text-xs font-medium tracking-wider text-white shadow-lg transition-all duration-300 hover:border-white hover:bg-white hover:text-black sm:px-6 sm:py-3 sm:text-sm"
            >
              <span>Sign in</span>
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
            <a
              href="/register"
              className="group inline-flex items-center justify-center border border-white/60 bg-black/40 backdrop-blur-md px-5 py-2.5 text-xs font-medium tracking-wider text-white shadow-lg transition-all duration-300 hover:border-white hover:bg-white hover:text-black sm:px-6 sm:py-3 sm:text-sm"
            >
              <span>Sign up</span>
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
