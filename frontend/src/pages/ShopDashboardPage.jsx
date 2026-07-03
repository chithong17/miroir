import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  createShop,
  deleteProduct,
  deleteShop,
  downloadProductImportTemplate,
  importProductsExcel,
  listMyShops,
  listShopProducts,
  setShopToken,
  updateProduct,
  updateShop,
  uploadProductImage,
} from "../api/shopApi.js";

const navy = "#12356f";
const mint = "#02c6ad";
const fieldClass =
  "w-full rounded-md border border-[#d8dde8] bg-white px-3 py-2 text-xs text-[#1d2433] outline-none focus:border-[#12356f]";
const labelClass = "text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b8496]";
const buttonClass = "rounded-md px-3 py-2 text-xs font-bold transition";

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
  const [status, setStatus] = useState("idle");
  const [uploadNotice, setUploadNotice] = useState("");
  const [importResult, setImportResult] = useState(null);

  const shop = shops[0] || null;
  const editingExistingProduct = Boolean(
    productForm.id && products.some((product) => product.id === productForm.id)
  );

  const stats = useMemo(() => {
    const summary = {
      total: products.length,
      published: 0,
      draft: 0,
      archived: 0,
      needsEmbed: 0,
    };

    products.forEach((product) => {
      if (product.status === "published") summary.published += 1;
      if (product.status === "draft") summary.draft += 1;
      if (product.status === "archived") summary.archived += 1;
      if (product.embeddingStale) summary.needsEmbed += 1;
    });

    return summary;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesStatus = filters.status === "all" || product.status === filters.status;
      const matchesQuery =
        !query ||
        [product.name, product.category, product.material, product.fitType]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [filters, products]);

  const featuredProducts = filteredProducts.slice(0, 4);
  const catalogueProducts = filteredProducts.slice(4);

  const loadDashboard = async () => {
    setStatus("loading");
    setNotice("");

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

      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setNotice(error.response?.data?.message || "Could not load dashboard.");
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

  const updateFilter = (field) => (event) => {
    setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const resetProductForm = () => {
    setProductForm({ ...emptyProduct, shopId: shop?.id || "" });
    setUploadNotice("");
    setView("products");
  };

  const saveShop = async (event) => {
    event.preventDefault();
    setNotice("");

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
        setNotice("Shop saved.");
      } else {
        await createShop(payload);
        setNotice("Shop created.");
      }
      await loadDashboard();
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not save shop.");
    }
  };

  const deactivateShop = async () => {
    if (!shop?.id) return;

    try {
      await deleteShop(shop.id);
      setNotice("Shop deactivated.");
      await loadDashboard();
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not deactivate shop.");
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setNotice("");

    if (!shop) {
      setView("shop");
      setNotice("Create your shop before adding products.");
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
        setNotice("Product updated.");
      } else {
        await createProduct(payload);
        setNotice("Product created.");
      }

      resetProductForm();
      await loadDashboard();
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not save product.");
    }
  };

  const archiveProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      setNotice("Product archived.");
      await loadDashboard();
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not archive product.");
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
    setNotice("");

    try {
      const response = await importProductsExcel(file);
      setImportResult(response.importJob);
      setNotice("Import completed.");
      await loadDashboard();
    } catch (error) {
      if (error.response?.data?.importJob) {
        setImportResult(error.response.data.importJob);
      }
      setNotice(error.response?.data?.message || "Import failed.");
    }
  };

  const logout = () => {
    setShopToken("");
    window.location.href = "/shop/login";
  };

  return (
    <div className="min-h-screen bg-[#efefef] px-3 py-5 text-[#182238] md:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[720px] max-w-[1500px] overflow-hidden rounded-xl bg-white shadow-[0_26px_80px_rgba(15,23,42,0.18)] lg:grid-cols-[70px_minmax(0,1fr)_360px]">
        <IconRail activeView={view} logout={logout} setView={setView} />

        <main className="min-w-0 border-r border-[#e5e8ef] bg-[#fbfcfe]">
          <TopNavigation
            filters={filters}
            shop={shop}
            updateFilter={updateFilter}
            view={view}
            setView={setView}
          />

          {notice ? (
            <div
              className={`mx-6 mt-5 rounded-md border px-4 py-3 text-sm ${
                status === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-[#d8dde8] bg-white text-[#566174]"
              }`}
            >
              {notice}
            </div>
          ) : null}

          {view === "products" ? (
            <ProductWorkspace
              catalogueProducts={catalogueProducts}
              featuredProducts={featuredProducts}
              filteredProducts={filteredProducts}
              onArchiveProduct={archiveProduct}
              onEditProduct={(product) => setProductForm(productToForm(product))}
              onNewProduct={resetProductForm}
              shop={shop}
            />
          ) : null}

          {view === "shop" ? (
            <ShopWorkspace
              onDeactivateShop={deactivateShop}
              onSaveShop={saveShop}
              shop={shop}
              shopForm={shopForm}
              updateShopField={updateShopField}
            />
          ) : null}

          {view === "import" ? (
            <ImportWorkspace
              importResult={importResult}
              onDownloadTemplate={downloadTemplate}
              onImportExcel={importExcel}
              shop={shop}
            />
          ) : null}
        </main>

        <RightPanel
          editingExistingProduct={editingExistingProduct}
          importResult={importResult}
          productForm={productForm}
          shop={shop}
          stats={stats}
          uploadNotice={uploadNotice}
          view={view}
          onSaveProduct={saveProduct}
          onUploadImage={uploadImage}
          setView={setView}
          updateProductField={updateProductField}
        />
      </div>
    </div>
  );
}

