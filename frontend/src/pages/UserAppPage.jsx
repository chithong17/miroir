import { useEffect, useMemo, useState } from "react";
import { listCatalogOutfits, listCatalogProducts } from "../api/catalogApi.js";
import { getStylistRecommendation } from "../api/stylistApi.js";
import { getUserMe, saveUserProfile, setUserToken } from "../api/userApi.js";
import { UnifiedNav } from "./AuthPage.jsx";

const fieldClass = "w-full rounded-lg border border-line/70 bg-white px-3 py-2 text-sm outline-none focus:border-tertiary";

function UserAppPage({ initialView = "products" }) {
  const [user, setUser] = useState(null);
  const [view, setView] = useState(initialView);
  const [products, setProducts] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", category: "", gender: "", minPrice: "", maxPrice: "", page: 1 });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stylistPrompt, setStylistPrompt] = useState("");
  const [stylistBudget, setStylistBudget] = useState("");
  const [stylistResult, setStylistResult] = useState(null);
  const [stylistStatus, setStylistStatus] = useState("idle");
  const [profileForm, setProfileForm] = useState({});

  useEffect(() => {
    getUserMe()
      .then((response) => {
        setUser(response.user);
        setProfileForm(flattenProfile(response.user.profile || {}));
      })
      .catch(() => {
        setUserToken("");
        window.location.href = "/login";
      });
  }, []);

  useEffect(() => {
    if (view === "outfits") loadOutfits();
    if (view === "products") loadProducts();
  }, [view, filters.page]);

  const loadProducts = async () => {
    const response = await listCatalogProducts(compact(filters));
    setProducts(response.products || []);
    setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
  };

  const loadOutfits = async () => {
    const response = await listCatalogOutfits(compact(filters));
    setOutfits(response.outfits || []);
    setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
  };

  const applyFilters = () => {
    setFilters((previous) => ({ ...previous, page: 1 }));
    setTimeout(() => (view === "outfits" ? loadOutfits() : loadProducts()), 0);
  };

  const goToTryOn = (product) => {
    if (!product?.id) return;
    window.location.href = `/app/try-on?productId=${encodeURIComponent(product.id)}`;
  };

  const runStylist = async (event) => {
    event.preventDefault();
    setStylistStatus("loading");
    setStylistResult(null);
    const budget = stylistBudget ? { max: Number(stylistBudget) } : undefined;
    try {
      const response = await getStylistRecommendation(compact({
        prompt: stylistPrompt,
        userId: user?.id,
        gender: user?.profile?.gender,
        profile: user?.profile,
        budget,
        desiredOutfitCount: 5,
      }));
      setStylistResult(response);
      setStylistStatus("success");
    } catch (error) {
      setStylistStatus("error");
      setStylistResult({ message: error.response?.data?.message || "Could not generate outfits." });
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const response = await saveUserProfile(profileForm);
    setUser(response.user);
  };

  const onLogout = () => {
    setUserToken("");
    window.location.href = "/";
  };

  const shownProducts = useMemo(() => (view === "products" ? products : []), [products, view]);

  return (
    <div className="min-h-screen bg-hero">
      <UnifiedNav user={user} onLogout={onLogout} />
      <main className="section-shell py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="editorial-title text-3xl font-bold">MIROIR Marketplace</h1>
            <p className="text-sm text-muted">Browse shop catalogues, try products on, and ask the stylist.</p>
          </div>
          <div className="flex rounded-lg bg-panelSoft p-1">
            {["products", "outfits", "stylist", "profile"].map((tab) => (
              <button key={tab} onClick={() => setView(tab)} className={`rounded-md px-4 py-2 text-sm font-semibold capitalize ${view === tab ? "bg-white shadow-sm" : "text-muted"}`}>{tab}</button>
            ))}
          </div>
        </div>

        {view === "products" || view === "outfits" ? (
          <CatalogFilters filters={filters} setFilters={setFilters} applyFilters={applyFilters} />
        ) : null}

        {view === "products" ? (
          <ProductGrid products={shownProducts} onDetail={setSelectedProduct} onTryOn={goToTryOn} />
        ) : null}

        {view === "outfits" ? (
          <OutfitGrid outfits={outfits} onTryOn={goToTryOn} />
        ) : null}

        {view === "products" || view === "outfits" ? (
          <Pagination pagination={pagination} setFilters={setFilters} />
        ) : null}

        {view === "stylist" ? (
          <StylistPanel
            budget={stylistBudget}
            prompt={stylistPrompt}
            result={stylistResult}
            status={stylistStatus}
            setBudget={setStylistBudget}
            setPrompt={setStylistPrompt}
            onSubmit={runStylist}
            onTryOn={goToTryOn}
          />
        ) : null}

        {view === "profile" ? (
          <ProfilePanel form={profileForm} setForm={setProfileForm} onSubmit={saveProfile} />
        ) : null}
      </main>

      {selectedProduct ? <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onTryOn={goToTryOn} /> : null}
    </div>
  );
}

function CatalogFilters({ applyFilters, filters, setFilters }) {
  const update = (field) => (event) => setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  return (
    <div className="mt-6 grid gap-3 rounded-lg border border-line/60 bg-white/80 p-4 md:grid-cols-6">
      <input className={fieldClass} placeholder="Search" value={filters.search} onChange={update("search")} />
      <input className={fieldClass} placeholder="Category" value={filters.category} onChange={update("category")} />
      <select className={fieldClass} value={filters.gender} onChange={update("gender")}><option value="">Any gender</option><option value="female">Female</option><option value="male">Male</option><option value="unisex">Unisex</option></select>
      <input className={fieldClass} placeholder="Min price" value={filters.minPrice} onChange={update("minPrice")} />
      <input className={fieldClass} placeholder="Max price" value={filters.maxPrice} onChange={update("maxPrice")} />
      <button className="dark-button rounded-lg" onClick={applyFilters}>Filter</button>
    </div>
  );
}

function ProductGrid({ onDetail, onTryOn, products }) {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => <ProductCard key={product.id} product={product} onDetail={onDetail} onTryOn={onTryOn} />)}
      {!products.length ? <EmptyState text="No products found." /> : null}
    </div>
  );
}

