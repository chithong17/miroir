import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n.jsx";
import {
  archiveProduct,
  createShopPayment,
  createProduct,
  createShop,
  deleteProduct,
  deleteShop,
  downloadProductImportTemplate,
  getShopAnalytics,
  getShopInsights,
  getShopPaymentMe,
  hardDeleteProduct,
  importProductsExcel,
  listMyShops,
  listPaymentPlans,
  listShopProducts,
  restoreProduct,
  setShopToken,
  updateProduct,
  updateShop,
  uploadProductImage,
} from "../api/shopApi.js";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#12356f] focus:ring-2 focus:ring-[#12356f]/10";
const labelClass = "text-xs font-semibold uppercase tracking-[0.12em] text-slate-500";
const buttonBase =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const emptyShop = {
  id: "",
  name: "",
  slug: "",
  description: "",
  logoUrl: "",
  coverUrl: "",
  status: "active",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
};

const emptyProduct = {
  id: "",
  shopId: "",
  name: "",
  category: "",
  description: "",
  price: "",
  gender: "female",
  availability: "in_stock",
  status: "draft",
  colors: "",
  sizes: "",
  styleTags: "",
  occasionTags: "",
  material: "",
  fitType: "",
  imageUrl: "",
  imagePublicId: "",
};

const emptyBulkEdit = {
  category: "",
  price: "",
  gender: "",
  availability: "",
  status: "",
  colors: "",
  sizes: "",
  material: "",
  fitType: "",
  styleTags: "",
  occasionTags: "",
  imageUrl: "",
  description: "",
};

const toInputList = (value) => (Array.isArray(value) ? value.join(", ") : value || "");
const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const shopToForm = (shop) => ({
  ...emptyShop,
  ...shop,
  contactEmail: shop.contact?.email || "",
  contactPhone: shop.contact?.phone || "",
  contactAddress: shop.contact?.address || "",
});

const productToForm = (product) => ({
  ...emptyProduct,
  ...product,
  price: product.price ?? "",
  colors: toInputList(product.colors),
  sizes: toInputList(product.sizes),
  styleTags: toInputList(product.styleTags),
  occasionTags: toInputList(product.occasionTags),
});

const formatMoney = (value) => `${Number(value || 0).toLocaleString()} VND`;
const formatPercent = (value) => `${Math.round(Number(value || 0) * 100)}%`;