function IconRail({ activeView, logout, setView }) {
  const items = [
    ["products", "H", "Products"],
    ["shop", "S", "Shop"],
    ["import", "I", "Import"],
  ];

  return (
    <aside className="flex flex-row items-center justify-between bg-[#12356f] p-3 text-white lg:flex-col">
      <a
        href="/"
        className="grid h-11 w-11 place-items-center rounded-md bg-white/10 font-display text-lg font-bold"
      >
        M
      </a>

      <nav className="flex gap-2 lg:grid lg:gap-4">
        {items.map(([key, icon, label]) => (
          <button
            key={key}
            type="button"
            title={label}
            onClick={() => setView(key)}
            className={`grid h-10 w-10 place-items-center rounded-md text-sm font-bold transition ${
              activeView === key ? "bg-white text-[#12356f]" : "bg-white/0 text-white/80 hover:bg-white/10"
            }`}
          >
            {icon}
          </button>
        ))}
      </nav>

      <button
        type="button"
        title="Logout"
        onClick={logout}
        className="grid h-10 w-10 place-items-center rounded-md bg-white/0 text-sm font-bold text-white/80 hover:bg-white/10"
      >
        X
      </button>
    </aside>
  );
}

function TopNavigation({ filters, shop, setView, updateFilter, view }) {
  const tabs = [
    ["products", "Products"],
    ["shop", "Shop Profile"],
    ["import", "Excel Import"],
  ];

  return (
    <header className="border-b border-[#e5e8ef] bg-white px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={labelClass}>Miroir Shop</p>
          <h1 className="mt-1 text-2xl font-bold text-[#182238]">
            {shop?.name || "Create your shop"}
          </h1>
        </div>
        {view === "products" ? (
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[220px_150px]">
            <input
              className={fieldClass}
              placeholder="Search catalogue"
              value={filters.query}
              onChange={updateFilter("query")}
            />
            <select className={fieldClass} value={filters.status} onChange={updateFilter("status")}>
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex gap-7 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`border-b-2 pb-2 text-xs font-bold transition ${
              view === key
                ? "border-[#12356f] text-[#12356f]"
                : "border-transparent text-[#8b94a5] hover:text-[#12356f]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}

function ProductWorkspace({
  catalogueProducts,
  featuredProducts,
  filteredProducts,
  onArchiveProduct,
  onEditProduct,
  onNewProduct,
  shop,
}) {
  return (
    <div className="space-y-8 p-6">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#182238]">Quick Product Cards</h2>
            <p className="mt-1 text-xs text-[#7b8496]">{filteredProducts.length} products in current view</p>
          </div>
          <button
            type="button"
            onClick={onNewProduct}
            disabled={!shop}
            className={`${buttonClass} bg-[#12356f] text-white disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Add Product
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              accent={index}
              product={product}
              onArchiveProduct={onArchiveProduct}
              onEditProduct={onEditProduct}
            />
          ))}
          {!featuredProducts.length ? (
            <EmptyCard title="No products yet" text="Create or import products to build your catalogue." />
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#182238]">Catalogue</h2>
          <p className="text-xs font-semibold text-[#8b94a5]">Stock view</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {catalogueProducts.map((product, index) => (
            <CatalogueCard
              key={product.id}
              accent={index}
              product={product}
              onArchiveProduct={onArchiveProduct}
              onEditProduct={onEditProduct}
            />
          ))}
          {!catalogueProducts.length && featuredProducts.length ? (
            <EmptyCard title="Catalogue is compact" text="More products will appear here after the first row." />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ accent, product, onArchiveProduct, onEditProduct }) {
  const colors = ["#12356f", "#21a667", "#02c6ad", "#1d4ed8"];

  return (
    <article className="relative min-h-[190px] rounded-md border border-[#d8dde8] bg-white p-4 shadow-sm">
      <div
        className="absolute right-0 top-0 h-9 w-9 rounded-bl-md"
        style={{ backgroundColor: colors[accent % colors.length] }}
      />
      <div className="h-16 w-16 overflow-hidden rounded-full border border-[#e5e8ef] bg-[#f6f7f8]">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <h3 className="mt-4 text-sm font-bold text-[#182238]">{product.name}</h3>
      <p className="mt-1 text-xs text-[#7b8496]">{product.category}</p>
      <p className="mt-2 text-xs font-bold text-[#12356f]">{formatMoney(product.price)}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEditProduct(product)}
          className="rounded-sm bg-[#12356f] px-3 py-2 text-xs font-bold text-white"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onArchiveProduct(product.id)}
          className="rounded-sm border border-[#d8dde8] px-3 py-2 text-xs font-bold text-[#182238]"
        >
          Archive
        </button>
      </div>
    </article>
  );
}

function CatalogueCard({ accent, product, onArchiveProduct, onEditProduct }) {
  const accents = ["#12356f", "#02c6ad", "#21a667", "#1d4ed8"];

  return (
    <article className="rounded-md border border-[#d8dde8] bg-white p-4 shadow-sm">
      <div className="relative mx-auto h-28 w-20 overflow-hidden rounded-md bg-[#f6f7f8]">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : null}
        <span
          className="absolute right-1 top-1 h-5 w-5 rounded-full"
          style={{ backgroundColor: accents[accent % accents.length] }}
        />
      </div>
      <h3 className="mt-3 truncate text-center text-xs font-bold text-[#182238]">{product.name}</h3>
      <p className="mt-1 text-center text-[11px] text-[#7b8496]">{product.status}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEditProduct(product)}
          className="rounded-sm bg-[#12356f] px-2 py-2 text-xs font-bold text-white"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onArchiveProduct(product.id)}
          className="rounded-sm border border-[#d8dde8] px-2 py-2 text-xs font-bold text-[#182238]"
        >
          Off
        </button>
      </div>
    </article>
  );
}

