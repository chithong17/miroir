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
        <section className="section-shell grid min-h-[calc(100vh-100px)] items-end gap-8 pb-12 pt-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="relative min-h-[680px] overflow-hidden rounded-[40px] bg-canvasDeep shadow-glow">
            {/* Background huge text */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-display text-[15vw] font-black leading-none text-rose/10 md:text-[220px]">
              DIVINE
              <br />
              DRAPE
            </div>
            
            {/* Main model image */}
            <img
              src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=90"
              alt=""
              className="absolute bottom-0 left-1/2 h-[90%] -translate-x-1/2 object-contain drop-shadow-2xl mix-blend-luminosity opacity-90"
            />
            
            {/* Glass gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-canvasDeep via-canvasDeep/50 to-transparent p-8 md:p-12">
              <p className="max-w-xl text-sm font-bold uppercase tracking-[0.3em] text-rose">
                {t("landing.eyebrow")}
              </p>
              <h1 className="editorial-title mt-4 max-w-3xl text-5xl font-extrabold leading-none md:text-7xl">
                {t("landing.heroTitle")}
              </h1>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="/register" className="dark-button !px-10 !py-4 text-base">{t("landing.startStyling")}</a>
                <a href="/app" className="soft-button !px-10 !py-4 text-base">{t("landing.browseMarketplace")}</a>
              </div>
            </div>
          </div>

          <aside className="grid gap-6">
            <div className="glass-panel-pink p-8 text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-roseDeep">{t("landing.newCollection")}</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-ink">{t("landing.realShops")}</h2>
              <p className="mt-4 text-base leading-relaxed text-roseDeep/80">
                {t("landing.description")}
              </p>
              <a href="/login" className="dark-button mt-8 w-full">{t("landing.joinCommunity")}</a>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {showcaseProducts.slice(0, 2).map((product) => (
                <div key={product.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-glass">
                  <div className="aspect-[4/5]">
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover opacity-80" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="glass-panel p-6 text-center flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-bold text-muted">{t("landing.freeTryOns")}</p>
                <p className="text-xs text-muted/60 mt-1">{t("landing.availableThisMonth")}</p>
              </div>
              <p className="font-display text-5xl font-black text-rose">5</p>
            </div>
          </aside>
        </section>

        {/* TRENDING STYLES */}
        <section className="section-shell py-20">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="editorial-title text-5xl font-extrabold md:text-6xl">{t("landing.trending")}</h2>
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
        <section className="section-shell grid gap-8 py-20 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[600px] overflow-hidden rounded-[40px] border border-rose/20 bg-canvasSoft/40 shadow-glowDeep">
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center font-display text-[150px] font-black leading-[0.8] text-rose/5 md:text-[200px] select-none">
              DESIGN<br />MODERN
            </div>
            <img
              src="https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=950&q=85"
              alt=""
              className="absolute bottom-0 left-1/2 h-[95%] -translate-x-1/2 object-cover drop-shadow-2xl"
            />
          </div>
          <div className="flex flex-col justify-center px-4 lg:px-12">
            <h2 className="editorial-title text-5xl font-extrabold leading-[1.1] md:text-7xl">
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
        <section className="section-shell py-24">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="editorial-title text-4xl font-extrabold md:text-5xl">
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
                  <span className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-rose transition-transform group-open:rotate-180">
                    ↓
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
