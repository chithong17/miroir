import React, { useState } from "react";
import { useLanguage } from "../i18n.jsx";
import HeroStorySection from "../components/HeroStorySection.jsx";
import HeroDiscoverySection from "../components/HeroDiscoverySection.jsx";
import HeroEditorialFooter from "../components/HeroEditorialFooter.jsx";
import HeroCargoPantsCanvas from "../components/HeroCargoPantsCanvas.jsx";
import heroStageBackground from "../assets/hero2-stage-no-model.png";

// Miroir Signature Arch Monogram (Icon Mark)
function MiroirMonogram({ className = "w-6 h-6 text-[#1A1A1A]" }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 28V12C8 9.23858 10.2386 7 13 7C15.7614 7 18 9.23858 18 12V28"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M18 28V12C18 9.23858 20.2386 7 23 7C25.7614 7 28 9.23858 28 12V28"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HeroPage2() {
  const { language, setLanguage } = useLanguage();
  const isVi = language === "vi";

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { labelEn: "Home", labelVi: "Trang chủ", href: "/", active: true },
    { labelEn: "Products", labelVi: "Sản phẩm", href: "/products" },
    { labelEn: "Try On", labelVi: "Thử đồ", href: "/try-on" },
    { labelEn: "AI Stylist", labelVi: "Stylist AI", href: "/stylist" },
  ];

  return (
    <div className="relative w-full bg-[#FFFFFF] text-ink selection:bg-mintSoft selection:text-ink font-sans antialiased">
      {/* ============================================================ */}
      {/* SECTION 1: TOP 100dvh EDITORIAL LANDING PAGE HERO            */}
      {/* ============================================================ */}
      <section className="relative flex flex-col h-[100dvh] min-h-[100dvh] w-full bg-[#FAFBF7] text-[#161616] overflow-hidden">
      {/* ============================================================ */}
      {/* 0. FULLSCREEN SCENIC ARTWORK BACKDROP                        */}
      {/* Spans the entire screen (100% width and height) so that the  */}
      {/* sky, concrete arch, and scenery flow behind the glass header */}
      {/* ============================================================ */}
      <div className="absolute inset-0 z-0 select-none overflow-hidden">
        <img
          src={heroStageBackground}
          alt="Miroir 3D Atelier Lake Scene, Outfit Preview & Floating Rail"
          className="h-full w-full object-cover object-[center_top] lg:object-[center_center]"
          draggable={false}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/hero/hero2_stage_bg_4k.jpg?v=2";
          }}
        />
      </div>

      {/* Interactive garment: follows the pointer and supports unrestricted horizontal drag rotation. */}
      <HeroCargoPantsCanvas />

      {/* ============================================================ */}
      {/* 1. TOP EDITORIAL NAVIGATION (3 SEPARATE FLOATING GLASS PILLS) */}
      {/* ============================================================ */}
      <header className="relative z-30 flex h-[76px] w-full items-center justify-between px-6 sm:px-10 lg:px-16 shrink-0 bg-transparent pt-3 pb-2 transition-all duration-300">
        
        {/* CỤM 1: FLOATING GLASS LOGO PILL (ULTRA TRANSPARENT) */}
        <a
          href="/"
          className="flex items-center gap-2.5 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/45 px-3.5 py-1.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.6)] transition-all duration-300 group hover:scale-[1.02]"
        >
          <img
            src="/logo-web.png"
            alt="Miroir"
            className="h-7 w-7 rounded-full border border-white/50 bg-white/40 object-cover shadow-xs transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-display text-base sm:text-[17px] font-black uppercase tracking-[0.24em] text-[#161616] pr-1.5">
            MIROIR
          </span>
        </a>

        {/* CỤM 2: FLOATING GLASS NAVIGATION TABS PILL (ULTRA TRANSPARENT) */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 rounded-full border border-white/45 bg-white/20 px-6 py-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md md:flex lg:gap-8">
          {navLinks.map((item) => (
            <a
              key={item.labelEn}
              href={item.href}
              className={`relative py-0.5 text-[13px] lg:text-[13.5px] font-medium tracking-wide transition-colors ${
                item.active
                  ? "font-bold text-[#111111]"
                  : "text-[#3D4B3B] hover:text-[#111111]"
              }`}
            >
              {isVi ? item.labelVi : item.labelEn}
              {item.active && (
                <span className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-[#B3D07E]" />
              )}
            </a>
          ))}
        </nav>

        {/* CỤM 3: FLOATING GLASS ACTIONS PILL (ULTRA TRANSPARENT) */}
        <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border border-white/45 p-1.5 pl-2.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.6)]">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/30 text-[#2D3A2B] hover:text-[#111111] transition-colors"
            title={isVi ? "Tìm kiếm" : "Search"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-1.35z" />
            </svg>
          </button>

          {/* Bilingual Language Switcher Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/30 hover:bg-white/50 backdrop-blur-sm px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[#2C382A] shadow-xs transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#B3D07E]" />
            {language === "vi" ? "VI" : "EN"}
          </button>

          {/* Get Started Button */}
          <a
            href="/login"
            style={{ color: "#FFFFFF" }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#B3D07E] hover:bg-[#A3C46C] backdrop-blur-sm !text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.22)] px-4 py-1.5 text-xs sm:text-[12.5px] font-bold tracking-wide border border-white/40 shadow-[0_4px_14px_rgba(179,208,126,0.35)] transition-all hover:scale-[1.03]"
          >
            <span className="!text-white">{isVi ? "Bắt đầu" : "Get Started"}</span>
            <span className="text-sm leading-none !text-white">→</span>
          </a>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN STAGE (FULL VIEWPORT - HEADER HEIGHT)                */}
      {/* ============================================================ */}
      <main className="relative z-10 flex w-full flex-1 overflow-hidden">

        {/* ============================================================ */}
        {/* LEFT EDITORIAL CONTENT OVERLAY                               */}
        {/* ============================================================ */}
        <div className="relative z-10 w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-between px-6 py-6 sm:px-10 sm:py-8 lg:pl-16 lg:pr-4 xl:pl-20 bg-transparent transition-all duration-300">
          
          {/* Top Editorial Kicker / Slogan */}
          <div className="space-y-1">
            <p className="font-display text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#6A7B66]">
              FIT YOUR BUSINESS, FREE YOUR MIND
            </p>
          </div>

          {/* Center Editorial Headline & Copy */}
          <div className="my-auto py-4 sm:py-6 space-y-4 sm:space-y-5 max-w-[430px]">
            {/* Massive Heading */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] xl:text-[62px] font-black uppercase tracking-[-0.03em] leading-[0.98]">
              <span className="block text-[#161616]">DISCOVER</span>
              <span className="block text-[#B3D07E]">MIROIR.</span>
            </h1>

            {/* Subtitle */}
            <div className="space-y-0.5">
              <p className="font-sans text-base sm:text-lg lg:text-[18px] font-semibold text-[#252525] leading-snug">
                {isVi
                  ? "Hệ điều hành dành riêng cho shop thời trang."
                  : "The dedicated operating system for fashion businesses."}
              </p>
            </div>

            {/* Editorial Body Paragraph */}
            <p className="font-sans text-xs sm:text-sm lg:text-[13.5px] text-[#556652] leading-relaxed">
              {isVi
                ? "MIROIR là nền tảng Vertical SaaS dành cho ngành thời trang, giúp các shop quản lý vận hành đa kênh và đưa ra quyết định hiệu quả dựa trên dữ liệu."
                : "MIROIR is a Vertical SaaS platform for fashion businesses, helping shops manage omnichannel operations and make smarter, data-driven decisions."}
            </p>

            {/* Action Bar (Pill CTA + Watch Demo Button) */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 pt-1">
              <a
                href="/login"
                style={{ color: "#FFFFFF" }}
                className="group inline-flex items-center gap-2 rounded-full bg-[#B3D07E] hover:bg-[#A3C46C] !text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.22)] px-6 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-extrabold tracking-wide shadow-[0_10px_25px_rgba(179,208,126,0.45)] hover:shadow-[0_14px_32px_rgba(179,208,126,0.6)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]"
              >
                <span className="!text-white font-extrabold">{isVi ? "Bắt đầu ngay" : "Start Now"}</span>
                <span className="text-base !text-white transition-transform duration-300 group-hover:translate-x-1 font-bold">→</span>
              </a>

              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="group inline-flex items-center gap-3 text-xs sm:text-sm font-bold text-[#1C2A1B] hover:text-[#527433] transition-colors py-2 px-1"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#DCE4D6] shadow-[0_3px_12px_rgba(0,0,0,0.06)] group-hover:scale-105 group-hover:shadow-[0_6px_18px_rgba(0,0,0,0.1)] transition-all duration-300">
                  <svg className="w-3.5 h-3.5 text-[#2C3E28] translate-x-0.5 fill-current" viewBox="0 0 24 24">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </span>
                <span>{isVi ? "Xem Bản Demo" : "Watch Demo"}</span>
              </button>
            </div>


          </div>

          {/* Bottom Editorial Motto */}
          <div className="pt-2">
            <p className="font-editorial-quote italic text-lg sm:text-xl text-[#5F725A] select-none tracking-wide">
              “ Fashion moves fast, you move smarter. ”
            </p>
          </div>
        </div>

        {/* Right side has interactive hotspot triggers over the artwork if desired */}
        <div className="relative flex-1 hidden lg:block pointer-events-none">
          {/* Subtle click trigger over the outfit preview to launch Try-On Studio */}
          <a
            href="/try-on"
            className="absolute left-[3%] xl:left-[6%] top-[14%] xl:top-[16%] w-[190px] xl:w-[215px] h-[240px] pointer-events-auto rounded-[24px] cursor-pointer"
            title={isVi ? "Mở phòng thử đồ 3D" : "Launch 3D Fitting Studio"}
          />
        </div>
      </main>
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

      {/* ============================================================ */}
      {/* 3. INTERACTIVE "WATCH DEMO" VIDEO MODAL                      */}
      {/* ============================================================ */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-[760px] rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-white/80 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#E5F0DF] text-[#456337]">
                  <MiroirMonogram className="w-5 h-5 text-[#456337]" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#161616]">
                    {isVi ? "Trải Nghiệm Phòng May Đo 3D Miroir" : "Experience Miroir 3D Atelier"}
                  </h3>
                  <p className="text-xs text-[#6F7F69]">
                    {isVi ? "Mô phỏng chuẩn xác phom dáng & độ rũ vải thời gian thực" : "True-to-scale body silhouette & fabric physics"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Video / Interactive Stage Preview */}
            <div className="relative mt-4 aspect-video w-full rounded-2xl overflow-hidden bg-neutral-900 shadow-inner">
              <img
                src="/hero/hero2_stage_bg_4k.webp?v=2"
                alt="Demo Preview"
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                <div
                  style={{ color: "#FFFFFF" }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#B3D07E] !text-white px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2 w-max shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span className="!text-white">3D AI Fitting Engine v2.4</span>
                </div>
                <h4 className="text-xl font-bold">
                  {isVi ? "Thử đồ số hóa chỉ trong 3 bước đơn giản" : "Digital Virtual Try-On in 3 Simple Steps"}
                </h4>
                <p className="text-xs text-neutral-300 mt-1 max-w-md">
                  {isVi
                    ? "Tạo avatar 3D từ số đo cơ thể, khoác thử bất kỳ trang phục nào từ các thương hiệu thời trang đối tác, và đánh giá độ ôm sát trực quan."
                    : "Create your scaled 3D avatar, simulate bespoke drapes, and preview fits across boutique designer brands with zero guesswork."}
                </p>
              </div>
            </div>

            {/* Steps Row */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { step: "01", titleEn: "Input Shape", titleVi: "Nhập vóc dáng", descEn: "Height, waist, hips or quick photo", descVi: "Chiều cao, số đo hoặc ảnh chụp" },
                { step: "02", titleEn: "Select Garment", titleVi: "Chọn trang phục", descEn: "From curated global collections", descVi: "Từ bộ sưu tập thời trang cao cấp" },
                { step: "03", titleEn: "Real-time Drape", titleVi: "Xem độ rũ vải", descEn: "Walk, turn, inspect every angle", descVi: "Xoay 360 độ kiểm tra từng góc nhìn" },
              ].map((item) => (
                <div key={item.step} className="rounded-xl bg-[#FBF9F5] p-3 border border-black/[0.04]">
                  <span className="font-display text-xs font-black text-[#8EA863]">{item.step}</span>
                  <p className="font-display text-xs font-bold text-[#1C2A1B] mt-0.5">{isVi ? item.titleVi : item.titleEn}</p>
                  <p className="text-[11px] text-[#697A63] mt-0.5">{isVi ? item.descVi : item.descEn}</p>
                </div>
              ))}
            </div>

            {/* Modal Bottom CTA */}
            <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-black transition-colors"
              >
                {isVi ? "Đóng" : "Close"}
              </button>
              <a
                href="/login"
                style={{ color: "#FFFFFF" }}
                className="rounded-full bg-[#B3D07E] hover:bg-[#A3C46C] !text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.22)] px-5 py-2.5 text-xs font-bold tracking-wide shadow-md transition-all hover:scale-[1.02]"
              >
                <span className="!text-white">{isVi ? "Bắt đầu ngay →" : "Get Started Now →"}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. QUICK SEARCH MODAL                                        */}
      {/* ============================================================ */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[560px] rounded-[26px] bg-white p-5 shadow-2xl border border-white/90">
            <div className="flex items-center gap-3 border-b border-black/[0.08] pb-3">
              <svg className="w-5 h-5 text-[#8EA863]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isVi ? "Tìm kiếm trang phục, bộ sưu tập, thương hiệu..." : "Search looks, cargo pants, ateliers, styles..."}
                className="w-full bg-transparent text-sm text-[#1C2A1B] placeholder-[#889982] outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-700"
              >
                ESC
              </button>
            </div>

            {/* Quick tags */}
            <div className="pt-3">
              <p className="text-[11px] font-bold text-[#6D7D68] uppercase tracking-wider mb-2">
                {isVi ? "Gợi ý thịnh hành" : "Trending Searches"}
              </p>
              <div className="flex flex-wrap gap-2">
                {["Cargo Pants", "Sage Green Overshirt", "Minimalist Sneakers", "3D Fitting Studio", "Spring Lookbook"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                    }}
                    className="rounded-full bg-[#F5F8F2] hover:bg-[#E5EFE0] text-[#34482E] px-3 py-1 text-xs font-medium border border-[#DDE7D8] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
