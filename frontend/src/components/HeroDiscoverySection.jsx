import React, { useState } from "react";

const ARCHIVE_ITEMS = [
  {
    id: "01",
    title: "SCULPTURAL TAILORING",
    category: "SILHOUETTE 01 // BESPOKE",
    code: "ARC-884 / WOOL CREPE",
    description:
      "Engineered with algorithmic shoulder pads and dynamic waist suppression. Calibrates to your posture and torso curvature.",
    specs: "TENSION: 14.2 N/m² • DRAPE: RIGID-FLUID",
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
    aspect: "aspect-[3/4]",
    className: "lg:col-span-7 lg:row-span-2",
    rotation: "-rotate-1",
  },
  {
    id: "02",
    title: "TACTILE DRAPE STUDY",
    category: "FABRIC DYNAMICS // 02",
    code: "ARC-912 / RAW SILK",
    description:
      "Simulates real-time cloth-to-skin friction, capturing weight, ambient breeze, and fluid micro-folds across motion.",
    specs: "THREAD COUNT: 800 • SHEAR: 0.88",
    imageUrl:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",
    aspect: "aspect-[4/3]",
    className: "lg:col-span-5 lg:translate-y-8",
    rotation: "rotate-1",
  },
  {
    id: "03",
    title: "MINIMALIST VOLUME",
    category: "PROPORTION ARCHIVE // 03",
    code: "ARC-403 / CASHMERE TWILL",
    description:
      "An exploration of exaggerated proportions balanced precisely to height, shoulder span, and leg-to-torso ratios.",
    specs: "OVERSIZE RATIO: +18% • BALANCE: OPTICAL",
    imageUrl:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85",
    aspect: "aspect-[4/5]",
    className: "lg:col-span-5 lg:-translate-y-12",
    rotation: "-rotate-0.5",
  },
  {
    id: "04",
    title: "MONOCHROME ESSENCE",
    category: "CONTOUR STUDY // 04",
    code: "ARC-667 / DOUBLE WEAVE",
    description:
      "Precision cutlines designed to elongate the visual vertical axis. Zero excess seamwork; pure silhouette fidelity.",
    specs: "AXIS: VERTICAL • SEAMLESS RATIO: 94%",
    imageUrl:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85",
    aspect: "aspect-[3/4]",
    className: "lg:col-span-7 lg:translate-y-4",
    rotation: "rotate-1",
  },
  {
    id: "05",
    title: "AVANT-GARDE PLEATING",
    category: "GEOMETRY LAB // 05",
    code: "ARC-109 / TECHNICAL ORGANZA",
    description:
      "Parametric accordion micro-pleats that expand and breathe with walking cadence. Virtual fitting at millimeter tolerance.",
    specs: "EXPANSION: 3.4X • CADENCE MAPPED",
    imageUrl:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
    aspect: "aspect-[16/9]",
    className: "lg:col-span-12 lg:my-6",
    rotation: "rotate-0",
  },
];

