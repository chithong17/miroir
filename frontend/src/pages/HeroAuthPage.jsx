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
    <div className="relative flex min-h-[100dvh] max-h-[100dvh] h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#F3EFE9] text-[#2C3E2D] font-sans antialiased selection:bg-[#B8CDAE] selection:text-[#1F2C20]">
      {/* ============================================================ */}
      {/* 1. Knitted Arch Room Background Artwork                      */}
      {/* ============================================================ */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
        <img
          src="/hero/hero_auth_bg.jpg"
          alt="Miroir Knitted Arch Sanctuary"
          className="h-full w-full object-cover object-[50%_35%] sm:object-[50%_37%]"
          draggable={false}
        />
        {/* Subtle ambient lighting layer to blend card into knitted fabric */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/20 via-transparent to-[#334232]/10" />
      </div>

      {/* ============================================================ */}
      {/* 2. Top Header Navigation (Miroir Pill + Language Switcher)   */}
      {/* ============================================================ */}
      <header className="relative z-20 flex w-full items-center justify-between px-6 py-4 sm:px-12 sm:py-6 lg:px-20 lg:py-6">
        <a
          href="/hero"
          className="group inline-flex items-center gap-2.5 rounded-full border border-white/50 bg-white/20 px-4 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.04),inset_0_1px_1.5px_0_rgba(255,255,255,0.8)] backdrop-blur-[2px] transition-all duration-300 hover:border-white/80 hover:bg-white/40 hover:scale-102"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/20 px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#2C3E2D] shadow-[0_4px_20px_rgba(0,0,0,0.04),inset_0_1px_1.5px_0_rgba(255,255,255,0.8)] backdrop-blur-[2px] transition-all duration-200 hover:bg-white/40 hover:border-white/80"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#7CA463]" />
            {language === "vi" ? "VI" : "EN"}
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 3. Central Arch Card Area (Safely Centered Inside the Arch)   */}
      {/* ============================================================ */}
      <main className="relative z-20 flex flex-1 w-full items-center justify-center px-4 py-2 sm:py-3">
        {/*
          Anchor container:
          Centered horizontally & vertically inside the large knitted arch.
          On desktop: occupies roughly 35-45% of the arch width (max-w-[400px]).
          On tablet: occupies 50-60% of the arch width.
          On mobile: scaled down to safely fit inside the arch boundaries.
        */}
        <div className="w-full max-w-[370px] sm:max-w-[395px] transform -translate-y-2 sm:-translate-y-4 md:-translate-y-6 transition-all duration-300">
          <div className="relative flex flex-col items-center text-center w-full">
            {/* Subtle Atelier Tag with Ultra-Clear Frosted Glass Pill */}
            <div className="mb-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/[0.04] px-4 py-1.5 font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#243522] shadow-[0_4px_16px_0_rgba(0,0,0,0.03),inset_0_1px_1.5px_0_rgba(255,255,255,0.8)] backdrop-blur-[1.5px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7CA463] animate-pulse" />
                {isVi ? "Không Gian May Đo Số Hóa" : "Digital Atelier Sanctuary"}
              </span>
            </div>

            {/* Editorial Heading */}
            <h1 className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-[#1C2A1B] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] leading-tight">
              {isRegister
                ? isVi
                  ? "Tạo tài khoản"
                  : "Create account"
                : isVi
                ? "Chào mừng trở lại"
                : "Welcome back"}
            </h1>

            {/* Supporting Text */}
            <p className="mt-1 text-center font-sans text-xs sm:text-[13px] font-medium text-[#465E41] drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)] max-w-[320px]">
              {isRegister
                ? isVi
                  ? "Khám phá kiến trúc trang phục tương thích vóc dáng"
                  : "Explore bespoke silhouettes tailored to your shape"
                : isVi
                ? "Đăng nhập để tiếp tục trải nghiệm may đo cá nhân"
                : "Sign in to continue your curated fitting journey"}
            </p>

            {/* Role Toggle for Register Mode - High Transparency Glass Pill */}
            {isRegister && (
              <div className="mt-3.5 w-full flex items-center justify-center rounded-full bg-white/[0.04] p-1 border border-white/40 backdrop-blur-[1.5px] shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.7)]">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: "user" }))}
                  className={`flex-1 rounded-full py-1.5 font-display text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    form.role === "user"
                      ? "bg-white/35 text-[#1C2A1B] shadow-xs border border-white/70 backdrop-blur-[3px]"
                      : "text-[#486341] hover:text-[#1C2A1B]"
                  }`}
                >
                  {isVi ? "Khách hàng" : "Client"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: "shop" }))}
                  className={`flex-1 rounded-full py-1.5 font-display text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    form.role === "shop"
                      ? "bg-white/35 text-[#1C2A1B] shadow-xs border border-white/70 backdrop-blur-[3px]"
                      : "text-[#486341] hover:text-[#1C2A1B]"
                  }`}
                >
                  {isVi ? "Chủ Shop" : "Shop Owner"}
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 w-full space-y-3 text-left">
              {isRegister && (
                <div>
                  <label className="block font-display text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#33482F] mb-1 ml-3 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                    {isVi ? "Họ và tên" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={updateField("name")}
                    placeholder={isVi ? "Nhập họ và tên..." : "e.g. Eleanor Vance"}
                    className="w-full rounded-full border border-white/50 bg-white/[0.03] hover:bg-white/[0.08] focus:bg-white/[0.12] px-5 py-2.5 sm:py-3 font-sans text-xs sm:text-sm text-[#1C2A1B] placeholder-[#667E63] backdrop-blur-[1.5px] transition-all duration-300 focus:border-white focus:outline-none focus:ring-2 focus:ring-[#7CA463]/30 shadow-[0_2px_12px_0_rgba(0,0,0,0.03),inset_0_1px_1.5px_0_rgba(255,255,255,0.75),inset_0_-1px_1px_0_rgba(255,255,255,0.2)]"
                  />
                </div>
              )}

              <div>
                <label className="block font-display text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#33482F] mb-1 ml-3 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={updateField("email")}
                  placeholder="name@example.com"
                  className="w-full rounded-full border border-white/50 bg-white/[0.03] hover:bg-white/[0.08] focus:bg-white/[0.12] px-5 py-2.5 sm:py-3 font-sans text-xs sm:text-sm text-[#1C2A1B] placeholder-[#667E63] backdrop-blur-[1.5px] transition-all duration-300 focus:border-white focus:outline-none focus:ring-2 focus:ring-[#7CA463]/30 shadow-[0_2px_12px_0_rgba(0,0,0,0.03),inset_0_1px_1.5px_0_rgba(255,255,255,0.75),inset_0_-1px_1px_0_rgba(255,255,255,0.2)]"
                />
              </div>

              <div>
                <label className="block font-display text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#33482F] mb-1 ml-3 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                  {isVi ? "Mật khẩu" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={updateField("password")}
                    placeholder="••••••••"
                    className="w-full rounded-full border border-white/50 bg-white/[0.03] hover:bg-white/[0.08] focus:bg-white/[0.12] px-5 py-2.5 sm:py-3 pr-12 font-sans text-xs sm:text-sm text-[#1C2A1B] placeholder-[#667E63] backdrop-blur-[1.5px] transition-all duration-300 focus:border-white focus:outline-none focus:ring-2 focus:ring-[#7CA463]/30 shadow-[0_2px_12px_0_rgba(0,0,0,0.03),inset_0_1px_1.5px_0_rgba(255,255,255,0.75),inset_0_-1px_1px_0_rgba(255,255,255,0.2)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5E7959] hover:text-[#1C2A1B] transition-colors p-1"
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

              {/* Forgot Password Row for Login Mode */}
              {!isRegister && (
                <div className="flex items-center justify-between px-2 pt-0.5">
                  <span className="font-sans text-[11px] font-medium text-[#587253] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                    {isVi ? "Bảo mật tài khoản" : "Secure access"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="font-sans text-xs font-bold text-[#3D5A34] hover:text-[#233A1C] transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
                  >
                    {isVi ? "Quên mật khẩu?" : "Forgot password?"}
                  </button>
                </div>
              )}

              {/* Status/Error Message */}
              {message && (
                <div
                  className={`rounded-2xl border px-4 py-2 font-sans text-xs leading-tight transition-all backdrop-blur-[4px] ${
                    status === "error"
                      ? "border-[#E7B8B8]/80 bg-[#FDF1F1]/80 text-[#9A3838] shadow-xs"
                      : "border-white/60 bg-[#F2F8EE]/80 text-[#3D6334] shadow-xs"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Primary Button - Transparent Green Glass Pill */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full border border-white/70 bg-[#7CA463]/45 hover:bg-[#7CA463]/65 active:scale-[0.99] text-white py-3 px-6 font-display text-xs sm:text-sm font-bold tracking-wider uppercase shadow-[0_6px_20px_0_rgba(80,120,60,0.18),inset_0_1px_2px_0_rgba(255,255,255,0.9),inset_0_-1px_1px_0_rgba(255,255,255,0.2)] backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_0_rgba(80,120,60,0.28),inset_0_1px_2px_0_rgba(255,255,255,1)] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
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
                      : "Sign In"}
                  </span>
                )}
              </button>
            </form>

            {/* Switching between Sign In / Sign Up */}
            <div className="mt-4 sm:mt-5 text-center">
              <p className="font-sans text-xs sm:text-[13px] font-medium text-[#465E41] drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
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
                  className="font-bold text-[#2A4B20] hover:text-[#172F10] underline-offset-3 hover:underline transition-colors"
                >
                  {isRegister
                    ? isVi
                      ? "Đăng nhập ngay"
                      : "Sign in"
                    : isVi
                    ? "Đăng ký tại đây"
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
      <footer className="relative z-20 w-full py-3 text-center pointer-events-none">
        <p className="font-display text-[11px] uppercase tracking-[0.24em] text-[#556952] font-bold">
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
