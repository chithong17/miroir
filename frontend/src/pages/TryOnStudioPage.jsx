import { useEffect, useState } from "react";
import { getCatalogProduct, listCatalogProducts, submitProductFeedback } from "../api/catalogApi.js";
import { createCatalogTryOnTask, createCustomTryOnTask, createTryOnTask, getTryOnTaskStatus } from "../api/tryonApi.js";
import { createUserPayment, getUserMe, getUserToken, listPaymentPlans, setUserToken } from "../api/userApi.js";
import { AppShell, Button, EmptyState, PageHeader, ProductCard, SegmentedTabs, SelectField, StatusBadge, TextField, TopNav, formatMoney } from "../components/ui/index.jsx";
import { useLanguage } from "../i18n.jsx";

function TryOnStudioPage() {
  const { t } = useLanguage();
  const params = new URLSearchParams(window.location.search);
  const initialProductId = params.get("productId") || "";
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [customTryOnType, setCustomTryOnType] = useState("dress");
  const [dressFile, setDressFile] = useState(null);
  const [upperFile, setUpperFile] = useState(null);
  const [lowerFile, setLowerFile] = useState(null);
  const [dressPreview, setDressPreview] = useState("");
  const [upperPreview, setUpperPreview] = useState("");
  const [lowerPreview, setLowerPreview] = useState("");
  const [modelFile, setModelFile] = useState(null);
  const [modelPreview, setModelPreview] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [completedTryOnProductId, setCompletedTryOnProductId] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({ rating: "5", fitFeedback: "true_to_size", comment: "" });
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const userPremiumPlan = paymentPlans.find((plan) => plan.code === "USER_PREMIUM_MONTHLY");

  useEffect(() => {
    listPaymentPlans().then((response) => setPaymentPlans(response.plans || [])).catch(() => setPaymentPlans([]));
    if (!getUserToken()) return;
    getUserMe()
      .then((response) => {
        setUser(response.user);
        setModelPreview(response.user.profile?.modelImageUrl || "");
      })
      .catch(() => {
        setUserToken("");
        setUser(null);
      });
  }, []);

  useEffect(() => {
    if (!initialProductId) return;
    loadProduct(initialProductId);
  }, [initialProductId]);

  const loadProduct = async (productId) => {
    setMessage("");
    setDressFile(null); setDressPreview("");
    setUpperFile(null); setUpperPreview("");
    setLowerFile(null); setLowerPreview("");
    const response = await getCatalogProduct(productId);
    setProduct(response.product);
    setResultUrl("");
    setCompletedTryOnProductId("");
    setFeedbackNotice("");
    const related = await listCatalogProducts({ category: response.product.category, shopId: response.product.shopId, limit: 8 });
    setRelatedProducts((related.products || []).filter((item) => item.id !== productId));
    window.history.replaceState(null, "", `/app/try-on?productId=${productId}`);
  };

  const setGarmentFile = (field, file) => {
    const preview = file ? URL.createObjectURL(file) : "";
    if (field === "dress") {
      setDressFile(file);
      setDressPreview(preview);
      if (file) {
        setUpperFile(null);
        setLowerFile(null);
        setUpperPreview("");
        setLowerPreview("");
      }
    }
    if (field === "upper") {
      setUpperFile(file);
      setUpperPreview(preview);
      if (file) {
        setDressFile(null);
        setDressPreview("");
      }
    }
    if (field === "lower") {
      setLowerFile(file);
      setLowerPreview(preview);
      if (file) {
        setDressFile(null);
        setDressPreview("");
      }
    }
  };

  const onModelFile = (event) => {
    const file = event.target.files?.[0] || null;
    setModelFile(file);
    if (file) setModelPreview(URL.createObjectURL(file));
  };

  const poll = async (taskId, feedbackProductId = "") => {
    setStatus("processing");
    setMessage("Task created. Waiting for the first result check...");
    for (let attempt = 0; attempt < 72; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 15000 : 5000));
      const response = await getTryOnTaskStatus(taskId);
      if (response.status === "completed" && response.resultUrl) {
        setResultUrl(response.resultUrl);
        setCompletedTryOnProductId(feedbackProductId);
        setStatus("completed");
        setMessage("");
        return;
      }
      if (response.status === "completed" && !response.resultUrl) {
        setStatus("error");
        setMessage("Task completed, but the result image was not returned.");
        return;
      }
      if (response.status === "failed" || response.success === false) {
        setStatus("error");
        setMessage(response.errorMessage || "Try-on failed.");
        return;
      }
      setMessage("Still processing. MIROIR is checking the result...");
    }
    setStatus("processing");
    setMessage("Still processing after several minutes. Please keep this page open and try again shortly.");
  };

  const startTryOn = async () => {
    const isLoggedIn = Boolean(getUserToken());
    const hasUploads = Boolean(dressFile || upperFile || lowerFile);
    const isPlatform = !hasUploads && Boolean(product);

    if (!isPlatform && !hasUploads) return setMessage("Choose a platform product or upload a garment first.");
    if (isPlatform && !isLoggedIn) return setMessage("Please log in to try on platform products.");
    if (hasUploads && !isLoggedIn && !modelFile) return setMessage("Upload your original photo first.");
    if (hasUploads && customTryOnType === "dress" && !dressFile) return setMessage("Upload a dress garment image first.");
    if (hasUploads && customTryOnType === "upper_lower" && !upperFile && !lowerFile) return setMessage("Upload at least one upper or lower garment image first.");

    setStatus("loading");
    setMessage("");
    setPaymentRequired(false);
    setResultUrl("");
    setCompletedTryOnProductId("");
    setFeedbackNotice("");

    try {
      let response;
      if (isPlatform) {
        response = await createCatalogTryOnTask({ productId: product.id, modelImage: modelFile });
      } else if (isLoggedIn) {
        response = await createCustomTryOnTask({ tryOnType: customTryOnType, modelImage: modelFile, dressImage: dressFile, upperImage: upperFile, lowerImage: lowerFile });
      } else {
        const formData = new FormData();
        formData.append("tryOnType", customTryOnType);
        formData.append("batchSize", "1");
        if (modelFile) formData.append("modelImage", modelFile);
        if (dressFile) formData.append("dressImage", dressFile);
        if (upperFile) formData.append("upperImage", upperFile);
        if (lowerFile) formData.append("lowerImage", lowerFile);
        response = await createTryOnTask(formData);
      }
      if (response.usage) {
        setUser((previous) => previous ? { ...previous, subscription: { ...(previous.subscription || {}), usage: response.usage } } : previous);
      }
      await poll(response.taskId, isPlatform ? product.id : "");
    } catch (error) {
      setStatus("error");
      setPaymentRequired(Boolean(error.response?.data?.subscriptionRequired));
      setMessage(error.response?.data?.message || "Could not start try-on.");
    }
  };

  const startPremiumCheckout = async () => {
    try {
      setMessage(t("payment.creating"));
      const response = await createUserPayment();
      window.location.href = response.checkoutUrl;
    } catch (error) {
      setMessage(error.response?.data?.message || t("payment.createError"));
    }
  };

  const updateFeedback = (field) => (event) => setFeedbackForm((previous) => ({ ...previous, [field]: event.target.value }));
  const sendTryOnFeedback = async (event) => {
    event.preventDefault();
    if (!product?.id) return;
    try {
      setFeedbackNotice("Saving feedback...");
      await submitProductFeedback(product.id, { ...feedbackForm, rating: Number(feedbackForm.rating), context: "tryon" });
      setFeedbackNotice("Feedback saved. Thank you.");
    } catch (error) {
      setFeedbackNotice(error.response?.data?.message || "Could not save feedback.");
    }
  };

  const logout = () => {
    setUserToken("");
    window.location.href = "/";
  };

  return (
    <AppShell nav={<TopNav user={user} onLogout={logout} />}>
      <main className="section-shell py-8">
        <PageHeader
          eyebrow={t("tryon.eyebrow")}
          title={t("tryon.title")}
          description={t("tryon.description")}
          action={<a className="soft-button px-5 py-2" href="/app">{t("tryon.back")}</a>}
        />

        {user ? (
          <section className="miroir-card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <StatusBadge status={user.subscription?.isPremium ? t("app.premium") : t("app.free")} tone={user.subscription?.isPremium ? "success" : "neutral"} />
              <p className="mt-2 text-sm text-muted">
                {user.subscription?.isPremium
                  ? t("tryon.premiumUsage")
                  : t("tryon.freeUsage", { remaining: user.subscription?.usage?.remaining ?? 5, amount: formatMoney(userPremiumPlan?.amount || 49000) })}
              </p>
            </div>
            {!user.subscription?.isPremium ? <Button onClick={startPremiumCheckout}>{t("app.upgrade", { amount: formatMoney(userPremiumPlan?.amount || 49000) })}</Button> : null}
          </section>
        ) : null}

        <section className="mt-6 grid gap-5 xl:grid-cols-3">
          <StudioPanel eyebrow="01" title={t("tryon.originalPhoto")}>
            <PreviewFrame image={modelPreview} empty={t("tryon.savedOrUpload")} />
            <div className="mt-auto pt-4">
              <input className="miroir-field" type="file" accept="image/*" onChange={onModelFile} />
              <p className="mt-2 text-xs text-muted">
                {user?.profile?.modelImageUrl ? t("tryon.savedOrUpload") : t("tryon.platformRequires")}
              </p>
            </div>
          </StudioPanel>

          <StudioPanel eyebrow="02" title={t("tryon.productOutfit")}>
            <GarmentPreview product={product} dressPreview={dressPreview} upperPreview={upperPreview} lowerPreview={lowerPreview} />
            {product && !dressFile && !upperFile && !lowerFile ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <h2 className="text-xl font-extrabold text-ink">{product.name}</h2>
                <p className="text-sm text-muted">{product.shop?.name || t("product.detailsForPremium")}</p>
                <p className="mt-1 font-bold text-rose">{formatMoney(product.price)}</p>
              </div>
            ) : null}
            <div className="mt-auto pt-4 border-t border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">{t("tryon.uploadGarment")}</p>
              <div className="grid gap-3">
                <SelectField value={customTryOnType} onChange={(event) => setCustomTryOnType(event.target.value)}>
                  <option value="dress">Dress / one-piece</option>
                  <option value="upper_lower">Upper / lower</option>
                </SelectField>
                {customTryOnType === "dress" ? (
                  <input className="miroir-field" type="file" accept="image/*" onChange={(event) => setGarmentFile("dress", event.target.files?.[0] || null)} />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="miroir-field" type="file" accept="image/*" onChange={(event) => setGarmentFile("upper", event.target.files?.[0] || null)} />
                    <input className="miroir-field" type="file" accept="image/*" onChange={(event) => setGarmentFile("lower", event.target.files?.[0] || null)} />
                  </div>
                )}
              </div>
            </div>
          </StudioPanel>

          <StudioPanel eyebrow="03" title={t("tryon.result")}>
            <PreviewFrame image={resultUrl} empty={t("tryon.resultEmpty")} />
            <div className="mt-auto pt-4">
              <Button className="w-full" disabled={status === "loading" || status === "processing"} onClick={startTryOn}>
                {status === "loading" || status === "processing" ? t("tryon.generating") : t("tryon.generate")}
              </Button>
              {message ? <p className={`mt-3 text-sm ${status === "error" ? "text-red-100" : "text-muted"}`}>{message}</p> : null}
              {paymentRequired ? <Button className="mt-3 w-full" onClick={startPremiumCheckout}>{t("app.upgradePremium")}</Button> : null}
              {status === "completed" && resultUrl && product && completedTryOnProductId === product.id ? (
                <form onSubmit={sendTryOnFeedback} className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/7 p-3">
                  <p className="text-sm font-bold text-ink">{t("product.feedback")}</p>
                  <SelectField value={feedbackForm.rating} onChange={updateFeedback("rating")}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                  </SelectField>
                  <SelectField value={feedbackForm.fitFeedback} onChange={updateFeedback("fitFeedback")}>
                    <option value="true_to_size">True to size</option>
                    <option value="runs_small">Runs small</option>
                    <option value="runs_large">Runs large</option>
                    <option value="not_sure">Not sure</option>
                  </SelectField>
                  <TextField as="textarea" rows="3" placeholder="Feedback about this product" value={feedbackForm.comment} onChange={updateFeedback("comment")} />
                  <Button type="submit" variant="secondary">{t("common.submitFeedback")}</Button>
                  {feedbackNotice ? <p className="text-xs text-muted">{feedbackNotice}</p> : null}
                </form>
              ) : null}
            </div>
          </StudioPanel>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose">{t("tryon.continue")}</p>
                <h2 className="mt-2 text-2xl font-extrabold text-ink">{t("tryon.related")}</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => <ProductCard key={item.id} product={item} onDetail={() => loadProduct(item.id)} onTryOn={() => loadProduct(item.id)} />)}
            </div>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}

