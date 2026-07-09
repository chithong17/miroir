import { useEffect, useMemo, useState } from "react";
import {
  archiveProduct,
  createProduct,
  createShop,
  deleteProduct,
  deleteShop,
  downloadProductImportTemplate,
  hardDeleteProduct,
  importProductsExcel,
  listMyShops,
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

function ShopDashboardPage() {
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

  const shop = shops[0] || null;
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
      const [shopResponse, productResponse] = await Promise.all([
        listMyShops(),
        listShopProducts(),
      ]);
      const nextShops = shopResponse.shops || [];
      const nextShop = nextShops[0] || null;

      setShops(nextShops);
      setProducts(productResponse.products || []);

      if (nextShop) {
        setShopForm(shopToForm(nextShop));
        setProductForm((previous) => ({ ...previous, shopId: nextShop.id }));
      }
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not load dashboard.", "error");
    }
  };

  useEffect(() => {
    loadDashboard();
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
    setProductForm({ ...emptyProduct, shopId: shop?.id || "" });
    setUploadNotice("");
    setView("products");
    setIsProductModalOpen(true);
  };

  const editProduct = (product) => {
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
      },
    };

    try {
      if (shopForm.id) {
        await updateShop(shopForm.id, payload);
        showNotice("Shop profile saved.");
      } else {
        await createShop(payload);
        showNotice("Shop profile created.");
      }
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not save shop.", "error");
    }
  };

  const deactivateShop = async () => {
    if (!shop?.id) return;

    try {
      await deleteShop(shop.id);
      showNotice("Shop deactivated.");
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not deactivate shop.", "error");
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    if (!shop) {
      setView("shop");
      showNotice("Create your shop before adding products.", "error");
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
        showNotice("Product updated.");
      } else {
        await createProduct(payload);
        showNotice("Product created.");
      }
      setProductForm({ ...emptyProduct, shopId: shop?.id || "" });
      setIsProductModalOpen(false);
      setUploadNotice("");
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not save product.", "error");
    }
  };

  const archiveShopProduct = async (productId) => {
    try {
      await archiveProduct(productId);
      setSelectedProductIds((previous) => previous.filter((id) => id !== productId));
      showNotice("Product archived.");
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not archive product.", "error");
    }
  };

  const removeProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      setSelectedProductIds((previous) => previous.filter((id) => id !== productId));
      showNotice("Product moved to trash.");
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not move product to trash.", "error");
    }
  };

  const recoverProduct = async (productId) => {
    try {
      await restoreProduct(productId);
      setSelectedProductIds((previous) => previous.filter((id) => id !== productId));
      showNotice("Product recovered to draft.");
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not recover product.", "error");
    }
  };

  const permanentlyDeleteProduct = async (productId) => {
    const confirmed = window.confirm("Permanently delete this product from the database?");
    if (!confirmed) return;

    try {
      await hardDeleteProduct(productId);
      setSelectedProductIds((previous) => previous.filter((id) => id !== productId));
      showNotice("Product permanently deleted.");
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not permanently delete product.", "error");
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
      showNotice(`${selectedProductIds.length} products moved to trash.`);
      setSelectedProductIds([]);
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not move selected products to trash.", "error");
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
      showNotice("Choose at least one field to bulk edit.", "error");
      return;
    }

    try {
      await Promise.all(selectedProductIds.map((productId) => updateProduct(productId, payload)));
      showNotice(`${selectedProductIds.length} products updated.`);
      setSelectedProductIds([]);
      closeBulkEditModal();
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not bulk edit products.", "error");
    }
  };

  const permanentlyDeleteSelectedProducts = async () => {
    if (!selectedProductIds.length) return;

    const confirmed = window.confirm(
      `Permanently delete ${selectedProductIds.length} products from the database?`
    );
    if (!confirmed) return;

    try {
      await Promise.all(selectedProductIds.map((productId) => hardDeleteProduct(productId)));
      showNotice(`${selectedProductIds.length} products permanently deleted.`);
      setSelectedProductIds([]);
      await loadDashboard();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not permanently delete selected products.", "error");
      await loadDashboard();
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadNotice("Uploading...");
      const response = await uploadProductImage(file);
      setProductForm((previous) => ({
        ...previous,
        imageUrl: response.imageUrl,
        imagePublicId: response.imagePublicId,
      }));
      setUploadNotice("Image uploaded.");
    } catch (error) {
      setUploadNotice(error.response?.data?.message || "Could not upload image.");
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

    setImportResult(null);

    try {
      const response = await importProductsExcel(file);
      setImportResult(response.importJob);
      showNotice("Import completed.");
      await loadDashboard();
    } catch (error) {
      if (error.response?.data?.importJob) {
        setImportResult(error.response.data.importJob);
      }
      showNotice(error.response?.data?.message || "Import failed.", "error");
    }
  };

  const logout = () => {
    setShopToken("");
    window.location.href = "/login";
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
              filters={filters}
              resetProductForm={resetProductForm}
              shop={shop}
              updateFilter={updateFilter}
              view={view}
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
                importExcel={importExcel}
                importResult={importResult}
                shop={shop}
              />
            ) : null}
          </div>
        </main>
      </div>

      {isProductModalOpen ? (
        <ProductModal
          editingExistingProduct={editingExistingProduct}
          productForm={productForm}
          saveProduct={saveProduct}
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
  const navItems = [
    ["products", "Products"],
    ["trash", "Trash"],
    ["shop", "Shop Profile"],
    ["import", "Excel Import"],
  ];

  return (
    <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 p-5">
          <a href="/" className="font-display text-2xl font-extrabold text-[#12356f]">
            MIROIR
          </a>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Shop Owner
          </p>
        </div>

        <div className="p-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className={labelClass}>Current shop</p>
            <p className="mt-2 truncate text-base font-bold text-slate-900">
              {shop?.name || "No shop yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {shop ? `${shop.slug} / ${shop.status}` : "Create profile first"}
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
          <Metric label="Total" value={stats.total} />
          <Metric label="Live" value={stats.published} />
          <Metric label="Draft" value={stats.draft} />
          <Metric label="Trash" value={stats.trashed} />
        </div>

        <div className="mt-auto grid gap-2 border-t border-slate-200 p-4">
          <a
            href="/stylist"
            className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            AI Stylist
          </a>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

function DashboardHeader({ filters, resetProductForm, shop, updateFilter, view }) {
  const title =
    view === "shop"
      ? "Shop Profile"
      : view === "import"
        ? "Excel Import"
        : view === "trash"
          ? "Trash"
          : "Products";

  return (
    <header className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {shop ? "Manage one shop catalogue for AI Stylist." : "Create your shop to begin."}
          </p>
        </div>

        {view === "products" ? (
          <button
            type="button"
            onClick={resetProductForm}
            disabled={!shop}
            className={`${buttonBase} bg-[#12356f] text-white`}
          >
            New Product
          </button>
        ) : null}
      </div>

      {view === "products" || view === "trash" ? (
        <div className={`mt-4 grid gap-3 ${view === "trash" ? "" : "md:grid-cols-[minmax(0,1fr)_180px]"}`}>
          <input
            className={fieldClass}
            placeholder="Search by product, category, material"
            value={filters.query}
            onChange={updateFilter("query")}
          />
          {view !== "trash" ? (
            <select className={fieldClass} value={filters.status} onChange={updateFilter("status")}>
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

function ProductsView({
  archiveProduct,
  deleteSelectedProducts,
  editProduct,
  filteredProducts,
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
  const allVisibleSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedProductSet.has(product.id));

  return (
    <div>
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {inTrash ? "Trash" : "Product Catalogue"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedCount
                ? `${selectedCount} selected`
                : `${filteredProducts.length} products shown`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {selectedCount && !inTrash ? (
            <button
              type="button"
              onClick={openBulkEditModal}
              className={`${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
              title="Bulk edit selected products"
            >
              <Icon name="edit" />
              <span className="ml-2">Bulk edit</span>
            </button>
          ) : null}
          {selectedCount ? (
            <button
              type="button"
              onClick={inTrash ? permanentlyDeleteSelectedProducts : deleteSelectedProducts}
              className={`${buttonBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
              title={inTrash ? "Delete selected permanently" : "Move selected to trash"}
            >
              <Icon name={inTrash ? "deleteForever" : "trash"} />
              <span className="ml-2">
                {inTrash ? "Delete selected" : "Move to trash"}
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
                    aria-label="Select all visible products"
                  />
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">AI</th>
                <th className="px-4 py-3">Actions</th>
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
                      aria-label={`Select ${product.name}`}
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
                  <td className="px-4 py-3 text-slate-600">{product.embeddingStale ? "needs embed" : "ready"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!inTrash ? (
                        <button
                          type="button"
                          onClick={() => editProduct(product)}
                          className={`${iconButtonClass} border-slate-200 text-slate-700`}
                          title="Edit"
                          aria-label={`Edit ${product.name}`}
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
                            title="Archive"
                            aria-label={`Archive ${product.name}`}
                          >
                            <Icon name="archive" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProduct(product.id)}
                            className={`${iconButtonClass} border-red-200 text-red-700 hover:bg-red-50`}
                            title="Move to trash"
                            aria-label={`Move ${product.name} to trash`}
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
                            title="Recover"
                            aria-label={`Recover ${product.name}`}
                          >
                            <Icon name="recover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => permanentlyDeleteProduct(product.id)}
                            className={`${iconButtonClass} border-red-200 text-red-700 hover:bg-red-50`}
                            title="Delete permanently"
                            aria-label={`Permanently delete ${product.name}`}
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
                    No products found.
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
  onClose,
  productForm,
  saveProduct,
  shop,
  uploadImage,
  uploadNotice,
  updateProductField,
}) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={saveProduct}
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingExistingProduct ? "Edit Product" : "Create Product"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{shop?.name || "Shop profile required"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${buttonBase} border border-slate-200 bg-white text-slate-700`}
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(92vh-145px)] overflow-y-auto p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product ID">
              <input className={fieldClass} value={productForm.id} onChange={updateProductField("id")} />
            </Field>
            <Field label="Name">
              <input className={fieldClass} value={productForm.name} onChange={updateProductField("name")} />
            </Field>
          <Field label="Category">
            <input className={fieldClass} value={productForm.category} onChange={updateProductField("category")} />
          </Field>
          <Field label="Price">
            <input className={fieldClass} value={productForm.price} onChange={updateProductField("price")} />
          </Field>
          <Field label="Gender">
            <select className={fieldClass} value={productForm.gender} onChange={updateProductField("gender")}>
              <option value="female">female</option>
              <option value="male">male</option>
              <option value="unisex">unisex</option>
            </select>
          </Field>
          <Field label="Stock">
            <select className={fieldClass} value={productForm.availability} onChange={updateProductField("availability")}>
              <option value="in_stock">in_stock</option>
              <option value="out_of_stock">out_of_stock</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={fieldClass} value={productForm.status} onChange={updateProductField("status")}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </Field>
          <Field label="Colors">
            <input className={fieldClass} value={productForm.colors} onChange={updateProductField("colors")} />
          </Field>
          <Field label="Sizes">
            <input className={fieldClass} value={productForm.sizes} onChange={updateProductField("sizes")} />
          </Field>
          <Field label="Material">
            <input className={fieldClass} value={productForm.material} onChange={updateProductField("material")} />
          </Field>
          <Field label="Fit Type">
            <input className={fieldClass} value={productForm.fitType} onChange={updateProductField("fitType")} />
          </Field>
            <Field label="Style Tags">
              <input className={fieldClass} value={productForm.styleTags} onChange={updateProductField("styleTags")} />
            </Field>
            <Field label="Occasion Tags">
              <input className={fieldClass} value={productForm.occasionTags} onChange={updateProductField("occasionTags")} />
            </Field>
            <Field label="Image URL" wide>
              <input className={fieldClass} value={productForm.imageUrl} onChange={updateProductField("imageUrl")} />
            </Field>
            <Field label="Upload Image" wide>
              <input className={fieldClass} type="file" accept="image/*" onChange={uploadImage} />
            </Field>
            <Field label="Description" wide>
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
            Cancel
          </button>
          <button type="submit" disabled={!shop} className={`${buttonBase} bg-[#12356f] text-white`}>
            Save Product
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
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={saveBulkEditProducts}
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bulk Edit</h2>
            <p className="mt-1 text-sm text-slate-500">{selectedCount} selected products</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${buttonBase} border border-slate-200 bg-white text-slate-700`}
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(92vh-145px)] overflow-y-auto p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Category">
              <input
                className={fieldClass}
                placeholder="unchanged"
                value={bulkEditForm.category}
                onChange={updateBulkEditField("category")}
              />
            </Field>
            <Field label="Price">
              <input
                className={fieldClass}
                placeholder="unchanged"
                value={bulkEditForm.price}
                onChange={updateBulkEditField("price")}
              />
            </Field>
            <Field label="Gender">
              <select
                className={fieldClass}
                value={bulkEditForm.gender}
                onChange={updateBulkEditField("gender")}
              >
                <option value="">unchanged</option>
                <option value="female">female</option>
                <option value="male">male</option>
                <option value="unisex">unisex</option>
              </select>
            </Field>
            <Field label="Stock">
              <select
                className={fieldClass}
                value={bulkEditForm.availability}
                onChange={updateBulkEditField("availability")}
              >
                <option value="">unchanged</option>
                <option value="in_stock">in_stock</option>
                <option value="out_of_stock">out_of_stock</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                className={fieldClass}
                value={bulkEditForm.status}
                onChange={updateBulkEditField("status")}
              >
                <option value="">unchanged</option>
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </Field>
            <Field label="Colors">
              <input
                className={fieldClass}
                placeholder="unchanged"
                value={bulkEditForm.colors}
                onChange={updateBulkEditField("colors")}
              />
            </Field>
            <Field label="Sizes">
              <input
                className={fieldClass}
                placeholder="unchanged"
                value={bulkEditForm.sizes}
                onChange={updateBulkEditField("sizes")}
              />
            </Field>
            <Field label="Material">
              <input
                className={fieldClass}
                placeholder="unchanged"
                value={bulkEditForm.material}
                onChange={updateBulkEditField("material")}
              />
            </Field>
            <Field label="Fit Type">
              <input
                className={fieldClass}
                placeholder="unchanged"
                value={bulkEditForm.fitType}
                onChange={updateBulkEditField("fitType")}
              />
            </Field>
            <Field label="Style Tags">
              <input
                className={fieldClass}
                placeholder="unchanged"
                value={bulkEditForm.styleTags}
                onChange={updateBulkEditField("styleTags")}
              />
            </Field>
            <Field label="Occasion Tags">
              <input
                className={fieldClass}
                placeholder="unchanged"
                value={bulkEditForm.occasionTags}
                onChange={updateBulkEditField("occasionTags")}
              />
            </Field>
            <Field label="Image URL" wide>
              <input
                className={fieldClass}
                placeholder="unchanged"
                value={bulkEditForm.imageUrl}
                onChange={updateBulkEditField("imageUrl")}
              />
            </Field>
            <Field label="Description" wide>
              <textarea
                className={`${fieldClass} min-h-28 resize-none`}
                placeholder="unchanged"
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
            Cancel
          </button>
          <button type="submit" className={`${buttonBase} bg-[#12356f] text-white`}>
            Apply Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function ShopView({ deactivateShop, saveShop, shop, shopForm, updateShopField }) {
  return (
    <form onSubmit={saveShop} className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{shop ? "Edit Shop" : "Create Shop"}</h2>
          <p className="mt-1 text-sm text-slate-500">One shop owner account manages one shop.</p>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={`${buttonBase} bg-[#12356f] text-white`}>
            Save Shop
          </button>
          {shop ? (
            <button
              type="button"
              onClick={deactivateShop}
              className={`${buttonBase} border border-slate-200 bg-white text-slate-700`}
            >
              Deactivate
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <Field label="Name">
          <input className={fieldClass} value={shopForm.name} onChange={updateShopField("name")} />
        </Field>
        <Field label="Slug">
          <input className={fieldClass} value={shopForm.slug} onChange={updateShopField("slug")} />
        </Field>
        <Field label="Description" wide>
          <textarea
            className={`${fieldClass} min-h-28 resize-none`}
            value={shopForm.description}
            onChange={updateShopField("description")}
          />
        </Field>
        <Field label="Logo URL">
          <input className={fieldClass} value={shopForm.logoUrl} onChange={updateShopField("logoUrl")} />
        </Field>
        <Field label="Cover URL">
          <input className={fieldClass} value={shopForm.coverUrl} onChange={updateShopField("coverUrl")} />
        </Field>
        <Field label="Contact Email">
          <input className={fieldClass} value={shopForm.contactEmail} onChange={updateShopField("contactEmail")} />
        </Field>
        <Field label="Contact Phone">
          <input className={fieldClass} value={shopForm.contactPhone} onChange={updateShopField("contactPhone")} />
        </Field>
        <Field label="Status">
          <select className={fieldClass} value={shopForm.status} onChange={updateShopField("status")}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </Field>
      </div>
    </form>
  );
}

function ImportView({ downloadTemplate, importExcel, importResult, shop }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Import Products</h2>
        <p className="mt-1 text-sm text-slate-500">
          {shop ? "Download the template, fill it, then upload the .xlsx file." : "Create a shop before importing."}
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className={`${buttonBase} mt-5 w-full border border-slate-200 bg-white text-slate-700`}
        >
          Download Template
        </button>
        <Field label="Upload .xlsx">
          <input className={fieldClass} type="file" accept=".xlsx" disabled={!shop} onChange={importExcel} />
        </Field>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Import Result</h2>
        {importResult ? (
          <div className="mt-4 grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label="Status" value={importResult.status} />
              <Metric label="Rows" value={importResult.totalRows} />
              <Metric label="Success" value={importResult.successCount} />
              <Metric label="Failed" value={importResult.failedCount} />
            </div>
            {importResult.errors?.length ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">Errors</p>
                <ul className="mt-2 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={`${error.row}-${error.field}-${index}`}>
                      Row {error.row}, {error.field}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No import result yet.</p>
        )}
      </section>
    </div>
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
