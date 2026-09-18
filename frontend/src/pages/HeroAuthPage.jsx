import { useState } from "react";
import { loginAdmin, setAdminToken } from "../api/adminApi.js";
import { loginShopOwner, registerShopOwner, setShopToken } from "../api/shopApi.js";
import { loginUser, registerUser, setUserToken } from "../api/userApi.js";
import PasswordResetModal from "../components/PasswordResetModal.jsx";
import { useLanguage } from "../i18n.jsx";

const resetAllTokens = () => {
  setAdminToken("");
  setShopToken("");
  setUserToken("");
};

const loginAnyRole = async ({ email, password }) => {
  const payload = { email, password };
  let shopStatusError = null;

  try {
    const response = await loginAdmin(payload);
    resetAllTokens();
    setAdminToken(response.token);
    window.location.href = "/admin/dashboard";
    return;
  } catch (_error) {
    // try next
  }

  try {
    const response = await loginUser(payload);
    resetAllTokens();
    setUserToken(response.token);
    const returnTo = sessionStorage.getItem("miroir_after_login");
    sessionStorage.removeItem("miroir_after_login");
    window.location.href =
      response.user.profileCompleted || response.user.profileSkipped
        ? returnTo || "/app"
        : "/onboarding/profile";
    return;
  } catch (_error) {
    // try next
  }

  try {
    const response = await loginShopOwner(payload);
    resetAllTokens();
    setShopToken(response.token);
    window.location.href = "/shop/dashboard";
    return;
  } catch (error) {
    if (error.response?.status === 403) shopStatusError = error;
  }

  if (shopStatusError) throw shopStatusError;

  const error = new Error("Invalid email or password.");
  error.response = { data: { message: "Invalid email or password." } };
  throw error;
};