function ProductCard({ onDetail, onTryOn, product }) {
  return (
    <article className="overflow-hidden rounded-lg border border-line/60 bg-white shadow-sm">
      <button className="block aspect-[4/5] w-full bg-panelSoft" onClick={() => onDetail(product)}>
        {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
      </button>
      <div className="p-4">
        <p className="font-semibold">{product.name}</p>
        <p className="text-sm text-muted">{product.shop?.name || "Shop"}</p>
        <p className="mt-2 font-bold">{formatMoney(product.price)}</p>
        <button className="mt-3 w-full rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white" onClick={() => onTryOn(product)}>Try on</button>
      </div>
    </article>
  );
}

function OutfitGrid({ onTryOn, outfits }) {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      {outfits.map((outfit) => (
        <article key={outfit.id} className="rounded-lg border border-line/60 bg-white p-4 shadow-sm">
          <h3 className="font-bold">{outfit.title}</h3>
          <p className="mt-1 text-sm text-muted">{outfit.description || `${outfit.products.length} items`}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {outfit.products.slice(0, 3).map((product) => (
              <button key={product.id} className="aspect-square overflow-hidden rounded-md bg-panelSoft" onClick={() => onTryOn(product)}>
                {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
              </button>
            ))}
          </div>
        </article>
      ))}
      {!outfits.length ? <EmptyState text="No outfit sets available yet." /> : null}
    </div>
  );
}

function StylistPanel({ budget, onSubmit, onTryOn, prompt, result, setBudget, setPrompt, status }) {
  const outfits = result?.outfits || [];
  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-[420px_1fr]">
      <form onSubmit={onSubmit} className="glass-panel p-5">
        <h2 className="text-xl font-bold">Prompt stylist</h2>
        <textarea className={`${fieldClass} mt-4 min-h-40`} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ví dụ: phối đồ đi sinh nhật tối nay, thanh lịch nhưng nổi bật" />
        <input className={`${fieldClass} mt-3`} value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Budget max optional" />
        <button className="dark-button mt-4 rounded-lg" disabled={status === "loading"}>Generate outfits</button>
      </form>
      <div className="grid gap-4">
        {result?.message ? <div className="rounded-lg bg-red-50 p-4 text-red-700">{result.message}</div> : null}
        {outfits.map((outfit) => (
          <div key={outfit.id} className="rounded-lg border border-line/60 bg-white p-4">
            <h3 className="font-bold">{outfit.title}</h3>
            <p className="mt-1 text-sm text-muted">{outfit.whyItMatches}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(outfit.items || []).map((item) => item.product ? <ProductCard key={item.product.id} product={item.product} onDetail={() => {}} onTryOn={onTryOn} /> : null)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePanel({ form, onSubmit, setForm }) {
  const update = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  return (
    <form onSubmit={onSubmit} className="glass-panel mt-6 max-w-3xl p-5">
      <h2 className="text-xl font-bold">Profile</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {["gender", "bodyShape", "skinTone", "stylePreferences", "height", "weight", "bust", "waist", "hips", "shoulder"].map((field) => (
          <input key={field} className={fieldClass} placeholder={field} value={form[field] || ""} onChange={update(field)} />
        ))}
      </div>
      <button className="dark-button mt-4 rounded-lg">Save profile</button>
    </form>
  );
}

function ProductModal({ onClose, onTryOn, product }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-3xl rounded-lg bg-white p-5" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex justify-between gap-4">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-panelSoft">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div>
          <div>
            <p className="font-bold">{formatMoney(product.price)}</p>
            <p className="mt-3 text-sm text-muted">{product.description}</p>
            <p className="mt-4 text-sm"><strong>Shop:</strong> {product.shop?.name}</p>
            <p className="text-sm"><strong>Address/contact:</strong> {product.shop?.contact?.address || product.shop?.contact?.email || "Not provided"}</p>
            <button className="dark-button mt-5 rounded-lg" onClick={() => onTryOn(product)}>Try on</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ pagination, setFilters }) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button className="soft-button rounded-lg" disabled={pagination.page <= 1} onClick={() => setFilters((previous) => ({ ...previous, page: pagination.page - 1 }))}>Prev</button>
      <span className="text-sm font-semibold">Page {pagination.page} / {pagination.totalPages}</span>
      <button className="soft-button rounded-lg" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((previous) => ({ ...previous, page: pagination.page + 1 }))}>Next</button>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-lg border border-line/60 bg-white p-8 text-center text-muted">{text}</div>;
}

const compact = (value) => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== "" && item !== undefined && item !== null));
const flattenProfile = (profile) => ({ ...(profile.measurements || {}), ...profile, stylePreferences: (profile.stylePreferences || []).join(", ") });
const formatMoney = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));

export default UserAppPage;
