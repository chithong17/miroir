const heroBadges = [
  "AI-Powered",
  "Realistic Preview",
  "Fashion E-commerce Ready",
];

const atelierSteps = [
  {
    title: "Upload your photo",
    description:
      "Provide a clear, front-facing image. Our AI analyzes proportions, skin tone, and lighting to prepare the perfect digital canvas.",
  },
  {
    title: "Choose a garment",
    description:
      "Select from an integrated catalog or upload flat-lay product imagery. The system maps the fabric structure for a refined preview.",
  },
  {
    title: "Generate result",
    description:
      "Experience the magic in seconds with a photorealistic composite that blends subject and garment seamlessly.",
    highlighted: true,
  },
];

const features = [
  {
    title: "Realistic AI Try-On",
    description:
      "Advanced shading and fabric drape simulation ensures the garment looks physically worn, not pasted on.",
    wide: true,
    mark: "A",
  },
  {
    title: "Multi-Garment",
    description:
      "Layer jackets over dresses or mix tops and bottoms intelligently.",
    mark: "M",
  },
  {
    title: "Fast Processing",
    description:
      "Optimized pipeline delivers studio-quality renders in a remarkably short flow.",
    mark: "F",
  },
  {
    title: "Shop Integration",
    description:
      "Connect directly with modern e-commerce systems through a clean backend architecture.",
    mark: "S",
  },
];

const miniFeatures = [
  {
    title: "Enhanced Experience",
    description: "Elevate the customer journey with instant visual feedback.",
    highlighted: false,
  },
  {
    title: "Reduced Returns",
    description:
      "Better fit confidence means fewer costly returns and stronger conversion.",
    highlighted: true,
  },
];

const businessCards = [
  {
    title: "Product Upload",
    description:
      "Batch upload standard product photography. No 3D models required.",
  },
  {
    title: "Customer Try-On",
    description:
      "Shoppers upload a single selfie or full-body image to start their fitting experience.",
  },
  {
    title: "Result Preview",
    description:
      "Instant visualization across your catalog inventory with a clear status-driven pipeline.",
  },
  {
    title: "Purchase Confidence",
    description:
      "Increase AOV and conversion rates through visualized certainty before checkout.",
    highlighted: true,
  },
];

