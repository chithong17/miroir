import { useEffect, useMemo, useState } from "react";
import {
  approveShopOwner,
  archiveAdminProduct,
  createAdminProduct,
  createAdminShop,
  deactivateShopOwner,
  deleteAdminProduct,
  deleteAdminShop,
  exportAdminProducts,
  getAdminMe,
  importAdminProducts,
  listAdminProducts,
  listAdminShops,
  listShopOwners,
  rejectShopOwner,
  restoreAdminProduct,
  setAdminToken,
  updateAdminProduct,
  updateAdminShop,
} from "../api/adminApi.js";

const shopDefaults = {
  id: "",
  name: "",
  slug: "",
  ownerId: "",
  status: "active",
  description: "",
  logoUrl: "",
  coverUrl: "",
  contactEmail: "",
  contactPhone: "",
};

const productDefaults = {
  id: "",
  name: "",
  category: "",
  description: "",
  price: "",
  gender: "unisex",
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

const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#67558c] focus:ring-2 focus:ring-[#67558c]/10";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const joinList = (value) => (Array.isArray(value) ? value.join(", ") : value || "");

const shopToForm = (shop) => ({
  ...shopDefaults,
  ...shop,
  ownerId: shop.ownerId || "",
  contactEmail: shop.contact?.email || "",
  contactPhone: shop.contact?.phone || "",
});

const productToForm = (product) => ({
  ...productDefaults,
  ...product,
  price: product.price ?? "",
  colors: joinList(product.colors),
  sizes: joinList(product.sizes),
  styleTags: joinList(product.styleTags),
  occasionTags: joinList(product.occasionTags),
});

function AdminDashboardPage() {
  const [admin, setAdmin] = useState(null);
  const [view, setView] = useState("shops");
  const [owners, setOwners] = useState([]);
  const [ownerStatus, setOwnerStatus] = useState("all");
  const [shops, setShops] = useState([]);
  const [shopStatus, setShopStatus] = useState("all");
  const [shopSearch, setShopSearch] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [products, setProducts] = useState([]);
  const [productFilters, setProductFilters] = useState({
    search: "",
    status: "all",
    missingOnly: false,
  });
  const [shopForm, setShopForm] = useState(shopDefaults);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [productForm, setProductForm] = useState(productDefaults);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [notice, setNotice] = useState({ type: "info", text: "" });
  const [loading, setLoading] = useState(true);

  const activeOwners = useMemo(
    () => owners.filter((owner) => owner.status === "active"),
    [owners]
  );
  const selectedShop = shops.find((shop) => shop.id === selectedShopId) || null;
  const visibleProducts = useMemo(() => {
    if (view === "trash") return products.filter((product) => product.status === "trashed");
    return products.filter((product) => product.status !== "trashed");
  }, [products, view]);
  const editingShop = Boolean(shopForm.id);
  const editingProduct = Boolean(
    productForm.id && products.some((product) => product.id === productForm.id)
  );

  const showNotice = (text, type = "info") => {
    setNotice({ text, type });
  };

  const loadOwners = async (status = ownerStatus) => {
    const response = await listShopOwners({ status });
    setOwners(response.owners || []);
  };

  const loadShops = async () => {
    const response = await listAdminShops({ status: shopStatus, search: shopSearch });
    const nextShops = response.shops || [];
    setShops(nextShops);

    if (selectedShopId && !nextShops.some((shop) => shop.id === selectedShopId)) {
      setSelectedShopId("");
      setProducts([]);
      setShopForm(shopDefaults);
      setIsShopModalOpen(false);
      setProductForm(productDefaults);
      setIsProductModalOpen(false);
      setView("shops");
    }
  };

  const loadProducts = async (shopId = selectedShopId) => {
    if (!shopId) {
      setProducts([]);
      return;
    }

    const response = await listAdminProducts(shopId, {
      search: productFilters.search,
      status: productFilters.status,
      missingOnly: String(productFilters.missingOnly),
    });
    setProducts(response.products || []);
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const response = await getAdminMe();
        setAdmin(response.admin);
        await Promise.all([loadOwners("all"), loadShops()]);
      } catch (_error) {
        setAdminToken("");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, []);

  useEffect(() => {
    if (selectedShopId) {
      loadProducts(selectedShopId);
    }
  }, [selectedShopId]);

  const refreshAll = async () => {
    await Promise.all([loadOwners(ownerStatus), loadShops()]);
    if (selectedShopId) await loadProducts(selectedShopId);
  };

  const openShop = async (shop) => {
    setSelectedShopId(shop.id);
    setShopForm(shopToForm(shop));
    setIsShopModalOpen(false);
    setProductForm(productDefaults);
    setIsProductModalOpen(false);
    setView("products");
  };

  const backToShops = () => {
    setSelectedShopId("");
    setProducts([]);
    setShopForm(shopDefaults);
    setIsShopModalOpen(false);
    setProductForm(productDefaults);
    setIsProductModalOpen(false);
    setImportResult(null);
    setView("shops");
  };

  const openNewShop = () => {
    setShopForm(shopDefaults);
    setIsShopModalOpen(true);
  };

  const openEditShop = (shop) => {
    setShopForm(shopToForm(shop));
    setIsShopModalOpen(true);
  };

  const openNewProduct = () => {
    setProductForm(productDefaults);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (product) => {
    setProductForm(productToForm(product));
    setIsProductModalOpen(true);
  };

  const ownerAction = async (ownerId, action) => {
    try {
      if (action === "approve") await approveShopOwner(ownerId);
      if (action === "reject") await rejectShopOwner(ownerId);
      if (action === "deactivate") await deactivateShopOwner(ownerId);
      showNotice("Owner status updated.");
      await Promise.all([loadOwners(ownerStatus), loadShops()]);
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not update owner.", "error");
    }
  };

  const saveShop = async (event) => {
    event.preventDefault();
    const payload = {
      name: shopForm.name,
      slug: shopForm.slug,
      ownerId: shopForm.ownerId || "",
      status: shopForm.status,
      description: shopForm.description,
      logoUrl: shopForm.logoUrl,
      coverUrl: shopForm.coverUrl,
      contact: {
        email: shopForm.contactEmail,
        phone: shopForm.contactPhone,
      },
    };

    try {
      const response = editingShop
        ? await updateAdminShop(shopForm.id, payload)
        : await createAdminShop(payload);
      showNotice(editingShop ? "Shop updated." : "Shop created.");
      setShopForm(shopToForm(response.shop));
      setIsShopModalOpen(false);
      setSelectedShopId(response.shop.id);
      await loadShops();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not save shop.", "error");
    }
  };

  const removeShop = async (shopId) => {
    const confirmed = window.confirm("Deactivate this shop?");
    if (!confirmed) return;

    try {
      await deleteAdminShop(shopId);
      showNotice("Shop deactivated.");
      if (shopId === selectedShopId) backToShops();
      await loadShops();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not deactivate shop.", "error");
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    if (!selectedShopId) {
      showNotice("Select a shop before saving products.", "error");
      return;
    }

    const payload = {
      id: productForm.id || undefined,
      name: productForm.name,
      category: productForm.category,
      description: productForm.description,
      price: productForm.price === "" ? undefined : Number(productForm.price),
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
      if (editingProduct) {
        await updateAdminProduct(productForm.id, payload);
        showNotice("Product updated.");
      } else {
        await createAdminProduct(selectedShopId, payload);
        showNotice("Product created.");
      }
      setProductForm(productDefaults);
      setIsProductModalOpen(false);
      await loadProducts();
      await loadShops();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not save product.", "error");
    }
  };

  const productAction = async (productId, action) => {
    try {
      if (action === "archive") await archiveAdminProduct(productId);
      if (action === "restore") await restoreAdminProduct(productId);
      if (action === "delete") await deleteAdminProduct(productId);
      showNotice("Product status updated.");
      await loadProducts();
      await loadShops();
    } catch (error) {
      showNotice(error.response?.data?.message || "Could not update product.", "error");
    }
  };

  const downloadProducts = async (mode) => {
    if (!selectedShopId) return;
    const blob = await exportAdminProducts(selectedShopId, mode);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `miroir-admin-products-${selectedShopId}-${mode}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const uploadProducts = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedShopId) return;

    try {
      const response = await importAdminProducts(selectedShopId, file);
      setImportResult(response.importJob);
      showNotice("Excel import completed.");
      await loadProducts();
      await loadShops();
    } catch (error) {
      if (error.response?.data?.importJob) {
        setImportResult(error.response.data.importJob);
      }
      showNotice(error.response?.data?.message || "Excel import failed.", "error");
    }
  };

  const logout = () => {
    setAdminToken("");
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="p-8 text-sm text-slate-600">Loading admin dashboard...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
              MA
            </div>
            <div>
              <div className="font-extrabold">MIROIR Admin</div>
              <p className="text-xs text-slate-500">{admin?.email}</p>
            </div>
          </div>

          <nav className="mt-6 grid gap-1">
            <NavButton active={view === "shops"} icon="shop" onClick={backToShops}>
              Shops
            </NavButton>
            <NavButton active={view === "owners"} icon="users" onClick={() => setView("owners")}>
              Shop Owners
            </NavButton>

            {selectedShop ? (
              <div className="mt-4 grid gap-1 border-t border-slate-200 pt-4">
                <p className="px-3 text-xs font-semibold uppercase text-slate-400">
                  {selectedShop.name}
                </p>
                <NavButton active={view === "products"} icon="package" onClick={() => setView("products")}>
                  Products
                </NavButton>
                <NavButton active={view === "trash"} icon="trash" onClick={() => setView("trash")}>
                  Trash
                </NavButton>
                <NavButton active={view === "profile"} icon="edit" onClick={() => setView("profile")}>
                  Shop Profile
                </NavButton>
                <NavButton active={view === "excel"} icon="upload" onClick={() => setView("excel")}>
                  Excel Import
                </NavButton>
              </div>
            ) : null}
          </nav>

          <button
            type="button"
            onClick={logout}
            className="mt-8 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </aside>

        <section className="p-5 lg:p-8">
          <DashboardHeader
            backToShops={backToShops}
            refreshAll={refreshAll}
            selectedShop={selectedShop}
            view={view}
          />

          {notice.text ? (
            <div
              className={`mt-4 rounded-md border p-3 text-sm ${
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {notice.text}
            </div>
          ) : null}

          {view === "owners" ? (
            <OwnersView
              owners={owners}
              ownerAction={ownerAction}
              ownerStatus={ownerStatus}
              setOwnerStatus={async (status) => {
                setOwnerStatus(status);
                await loadOwners(status);
              }}
            />
          ) : null}

          {view === "shops" ? (
            <ShopsView
              openEditShop={openEditShop}
              openNewShop={openNewShop}
              openShop={openShop}
              removeShop={removeShop}
              setShopSearch={setShopSearch}
              setShopStatus={setShopStatus}
              shopSearch={shopSearch}
              shops={shops}
              shopStatus={shopStatus}
              reloadShops={loadShops}
            />
          ) : null}

          {selectedShop && view === "profile" ? (
            <section className="mt-6 max-w-3xl">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{selectedShop.name}</h2>
                    <p className="text-sm text-slate-500">{selectedShop.slug}</p>
                  </div>
                  <button type="button" onClick={() => openEditShop(selectedShop)} className={`${buttonClass} bg-slate-950 text-white`}>
                    <Icon name="edit" />
                    Edit shop
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {selectedShop && (view === "products" || view === "trash") ? (
            <ProductsView
              loadProducts={loadProducts}
              isProductModalOpen={isProductModalOpen}
              openEditProduct={openEditProduct}
              openNewProduct={openNewProduct}
              productAction={productAction}
              productFilters={productFilters}
              productForm={productForm}
              products={visibleProducts}
              rawProductCount={products.length}
              saveProduct={saveProduct}
              selectedShop={selectedShop}
              setProductFilters={setProductFilters}
              setProductForm={setProductForm}
              closeProductModal={() => setIsProductModalOpen(false)}
              updateProductField={(field) => (event) =>
                setProductForm((previous) => ({ ...previous, [field]: event.target.value }))
              }
              view={view}
            />
          ) : null}

          {selectedShop && view === "excel" ? (
            <ExcelView
              downloadProducts={downloadProducts}
              importResult={importResult}
              products={products}
              selectedShop={selectedShop}
              uploadProducts={uploadProducts}
            />
          ) : null}

          {isShopModalOpen ? (
            <ShopModal onClose={() => setIsShopModalOpen(false)}>
              <ShopForm
                activeOwners={activeOwners}
                onClose={() => setIsShopModalOpen(false)}
                saveShop={saveShop}
                setShopForm={setShopForm}
                shopForm={shopForm}
                updateShopField={(field) => (event) =>
                  setShopForm((previous) => ({ ...previous, [field]: event.target.value }))
                }
              />
            </ShopModal>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function DashboardHeader({ backToShops, refreshAll, selectedShop, view }) {
  const title = selectedShop
    ? {
        products: "Products",
        trash: "Trash",
        profile: "Shop Profile",
        excel: "Excel Import",
      }[view] || selectedShop.name
    : view === "owners"
      ? "Shop Owners"
      : "Shops";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedShop ? (
            <button
              type="button"
              onClick={backToShops}
              title="Back to shops"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Icon name="back" />
            </button>
          ) : null}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-slate-500">
              {selectedShop
                ? `${selectedShop.name} - ${selectedShop.owner?.email || "No owner assigned"}`
                : "Select a shop before managing products, trash, profile, or Excel imports."}
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={refreshAll}
        className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
      >
        <Icon name="refresh" />
        Refresh
      </button>
    </header>
  );
}

function OwnersView({ owners, ownerAction, ownerStatus, setOwnerStatus }) {
  return (
    <section className="mt-6 rounded-md border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <h2 className="font-bold">Shop owner accounts</h2>
        <select
          className={`${fieldClass} max-w-48`}
          value={ownerStatus}
          onChange={(event) => setOwnerStatus(event.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>
      <Table headers={["Name", "Email", "Status", "Created", "Actions"]}>
        {owners.map((owner) => (
          <tr key={owner.id} className="border-t border-slate-100 hover:bg-slate-50/70">
            <td className="px-4 py-3 font-medium">{owner.name}</td>
            <td className="px-4 py-3 text-slate-600">{owner.email}</td>
            <td className="px-4 py-3">
              <StatusBadge status={owner.status} />
            </td>
            <td className="px-4 py-3 text-slate-500">{formatDate(owner.createdAt)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <ActionButton title="Approve" onClick={() => ownerAction(owner.id, "approve")} icon="check" />
                <ActionButton title="Reject" onClick={() => ownerAction(owner.id, "reject")} icon="close" />
                <ActionButton title="Deactivate" onClick={() => ownerAction(owner.id, "deactivate")} icon="archive" />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </section>
  );
}

function ShopsView({
  openEditShop,
  openNewShop,
  openShop,
  removeShop,
  reloadShops,
  setShopSearch,
  setShopStatus,
  shopSearch,
  shops,
  shopStatus,
}) {
  return (
    <section className="mt-6">
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="font-bold">Shops</h2>
            <p className="text-sm text-slate-500">{shops.length} shops loaded</p>
          </div>
          <button type="button" onClick={openNewShop} className={`${buttonClass} bg-slate-950 text-white`}>
            <Icon name="plus" />
            New shop
          </button>
        </div>
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_160px_auto]">
          <input
            className={fieldClass}
            placeholder="Search shops"
            value={shopSearch}
            onChange={(event) => setShopSearch(event.target.value)}
          />
          <select className={fieldClass} value={shopStatus} onChange={(event) => setShopStatus(event.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="button" onClick={reloadShops} className={`${buttonClass} bg-slate-950 text-white`}>
            <Icon name="search" />
            Search
          </button>
        </div>
        <Table headers={["Shop", "Owner", "Status", "Products", "Actions"]}>
          {shops.map((shop) => (
            <tr key={shop.id} className="border-t border-slate-100 hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <button type="button" className="text-left" onClick={() => openShop(shop)}>
                  <p className="font-semibold text-slate-950">{shop.name}</p>
                  <p className="text-xs text-slate-500">{shop.slug}</p>
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{shop.owner?.email || "No owner"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={shop.status} />
              </td>
              <td className="px-4 py-3">{shop.productCount}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <ActionButton title="Manage shop" onClick={() => openShop(shop)} icon="open" />
                  <ActionButton title="Edit shop" onClick={() => openEditShop(shop)} icon="edit" />
                  <ActionButton title="Deactivate shop" onClick={() => removeShop(shop.id)} icon="archive" />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </section>
  );
}

function ShopModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ShopForm({ activeOwners, onClose, saveShop, setShopForm, shopForm, updateShopField }) {
  return (
    <form onSubmit={saveShop} className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{shopForm.id ? "Edit shop" : "Create shop"}</h2>
        <button
          type="button"
          title="Close"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
          onClick={() => {
            setShopForm(shopDefaults);
            onClose?.();
          }}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <Field label="Name">
          <input className={fieldClass} value={shopForm.name} onChange={updateShopField("name")} />
        </Field>
        <Field label="Slug">
          <input className={fieldClass} value={shopForm.slug} onChange={updateShopField("slug")} />
        </Field>
        <Field label="Owner">
          <select className={fieldClass} value={shopForm.ownerId} onChange={updateShopField("ownerId")}>
            <option value="">No owner</option>
            {activeOwners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.email}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className={fieldClass} value={shopForm.status} onChange={updateShopField("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <Field label="Description">
          <textarea className={fieldClass} rows="3" value={shopForm.description} onChange={updateShopField("description")} />
        </Field>
        <Field label="Logo URL">
          <input className={fieldClass} value={shopForm.logoUrl} onChange={updateShopField("logoUrl")} />
        </Field>
        <Field label="Cover URL">
          <input className={fieldClass} value={shopForm.coverUrl} onChange={updateShopField("coverUrl")} />
        </Field>
        <Field label="Contact email">
          <input className={fieldClass} value={shopForm.contactEmail} onChange={updateShopField("contactEmail")} />
        </Field>
        <Field label="Contact phone">
          <input className={fieldClass} value={shopForm.contactPhone} onChange={updateShopField("contactPhone")} />
        </Field>
        <button className={`${buttonClass} bg-slate-950 text-white`} type="submit">
          Save shop
        </button>
      </div>
    </form>
  );
}

function ProductsView({
  closeProductModal,
  isProductModalOpen,
  loadProducts,
  openEditProduct,
  openNewProduct,
  productAction,
  productFilters,
  productForm,
  products,
  rawProductCount,
  saveProduct,
  selectedShop,
  setProductFilters,
  setProductForm,
  updateProductField,
  view,
}) {
  const isTrash = view === "trash";

  return (
    <section className="mt-6">
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="font-bold">{isTrash ? "Trashed products" : "Product catalogue"}</h2>
            <p className="text-sm text-slate-500">
              {products.length} shown from {rawProductCount} products in {selectedShop.name}
            </p>
          </div>
          {!isTrash ? (
            <button type="button" onClick={openNewProduct} className={`${buttonClass} bg-slate-950 text-white`}>
              <Icon name="plus" />
              New product
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_150px_140px_auto]">
          <input
            className={fieldClass}
            placeholder="Search products"
            value={productFilters.search}
            onChange={(event) => setProductFilters((previous) => ({ ...previous, search: event.target.value }))}
          />
          <select
            className={fieldClass}
            value={productFilters.status}
            onChange={(event) => setProductFilters((previous) => ({ ...previous, status: event.target.value }))}
          >
            <option value="all">All status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="trashed">Trashed</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={productFilters.missingOnly}
              onChange={(event) => setProductFilters((previous) => ({ ...previous, missingOnly: event.target.checked }))}
            />
            Missing only
          </label>
          <button type="button" onClick={() => loadProducts()} className={`${buttonClass} bg-slate-950 text-white`}>
            <Icon name="search" />
            Filter
          </button>
        </div>
        <Table headers={["Product", "Category", "Price", "Status", "Availability", "Actions"]}>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-slate-100 hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-md bg-slate-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{product.category || "-"}</td>
              <td className="px-4 py-3">{formatMoney(product.price)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={product.status} />
              </td>
              <td className="px-4 py-3">{product.availability}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <ActionButton title="Edit product" onClick={() => openEditProduct(product)} icon="edit" />
                  {isTrash ? (
                    <ActionButton title="Restore product" onClick={() => productAction(product.id, "restore")} icon="restore" />
                  ) : (
                    <>
                      <ActionButton title="Archive product" onClick={() => productAction(product.id, "archive")} icon="archive" />
                      <ActionButton title="Move to trash" onClick={() => productAction(product.id, "delete")} icon="trash" />
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {isProductModalOpen ? (
        <ProductModal onClose={closeProductModal}>
          <ProductForm
            productForm={productForm}
            saveProduct={saveProduct}
            selectedShop={selectedShop}
            setProductForm={setProductForm}
            updateProductField={updateProductField}
            onClose={closeProductModal}
          />
        </ProductModal>
      ) : null}
    </section>
  );
}

function ProductModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-md bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ProductForm({ onClose, productForm, saveProduct, selectedShop, setProductForm, updateProductField }) {
  return (
    <form onSubmit={saveProduct} className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">{productForm.id ? "Edit product" : "Create product"}</h2>
          <p className="text-xs text-slate-500">{selectedShop?.name || "Select a shop"}</p>
        </div>
        <button
          type="button"
          title="Close"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
          onClick={() => {
            setProductForm(productDefaults);
            onClose?.();
          }}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="ID">
          <input className={fieldClass} value={productForm.id} onChange={updateProductField("id")} />
        </Field>
        <Field label="Name">
          <input className={fieldClass} value={productForm.name} onChange={updateProductField("name")} />
        </Field>
        <Field label="Price">
          <input className={fieldClass} value={productForm.price} onChange={updateProductField("price")} />
        </Field>
        <Field label="Category">
          <input className={fieldClass} value={productForm.category} onChange={updateProductField("category")} />
        </Field>
        <Field label="Gender">
          <select className={fieldClass} value={productForm.gender} onChange={updateProductField("gender")}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="unisex">Unisex</option>
          </select>
        </Field>
        <Field label="Availability">
          <select className={fieldClass} value={productForm.availability} onChange={updateProductField("availability")}>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        </Field>
        <Field label="Status">
          <select className={fieldClass} value={productForm.status} onChange={updateProductField("status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="trashed">Trashed</option>
          </select>
        </Field>
        <Field label="Material">
          <input className={fieldClass} value={productForm.material} onChange={updateProductField("material")} />
        </Field>
        <Field label="Fit type">
          <input className={fieldClass} value={productForm.fitType} onChange={updateProductField("fitType")} />
        </Field>
        <Field label="Colors">
          <input className={fieldClass} value={productForm.colors} onChange={updateProductField("colors")} />
        </Field>
        <Field label="Sizes">
          <input className={fieldClass} value={productForm.sizes} onChange={updateProductField("sizes")} />
        </Field>
        <Field label="Style tags">
          <input className={fieldClass} value={productForm.styleTags} onChange={updateProductField("styleTags")} />
        </Field>
        <Field label="Occasion tags">
          <input className={fieldClass} value={productForm.occasionTags} onChange={updateProductField("occasionTags")} />
        </Field>
        <Field label="Image URL">
          <input className={fieldClass} value={productForm.imageUrl} onChange={updateProductField("imageUrl")} />
        </Field>
        <Field label="Image public id">
          <input className={fieldClass} value={productForm.imagePublicId} onChange={updateProductField("imagePublicId")} />
        </Field>
        <label className="grid gap-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase text-slate-500">Description</span>
          <textarea className={fieldClass} rows="4" value={productForm.description} onChange={updateProductField("description")} />
        </label>
        <button className={`${buttonClass} bg-slate-950 text-white md:col-span-2`} type="submit">
          Save product
        </button>
      </div>
    </form>
  );
}

function ExcelView({ downloadProducts, importResult, products, selectedShop, uploadProducts }) {
  return (
    <section className="mt-6 grid gap-5 xl:grid-cols-[400px_1fr]">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="font-bold">Product Excel</h2>
        <p className="mt-1 text-sm text-slate-500">{selectedShop.name}</p>
        <div className="mt-4 grid gap-3">
          <button type="button" onClick={() => downloadProducts("all")} className={`${buttonClass} bg-slate-950 text-white`}>
            <Icon name="download" />
            Download all products
          </button>
          <button type="button" onClick={() => downloadProducts("missing")} className={`${buttonClass} border border-slate-300 bg-white`}>
            <Icon name="download" />
            Download missing fields
          </button>
          <input className={fieldClass} type="file" accept=".xlsx" onChange={uploadProducts} />
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="font-bold">Import result</h2>
        {importResult ? (
          <div className="mt-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label="Status" value={importResult.status} />
              <Metric label="Rows" value={importResult.totalRows} />
              <Metric label="Success" value={importResult.successCount} />
              <Metric label="Failed" value={importResult.failedCount} />
            </div>
            {importResult.errors?.length ? (
              <ul className="mt-4 grid gap-2 text-sm text-red-700">
                {importResult.errors.map((error, index) => (
                  <li key={`${error.row}-${index}`} className="rounded-md bg-red-50 p-2">
                    Row {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">{products.length} products loaded for this shop.</p>
        )}
      </div>
    </section>
  );
}

function NavButton({ active, children, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold ${
        active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <Icon name={icon} />
      {children}
    </button>
  );
}

function Field({ children, label }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Table({ children, headers }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase text-slate-500">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function ActionButton({ icon, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
    >
      <Icon name={icon} />
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone =
    {
      active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      pending: "bg-amber-50 text-amber-700 ring-amber-200",
      draft: "bg-slate-100 text-slate-700 ring-slate-200",
      archived: "bg-slate-100 text-slate-600 ring-slate-200",
      trashed: "bg-red-50 text-red-700 ring-red-200",
      inactive: "bg-slate-100 text-slate-600 ring-slate-200",
      rejected: "bg-red-50 text-red-700 ring-red-200",
    }[status] || "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${tone}`}>
      {status || "-"}
    </span>
  );
}

function Icon({ name }) {
  const paths = {
    archive: (
      <>
        <path d="M4 7h16" />
        <path d="M6 7v11h12V7" />
        <path d="M9 11h6" />
        <path d="M7 4h10l1 3H6l1-3Z" />
      </>
    ),
    back: (
      <>
        <path d="M15 18l-6-6 6-6" />
        <path d="M9 12h11" />
      </>
    ),
    check: (
      <>
        <path d="M20 6 9 17l-5-5" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="M6 6l12 12" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
      </>
    ),
    open: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    package: (
      <>
        <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
        <path d="m4 7 8 4 8-4" />
        <path d="M12 11v10" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 12a8 8 0 0 1-14 5" />
        <path d="M4 17h5v-5" />
        <path d="M4 12a8 8 0 0 1 14-5" />
        <path d="M20 7h-5v5" />
      </>
    ),
    restore: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v6h6" />
        <path d="M12 8v5l4 2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    shop: (
      <>
        <path d="M4 10h16l-1-5H5l-1 5Z" />
        <path d="M6 10v10h12V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
      </>
    ),
    upload: (
      <>
        <path d="M12 21V9" />
        <path d="m7 14 5-5 5 5" />
        <path d="M5 3h14" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.8" />
        <path d="M16 3.2a4 4 0 0 1 0 7.6" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      {paths[name] || paths.package}
    </svg>
  );
}

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
};

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default AdminDashboardPage;
