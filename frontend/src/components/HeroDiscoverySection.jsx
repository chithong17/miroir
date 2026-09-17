import React, { useState } from "react";
import { useLanguage } from "../i18n.jsx";

const ROW1_ITEMS = [
  {
    id: "01",
    titleKey: "hero.discovery.item1.title",
    categoryKey: "hero.discovery.item1.category",
    codeKey: "hero.discovery.item1.code",
    descKey: "hero.discovery.item1.desc",
    specsKey: "hero.discovery.item1.specs",
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
    aspect: "aspect-[4/5]",
  },
  {
    id: "02",
    titleKey: "hero.discovery.item2.title",
    categoryKey: "hero.discovery.item2.category",
    codeKey: "hero.discovery.item2.code",
    descKey: "hero.discovery.item2.desc",
    specsKey: "hero.discovery.item2.specs",
    imageUrl:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",
    aspect: "aspect-[4/5]",
  },
  {
    id: "03",
    titleKey: "hero.discovery.item3.title",
    categoryKey: "hero.discovery.item3.category",
    codeKey: "hero.discovery.item3.code",
    descKey: "hero.discovery.item3.desc",
    specsKey: "hero.discovery.item3.specs",
    imageUrl:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85",
    aspect: "aspect-[4/5]",
  },
];

const ROW2_ITEMS = [
  {
    id: "04",
    titleKey: "hero.discovery.item4.title",
    categoryKey: "hero.discovery.item4.category",
    codeKey: "hero.discovery.item4.code",
    descKey: "hero.discovery.item4.desc",
    specsKey: "hero.discovery.item4.specs",
    imageUrl:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85",
    aspect: "aspect-[16/10]",
  },
  {
    id: "05",
    titleKey: "hero.discovery.item5.title",
    categoryKey: "hero.discovery.item5.category",
    codeKey: "hero.discovery.item5.code",
    descKey: "hero.discovery.item5.desc",
    specsKey: "hero.discovery.item5.specs",
    imageUrl:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
    aspect: "aspect-[16/10]",
  },
];