function ShopDashboardPage() {
  const { t } = useLanguage();
  const [view, setView] = useState("products");
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [shopForm, setShopForm] = useState(emptyShop);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [filters, setFilters] = useState({ query: "", status: "all" });
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [uploadNotice, setUploadNotice] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState(emptyBulkEdit);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [ownerSubscription, setOwnerSubscription] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [analyticsRange, setAnalyticsRange] = useState("30d");
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [premiumDataStatus, setPremiumDataStatus] = useState("idle");

  const shop = shops[0] || null;
  const hasActiveShopPlan = Boolean(ownerSubscription?.isPremium);
  const shopOwnerPlan = paymentPlans.find((plan) => plan.code === "SHOP_OWNER_MONTHLY");
  const editingExistingProduct = Boolean(
    productForm.id && products.some((product) => product.id === productForm.id)
  );

  const stats = useMemo(() => {
    const next = {
      total: products.length,
      published: 0,
      draft: 0,
      archived: 0,
      trashed: 0,
      needsEmbed: 0,
    };
    products.forEach((product) => {
      if (product.status === "published") next.published += 1;
      if (product.status === "draft") next.draft += 1;
      if (product.status === "archived") next.archived += 1;
      if (product.status === "trashed") next.trashed += 1;
      if (product.embeddingStale) next.needsEmbed += 1;
    });
    return next;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return products.filter((product) => {
      const scopeMatch =
        view === "trash"
          ? product.status === "trashed"
          : product.status !== "trashed";
      const statusMatch =
        view === "trash" || filters.status === "all" || product.status === filters.status;
      const queryMatch =
        !query ||
        [product.name, product.category, product.material, product.fitType]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return scopeMatch && statusMatch && queryMatch;
    });
  }, [filters, products, view]);

  const selectedProductSet = useMemo(
    () => new Set(selectedProductIds),
    [selectedProductIds]
  );

  useEffect(() => {
    const productIds = new Set(products.map((product) => product.id));
    setSelectedProductIds((previous) =>
      previous.filter((productId) => productIds.has(productId))
    );
  }, [products]);

  useEffect(() => {
    setSelectedProductIds([]);
  }, [view]);

  const showNotice = (message, type = "info") => {
    setNotice(message);
    setNoticeType(type);
  };

  const loadDashboard = async () => {
    try {
      const [shopResponse, productResponse, paymentResponse, plansResponse] = await Promise.all([
        listMyShops(),
        listShopProducts(),
        getShopPaymentMe(),
        listPaymentPlans(),
      ]);
      const nextShops = shopResponse.shops || [];
      const nextShop = nextShops[0] || null;

      setShops(nextShops);
      setProducts(productResponse.products || []);
      setOwnerSubscription(paymentResponse.subscription || null);
      setPaymentPlans(plansResponse.plans || []);

      if (nextShop) {
        setShopForm(shopToForm(nextShop));
        setProductForm((previous) => ({ ...previous, shopId: nextShop.id }));
      }
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.loadDashboardError"), "error");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadAnalytics = async (range = analyticsRange) => {
    if (!hasActiveShopPlan) return;
    try {
      setPremiumDataStatus("loading");
      const response = await getShopAnalytics({ range });
      setAnalytics(response.analytics);
      setPremiumDataStatus("idle");
    } catch (error) {
      setPremiumDataStatus("error");
      showNotice(error.response?.data?.message || t("shopAdmin.loadAnalyticsError"), "error");
    }
  };

  const loadInsights = async (range = analyticsRange) => {
    if (!hasActiveShopPlan) return;
    try {
      setPremiumDataStatus("loading");
      const response = await getShopInsights({ range });
      setInsights(response.insights);
      setPremiumDataStatus("idle");
    } catch (error) {
      setPremiumDataStatus("error");
      showNotice(error.response?.data?.message || t("shopAdmin.loadInsightsError"), "error");
    }
  };

  useEffect(() => {
    if (view === "analytics") loadAnalytics(analyticsRange);
    if (view === "insights") loadInsights(analyticsRange);
  }, [view, analyticsRange, hasActiveShopPlan]);

  const updateShopField = (field) => (event) => {
    setShopForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const updateProductField = (field) => (event) => {
    setProductForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const updateBulkEditField = (field) => (event) => {
    setBulkEditForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const updateFilter = (field) => (event) => {
    setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const resetProductForm = () => {
    if (!hasActiveShopPlan) {
      showNotice(t("shopAdmin.activePlanRequired"), "error");
      return;
    }
    setProductForm({ ...emptyProduct, shopId: shop?.id || "" });
    setUploadNotice("");
    setView("products");
    setIsProductModalOpen(true);
  };

  const editProduct = (product) => {
    if (!hasActiveShopPlan) {
      showNotice(t("shopAdmin.activePlanRequired"), "error");
      return;
    }
    setProductForm(productToForm(product));
    setUploadNotice("");
    setView("products");
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setUploadNotice("");
  };

  const openBulkEditModal = () => {
    if (!selectedProductIds.length) return;
    if (!hasActiveShopPlan) {
      showNotice(t("shopAdmin.activePlanRequired"), "error");
      return;
    }
    setBulkEditForm(emptyBulkEdit);
    setIsBulkEditModalOpen(true);
  };

  const closeBulkEditModal = () => {
    setIsBulkEditModalOpen(false);
    setBulkEditForm(emptyBulkEdit);
  };

  const saveShop = async (event) => {
    event.preventDefault();

    const payload = {
      name: shopForm.name,
      slug: shopForm.slug,
      description: shopForm.description,
      logoUrl: shopForm.logoUrl,
      coverUrl: shopForm.coverUrl,
      status: shopForm.status,
      contact: {
        email: shopForm.contactEmail,
        phone: shopForm.contactPhone,
        address: shopForm.contactAddress,
      },
    };

    try {
      if (shopForm.id) {
        await updateShop(shopForm.id, payload);
        showNotice(t("shopAdmin.shopSaved"));
      } else {
        await createShop(payload);
        showNotice(t("shopAdmin.shopCreated"));
      }
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.shopSaveError"), "error");
    }
  };

  const deactivateShop = async () => {
    if (!shop?.id) return;

    try {
      await deleteShop(shop.id);
      showNotice(t("shopAdmin.shopDeactivated"));
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.shopDeactivateError"), "error");
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    if (!shop) {
      setView("shop");
      showNotice(t("shopAdmin.createShopBeforeProduct"), "error");
      return;
    }

    if (!hasActiveShopPlan) {
      showNotice(t("shopAdmin.activePlanRequired"), "error");
      return;
    }

    const payload = {
      id: productForm.id || undefined,
      shopId: shop.id,
      name: productForm.name,
      category: productForm.category,
      description: productForm.description,
      price: Number(productForm.price),
      gender: productForm.gender,
      availability: productForm.availability,
      status: productForm.status,
      colors: splitList(productForm.colors),
      sizes: splitList(productForm.sizes),
      styleTags: splitList(productForm.styleTags),
      occasionTags: splitList(productForm.occasionTags),
      material: productForm.material,
      fitType: productForm.fitType,
      imageUrl: productForm.imageUrl,
      imagePublicId: productForm.imagePublicId,
    };

    try {
      if (editingExistingProduct) {
        await updateProduct(productForm.id, payload);
        showNotice(t("shopAdmin.productUpdated"));
      } else {
        await createProduct(payload);
        showNotice(t("shopAdmin.productCreated"));
      }
      setProductForm({ ...emptyProduct, shopId: shop?.id || "" });
      setIsProductModalOpen(false);
      setUploadNotice("");
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.productSaveError"), "error");
    }
  };

  const archiveShopProduct = async (productId) => {
    try {
      await archiveProduct(productId);
      setSelectedProductIds((previous) => previous.filter((id) => id !== productId));
      showNotice(t("shopAdmin.productArchived"));
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.productArchiveError"), "error");
    }
  };

  const removeProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      setSelectedProductIds((previous) => previous.filter((id) => id !== productId));
      showNotice(t("shopAdmin.productMovedToTrash"));
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.productMoveToTrashError"), "error");
    }
  };

  const recoverProduct = async (productId) => {
    try {
      await restoreProduct(productId);
      setSelectedProductIds((previous) => previous.filter((id) => id !== productId));
      showNotice(t("shopAdmin.productRecovered"));
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.productRecoverError"), "error");
    }
  };

  const permanentlyDeleteProduct = async (productId) => {
    const confirmed = window.confirm(t("shopAdmin.confirmDeleteProduct"));
    if (!confirmed) return;

    try {
      await hardDeleteProduct(productId);
      setSelectedProductIds((previous) => previous.filter((id) => id !== productId));
      showNotice(t("shopAdmin.productDeleted"));
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.productDeleteError"), "error");
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((previous) =>
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId]
    );
  };

  const toggleVisibleProductSelection = () => {
    const visibleIds = filteredProducts.map((product) => product.id);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((productId) => selectedProductSet.has(productId));

    setSelectedProductIds((previous) => {
      if (allVisibleSelected) {
        const visibleIdSet = new Set(visibleIds);
        return previous.filter((productId) => !visibleIdSet.has(productId));
      }

      return [...new Set([...previous, ...visibleIds])];
    });
  };

  const deleteSelectedProducts = async () => {
    if (!selectedProductIds.length) return;

    try {
      await Promise.all(selectedProductIds.map((productId) => deleteProduct(productId)));
      showNotice(t("shopAdmin.selectedMovedToTrash", { count: selectedProductIds.length }));
      setSelectedProductIds([]);
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.selectedMoveToTrashError"), "error");
      await loadDashboard();
    }
  };

  const saveBulkEditProducts = async (event) => {
    event.preventDefault();

    const payload = {};
    const textFields = ["category", "material", "fitType", "imageUrl", "description"];
    const listFields = ["colors", "sizes", "styleTags", "occasionTags"];

    textFields.forEach((field) => {
      const value = bulkEditForm[field].trim();
      if (value) payload[field] = value;
    });

    listFields.forEach((field) => {
      const value = bulkEditForm[field].trim();
      if (value) payload[field] = splitList(value);
    });

    if (bulkEditForm.price.trim()) {
      payload.price = Number(bulkEditForm.price);
    }

    ["gender", "availability", "status"].forEach((field) => {
      if (bulkEditForm[field]) payload[field] = bulkEditForm[field];
    });

    if (!Object.keys(payload).length) {
      showNotice(t("shopAdmin.chooseBulkField"), "error");
      return;
    }

    try {
      await Promise.all(selectedProductIds.map((productId) => updateProduct(productId, payload)));
      showNotice(t("shopAdmin.productsUpdated", { count: selectedProductIds.length }));
      setSelectedProductIds([]);
      closeBulkEditModal();
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.bulkEditError"), "error");
    }
  };

  const permanentlyDeleteSelectedProducts = async () => {
    if (!selectedProductIds.length) return;

    const confirmed = window.confirm(
      t("shopAdmin.confirmDeleteSelected", { count: selectedProductIds.length })
    );
    if (!confirmed) return;

    try {
      await Promise.all(selectedProductIds.map((productId) => hardDeleteProduct(productId)));
      showNotice(t("shopAdmin.selectedDeleted", { count: selectedProductIds.length }));
      setSelectedProductIds([]);
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || t("shopAdmin.selectedDeleteError"), "error");
      await loadDashboard();
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!hasActiveShopPlan) {
      setUploadNotice(t("shopAdmin.activePlanRequired"));
      return;
    }

    try {
      setUploadNotice(t("shopAdmin.uploading"));
      const response = await uploadProductImage(file);
      setProductForm((previous) => ({
        ...previous,
        imageUrl: response.imageUrl,
        imagePublicId: response.imagePublicId,
      }));
      setUploadNotice(t("shopAdmin.imageUploaded"));
    } catch (error) {
      setUploadNotice(error.response?.data?.message || t("shopAdmin.imageUploadError"));
    }
  };

  const downloadTemplate = async () => {
    const blob = await downloadProductImportTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "miroir-product-import-template.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!hasActiveShopPlan) {
      showNotice(t("shopAdmin.activePlanRequired"), "error");
      return;
    }

    setImportResult(null);

    try {
      const response = await importProductsExcel(file);
      setImportResult(response.importJob);
      showNotice(t("shopAdmin.importCompleted"));
      await loadDashboard();
    } catch (error) {
      if (error.response?.data?.importJob) {
        setImportResult(error.response.data.importJob);
      }
      showNotice(error.response?.data?.message || t("shopAdmin.importFailed"), "error");
    }
  };

  const logout = () => {
    setShopToken("");
    window.location.href = "/login";
  };

  const startShopCheckout = async () => {
    try {
      setPaymentStatus(t("shopAdmin.creatingPayOS"));
      const response = await createShopPayment();
      window.location.href = response.checkoutUrl;
    } catch (error) {
      setPaymentStatus(error.response?.data?.message || t("shopAdmin.paymentCreateError"));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <DashboardSidebar
          logout={logout}
          setView={setView}
          shop={shop}
          stats={stats}
          view={view}
        />

        <main className="min-w-0 p-4 md:p-6">
          <div className="mx-auto max-w-[1440px]">
            <DashboardHeader
              hasActiveShopPlan={hasActiveShopPlan}
              filters={filters}
              resetProductForm={resetProductForm}
              shop={shop}
              updateFilter={updateFilter}
              view={view}
            />

            <ShopSubscriptionBanner
              hasActiveShopPlan={hasActiveShopPlan}
              paymentStatus={paymentStatus}
              plan={shopOwnerPlan}
              subscription={ownerSubscription}
              onCheckout={startShopCheckout}
            />

            {notice ? <Notice message={notice} type={noticeType} /> : null}

            {view === "products" || view === "trash" ? (
              <ProductsView
                archiveProduct={archiveShopProduct}
                deleteSelectedProducts={deleteSelectedProducts}
                filteredProducts={filteredProducts}
                editProduct={editProduct}
                openBulkEditModal={openBulkEditModal}
                permanentlyDeleteSelectedProducts={permanentlyDeleteSelectedProducts}
                permanentlyDeleteProduct={permanentlyDeleteProduct}
                recoverProduct={recoverProduct}
                removeProduct={removeProduct}
                resetProductForm={resetProductForm}
                selectedProductSet={selectedProductSet}
                hasActiveShopPlan={hasActiveShopPlan}
                shop={shop}
                toggleProductSelection={toggleProductSelection}
                toggleVisibleProductSelection={toggleVisibleProductSelection}
                view={view}
              />
            ) : null}

            {view === "shop" ? (
              <ShopView
                deactivateShop={deactivateShop}
                saveShop={saveShop}
                shop={shop}
                shopForm={shopForm}
                updateShopField={updateShopField}
              />
            ) : null}

            {view === "import" ? (
              <ImportView
                downloadTemplate={downloadTemplate}
                hasActiveShopPlan={hasActiveShopPlan}
                importExcel={importExcel}
                importResult={importResult}
                shop={shop}
              />
            ) : null}

            {view === "analytics" ? (
              hasActiveShopPlan ? (
                <AnalyticsView
                  analytics={analytics}
                  range={analyticsRange}
                  setRange={setAnalyticsRange}
                  status={premiumDataStatus}
                />
              ) : (
                <PremiumPaywall onCheckout={startShopCheckout} titleKey="shopAdmin.analyticsDashboard" />
              )
            ) : null}

            {view === "insights" ? (
              hasActiveShopPlan ? (
                <InsightsView
                  insights={insights}
                  range={analyticsRange}
                  setRange={setAnalyticsRange}
                  status={premiumDataStatus}
                />
              ) : (
                <PremiumPaywall onCheckout={startShopCheckout} titleKey="shopAdmin.customerInsights" />
              )
            ) : null}
          </div>
        </main>
      </div>

      {isProductModalOpen ? (
        <ProductModal
          editingExistingProduct={editingExistingProduct}
          productForm={productForm}
          saveProduct={saveProduct}
          hasActiveShopPlan={hasActiveShopPlan}
          shop={shop}
          uploadImage={uploadImage}
          uploadNotice={uploadNotice}
          updateProductField={updateProductField}
          onClose={closeProductModal}
        />
      ) : null}

      {isBulkEditModalOpen ? (
        <BulkEditModal
          bulkEditForm={bulkEditForm}
          onClose={closeBulkEditModal}
          saveBulkEditProducts={saveBulkEditProducts}
          selectedCount={selectedProductIds.length}
          updateBulkEditField={updateBulkEditField}
        />
      ) : null}
    </div>
  );
}

function DashboardSidebar({ logout, setView, shop, stats, view }) {
  const { t, language, toggleLanguage } = useLanguage();
  const navItems = [
    ["products", t("shopAdmin.products") || "Products"],
    ["analytics", t("shopAdmin.analytics") || "Analytics"],
    ["insights", t("shopAdmin.insights") || "Customer Insights"],
    ["trash", t("shopAdmin.trash") || "Trash"],
    ["shop", t("shopAdmin.shopProfile") || "Shop Profile"],
    ["import", t("shopAdmin.excelImport") || "Excel Import"],
  ];

  return (
    <aside className="border-b border-white/10 bg-white/5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 p-5">
          <a href="/" className="font-display text-2xl font-extrabold text-rose">
            MIROIR
          </a>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("shopAdmin.title") || "Shop Owner"}
          </p>
        </div>

        <div className="p-4">
          <div className="rounded-xl border border-white/10 bg-white/7 p-4">
            <p className={labelClass}>{t("shopAdmin.currentShop") || "Current shop"}</p>
            <p className="mt-2 truncate text-base font-bold text-ink">
              {shop?.name || t("shopAdmin.noShopYet") || "No shop yet"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {shop ? `${shop.slug} / ${shop.status}` : t("shopAdmin.createProfileFirst") || "Create profile first"}
            </p>
          </div>
        </div>

        <nav className="grid gap-1 px-3">
          {navItems.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                view === key
                  ? "bg-[#12356f] text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="grid grid-cols-2 gap-2 p-4">
          <Metric label={t("common.total")} value={stats.total} />
          <Metric label={t("common.live")} value={stats.published} />
          <Metric label={t("common.draft")} value={stats.draft} />
          <Metric label={t("common.trash")} value={stats.trashed} />
        </div>

        <div className="mt-auto grid gap-2 border-t border-white/10 p-4">
          <a
            href="/stylist"
            className="rounded-lg px-4 py-3 text-sm font-semibold text-muted hover:bg-canvasDeep"
          >
            AI Stylist
          </a>
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-muted hover:bg-canvasDeep"
          >
            {language === "en" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-tertiarySoft px-4 py-3 text-left text-sm font-semibold text-canvas"
          >
            {t("shopAdmin.logout") || "Logout"}
          </button>
        </div>
      </div>
    </aside>
  );
}

function DashboardHeader({
  filters,
  hasActiveShopPlan,
  resetProductForm,
  shop,
  updateFilter,
  view,
}) {
  const { t } = useLanguage();
  const title =
    view === "shop"
      ? t("shopAdmin.shopProfile")
      : view === "import"
        ? t("shopAdmin.excelImport")
        : view === "analytics"
          ? t("shopAdmin.analytics")
          : view === "insights"
            ? t("shopAdmin.insights")
        : view === "trash"
          ? t("shopAdmin.trash")
          : t("shopAdmin.products");

  return (
    <header className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {shop ? t("shopAdmin.headerDescription") : t("shopAdmin.createToBegin")}
          </p>
        </div>

        {view === "products" ? (
          <button
            type="button"
            onClick={resetProductForm}
            disabled={!shop || !hasActiveShopPlan}
            className={`${buttonBase} bg-[#12356f] text-white`}
          >
            {t("product.new")}
          </button>
        ) : null}
      </div>

      {view === "products" || view === "trash" ? (
        <div className={`mt-4 grid gap-3 ${view === "trash" ? "" : "md:grid-cols-[minmax(0,1fr)_180px]"}`}>
          <input
            className={fieldClass}
            placeholder={t("product.searchPlaceholder")}
            value={filters.query}
            onChange={updateFilter("query")}
          />
          {view !== "trash" ? (
            <select className={fieldClass} value={filters.status} onChange={updateFilter("status")}>
              <option value="all">{t("common.allStatus")}</option>
              <option value="published">{t("common.published")}</option>
              <option value="draft">{t("common.draft")}</option>
              <option value="archived">{t("common.archived")}</option>
            </select>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

function ShopSubscriptionBanner({
  hasActiveShopPlan,
  onCheckout,
  paymentStatus,
  plan,
  subscription,
}) {
  const { t } = useLanguage();
  return (
    <section className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-xs font-bold ${hasActiveShopPlan ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
            {hasActiveShopPlan ? t("shopAdmin.active") : t("shopAdmin.free")}
          </span>
          <p className="text-sm font-semibold text-slate-900">
            {t("shopAdmin.planSummary", { amount: formatMoney(plan?.amount || 349000), days: plan?.durationDays || 30 })}
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {t("shopAdmin.planBenefits")}
        </p>
        {hasActiveShopPlan && subscription?.expiresAt ? (
          <p className="mt-1 text-xs text-slate-500">
            {t("shopAdmin.expiresAt", { date: new Date(subscription.expiresAt).toLocaleDateString("vi-VN") })}
          </p>
        ) : null}
        {paymentStatus ? <p className="mt-1 text-xs text-slate-500">{paymentStatus}</p> : null}
      </div>
      {!hasActiveShopPlan ? (
        <button type="button" className={`${buttonBase} bg-[#12356f] text-white`} onClick={onCheckout}>
          {t("shopAdmin.checkout")}
        </button>
      ) : null}
    </section>
  );
}function ProductsView({
  archiveProduct,
  deleteSelectedProducts,
  editProduct,
  filteredProducts,
  hasActiveShopPlan,
  openBulkEditModal,
  permanentlyDeleteSelectedProducts,
  permanentlyDeleteProduct,
  recoverProduct,
  removeProduct,
  selectedProductSet,
  shop,
  toggleProductSelection,
  toggleVisibleProductSelection,
  view,
}) {
  const selectedCount = selectedProductSet.size;
  const inTrash = view === "trash";
  const { t } = useLanguage();
  const allVisibleSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedProductSet.has(product.id));

  return (
    <div>
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {inTrash ? t("shopAdmin.trash") : t("product.catalogueTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedCount
                ? t("shopAdmin.selected", { count: selectedCount })
                : t("shopAdmin.productsShown", { count: filteredProducts.length })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {selectedCount && !inTrash ? (
            <button
              type="button"
              onClick={openBulkEditModal}
              disabled={!hasActiveShopPlan}
              className={`${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
              title={t("product.bulkEditSelected")}
            >
              <Icon name="edit" />
              <span className="ml-2">{t("product.bulkEdit")}</span>
            </button>
          ) : null}
          {selectedCount ? (
            <button
              type="button"
              onClick={inTrash ? permanentlyDeleteSelectedProducts : deleteSelectedProducts}
              className={`${buttonBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
              title={inTrash ? t("product.deleteSelectedPermanently") : t("product.moveSelectedToTrash")}
            >
              <Icon name={inTrash ? "deleteForever" : "trash"} />
              <span className="ml-2">
                {inTrash ? t("product.deleteSelected") : t("product.moveSelectedToTrash")}
              </span>
            </button>
          ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    disabled={!filteredProducts.length}
                    onChange={toggleVisibleProductSelection}
                    className="h-4 w-4 rounded border-slate-300 text-[#12356f] focus:ring-[#12356f]"
                    aria-label={t("product.selectAllVisible")}
                  />
                </th>
                <th className="px-4 py-3">{t("product.product")}</th>
                <th className="px-4 py-3">{t("common.category")}</th>
                <th className="px-4 py-3">{t("product.price")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3">{t("common.stock")}</th>
                <th className="px-4 py-3">AI</th>
                <th className="px-4 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const selected = selectedProductSet.has(product.id);

                return (
                <tr
                  key={product.id}
                  className={`group border-b border-slate-100 last:border-b-0 ${
                    selected ? "bg-[#12356f]/5" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleProductSelection(product.id)}
                      className={`h-4 w-4 rounded border-slate-300 text-[#12356f] focus:ring-[#12356f] ${
                        selected ? "opacity-100" : "opacity-0 transition group-hover:opacity-100"
                      }`}
                      aria-label={t("product.selectProduct", { name: product.name })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-11 flex-none overflow-hidden rounded-lg bg-slate-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{product.name}</p>
                        <p className="truncate text-xs text-slate-500">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.category}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(product.price)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.availability}</td>
                  <td className="px-4 py-3 text-slate-600">{product.embeddingStale ? t("product.needsEmbed") : t("product.ready")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!inTrash ? (
                        <button
                          type="button"
                          onClick={() => editProduct(product)}
                          disabled={!hasActiveShopPlan}
                          className={`${iconButtonClass} border-slate-200 text-slate-700`}
                          title={t("product.edit")}
                          aria-label={t("product.editProduct", { name: product.name })}
                        >
                          <Icon name="edit" />
                        </button>
                      ) : null}
                      {!inTrash ? (
                        <>
                          <button
                            type="button"
                            onClick={() => archiveProduct(product.id)}
                            className={`${iconButtonClass} border-slate-200 text-slate-700`}
                            title={t("common.archived")}
                            aria-label={t("product.archiveProduct", { name: product.name })}
                          >
                            <Icon name="archive" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProduct(product.id)}
                            className={`${iconButtonClass} border-red-200 text-red-700 hover:bg-red-50`}
                            title={t("product.moveSelectedToTrash")}
                            aria-label={t("product.moveProductToTrash", { name: product.name })}
                          >
                            <Icon name="trash" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => recoverProduct(product.id)}
                            className={`${iconButtonClass} border-green-200 text-green-700 hover:bg-green-50`}
                            title={t("product.recoverProduct", { name: product.name })}
                            aria-label={t("product.recoverProduct", { name: product.name })}
                          >
                            <Icon name="recover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => permanentlyDeleteProduct(product.id)}
                            className={`${iconButtonClass} border-red-200 text-red-700 hover:bg-red-50`}
                            title={t("product.deleteProductPermanently", { name: product.name })}
                            aria-label={t("product.deleteProductPermanently", { name: product.name })}
                          >
                            <Icon name="deleteForever" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
              {!filteredProducts.length ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan="8">
                    {t("product.noProducts")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ProductModal({
  editingExistingProduct,
  hasActiveShopPlan,
  onClose,
  productForm,
  saveProduct,
  shop,
  uploadImage,
  uploadNotice,
  updateProductField,
}) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={saveProduct}
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingExistingProduct ? t("product.edit") : t("product.create")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{shop?.name || t("shopAdmin.shopProfileRequired")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${buttonBase} border border-slate-200 bg-white text-slate-700`}
          >
            {t("common.close")}
          </button>
        </div>

        <div className="max-h-[calc(92vh-145px)] overflow-y-auto p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("product.productId")}>
              <input className={fieldClass} value={productForm.id} onChange={updateProductField("id")} />
            </Field>
            <Field label={t("common.name")}>
              <input className={fieldClass} value={productForm.name} onChange={updateProductField("name")} />
            </Field>
          <Field label={t("common.category")}>
            <input className={fieldClass} value={productForm.category} onChange={updateProductField("category")} />
          </Field>
          <Field label={t("product.price")}>
            <input className={fieldClass} value={productForm.price} onChange={updateProductField("price")} />
          </Field>
          <Field label={t("profile.gender")}>
            <select className={fieldClass} value={productForm.gender} onChange={updateProductField("gender")}>
              <option value="female">{t("common.female")}</option>
              <option value="male">{t("common.male")}</option>
              <option value="unisex">{t("common.unisex")}</option>
            </select>
          </Field>
          <Field label={t("common.stock")}>
            <select className={fieldClass} value={productForm.availability} onChange={updateProductField("availability")}>
              <option value="in_stock">in_stock</option>
              <option value="out_of_stock">out_of_stock</option>
            </select>
          </Field>
          <Field label={t("common.status")}>
            <select className={fieldClass} value={productForm.status} onChange={updateProductField("status")}>
              <option value="draft">{t("common.draft")}</option>
              <option value="published">{t("common.published")}</option>
              <option value="archived">{t("common.archived")}</option>
            </select>
          </Field>
          <Field label={t("product.colors")}>
            <input className={fieldClass} value={productForm.colors} onChange={updateProductField("colors")} />
          </Field>
          <Field label={t("product.sizes")}>
            <input className={fieldClass} value={productForm.sizes} onChange={updateProductField("sizes")} />
          </Field>
          <Field label={t("product.material")}>
            <input className={fieldClass} value={productForm.material} onChange={updateProductField("material")} />
          </Field>
          <Field label={t("product.fitType")}>
            <input className={fieldClass} value={productForm.fitType} onChange={updateProductField("fitType")} />
          </Field>
            <Field label={t("product.styleTags")}>
              <input className={fieldClass} value={productForm.styleTags} onChange={updateProductField("styleTags")} />
            </Field>
            <Field label={t("product.occasionTags")}>
              <input className={fieldClass} value={productForm.occasionTags} onChange={updateProductField("occasionTags")} />
            </Field>
            <Field label={t("product.imageUrl")} wide>
              <input className={fieldClass} value={productForm.imageUrl} onChange={updateProductField("imageUrl")} />
            </Field>
            <Field label={t("product.uploadImage")} wide>
              <input
                className={fieldClass}
                type="file"
                accept="image/*"
                disabled={!hasActiveShopPlan}
                onChange={uploadImage}
              />
            </Field>
            <Field label={t("product.description")} wide>
              <textarea
                className={`${fieldClass} min-h-28 resize-none`}
                value={productForm.description}
                onChange={updateProductField("description")}
              />
            </Field>
          </div>
          {uploadNotice ? <p className="mt-3 text-sm text-slate-500">{uploadNotice}</p> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className={`${buttonBase} border border-slate-200 bg-white text-slate-700`}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={!shop || !hasActiveShopPlan}
            className={`${buttonBase} bg-[#12356f] text-white`}
          >
            {t("product.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function BulkEditModal({
  bulkEditForm,
  onClose,
  saveBulkEditProducts,
  selectedCount,
  updateBulkEditField,
}) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={saveBulkEditProducts}
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t("shopAdmin.bulkEdit")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("shopAdmin.selectedProducts", { count: selectedCount })}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${buttonBase} border border-slate-200 bg-white text-slate-700`}
          >
            {t("common.close")}
          </button>
        </div>

        <div className="max-h-[calc(92vh-145px)] overflow-y-auto p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("common.category")}>
              <input
                className={fieldClass}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.category}
                onChange={updateBulkEditField("category")}
              />
            </Field>
            <Field label={t("product.price")}>
              <input
                className={fieldClass}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.price}
                onChange={updateBulkEditField("price")}
              />
            </Field>
            <Field label={t("profile.gender")}>
              <select
                className={fieldClass}
                value={bulkEditForm.gender}
                onChange={updateBulkEditField("gender")}
              >
                <option value="">{t("common.unchanged")}</option>
                <option value="female">{t("common.female")}</option>
                <option value="male">{t("common.male")}</option>
                <option value="unisex">{t("common.unisex")}</option>
              </select>
            </Field>
            <Field label={t("common.stock")}>
              <select
                className={fieldClass}
                value={bulkEditForm.availability}
                onChange={updateBulkEditField("availability")}
              >
                <option value="">{t("common.unchanged")}</option>
                <option value="in_stock">in_stock</option>
                <option value="out_of_stock">out_of_stock</option>
              </select>
            </Field>
            <Field label={t("common.status")}>
              <select
                className={fieldClass}
                value={bulkEditForm.status}
                onChange={updateBulkEditField("status")}
              >
                <option value="">{t("common.unchanged")}</option>
                <option value="draft">{t("common.draft")}</option>
                <option value="published">{t("common.published")}</option>
                <option value="archived">{t("common.archived")}</option>
              </select>
            </Field>
            <Field label={t("product.colors")}>
              <input
                className={fieldClass}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.colors}
                onChange={updateBulkEditField("colors")}
              />
            </Field>
            <Field label={t("product.sizes")}>
              <input
                className={fieldClass}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.sizes}
                onChange={updateBulkEditField("sizes")}
              />
            </Field>
            <Field label={t("product.material")}>
              <input
                className={fieldClass}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.material}
                onChange={updateBulkEditField("material")}
              />
            </Field>
            <Field label={t("product.fitType")}>
              <input
                className={fieldClass}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.fitType}
                onChange={updateBulkEditField("fitType")}
              />
            </Field>
            <Field label={t("product.styleTags")}>
              <input
                className={fieldClass}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.styleTags}
                onChange={updateBulkEditField("styleTags")}
              />
            </Field>
            <Field label={t("product.occasionTags")}>
              <input
                className={fieldClass}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.occasionTags}
                onChange={updateBulkEditField("occasionTags")}
              />
            </Field>
            <Field label={t("product.imageUrl")} wide>
              <input
                className={fieldClass}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.imageUrl}
                onChange={updateBulkEditField("imageUrl")}
              />
            </Field>
            <Field label={t("product.description")} wide>
              <textarea
                className={`${fieldClass} min-h-28 resize-none`}
                placeholder={t("common.unchanged")}
                value={bulkEditForm.description}
                onChange={updateBulkEditField("description")}
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className={`${buttonBase} border border-slate-200 bg-white text-slate-700`}
          >
            {t("common.cancel")}
          </button>
          <button type="submit" className={`${buttonBase} bg-[#12356f] text-white`}>
            {t("shopAdmin.applyChanges")}
          </button>
        </div>
      </form>
    </div>
  );
}

function ShopView({ deactivateShop, saveShop, shop, shopForm, updateShopField }) {
  const { t } = useLanguage();
  return (
    <form onSubmit={saveShop} className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{shop ? t("shopAdmin.editShop") : t("shopAdmin.createShop")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("shopAdmin.oneShop")}</p>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={`${buttonBase} bg-[#12356f] text-white`}>
            {t("shopAdmin.saveShop")}
          </button>
          {shop ? (
            <button
              type="button"
              onClick={deactivateShop}
              className={`${buttonBase} border border-slate-200 bg-white text-slate-700`}
            >
              {t("shopAdmin.deactivate")}
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <Field label={t("common.name")}>
          <input className={fieldClass} value={shopForm.name} onChange={updateShopField("name")} />
        </Field>
        <Field label="Slug">
          <input className={fieldClass} value={shopForm.slug} onChange={updateShopField("slug")} />
        </Field>
        <Field label={t("product.description")} wide>
          <textarea
            className={`${fieldClass} min-h-28 resize-none`}
            value={shopForm.description}
            onChange={updateShopField("description")}
          />
        </Field>
        <Field label={t("shopAdmin.logoUrl")}>
          <input className={fieldClass} value={shopForm.logoUrl} onChange={updateShopField("logoUrl")} />
        </Field>
        <Field label={t("shopAdmin.coverUrl")}>
          <input className={fieldClass} value={shopForm.coverUrl} onChange={updateShopField("coverUrl")} />
        </Field>
        <Field label={t("shopAdmin.contactEmail")}>
          <input className={fieldClass} value={shopForm.contactEmail} onChange={updateShopField("contactEmail")} />
        </Field>
        <Field label={t("shopAdmin.contactPhone")}>
          <input className={fieldClass} value={shopForm.contactPhone} onChange={updateShopField("contactPhone")} />
        </Field>
        <Field label={t("shopAdmin.contactAddress")} wide>
          <input className={fieldClass} value={shopForm.contactAddress} onChange={updateShopField("contactAddress")} />
        </Field>
        <Field label={t("common.status")}>
          <select className={fieldClass} value={shopForm.status} onChange={updateShopField("status")}>
            <option value="active">{t("common.active")}</option>
            <option value="inactive">{t("common.inactive")}</option>
          </select>
        </Field>
      </div>
    </form>
  );
}

function ImportView({
  downloadTemplate,
  hasActiveShopPlan,
  importExcel,
  importResult,
  shop,
}) {
  const { t } = useLanguage();
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">{t("shopAdmin.importProducts")}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {shop && hasActiveShopPlan
            ? t("shopAdmin.importReady")
            : t("shopAdmin.importLocked")}
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className={`${buttonBase} mt-5 w-full border border-slate-200 bg-white text-slate-700`}
        >
          {t("shopAdmin.downloadTemplate")}
        </button>
        <Field label={t("shopAdmin.uploadXlsx")}>
          <input
            className={fieldClass}
            type="file"
            accept=".xlsx"
            disabled={!shop || !hasActiveShopPlan}
            onChange={importExcel}
          />
        </Field>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">{t("shopAdmin.importResult")}</h2>
        {importResult ? (
          <div className="mt-4 grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label={t("common.status")} value={importResult.status} />
              <Metric label={t("common.rows")} value={importResult.totalRows} />
              <Metric label={t("common.success")} value={importResult.successCount} />
              <Metric label={t("common.failed")} value={importResult.failedCount} />
            </div>
            {importResult.errors?.length ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">{t("common.errors")}</p>
                <ul className="mt-2 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={`${error.row}-${error.field}-${index}`}>
                      {t("shopAdmin.errorRow", { row: error.row, field: error.field, message: error.message })}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">{t("shopAdmin.noImportResult")}</p>
        )}
      </section>
    </div>
  );
}

function RangeControl({ range, setRange }) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-1">
      {["7d", "30d", "90d"].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setRange(item)}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            range === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function PremiumPaywall({ onCheckout, titleKey }) {
  const { t } = useLanguage();
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{t(titleKey)}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        {t("shopAdmin.premiumPaywall")}
      </p>
      <button
        type="button"
        onClick={onCheckout}
        className={`${buttonBase} mt-5 bg-[#12356f] text-white`}
      >
        {t("shopAdmin.checkout")}
      </button>
    </section>
  );
}

function AnalyticsView({ analytics, range, setRange, status }) {
  const summary = analytics?.summary || {};
  const { t } = useLanguage();

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("shopAdmin.analyticsTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("shopAdmin.analyticsDescription")}
          </p>
        </div>
        <RangeControl range={range} setRange={setRange} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label={t("shopAdmin.products")} value={summary.totalProducts ?? 0} />
        <Metric label={t("common.published")} value={summary.publishedProducts ?? 0} />
        <Metric label={t("shopAdmin.productViews")} value={summary.productViews ?? 0} />
        <Metric label={t("shopAdmin.tryOns")} value={summary.tryOnClicks ?? 0} />
        <Metric label={t("shopAdmin.stylistMatches")} value={summary.stylistMatches ?? 0} />
        <Metric label={t("shopAdmin.feedback")} value={summary.feedbackCount ?? 0} />
        <Metric label={t("shopAdmin.outOfStock")} value={summary.outOfStockProducts ?? 0} />
        <Metric label={t("common.draft")} value={summary.draftProducts ?? 0} />
        <Metric label={t("shopAdmin.conversion")} value={formatPercent(summary.conversionRate)} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-bold text-slate-900">{t("shopAdmin.topProducts")}</h2>
          {status === "loading" ? <p className="mt-1 text-sm text-slate-500">{t("common.loading")}</p> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("product.product")}</th>
                <th className="px-4 py-3">{t("shopAdmin.productViews")}</th>
                <th className="px-4 py-3">{t("shopAdmin.tryOns")}</th>
                <th className="px-4 py-3">Stylist</th>
                <th className="px-4 py-3">{t("shopAdmin.feedback")}</th>
                <th className="px-4 py-3">{t("shopAdmin.ratings")}</th>
                <th className="px-4 py-3">{t("shopAdmin.conversion")}</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.topProducts || []).map((product) => (
                <tr key={product.productId} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">{product.name}</td>
                  <td className="px-4 py-3">{product.views}</td>
                  <td className="px-4 py-3">{product.tryOns}</td>
                  <td className="px-4 py-3">{product.stylistMatches}</td>
                  <td className="px-4 py-3">{product.feedbackCount}</td>
                  <td className="px-4 py-3">{product.averageRating || "-"}</td>
                  <td className="px-4 py-3">{formatPercent(product.conversionRate)}</td>
                </tr>
              ))}
              {!analytics?.topProducts?.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="7">
                    {t("shopAdmin.noAnalytics")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function InsightsView({ insights, range, setRange, status }) {
  const breakdowns = insights?.breakdowns || {};
  const { t } = useLanguage();

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("shopAdmin.anonymousInsights")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("shopAdmin.privacyDescription")}
          </p>
        </div>
        <RangeControl range={range} setRange={setRange} />
      </div>

      {status === "loading" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          {t("shopAdmin.loadingInsights")}
        </div>
      ) : null}

      {insights && !insights.enoughData ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {t("shopAdmin.currentSample", {
            message: insights.message || t("shopAdmin.notEnoughData"),
            events: insights.eventCount || 0,
            users: insights.userCount || 0,
          })}
        </div>
      ) : null}

      {insights?.enoughData ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <InsightCard title={t("profile.gender")} items={breakdowns.gender} />
          <InsightCard title={t("shopAdmin.bodyShape")} items={breakdowns.bodyShape} />
          <InsightCard title={t("shopAdmin.skinTone")} items={breakdowns.skinTone} />
          <InsightCard title={t("shopAdmin.stylePreferences")} items={breakdowns.stylePreferences} />
          <InsightCard title={t("shopAdmin.occasions")} items={breakdowns.occasions} />
          <InsightCard title={t("shopAdmin.budgetBuckets")} items={breakdowns.budgetBuckets} />
          <InsightCard title={t("shopAdmin.interestedStyleTags")} items={breakdowns.styleTags} />
          <InsightCard title={t("shopAdmin.interestedColors")} items={breakdowns.colors} />
          <InsightCard title={t("shopAdmin.ratings")} items={breakdowns.ratings} />
        </div>
      ) : null}
    </section>
  );
}

function InsightCard({ items = [], title }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  const { t } = useLanguage();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className="text-slate-500">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#12356f]"
                style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }}
              />
            </div>
          </div>
        ))}
        {!items.length ? <p className="text-sm text-slate-500">{t("shopAdmin.noSignal")}</p> : null}
      </div>
    </section>
  );
}

function Field({ children, label, wide = false }) {
  return (
    <label className={`grid gap-2 ${wide ? "md:col-span-2" : ""}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Notice({ message, type }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-white text-slate-600";

  return <div className={`mb-5 rounded-xl border p-3 text-sm ${styles}`}>{message}</div>;
}

function Icon({ name }) {
  const icons = {
    archive: (
      <>
        <path d="M3 7h18" />
        <path d="M5 7v12h14V7" />
        <path d="M8 7V5h8v2" />
        <path d="M10 12h4" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
        <path d="m14 7 3 3" />
      </>
    ),
    deleteForever: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M6 6l1 14h10l1-14" />
        <path d="m10 11 4 4" />
        <path d="m14 11-4 4" />
      </>
    ),
    recover: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v6h6" />
        <path d="M12 8v5l3 2" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M6 6l1 14h10l1-14" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  );
}

function StatusBadge({ status }) {
  const styles = {
    published: "border-green-200 bg-green-50 text-green-700",
    draft: "border-yellow-200 bg-yellow-50 text-yellow-700",
    archived: "border-slate-200 bg-slate-100 text-slate-600",
    trashed: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${styles[status] || styles.archived}`}>
      {status}
    </span>
  );
}

export default ShopDashboardPage;
