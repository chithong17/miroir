import { useEffect, useRef, useState } from "react";
import logoUrl from "../assets/logo-web.png";

const STEPS = [
  {
    number: "01",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: "Tải file APK",
    desc: "Nhấn nút Download bên trên để tải file Miroir.apk về điện thoại Android của bạn.",
  },
  {
    number: "02",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Mở file APK",
    desc: "Vào thư mục Tải về (Downloads), tìm file miroir.apk và nhấn vào để bắt đầu cài đặt.",
  },
  {
    number: "03",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Cho phép cài đặt",
    desc: 'Nếu hệ thống hỏi, hãy chọn "Cho phép từ nguồn không rõ" (Install unknown apps) để tiếp tục.',
  },
  {
    number: "04",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: "Mở Miroir!",
    desc: "Cài đặt xong, mở app và đăng nhập tài khoản là có thể bắt đầu trải nghiệm ngay.",
  },
];

const FEATURES = [
  {
    emoji: "🪞",
    title: "AI Virtual Try-On",
    desc: "Thử đồ ảo bằng AI chỉ cần tải ảnh lên. Xem trang phục trên người bạn trước khi mua.",
  },
  {
    emoji: "🛍",
    title: "Fashion Marketplace",
    desc: "Mua sắm từ hàng trăm shop thời trang, lọc theo phong cách, giá và size.",
  },
  {
    emoji: "🤖",
    title: "AI Stylist",
    desc: "Nhận gợi ý trang phục cá nhân hóa dựa trên hình dáng, tông màu da và sở thích của bạn.",
  },
];

