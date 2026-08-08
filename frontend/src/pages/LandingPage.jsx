import { AppShell, ProductCard, TopNav } from "../components/ui/index.jsx";
import { useLanguage } from "../i18n.jsx";

const showcaseProducts = [
  {
    id: "sample-1",
    name: "Rose sculpted dress",
    category: "Evening",
    price: 1290000,
    imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "sample-2",
    name: "Velvet studio blazer",
    category: "Tailoring",
    price: 990000,
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "sample-3",
    name: "Pearl knit set",
    category: "Modern",
    price: 760000,
    imageUrl: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=700&q=85",
  },
];

function LandingPage() {
  const { t } = useLanguage();
  const faqItems = [
    ["landing.faq.returns.q", "landing.faq.returns.a"],
    ["landing.faq.quality.q", "landing.faq.quality.a"],
    ["landing.faq.track.q", "landing.faq.track.a"],
    ["landing.faq.sizes.q", "landing.faq.sizes.a"],
  ];

  return (
    <AppShell nav={<TopNav />}>
      <main className="overflow-hidden">
        {/* HERO SECTION */}
        <section className="section-shell grid items-start gap-6 pb-10 pt-6 sm:gap-8 sm:pb-12 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-line bg-canvasDeep shadow-glow sm:rounded-[40px] lg:min-h-[640px]">
            {/* Background huge text */}
            <div className="absolute inset-x-0 top-[42%] -translate-y-1/2 select-none text-center font-display text-[22vw] font-black leading-none text-rose/10 sm:top-[48%] sm:text-[15vw] md:text-[190px]">
              DIVINE
              <br />
              DRAPE
            </div>
            
            {/* Main model image */}
            <img
              src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=90"
              alt=""
              className="absolute left-1/2 top-10 h-[48%] -translate-x-1/2 object-contain drop-shadow-2xl opacity-95 sm:top-14 sm:h-[58%] md:top-16 md:h-[60%]"
            />
            
            {/* Glass gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas/95 via-canvas/60 to-transparent p-3 sm:p-4 md:p-8">
              <div className="mx-auto max-w-[920px] rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-glass backdrop-blur-xl sm:rounded-[30px] sm:p-5 md:p-7">
                <p className="max-w-xl text-sm font-bold uppercase tracking-[0.2em] text-accentStrong">
                  {t("landing.eyebrow")}
                </p>
                <h1 className="editorial-title mt-3 max-w-3xl text-3xl font-extrabold leading-[1.02] sm:mt-4 sm:text-4xl md:text-5xl xl:text-6xl">
                  {t("landing.heroTitle")}
                </h1>
                <div className="mt-5 grid gap-3 sm:mt-6 sm:flex sm:flex-wrap">
                  <a href="/register" className="dark-button w-full !px-6 !py-3.5 text-base sm:w-auto sm:!px-8 sm:!py-4">{t("landing.startStyling")}</a>
                  <a href="/app" className="soft-button w-full !px-6 !py-3.5 text-base sm:w-auto sm:!px-8 sm:!py-4">{t("landing.browseMarketplace")}</a>
                  <a href="/download" className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white/80 !px-6 !py-3.5 text-base font-semibold text-ink backdrop-blur-md transition hover:bg-white sm:w-auto sm:!px-8 sm:!py-4">
                    <svg className="h-5 w-5 text-mintDeep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5l-6-6m6 6l6-6m-6 6V5" />
                    </svg>
                    Tải app Android
                  </a>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-4 sm:gap-6">
            <div className="glass-panel-pink p-5 text-center sm:p-8 lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-roseDeep">{t("landing.newCollection")}</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-ink">{t("landing.realShops")}</h2>
              <p className="mt-4 text-base leading-relaxed text-roseDeep/80">
                {t("landing.description")}
              </p>
              <a href="/login" className="dark-button mt-8 w-full">{t("landing.joinCommunity")}</a>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {showcaseProducts.slice(0, 2).map((product) => (
                <div key={product.id} className="overflow-hidden rounded-3xl border border-line bg-white/80 shadow-glass">
                  <div className="aspect-[4/5]">
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover opacity-80" />
                  </div>
                </div>
              ))}
            </div>
            

          </aside>
        </section>

        {/* TRENDING STYLES */}
        <section className="section-shell py-14 sm:py-20">
          <div className="mb-8 flex flex-col items-center text-center sm:mb-12">
            <h2 className="editorial-title text-3xl font-extrabold sm:text-5xl md:text-6xl">{t("landing.trending")}</h2>
            <p className="mt-4 text-xl font-bold text-rose">{t("landing.everyWardrobe")}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {showcaseProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <a href="/app" className="soft-button !px-12 !py-4">{t("landing.viewAll")}</a>
          </div>
        </section>

        {/* STUDIO SECTION */}
        <section className="section-shell grid gap-8 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-rose/20 bg-canvasSoft/40 shadow-glowDeep sm:min-h-[600px] sm:rounded-[40px]">
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center font-display text-[88px] font-black leading-[0.8] text-rose/5 sm:text-[150px] md:text-[200px] select-none">
              DESIGN<br />MODERN
            </div>
            <img
              src="https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=950&q=85"
              alt=""
              className="absolute bottom-0 left-1/2 h-[95%] -translate-x-1/2 object-cover drop-shadow-2xl"
            />
          </div>
          <div className="flex flex-col justify-center px-4 lg:px-12">
            <h2 className="editorial-title text-3xl font-extrabold leading-[1.1] sm:text-5xl md:text-7xl">
              {t("landing.designModern").split("\n").map((line, index) => (
                <span key={line}>{index > 0 ? <br /> : null}{line}</span>
              ))}
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              {t("landing.studioDescription")}
            </p>
            <div className="mt-10">
              <a href="/app/try-on" className="dark-button !px-12 !py-4">{t("landing.learnMore")}</a>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="section-shell py-16 sm:py-24">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
            <h2 className="editorial-title text-3xl font-extrabold md:text-5xl">
              {t("landing.faqTitle").split("\n").map((line, index) => (
                <span key={line}>{index > 0 ? <br /> : null}{line}</span>
              ))}
            </h2>
          </div>
          <div className="mx-auto grid max-w-3xl gap-4">
            {faqItems.map(([question, answer]) => (
              <details key={question} className="group glass-panel overflow-hidden transition-all duration-300 open:border-rose/30">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-display text-lg font-bold text-ink transition-colors hover:text-rose">
                  {t(question)}
                  <span className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-rose transition-transform group-open:rotate-180">
                    v
                  </span>
                </summary>
                <div className="px-6 pb-6 text-base leading-relaxed text-muted">
                  {t(answer)}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

export default LandingPage;
