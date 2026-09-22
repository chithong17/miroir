import React, { useState } from "react";
import { useLanguage } from "../i18n.jsx";

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
    { labelEn: "Home", labelVi: "Trang chủ", href: "/hero2", active: true },
    { labelEn: "Features", labelVi: "Tính năng", href: "#features" },
    { labelEn: "Gallery", labelVi: "Bộ sưu tập", href: "#gallery" },
    { labelEn: "Atelier", labelVi: "Xưởng 3D", href: "/try-on" },
    { labelEn: "Pricing", labelVi: "Bảng giá", href: "#pricing" },
    { labelEn: "About", labelVi: "Giới thiệu", href: "#about" },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#FAFBF7] text-[#161616] selection:bg-[#D7E5CF] selection:text-[#23351F] font-sans antialiased overflow-x-hidden">
      {/* ============================================================ */}
      {/* 1. TOP EDITORIAL NAVIGATION HEADER                           */}
      {/* ============================================================ */}
      <header className="relative z-30 flex h-[72px] w-full items-center justify-between px-6 sm:px-10 lg:px-16 shrink-0 bg-transparent">
        {/* Brand Logo & Monogram */}
        <a href="/hero2" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.06] transition-transform duration-300 group-hover:scale-105">
            <MiroirMonogram className="w-6 h-6 text-[#1A1A1A]" />
          </div>
          <span className="font-display text-lg sm:text-xl font-black uppercase tracking-[0.24em] text-[#161616]">
            MIROIR
          </span>
        </a>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((item) => (
            <a
              key={item.labelEn}
              href={item.href}
              className={`relative py-1 text-[13px] lg:text-[14px] font-medium tracking-wide transition-colors ${
                item.active
                  ? "font-semibold text-[#1A1A1A]"
                  : "text-[#5C6659] hover:text-[#1A1A1A]"
              }`}
            >
              {isVi ? item.labelVi : item.labelEn}
              {item.active && (
                <span className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-6 h-[2.5px] rounded-full bg-[#6B8E5F]" />
              )}
            </a>
          ))}
        </nav>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[#3E4D3B] hover:text-[#1A1A1A] transition-all duration-200"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/80 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[#334230] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#6B8E5F] hover:bg-white transition-all duration-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#6B8E5F]" />
            {language === "vi" ? "VI" : "EN"}
          </button>

          {/* Get Started Button */}
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-[#E5F0DF] hover:bg-[#D7E6CF] text-[#2C4423] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[13px] font-bold tracking-wide border border-[#C5DCBA] shadow-[0_2px_10px_rgba(107,142,95,0.12)] transition-all duration-300 hover:scale-[1.03]"
          >
            <span>{isVi ? "Bắt đầu" : "Get Started"}</span>
            <span className="text-sm leading-none">→</span>
          </a>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN STAGE (FULL ARTWORK BACKDROP + EDITORIAL OVERLAY)     */}
      {/* ============================================================ */}
      <main className="relative z-10 flex w-full flex-1 lg:h-[calc(100dvh-72px)] lg:max-h-[calc(100dvh-72px)] lg:overflow-hidden">
        
        {/* ============================================================ */}
        {/* COMPLETE SCENIC ARTWORK BACKDROP                             */}
        {/* Contains the lake, arch, mannequin, floating Outfit Preview, */}
        {/* vertical selector rail, and carved stone monolith as image!  */}
        {/* ============================================================ */}
        <div className="absolute inset-0 z-0 select-none overflow-hidden">
          <picture>
            <source srcSet="/hero/hero2_stage_bg_4k.webp" type="image/webp" />
            <img
              src="/hero/hero2_stage_bg_4k.jpg"
              alt="Miroir 3D Atelier Lake Scene with Mannequin, Outfit Preview & Floating Rail"
              className="h-full w-full object-cover object-[center_top] lg:object-[center_center]"
              draggable={false}
            />
          </picture>
        </div>

        {/* ============================================================ */}
        {/* LEFT EDITORIAL CONTENT OVERLAY                               */}
        {/* ============================================================ */}
        <div className="relative z-10 w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-between px-6 py-6 sm:px-10 sm:py-8 lg:pl-16 lg:pr-4 xl:pl-20 bg-transparent transition-all duration-300">
          
          {/* Top Metadata Index */}
          <div className="space-y-1">
            <p className="font-display text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.24em] text-[#788874]">
              01 / 04
            </p>
            <p className="font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#556651]">
              YOUR STYLE
            </p>
            <p className="font-display text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#869682]">
              A CLOSER YOU
            </p>
          </div>

          {/* Center Editorial Headline & Copy */}
          <div className="my-auto py-4 sm:py-6 space-y-4 sm:space-y-5 max-w-[430px]">
            {/* Massive Heading */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] xl:text-[62px] font-black uppercase tracking-[-0.03em] leading-[0.98]">
              <span className="block text-[#161616]">DISCOVER</span>
              <span className="block text-[#688A58]">MIROIR.</span>
            </h1>

            {/* Subtitle */}
            <div className="space-y-0.5">
              <p className="font-sans text-base sm:text-lg lg:text-[18px] font-semibold text-[#252525] leading-snug">
                {isVi ? "Xưởng may đo 3D của riêng bạn." : "Your personal 3D atelier."}
              </p>
              <p className="font-sans text-sm sm:text-base lg:text-[16px] font-medium text-[#485445] leading-snug">
                {isVi ? "Thử đồ. Định hình phong cách. Là chính mình." : "Try. Style. Be You."}
              </p>
            </div>

            {/* Editorial Body Paragraph */}
            <p className="font-sans text-xs sm:text-sm lg:text-[13.5px] text-[#556652] leading-relaxed">
              {isVi
                ? "Trực quan hóa trang phục trên bản sao 3D chân thực của chính bạn, tự do thử nghiệm và khám phá phong cách hoàn mỹ nhất — trước khi khoác lên ngoài đời thực."
                : "Visualize outfits on your 3D self, experiment freely, and discover a style that truly fits — before you wear it in real life."}
            </p>

            {/* Action Bar (Pill CTA + Watch Demo Button) */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 pt-1">
              <a
                href="/try-on"
                className="inline-flex items-center gap-2 rounded-full bg-[#688A58] hover:bg-[#567547] text-white px-6 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-extrabold tracking-wide shadow-[0_10px_25px_rgba(104,138,88,0.38)] hover:shadow-[0_14px_32px_rgba(104,138,88,0.48)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]"
              >
                <span>{isVi ? "Bắt đầu thử đồ" : "Start Styling"}</span>
                <span className="text-base transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>

              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="group inline-flex items-center gap-3 text-xs sm:text-sm font-bold text-[#1C2A1B] hover:text-[#567547] transition-colors py-2 px-1"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#DCE4D6] shadow-[0_3px_12px_rgba(0,0,0,0.06)] group-hover:scale-105 group-hover:shadow-[0_6px_18px_rgba(0,0,0,0.1)] transition-all duration-300">
                  <svg className="w-3.5 h-3.5 text-[#2C3E28] translate-x-0.5 fill-current" viewBox="0 0 24 24">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </span>
                <span>{isVi ? "Xem Bản Demo" : "Watch Demo"}</span>
              </button>
            </div>

            {/* Social Proof (Overlapping Avatars) */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2.5">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
                  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Creator"
                    className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-xs"
                  />
                ))}
              </div>
              <p className="text-[11.5px] sm:text-xs text-[#52604F] font-medium">
                {isVi ? (
                  <>
                    Cùng hơn <strong className="font-bold text-[#1F2B1C]">10.000+ nhà sáng tạo</strong> nâng tầm phong cách
                  </>
                ) : (
                  <>
                    Join <strong className="font-bold text-[#1F2B1C]">10K+ creators</strong> exploring their style
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Bottom Handwritten Signature */}
          <div className="pt-2">
            <p className="font-handwriting text-xl sm:text-2xl text-[#6D7D68] italic select-none">
              “ {isVi ? "Phong cách khởi nguồn từ chính bạn." : "Style lives in you."} ”
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
                src="/hero/hero2_stage_bg_2x.jpg"
                alt="Demo Preview"
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#688A58]/90 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2 w-max">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  3D AI Fitting Engine v2.4
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
                  <span className="font-display text-xs font-black text-[#688A58]">{item.step}</span>
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
                href="/try-on"
                className="rounded-full bg-[#688A58] hover:bg-[#567547] text-white px-5 py-2.5 text-xs font-bold tracking-wide shadow-md transition-all hover:scale-[1.02]"
              >
                {isVi ? "Mở Phòng Thử Đồ Ngay →" : "Launch 3D Studio Now →"}
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
              <svg className="w-5 h-5 text-[#688A58]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
