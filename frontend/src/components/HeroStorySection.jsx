import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n.jsx";

export default function HeroStorySection() {
  const { t } = useLanguage();
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
      className="relative h-[250vh] w-full bg-[#FFFFFF] text-ink"
    >
      {/* Sticky 100dvh viewport frame: White at top, smoothly transitioning to Miroir green #B3D07E at bottom */}
      <div
        className="sticky top-0 left-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden text-ink"
        style={{
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 25%, #EDF6E3 58%, #cff5c5ff 100%)",
        }}
      >
        {/* Ambient bottom glow enhancement with #B3D07E */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45vh] bg-gradient-to-t from-[#BDD99A]/40 to-transparent" />

        {/* ============================================================ */}
        {/* EDITORIAL TEXT CLUSTERS ("Organized Chaos")                   */}
        {/* ============================================================ */}

        {/* 1. Top-Left Technical Spec Tag */}
        <div
          style={getTextTransform(0.04, 0.28, -1, -0.8, -2)}
          className="absolute left-6 top-8 z-10 max-w-[240px] sm:left-12 sm:top-14 lg:left-20 lg:top-16"
        >
          <div className="rounded-[22px] border border-white/90 bg-white/80 p-4 shadow-glass backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[#4B6B2B]">
              <span className="h-2 w-2 rounded-full bg-[#4B6B2B] animate-pulse" />
              <span>{t("hero.story.precisionFit")}</span>
            </div>
            <p className="mt-2 text-xs sm:text-sm font-semibold leading-relaxed text-neutral-800">
              {t("hero.story.precisionDesc")}
            </p>
          </div>
        </div>

        {/* 2. Top-Right Big Editorial Headline */}
        <div
          style={getTextTransform(0.07, 0.32, 1, -0.6, 1.5)}
          className="absolute right-6 top-8 z-10 text-right sm:right-12 sm:top-14 lg:right-20 lg:top-16"
        >
          <div className="rounded-[22px] border border-white/90 bg-white/80 px-6 py-4 shadow-glass backdrop-blur-md">
            <h2 className="font-display text-lg sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-ink">
              {t("hero.story.proportions")}
              <br />
              <span className="text-[#487023] font-black">{t("hero.story.proportionsSub")}</span>
            </h2>
          </div>
        </div>

        {/* 3. Mid-Left Body-Aware Styling */}
        <div
          style={getTextTransform(0.10, 0.38, -1.2, 0.2, -1)}
          className="absolute left-6 top-[36%] z-10 hidden max-w-[260px] sm:block sm:left-10 lg:left-16"
        >
          <div className="rounded-[22px] border border-white/90 bg-white/80 p-4 shadow-glass backdrop-blur-md">
            <p className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-ink">
              {t("hero.story.bodyAware")}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm font-semibold leading-relaxed text-neutral-800">
              {t("hero.story.bodyAwareDesc")}
            </p>
            <div className="mt-2.5 h-[2.5px] w-14 rounded-full bg-[#679137]" />
          </div>
        </div>

        {/* 4. Mid-Right Silhouette Badge Chip */}
        <div
          style={getTextTransform(0.14, 0.42, 1.2, -0.2, 2.5)}
          className="absolute right-6 top-[34%] z-10 flex flex-col items-end sm:right-10 lg:right-16"
        >
          <div className="rounded-full border border-white/90 bg-white/90 px-4 py-2 shadow-glass backdrop-blur-md">
            <span className="text-xs font-mono font-black uppercase tracking-[0.22em] text-[#3F601F]">
              {t("hero.story.accuracy")}
            </span>
          </div>
          <span className="mt-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-neutral-800 shadow-sm backdrop-blur-sm">
            {t("hero.story.silhouetteArchive")}
          </span>
        </div>

        {/* 5. Bottom-Left Quotation & Manifesto */}
        <div
          style={getTextTransform(0.18, 0.48, -0.8, 1, 1)}
          className="absolute bottom-10 left-6 z-10 max-w-[280px] sm:bottom-14 sm:left-12 lg:bottom-16 lg:left-20"
        >
          <div className="rounded-[24px] border border-white/95 bg-white/92 p-5 shadow-glass backdrop-blur-lg">
            <p className="font-serif italic text-sm sm:text-base font-semibold leading-relaxed text-ink">
              {t("hero.story.quote")}
            </p>
            <div className="mt-2.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#3F601F]">
              {t("hero.story.quoteSource")}
            </div>
          </div>
        </div>

        {/* 6. Bottom-Right Digital Atelier Card */}
        <div
          style={getTextTransform(0.22, 0.52, 0.8, 1, -1.5)}
          className="absolute bottom-10 right-6 z-10 max-w-[260px] text-right sm:bottom-14 sm:right-12 lg:bottom-16 lg:right-20"
        >
          <div className="rounded-[24px] border border-white/95 bg-white/92 p-5 text-left shadow-glass backdrop-blur-lg">
            <div className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-ink">
              {t("hero.story.digitalAtelier")}
            </div>
            <p className="mt-2 text-xs sm:text-sm font-semibold leading-relaxed text-neutral-800">
              {t("hero.story.digitalAtelierDesc")}
            </p>
          </div>
        </div>

        {/* 7. Far-Left Vertical Micro-Label */}
        <div
          style={getTextTransform(0.15, 0.45, -1, 0, -90)}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10 hidden md:block"
        >
          <span className="rounded-full border border-white/90 bg-white/90 px-3.5 py-1 text-[10px] font-mono font-black uppercase tracking-[0.3em] text-[#3F601F] shadow-sm">
            {t("hero.story.virtualTryOnTag")}
          </span>
        </div>

        {/* 8. Far-Right Minimalist Spec Label */}
        <div
          style={getTextTransform(0.19, 0.49, 1, 0, 90)}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 z-10 hidden md:block"
        >
          <span className="rounded-full border border-white/90 bg-white/90 px-3.5 py-1 text-[10px] font-mono font-black uppercase tracking-[0.3em] text-[#3F601F] shadow-sm">
            LAT 45.4642° N // MILANO
          </span>
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
            className={`relative h-full w-full overflow-hidden transition-all duration-300 ${easedExp > 0.88
              ? "rounded-none border-0 shadow-none"
              : "rounded-[28px] sm:rounded-[36px] border-2 border-white shadow-[0_25px_75px_-12px_rgba(47,56,40,0.35)]"
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
                background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.25) 100%)",
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
              <span className="rounded-full bg-white/95 px-3 py-1 text-[9px] font-mono font-black tracking-widest text-[#3F601F] backdrop-blur-md border border-white shadow-sm">
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
          <div className="flex items-center gap-2.5 rounded-full border border-white/90 bg-white/95 px-6 py-2.5 shadow-glass backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-[#4B6B2B] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-ink">
              {t("hero.story.fittingMoment")}
            </span>
          </div>
          <p className="mt-2 text-xs font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wider">
            {t("hero.story.stepInto")}
          </p>
        </div>

      </div>
    </section>
  );
}
