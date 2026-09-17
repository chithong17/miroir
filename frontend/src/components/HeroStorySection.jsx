import React, { useEffect, useRef, useState } from "react";

export default function HeroStorySection() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let animId;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable <= 0) return;

      // Scroll progress starts when section top arrives at viewport top (rect.top <= 0)
      const currentScroll = -rect.top;
      const rawProgress = Math.min(1, Math.max(0, currentScroll / totalScrollable));
      setProgress(rawProgress);
    };

    const onScrollTick = () => {
      handleScroll();
      animId = requestAnimationFrame(onScrollTick);
    };

    animId = requestAnimationFrame(onScrollTick);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // Smooth easing for image expansion: starts gentle, expands symmetrically, locks at full screen by 85%
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const expansionProgress = Math.min(1, progress / 0.85);
  const easedExp = easeInOutCubic(expansionProgress);

  // Responsive initial 9:16 portrait dimensions
  const isMobile = viewport.width < 640;
  const isTablet = viewport.width >= 640 && viewport.width < 1024;

  const initialWidth = isMobile ? 180 : isTablet ? 230 : 280;
  const initialHeight = initialWidth * (16 / 9);

  // Exact symmetrical expansion anchored to center
  const currentWidth = initialWidth + (viewport.width - initialWidth) * easedExp;
  const currentHeight = initialHeight + (viewport.height - initialHeight) * easedExp;

  // Staggered exit calculation for editorial text blocks
  const getTextTransform = (startP, endP, dirX, dirY, rotDeg, scaleTo = 0.85) => {
    if (progress <= startP) {
      return { opacity: 1, transform: "none", filter: "none", pointerEvents: "auto" };
    }
    if (progress >= endP) {
      return { opacity: 0, transform: "none", filter: "blur(10px)", pointerEvents: "none", display: "none" };
    }
    const localT = (progress - startP) / (endP - startP);
    const easedT = localT * localT;
    const opacity = Math.max(0, 1 - easedT);
    const tx = dirX * easedT * 70;
    const ty = dirY * easedT * 50;
    const rot = rotDeg + dirX * easedT * 8;
    const scale = 1 - (1 - scaleTo) * easedT;
    const blur = easedT * 8;

    return {
      opacity,
      transform: `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(2)})`,
      filter: `blur(${blur.toFixed(1)}px)`,
      pointerEvents: opacity < 0.1 ? "none" : "auto",
    };
  };

  return (
    <section
      ref={sectionRef}
      className="relative h-[250vh] w-full bg-[#000000] text-white"
    >
      {/* Sticky 100dvh viewport frame: Stays strictly locked in place during scroll */}
      <div className="sticky top-0 left-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#000000]">
        
        {/* Ambient subtle vignette */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.98)_75%)]" />

        {/* ============================================================ */}
        {/* EDITORIAL TEXT CLUSTERS ("Organized Chaos")                   */}
        {/* ============================================================ */}

        {/* 1. Top-Left Technical Spec Tag */}
        <div
          style={getTextTransform(0.04, 0.28, -1, -0.8, -2)}
          className="absolute left-6 top-8 z-10 max-w-[200px] sm:left-12 sm:top-14 lg:left-20 lg:top-16"
        >
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B3D07E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B3D07E] animate-pulse" />
            <span>01 / PRECISION FIT</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">
            Morphometric 3D mapping adapts every seam to your exact contour.
          </p>
        </div>

        {/* 2. Top-Right Big Editorial Headline */}
        <div
          style={getTextTransform(0.07, 0.32, 1, -0.6, 1.5)}
          className="absolute right-6 top-8 z-10 text-right sm:right-12 sm:top-14 lg:right-20 lg:top-16"
        >
          <h2 className="font-display text-base font-extrabold uppercase tracking-tight text-white sm:text-lg lg:text-2xl">
            NOT SIZES.
            <br />
            <span className="text-neutral-400">PROPORTIONS.</span>
          </h2>
        </div>

        {/* 3. Mid-Left Body-Aware Styling */}
        <div
          style={getTextTransform(0.10, 0.38, -1.2, 0.2, -1)}
          className="absolute left-6 top-[38%] z-10 hidden max-w-[220px] sm:block sm:left-10 lg:left-16"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white">
            BODY-AWARE STYLING
          </p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            Simulate fabric memory, gravity, and garment tension in real time.
          </p>
          <div className="mt-2 h-[1px] w-12 bg-white/20" />
        </div>

        {/* 4. Mid-Right Silhouette Badge Chip */}
        <div
          style={getTextTransform(0.14, 0.42, 1.2, -0.2, 2.5)}
          className="absolute right-6 top-[34%] z-10 flex flex-col items-end sm:right-10 lg:right-16"
        >
          <div className="rounded-full border border-white/20 bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-md">
            <span className="text-[9px] font-mono font-medium uppercase tracking-[0.25em] text-[#B3D07E]">
              ACCURACY: 99.4%
            </span>
          </div>
          <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            SILHOUETTE ARCHIVE
          </span>
        </div>

        {/* 5. Bottom-Left Quotation & Manifesto */}
        <div
          style={getTextTransform(0.18, 0.48, -0.8, 1, 1)}
          className="absolute bottom-10 left-6 z-10 max-w-[240px] sm:bottom-14 sm:left-12 lg:bottom-16 lg:left-20"
        >
          <p className="font-serif italic text-xs leading-relaxed text-neutral-300 sm:text-sm">
            “Confidence is not a size. It is a harmonious dialogue between fabric and form.”
          </p>
          <div className="mt-2 text-[9px] uppercase tracking-[0.25em] text-neutral-400">
            MIROIR ATELIER — VOL. 01
          </div>
        </div>

        {/* 6. Bottom-Right Digital Atelier Card */}
        <div
          style={getTextTransform(0.22, 0.52, 0.8, 1, -1.5)}
          className="absolute bottom-10 right-6 z-10 max-w-[230px] text-right sm:bottom-14 sm:right-12 lg:bottom-16 lg:right-20"
        >
          <div className="border border-white/15 bg-white/[0.02] p-3 text-left backdrop-blur-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-white">
              DIGITAL ATELIER
            </div>
            <p className="mt-1 text-[11px] leading-snug text-neutral-400">
              Where generative drape algorithms unlock bespoke fitting moments.
            </p>
          </div>
        </div>

        {/* 7. Far-Left Vertical Micro-Label */}
        <div
          style={getTextTransform(0.15, 0.45, -1, 0, -90)}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10 hidden text-[9px] uppercase tracking-[0.35em] text-neutral-400 md:block"
        >
          VIRTUAL TRY-ON // 2026
        </div>

        {/* 8. Far-Right Minimalist Spec Label */}
        <div
          style={getTextTransform(0.19, 0.49, 1, 0, 90)}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 z-10 hidden text-[9px] uppercase tracking-[0.35em] text-neutral-400 md:block"
        >
          LAT 45.4642° N // MILANO
        </div>

        {/* ============================================================ */}
        {/* CENTER STORYTELLING HERO IMAGE (Anchored at exact center)    */}
        {/* Expands symmetrically in all 4 directions from (50%, 50%)    */}
        {/* ============================================================ */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none will-change-[width,height]"
          style={{
            width: `${Math.round(currentWidth)}px`,
            height: `${Math.round(currentHeight)}px`,
          }}
        >
          <div
            className={`relative h-full w-full overflow-hidden transition-all duration-300 ${
              easedExp > 0.88
                ? "rounded-none border-0 shadow-none"
                : "rounded-sm border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.9)]"
            }`}
          >
            <img
              src="/hero/editorial_story.jpg"
              alt="MIROIR Digital Fitting Editorial Landscape"
              className="h-full w-full object-cover object-center select-none"
              draggable={false}
            />

            {/* Subtle inner vignette that fades as the image expands */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
                opacity: Math.max(0, 1 - easedExp * 1.2),
              }}
            />

            {/* 9:16 Portrait badge on initial small card */}
            <div
              className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 transition-opacity duration-300"
              style={{
                opacity: Math.max(0, 1 - progress * 4),
              }}
            >
              <span className="rounded bg-black/60 px-2 py-0.5 text-[8px] font-mono tracking-widest text-white/90 backdrop-blur-md border border-white/10">
                PORTRAIT 9:16
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FINAL IMMERSIVE SUBTLE OVERLAY (Whispers in at 100% full view) */}
        {/* ============================================================ */}
        <div
          className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center text-center transition-opacity duration-700"
          style={{
            opacity: progress > 0.85 ? Math.min(1, (progress - 0.85) / 0.12) : 0,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-8 bg-white/40" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/80 font-medium">
              MIROIR DIGITAL FITTING MOMENT
            </span>
            <span className="h-[1px] w-8 bg-white/40" />
          </div>
          <p className="mt-1 text-[11px] font-normal text-white/60 tracking-wider">
            Step into the virtual fitting experience
          </p>
        </div>

      </div>
    </section>
  );
}