export default function HeroAuthPage({ mode = "login" }) {
  const { language, setLanguage, t } = useLanguage();
  const isVi = language === "vi";

  const [isRegister, setIsRegister] = useState(mode === "signup" || mode === "register");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const toggleMode = (targetRegister) => {
    setIsRegister(targetRegister);
    setMessage("");
    setStatus("idle");
    window.history.replaceState(null, "", targetRegister ? "/hero/signup" : "/hero/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      if (!isRegister) {
        await loginAnyRole({ email: form.email, password: form.password });
        return;
      }

      if (form.role === "shop") {
        const response = await registerShopOwner(form);
        setStatus("success");
        setMessage(response.message || (isVi ? "Tài khoản chủ shop đang chờ phê duyệt." : "Shop account pending approval."));
        return;
      }

      const response = await registerUser(form);
      setUserToken(response.token);
      const returnTo = sessionStorage.getItem("miroir_after_login");
      sessionStorage.removeItem("miroir_after_login");
      window.location.href =
        response.user.profileCompleted || response.user.profileSkipped
          ? returnTo || "/app"
          : "/onboarding/profile";
    } catch (error) {
      setStatus("error");
      const errorMsg =
        error.response?.data?.message ||
        (isRegister
          ? isVi
            ? "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin."
            : "Sign up failed. Please check your details."
          : isVi
          ? "Email hoặc mật khẩu không chính xác."
          : "Invalid email or password.");
      setMessage(errorMsg);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-between overflow-x-hidden bg-[#F4F1EC] text-[#2C3E2D] font-sans antialiased selection:bg-[#B8CDAE] selection:text-[#1F2C20]">
      {/* ============================================================ */}
      {/* 1. Ambient Fashion Studio Drapery Background                 */}
      {/* ============================================================ */}
      <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
        <img
          src="/hero/fashion_ambient_bg.jpg"
          alt="Fashion Studio Ambient"
          className="h-full w-full object-cover blur-[2px] opacity-75"
          draggable={false}
        />
        {/* Soft luminous gradient overlay for luxury contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/80 via-[#F3EFE9]/70 to-[#EAE4DB]/85 backdrop-blur-[2px]" />
      </div>

      {/* ============================================================ */}
      {/* 2. Top Header Navigation (Brand Pill + Language Switcher)    */}
      {/* ============================================================ */}
      <header className="relative z-30 flex w-full items-center justify-between px-6 py-4 sm:px-12 sm:py-6 lg:px-20 lg:py-6">
        <a
          href="/hero"
          className="group inline-flex items-center gap-2.5 rounded-full border border-white/80 bg-white/70 px-4 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:border-[#94B16F] hover:bg-white/95 hover:shadow-[0_4px_20px_rgba(148,177,111,0.2)] hover:scale-102"
        >
          <svg
            className="h-4 w-4 text-[#3A5236] transition-transform duration-300 group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <img
            src="/logo-web.png"
            alt="Miroir Logo"
            className="h-5 w-5 rounded-full object-contain shadow-xs"
          />
          <span className="font-display text-xs font-black uppercase tracking-[0.24em] text-[#1E2D1F]">
            MIROIR
          </span>
        </a>

        {/* Right Nav Pill with Language Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#2C3E2D] shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-200 hover:bg-white/95 hover:border-[#94B16F]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#7CA463]" />
            {language === "vi" ? "VI" : "EN"}
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 3. Main Showcase Canvas (Desktop Dual-Card & Mobile Glass)   */}
      {/* ============================================================ */}
      <main className="relative z-20 flex flex-1 w-full items-center justify-center px-4 py-4 sm:py-6 lg:py-8">
        {/* DESKTOP PRESENTATION (lg and up): Split Card with White Form on Left and Layered Paper-Cut on Right */}
        <div className="hidden lg:flex w-full max-w-[960px] xl:max-w-[1020px] rounded-[36px] bg-white shadow-[0_30px_80px_-20px_rgba(25,35,25,0.18),0_12px_30px_-5px_rgba(0,0,0,0.06)] border border-white/90 overflow-hidden items-stretch transition-all duration-500">
          {/* Left Side: Minimal White MIROIR Form Surface */}
          <div className="w-[54%] p-10 xl:p-14 flex flex-col justify-center">
            {/* Miroir Brand Wordmark */}
            <div className="mb-5">
              <span className="font-display text-2xl font-black uppercase tracking-[0.28em] text-[#1C2A1B]">
                MIROIR
              </span>
            </div>

            {/* Editorial Heading */}
            <h1 className="font-display text-[26px] xl:text-[28px] font-bold tracking-tight text-[#1C2A1B] leading-tight">
              {isRegister
                ? isVi
                  ? "Tạo tài khoản"
                  : "Create account"
                : isVi
                ? "Chào mừng trở lại"
                : "Log in"}
            </h1>

            {/* Subtitle */}
            <p className="mt-1 text-xs xl:text-[13px] text-[#5A6D58] font-medium leading-relaxed">
              {isRegister
                ? isVi
                  ? "Khám phá kiến trúc may đo số hóa tương thích vóc dáng"
                  : "Explore bespoke silhouettes tailored to your shape"
                : isVi
                ? "Đăng nhập để tiếp tục trải nghiệm may đo cá nhân"
                : "Sign in to continue your curated fitting journey"}
            </p>

            {/* Role Switcher in Register Mode */}
            {isRegister && (
              <div className="mt-4 flex items-center justify-center rounded-full bg-[#F3EFE9] p-1 border border-[#E2DDD5]">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: "user" }))}
                  className={`flex-1 rounded-full py-1.5 font-display text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                    form.role === "user"
                      ? "bg-white text-[#1C2A1B] shadow-xs"
                      : "text-[#5A6D58] hover:text-[#1C2A1B]"
                  }`}
                >
                  {isVi ? "Khách hàng" : "Client"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: "shop" }))}
                  className={`flex-1 rounded-full py-1.5 font-display text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                    form.role === "shop"
                      ? "bg-white text-[#1C2A1B] shadow-xs"
                      : "text-[#5A6D58] hover:text-[#1C2A1B]"
                  }`}
                >
                  {isVi ? "Chủ Shop" : "Shop Owner"}
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-left">
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
                    className="w-full rounded-full border border-[#D8DFD5] bg-[#FAF9F7] px-5 py-2.5 text-xs xl:text-sm text-[#1C2A1B] placeholder-[#8A9B87] transition-all duration-200 focus:border-[#557845] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#557845]/20 shadow-xs"
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
                  className="w-full rounded-full border border-[#D8DFD5] bg-[#FAF9F7] px-5 py-2.5 text-xs xl:text-sm text-[#1C2A1B] placeholder-[#8A9B87] transition-all duration-200 focus:border-[#557845] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#557845]/20 shadow-xs"
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
                    className="w-full rounded-full border border-[#D8DFD5] bg-[#FAF9F7] px-5 py-2.5 pr-12 text-xs xl:text-sm text-[#1C2A1B] placeholder-[#8A9B87] transition-all duration-200 focus:border-[#557845] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#557845]/20 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#688065] hover:text-[#1C2A1B] transition-colors p-1"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Row */}
              {!isRegister && (
                <div className="flex items-center justify-between px-2 pt-0.5">
                  <span className="font-sans text-[11px] text-[#637760]">
                    {isVi ? "Bảo mật tài khoản" : "Secure session"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="font-sans text-xs font-bold text-[#4B6B38] hover:text-[#233A1C] transition-colors"
                  >
                    {isVi ? "Quên mật khẩu?" : "Forgot password?"}
                  </button>
                </div>
              )}

              {/* Status/Error Message */}
              {message && (
                <div
                  className={`rounded-2xl border px-4 py-2 font-sans text-xs leading-tight transition-all ${
                    status === "error"
                      ? "border-[#E7B8B8] bg-[#FDF1F1] text-[#9A3838]"
                      : "border-[#C5DDBB] bg-[#F2F8EE] text-[#3D6334]"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Primary Submit Button: Muted Sage Green */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-[#527744] hover:bg-[#436436] active:scale-[0.99] text-white py-3 px-6 font-display text-xs xl:text-sm font-bold tracking-wider uppercase shadow-[0_8px_20px_rgba(82,119,68,0.3)] hover:shadow-[0_12px_28px_rgba(82,119,68,0.4)] transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{isVi ? "Đang xử lý..." : "Processing..."}</span>
                  </span>
                ) : (
                  <span>
                    {isRegister
                      ? isVi
                        ? "Tạo Tài Khoản"
                        : "Create Account"
                      : isVi
                      ? "Đăng Nhập"
                      : "Log in"}
                  </span>
                )}
              </button>
            </form>

            {/* Switching between Sign In / Sign Up */}
            <div className="mt-5 text-center">
              <p className="font-sans text-xs xl:text-[13px] text-[#556952]">
                {isRegister
                  ? isVi
                    ? "Đã có tài khoản Miroir?"
                    : "Already have an account?"
                  : isVi
                  ? "Chưa có tài khoản Miroir?"
                  : "Don't have an account yet?"}{" "}
                <button
                  type="button"
                  onClick={() => toggleMode(!isRegister)}
                  className="font-bold text-[#3B5B2C] hover:text-[#1F3315] underline-offset-3 hover:underline transition-colors"
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

          {/* Right Side: Organic Layered Paper-Cut Fashion-Tech Visual World */}
          <div className="w-[46%] relative bg-[#132A1C] overflow-hidden select-none flex items-center justify-center">
            <img
              src="/hero/fashion_tech_papercut.jpg"
              alt="Miroir Fashion-Tech Schematics and Papercut Art"
              className="h-full w-full object-cover object-left"
              draggable={false}
            />
          </div>
        </div>

        {/* MOBILE / TABLET PRESENTATION (< lg): Frosted Glass Floating Panel over Fashion-Tech Papercut */}
        <div className="lg:hidden relative w-full max-w-[420px] rounded-[32px] overflow-hidden shadow-[0_24px_60px_rgba(15,25,15,0.22)] p-4 sm:p-6 flex items-center justify-center min-h-[580px]">
          {/* Background: Fashion-Tech Paper-Cut Artwork */}
          <img
            src="/hero/fashion_tech_papercut.jpg"
            alt="Miroir Fashion-Tech"
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable={false}
          />
          {/* Subtle dark tint to enhance glass readability */}
          <div className="absolute inset-0 bg-black/15" />

          {/* Frosted Glass Floating Login Panel */}
          <div className="relative z-10 w-full rounded-[26px] bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.95)] p-6 sm:p-7 flex flex-col text-center">
            {/* Miroir Brand Wordmark */}
            <div className="mb-2">
              <span className="font-display text-xl font-black uppercase tracking-[0.26em] text-[#1C2A1B]">
                MIROIR
              </span>
            </div>

            {/* Editorial Heading */}
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#1C2A1B] leading-tight">
              {isRegister
                ? isVi
                  ? "Tạo tài khoản"
                  : "Create account"
                : isVi
                ? "Chào mừng trở lại"
                : "Log in"}
            </h1>

            {/* Subtitle */}
            <p className="mt-1 text-xs text-[#4F644C] font-medium">
              {isRegister
                ? isVi
                  ? "Khám phá may đo cá nhân hóa"
                  : "Explore bespoke silhouettes"
                : isVi
                ? "Đăng nhập để tiếp tục trải nghiệm"
                : "Sign in to continue your journey"}
            </p>

            {/* Role Switcher in Register Mode */}
            {isRegister && (
              <div className="mt-3.5 flex items-center justify-center rounded-full bg-white/60 p-1 border border-white/80 shadow-xs">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: "user" }))}
                  className={`flex-1 rounded-full py-1 font-display text-[10.5px] font-bold uppercase tracking-wider transition-all ${
                    form.role === "user"
                      ? "bg-[#527744] text-white shadow-xs"
                      : "text-[#4F644C] hover:text-[#1C2A1B]"
                  }`}
                >
                  {isVi ? "Khách hàng" : "Client"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: "shop" }))}
                  className={`flex-1 rounded-full py-1 font-display text-[10.5px] font-bold uppercase tracking-wider transition-all ${
                    form.role === "shop"
                      ? "bg-[#527744] text-white shadow-xs"
                      : "text-[#4F644C] hover:text-[#1C2A1B]"
                  }`}
                >
                  {isVi ? "Chủ Shop" : "Shop Owner"}
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-left">
              {isRegister && (
                <div>
                  <label className="block font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#3D5239] mb-1 ml-3">
                    {isVi ? "Họ và tên" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={updateField("name")}
                    placeholder={isVi ? "Nhập họ và tên..." : "e.g. Eleanor Vance"}
                    className="w-full rounded-full border border-white/90 bg-white/70 px-4 py-2.5 text-xs text-[#1C2A1B] placeholder-[#788C74] backdrop-blur-md transition-all focus:border-[#527744] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#527744]/20 shadow-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#3D5239] mb-1 ml-3">
                  {isVi ? "Email" : "Email"}
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={updateField("email")}
                  placeholder="name@example.com"
                  className="w-full rounded-full border border-white/90 bg-white/70 px-4 py-2.5 text-xs text-[#1C2A1B] placeholder-[#788C74] backdrop-blur-md transition-all focus:border-[#527744] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#527744]/20 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#3D5239] mb-1 ml-3">
                  {isVi ? "Mật khẩu" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={updateField("password")}
                    placeholder="••••••••"
                    className="w-full rounded-full border border-white/90 bg-white/70 px-4 py-2.5 pr-11 text-xs text-[#1C2A1B] placeholder-[#788C74] backdrop-blur-md transition-all focus:border-[#527744] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#527744]/20 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5E765A] hover:text-[#1C2A1B] transition-colors p-1"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Row */}
              {!isRegister && (
                <div className="flex items-center justify-between px-2 pt-0.5">
                  <span className="font-sans text-[10.5px] text-[#556952]">
                    {isVi ? "Bảo mật tài khoản" : "Secure session"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="font-sans text-[11px] font-bold text-[#4B6B38] hover:text-[#233A1C] transition-colors"
                  >
                    {isVi ? "Quên mật khẩu?" : "Forgot password?"}
                  </button>
                </div>
              )}

              {/* Status/Error Message */}
              {message && (
                <div
                  className={`rounded-2xl border px-3.5 py-2 font-sans text-xs leading-tight transition-all ${
                    status === "error"
                      ? "border-[#E7B8B8] bg-[#FDF1F1] text-[#9A3838]"
                      : "border-[#C5DDBB] bg-[#F2F8EE] text-[#3D6334]"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-[#527744] hover:bg-[#436436] active:scale-[0.99] text-white py-2.5 px-5 font-display text-xs font-bold tracking-wider uppercase shadow-[0_6px_18px_rgba(82,119,68,0.35)] transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{isVi ? "Đang xử lý..." : "Processing..."}</span>
                  </span>
                ) : (
                  <span>
                    {isRegister
                      ? isVi
                        ? "Tạo Tài Khoản"
                        : "Create Account"
                      : isVi
                      ? "Đăng Nhập"
                      : "Log in"}
                  </span>
                )}
              </button>
            </form>

            {/* Switching between Sign In / Sign Up */}
            <div className="mt-4 text-center">
              <p className="font-sans text-xs text-[#556952]">
                {isRegister
                  ? isVi
                    ? "Đã có tài khoản?"
                    : "Already have an account?"
                  : isVi
                  ? "Chưa có tài khoản?"
                  : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => toggleMode(!isRegister)}
                  className="font-bold text-[#2A4B20] hover:text-[#172F10] underline-offset-3 hover:underline transition-colors"
                >
                  {isRegister
                    ? isVi
                      ? "Đăng nhập"
                      : "Log in"
                    : isVi
                    ? "Đăng ký"
                    : "Sign up"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 4. Bottom Footer Note                                        */}
      {/* ============================================================ */}
      <footer className="relative z-30 w-full py-3 text-center pointer-events-none">
        <p className="font-display text-[10.5px] uppercase tracking-[0.24em] text-[#5D6F5B] font-bold">
          {isVi
            ? "TÔN VINH VÓC DÁNG • TỰ DO PHONG CÁCH"
            : "FIT YOUR SHAPE • FREE YOUR STYLE"}
        </p>
      </footer>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <PasswordResetModal
          accountType="user"
          onClose={() => setShowPasswordReset(false)}
        />
      )}
    </div>
  );
}
