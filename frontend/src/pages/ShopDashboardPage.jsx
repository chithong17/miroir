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
  getShopDashboard,
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
  uploadShopPaymentQr,
} from "../api/shopApi.js";
import { decideShopCancellation, getShopOrder, listOwnerDisputes, listShopNotifications, listShopOrders, readShopNotification, replyOwnerDispute, updateShopOrderPayment, updateShopOrderStatus } from "../api/commerceApi.js";

const fieldClass =
  "w-full rounded-lg border border-mintSoft bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-mintDeep focus:ring-2 focus:ring-mintSoft/50";
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
  bankTransferEnabled: false,
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  qrImageUrl: "",
  qrImagePublicId: "",
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
  variantsJson: "[]",
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
  bankTransferEnabled: Boolean(shop.paymentSettings?.bankTransferEnabled),
  bankName: shop.paymentSettings?.bankName || "",
  accountHolder: shop.paymentSettings?.accountHolder || "",
  accountNumber: shop.paymentSettings?.accountNumber || "",
  qrImageUrl: shop.paymentSettings?.qrImageUrl || "",
  qrImagePublicId: shop.paymentSettings?.qrImagePublicId || "",
});

const productToForm = (product) => ({
  ...emptyProduct,
  ...product,
  price: product.price ?? "",
  colors: toInputList(product.colors),
  sizes: toInputList(product.sizes),
  styleTags: toInputList(product.styleTags),
  occasionTags: toInputList(product.occasionTags),
  variantsJson: JSON.stringify(product.variants || [], null, 2),
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
  const [commerceDashboard, setCommerceDashboard] = useState(null);
  const [insights, setInsights] = useState(null);
  const [premiumDataStatus, setPremiumDataStatus] = useState("idle");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilters, setOrderFilters] = useState({ search: "", orderStatus: "", paymentStatus: "" });
  const [shopNotifications, setShopNotifications] = useState([]);
  const [shopUnreadCount, setShopUnreadCount] = useState(0);
  const [shopDisputes, setShopDisputes] = useState([]);

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
      const [analyticsResponse, dashboardResponse] = await Promise.all([
        getShopAnalytics({ range }),
        getShopDashboard({ range }),
      ]);
      setAnalytics(analyticsResponse.analytics);
      setCommerceDashboard(dashboardResponse.dashboard);
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

  const loadOrders = async () => {
    try { const [orderResult, disputeResult] = await Promise.all([listShopOrders(orderFilters), listOwnerDisputes()]); setOrders(orderResult.orders || []); setShopDisputes(disputeResult.disputes || []); }
    catch (error) { showNotice(error.response?.data?.message || "Không tải được đơn hàng.", "error"); }
  };
  useEffect(() => { if (view === "orders") loadOrders(); }, [view]);
  useEffect(() => {
    const refresh = () => listShopNotifications().then((result) => { setShopNotifications(result.notifications || []); setShopUnreadCount(result.unreadCount || 0); }).catch(() => {});
    refresh(); const interval = setInterval(refresh, 30000); window.addEventListener("focus", refresh);
    return () => { clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);

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
    window.location.href = "/shop/products/new";
  };

  const editProduct = (product) => {
    window.location.href = `/shop/products/${encodeURIComponent(product.id)}`;
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
      paymentSettings: {
        bankTransferEnabled: Boolean(shopForm.bankTransferEnabled),
        bankName: shopForm.bankName,
        accountHolder: shopForm.accountHolder,
        accountNumber: shopForm.accountNumber,
        qrImageUrl: shopForm.qrImageUrl,
        qrImagePublicId: shopForm.qrImagePublicId,
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

    let variants;
    try {
      variants = JSON.parse(productForm.variantsJson || "[]");
      if (!Array.isArray(variants)) throw new Error();
    } catch {
      showNotice("Danh sách variants phải là JSON array hợp lệ.", "error");
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
      variants,
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
    <div className="min-h-screen bg-white text-slate-900">
      <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <DashboardSidebar
          logout={logout}
          setView={setView}
          shop={shop}
          stats={stats}
          view={view}
          unreadCount={shopUnreadCount}
        />

        <main className="min-w-0 p-3 sm:p-4 md:p-6">
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
                onQrUpload={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const result = await uploadShopPaymentQr(file); setShopForm(shopToForm(result.shop)); showNotice("Đã tải QR thanh toán."); } catch (error) { showNotice(error.response?.data?.message || "Không tải được QR.", "error"); } }}
              />
            ) : null}

            {view === "orders" ? <ShopOrdersView orders={orders} disputes={shopDisputes} filters={orderFilters} setFilters={setOrderFilters} reload={loadOrders} onSelect={async (id) => setSelectedOrder((await getShopOrder(id)).order)} notifications={shopNotifications} onReadNotification={async (item) => { if (!item.readAt) { await readShopNotification(item.id); setShopUnreadCount((count) => Math.max(count - 1, 0)); setShopNotifications((all) => all.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date() } : entry)); } if (item.orderId) setSelectedOrder((await getShopOrder(item.orderId)).order); }} onReplyDispute={async (item) => { const message = window.prompt("Phản hồi customer về khiếu nại:"); if (message) { await replyOwnerDispute(item.id, message); loadOrders(); } }} /> : null}

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
                  commerceDashboard={commerceDashboard}
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

      {isBulkEditModalOpen ? (
        <BulkEditModal
          bulkEditForm={bulkEditForm}
          onClose={closeBulkEditModal}
          saveBulkEditProducts={saveBulkEditProducts}
          selectedCount={selectedProductIds.length}
          updateBulkEditField={updateBulkEditField}
        />
      ) : null}
      {selectedOrder ? <ShopOrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onChanged={async () => { const refreshed = (await getShopOrder(selectedOrder.id)).order; setSelectedOrder(refreshed); loadOrders(); }} /> : null}
    </div>
  );
}

