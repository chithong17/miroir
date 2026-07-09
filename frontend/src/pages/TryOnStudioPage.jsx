import { useEffect, useState } from "react";
import {
  getCatalogProduct,
  listCatalogProducts,
} from "../api/catalogApi.js";
import {
  createCatalogTryOnTask,
  createTryOnTask,
  createCustomTryOnTask,
  getTryOnTaskStatus,
} from "../api/tryonApi.js";
import { getUserMe, getUserToken, setUserToken } from "../api/userApi.js";
import { UnifiedNav } from "./AuthPage.jsx";

const fieldClass =
  "w-full rounded-lg border border-line/70 bg-white px-3 py-2 text-sm outline-none focus:border-tertiary";

function TryOnStudioPage() {
  const params = new URLSearchParams(window.location.search);
  const initialProductId = params.get("productId") || "";
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [garmentSource, setGarmentSource] = useState(initialProductId ? "platform" : "upload");
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
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

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

  const loadProduct = async (productId) => {
    setMessage("");
    setGarmentSource("platform");
    const response = await getCatalogProduct(productId);
    setProduct(response.product);
    setResultUrl("");
    const related = await listCatalogProducts({
      category: response.product.category,
      shopId: response.product.shopId,
      limit: 8,
    });
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
    if (file) {
      setModelPreview(URL.createObjectURL(file));
    }
  };

  const poll = async (taskId) => {
    setStatus("processing");
    setMessage("Task created. Waiting for the first result check...");

    for (let attempt = 0; attempt < 72; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 15000 : 5000));
      const response = await getTryOnTaskStatus(taskId);
      if (response.status === "completed" && response.resultUrl) {
        setResultUrl(response.resultUrl);
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

    if (garmentSource === "platform" && !product) {
      setMessage("Choose a platform product first.");
      return;
    }

    if (garmentSource === "platform" && !isLoggedIn) {
      setMessage("Please log in to try on platform products.");
      return;
    }

    if (garmentSource === "upload" && !isLoggedIn && !modelFile) {
      setMessage("Upload your original photo first.");
      return;
    }

    if (garmentSource === "upload" && customTryOnType === "dress" && !dressFile) {
      setMessage("Upload a dress garment image first.");
      return;
    }

    if (garmentSource === "upload" && customTryOnType === "upper_lower" && !upperFile && !lowerFile) {
      setMessage("Upload at least one upper or lower garment image first.");
      return;
    }
    setStatus("loading");
    setMessage("");
    setResultUrl("");

    try {
      let response;

      if (garmentSource === "platform") {
        response = await createCatalogTryOnTask({
          productId: product.id,
          modelImage: modelFile,
        });
      } else if (isLoggedIn) {
        response = await createCustomTryOnTask({
          tryOnType: customTryOnType,
          modelImage: modelFile,
          dressImage: dressFile,
          upperImage: upperFile,
          lowerImage: lowerFile,
        });
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

      await poll(response.taskId);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Could not start try-on.");
    }
  };

  const logout = () => {
    setUserToken("");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-hero">
      <UnifiedNav user={user} onLogout={logout} />
      <main className="section-shell py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="editorial-title text-3xl font-bold">Try-On Studio</h1>
            <p className="text-sm text-muted">
              Upload your photo, inspect the selected product, then generate the result.
            </p>
          </div>
          <a className="soft-button rounded-lg" href="/app">
            Back to marketplace
          </a>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          <StudioPanel title="1. Original photo">
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-panelSoft">
              {modelPreview ? (
                <img src={modelPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
                  Use your saved profile photo or upload a new one.
                </div>
              )}
            </div>
            <input className={`${fieldClass} mt-4`} type="file" accept="image/*" onChange={onModelFile} />
            {user?.profile?.modelImageUrl ? (
              <p className="mt-2 text-xs text-muted">Saved profile photo is ready if you do not upload a new one.</p>
            ) : !user ? (
              <p className="mt-2 text-xs text-muted">Login is optional for uploaded garments, but platform products require a user account.</p>
            ) : null}
          </StudioPanel>

          <StudioPanel title="2. Product / outfit">
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-panelSoft p-1">
              <button
                type="button"
                onClick={() => setGarmentSource("platform")}
                className={`rounded-md py-2 text-sm font-semibold ${garmentSource === "platform" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
              >
                Platform product
              </button>
              <button
                type="button"
                onClick={() => setGarmentSource("upload")}
                className={`rounded-md py-2 text-sm font-semibold ${garmentSource === "upload" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
              >
                Upload garment
              </button>
            </div>
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-panelSoft">
              {garmentSource === "platform" && product?.imageUrl ? (
                <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : garmentSource === "upload" && (dressPreview || upperPreview || lowerPreview) ? (
                <div className="grid h-full grid-cols-2 gap-2 p-2">
                  {dressPreview ? <img src={dressPreview} alt="" className="col-span-2 h-full w-full rounded-md object-cover" /> : null}
                  {upperPreview ? <img src={upperPreview} alt="" className="h-full w-full rounded-md object-cover" /> : null}
                  {lowerPreview ? <img src={lowerPreview} alt="" className="h-full w-full rounded-md object-cover" /> : null}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
                  {garmentSource === "platform"
                    ? "Choose a product from the marketplace."
                    : "Upload your garment image here."}
                </div>
              )}
            </div>
            {garmentSource === "platform" && product ? (
              <div className="mt-4">
                <h2 className="font-bold">{product.name}</h2>
                <p className="text-sm text-muted">{product.shop?.name}</p>
                <p className="mt-1 font-semibold">{formatMoney(product.price)}</p>
              </div>
            ) : null}
            {garmentSource === "upload" ? (
              <div className="mt-4 grid gap-3">
                <select
                  className={fieldClass}
                  value={customTryOnType}
                  onChange={(event) => setCustomTryOnType(event.target.value)}
                >
                  <option value="dress">Dress / one-piece</option>
                  <option value="upper_lower">Upper / lower</option>
                </select>
                {customTryOnType === "dress" ? (
                  <input
                    className={fieldClass}
                    type="file"
                    accept="image/*"
                    onChange={(event) => setGarmentFile("dress", event.target.files?.[0] || null)}
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className={fieldClass}
                      type="file"
                      accept="image/*"
                      onChange={(event) => setGarmentFile("upper", event.target.files?.[0] || null)}
                    />
                    <input
                      className={fieldClass}
                      type="file"
                      accept="image/*"
                      onChange={(event) => setGarmentFile("lower", event.target.files?.[0] || null)}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </StudioPanel>

          <StudioPanel title="3. Result">
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-panelSoft">
              {resultUrl ? (
                <img src={resultUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
                  Your generated try-on result will appear here.
                </div>
              )}
            </div>
            <button
              className="dark-button mt-4 w-full rounded-lg"
              disabled={status === "loading" || status === "processing"}
              onClick={startTryOn}
            >
              {status === "loading" || status === "processing" ? "Generating..." : "Generate try-on"}
            </button>
            {message ? (
              <p className={`mt-3 text-sm ${status === "error" ? "text-red-700" : "text-muted"}`}>
                {message}
              </p>
            ) : null}
          </StudioPanel>
        </section>

        {garmentSource === "platform" ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Related products</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => loadProduct(item.id)}
                className="overflow-hidden rounded-lg border border-line/60 bg-white text-left shadow-sm"
              >
                <div className="aspect-[4/5] bg-panelSoft">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="p-3">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted">{formatMoney(item.price)}</p>
                </div>
              </button>
            ))}
            {!relatedProducts.length ? (
              <div className="rounded-lg border border-line/60 bg-white p-6 text-sm text-muted">
                No related products yet.
              </div>
            ) : null}
          </div>
        </section>
        ) : null}
      </main>
    </div>
  );
}

function StudioPanel({ children, title }) {
  return (
    <section className="rounded-lg border border-line/60 bg-white/90 p-4 shadow-sm">
      <h2 className="mb-4 font-bold">{title}</h2>
      {children}
    </section>
  );
}

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default TryOnStudioPage;