export default function HeroDiscoverySection() {
  const [activeCard, setActiveCard] = useState(null);

  return (
    <section className="relative w-full overflow-hidden bg-[#000000] px-6 py-28 text-white sm:px-12 sm:py-36 lg:px-20 lg:py-44">
      {/* Floating Oversized Background Typography Watermarks */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        <span className="absolute -left-12 top-[10%] font-display text-[16vw] font-black uppercase tracking-tighter text-white/[0.025] leading-none">
          SILHOUETTE
        </span>
        <span className="absolute -right-8 top-[38%] font-display text-[18vw] font-black uppercase tracking-tighter text-white/[0.025] leading-none">
          PROPORTION
        </span>
        <span className="absolute left-[8%] top-[65%] font-display text-[15vw] font-black uppercase tracking-tighter text-white/[0.02] leading-none">
          ATELIER
        </span>
        <span className="absolute right-[5%] bottom-[8%] font-display text-[17vw] font-black uppercase tracking-tighter text-white/[0.025] leading-none">
          IDENTITY
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px]">
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="mb-20 flex flex-col items-start justify-between gap-10 border-b border-white/10 pb-16 lg:mb-28 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B3D07E]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#B3D07E]">
                DISCOVERY ARCHIVE // VOL. 02
              </span>
            </div>
            <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-6xl lg:text-7xl">
              DISCOVER
              <br />
              <span className="text-neutral-400">MIROIR.</span>
            </h2>
          </div>

          <div className="max-w-md">
            <p className="text-xs font-normal leading-relaxed tracking-wide text-neutral-400 sm:text-sm">
              An architectural exploration of body-aware fashion, virtual drape, and personal fit.
              Step through curated silhouettes engineered to celebrate your natural geometry without
              compromise.
            </p>
            <div className="mt-4 flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              <span>INDEX: 05 EDITIONS</span>
              <span>•</span>
              <span>CALIBRATION: 99.4%</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ASYMMETRIC EDITORIAL GRID (4-5 Fashion Archive Cards)         */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-10 sm:gap-14 lg:grid-cols-12 lg:gap-12 items-start">
          {ARCHIVE_ITEMS.map((item, idx) => (
            <div
              key={item.id}
              onMouseEnter={() => setActiveCard(item.id)}
              onMouseLeave={() => setActiveCard(null)}
              className={`group relative flex flex-col transition-all duration-700 ease-out ${item.className}`}
            >
              {/* Card Container with subtle rotation on hover */}
              <div
                className={`relative w-full overflow-hidden border border-white/15 bg-white/[0.02] p-3 transition-all duration-500 hover:border-white/40 hover:bg-white/[0.04] sm:p-4 ${
                  activeCard === item.id ? "shadow-[0_20px_50px_rgba(0,0,0,0.9)]" : ""
                }`}
              >
                {/* Top Metadata Strip */}
                <div className="mb-3 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">[{item.id}]</span>
                    <span className="text-neutral-400">{item.category}</span>
                  </div>
                  <span className="text-[#B3D07E]/80 transition-colors group-hover:text-[#B3D07E]">
                    {item.code}
                  </span>
                </div>

                {/* Image Container with smooth zoom */}
                <div className={`relative w-full ${item.aspect} overflow-hidden bg-neutral-900`}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover object-center grayscale-[20%] transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0"
                    loading="lazy"
                  />
                  {/* Subtle dark gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Corner Accent Hairlines */}
                  <div className="pointer-events-none absolute left-2 top-2 h-2 w-2 border-l border-t border-white/40" />
                  <div className="pointer-events-none absolute right-2 top-2 h-2 w-2 border-r border-t border-white/40" />
                  <div className="pointer-events-none absolute bottom-2 left-2 h-2 w-2 border-b border-l border-white/40" />
                  <div className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b border-r border-white/40" />

                  {/* Hover Floating Technical Tag */}
                  <div className="absolute bottom-3 left-3 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="border border-white/20 bg-black/80 px-2.5 py-1 text-[9px] font-mono tracking-widest text-white backdrop-blur-md">
                      {item.specs}
                    </span>
                  </div>
                </div>

                {/* Text Description Block */}
                <div className="mt-4 flex flex-col justify-between">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-base font-bold uppercase tracking-tight text-white transition-colors duration-300 group-hover:text-[#B3D07E] sm:text-lg">
                      {item.title}
                    </h3>
                    <span className="text-xs text-neutral-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white">
                      ↗
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-normal leading-relaxed text-neutral-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* CENTERED EDITORIAL CTA: EXPLORE YOUR FIT →                   */}
        {/* ============================================================ */}
        <div className="mt-28 flex flex-col items-center justify-center text-center sm:mt-36 lg:mt-44">
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            EXPERIENCE THE ALGORITHMIC ATELIER
          </p>
          <a
            href="/app/try-on"
            className="group relative inline-flex items-center gap-3 border border-white/60 bg-transparent px-8 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white hover:text-black sm:px-12 sm:py-5 sm:text-sm"
          >
            <span>EXPLORE YOUR FIT</span>
            <span className="transition-transform duration-300 group-hover:translate-x-2">→</span>
          </a>
          <p className="mt-4 text-[11px] text-neutral-400">
            Instant 3D body calibration • Virtual try-on in under 60 seconds
          </p>
        </div>
      </div>
    </section>
  );
}