function StudioPanel({ children, eyebrow, title }) {
  return (
    <section className="glass-panel p-5 flex flex-col h-full">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-rose">{eyebrow}</p>
      <h2 className="mb-4 mt-1 text-xl font-extrabold text-ink">{title}</h2>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </section>
  );
}

function PreviewFrame({ empty, image }) {
  return (
    <div className="aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-white/5">
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">{empty}</div>}
    </div>
  );
}

function GarmentPreview({ dressPreview, lowerPreview, product, upperPreview }) {
  const { t } = useLanguage();

  if (dressPreview || upperPreview || lowerPreview) {
    return (
      <div className="aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <div className="grid h-full grid-cols-2 gap-2 p-2">
          {dressPreview ? <img src={dressPreview} alt="" className="col-span-2 h-full w-full rounded-lg object-cover" /> : null}
          {upperPreview ? <img src={upperPreview} alt="" className="h-full w-full rounded-lg object-cover" /> : null}
          {lowerPreview ? <img src={lowerPreview} alt="" className="h-full w-full rounded-lg object-cover" /> : null}
        </div>
      </div>
    );
  }
  if (product?.imageUrl) return <PreviewFrame image={product.imageUrl} empty="" />;
  return <PreviewFrame empty={t("tryon.chooseProduct") + " / " + t("tryon.uploadGarment")} />;
}

export default TryOnStudioPage;