export default function DownloadPage() {
  const [downloaded, setDownloaded] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const qrRef = useRef(null);

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 4000);
  };

  // Generate QR via public API (no library needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + "/miroir.apk")}`;

  return (
    <div className="min-h-screen bg-canvas font-body">
      {/* NAV */}
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-line bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="/" className="flex items-center gap-2">
            <img src={logoUrl} alt="Miroir" className="h-12 w-12 object-contain" />
            <span className="font-display text-xl font-black tracking-tight text-ink">MIROIR</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-medium text-muted transition hover:text-ink">Trang chủ</a>
            <a href="/app" className="text-sm font-medium text-muted transition hover:text-ink">Marketplace</a>
            <a href="/login" className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-panel">Đăng nhập</a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-28">

        {/* HERO */}
        <section className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left content */}
          <div>
            <span className="inline-block rounded-full bg-mintDeep/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-mintDeep">
              Android App
            </span>
            <h1 className="editorial-title mt-5 text-5xl font-extrabold leading-[1.05] md:text-6xl xl:text-7xl">
              Miroir<br />
              <span className="text-mintDeep">Mobile</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Fit your shape, free your style. Trải nghiệm thử đồ ảo bằng AI và mua sắm thời trang thông minh ngay trên điện thoại của bạn.
            </p>

            {/* Badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              {["Android 8.0+", "~70 MB", "Miễn phí"].map((badge) => (
                <span key={badge} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
                  {badge}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/miroir.apk"
                download="Miroir.apk"
                onClick={handleDownload}
                className={`flex items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-bold shadow-glow transition-all duration-300 ${
                  downloaded
                    ? "bg-tertiary text-white scale-95"
                    : "bg-mintDeep text-white hover:bg-mint hover:scale-[1.03]"
                }`}
              >
                {downloaded ? (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Đang tải về...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download APK
                  </>
                )}
              </a>

              <button
                onClick={() => setQrVisible((v) => !v)}
                className="flex items-center justify-center gap-2 rounded-full border border-line bg-white px-6 py-4 text-sm font-semibold text-ink transition hover:bg-panel"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Quét QR
              </button>
            </div>

            {/* QR pop-up */}
            {qrVisible && (
              <div className="mt-5 inline-flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-glass">
                <img src={qrUrl} alt="QR download" className="h-28 w-28 rounded-xl" />
                <div>
                  <p className="text-sm font-bold text-ink">Quét để tải về</p>
                  <p className="mt-1 text-xs text-muted">Mở camera điện thoại<br />và hướng vào mã QR</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: phone mockup */}
          <div className="relative flex justify-center">
            <div className="relative h-[480px] w-[240px]">
              {/* Phone frame */}
              <div className="absolute inset-0 rounded-[40px] border-4 border-ink/10 bg-gradient-to-br from-slate-100 to-slate-200 shadow-2xl" />
              {/* Screen */}
              <div className="absolute inset-[8px] overflow-hidden rounded-[34px] bg-canvasDeep">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=85"
                  alt=""
                  className="h-full w-full object-cover opacity-80"
                />
                {/* Overlay glass */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">AI Try-On</p>
                    <p className="mt-1 text-sm font-bold text-white">Thử đồ ảo ngay</p>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -right-6 top-16 rounded-2xl border border-line bg-white px-3 py-2 shadow-glass">
                <p className="text-[10px] font-bold text-mintDeep">AI Powered</p>
                <p className="text-xs font-semibold text-ink">Virtual Try-On</p>
              </div>
              <div className="absolute -left-6 bottom-24 rounded-2xl border border-line bg-white px-3 py-2 shadow-glass">
                <p className="text-[10px] font-bold text-rose">Fashion AI</p>
                <p className="text-xs font-semibold text-ink">Smart Stylist</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-24">
          <h2 className="editorial-title text-center text-3xl font-extrabold md:text-4xl">
            Tại sao chọn Miroir?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            Ứng dụng thời trang thông minh đầu tiên tích hợp AI để cá nhân hóa toàn bộ trải nghiệm mua sắm.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass-panel flex flex-col items-start gap-4 p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mintDeep/10 text-3xl">
                  {feature.emoji}
                </div>
                <h3 className="text-lg font-bold text-ink">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INSTALL STEPS */}
        <section className="mt-24">
          <div className="rounded-[32px] border border-line bg-canvasSoft/50 p-8 sm:p-12">
            <h2 className="editorial-title text-center text-3xl font-extrabold md:text-4xl">
              Cách cài đặt
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted">
              Chỉ mất 2 phút. Không cần Google Play, cài trực tiếp từ file APK.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <div key={step.number} className="flex flex-col items-center gap-4 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-mintDeep text-white shadow-glow">
                    {step.icon}
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-black text-white">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-bold text-ink">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-muted">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Warning note */}
            <div className="mx-auto mt-10 flex max-w-xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs leading-relaxed text-amber-800">
                <strong>Lưu ý bảo mật:</strong> Bật "Cài đặt ứng dụng không rõ nguồn gốc" chỉ khi cài Miroir xong nên tắt lại để bảo vệ điện thoại.
                Để bật: <em>Cài đặt → Bảo mật → Cài đặt ứng dụng không rõ nguồn gốc</em>.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="mt-20 text-center">
          <h2 className="editorial-title text-3xl font-extrabold md:text-4xl">
            Sẵn sàng thử chưa?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Tải ngay và trải nghiệm thời trang thông minh cùng Miroir.
          </p>
          <a
            href="/miroir.apk"
            download="Miroir.apk"
            onClick={handleDownload}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-mintDeep px-10 py-4 text-base font-bold text-white shadow-glow transition hover:bg-mint hover:scale-[1.03]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Miroir APK — Miễn phí
          </a>
          <p className="mt-3 text-xs text-muted">~70 MB · Android 8.0 trở lên</p>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-line bg-white px-5 py-8 text-center">
        <p className="text-xs text-muted">© 2025 Miroir. All rights reserved.</p>
        <div className="mt-2 flex justify-center gap-4">
          <a href="/" className="text-xs text-muted hover:text-ink">Trang chủ</a>
          <a href="/app" className="text-xs text-muted hover:text-ink">Marketplace</a>
          <a href="/app/try-on" className="text-xs text-muted hover:text-ink">Try-On</a>
        </div>
      </footer>
    </div>
  );
}