function ArchiveCard({ item, t, activeCard, setActiveCard }) {
  return (
    <div
      onMouseEnter={() => setActiveCard(item.id)}
      onMouseLeave={() => setActiveCard(null)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[26px] sm:rounded-[30px] border border-mintSoft/80 bg-white p-4 sm:p-5 shadow-glass transition-all duration-300 hover:border-mintDeep hover:shadow-glowDeep hover:-translate-y-1.5 ${
        activeCard === item.id ? "border-mintDeep shadow-glowDeep" : ""
      }`}
    >
      {/* Top Metadata Strip */}
      <div className="mb-3 flex items-center justify-between text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-muted">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-mintPale border border-mintSoft px-2.5 py-0.5 font-bold text-mintDeep">
            [{item.id}]
          </span>
          <span className="font-bold text-neutral-600">{t(item.categoryKey)}</span>
        </div>
        <span className="font-bold text-mintDeep">
          {t(item.codeKey)}
        </span>
      </div>

      {/* Image Container */}
      <div className={`relative w-full ${item.aspect} overflow-hidden rounded-[20px] bg-mintPale/40`}>
        <img
          src={item.imageUrl}
          alt={t(item.titleKey)}
          className="h-full w-full object-cover object-center grayscale-[15%] transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0"
          loading="lazy"
        />
        {/* Subtle clean gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-30" />

        {/* Corner Accent Hairlines */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 h-2.5 w-2.5 border-l border-t border-white/60" />
        <div className="pointer-events-none absolute right-2.5 top-2.5 h-2.5 w-2.5 border-r border-t border-white/60" />
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 h-2.5 w-2.5 border-b border-l border-white/60" />
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 h-2.5 w-2.5 border-b border-r border-white/60" />

        {/* Hover Floating Technical Tag */}
        <div className="absolute bottom-3 left-3 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-full border border-mintSoft bg-white/95 px-3 py-1 text-[9px] font-mono font-bold tracking-widest text-mintDeep backdrop-blur-md shadow-sm">
            {t(item.specsKey)}
          </span>
        </div>
      </div>

      {/* Text Description Block */}
      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display text-base font-extrabold uppercase tracking-tight text-ink transition-colors duration-300 group-hover:text-mintDeep sm:text-lg">
              {t(item.titleKey)}
            </h3>
            <span className="text-sm font-bold text-mintDeep transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
              ↗
            </span>
          </div>
          <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-muted">
            {t(item.descKey)}
          </p>
        </div>

        {/* Specs footer */}
        <div className="mt-4 pt-3 border-t border-mintSoft/50 flex items-center justify-between text-[10px] font-mono font-bold text-neutral-500">
          <span>{t(item.specsKey)}</span>
        </div>
      </div>
    </div>
  );
}

export default function HeroDiscoverySection() {
  const { t } = useLanguage();
  const [activeCard, setActiveCard] = useState(null);

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAF4] to-[#FFFFFF] px-6 py-28 text-ink sm:px-12 sm:py-36 lg:px-20 lg:py-44">
      {/* Floating Oversized Background Typography Watermarks */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        <span className="absolute -left-12 top-[10%] font-display text-[16vw] font-black uppercase tracking-tighter text-mintDeep/[0.04] leading-none">
          SILHOUETTE
        </span>
        <span className="absolute -right-8 top-[38%] font-display text-[18vw] font-black uppercase tracking-tighter text-mintDeep/[0.04] leading-none">
          PROPORTION
        </span>
        <span className="absolute left-[8%] top-[65%] font-display text-[15vw] font-black uppercase tracking-tighter text-mintDeep/[0.035] leading-none">
          ATELIER
        </span>
        <span className="absolute right-[5%] bottom-[8%] font-display text-[17vw] font-black uppercase tracking-tighter text-mintDeep/[0.04] leading-none">
          IDENTITY
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px]">
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="mb-20 flex flex-col items-start justify-between gap-10 border-b border-mintSoft/60 pb-16 lg:mb-28 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-mintSoft bg-mintPale px-3.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-mintDeep animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-mintDeep">
                {t("hero.discovery.tag")}
              </span>
            </div>
            <h2 className="font-display text-4xl font-black uppercase tracking-tight text-ink sm:text-6xl lg:text-7xl">
              {t("hero.discovery.title")}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mintDeep via-mint to-mintDeep">
                {t("hero.discovery.titleSub")}
              </span>
            </h2>
          </div>

          <div className="max-w-md">
            <p className="text-xs font-normal leading-relaxed tracking-wide text-muted sm:text-sm">
              {t("hero.discovery.intro")}
            </p>
            <div className="mt-4 flex items-center gap-4 text-[10px] font-mono font-semibold uppercase tracking-widest text-mintDeep">
              <span>{t("hero.discovery.index")}</span>
              <span>•</span>
              <span>{t("hero.discovery.calibration")}</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ORDERLY EDITORIAL ARCHIVE GRID (3 Top + 2 Bottom)           */}
        {/* ============================================================ */}
        <div className="space-y-6 sm:space-y-8">
          {/* Row 1: 3 Equal Portrait Cards */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {ROW1_ITEMS.map((item) => (
              <ArchiveCard
                key={item.id}
                item={item}
                t={t}
                activeCard={activeCard}
                setActiveCard={setActiveCard}
              />
            ))}
          </div>

          {/* Row 2: 2 Balanced Landscape Cards */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 items-stretch">
            {ROW2_ITEMS.map((item) => (
              <ArchiveCard
                key={item.id}
                item={item}
                t={t}
                activeCard={activeCard}
                setActiveCard={setActiveCard}
              />
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTERED EDITORIAL CTA: EXPLORE YOUR FIT →                   */}
        {/* ============================================================ */}
        <div className="mt-28 flex flex-col items-center justify-center text-center sm:mt-36 lg:mt-44">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-mintSoft bg-gradient-to-br from-mintPale/70 via-white to-mintPale/40 p-10 shadow-glass backdrop-blur-xl sm:p-16">
            <p className="mb-4 text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-mintDeep">
              {t("hero.discovery.ctaTag")}
            </p>
            <h3 className="mb-6 font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {t("hero.discovery.ctaBtn")}
            </h3>
            <a
              href="/app/try-on"
              className="dark-button !rounded-[20px] !bg-gradient-to-r !from-mintDeep !via-mint !to-mintSoft !text-white !px-10 !py-4 sm:!px-12 sm:!py-5 text-sm sm:text-base font-bold shadow-glow hover:!shadow-glowDeep transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
            >
              <span>{t("hero.discovery.ctaBtn")}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
            <p className="mt-5 text-xs font-medium text-muted">
              {t("hero.discovery.ctaNote")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
