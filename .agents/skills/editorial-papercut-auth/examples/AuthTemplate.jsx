import React, { useState } from "react";

/**
 * EditorialPaperCutAuthTemplate
 *
 * A luxury dual-surface editorial login & signup template.
 * - Desktop: Left minimal form canvas (54%) + Right tactile paper-cut art reveal (46%)
 * - Mobile: Frosted glass floating panel over full-bleed paper-cut background
 * - Zero-scroll viewport locking (100dvh)
 * - Brand color customizable via BRAND_COLOR config
 */

// Customizable Brand Theme Tokens
const THEME = {
  brandName: "BRAND",
  logoUrl: "/logo-web.png",
  papercutArtUrl: "/hero/fashion_tech_papercut.jpg",
  ambientBgUrl: "/hero/fashion_ambient_bg.jpg",
  accentHex: "#B3D07E",
  accentHoverHex: "#A3C46C",
  accentDarkTextHex: "#162912",
  accentLinkHex: "#6F9535",
};

export default function EditorialPaperCutAuthTemplate({
  initialMode = "login", // "login" | "signup"
  onLoginSubmit = async (data) => console.log("Login:", data),
  onSignupSubmit = async (data) => console.log("Signup:", data),
}) {
  const [isRegister, setIsRegister] = useState(initialMode === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "error" | "success"
  const [message, setMessage] = useState("");
  const [lang, setLang] = useState("vi"); // "vi" | "en"

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user", // "user" | "business"
  });

  const isVi = lang === "vi";

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (status === "error") setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      if (isRegister) {
        await onSignupSubmit(form);
      } else {
        await onLoginSubmit({ email: form.email, password: form.password });
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setMessage(err?.message || (isVi ? "Có lỗi xảy ra, vui lòng thử lại." : "An error occurred."));
    }
  };

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#F4F1EC] text-[#2C3E2D] font-sans antialiased selection:bg-[#B3D07E]/30">
      {/* 1. Ambient Background Layer */}
      <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
        <img
          src={THEME.ambientBgUrl}
          alt="Ambient Background"
          className="h-full w-full object-cover blur-[2px] opacity-75"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/80 via-[#F3EFE9]/70 to-[#EAE4DB]/85 backdrop-blur-[2px]" />
      </div>

      {/* 2. Compact Header Navigation */}
      <header className="relative z-30 flex w-full shrink-0 items-center justify-between px-6 py-2.5 sm:px-10 sm:py-3 lg:px-16 lg:py-3.5">
        <a
          href="/"
          className="group inline-flex items-center gap-2.5 rounded-full border border-white/80 bg-white/70 px-4 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:bg-white/95 hover:scale-102"
        >
          <svg
            className="h-4 w-4 text-[#3A5236] transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <img
            src={THEME.logoUrl}
            alt={THEME.brandName}
            className="h-5 w-5 rounded-full object-contain shadow-xs"
          />
          <span className="font-display text-xs font-black uppercase tracking-[0.24em] text-[#1E2D1F]">
            {THEME.brandName}
          </span>
        </a>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={() => setLang((l) => (l === "vi" ? "en" : "vi"))}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#2C3E2D] shadow-xs backdrop-blur-md transition-all hover:bg-white"
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: THEME.accentHex }} />
          {isVi ? "VI" : "EN"}
        </button>
      </header>

      {/* 3. Main Center Canvas */}
      <main className="relative z-20 flex flex-1 w-full items-center justify-center px-4 py-1 sm:py-2 overflow-hidden">
        {/* DESKTOP VIEW (lg+): Dual Split Card */}
        <div className="hidden lg:flex w-full max-w-[960px] xl:max-w-[1000px] max-h-[calc(100dvh-88px)] rounded-[32px] bg-white shadow-[0_24px_70px_-15px_rgba(25,35,25,0.18)] border border-white/90 overflow-hidden items-stretch transition-all duration-500">
          {/* Left Form Surface (54%) */}
          <div className="w-[54%] px-8 py-5 xl:px-10 xl:py-7 flex flex-col justify-center overflow-y-auto">
            {/* Logo + Brand Name */}
            <div className="mb-3 flex items-center gap-2.5">
              <img
                src={THEME.logoUrl}
                alt={THEME.brandName}
                className="h-7 w-7 rounded-full object-contain shadow-xs"
              />
              <span className="font-display text-2xl font-black uppercase tracking-[0.28em] text-[#1C2A1B]">
                {THEME.brandName}
              </span>
            </div>

            {/* Editorial Title */}
            <h1
              className="font-display text-2xl xl:text-[26px] font-bold tracking-tight leading-tight"
              style={{ color: THEME.accentHex }}
            >
              {isRegister
                ? isVi
                  ? "Tạo tài khoản"
                  : "Create account"
                : isVi
                ? "Chào mừng trở lại"
                : "Welcome back"}
            </h1>

            {/* Subtitle */}
            <p className="mt-0.5 text-xs xl:text-[13px] text-[#5A6D58] font-medium leading-relaxed">
              {isRegister
                ? isVi
                  ? "Đăng ký thành viên để bắt đầu trải nghiệm cá nhân hóa"
                  : "Sign up to begin your personalized journey"
                : isVi
                ? "Đăng nhập để tiếp tục phiên làm việc của bạn"
                : "Sign in to access your curated dashboard"}
            </p>

            {/* Role Switcher (Sign Up Mode) */}
            {isRegister && (
              <div className="mt-3 flex items-center justify-center rounded-full bg-[#F3EFE9] p-1 border border-[#E2DDD5]">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: "user" }))}
                  className={`flex-1 rounded-full py-1.5 font-display text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                    form.role === "user"
                      ? "text-white shadow-xs"
                      : "text-[#5A6D58] hover:text-[#1C2A1B]"
                  }`}
                  style={form.role === "user" ? { backgroundColor: THEME.accentHex } : {}}
                >
                  {isVi ? "Khách hàng" : "Client"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: "business" }))}
                  className={`flex-1 rounded-full py-1.5 font-display text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                    form.role === "business"
                      ? "text-white shadow-xs"
                      : "text-[#5A6D58] hover:text-[#1C2A1B]"
                  }`}
                  style={form.role === "business" ? { backgroundColor: THEME.accentHex } : {}}
                >
                  {isVi ? "Doanh nghiệp" : "Business"}
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-3.5 space-y-2.5 xl:space-y-3 text-left">
              {isRegister && (
                <div>
                  <label className="block font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A5D48] mb-1 ml-3">
                    {isVi ? "Họ và tên" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={updateField("name")}
                    placeholder={isVi ? "Nhập họ và tên..." : "e.g. Eleanor Vance"}
                    className="w-full rounded-full border border-[#D8DFD5] bg-[#FAF9F7] px-5 py-2 text-xs xl:text-sm text-[#1C2A1B] placeholder-[#8A9B87] transition-all focus:bg-white focus:outline-none focus:ring-2 shadow-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A5D48] mb-1 ml-3">
                  {isVi ? "Email" : "Email"}
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={updateField("email")}
                  placeholder="name@example.com"
                  className="w-full rounded-full border border-[#D8DFD5] bg-[#FAF9F7] px-5 py-2 text-xs xl:text-sm text-[#1C2A1B] placeholder-[#8A9B87] transition-all focus:bg-white focus:outline-none focus:ring-2 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A5D48] mb-1 ml-3">
                  {isVi ? "Mật khẩu" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={updateField("password")}
                    placeholder="••••••••"
                    className="w-full rounded-full border border-[#D8DFD5] bg-[#FAF9F7] px-5 py-2 pr-12 text-xs xl:text-sm text-[#1C2A1B] placeholder-[#8A9B87] transition-all focus:bg-white focus:outline-none focus:ring-2 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#688065] hover:text-[#1C2A1B] transition-colors p-1"
                  >
                    {showPassword ? "✕" : "👁"}
                  </button>
                </div>
              </div>

              {/* Status Alert */}
              {message && (
                <div
                  className={`rounded-2xl border px-4 py-2 font-sans text-xs leading-tight transition-all ${
                    status === "error"
                      ? "border-[#E7B8B8] bg-[#FDF1F1] text-[#9A3838]"
                      : "border-green-300 bg-green-50 text-green-800"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Primary Submit Button: White text with drop-shadow */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full text-white py-2.5 xl:py-3 px-6 font-display text-xs xl:text-sm font-extrabold tracking-wider uppercase shadow-[0_8px_22px_rgba(179,208,126,0.45)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: THEME.accentHex }}
              >
                {status === "loading"
                  ? isVi
                    ? "Đang xử lý..."
                    : "Processing..."
                  : isRegister
                  ? isVi
                    ? "Tạo Tài Khoản"
                    : "Create Account"
                  : isVi
                  ? "Đăng Nhập"
                  : "Log in"}
              </button>
            </form>

            {/* Switching Login / Register */}
            <div className="mt-3.5 text-center">
              <p className="font-sans text-xs xl:text-[13px] text-[#556952]">
                {isRegister
                  ? isVi
                    ? "Đã có tài khoản?"
                    : "Already have an account?"
                  : isVi
                  ? "Chưa có tài khoản?"
                  : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="font-bold underline-offset-3 hover:underline transition-colors"
                  style={{ color: THEME.accentLinkHex }}
                >
                  {isRegister
                    ? isVi
                      ? "Đăng nhập ngay"
                      : "Log in"
                    : isVi
                    ? "Đăng ký tại đây"
                    : "Sign up"}
                </button>
              </p>
            </div>
          </div>

          {/* Right Paper-Cut Reveal (46%) */}
          <div className="w-[46%] relative bg-[#132A1C] overflow-hidden select-none flex items-center justify-center">
            <img
              src={THEME.papercutArtUrl}
              alt="Paper-Cut Artwork"
              className="h-full w-full object-cover object-left"
              draggable={false}
            />
          </div>
        </div>

        {/* MOBILE VIEW (<lg): Floating Frosted Glass Card */}
        <div className="lg:hidden relative w-full max-w-[400px] max-h-[calc(100dvh-76px)] rounded-[28px] overflow-hidden shadow-[0_24px_60px_rgba(15,25,15,0.22)] p-3 sm:p-5 flex items-center justify-center">
          <img
            src={THEME.papercutArtUrl}
            alt="Paper-Cut Background"
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/15" />

          {/* Floating Frosted Panel */}
          <div className="relative z-10 w-full max-h-full overflow-y-auto rounded-[24px] bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.18)] p-5 sm:p-6 flex flex-col text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <img
                src={THEME.logoUrl}
                alt={THEME.brandName}
                className="h-6 w-6 rounded-full object-contain shadow-xs"
              />
              <span className="font-display text-xl font-black uppercase tracking-[0.26em] text-[#1C2A1B]">
                {THEME.brandName}
              </span>
            </div>

            <h1
              className="font-display text-2xl font-bold tracking-tight leading-tight"
              style={{ color: THEME.accentHex }}
            >
              {isRegister ? (isVi ? "Tạo tài khoản" : "Create account") : isVi ? "Chào mừng trở lại" : "Welcome back"}
            </h1>

            {/* Mobile Form */}
            <form onSubmit={handleSubmit} className="mt-3 space-y-2.5 text-left">
              {isRegister && (
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={updateField("name")}
                  placeholder={isVi ? "Họ và tên..." : "Full name..."}
                  className="w-full rounded-full border border-white/90 bg-white/70 px-4 py-2 text-xs text-[#1C2A1B] placeholder-[#788C74] backdrop-blur-md focus:bg-white shadow-xs"
                />
              )}
              <input
                type="email"
                required
                value={form.email}
                onChange={updateField("email")}
                placeholder="name@example.com"
                className="w-full rounded-full border border-white/90 bg-white/70 px-4 py-2 text-xs text-[#1C2A1B] placeholder-[#788C74] backdrop-blur-md focus:bg-white shadow-xs"
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={updateField("password")}
                placeholder="••••••••"
                className="w-full rounded-full border border-white/90 bg-white/70 px-4 py-2 text-xs text-[#1C2A1B] placeholder-[#788C74] backdrop-blur-md focus:bg-white shadow-xs"
              />

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full text-white py-2.5 px-5 font-display text-xs font-extrabold tracking-wider uppercase shadow-[0_6px_18px_rgba(179,208,126,0.45)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-all"
                style={{ backgroundColor: THEME.accentHex }}
              >
                {status === "loading"
                  ? isVi
                    ? "Đang xử lý..."
                    : "Processing..."
                  : isRegister
                  ? isVi
                    ? "Tạo Tài Khoản"
                    : "Create Account"
                  : isVi
                  ? "Đăng Nhập"
                  : "Log in"}
              </button>
            </form>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="font-bold underline-offset-3 hover:underline text-xs"
                style={{ color: THEME.accentLinkHex }}
              >
                {isRegister
                  ? isVi
                    ? "Đã có tài khoản? Đăng nhập"
                    : "Have an account? Log in"
                  : isVi
                  ? "Chưa có tài khoản? Đăng ký"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
