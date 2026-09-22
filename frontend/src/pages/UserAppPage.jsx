import { useEffect, useMemo, useState } from "react";
import {
  listCatalogOutfits,
  listCatalogProducts,
  submitProductFeedback,
} from "../api/catalogApi.js";
import { getStylistRecommendation } from "../api/stylistApi.js";
import {
  getUserMe,
  getUserToken,
  listUserFavoriteProducts,
  saveUserProfile,
  setUserToken,
  toggleUserFavoriteProduct,
  uploadUserProfilePhoto,
} from "../api/userApi.js";
import { addCartItem } from "../api/commerceApi.js";
import {
  AppShell,
  Button,
  EmptyState,
  Modal,
  PageHeader,
  ProductCard,
  SegmentedTabs,
  SelectField,
  TextField,
  TopNav,
  formatMoney,
} from "../components/ui/index.jsx";
import { useLanguage } from "../i18n.jsx";

function UserAppPage({ initialView = "products" }) {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [view, setView] = useState(initialView);
  const [products, setProducts] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", category: "", gender: "", minPrice: "", maxPrice: "", page: 1 });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stylistPrompt, setStylistPrompt] = useState("");
  const [stylistBudget, setStylistBudget] = useState("");
  const [stylistResult, setStylistResult] = useState(null);
  const [stylistStatus, setStylistStatus] = useState("idle");
  const [profileForm, setProfileForm] = useState({});
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [profilePhotoNotice, setProfilePhotoNotice] = useState("");

  useEffect(() => {
    if (!getUserToken()) {
      if (!["products", "stylist"].includes(initialView)) {
        sessionStorage.setItem("miroir_after_login", window.location.href);
        window.location.href = "/login";
      }
      return;
    }
    getUserMe()
      .then((response) => {
        setUser(response.user);
        setFavoriteProductIds(response.user?.favoriteProductIds || []);
        setProfileForm(flattenProfile(response.user.profile || {}));
      })
      .catch(() => {
        setUserToken("");
        setUser(null);
      });
  }, []);

  useEffect(() => {
    if (view === "outfits") loadOutfits();
    if (view === "products") loadProducts();
    if (view === "favorites") loadFavorites();
  }, [view, filters.page]);

  const loadProducts = async (currentFilters = filters) => {
    const response = await listCatalogProducts(compact(currentFilters));
    setProducts(response.products || []);
    setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
  };

  const loadOutfits = async (currentFilters = filters) => {
    const response = await listCatalogOutfits(compact(currentFilters));
    setOutfits(response.outfits || []);
    setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
  };

  const loadFavorites = async () => {
    const response = await listUserFavoriteProducts();
    const nextProducts = response.products || [];
    setFavoriteProducts(nextProducts);
  };

  const applyFilters = () => {
    const newFilters = { ...filters, page: 1 };
    setFilters(newFilters);
    if (view === "outfits") loadOutfits(newFilters);
    if (view === "products") loadProducts(newFilters);
  };

  const goToTryOn = (product) => {
    if (!product?.id) return;
    window.location.href = `/try-on?productId=${encodeURIComponent(product.id)}`;
  };

  const openProduct = (product) => {
    if (!product?.id) return;
    window.location.href = `/products/${encodeURIComponent(product.id)}`;
  };

  const sendProductFeedback = async (product, payload) => {
    if (!product?.id) return;
    try {
      setFeedbackNotice(t("common.feedbackSaving"));
      await submitProductFeedback(product.id, payload);
      setFeedbackNotice(t("common.feedbackSaved"));
    } catch (error) {
      setFeedbackNotice(error.response?.data?.message || t("common.feedbackError"));
    }
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
      setStylistResult({ message: error.response?.data?.message || t("app.generateError") });
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const response = await saveUserProfile(profileForm);
    setUser(response.user);
  };

  const toggleFavorite = async (product) => {
    if (!product?.id) return;
    if (!user) {
      sessionStorage.setItem("miroir_after_login", window.location.href);
      window.location.href = "/login";
      return;
    }
    try {
      const response = await toggleUserFavoriteProduct(product.id);
      const nextIds = response.favoriteProductIds || [];
      setFavoriteProductIds(nextIds);
      setUser((previous) => previous ? { ...previous, favoriteProductIds: nextIds } : previous);
      if (view === "favorites") {
        setFavoriteProducts((previous) => previous.filter((item) => nextIds.includes(item.id)));
      }
      if (selectedProduct?.id === product.id) {
        setSelectedProduct((previous) => previous ? { ...previous } : previous);
      }
    } catch (error) {
      setFeedbackNotice(error.response?.data?.message || t("app.favoriteError"));
    }
  };

  const uploadProfilePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setProfilePhotoNotice(t("common.working"));
      await uploadUserProfilePhoto(file);
      const response = await getUserMe();
      setUser(response.user);
      setProfileForm(flattenProfile(response.user.profile || {}));
      setProfilePhotoNotice(t("onboarding.photoSaved"));
    } catch (error) {
      setProfilePhotoNotice(error.response?.data?.message || t("onboarding.photoError"));
    } finally {
      event.target.value = "";
    }
  };

  const onLogout = () => {
    setUserToken("");
    window.location.href = "/";
  };

  const shownProducts = useMemo(() => (view === "products" ? products : []), [products, view]);
  const pageTitle = view === "stylist"
    ? t("app.stylistTitle")
    : view === "profile"
      ? t("app.profileTitle")
      : view === "favorites"
        ? t("app.favoritesTitle")
        : t("app.title");
  const pageDescription = view === "favorites" ? t("app.favoritesDescription") : t("app.description");
  const favoriteIdSet = useMemo(() => new Set(favoriteProductIds), [favoriteProductIds]);

  return (
    <AppShell nav={<TopNav user={user} onLogout={onLogout} />}>
      <main 
        className="relative -mt-[76px] min-h-screen px-4 pb-8 pt-[108px] sm:px-8 xl:px-12"
        style={{
          backgroundImage: "url('/liquid-bg-clean.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundColor: "#F8FAF7"
        }}
      >
        <div className="relative z-10 max-w-[1500px] mx-auto">
          {view === "products" || view === "outfits" ? (
            <div className="flex flex-col gap-8">
              {/* Marketplace Hero */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                  <h1 className="text-4xl md:text-[3.5rem] leading-[1.1] font-display font-bold text-[#91B76F] mb-4">{t("marketplace.title")}</h1>
                  <p className="whitespace-pre-line text-sm md:text-base text-gray-600 max-w-lg">{t("marketplace.description")}</p>
                </div>
                <div 
                  className="flex p-1.5"
                  style={{
                    background: "rgba(255, 255, 255, 0.45)",
                    backdropFilter: "blur(24px) saturate(130%)",
                    WebkitBackdropFilter: "blur(24px) saturate(130%)",
                    border: "1px solid rgba(255, 255, 255, 0.7)",
                    borderRadius: "999px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                  }}
                >
                  <button onClick={() => setView('products')} className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${view === 'products' ? 'bg-[#91B76F] text-white shadow-md' : 'text-gray-500 hover:text-[#101512] bg-transparent'}`}>{t("marketplace.products")}</button>
                  <button onClick={() => setView('outfits')} className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${view === 'outfits' ? 'bg-[#91B76F] text-white shadow-md' : 'text-gray-500 hover:text-[#101512] bg-transparent'}`}>{t("marketplace.outfits")}</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr] gap-8 items-start">
                {/* Left Sidebar - Filters */}
                <aside className="hidden lg:block z-10 relative">
                  <CatalogFilters filters={filters} setFilters={setFilters} applyFilters={applyFilters} />
                </aside>
                
                {/* Main Content */}
                <div className="flex flex-col min-w-0">
                  {/* Toolbar */}
                  <div 
                    className="flex flex-wrap items-center justify-between gap-4 mb-2 p-3 rounded-full"
                    style={{
                      background: "rgba(255, 255, 255, 0.45)",
                      backdropFilter: "blur(24px) saturate(130%)",
                      WebkitBackdropFilter: "blur(24px) saturate(130%)",
                      border: "1px solid rgba(255, 255, 255, 0.7)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                    }}
                  >
                     <p className="text-sm font-semibold text-[#253029] ml-3">{t("marketplace.searchResults")}</p>
                     <div className="flex items-center gap-4">
                       <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:block">{t("marketplace.sort")}</span>
                       <div className="flex gap-1.5">
                         <button className="px-5 py-2.5 text-xs font-bold rounded-full bg-[#91B76F] text-white shadow-sm transition-all hover:bg-[#A8C98B]">{t("marketplace.relevant")}</button>
                         <button className="px-5 py-2.5 text-xs font-bold rounded-full text-[#253029] bg-transparent hover:bg-white/60 transition-all hidden sm:block">{t("marketplace.newest")}</button>
                         <button className="px-5 py-2.5 text-xs font-bold rounded-full text-[#253029] bg-transparent hover:bg-white/60 transition-all hidden md:block">{t("marketplace.bestSelling")}</button>
                         <button className="px-5 py-2.5 text-xs font-bold rounded-full text-[#253029] bg-transparent hover:bg-white/60 transition-all hidden md:block">{t("marketplace.priceLowToHigh")}</button>
                       </div>
                       
                       <div className="hidden lg:flex gap-1 bg-white/70 p-1 rounded-full border border-white ml-2">
                         <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#101512] shadow-sm">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                         </button>
                         <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-[#101512] transition-colors">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                         </button>
                       </div>
                     </div>
                  </div>

                  {view === "products" ? (
                    <ProductGrid favoriteProductIds={favoriteIdSet} products={shownProducts} onDetail={openProduct} onFavoriteToggle={toggleFavorite} onTryOn={goToTryOn} />
                  ) : null}

                  {view === "outfits" ? (
                    <OutfitGrid outfits={outfits} onTryOn={goToTryOn} />
                  ) : null}

                  <Pagination pagination={pagination} setFilters={setFilters} />
                </div>
              </div>
            </div>
          ) : (
            <div className="section-shell">
              <PageHeader eyebrow={t("app.eyebrow")} title={pageTitle} description={pageDescription} />
              
              {view === "favorites" ? (
                <ProductGrid emptyText={t("app.noFavorites")} favoriteProductIds={favoriteIdSet} products={favoriteProducts} onDetail={openProduct} onFavoriteToggle={toggleFavorite} onTryOn={goToTryOn} />
              ) : null}

              {view === "stylist" ? (
                <StylistPanel budget={stylistBudget} prompt={stylistPrompt} result={stylistResult} status={stylistStatus} setBudget={setStylistBudget} setPrompt={setStylistPrompt} onSubmit={runStylist} onTryOn={goToTryOn} onDetail={openProduct} />
              ) : null}

              {view === "profile" ? (
                <ProfilePanel form={profileForm} photoNotice={profilePhotoNotice} setForm={setProfileForm} onPhotoUpload={uploadProfilePhoto} onSubmit={saveProfile} user={user} />
              ) : null}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function CatalogFilters({ applyFilters, filters, setFilters }) {
  const { t } = useLanguage();
  const update = (field) => (event) => setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  const categories = [
    { value: "Áo", labelKey: "marketplace.category.shirt" },
    { value: "Quần", labelKey: "marketplace.category.pants" },
    { value: "Váy / Đầm", labelKey: "marketplace.category.dress" },
    { value: "Áo khoác", labelKey: "marketplace.category.jacket" },
    { value: "Phụ kiện", labelKey: "marketplace.category.accessory" },
    { value: "Giày dép", labelKey: "marketplace.category.shoes" },
  ];
  
  return (
    <div 
      className="w-full p-6 sm:p-8 relative overflow-hidden group"
      style={{
        background: "rgba(255, 255, 255, 0.35)",
        backdropFilter: "blur(28px) saturate(130%)",
        WebkitBackdropFilter: "blur(28px) saturate(130%)",
        border: "1px solid rgba(255, 255, 255, 0.75)",
        borderRadius: "28px",
        boxShadow: "0 20px 60px rgba(80, 110, 70, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)"
      }}
    >
      {/* Liquid Inner Highlight */}
      <div 
        className="absolute inset-[1px] pointer-events-none"
        style={{
          borderRadius: "inherit",
          background: "linear-gradient(135deg, rgba(255,255,255,0.55), transparent 35%, transparent 70%, rgba(255,255,255,0.15))"
        }}
      />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <h2 className="text-xl font-extrabold text-[#101512] flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          {t("marketplace.filters")}
        </h2>
        <button className="text-sm font-semibold text-gray-500 hover:text-[#101512] transition-colors" onClick={() => setFilters({search: "", category: "", gender: "", minPrice: "", maxPrice: "", page: 1})}>{t("marketplace.reset")}</button>
      </div>

      <div className="relative z-10 grid gap-8">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
          <input type="text" placeholder={t("marketplace.searchPlaceholder")} value={filters.search} onChange={update("search")} className="w-full bg-white/70 border border-white/80 rounded-full py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#91B76F]/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-gray-400" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#101512] mb-4 flex justify-between items-center">
            {t("marketplace.category")} <span className="text-gray-400">˅</span>
          </h3>
          <div className="grid gap-3">
            {categories.map((category) => (
              <label key={category.value} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-5 h-5 rounded-[6px] border-gray-300 text-[#91B76F] focus:ring-[#91B76F] transition-colors" checked={filters.category === category.value} onChange={() => setFilters(prev => ({...prev, category: filters.category === category.value ? "" : category.value}))} />
                <span className="text-sm font-medium text-gray-600 group-hover:text-[#101512] transition-colors">{t(category.labelKey)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#101512] mb-4 flex justify-between items-center">
            {t("marketplace.gender")} <span className="text-gray-400">˅</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilters(prev => ({...prev, gender: ""}))} className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${!filters.gender ? 'bg-[#91B76F] text-white shadow-sm' : 'bg-white/60 text-gray-600 hover:bg-white border border-white'}`}>{t("marketplace.all")}</button>
            <button onClick={() => setFilters(prev => ({...prev, gender: "female"}))} className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${filters.gender === 'female' ? 'bg-[#91B76F] text-white shadow-sm' : 'bg-white/60 text-gray-600 hover:bg-white border border-white'}`}>{t("marketplace.female")}</button>
            <button onClick={() => setFilters(prev => ({...prev, gender: "male"}))} className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${filters.gender === 'male' ? 'bg-[#91B76F] text-white shadow-sm' : 'bg-white/60 text-gray-600 hover:bg-white border border-white'}`}>{t("marketplace.male")}</button>
            <button onClick={() => setFilters(prev => ({...prev, gender: "unisex"}))} className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${filters.gender === 'unisex' ? 'bg-[#91B76F] text-white shadow-sm' : 'bg-white/60 text-gray-600 hover:bg-white border border-white'}`}>Unisex</button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#101512] mb-4">{t("marketplace.priceRange")}</h3>
          <div className="px-2">
            <div className="h-1.5 w-full bg-black/5 rounded-full relative mb-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
              <div className="absolute left-[10%] right-[30%] h-full bg-[#91B76F] rounded-full"></div>
              <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#91B76F] rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#91B76F] rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-500">
              <span>0 đ</span>
              <span>5.000.000 đ+</span>
            </div>
          </div>
        </div>
        
        <Button onClick={applyFilters} className="w-full mt-2 bg-[#101512] text-white !rounded-full hover:opacity-90 shadow-md">
          Áp dụng
        </Button>
      </div>
    </div>
  );
}

function ProductGrid({ emptyText, favoriteProductIds = new Set(), onDetail, onFavoriteToggle, onTryOn, products }) {
  const { t } = useLanguage();
  if (!products.length) return <div className="mt-6"><EmptyState text={emptyText || t("app.noProducts")} /></div>;
  return (
    <div className="mt-6 grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          isFavorite={favoriteProductIds.has(product.id)}
          product={product}
          onDetail={onDetail}
          onFavoriteToggle={onFavoriteToggle}
          onTryOn={onTryOn}
          showPurchaseActions
        />
      ))}
    </div>
  );
}

function OutfitGrid({ onTryOn, outfits }) {
  const { t } = useLanguage();
  if (!outfits.length) return <div className="mt-6"><EmptyState text={t("app.noOutfits")} /></div>;
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      {outfits.map((outfit) => (
        <article key={outfit.id} className="miroir-card p-4">
          <h3 className="text-xl font-extrabold text-ink">{outfit.title}</h3>
          <p className="mt-1 text-sm text-muted">{outfit.description || t("app.outfitItems", { count: outfit.products.length })}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {outfit.products.slice(0, 3).map((product) => (
              <button key={product.id} type="button" className="aspect-square overflow-hidden rounded-lg bg-white/80" onClick={() => onTryOn(product)}>
                {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function StylistPanel({ budget, onSubmit, onDetail, onTryOn, prompt, result, setBudget, setPrompt, status }) {
  const { t } = useLanguage();
  const outfits = result?.outfits || [];

  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-[420px_1fr]">
      <form onSubmit={onSubmit} className="glass-panel p-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose">{t("app.promptStylist")}</p>
        <h2 className="mt-2 text-2xl font-extrabold">{t("app.describeMoment")}</h2>
        <textarea
          className="miroir-field mt-4 min-h-40 resize-none"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("app.promptPlaceholder")}
        />
        <TextField className="mt-3" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder={t("app.budgetPlaceholder")} />
        <Button className="mt-4 w-full" disabled={status === "loading"} type="submit">
          {status === "loading" ? t("app.generating") : t("app.generate")}
        </Button>
      </form>
      <div className="grid gap-4">
        {result?.message ? <div className="rounded-lg border border-red-300/45 bg-red-300/14 p-4 text-red-700">{result.message}</div> : null}
        {outfits.map((outfit) => (
          <div key={outfit.id} className="miroir-card p-4">
            <h3 className="text-xl font-extrabold text-ink">{outfit.title}</h3>
            <p className="mt-1 text-sm text-muted">{outfit.whyItMatches}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(outfit.items || []).map((item) => item.product ? (
                <ProductCard key={item.product.id} product={item.product} onDetail={onDetail} onTryOn={onTryOn} showPurchaseActions />
              ) : null)}
            </div>
          </div>
        ))}
        {status === "idle" && !outfits.length ? <EmptyState title={t("app.readyTitle")} text={t("app.readyText")} /> : null}
      </div>
    </section>
  );
}

function ProfilePanel({ form, onPhotoUpload, onSubmit, photoNotice, setForm, user }) {
  const { t } = useLanguage();
  const update = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* LEFT: Model Photo */}
      <aside className="glass-panel flex flex-col p-4 sm:p-6">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-[2rem] bg-white/80 border border-line shadow-inner">
          {user?.profile?.modelImageUrl ? (
            <img src={user.profile.modelImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm font-medium text-muted/60">
              {t("app.modelPhotoHint")}
            </div>
          )}
        </div>
        <div className="mt-5 rounded-2xl border border-rose/10 bg-rose/5 p-4 sm:mt-6">
          <p className="text-sm leading-relaxed text-roseDeep/80">{t("app.profileHelp")}</p>
        </div>
        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted">{t("onboarding.savedPhoto")}</span>
          <input className="miroir-field" type="file" accept="image/*" onChange={onPhotoUpload} />
        </label>
        {photoNotice ? <p className="mt-3 text-xs font-semibold text-muted">{photoNotice}</p> : null}
      </aside>

      {/* RIGHT: Profile Info & Measurements */}
      <section className="glass-panel flex flex-col p-4 sm:p-6 md:p-8">
        <header className="mb-6 sm:mb-8">
          <h2 className="editorial-title text-2xl font-extrabold text-ink sm:text-3xl">{t("app.profileDetails")}</h2>
          <p className="mt-2 text-sm text-muted sm:text-base">{t("app.profileDescription")}</p>
        </header>

        <div className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-2">
          <a href="/app/orders" className="group rounded-2xl border border-line bg-white p-4 transition hover:border-mintDeep hover:bg-accentSoft">
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-black text-ink">Đơn hàng</p><p className="mt-1 text-sm text-muted">Theo dõi đơn, thanh toán và hoàn tiền</p></div>
              <span className="text-xl text-mintDeep transition group-hover:translate-x-1">→</span>
            </div>
          </a>
          <a href="/app/addresses" className="group rounded-2xl border border-line bg-white p-4 transition hover:border-mintDeep hover:bg-accentSoft">
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-black text-ink">Sổ địa chỉ</p><p className="mt-1 text-sm text-muted">Quản lý người nhận và địa chỉ mặc định</p></div>
              <span className="text-xl text-mintDeep transition group-hover:translate-x-1">→</span>
            </div>
          </a>
        </div>

        {/* BASIC INFO */}
        <div className="mb-6 grid gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-5">
          <SelectField label={t("profile.gender")} value={form.gender || ""} onChange={update("gender")}>
            <option value="" disabled>{t("profile.gender")}</option>
            <option value="female">{t("common.female")}</option>
            <option value="male">{t("common.male")}</option>
            <option value="unisex">{t("common.unisex")}</option>
          </SelectField>

          <SelectField label={t("profile.bodyShape")} value={form.bodyShape || ""} onChange={update("bodyShape")}>
            <option value="" disabled>{t("profile.bodyShape")}</option>
            <option value="hourglass">{t("profile.shape.hourglass")}</option>
            <option value="pear">{t("profile.shape.pear")}</option>
            <option value="apple">{t("profile.shape.apple")}</option>
            <option value="rectangle">{t("profile.shape.rectangle")}</option>
            <option value="inverted_triangle">{t("profile.shape.invertedTriangle")}</option>
          </SelectField>

          <SelectField label={t("profile.skinTone")} value={form.skinTone || ""} onChange={update("skinTone")}>
            <option value="" disabled>{t("profile.skinTone")}</option>
            <option value="light">{t("profile.skin.light")}</option>
            <option value="medium">{t("profile.skin.medium")}</option>
            <option value="dark">{t("profile.skin.dark")}</option>
          </SelectField>

          <SelectField label={t("profile.stylePreferences")} value={form.stylePreferences || ""} onChange={update("stylePreferences")}>
            <option value="" disabled>{t("profile.stylePreferences")}</option>
            <option value="minimal">{t("profile.style.minimal")}</option>
            <option value="streetwear">{t("profile.style.streetwear")}</option>
            <option value="elegant">{t("profile.style.elegant")}</option>
            <option value="vintage">{t("profile.style.vintage")}</option>
            <option value="casual">{t("profile.style.casual")}</option>
          </SelectField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:hidden">
          <TextField type="number" label={t("profile.height")} placeholder="cm" value={form.height || ""} onChange={update("height")} />
          <TextField type="number" label={t("profile.weight")} placeholder="kg" value={form.weight || ""} onChange={update("weight")} />
          <TextField type="number" label={t("profile.shoulder")} placeholder="cm" value={form.shoulder || ""} onChange={update("shoulder")} />
          <TextField type="number" label={t("profile.bust")} placeholder="cm" value={form.bust || ""} onChange={update("bust")} />
          <TextField type="number" label={t("profile.waist")} placeholder="cm" value={form.waist || ""} onChange={update("waist")} />
          <TextField type="number" label={t("profile.hips")} placeholder="cm" value={form.hips || ""} onChange={update("hips")} />
        </div>

        {/* MEASUREMENTS WITH HUMAN SHAPE */}
        <div className="relative hidden w-full items-center justify-center overflow-hidden rounded-[2rem] border border-white/5 bg-panel px-4 py-12 shadow-inner md:flex md:min-h-[550px] md:px-8">
          
          {/* SVG Silhouette */}
          <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
            <svg viewBox="0 0 100 250" className="h-[90%] max-h-[500px] text-ink drop-shadow-2xl" fill="currentColor">
              <path d="M50 10 C42 10 37 16 37 25 C37 34 42 40 46 41 L46 46 C32 48 24 55 22 65 L18 135 A 4 4 0 0 0 26 135 L30 75 L32 120 C32 135 28 145 28 160 L28 235 A 4 4 0 0 0 36 235 L42 150 L50 145 L58 150 L64 235 A 4 4 0 0 0 72 235 L72 160 C72 145 68 135 68 120 L70 75 L74 135 A 4 4 0 0 0 82 135 L78 65 C76 55 68 48 54 46 L54 41 C58 40 63 34 63 25 C63 16 58 10 50 10 Z" />
            </svg>
          </div>

          {/* The inputs absolutely positioned around the shape */}
          <div className="absolute inset-0 max-w-2xl mx-auto pointer-events-none">
            {/* Height */}
            <div className="absolute top-[8%] left-[5%] md:left-[10%] w-[120px] md:w-[140px] pointer-events-auto">
              <TextField type="number" label={t("profile.height")} placeholder="cm" value={form.height || ""} onChange={update("height")} className="!bg-canvas/80 backdrop-blur-md" />
            </div>

            {/* Weight */}
            <div className="absolute top-[8%] right-[5%] md:right-[10%] w-[120px] md:w-[140px] pointer-events-auto">
              <TextField type="number" label={t("profile.weight")} placeholder="kg" value={form.weight || ""} onChange={update("weight")} className="!bg-canvas/80 backdrop-blur-md" />
            </div>

            {/* Shoulder */}
            <div className="absolute top-[18%] right-[5%] md:right-[15%] w-[120px] md:w-[140px] pointer-events-auto">
              <div className="relative">
                {/* Visual Line pointing to shoulder */}
                <div className="hidden md:block absolute right-full top-1/2 w-12 h-px bg-rose/30 -translate-y-1/2 mr-2"></div>
                <TextField type="number" label={t("profile.shoulder")} placeholder="cm" value={form.shoulder || ""} onChange={update("shoulder")} className="!bg-canvas/80 backdrop-blur-md" />
              </div>
            </div>

            {/* Bust */}
            <div className="absolute top-[30%] left-[5%] md:left-[15%] w-[120px] md:w-[140px] pointer-events-auto">
              <div className="relative">
                <div className="hidden md:block absolute left-full top-1/2 w-12 h-px bg-rose/30 -translate-y-1/2 ml-2"></div>
                <TextField type="number" label={t("profile.bust")} placeholder="cm" value={form.bust || ""} onChange={update("bust")} className="!bg-canvas/80 backdrop-blur-md" />
              </div>
            </div>

            {/* Waist */}
            <div className="absolute top-[44%] right-[5%] md:right-[15%] w-[120px] md:w-[140px] pointer-events-auto">
              <div className="relative">
                <div className="hidden md:block absolute right-full top-1/2 w-12 h-px bg-rose/30 -translate-y-1/2 mr-2"></div>
                <TextField type="number" label={t("profile.waist")} placeholder="cm" value={form.waist || ""} onChange={update("waist")} className="!bg-canvas/80 backdrop-blur-md" />
              </div>
            </div>

            {/* Hips */}
            <div className="absolute top-[56%] left-[5%] md:left-[15%] w-[120px] md:w-[140px] pointer-events-auto">
              <div className="relative">
                <div className="hidden md:block absolute left-full top-1/2 w-12 h-px bg-rose/30 -translate-y-1/2 ml-2"></div>
                <TextField type="number" label={t("profile.hips")} placeholder="cm" value={form.hips || ""} onChange={update("hips")} className="!bg-canvas/80 backdrop-blur-md" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-line pt-6 sm:mt-8">
          <Button type="submit" className="w-full !px-8 !py-3.5 shadow-glow sm:w-auto sm:!px-12 sm:!py-4">{t("common.saveProfile")}</Button>
        </div>
      </section>
    </form>
  );
}

function ProductModal({ feedbackNotice, isFavorite, onClose, onFavoriteToggle, onFeedback, onTryOn, product }) {
  const { t } = useLanguage();
  const [feedbackForm, setFeedbackForm] = useState({ rating: "5", fitFeedback: "true_to_size", comment: "" });
  const availableVariants = (product.variants || []).filter((item) => item.active && item.stockQuantity > 0);
  const [variantId, setVariantId] = useState(availableVariants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState("");
  const updateFeedback = (field) => (event) => setFeedbackForm((previous) => ({ ...previous, [field]: event.target.value }));
  const submitFeedback = (event) => {
    event.preventDefault();
    onFeedback(product, { ...feedbackForm, rating: Number(feedbackForm.rating), context: "product" });
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-5xl">
      <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-white/80">
          {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose">{product.category || "Product"}</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">{product.name}</h2>
              <p className="mt-2 text-2xl font-black text-rose">{formatMoney(product.price)}</p>
            </div>
            <button type="button" className="soft-button px-4 py-2" onClick={onClose}>{t("common.close")}</button>
          </div>
          <p className="mt-5 text-sm leading-7 text-muted">{product.description}</p>
          {availableVariants.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><SelectField label="Biến thể" value={variantId} onChange={(event) => setVariantId(event.target.value)}>{availableVariants.map((item) => <option key={item.id} value={item.id}>{item.color || "Mặc định"} · {item.size || "Một cỡ"} · còn {item.stockQuantity}</option>)}</SelectField><TextField label="Số lượng" type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></div> : <p className="mt-4 font-bold text-red-600">Sản phẩm chưa có tồn kho khả dụng.</p>}
          {product.shop ? (
            <div className="mt-5 rounded-lg border border-line bg-white/80 p-4 text-sm text-muted">
              <p><strong className="text-ink">{t("product.shop")}</strong> {product.shop.name}</p>
              <p><strong className="text-ink">{t("product.contact")}</strong> {product.shop.contact?.address || product.shop.contact?.email || t("product.notProvided")}</p>
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-line bg-white/80 p-4 text-sm text-muted">Thông tin shop hiện không khả dụng.</p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => onTryOn(product)}>{t("common.tryOn")}</Button>
            <Button disabled={!variantId} onClick={async () => { try { await addCartItem({ productId: product.id, variantId, quantity }); window.dispatchEvent(new Event("miroir:cart-updated")); setCartNotice("Đã thêm vào giỏ hàng."); } catch (error) { setCartNotice(error.response?.data?.message || "Không thể thêm vào giỏ."); } }}>Thêm vào giỏ</Button>
            {onFavoriteToggle ? (
              <Button variant="secondary" onClick={() => onFavoriteToggle(product)}>
                {isFavorite ? t("product.removeFavorite") : t("product.addFavorite")}
              </Button>
            ) : null}
            {product.shopId ? (
              <a className="soft-button px-5 py-3" href={`/app/shops/${encodeURIComponent(product.shopId)}`}>
                {t("shopPage.viewShop")}
              </a>
            ) : null}
          </div>
          {cartNotice ? <p className="mt-3 text-sm font-bold text-accentStrong">{cartNotice} <a className="underline" href="/app/cart">Xem giỏ</a></p> : null}
          <form onSubmit={submitFeedback} className="mt-5 grid gap-3 rounded-lg border border-line bg-white/80 p-4">
            <p className="text-sm font-bold text-ink">{t("product.feedback")}</p>
            <SelectField value={feedbackForm.rating} onChange={updateFeedback("rating")}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{t("product.feedbackStars", { count: rating })}</option>)}
            </SelectField>
            <SelectField value={feedbackForm.fitFeedback} onChange={updateFeedback("fitFeedback")}>
              <option value="true_to_size">{t("product.trueToSize")}</option>
              <option value="runs_small">{t("product.runsSmall")}</option>
              <option value="runs_large">{t("product.runsLarge")}</option>
              <option value="not_sure">{t("product.notSure")}</option>
            </SelectField>
            <textarea className="miroir-field min-h-24 resize-none" placeholder={t("product.shareFeedback")} value={feedbackForm.comment} onChange={updateFeedback("comment")} />
            <Button type="submit" variant="secondary">{t("common.submitFeedback")}</Button>
            {feedbackNotice ? <p className="text-xs text-muted">{feedbackNotice}</p> : null}
          </form>
        </div>
      </div>
    </Modal>
  );
}

function Pagination({ pagination, setFilters }) {
  const { t } = useLanguage();
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => setFilters((previous) => ({ ...previous, page: pagination.page - 1 }))}>{t("common.prev")}</Button>
      <span className="text-sm font-bold text-muted">{t("common.page", { page: pagination.page, totalPages: pagination.totalPages })}</span>
      <Button variant="secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((previous) => ({ ...previous, page: pagination.page + 1 }))}>{t("common.next")}</Button>
    </div>
  );
}

const compact = (value) => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== "" && item !== undefined && item !== null));
const flattenProfile = (profile) => ({ ...(profile.measurements || {}), ...profile, stylePreferences: (profile.stylePreferences || []).join(", ") });
const labelFor = (value) => value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());

export default UserAppPage;