function DashboardSidebar({ logout, setView, shop, stats, unreadCount, view }) {
  const { t, language, toggleLanguage } = useLanguage();
  const navItems = [
    ["products", t("shopAdmin.products") || "Products"],
    ["orders", `Đơn hàng${unreadCount ? ` (${unreadCount})` : ""}`],
    ["analytics", t("shopAdmin.analytics") || "Analytics"],
    ["insights", t("shopAdmin.insights") || "Customer Insights"],
    ["trash", t("shopAdmin.trash") || "Trash"],
    ["shop", t("shopAdmin.shopProfile") || "Shop Profile"],
    ["import", t("shopAdmin.excelImport") || "Excel Import"],
  ];

  return (
    <aside className="border-b border-line bg-white/80 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex min-h-full flex-col">
        <div className="border-b border-line p-4 sm:p-5">
          <a href="/" className="font-display text-2xl font-extrabold text-rose">
            MIROIR
          </a>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("shopAdmin.title") || "Shop Owner"}
          </p>
        </div>

        <div className="p-3 sm:p-4">
          <div className="rounded-xl border border-line bg-white/80 p-4">
            <p className={labelClass}>{t("shopAdmin.currentShop") || "Current shop"}</p>
            <p className="mt-2 truncate text-base font-bold text-ink">
              {shop?.name || t("shopAdmin.noShopYet") || "No shop yet"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {shop ? `${shop.slug} / ${shop.status}` : t("shopAdmin.createProfileFirst") || "Create profile first"}
            </p>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-3 pb-1 lg:grid lg:gap-1 lg:overflow-visible lg:pb-0">
          {navItems.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`shrink-0 rounded-lg px-4 py-3 text-left text-sm font-semibold transition lg:shrink ${
                view === key
                  ? "bg-mintDeep text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden grid-cols-2 gap-2 p-4 sm:grid">
          <Metric label={t("common.total")} value={stats.total} />
          <Metric label={t("common.live")} value={stats.published} />
          <Metric label={t("common.draft")} value={stats.draft} />
          <Metric label={t("common.trash")} value={stats.trashed} />
        </div>

        <div className="mt-3 grid gap-2 border-t border-line p-3 sm:p-4 lg:mt-auto">
          <a
            href="/stylist"
            className="rounded-lg px-4 py-3 text-sm font-semibold text-muted hover:bg-accentSoft/70 hover:text-ink"
          >
            AI Stylist
          </a>
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-muted hover:bg-accentSoft/70 hover:text-ink"
          >
            {language === "en" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-tertiarySoft px-4 py-3 text-left text-sm font-semibold text-ink"
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
        : view === "orders"
          ? "Đơn hàng"
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
            className={`${buttonBase} bg-mintDeep text-white hover:bg-mint`}
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
        <button type="button" className={`${buttonBase} bg-mintDeep text-white hover:bg-mint`} onClick={onCheckout}>
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
  const totalVariantStock = filteredProducts.reduce(
    (total, product) => total + (product.variants || []).reduce(
      (sum, variant) => sum + (variant.active ? Number(variant.stockQuantity || 0) : 0), 0
    ), 0
  );

  return (
    <div>
      {!inTrash && filteredProducts.length > 0 && totalVariantStock === 0 ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-bold">Sản phẩm vẫn còn trong database nhưng toàn bộ tồn kho đang bằng 0.</p>
          <p className="mt-1">Mở từng sản phẩm, cập nhật <code>stockQuantity</code> trong danh sách variants rồi lưu. Sản phẩm chỉ xuất hiện lại trên marketplace khi có biến thể active với tồn kho lớn hơn 0.</p>
        </div>
      ) : null}
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
                    className="h-4 w-4 rounded border-mintSoft text-mintDeep focus:ring-mintDeep"
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
                    selected ? "bg-mintPale/70" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleProductSelection(product.id)}
                      className={`h-4 w-4 rounded border-mintSoft text-mintDeep focus:ring-mintDeep ${
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
                        <button type="button" className="block max-w-full truncate text-left font-semibold text-slate-900 hover:text-mintDeep hover:underline" onClick={() => editProduct(product)}>{product.name}</button>
                        <p className="truncate text-xs text-slate-500">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.category}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(product.price)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{product.availability}</p>
                    <p className="text-xs font-semibold text-slate-500">{(product.variants || []).reduce((sum, variant) => sum + Number(variant.stockQuantity || 0), 0)} sản phẩm</p>
                  </td>
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
            <Field label="Biến thể / SKU / tồn kho (JSON)" wide>
              <textarea className={`${fieldClass} min-h-40 font-mono text-xs`} value={productForm.variantsJson} onChange={updateProductField("variantsJson")} placeholder='[{"sku":"AO-TRANG-M","color":"Trắng","size":"M","stockQuantity":10,"active":true}]' />
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
            className={`${buttonBase} bg-mintDeep text-white hover:bg-mint`}
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
          <button type="submit" className={`${buttonBase} bg-mintDeep text-white hover:bg-mint`}>
            {t("shopAdmin.applyChanges")}
          </button>
        </div>
      </form>
    </div>
  );
}

function ShopView({ deactivateShop, onQrUpload, saveShop, shop, shopForm, updateShopField }) {
  const { t } = useLanguage();
  return (
    <form onSubmit={saveShop} className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{shop ? t("shopAdmin.editShop") : t("shopAdmin.createShop")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("shopAdmin.oneShop")}</p>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={`${buttonBase} bg-mintDeep text-white hover:bg-mint`}>
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
        <div className="md:col-span-2 mt-3 border-t border-line pt-5"><h3 className="text-lg font-black">Tài khoản nhận chuyển khoản</h3><p className="mt-1 text-sm text-muted">Chỉ hiển thị trong đơn hàng thuộc đúng customer. Bật chuyển khoản khi đủ thông tin và QR.</p></div>
        <Field label="Ngân hàng"><input className={fieldClass} value={shopForm.bankName} onChange={updateShopField("bankName")} /></Field>
        <Field label="Chủ tài khoản"><input className={fieldClass} value={shopForm.accountHolder} onChange={updateShopField("accountHolder")} /></Field>
        <Field label="Số tài khoản"><input className={fieldClass} value={shopForm.accountNumber} onChange={updateShopField("accountNumber")} /></Field>
        <Field label="Ảnh QR"><input className={fieldClass} type="file" accept="image/*" onChange={onQrUpload} />{shopForm.qrImageUrl ? <img className="mt-3 max-h-48 rounded-xl" src={shopForm.qrImageUrl} alt="QR" /> : null}</Field>
        <label className="md:col-span-2 flex items-center gap-2 rounded-xl bg-accentSoft p-4"><input type="checkbox" checked={shopForm.bankTransferEnabled} onChange={(event) => updateShopField("bankTransferEnabled")({ target: { value: event.target.checked } })} /> Cho phép customer chọn chuyển khoản</label>
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
        className={`${buttonBase} mt-5 bg-mintDeep text-white hover:bg-mint`}
      >
        {t("shopAdmin.checkout")}
      </button>
    </section>
  );
}

function AnalyticsView({ analytics, commerceDashboard, range, setRange, status }) {
  const summary = analytics?.summary || {};
  const timeSeries = analytics?.timeSeries || [];
  const topProducts = analytics?.topProducts || [];
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

      <SalesDashboardSummary dashboard={commerceDashboard} />

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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.7fr)]">
        <AnalyticsTrendChart series={timeSeries} loading={status === "loading"} />
        <ConversionFanChart summary={summary} />
      </div>

      <ProductBarChart products={topProducts} loading={status === "loading"} />

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
              {topProducts.map((product) => (
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
              {!topProducts.length ? (
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

function SalesDashboardSummary({ dashboard }) {
  const summary = dashboard?.summary || {};
  const funnel = dashboard?.funnel || {};
  const inventory = dashboard?.inventoryHealth || {};
  const bestSellers = dashboard?.topProducts || [];
  const salesSeries = dashboard?.salesSeries || [];
  const orderStatuses = dashboard?.orderStatusBreakdown || [];
  const paymentStatuses = dashboard?.paymentStatusBreakdown || [];

  return (
    <section className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Collected revenue" value={formatMoney(summary.collectedRevenue)} />
        <Metric label="Projected revenue" value={formatMoney(summary.projectedRevenue)} />
        <Metric label="Orders" value={summary.totalOrders || 0} />
        <Metric label="Average order" value={formatMoney(summary.averageOrderValue)} />
        <Metric label="Pending orders" value={summary.pendingOrders || 0} />
        <Metric label="Refund value" value={formatMoney(summary.refundValue)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <RevenueDashboardChart series={salesSeries} />
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-bold text-slate-900">Customer journey</h3>
          <FunnelDashboardChart funnel={funnel} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[["Views", funnel.views], ["Try-ons", funnel.tryOns], ["Stylist", funnel.stylistMatches], ["Feedback", funnel.feedback], ["Orders", funnel.orders], ["Paid", funnel.paidOrders]].map(([label, value]) => <Metric key={label} label={label} value={value || 0} />)}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-bold text-slate-900">Catalog health</h3>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
            <span className="rounded-full bg-mintSoft px-3 py-2">Published: {inventory.published || 0}</span>
            <span className="rounded-full bg-slate-100 px-3 py-2">Draft: {inventory.draft || 0}</span>
            <span className="rounded-full bg-amber-50 px-3 py-2">Out of stock: {inventory.outOfStock || 0}</span>
            <span className="rounded-full bg-red-50 px-3 py-2">Needs embedding: {inventory.needsEmbedding || 0}</span>
          </div>
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <BreakdownDashboardChart title="Order status" items={orderStatuses} />
        <BreakdownDashboardChart title="Payment status" items={paymentStatuses} />
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-bold text-slate-900">Best sellers by collected revenue</h3>
        {!bestSellers.length ? <p className="mt-3 text-sm text-slate-500">No paid orders in this period.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.1em] text-slate-500"><tr><th className="pb-2">Product</th><th className="pb-2">Sold</th><th className="pb-2">Orders</th><th className="pb-2">Collected revenue</th></tr></thead><tbody>{bestSellers.map((product) => <tr key={product.productId || product.name} className="border-t border-slate-100"><td className="py-3 font-semibold text-slate-900">{product.name}</td><td>{product.quantity}</td><td>{product.orderCount}</td><td className="font-semibold">{formatMoney(product.collectedRevenue)}</td></tr>)}</tbody></table></div>}
      </section>
    </section>
  );
}

function RevenueDashboardChart({ series = [] }) {
  const width = 620;
  const height = 230;
  const padding = { top: 20, right: 16, bottom: 30, left: 16 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...series.flatMap((item) => [Number(item.collectedRevenue || 0), Number(item.projectedRevenue || 0)]));
  const xAt = (index) => padding.left + (series.length <= 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth);
  const yAt = (value) => padding.top + plotHeight - (Number(value || 0) / maxValue) * plotHeight;
  const pathFor = (key) => series.map((item, index) => `${index ? "L" : "M"} ${xAt(index)} ${yAt(item[key])}`).join(" ");
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-bold text-slate-900">Revenue trend</h3>
      <p className="mt-1 text-sm text-slate-500">Collected versus projected revenue.</p>
      {!series.length ? <EmptyChart /> : <>
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-56 w-full overflow-visible">
          {[0, 1, 2, 3].map((index) => <line key={index} x1={padding.left} x2={width - padding.right} y1={padding.top + (plotHeight * index) / 3} y2={padding.top + (plotHeight * index) / 3} stroke="#e7eedc" strokeDasharray="4 4" />)}
          <path d={pathFor("projectedRevenue")} fill="none" stroke="#B3D07E" strokeWidth="3" strokeLinecap="round" />
          <path d={pathFor("collectedRevenue")} fill="none" stroke="#94B16F" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="flex gap-4 text-xs font-semibold text-slate-600"><span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-mintDeep" />Collected</span><span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-mint" />Projected</span></div>
      </>}
    </section>
  );
}

function FunnelDashboardChart({ funnel = {} }) {
  const steps = [["Views", funnel.views], ["Try-ons", funnel.tryOns], ["Stylist", funnel.stylistMatches], ["Orders", funnel.orders], ["Paid", funnel.paidOrders]];
  const maxValue = Math.max(1, ...steps.map(([, value]) => Number(value || 0)));
  return <div className="mt-4 space-y-3">{steps.map(([label, value]) => <div key={label} className="grid grid-cols-[78px_1fr_32px] items-center gap-3 text-sm"><span className="font-medium text-slate-600">{label}</span><div className="h-2.5 overflow-hidden rounded-full bg-mintSoft"><div className="h-full rounded-full bg-mintDeep" style={{ width: `${(Number(value || 0) / maxValue) * 100}%` }} /></div><strong className="text-right">{value || 0}</strong></div>)}</div>;
}

function BreakdownDashboardChart({ title, items = [] }) {
  const validItems = items.filter((item) => Number(item.count || 0) > 0);
  const total = validItems.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const colors = ["#94B16F", "#B3D07E", "#BEDA9D", "#5E9C5D", "#9BA891"];
  let cursor = 0;
  const stops = validItems.map((item, index) => {
    const start = total ? (cursor / total) * 100 : 0;
    cursor += Number(item.count || 0);
    return `${colors[index % colors.length]} ${start}% ${(cursor / total) * 100}%`;
  });
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="font-bold text-slate-900">{title}</h3>{!validItems.length ? <EmptyChart /> : <div className="mt-4 flex items-center gap-5"><div className="h-28 w-28 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops.join(",")})`, mask: "radial-gradient(transparent 54%, #000 55%)", WebkitMask: "radial-gradient(transparent 54%, #000 55%)" }} /><div className="min-w-0 flex-1 space-y-2">{validItems.slice(0, 4).map((item, index) => <div key={item.key} className="flex items-center gap-2 text-sm"><i className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} /><span className="flex-1 truncate capitalize">{String(item.key || "unknown").replaceAll("_", " ")}</span><strong>{item.count}</strong></div>)}</div></div>}</section>;
}

function EmptyChart() {
  return <div className="flex h-32 items-center justify-center text-sm text-slate-500">No data for this period.</div>;
}
function AnalyticsTrendChart({ series = [], loading = false }) {
  const { language, t } = useLanguage();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const width = 760;
  const height = 300;
  const padding = { top: 24, right: 20, bottom: 46, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const lines = [
    { key: "views", label: t("shopAdmin.productViews"), color: "#94B16F" },
    { key: "tryOns", label: t("shopAdmin.tryOns"), color: "#111111" },
    { key: "stylistMatches", label: t("shopAdmin.stylistMatches"), color: "#B3D07E" },
  ];
  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => lines.map((line) => Number(item[line.key] || 0))),
  );
  const xAt = (index) =>
    padding.left + (series.length <= 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth);
  const yAt = (value) => padding.top + plotHeight - (Number(value || 0) / maxValue) * plotHeight;
  const pathFor = (key) =>
    series.map((item, index) => `${index ? "L" : "M"} ${xAt(index)} ${yAt(item[key])}`).join(" ");
  const tickCount = Math.min(series.length, series.length > 45 ? 5 : 6);
  const dateTicks = tickCount
    ? [...new Set(Array.from({ length: tickCount }, (_, index) => Math.round((index * (series.length - 1)) / Math.max(tickCount - 1, 1))))]
    : [];
  const dateFormatter = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });
  const fullDateFormatter = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hoveredPoint = hoveredIndex === null ? null : series[hoveredIndex];
  const tooltipWidth = 190;
  const tooltipHeight = 88;
  const tooltipX = hoveredPoint
    ? Math.min(
        Math.max(xAt(hoveredIndex) + 12, padding.left + 4),
        width - padding.right - tooltipWidth,
      )
    : 0;

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t("shopAdmin.engagementTrend")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("shopAdmin.dailyActivity")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
          {lines.map((line) => (
            <span key={line.key} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
              {line.label}
            </span>
          ))}
        </div>
      </div>

      {series.length ? (
        <div className="mt-5 overflow-x-auto pb-2">
          <svg
            className="h-auto min-w-[640px] w-full"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={t("shopAdmin.trendChartLabel")}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + ratio * plotHeight;
              return (
                <g key={ratio}>
                  <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#E4F1D7" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="#6B6B6B" fontSize="11">
                    {Math.round(maxValue * (1 - ratio))}
                  </text>
                </g>
              );
            })}
            {dateTicks.map((index) => (
              <text
                key={series[index].date}
                x={xAt(index)}
                y={height - 14}
                textAnchor="middle"
                fill="#6B6B6B"
                fontSize="11"
              >
                {dateFormatter.format(new Date(`${series[index].date}T00:00:00Z`))}
              </text>
            ))}
            {lines.map((line) => (
              <g key={line.key}>
                <path
                  d={pathFor(line.key)}
                  fill="none"
                  stroke={line.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={line.key === "views" ? 4 : 3}
                />
                {series.length <= 14
                  ? series.map((item, index) => (
                      <circle
                        key={`${line.key}-${item.date}`}
                        cx={xAt(index)}
                        cy={yAt(item[line.key])}
                        r="3.5"
                        fill="white"
                        stroke={line.color}
                        strokeWidth="2"
                      >
                        <title>{`${line.label}: ${item[line.key] || 0}`}</title>
                      </circle>
                    ))
                  : null}
              </g>
            ))}
            {series.map((item, index) => {
              const left = index === 0 ? padding.left : (xAt(index - 1) + xAt(index)) / 2;
              const right = index === series.length - 1 ? width - padding.right : (xAt(index) + xAt(index + 1)) / 2;
              const detail = lines.map((line) => `${line.label}: ${item[line.key] || 0}`).join(", ");
              return (
                <rect
                  key={`hover-${item.date}`}
                  x={left}
                  y={padding.top}
                  width={Math.max(right - left, 1)}
                  height={plotHeight}
                  fill="transparent"
                  tabIndex="0"
                  aria-label={`${fullDateFormatter.format(new Date(`${item.date}T00:00:00Z`))}. ${detail}`}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  onMouseEnter={() => setHoveredIndex(index)}
                />
              );
            })}
            {hoveredPoint ? (
              <g pointerEvents="none">
                <line
                  x1={xAt(hoveredIndex)}
                  x2={xAt(hoveredIndex)}
                  y1={padding.top}
                  y2={padding.top + plotHeight}
                  stroke="#94B16F"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                {lines.map((line) => (
                  <circle
                    key={`active-${line.key}`}
                    cx={xAt(hoveredIndex)}
                    cy={yAt(hoveredPoint[line.key])}
                    r="5"
                    fill="white"
                    stroke={line.color}
                    strokeWidth="3"
                  />
                ))}
                <rect
                  x={tooltipX}
                  y={padding.top + 4}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="10"
                  fill="#94B16F"
                />
                <text x={tooltipX + 12} y={padding.top + 23} fill="white" fontSize="12" fontWeight="700">
                  {fullDateFormatter.format(new Date(`${hoveredPoint.date}T00:00:00Z`))}
                </text>
                {lines.map((line, index) => (
                  <text key={`tooltip-${line.key}`} x={tooltipX + 12} y={padding.top + 43 + index * 15} fill="white" fontSize="11">
                    {`${line.label}: ${hoveredPoint[line.key] || 0}`}
                  </text>
                ))}
              </g>
            ) : null}
          </svg>
        </div>
      ) : (
        <ChartEmpty loading={loading} />
      )}
    </section>
  );
}

