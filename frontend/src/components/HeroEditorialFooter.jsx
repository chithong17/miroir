import React from "react";
import { useLanguage } from "../i18n.jsx";

export default function HeroEditorialFooter() {
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full border-t border-mintSoft/60 bg-[#F8FAF5] px-6 pt-24 pb-16 text-ink sm:px-12 sm:pt-32 sm:pb-20 lg:px-20 lg:pt-40 lg:pb-24 overflow-hidden">
      <div className="mx-auto max-w-[1600px]">
        {/* ============================================================ */}
        {/* TOP ROW: Brand Statement + Curated Navigation Columns        */}
        {/* ============================================================ */}
        <div className="mb-24 grid grid-cols-1 gap-14 border-b border-mintSoft/50 pb-20 sm:grid-cols-2 lg:grid-cols-12 lg:gap-16">
          {/* Brand Manifesto */}
          <div className="lg:col-span-5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-mintDeep">
              {t("hero.footer.manifestoTag")}
            </span>
            <p className="mt-4 text-sm font-normal leading-relaxed text-muted sm:text-base lg:max-w-md">
              {t("hero.footer.manifestoText")}
            </p>
            <div className="mt-8 flex items-center gap-4 text-[10px] font-mono tracking-widest text-mutedSoft">
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
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink">
              {t("hero.footer.colDiscovery")}
            </h4>
            <ul className="mt-5 space-y-3 text-xs tracking-wider text-muted font-medium">
              <li>
                <a href="/app/try-on" className="transition-colors duration-200 hover:text-mintDeep">
                  {t("hero.footer.tryOn")}
                </a>
              </li>
              <li>
                <a href="/app/stylist" className="transition-colors duration-200 hover:text-mintDeep">
                  {t("hero.footer.stylist")}
                </a>
              </li>
              <li>
                <a href="/app/products" className="transition-colors duration-200 hover:text-mintDeep">
                  {t("hero.footer.products")}
                </a>
              </li>
              <li>
                <a href="/download" className="transition-colors duration-200 hover:text-mintDeep">
                  {t("hero.footer.app")}
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2 */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink">
              {t("hero.footer.colAtelier")}
            </h4>
            <ul className="mt-5 space-y-3 text-xs tracking-wider text-muted font-medium">
              <li>
                <a href="/login" className="transition-colors duration-200 hover:text-mintDeep">
                  {t("hero.footer.portal")}
                </a>
              </li>
              <li>
                <a href="/register" className="transition-colors duration-200 hover:text-mintDeep">
                  {t("hero.footer.onboarding")}
                </a>
              </li>
              <li>
                <a href="/shop/dashboard" className="transition-colors duration-200 hover:text-mintDeep">
                  {t("hero.footer.shopDashboard")}
                </a>
              </li>
              <li>
                <a href="/" className="transition-colors duration-200 hover:text-mintDeep">
                  {t("hero.footer.editorialHero")}
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Editorial Channels */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink">
              {t("hero.footer.colChannels")}
            </h4>
            <ul className="mt-5 space-y-3 text-xs tracking-wider text-muted font-mono font-medium">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-mintDeep"
                >
                  /INSTAGRAM
                </a>
              </li>
              <li>
                <a
                  href="https://behance.net"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-mintDeep"
                >
                  /BEHANCE
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-mintDeep"
                >
                  /X
                </a>
              </li>
              <li>
                <a
                  href="https://substack.com"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-200 hover:text-mintDeep"
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
          <h1 className="font-display text-[22vw] font-black uppercase tracking-[-0.04em] text-mintDeep/12 leading-[0.82] transition-colors duration-500 hover:text-mintDeep/25">
            MIROIR
          </h1>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM METADATA BAR & COPYRIGHT                              */}
        {/* ============================================================ */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-mintSoft/50 pt-8 sm:flex-row text-[10px] font-mono tracking-widest text-mutedSoft">
          <div>
            {t("hero.footer.copyright")}
          </div>

          <div className="flex items-center gap-6">
            <span className="font-bold text-mintDeep">{t("hero.footer.slogan")}</span>
            <button
              onClick={scrollToTop}
              className="soft-button !rounded-full !px-4 !py-1.5 text-xs font-bold border-mintSoft bg-white hover:bg-mintPale text-mintDeep shadow-sm group flex items-center gap-1.5"
            >
              <span>{t("hero.footer.backToTop")}</span>
              <span className="transition-transform duration-200 group-hover:-translate-y-0.5">↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
