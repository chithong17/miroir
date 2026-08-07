import { useEffect, useState } from "react";
import { getCatalogProduct, listCatalogProducts, submitProductFeedback } from "../api/catalogApi.js";
import { createCatalogTryOnTask, createCustomTryOnTask, createTryOnTask, getTryOnTaskStatus } from "../api/tryonApi.js";
import { getUserMe, getUserToken, setUserToken } from "../api/userApi.js";
import { AppShell, Button, EmptyState, PageHeader, ProductCard, ProductPurchaseActions, SegmentedTabs, SelectField, TextField, TopNav, formatMoney } from "../components/ui/index.jsx";
import { useLanguage } from "../i18n.jsx";
import { useTryOn } from "../contexts/TryOnContext.jsx";

function TryOnStudioPage() {
  const { t } = useLanguage();
  const { currentTask, startTask: startGlobalTask } = useTryOn();
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
  const [feedbackForm, setFeedbackForm] = useState({ rating: "5", fitFeedback: "true_to_size", comment: "" });
  const [feedbackNotice, setFeedbackNotice] = useState("");
  useEffect(() => {
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

  useEffect(() => {
    if (currentTask) {
      if (currentTask.status === "completed") {
        setStatus("completed");
        setResultUrl(currentTask.resultUrl);
        setCompletedTryOnProductId(currentTask.product?.id || "");
        setMessage("");
      } else if (currentTask.status === "failed") {
        setStatus("error");
        setMessage(currentTask.errorMessage);
      } else {
        setStatus("processing");
        setMessage("MIROIR is creating your virtual try-on in the background...");
      }
    }
  }, [currentTask]);

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

  // Background polling is handled by TryOnContext

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
      
      startGlobalTask(response.taskId, isPlatform ? product : null, customTryOnType);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Could not start try-on.");
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
      <main className="section-shell py-6 sm:py-8">
        <PageHeader
          eyebrow={t("tryon.eyebrow")}
          title={t("tryon.title")}
          description={t("tryon.description")}
          action={<a className="soft-button px-5 py-2" href="/app">{t("tryon.back")}</a>}
        />

        <section className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 xl:grid-cols-3">
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
              <div className="mt-4 rounded-xl border border-line bg-white/80 p-3">
                <h2 className="text-lg font-extrabold text-ink sm:text-xl">{product.name}</h2>
                <p className="text-sm text-muted">{product.shop?.name || t("product.detailsForPremium")}</p>
                <p className="mt-1 font-bold text-rose">{formatMoney(product.price)}</p>
              </div>
            ) : null}
            <div className="mt-auto pt-4 border-t border-line">
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
            <PreviewFrame
              image={resultUrl}
              empty={t("tryon.resultEmpty")}
              isLoading={status === "loading" || status === "processing"}
              loadingText={status === "loading" ? "Creating try-on task..." : "Rendering your preview..."}
            />
            <div className="mt-auto pt-4">
              <Button className="w-full" disabled={status === "loading" || status === "processing"} onClick={startTryOn}>
                {status === "loading" || status === "processing" ? t("tryon.generating") : t("tryon.generate")}
              </Button>
              {message ? <p className={`mt-3 text-sm ${status === "error" ? "text-red-700" : "text-muted"}`}>{message}</p> : null}
              {status === "completed" && resultUrl && product && completedTryOnProductId === product.id ? (
                <div className="mt-4 grid gap-4">
                  <div className="rounded-2xl border border-mintSoft bg-accentSoft p-3">
                    <p className="text-sm font-black text-ink">Ưng ý với sản phẩm này?</p>
                    <p className="mt-1 text-xs text-muted">Chọn đúng màu sắc và kích thước trước khi mua.</p>
                    <ProductPurchaseActions product={product} />
                    <a className="mt-3 block text-center text-sm font-bold text-mintDeep underline" href={`/app/products/${encodeURIComponent(product.id)}`}>Xem chi tiết sản phẩm</a>
                  </div>
                <form onSubmit={sendTryOnFeedback} className="grid gap-3 rounded-lg border border-line bg-white/80 p-3">
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
                </div>
              ) : null}
            </div>
          </StudioPanel>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="mt-8 sm:mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose">{t("tryon.continue")}</p>
                <h2 className="mt-2 text-xl font-extrabold text-ink sm:text-2xl">{t("tryon.related")}</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => <ProductCard key={item.id} product={item} onDetail={() => loadProduct(item.id)} onTryOn={() => loadProduct(item.id)} showPurchaseActions />)}
            </div>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}

function StudioPanel({ children, eyebrow, title }) {
  return (
    <section className="glass-panel flex h-full flex-col p-4 sm:p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-rose">{eyebrow}</p>
      <h2 className="mb-4 mt-1 text-lg font-extrabold text-ink sm:text-xl">{title}</h2>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </section>
  );
}

function PreviewFrame({ empty, image, isLoading = false, loadingText = "" }) {
  return (
    <div className={`aspect-[4/5] overflow-hidden rounded-lg border border-line bg-white/80 ${isLoading ? "tryon-result-active" : ""}`}>
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : isLoading ? (
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center sm:p-6">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-accentStrong/25 border-t-ink tryon-orbit" />
            <div className="absolute inset-3 rounded-full border border-white/80 bg-white/70 shadow-glow" />
            <div className="relative grid grid-cols-2 gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-ink tryon-pulse-dot" />
              <span className="h-2.5 w-2.5 rounded-full bg-accentStrong tryon-pulse-dot [animation-delay:120ms]" />
              <span className="h-2.5 w-2.5 rounded-full bg-accentStrong tryon-pulse-dot [animation-delay:240ms]" />
              <span className="h-2.5 w-2.5 rounded-full bg-ink tryon-pulse-dot [animation-delay:360ms]" />
            </div>
          </div>
          <p className="text-sm font-black text-ink">{loadingText}</p>
          <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-muted">
            MIROIR is fitting the garment and checking the generated result.
          </p>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted sm:p-6">{empty}</div>
      )}
    </div>
  );
}

function GarmentPreview({ dressPreview, lowerPreview, product, upperPreview }) {
  const { t } = useLanguage();

  if (dressPreview || upperPreview || lowerPreview) {
    return (
      <div className="aspect-[4/5] overflow-hidden rounded-lg border border-line bg-white/80">
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