function ShopWorkspace({ onDeactivateShop, onSaveShop, shop, shopForm, updateShopField }) {
  return (
    <form onSubmit={onSaveShop} className="m-6 rounded-md border border-[#d8dde8] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#182238]">{shop ? "Shop Profile" : "Create Shop"}</h2>
          <p className="mt-1 text-xs text-[#7b8496]">One shop owner account manages one shop.</p>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={`${buttonClass} bg-[#12356f] text-white`}>
            Save
          </button>
          {shop ? (
            <button
              type="button"
              onClick={onDeactivateShop}
              className={`${buttonClass} border border-[#d8dde8] text-[#182238]`}
            >
              Deactivate
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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

function ImportWorkspace({ importResult, onDownloadTemplate, onImportExcel, shop }) {
  return (
    <div className="m-6 grid gap-5 lg:grid-cols-[320px_1fr]">
      <section className="rounded-md border border-[#d8dde8] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#182238]">Excel Import</h2>
        <p className="mt-1 text-xs text-[#7b8496]">
          {shop ? "Import products into this shop." : "Create a shop before importing."}
        </p>
        <button
          type="button"
          onClick={onDownloadTemplate}
          className={`${buttonClass} mt-5 w-full border border-[#d8dde8] text-[#182238]`}
        >
          Download Template
        </button>
        <label className="mt-5 grid gap-2">
          <span className={labelClass}>Upload .xlsx</span>
          <input className={fieldClass} type="file" accept=".xlsx" disabled={!shop} onChange={onImportExcel} />
        </label>
      </section>

      <section className="rounded-md border border-[#d8dde8] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#182238]">Import Result</h2>
        {importResult ? (
          <div className="mt-5 grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <PanelMetric label="Status" value={importResult.status} />
              <PanelMetric label="Rows" value={importResult.totalRows} />
              <PanelMetric label="Success" value={importResult.successCount} />
              <PanelMetric label="Failed" value={importResult.failedCount} />
            </div>
            {importResult.errors?.length ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <p className="font-bold">Errors</p>
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
          <p className="mt-5 text-sm text-[#7b8496]">No import result yet.</p>
        )}
      </section>
    </div>
  );
}

function RightPanel({
  editingExistingProduct,
  importResult,
  onSaveProduct,
  onUploadImage,
  productForm,
  setView,
  shop,
  stats,
  uploadNotice,
  updateProductField,
  view,
}) {
  return (
    <aside className="bg-white">
      <div className="border-b border-[#e5e8ef] p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[#f6f7f8]">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-[#12356f]">S</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-[#182238]">{shop?.name || "Shop profile"}</p>
            <p className="text-xs text-[#7b8496]">{shop?.contact?.email || "No contact email"}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2 text-center">
          <PanelMetric label="Total" value={stats.total} />
          <PanelMetric label="Live" value={stats.published} />
          <PanelMetric label="Draft" value={stats.draft} />
          <PanelMetric label="Embed" value={stats.needsEmbed} />
        </div>
      </div>

      <div className="p-6">
        {view === "import" ? (
          <div className="rounded-md border border-[#d8dde8] bg-[#fbfcfe] p-4">
            <p className={labelClass}>Latest import</p>
            <p className="mt-3 text-sm font-bold text-[#182238]">{importResult?.status || "No import"}</p>
            <p className="mt-1 text-xs text-[#7b8496]">
              {importResult ? `${importResult.successCount} success / ${importResult.failedCount} failed` : ""}
            </p>
          </div>
        ) : (
          <ProductEditor
            editingExistingProduct={editingExistingProduct}
            onSaveProduct={onSaveProduct}
            onUploadImage={onUploadImage}
            productForm={productForm}
            setView={setView}
            shop={shop}
            uploadNotice={uploadNotice}
            updateProductField={updateProductField}
          />
        )}
      </div>
    </aside>
  );
}

function ProductEditor({
  editingExistingProduct,
  onSaveProduct,
  onUploadImage,
  productForm,
  setView,
  shop,
  uploadNotice,
  updateProductField,
}) {
  return (
    <form onSubmit={onSaveProduct}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className={labelClass}>Product editor</p>
          <h2 className="mt-1 text-lg font-bold text-[#182238]">
            {editingExistingProduct ? "Edit product" : "New product"}
          </h2>
        </div>
        {!shop ? (
          <button
            type="button"
            onClick={() => setView("shop")}
            className={`${buttonClass} border border-[#d8dde8] text-[#182238]`}
          >
            Create Shop
          </button>
        ) : null}
      </div>

      <div className="grid gap-3">
        <Field label="Product ID">
          <input className={fieldClass} value={productForm.id} onChange={updateProductField("id")} />
        </Field>
        <Field label="Name">
          <input className={fieldClass} value={productForm.name} onChange={updateProductField("name")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input className={fieldClass} value={productForm.category} onChange={updateProductField("category")} />
          </Field>
          <Field label="Price">
            <input className={fieldClass} value={productForm.price} onChange={updateProductField("price")} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Gender">
            <select className={fieldClass} value={productForm.gender} onChange={updateProductField("gender")}>
              <option value="female">female</option>
              <option value="male">male</option>
              <option value="unisex">unisex</option>
            </select>
          </Field>
          <Field label="Stock">
            <select
              className={fieldClass}
              value={productForm.availability}
              onChange={updateProductField("availability")}
            >
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
        </div>
        <Field label="Description">
          <textarea
            className={`${fieldClass} min-h-20 resize-none`}
            value={productForm.description}
            onChange={updateProductField("description")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <Field label="Style Tags">
          <input className={fieldClass} value={productForm.styleTags} onChange={updateProductField("styleTags")} />
        </Field>
        <Field label="Occasion Tags">
          <input
            className={fieldClass}
            value={productForm.occasionTags}
            onChange={updateProductField("occasionTags")}
          />
        </Field>
        <Field label="Image URL">
          <input className={fieldClass} value={productForm.imageUrl} onChange={updateProductField("imageUrl")} />
        </Field>
        <Field label="Upload Image">
          <input className={fieldClass} type="file" accept="image/*" onChange={onUploadImage} />
        </Field>
        {uploadNotice ? <p className="text-xs text-[#7b8496]">{uploadNotice}</p> : null}
        <button
          type="submit"
          disabled={!shop}
          className={`${buttonClass} bg-[#12356f] text-white disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Save Product
        </button>
      </div>
    </form>
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

function PanelMetric({ label, value }) {
  return (
    <div className="rounded-md border border-[#e5e8ef] bg-white px-2 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b94a5]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#182238]">{value}</p>
    </div>
  );
}

function EmptyCard({ text, title }) {
  return (
    <article className="rounded-md border border-dashed border-[#cdd4e1] bg-white p-5">
      <p className="text-sm font-bold text-[#182238]">{title}</p>
      <p className="mt-2 text-xs text-[#7b8496]">{text}</p>
    </article>
  );
}

export default ShopDashboardPage;
