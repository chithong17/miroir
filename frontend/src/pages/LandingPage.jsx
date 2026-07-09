import { UnifiedNav } from "./AuthPage.jsx";

function LandingPage() {
  return (
    <div className="min-h-screen bg-hero">
      <UnifiedNav />
      <main className="section-shell grid min-h-[calc(100vh-80px)] items-center gap-10 py-12 lg:grid-cols-[1fr_520px]">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-tertiary">
            AI fashion try-on marketplace
          </p>
          <h1 className="editorial-title mt-4 max-w-4xl text-5xl font-extrabold leading-tight md:text-7xl">
            Try outfits from real shops before you choose.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            MIROIR connects fashion shops, product catalogs, AI try-on, and prompt-based styling in one flow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/login" className="soft-button rounded-lg">Login</a>
            <a href="/register" className="dark-button rounded-lg">Register</a>
            <a href="/app" className="soft-button rounded-lg">Browse marketplace</a>
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-line/60 bg-white shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1100&q=80"
            alt=""
            className="h-[560px] w-full object-cover"
          />
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
