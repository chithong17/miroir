import React from "react";

export default function HeroEditorialFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full border-t border-white/10 bg-[#000000] px-6 pt-24 pb-16 text-white sm:px-12 sm:pt-32 sm:pb-20 lg:px-20 lg:pt-40 lg:pb-24 overflow-hidden">
      <div className="mx-auto max-w-[1600px]">
        {/* ============================================================ */}
        {/* TOP ROW: Brand Statement + Curated Navigation Columns        */}
        {/* ============================================================ */}
        <div className="mb-24 grid grid-cols-1 gap-14 border-b border-white/10 pb-20 sm:grid-cols-2 lg:grid-cols-12 lg:gap-16">
          {/* Brand Manifesto */}
          <div className="lg:col-span-5">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#B3D07E]">
              MANIFESTO // 2026
            </span>
            <p className="mt-4 text-sm font-normal leading-relaxed text-neutral-300 sm:text-base lg:max-w-md">
              MIROIR redefines the human relationship with clothing. Through high-precision
              3D body calibration, dynamic fabric physics, and generative styling intelligence, we
              liberate fashion from arbitrary sizes into true personal proportion.
            </p>
            <div className="mt-8 flex items-center gap-4 text-[10px] font-mono tracking-widest text-neutral-400">
              <span>PARIS</span>
              <span>•</span>
              <span>MILANO</span>
              <span>•</span>
              <span>TOKYO</span>
              <span>•</span>
              <span>DIGITAL</span>
            </div>
          </div>

          {/* Navigation Column 1 */}
          <div className="lg:col-span-2 lg:col-start-7">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">
              DISCOVERY
            </h4>
            <ul className="mt-5 space-y-3 text-xs tracking-wider text-neutral-400">
              <li>
                <a href="/app/try-on" className="transition-colors duration-200 hover:text-white">
                  Virtual Try-On
                </a>
              </li>
              <li>
                <a href="/app/stylist" className="transition-colors duration-200 hover:text-white">
                  AI Stylist
                </a>
              </li>
              <li>
                <a href="/app/products" className="transition-colors duration-200 hover:text-white">
                  Silhouette Catalog
                </a>
              </li>
              <li>
                <a href="/download" className="transition-colors duration-200 hover:text-white">
                  Mobile Application
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2 */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">
              ATELIER
            </h4>
            <ul className="mt-5 space-y-3 text-xs tracking-wider text-neutral-400">
              <li>
                <a href="/login" className="transition-colors duration-200 hover:text-white">
                  Client Portal
                </a>
              </li>
              <li>
                <a href="/register" className="transition-colors duration-200 hover:text-white">
                  Member Onboarding
                </a>
              </li>
              <li>
                <a href="/shop/dashboard" className="transition-colors duration-200 hover:text-white">
                  Shop Dashboard
                </a>
              </li>
              <li>
                <a href="/hero" className="transition-colors duration-200 hover:text-white">
                  Editorial Hero
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Editorial Channels */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">
              CHANNELS
            </h4>
            <ul className="mt-5 space-y-3 text-xs tracking-wider text-neutral-400 font-mono">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-[#B3D07E]"
                >
                  /INSTAGRAM
                </a>
              </li>
              <li>
                <a
                  href="https://behance.net"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-[#B3D07E]"
                >
                  /BEHANCE
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-[#B3D07E]"
                >
                  /X
                </a>
              </li>
              <li>
                <a
                  href="https://substack.com"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-[#B3D07E]"
                >
                  /EDITORIAL
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ============================================================ */}
        {/* OVERSIZED MONUMENTAL "MIROIR" TYPOGRAPHY                     */}
        {/* ============================================================ */}
        <div className="my-10 w-full overflow-hidden text-center select-none lg:my-16">
          <h1 className="font-display text-[22vw] font-black uppercase tracking-[-0.04em] text-white/90 leading-[0.82] transition-colors duration-500 hover:text-white">
            MIROIR
          </h1>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM METADATA BAR & COPYRIGHT                              */}
        {/* ============================================================ */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row text-[10px] font-mono tracking-widest text-neutral-400">
          <div>
            © 2026 MIROIR ATELIER INC. ALL RIGHTS RESERVED.
          </div>

          <div className="flex items-center gap-6">
            <span>FIT YOUR SHAPE. FREE YOUR STYLE.</span>
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-1.5 text-neutral-400 transition-colors duration-200 hover:text-white"
            >
              <span>BACK TO TOP</span>
              <span className="transition-transform duration-200 group-hover:-translate-y-0.5">↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