function ProductBarChart({ products = [], loading = false }) {
  const { t } = useLanguage();
  const [hoveredBar, setHoveredBar] = useState(null);
  const data = products.slice(0, 6);
  const width = 960;
  const height = 340;
  const padding = { top: 28, right: 24, bottom: 76, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const series = [
    { key: "views", label: t("shopAdmin.productViews"), color: "#94B16F" },
    { key: "tryOns", label: t("shopAdmin.tryOns"), color: "#B3D07E" },
    { key: "stylistMatches", label: t("shopAdmin.stylistMatches"), color: "#111111" },
  ];
  const maxValue = Math.max(1, ...data.flatMap((product) => series.map((item) => Number(product[item.key] || 0))));
  const groupWidth = data.length ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(24, Math.max(12, groupWidth / 5));
  const yAt = (value) => padding.top + plotHeight - (Number(value || 0) / maxValue) * plotHeight;
  const shortName = (name = "") => (name.length > 16 ? `${name.slice(0, 14)}…` : name);
  const hoveredProduct = hoveredBar ? data[hoveredBar.productIndex] : null;
  const hoveredSeries = hoveredBar ? series[hoveredBar.seriesIndex] : null;
  const hoveredValue = hoveredProduct && hoveredSeries ? Number(hoveredProduct[hoveredSeries.key] || 0) : 0;
  const hoveredGroupCenter = hoveredBar
    ? padding.left + groupWidth * hoveredBar.productIndex + groupWidth / 2
    : 0;
  const barTooltipWidth = 200;
  const barTooltipX = Math.min(
    Math.max(hoveredGroupCenter - barTooltipWidth / 2, padding.left + 4),
    width - padding.right - barTooltipWidth,
  );
  const barTooltipY = Math.max(8, yAt(hoveredValue) - 66);

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t("shopAdmin.productComparison")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("shopAdmin.topProducts")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
          {series.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {data.length ? (
        <div className="mt-5 overflow-x-auto pb-2">
          <svg
            className="h-auto min-w-[760px] w-full"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={t("shopAdmin.productChartLabel")}
            onMouseLeave={() => setHoveredBar(null)}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + ratio * plotHeight;
              return (
                <g key={ratio}>
                  <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#E4F1D7" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="#6B6B6B" fontSize="11">
                    {Math.round(maxValue * (1 - ratio))}
                  </text>
                </g>
              );
            })}
            {data.map((product, productIndex) => {
              const groupCenter = padding.left + groupWidth * productIndex + groupWidth / 2;
              const totalBarsWidth = barWidth * series.length + 6 * (series.length - 1);
              return (
                <g key={product.productId}>
                  {series.map((item, seriesIndex) => {
                    const value = Number(product[item.key] || 0);
                    const x = groupCenter - totalBarsWidth / 2 + seriesIndex * (barWidth + 6);
                    const y = yAt(value);
                    return (
                      <rect
                        key={item.key}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(padding.top + plotHeight - y, value ? 2 : 0)}
                        rx="4"
                        fill={item.color}
                        className="cursor-help"
                        tabIndex="0"
                        aria-label={`${product.name}. ${item.label}: ${value}`}
                        onFocus={() => setHoveredBar({ productIndex, seriesIndex })}
                        onBlur={() => setHoveredBar(null)}
                        onMouseEnter={() => setHoveredBar({ productIndex, seriesIndex })}
                      >
                        <title>{`${product.name} · ${item.label}: ${value}`}</title>
                      </rect>
                    );
                  })}
                  <text x={groupCenter} y={height - 48} textAnchor="middle" fill="#333333" fontSize="11" fontWeight="600">
                    {shortName(product.name)}
                  </text>
                  <text x={groupCenter} y={height - 29} textAnchor="middle" fill="#6B6B6B" fontSize="10">
                    {formatPercent(product.conversionRate)}
                  </text>
                </g>
              );
            })}
            <text x={width - padding.right} y={height - 8} textAnchor="end" fill="#6B6B6B" fontSize="10">
              {t("shopAdmin.conversion")}
            </text>
            {hoveredProduct && hoveredSeries ? (
              <g pointerEvents="none">
                <rect x={barTooltipX} y={barTooltipY} width={barTooltipWidth} height="54" rx="10" fill="#94B16F" />
                <text x={barTooltipX + 12} y={barTooltipY + 21} fill="white" fontSize="12" fontWeight="700">
                  {hoveredProduct.name.length > 25 ? `${hoveredProduct.name.slice(0, 23)}…` : hoveredProduct.name}
                </text>
                <text x={barTooltipX + 12} y={barTooltipY + 41} fill="white" fontSize="12">
                  {`${hoveredSeries.label}: ${hoveredValue}`}
                </text>
              </g>
            ) : null}
          </svg>
        </div>
      ) : (
        <ChartEmpty loading={loading} />
      )}
    </section>
  );
}

