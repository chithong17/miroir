import { useEffect, useMemo, useState } from "react";
import {
  listCatalogOutfits,
  listCatalogProducts,
  submitProductFeedback,
} from "../api/catalogApi.js";
import { getStylistRecommendation } from "../api/stylistApi.js";
import {
  createUserPayment,
  getUserMe,
  listPaymentPlans,
  listUserFavoriteProducts,
  saveUserProfile,
  setUserToken,
  toggleUserFavoriteProduct,
  uploadUserProfilePhoto,
} from "../api/userApi.js";
import {
  AppShell,
  Button,
  EmptyState,
  Modal,
  PageHeader,
  ProductCard,
  SegmentedTabs,
  SelectField,
  StatusBadge,
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
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [profilePhotoNotice, setProfilePhotoNotice] = useState("");

  const subscription = user?.subscription || {};
  const isPremium = Boolean(subscription.isPremium);
  const tryOnUsage = subscription.usage;
  const freeTryOnRemaining = tryOnUsage?.remaining ?? 5;
  const userPremiumPlan = paymentPlans.find((plan) => plan.code === "USER_PREMIUM_MONTHLY");

  useEffect(() => {
    getUserMe()
      .then((response) => {
        setUser(response.user);
        setFavoriteProductIds(response.user?.favoriteProductIds || []);
        setProfileForm(flattenProfile(response.user.profile || {}));
      })
      .catch(() => {
        setUserToken("");
        window.location.href = "/login";
      });
    listPaymentPlans()
      .then((response) => setPaymentPlans(response.plans || []))
      .catch(() => setPaymentPlans([]));
  }, []);

  useEffect(() => {
    if (view === "outfits") loadOutfits();
    if (view === "products") loadProducts();
    if (view === "favorites") loadFavorites();
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

  const loadFavorites = async () => {
    const response = await listUserFavoriteProducts();
    const nextProducts = response.products || [];
    setFavoriteProducts(nextProducts);
  };

  const applyFilters = () => {
    setFilters((previous) => ({ ...previous, page: 1 }));
    setTimeout(() => (view === "outfits" ? loadOutfits() : loadProducts()), 0);
  };

  const goToTryOn = (product) => {
    if (!product?.id) return;
    if (!isPremium && freeTryOnRemaining <= 0) {
      setPaymentStatus(t("tryon.limitReached"));
      return;
    }
    window.location.href = `/app/try-on?productId=${encodeURIComponent(product.id)}`;
  };

  const startPremiumCheckout = async () => {
    try {
      setPaymentStatus(t("payment.creating"));
      const response = await createUserPayment();
      window.location.href = response.checkoutUrl;
    } catch (error) {
      setPaymentStatus(error.response?.data?.message || t("payment.createError"));
    }
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
      setPaymentStatus(error.response?.data?.message || t("app.favoriteError"));
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
      <main className="section-shell py-8">
        <PageHeader
          eyebrow={t("app.eyebrow")}
          title={pageTitle}
          description={pageDescription}
          action={view === "products" || view === "outfits" ? (
            <SegmentedTabs
              items={[
                { value: "products", label: t("app.products") },
                { value: "outfits", label: t("app.outfits") },
              ]}
              value={view}
              onChange={setView}
            />
          ) : null}
        />

        {view === "products" || view === "outfits" ? (
          <CatalogFilters filters={filters} setFilters={setFilters} applyFilters={applyFilters} />
        ) : null}

        {view === "products" ? (
          <ProductGrid
            favoriteProductIds={favoriteIdSet}
            products={shownProducts}
            onDetail={setSelectedProduct}
            onFavoriteToggle={toggleFavorite}
            onTryOn={goToTryOn}
          />
        ) : null}

        {view === "favorites" ? (
          <ProductGrid
            emptyText={t("app.noFavorites")}
            favoriteProductIds={favoriteIdSet}
            products={favoriteProducts}
            onDetail={setSelectedProduct}
            onFavoriteToggle={toggleFavorite}
            onTryOn={goToTryOn}
          />
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
            isPremium={isPremium}
            plan={userPremiumPlan}
            prompt={stylistPrompt}
            result={stylistResult}
            status={stylistStatus}
            setBudget={setStylistBudget}
            setPrompt={setStylistPrompt}
            onSubmit={runStylist}
            onTryOn={goToTryOn}
            onUpgrade={startPremiumCheckout}
            onDetail={setSelectedProduct}
          />
        ) : null}

        {view === "profile" ? (
          <ProfilePanel
            form={profileForm}
            photoNotice={profilePhotoNotice}
            setForm={setProfileForm}
            onPhotoUpload={uploadProfilePhoto}
            onSubmit={saveProfile}
            user={user}
          />
        ) : null}
      </main>

      {selectedProduct ? (
        <ProductModal
          feedbackNotice={feedbackNotice}
          product={selectedProduct}
          onClose={() => {
            setSelectedProduct(null);
            setFeedbackNotice("");
          }}
          onFeedback={sendProductFeedback}
          isFavorite={favoriteIdSet.has(selectedProduct.id)}
          onFavoriteToggle={toggleFavorite}
          onTryOn={goToTryOn}
        />
      ) : null}
    </AppShell>
  );
}

function CatalogFilters({ applyFilters, filters, setFilters }) {
  const { t } = useLanguage();
  const update = (field) => (event) => setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  const fields = (
    <>
      <TextField placeholder={t("common.search")} value={filters.search} onChange={update("search")} />
      <TextField placeholder={t("common.category")} value={filters.category} onChange={update("category")} />
      <SelectField value={filters.gender} onChange={update("gender")}>
        <option value="">{t("common.gender")}</option>
        <option value="female">{t("common.female")}</option>
        <option value="male">{t("common.male")}</option>
        <option value="unisex">{t("common.unisex")}</option>
      </SelectField>
      <TextField placeholder={t("common.minPrice")} value={filters.minPrice} onChange={update("minPrice")} />
      <TextField placeholder={t("common.maxPrice")} value={filters.maxPrice} onChange={update("maxPrice")} />
      <Button onClick={applyFilters}>{t("common.filter")}</Button>
    </>
  );

  return (
    <>
      <details className="miroir-card mt-5 md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-ink [&::-webkit-details-marker]:hidden">
          <span>{t("common.filter")}</span>
          <span className="rounded-full bg-accentSoft px-3 py-1 text-xs text-ink">v</span>
        </summary>
        <div className="mt-4 grid gap-3">
          {fields}
        </div>
      </details>

      <div className="miroir-card mt-6 hidden gap-3 md:grid md:grid-cols-6">
        {fields}
      </div>
    </>
  );
}

function SubscriptionBanner({ isPremium, onUpgrade, paymentStatus, plan, subscription, tryOnUsage }) {
  const { t } = useLanguage();

  return (
    <section className="miroir-card mt-6 flex flex-wrap items-center justify-between gap-4 p-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={isPremium ? t("app.premium") : t("app.free")} tone={isPremium ? "success" : "neutral"} />
          <p className="text-sm font-bold text-ink">
            {isPremium ? t("app.premiumMessage") : t("app.freeMessage", { remaining: tryOnUsage?.remaining ?? 5 })}
          </p>
        </div>
        {!isPremium && plan ? (
          <p className="mt-1 text-xs text-muted">{t("app.premiumPrice", { amount: formatMoney(plan.amount), days: plan.durationDays })}</p>
        ) : null}
        {isPremium && subscription.expiresAt ? (
          <p className="mt-1 text-xs text-muted">{t("app.expiresAt", { date: new Date(subscription.expiresAt).toLocaleDateString("vi-VN") })}</p>
        ) : null}
        {paymentStatus ? <p className="mt-1 text-xs text-rose">{paymentStatus}</p> : null}
      </div>
      {!isPremium ? (
        <Button onClick={onUpgrade}>{t("app.upgrade", { amount: formatMoney(plan?.amount || 49000) })}</Button>
      ) : null}
    </section>
  );
}

function ProductGrid({ emptyText, favoriteProductIds = new Set(), onDetail, onFavoriteToggle, onTryOn, products }) {
  const { t } = useLanguage();
  if (!products.length) return <div className="mt-6"><EmptyState text={emptyText || t("app.noProducts")} /></div>;
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          isFavorite={favoriteProductIds.has(product.id)}
          product={product}
          onDetail={onDetail}
          onFavoriteToggle={onFavoriteToggle}
          onTryOn={onTryOn}
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

function StylistPanel({ budget, isPremium, onSubmit, onDetail, onTryOn, onUpgrade, plan, prompt, result, setBudget, setPrompt, status }) {
  const { t } = useLanguage();
  const outfits = result?.outfits || [];

  if (!isPremium) {
    return (
      <section className="glass-panel mt-6 max-w-3xl p-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose">{t("app.premiumStylist")}</p>
        <h2 className="mt-2 text-3xl font-extrabold">{t("app.unlockStylist")}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          {t("app.premiumStylistDescription", { amount: formatMoney(plan?.amount || 49000) })}
        </p>
        <Button className="mt-5" onClick={onUpgrade}>{t("app.upgradePremium")}</Button>
      </section>
    );
  }

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
                <ProductCard key={item.product.id} product={item.product} onDetail={onDetail} onTryOn={onTryOn} />
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
          {product.shop ? (
            <div className="mt-5 rounded-lg border border-line bg-white/80 p-4 text-sm text-muted">
              <p><strong className="text-ink">{t("product.shop")}</strong> {product.shop.name}</p>
              <p><strong className="text-ink">{t("product.contact")}</strong> {product.shop.contact?.address || product.shop.contact?.email || t("product.notProvided")}</p>
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-line bg-white/80 p-4 text-sm text-muted">{t("product.shopPremium")}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => onTryOn(product)}>{t("common.tryOn")}</Button>
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
