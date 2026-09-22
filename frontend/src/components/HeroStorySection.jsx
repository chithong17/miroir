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
    let ticking = false;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable > 0) {
        const currentScroll = -rect.top;
        const rawProgress = Math.min(1, Math.max(0, currentScroll / totalScrollable));
        setProgress((prev) => (prev === rawProgress ? prev : rawProgress));
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
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
        {/* STRUCTURED LAYOUT (Based on Mockup)                          */}
        {/* ============================================================ */}
        <div
          className="absolute inset-0 z-10 mx-auto max-w-[1500px] px-6 sm:px-12 lg:px-20 py-16 flex flex-col justify-between pointer-events-none"
          style={{
            opacity: Math.max(0, 1 - progress * 4),
          }}
        >
          {/* Top Section */}
          <div className="flex justify-between items-start w-full pointer-events-auto relative z-10">
            {/* Left Sidebar */}
            <div className="hidden lg:flex flex-col gap-12 border-l border-[#4B6B2B]/20 pl-8 ml-2 mt-8 max-w-[320px]">
              {/* Item 01 */}
              <div className="relative">
                <div className="absolute -left-[37px] top-1.5 h-2 w-2 rounded-full bg-[#4B6B2B]"></div>
                <div className="absolute -left-[70px] top-0 text-sm font-black text-[#4B6B2B]">01</div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-ink">{t("hero.story.precisionFit")}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t("hero.story.precisionDesc")}</p>
              </div>
              {/* Item 02 */}
              <div className="relative">
                <div className="absolute -left-[37px] top-1.5 h-2 w-2 rounded-full bg-[#4B6B2B]"></div>
                <div className="absolute -left-[70px] top-0 text-sm font-black text-[#4B6B2B]">02</div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-ink">{t("hero.story.bodyAware")}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t("hero.story.bodyAwareDesc")}</p>
              </div>
              {/* Item 03 */}
              <div className="relative">
                <div className="absolute -left-[37px] top-1.5 h-2 w-2 rounded-full bg-[#4B6B2B]"></div>
                <div className="absolute -left-[70px] top-0 text-sm font-black text-[#4B6B2B]">03</div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-ink">{t("hero.story.digitalAtelier")}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t("hero.story.digitalAtelierDesc")}</p>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="flex flex-col lg:items-start max-w-[480px] lg:mt-4">
              <div className="hidden lg:flex items-center gap-6 mb-16">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-ink">MIROIR</span>
                <div className="w-12 h-[1px] bg-ink/30"></div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 text-left">
                  VIRTUAL TRY-ON<br/>
                  FOR A BRIGHTER YOU
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-[46px] font-black uppercase tracking-tighter text-ink leading-[1.05] mb-6 drop-shadow-sm">
                {t("hero.story.proportions")}
                <br />
                <span className="text-[#4B6B2B] font-black">{t("hero.story.proportionsSub")}</span>
              </h2>

              <p className="text-base sm:text-lg text-ink font-medium leading-relaxed max-w-[400px]">
                {t("hero.story.quote")}
              </p>

              <div className="w-8 h-[1px] bg-ink/30 my-8"></div>

              <div className="flex items-start gap-3 w-full max-w-[320px]">
                <svg className="w-5 h-5 mt-0.5 text-[#4B6B2B] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-black tracking-widest text-ink uppercase">QUY NHƠN, VIỆT NAM</p>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 mt-1 uppercase">NƠI PHONG CÁCH GẶP GỠ CÔNG NGHỆ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="hidden lg:flex justify-between items-end w-full pb-8 pointer-events-auto relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-ink">MIROIR</span>
                <span className="text-xs font-bold text-ink">//</span>
                <span className="text-xs font-black tracking-widest text-ink">2026</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">THỜI TRANG GẦN HƠN VỚI BẠN</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-[1px] bg-ink/30"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                FASHION × TECHNOLOGY × A BETTER YOU
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTER STORYTELLING HERO IMAGE (Anchored at exact center)    */}
        {/* Expands symmetrically in all 4 directions from (50%, 50%)    */}
        {/* ============================================================ */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none"
          style={{
            width: `${Math.round(currentWidth)}px`,
            height: `${Math.round(currentHeight)}px`,
          }}
        >
          <div
            className={`relative h-full w-full overflow-hidden transition-[border-radius,box-shadow,border] duration-300 ${easedExp > 0.88
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

            {/* Removed vignette to keep image perfectly crisp and bright */}

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