function ConversionFanChart({ summary = {} }) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const conversion = Math.max(0, Math.min(Number(summary.conversionRate || 0), 1));
  const percentage = Math.round(conversion * 100);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-bold text-slate-900">{t("shopAdmin.tryOnConversion")}</h3>
      <p className="mt-1 text-sm text-slate-500">{t("shopAdmin.conversionDescription")}</p>
      <div className="mt-5 flex justify-center">
        <svg
          className="h-auto w-full max-w-[280px] cursor-help"
          viewBox="0 0 260 165"
          role="img"
          tabIndex="0"
          aria-label={t("shopAdmin.conversionChartLabel", { percentage })}
          onBlur={() => setShowDetails(false)}
          onFocus={() => setShowDetails(true)}
          onMouseEnter={() => setShowDetails(true)}
          onMouseLeave={() => setShowDetails(false)}
        >
          <path
            d="M 38 132 A 92 92 0 0 1 222 132"
            fill="none"
            pathLength="100"
            stroke="#E4F1D7"
            strokeLinecap="round"
            strokeWidth="28"
          />
          <path
            d="M 38 132 A 92 92 0 0 1 222 132"
            fill="none"
            pathLength="100"
            stroke="#94B16F"
            strokeDasharray={`${percentage} ${100 - percentage}`}
            strokeLinecap="round"
            strokeWidth="28"
          />
          <text x="130" y="112" textAnchor="middle" fill="#111111" fontSize="36" fontWeight="700">
            {percentage}%
          </text>
          <text x="130" y="137" textAnchor="middle" fill="#6B6B6B" fontSize="12">
            {t("shopAdmin.conversion")}
          </text>
          {showDetails ? (
            <g pointerEvents="none">
              <rect x="27" y="6" width="206" height="54" rx="10" fill="#94B16F" />
              <text x="40" y="28" fill="white" fontSize="11" fontWeight="700">
                {`${t("shopAdmin.productViews")}: ${summary.productViews || 0}`}
              </text>
              <text x="40" y="47" fill="white" fontSize="11">
                {`${t("shopAdmin.tryOns")}: ${summary.tryOnClicks || 0} · ${t("shopAdmin.conversion")}: ${percentage}%`}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("shopAdmin.productViews")}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{summary.productViews || 0}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("shopAdmin.tryOns")}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{summary.tryOnClicks || 0}</p>
        </div>
      </div>
    </section>
  );
}