function LandingPage() {
  return (
    <div className="pb-16">
      <nav className="sticky top-0 z-50 border-b border-line/40 bg-canvas/80 backdrop-blur-xl">
        <div className="section-shell flex items-center justify-between py-4">
          <a href="/" className="font-display text-2xl font-extrabold tracking-tight">
            MIROIR
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#top" className="border-b-2 border-ink pb-1 text-sm font-semibold text-ink">
              Home
            </a>
            <a href="#process" className="text-sm text-muted transition hover:text-ink">
              Process
            </a>
            <a href="#features" className="text-sm text-muted transition hover:text-ink">
              Features
            </a>
          </div>

          <a href="/try-on" className="dark-button hidden md:inline-flex">
            Get Started
          </a>
        </div>
      </nav>

      <main id="top" className="section-shell space-y-32 pt-20">
        <section className="grid min-h-[80vh] grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-8">
          <div className="relative z-10 space-y-8 md:col-span-5">
            <div className="mb-6 flex flex-wrap gap-3">
              {heroBadges.map((badge, index) => (
                <span
                  key={badge}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                    index === 0
                      ? "border-secondarySoft/60 bg-secondarySoft/20 text-ink"
                      : "border-secondarySoft/60 bg-panelSoft text-ink"
                  }`}
                >
                  {index === 0 ? <span className="mr-1 text-sm">+</span> : null}
                  {badge}
                </span>
              ))}
            </div>

            <h1 className="editorial-title text-5xl font-extrabold leading-[1.02] md:text-[64px]">
              AI Virtual Try-On for Smarter Fashion Shopping
            </h1>

            <p className="max-w-md text-lg leading-8 text-muted">
              Upload your photo, choose an outfit, and preview how it looks on
              you in seconds. Experience high-end fashion editing powered by
              sophisticated AI.
            </p>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <a href="/try-on" className="dark-button px-8 py-4 text-center">
                Try It Now
              </a>
              <a href="#features" className="soft-button px-8 py-4 text-center">
                Explore Features
              </a>
            </div>
          </div>

          <div className="relative flex h-full justify-end md:col-span-7">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-white to-tertiarySoft/10 opacity-50 blur-3xl" />

            <div className="mirror-frame glass-panel relative aspect-[4/5] w-full max-w-2xl overflow-hidden rounded-[2rem] border-secondarySoft/50 bg-white/80 p-2 backdrop-blur-2xl">
              <img
                alt="AI Virtual Try-On Preview"
                className="h-full w-full rounded-[1.5rem] object-cover"
                src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80"
              />

              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-secondarySoft/40 bg-white/90 px-4 py-2 shadow-lg backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-tertiarySoft animate-ping" />
                <span className="text-xs text-tertiary">
                  Processing Style...
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="py-8">
          <div className="mb-16 text-center">
            <h2 className="editorial-title text-4xl font-bold md:text-[40px]">
              The Atelier Process
            </h2>
            <p className="mt-4 text-lg text-muted">
              Seamless integration from concept to virtual reality.
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-8">
            <div className="glass-panel md:col-span-5 flex justify-center overflow-hidden rounded-[2rem] border-secondarySoft/40 p-8 shadow-glow">
              <div className="grid w-full max-w-xs grid-cols-2 gap-4 opacity-80">
                {["Upload", "Detect", "Map", "Blend"].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.5rem] border border-secondarySoft/30 bg-white p-6 text-center text-sm font-medium text-ink"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8 md:col-span-7 md:pl-12">
              {atelierSteps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-6">
                  <div
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg font-semibold ${
                      step.highlighted
                        ? "border-tertiarySoft/50 bg-tertiarySoft/20 text-tertiary shadow-lg"
                        : "border-secondarySoft/40 bg-white text-ink shadow-glow"
                    }`}
                  >
                    {step.highlighted ? (
                      <span className="absolute inset-0 rounded-full border border-tertiarySoft animate-ping opacity-50" />
                    ) : null}
                    <span className="relative">{index + 1}</span>
                  </div>

                  <div>
                    <h3 className="mb-2 text-2xl font-semibold text-ink">
                      {step.title}
                    </h3>
                    <p className="text-base leading-7 text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-8">
          <div className="mb-12">
            <h2 className="editorial-title text-4xl font-bold md:text-[40px]">
              Visionary Capabilities
            </h2>
          </div>

          <div className="grid auto-rows-[240px] grid-cols-1 gap-2 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className={`glass-panel group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border-secondarySoft/40 p-8 shadow-glow transition hover:bg-panelSoft ${
                  feature.wide ? "md:col-span-2" : ""
                }`}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-secondarySoft/40 bg-canvas text-sm font-medium text-ink">
                  {feature.mark}
                </div>

                <div className="relative z-10">
                  <h3 className="mb-2 text-2xl font-semibold text-ink">
                    {feature.title}
                  </h3>
                  <p className="max-w-sm text-base leading-7 text-muted">
                    {feature.description}
                  </p>
                </div>

                {feature.wide ? (
                  <div className="pointer-events-none absolute bottom-0 right-0 text-[180px] leading-none text-ink/[0.05] transition-opacity group-hover:text-ink/[0.08]">
                    A
                  </div>
                ) : null}
              </article>
            ))}

            <div className="flex flex-col gap-2 md:col-span-1">
              {miniFeatures.map((item) => (
                <article
                  key={item.title}
                  className={`glass-panel flex-1 rounded-[2rem] p-6 shadow-glow transition ${
                    item.highlighted
                      ? "border-tertiarySoft/40 bg-tertiarySoft/10 hover:bg-tertiarySoft/20"
                      : "border-secondarySoft/40 hover:bg-panelSoft"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className={`text-sm ${
                        item.highlighted ? "text-tertiary" : "text-ink"
                      }`}
                    >
                      +
                    </span>
                    <h3
                      className={`text-sm font-semibold uppercase tracking-[0.08em] ${
                        item.highlighted ? "text-tertiary" : "text-ink"
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-6 text-muted">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line/30 py-16">
          <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-xl">
              <h2 className="editorial-title text-4xl font-bold md:text-[40px]">
                Built for Fashion Stores
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted">
                Transform your catalog into an interactive virtual fitting room.
                Empower your customers and drive conversion.
              </p>
            </div>

            <button className="soft-button">View Business Plans</button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {businessCards.map((card) => (
              <article
                key={card.title}
                className={`rounded-[2rem] border p-6 transition hover:-translate-y-1 ${
                  card.highlighted
                    ? "border-tertiarySoft/30 bg-tertiarySoft/10"
                    : "border-secondarySoft/20 bg-canvas"
                }`}
              >
                <div
                  className={`mb-4 text-sm font-semibold ${
                    card.highlighted ? "text-tertiary" : "text-ink"
                  }`}
                >
                  +
                </div>
                <h4
                  className={`mb-2 text-sm font-semibold uppercase tracking-[0.08em] ${
                    card.highlighted ? "text-tertiary" : "text-ink"
                  }`}
                >
                  {card.title}
                </h4>
                <p className="text-sm leading-6 text-muted">{card.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-8 border-t border-line/30 bg-white">
        <div className="section-shell flex flex-col items-center justify-between gap-4 py-12 md:flex-row">
          <div className="text-2xl font-bold text-ink">MIROIR</div>

          <div className="flex flex-wrap justify-center gap-6">
            {["About", "Privacy", "Terms", "AI Ethics", "Contact"].map((item) => (
              <a
                key={item}
                href="#top"
                className="text-sm text-muted transition hover:text-ink"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="text-sm text-muted">
            © 2026 MIROIR. The Digital Atelier.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