function ChartEmpty({ loading }) {
  const { t } = useLanguage();
  return (
    <div className="mt-5 grid min-h-52 place-items-center rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
      {loading ? t("common.loading") : t("shopAdmin.noChartData")}
    </div>
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
  const total = Math.max(items.reduce((sum, item) => sum + Number(item.count || 0), 0), 1);
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
            <div
              className="group relative cursor-help"
              tabIndex="0"
              aria-label={`${item.label}: ${item.count}, ${Math.round((item.count / total) * 100)}%`}
            >
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-mintDeep"
                  style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }}
                />
              </div>
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-mintDeep px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                {`${item.label}: ${item.count} · ${Math.round((item.count / total) * 100)}%`}
              </div>
            </div>
          </div>
        ))}
        {!items.length ? <p className="text-sm text-slate-500">{t("shopAdmin.noSignal")}</p> : null}
      </div>
    </section>
  );
}

const commerceOrderLabels = { pending_confirmation: "Chờ xác nhận", confirmed: "Đã xác nhận", preparing: "Đang chuẩn bị", shipping: "Đang giao", delivered: "Đã giao", cancel_requested: "Yêu cầu hủy", cancelled: "Đã hủy", expired: "Hết hạn" };
const commercePaymentLabels = { cod_pending: "Tiền mặt – chưa thu", awaiting_transfer: "Chờ chuyển khoản", pending_verification: "Chờ đối soát", paid: "Đã thanh toán", refund_pending: "Chờ hoàn tiền", refunded: "Đã hoàn tiền" };
const commerceCode = (value = "") => value.length === 22 ? `${value.slice(0, 3)} ${value.slice(3, 9)} ${value.slice(9, 18)} ${value.slice(18)}` : value;

function ShopOrdersView({ disputes, filters, notifications, onReadNotification, onReplyDispute, onSelect, orders, reload, setFilters }) {
  const update = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value }));
  const kpis = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((item) => item.orderStatus === "pending_confirmation").length,
    verification: orders.filter((item) => item.paymentStatus === "pending_verification").length,
    revenue: orders.filter((item) => item.paymentStatus === "paid").reduce((sum, item) => sum + item.total, 0),
  }), [orders]);
  return <div className="grid gap-5">
    <details className="rounded-xl border border-line bg-white p-4 shadow-sm"><summary className="cursor-pointer font-black">Trung tâm thông báo ({notifications.filter((item) => !item.readAt).length} chưa đọc)</summary><div className="mt-3 grid gap-2">{notifications.slice(0, 15).map((item) => <button className={`rounded-xl p-3 text-left ${item.readAt ? "bg-white text-muted" : "bg-accentSoft font-bold"}`} key={item.id} onClick={() => onReadNotification(item)}><span className="block">{item.title}</span><span className="text-xs font-normal">{item.message}</span></button>)}</div></details>
    {disputes.length ? <details className="rounded-xl border border-line bg-white p-4 shadow-sm"><summary className="cursor-pointer font-black">Khiếu nại hoàn tiền ({disputes.length})</summary><div className="mt-3 grid gap-3">{disputes.map((item) => <article className="rounded-xl bg-panel p-4" key={item.id}><p className="font-mono font-black">{item.orderCode} · {item.status}</p>{item.messages.map((message) => <p className="mt-2 text-sm" key={message.id}><strong>{message.actorType}:</strong> {message.message}</p>)}{!["resolved", "closed"].includes(item.status) ? <button className={`${buttonBase} mt-3 border border-line bg-white`} onClick={() => onReplyDispute(item)}>Phản hồi</button> : null}</article>)}</div></details> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Tổng đơn" value={kpis.total} /><Metric label="Chờ xác nhận" value={kpis.pending} /><Metric label="Chờ đối soát" value={kpis.verification} /><Metric label="Doanh thu đã thu" value={formatMoney(kpis.revenue)} /></div>
    <section className="rounded-xl border border-line bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]"><input className={fieldClass} placeholder="Tìm mã đơn (có thể có khoảng trắng/gạch)" value={filters.search} onChange={update("search")} /><select className={fieldClass} value={filters.orderStatus} onChange={update("orderStatus")}><option value="">Mọi trạng thái đơn</option>{Object.entries(commerceOrderLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select><select className={fieldClass} value={filters.paymentStatus} onChange={update("paymentStatus")}><option value="">Mọi thanh toán</option>{Object.entries(commercePaymentLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select><button className={`${buttonBase} bg-mintDeep text-white`} type="button" onClick={reload}>Lọc</button></div></section>
    <section className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm"><table className="min-w-full text-sm"><thead className="bg-accentSoft text-left"><tr><th className="px-4 py-3">Mã đơn</th><th className="px-4 py-3">Người nhận</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thanh toán</th><th className="px-4 py-3">Tổng</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-line">{orders.map((order) => <tr key={order.id}><td className="px-4 py-3"><button className="font-mono font-black text-accentStrong hover:underline" onClick={() => navigator.clipboard.writeText(order.orderCode)}>{commerceCode(order.orderCode)}</button></td><td className="px-4 py-3"><p className="font-bold">{order.recipient.name}</p><p className="text-xs text-muted">{order.recipient.phone}</p></td><td className="px-4 py-3">{commerceOrderLabels[order.orderStatus]}</td><td className="px-4 py-3">{commercePaymentLabels[order.paymentStatus]}</td><td className="px-4 py-3 font-black">{formatMoney(order.total)}</td><td className="px-4 py-3"><button className={`${buttonBase} border border-line`} onClick={() => onSelect(order.id)}>Chi tiết</button></td></tr>)}</tbody></table>{!orders.length ? <p className="p-8 text-center text-muted">Chưa có đơn phù hợp.</p> : null}</section>
  </div>;
}

function ShopOrderModal({ onChanged, onClose, order }) {
  const [notice, setNotice] = useState("");
  const [refundProof, setRefundProof] = useState(null);
  const actStatus = async (status) => { const reason = status === "cancelled" ? window.prompt("Lý do hủy đơn (bắt buộc):") : ""; if (status === "cancelled" && !reason) return; try { await updateShopOrderStatus(order.id, status, reason); await onChanged(); } catch (e) { setNotice(e.response?.data?.message || "Không cập nhật được trạng thái."); } };
  const actPayment = async (action) => { const reason = ["reject_transfer", "mark_refunded"].includes(action) ? window.prompt(action === "reject_transfer" ? "Lý do từ chối:" : "Ghi chú hoàn tiền:") : ""; try { await updateShopOrderPayment(order.id, action, reason, action === "mark_refunded" ? refundProof : null); await onChanged(); } catch (e) { setNotice(e.response?.data?.message || "Không cập nhật được thanh toán."); } };
  const nextStatuses = { pending_confirmation: ["confirmed", "cancelled"], confirmed: ["preparing", "cancelled"], preparing: ["shipping", "cancelled"], shipping: ["delivered", "cancelled"] }[order.orderStatus] || [];
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={onClose}><div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-accentStrong">Chi tiết đơn hàng</p><button className="mt-2 font-mono text-2xl font-black hover:underline" onClick={() => navigator.clipboard.writeText(order.orderCode)}>{commerceCode(order.orderCode)} · Copy</button><p className="mt-1 text-muted">{commerceOrderLabels[order.orderStatus]} · {commercePaymentLabels[order.paymentStatus]}</p></div><button className={`${buttonBase} border border-line`} onClick={onClose}>Đóng</button></div>{notice ? <Notice message={notice} type="error" /> : null}
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]"><div className="grid gap-5"><section className="rounded-xl border border-line p-4"><h3 className="font-black">Customer & địa chỉ snapshot</h3><p className="mt-3 font-bold">{order.recipient.name} · {order.recipient.phone}</p><p className="text-muted">{order.recipient.fullAddress}</p>{order.recipient.note ? <p className="mt-2">Ghi chú: {order.recipient.note}</p> : null}</section><section className="rounded-xl border border-line p-4"><h3 className="font-black">Sản phẩm</h3>{order.items.map((item) => <div className="mt-3 flex justify-between gap-3 border-t border-line pt-3" key={item.variantId}><div><p className="font-bold">{item.name}</p><p className="text-sm text-muted">SKU {item.sku} · {item.color || "Mặc định"} · {item.size || "Một cỡ"} · x{item.quantity}</p></div><p className="font-black">{formatMoney(item.lineTotal)}</p></div>)}</section>{order.paymentProof?.imageUrl ? <section className="rounded-xl border border-line p-4"><h3 className="font-black">Biên lai customer</h3><img className="mt-3 max-h-80 rounded-xl" src={order.paymentProof.imageUrl} alt="Biên lai" /></section> : null}</div>
    <aside className="grid h-fit gap-4"><section className="rounded-xl bg-accentSoft p-4"><p className="text-sm text-muted">Tổng tiền</p><p className="text-3xl font-black">{formatMoney(order.total)}</p>{order.paymentSnapshot ? <><p className="mt-4 text-sm">{order.paymentSnapshot.bankName}</p><p className="font-mono font-black">{order.paymentSnapshot.accountNumber}</p><p className="font-bold">{order.paymentSnapshot.accountHolder}</p><p className="mt-3 font-mono">Nội dung: {order.transferContent}</p></> : null}</section>
      <section className="rounded-xl border border-line p-4"><h3 className="font-black">Cập nhật đơn</h3><div className="mt-3 grid gap-2">{nextStatuses.map((status) => <button className={`${buttonBase} ${status === "cancelled" ? "border border-red-200 text-red-700" : "bg-mintDeep text-white"}`} key={status} onClick={() => actStatus(status)}>{commerceOrderLabels[status]}</button>)}{order.orderStatus === "cancel_requested" ? <><button className={`${buttonBase} bg-mintDeep text-white`} onClick={async () => { await decideShopCancellation(order.id, true, "Shop chấp nhận"); onChanged(); }}>Chấp nhận hủy</button><button className={`${buttonBase} border border-line`} onClick={async () => { await decideShopCancellation(order.id, false, "Shop từ chối"); onChanged(); }}>Từ chối hủy</button></> : null}</div></section>
      <section className="rounded-xl border border-line p-4"><h3 className="font-black">Đối soát thanh toán</h3><div className="mt-3 grid gap-2">{["cod_pending", "awaiting_transfer", "pending_verification"].includes(order.paymentStatus) ? <button className={`${buttonBase} bg-mintDeep text-white`} onClick={() => actPayment("confirm_paid")}>Xác nhận đã nhận tiền</button> : null}{order.paymentStatus === "pending_verification" ? <button className={`${buttonBase} border border-red-200 text-red-700`} onClick={() => actPayment("reject_transfer")}>Từ chối biên lai</button> : null}{order.paymentStatus === "refund_pending" ? <><input className={fieldClass} type="file" accept="image/*" onChange={(event) => setRefundProof(event.target.files?.[0] || null)} /><button className={`${buttonBase} bg-mintDeep text-white`} onClick={() => actPayment("mark_refunded")}>Đánh dấu đã hoàn tiền</button></> : null}</div></section>
    </aside></div></div></div>;
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
