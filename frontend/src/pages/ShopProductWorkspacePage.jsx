import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Layers,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  createProduct,
  getShopPaymentMe,
  getShopProduct,
  listMyShops,
  listShopProducts,
  setShopToken,
  updateProduct,
  uploadProductImage,
} from "../api/shopApi.js";
import { formatMoney } from "../components/ui/index.jsx";

const inputClass = "neu-input w-full text-sm font-medium text-[#1F241D]";
const emptyForm = {
  id: "",
  name: "",
  category: "",
  description: "",
  price: "",
  gender: "unisex",
  status: "draft",
  fitType: "",
  fitCategory: "",
  fitIntent: "regular",
  styleTags: "",
  occasionTags: "",
  imageUrl: "",
  imagePublicId: "",
  variants: [],
  createdAt: null,
  updatedAt: null,
};

const listText = (values) => Array.isArray(values) ? values.join(", ") : "";
const splitList = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
const productToForm = (product) => ({
  ...emptyForm,
  ...product,
  price: product.price ?? "",
  styleTags: listText(product.styleTags),
  occasionTags: listText(product.occasionTags),
  variants: (product.variants || []).map((variant) => ({
    ...variant,
    stockQuantity: Number(variant.stockQuantity || 0),
    fitMeasurements: variant.fitMeasurements || {},
  })),
});
const normalizeSkuPart = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^A-Za-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .toUpperCase();
const makeSku = (name, color, size, index = 0) => [
  normalizeSkuPart(name || "SP"),
  normalizeSkuPart(color || "DEFAULT"),
  normalizeSkuPart(size || "ONE"),
  index ? String(index + 1) : "",
].filter(Boolean).join("-").slice(0, 64);

export default function ShopProductWorkspacePage({ productId }) {
  const isNew = productId === "new";
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [subscription, setSubscription] = useState(null);
  const [search, setSearch] = useState("");
  const [matrixColors, setMatrixColors] = useState("");
  const [matrixSizes, setMatrixSizes] = useState("");
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [uploading, setUploading] = useState(false);

  const hasActivePlan = Boolean(subscription?.isPremium);
  const totalStock = useMemo(
    () => form.variants.reduce((sum, item) => sum + (item.active ? Number(item.stockQuantity || 0) : 0), 0),
    [form.variants]
  );
  const activeVariantCount = useMemo(
    () => form.variants.filter((item) => item.active).length,
    [form.variants]
  );
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        product.status !== "trashed" &&
        (!query || [product.name, product.category, product.id].some((val) => String(val || "").toLowerCase().includes(query)))
    );
  }, [products, search]);

  useEffect(() => {
    setStatus("loading");
    const detailRequest = isNew ? Promise.resolve({ product: null }) : getShopProduct(productId);
    Promise.all([listMyShops(), listShopProducts(), getShopPaymentMe(), detailRequest])
      .then(([shopResult, productResult, paymentResult, detailResult]) => {
        const nextShop = shopResult.shops?.[0] || null;
        setShop(nextShop);
        setProducts(productResult.products || []);
        setSubscription(paymentResult.subscription || null);
        if (detailResult.product) {
          setForm(productToForm(detailResult.product));
          setMatrixColors(listText(detailResult.product.colors));
          setMatrixSizes(listText(detailResult.product.sizes));
        } else {
          setForm(emptyForm);
          setMatrixColors("");
          setMatrixSizes("");
        }
        setStatus("ready");
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          setShopToken("");
          window.location.href = "/login";
          return;
        }
        setNotice(error.response?.data?.message || "Không tải được thông tin sản phẩm.");
        setNoticeType("error");
        setStatus("error");
      });
  }, [productId]);

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const showNotice = (message, type = "info") => { setNotice(message); setNoticeType(type); };

  const updateVariant = (index, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const addVariant = () => {
    setForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          id: "",
          sku: makeSku(current.name, "", "", current.variants.length),
          color: "",
          size: "",
          stockQuantity: 0,
          active: true,
          fitMeasurements: {},
        },
      ],
    }));
  };

  const removeVariant = (index) =>
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }));

  const generateVariantMatrix = () => {
    const colors = splitList(matrixColors);
    const sizes = splitList(matrixSizes);
    const colorValues = colors.length ? colors : [""];
    const sizeValues = sizes.length ? sizes : [""];
    const existing = new Map(form.variants.map((item) => [`${item.color || ""}::${item.size || ""}`, item]));
    const variants = [];
    colorValues.forEach((color) =>
      sizeValues.forEach((size) => {
        const old = existing.get(`${color}::${size}`);
        variants.push(
          old || {
            id: "",
            sku: makeSku(form.name, color, size, variants.length),
            color,
            size,
            stockQuantity: 0,
            active: true,
          }
        );
      })
    );
    setForm((current) => ({ ...current, variants }));
    showNotice(`Đã tạo ${variants.length} tổ hợp màu–size. Các tổ hợp cũ trùng khớp được giữ nguyên tồn kho.`, "success");
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const result = await uploadProductImage(file);
      setForm((current) => ({ ...current, imageUrl: result.imageUrl, imagePublicId: result.imagePublicId }));
      showNotice("Đã tải ảnh sản phẩm.", "success");
    } catch (error) {
      showNotice(error.response?.data?.message || "Không tải được ảnh sản phẩm.", "error");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!shop) return showNotice("Hãy tạo shop trước khi thêm sản phẩm.", "error");
    if (!hasActivePlan) return showNotice("Cần gói người bán đang hoạt động để lưu sản phẩm.", "error");
    if (!form.name.trim() || !form.category.trim() || !form.description.trim())
      return showNotice("Tên, danh mục và mô tả là bắt buộc.", "error");
    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0)
      return showNotice("Giá sản phẩm không hợp lệ.", "error");

    const variants = form.variants.map((variant) => ({
      id: variant.id || undefined,
      sku: String(variant.sku || "").trim().toUpperCase(),
      color: String(variant.color || "").trim(),
      size: String(variant.size || "").trim(),
      stockQuantity: Number(variant.stockQuantity),
      costPrice: variant.costPrice === "" || variant.costPrice == null ? null : Number(variant.costPrice),
      active: variant.active !== false,
      fitMeasurements: Object.fromEntries(
        Object.entries(variant.fitMeasurements || {})
          .filter(([, value]) => value !== "" && value !== null && value !== undefined)
          .map(([key, value]) => [key, Number(value)])
      ),
    }));

    if (variants.some((variant) => !variant.sku)) return showNotice("Mỗi biến thể cần có SKU.", "error");
    if (variants.some((variant) => !Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 0))
      return showNotice("Tồn kho phải là số nguyên không âm.", "error");
    if (variants.some((variant) => variant.costPrice !== null && (!Number.isSafeInteger(variant.costPrice) || variant.costPrice < 0)))
      return showNotice("Giá vốn phải là số nguyên không âm.", "error");

    const skuSet = new Set(variants.map((variant) => variant.sku));
    if (skuSet.size !== variants.length) return showNotice("SKU không được trùng trong cùng sản phẩm.", "error");

    const payload = {
      shopId: shop.id,
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      gender: form.gender,
      availability: variants.some((item) => item.active && item.stockQuantity > 0) ? "in_stock" : "out_of_stock",
      status: form.status,
      styleTags: splitList(form.styleTags),
      occasionTags: splitList(form.occasionTags),
      fitType: form.fitType.trim(),
      fitCategory: form.fitCategory,
      fitIntent: form.fitIntent,
      imageUrl: form.imageUrl.trim(),
      imagePublicId: form.imagePublicId,
      variants,
    };

    try {
      setStatus("saving");
      const result = isNew ? await createProduct(payload) : await updateProduct(form.id, payload);
      showNotice(isNew ? "Đã tạo sản phẩm." : "Đã lưu thay đổi sản phẩm.", "success");
      if (isNew) {
        window.location.href = `/shop/products/${encodeURIComponent(result.product.id)}`;
        return;
      }
      setForm(productToForm(result.product));
      const productResult = await listShopProducts();
      setProducts(productResult.products || []);
      setStatus("ready");
    } catch (error) {
      showNotice(error.response?.data?.message || "Không lưu được sản phẩm.", "error");
      setStatus("ready");
    }
  };

  const logout = () => {
    setShopToken("");
    window.location.href = "/";
  };

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F9FAF4] text-[#6E7D7C]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#6F8746] border-t-transparent" />
          <p className="text-sm font-semibold">Đang tải không gian sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAF4] text-[#1F2A2A] font-sans antialiased selection:bg-[#B3D07E]/40 selection:text-[#1F2A2A]">
      {/* Top Floating Header */}
      <header className="sticky top-0 z-40 bg-[#F9FAF4]/90 backdrop-blur-md border-b border-[#E2EBD5] shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <a
              href="/shop/dashboard?view=products"
              className="neu-icon-btn text-[#6E756B] hover:text-[#1F241D]"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-black tracking-wider text-[#1F2A2A]">MIROIR</span>
              <span className="rounded-full bg-[#F1F5E8] px-2 py-0.5 text-[10px] font-black text-[#6F8746]">SELLER</span>
            </div>
            <div className="hidden h-6 border-l border-[#E2EBD5] sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#1F2A2A]">
                {isNew ? "Tạo sản phẩm mới" : form.name || "Chi tiết sản phẩm"}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8C9B9A]">{shop?.name || "Kênh người bán"}</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                    hasActivePlan ? "bg-[#F1F5E8] text-[#6F8746]" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {hasActivePlan ? "Gói hoạt động" : "Cần gia hạn"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/shop/dashboard?view=products"
              className="neu-btn-raised text-xs !px-3.5 !py-2 text-[#6E756B] hover:text-[#1F241D]"
            >
              Hủy
            </a>
            <button
              type="button"
              disabled={status === "saving" || !hasActivePlan}
              onClick={() => document.getElementById("shop-product-form")?.requestSubmit()}
              className="neu-btn-primary flex items-center gap-2 text-xs !px-4 !py-2"
            >
              <Save className="h-4 w-4" />
              {status === "saving" ? "Đang lưu..." : isNew ? "Tạo sản phẩm" : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="neu-icon-btn text-[#8C9388] hover:text-red-600"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="mx-auto grid max-w-[1600px] items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
        {/* Left Sidebar: Product List */}
        <aside className="neu-card h-fit p-4 lg:sticky lg:top-20">
          <div className="flex items-center justify-between gap-3 border-b border-[#E1E7D8]/60 pb-3">
            <div>
              <h2 className="text-sm font-black text-[#1F241D]">Sản phẩm của shop</h2>
              <p className="text-xs text-[#8C9388]">
                {products.filter((item) => item.status !== "trashed").length} sản phẩm
              </p>
            </div>
            <a
              href="/shop/products/new"
              className="neu-icon-btn bg-[#6F8746] text-white hover:bg-[#2C6F6B]"
              title="Tạo mới"
            >
              <Plus className="h-4 w-4" />
            </a>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C9388]" />
            <input
              className="neu-input !py-2 pl-9 text-xs"
              placeholder="Tìm theo tên, mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-3 max-h-[calc(100vh-270px)] space-y-1.5 overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const stock = (p.variants || []).reduce(
                (sum, item) => sum + (item.active ? Number(item.stockQuantity || 0) : 0),
                0
              );
              const active = p.id === form.id;
              return (
                <a
                  key={p.id}
                  href={`/shop/products/${encodeURIComponent(p.id)}`}
                  className={`flex items-center gap-3 rounded-2xl p-2.5 transition-all ${
                    active
                      ? "neu-inset bg-[#F1F5E8] text-[#1F2A2A] border border-[#B3D07E]/40"
                      : "hover:bg-white/60 text-[#6E7D7C] hover:text-[#1F2A2A]"
                  }`}
                >
                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-xl bg-[#F1F5E8] shadow-inner">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8C9B9A]">SP</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-[#1F2A2A]">{p.name}</p>
                    <p className="truncate text-[11px] text-[#8C9B9A]">
                      {p.category} · {formatMoney(p.price)}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-1 text-[10px]">
                      <span className="rounded bg-[#F1F5E8] px-1.5 py-0.5 font-bold text-[#6F8746]">{p.status}</span>
                      <span className="font-semibold text-[#8C9B9A]">Kho {stock}</span>
                    </div>
                  </div>
                </a>
              );
            })}
            {!filteredProducts.length && (
              <p className="py-8 text-center text-xs text-[#8C9388]">Không tìm thấy sản phẩm.</p>
            )}
          </div>
        </aside>

        {/* Right Editor Form */}
        <form id="shop-product-form" className="min-w-0" onSubmit={save}>
          {notice && (
            <div
              className={`mb-5 rounded-2xl p-4 text-xs font-bold transition-all ${
                noticeType === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : noticeType === "success"
                  ? "border border-[#B3D07E] bg-[#F1F5E8] text-[#6F8746]"
                  : "neu-card text-[#1F2A2A]"
              }`}
            >
              {notice}
            </div>
          )}

          {/* Product Summary Banner */}
          <section className="neu-card p-6 sm:p-7">
            <div className="grid gap-6 sm:grid-cols-[140px_minmax(0,1fr)] items-center">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#F1F5E8] neu-inset shadow-inner">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#8C9B9A]">Chưa có ảnh</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F1F5E8] px-2.5 py-0.5 text-xs font-bold text-[#6F8746]">
                    {form.status === "published" ? "Đang bán" : form.status === "draft" ? "Bản nháp" : form.status}
                  </span>
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-[#6E7D7C] shadow-sm">
                    {form.category || "Chưa phân loại"}
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-black text-[#1F2A2A] sm:text-3xl font-display">
                  {form.name || "Sản phẩm mới"}
                </h1>
                <p className="mt-1 text-2xl font-black text-[#6F8746]">
                  {formatMoney(form.price || 0)}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-[#6E756B] leading-relaxed">
                  {form.description || "Nhập mô tả sản phẩm ở phần bên dưới."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#6E756B]">
                  <span>
                    <strong className="text-[#1F241D]">{activeVariantCount}</strong> biến thể hoạt động
                  </span>
                  <span>·</span>
                  <span>
                    <strong className="text-[#1F241D]">{totalStock}</strong> sản phẩm trong kho
                  </span>
                  {form.id && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-[#8C9388]">ID: {form.id}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Form Fields Grid */}
          <div className="mt-6 grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Left Column: Details & Variants */}
            <div className="grid min-w-0 gap-6">
              {/* Basic Information */}
              <section className="neu-card p-6 sm:p-7">
                <div className="mb-5">
                  <h2 className="text-base font-black text-[#1F241D]">Thông tin cơ bản</h2>
                  <p className="mt-0.5 text-xs text-[#8C9388]">
                    Hiển thị trên sàn marketplace và trang chi tiết sản phẩm.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Tên sản phẩm" required>
                    <input className={inputClass} required value={form.name} onChange={updateField("name")} />
                  </FormField>
                  <FormField label="Danh mục" required>
                    <input
                      className={inputClass}
                      required
                      placeholder="Ví dụ: Áo thun, Váy maxi, Quần tây"
                      value={form.category}
                      onChange={updateField("category")}
                    />
                  </FormField>
                  <FormField label="Giá bán (VND)" required>
                    <input
                      className={inputClass}
                      min="0"
                      required
                      type="number"
                      value={form.price}
                      onChange={updateField("price")}
                    />
                  </FormField>
                  <FormField label="Đối tượng">
                    <select className={inputClass} value={form.gender} onChange={updateField("gender")}>
                      <option value="female">Nữ</option>
                      <option value="male">Nam</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </FormField>
                  <FormField label="Kiểu dáng (Fit type)">
                    <input
                      className={inputClass}
                      placeholder="Slim fit, Loose, Relaxed..."
                      value={form.fitType}
                      onChange={updateField("fitType")}
                    />
                  </FormField>
                  <FormField label="Mô tả sản phẩm" required wide>
                    <textarea
                      className={`${inputClass} min-h-28 resize-y`}
                      required
                      value={form.description}
                      onChange={updateField("description")}
                    />
                  </FormField>
                </div>
              </section>

              {/* Fit Finder Configuration */}
              <section className="neu-card p-6 sm:p-7">
                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#6F8746]" />
                    <h2 className="text-base font-black text-[#1F2A2A]">Cấu hình Fit Finder & Stylist AI</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-[#8C9B9A]">
                    Giúp hệ thống AI tư vấn size chuẩn xác cho số đo người mặc.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Nhóm form đồ">
                    <select className={inputClass} value={form.fitCategory} onChange={updateField("fitCategory")}>
                      <option value="">Chưa cấu hình Fit Finder</option>
                      <option value="top">Áo / Top</option>
                      <option value="bottom">Quần / Bottom</option>
                      <option value="dress">Váy / Dress</option>
                      <option value="outerwear">Áo khoác / Outerwear</option>
                    </select>
                  </FormField>
                  <FormField label="Độ ôm dáng">
                    <select className={inputClass} value={form.fitIntent} onChange={updateField("fitIntent")}>
                      <option value="slim">Ôm sát (Slim)</option>
                      <option value="regular">Vừa vặn (Regular)</option>
                      <option value="relaxed">Thoải mái (Relaxed)</option>
                    </select>
                  </FormField>
                </div>
              </section>

              {/* Variants and SKU */}
              <section className="neu-card p-6 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-[#1F2A2A]">Biến thể, SKU & Tồn kho</h2>
                    <p className="mt-0.5 text-xs text-[#8C9B9A]">
                      Mỗi dòng là một phiên bản màu-size độc lập.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="neu-btn-raised flex items-center gap-1.5 text-xs !px-3.5 !py-2 text-[#6F8746]"
                    onClick={addVariant}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm dòng biến thể
                  </button>
                </div>

                {/* Matrix Generator */}
                <div className="neu-inset p-4 sm:p-5 rounded-2xl mb-5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#6F8746]" />
                    <p className="text-xs font-black uppercase tracking-wider text-[#1F2A2A]">Tạo nhanh tổ hợp SKU</p>
                  </div>
                  <p className="mt-1 text-xs text-[#6E756B]">
                    Nhập màu và size ngăn cách bởi dấu phẩy, hệ thống sẽ tự động ghép SKU ma trận.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      className="neu-input text-xs"
                      placeholder="Màu: Trắng, Đen, Kem"
                      value={matrixColors}
                      onChange={(e) => setMatrixColors(e.target.value)}
                    />
                    <input
                      className="neu-input text-xs"
                      placeholder="Size: S, M, L, XL"
                      value={matrixSizes}
                      onChange={(e) => setMatrixSizes(e.target.value)}
                    />
                    <button
                      type="button"
                      className="neu-btn-primary text-xs !px-4 whitespace-nowrap"
                      onClick={generateVariantMatrix}
                    >
                      Tạo tổ hợp
                    </button>
                  </div>
                </div>

                {/* Variant Table */}
                <div className="max-w-full overflow-x-auto rounded-2xl border border-[#E1E7D8]/60">
                  <table className="w-full min-w-[700px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E1E7D8]/60 bg-[#EEF3E7]/50 text-[#6E756B] uppercase font-black tracking-wider">
                        <th className="px-3 py-3">Màu sắc</th>
                        <th className="px-3 py-3">Kích cỡ</th>
                        <th className="px-3 py-3">Mã SKU</th>
                        <th className="px-3 py-3">Tồn kho</th>
                        <th className="px-3 py-3 text-center">Bán</th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1E7D8]/60">
                      {form.variants.map((v, idx) => (
                        <tr key={v.id || `var-${idx}`} className="hover:bg-white/50">
                          <td className="p-2">
                            <input
                              className="neu-input !py-1.5 text-xs"
                              placeholder="Mặc định"
                              value={v.color}
                              onChange={(e) => updateVariant(idx, "color", e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="neu-input !py-1.5 text-xs"
                              placeholder="Freesize"
                              value={v.size}
                              onChange={(e) => updateVariant(idx, "size", e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="neu-input !py-1.5 font-mono text-xs uppercase"
                              value={v.sku}
                              onChange={(e) => updateVariant(idx, "sku", e.target.value.toUpperCase())}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="neu-input !py-1.5 text-xs"
                              min="0"
                              type="number"
                              value={v.stockQuantity}
                              onChange={(e) => updateVariant(idx, "stockQuantity", Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={v.active !== false}
                              onChange={(e) => updateVariant(idx, "active", e.target.checked)}
                              className="h-4 w-4 rounded accent-[#6F8746] cursor-pointer"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeVariant(idx)}
                              className="neu-icon-btn !h-8 !w-8 text-[#8C9388] hover:text-red-600"
                              title="Xóa biến thể"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!form.variants.length && (
                    <div className="p-8 text-center">
                      <p className="text-xs font-bold text-[#6E756B]">Chưa có biến thể</p>
                      <p className="mt-0.5 text-xs text-[#8C9388]">Tạo tổ hợp màu–size hoặc thêm một dòng thủ công.</p>
                    </div>
                  )}
                </div>

                {/* Cost Price Section */}
                <div className="neu-inset mt-5 p-4 rounded-2xl">
                  <p className="text-xs font-black text-[#1F241D] uppercase tracking-wider mb-2">
                    Giá vốn theo SKU (Bảo mật nội bộ)
                  </p>
                  <div className="grid gap-2">
                    {form.variants.map((v, idx) => (
                      <div
                        key={`cost-${v.id || idx}`}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-mono text-[#6E756B]">{v.sku || `SKU #${idx + 1}`}</span>
                        <input
                          className="neu-input !py-1.5 text-xs w-48"
                          type="number"
                          min="0"
                          placeholder="Chưa có giá vốn"
                          value={v.costPrice ?? ""}
                          onChange={(e) => updateVariant(idx, "costPrice", e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Tags Section */}
              <section className="neu-card p-6 sm:p-7">
                <div className="mb-5">
                  <h2 className="text-base font-black text-[#1F241D]">Gắn thẻ phân loại (Tags)</h2>
                  <p className="mt-0.5 text-xs text-[#8C9388]">
                    Giúp tìm kiếm và gợi ý đồ phối chính xác hơn trong module thử đồ.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Phong cách (Style)">
                    <input
                      className={inputClass}
                      placeholder="casual, minimal, streetwear"
                      value={form.styleTags}
                      onChange={updateField("styleTags")}
                    />
                    <span className="text-[11px] text-[#8C9388]">Phân tách bằng dấu phẩy</span>
                  </FormField>
                  <FormField label="Dịp mặc (Occasion)">
                    <input
                      className={inputClass}
                      placeholder="đi làm, dạo phố, dự tiệc"
                      value={form.occasionTags}
                      onChange={updateField("occasionTags")}
                    />
                    <span className="text-[11px] text-[#8C9388]">Phân tách bằng dấu phẩy</span>
                  </FormField>
                </div>
              </section>
            </div>

            {/* Right Column: Image & Status */}
            <div className="grid min-w-0 self-start gap-6 xl:sticky xl:top-20">
              {/* Product Image */}
              <section className="neu-card p-6">
                <h2 className="text-sm font-black text-[#1F241D] uppercase tracking-wider mb-1">Ảnh sản phẩm</h2>
                <p className="text-xs text-[#8C9388] mb-4">
                  Nên dùng ảnh chụp dọc với nền gọn gàng.
                </p>
                <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#EDF2E8] neu-inset shadow-inner">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#8C9388]">
                      Chưa có ảnh
                    </div>
                  )}
                </div>

                <label className="mt-4 block">
                  <span className="neu-btn-raised flex items-center justify-center gap-2 text-xs !py-2.5 cursor-pointer text-[#1F2A2A] hover:text-[#6F8746]">
                    <UploadCloud className="h-4 w-4 text-[#6F8746]" />
                    {uploading ? "Đang tải lên..." : "Tải ảnh từ máy"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading || !hasActivePlan}
                    onChange={uploadImage}
                  />
                </label>

                <div className="mt-3">
                  <FormField label="Hoặc nhập đường dẫn URL">
                    <input
                      className="neu-input !py-2 text-xs"
                      placeholder="https://..."
                      value={form.imageUrl}
                      onChange={updateField("imageUrl")}
                    />
                  </FormField>
                </div>
              </section>

              {/* Status Section */}
              <section className="neu-card p-6">
                <h2 className="text-sm font-black text-[#1F2A2A] uppercase tracking-wider mb-1">Trạng thái mở bán</h2>
                <p className="text-xs text-[#8C9B9A] mb-4">
                  Chỉ sản phẩm "Đang bán" và còn tồn kho mới hiển thị cho người mua.
                </p>
                <select className={inputClass} value={form.status} onChange={updateField("status")}>
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="published">Đang bán (Published)</option>
                  <option value="archived">Tạm ẩn (Archived)</option>
                </select>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="neu-inset p-3 rounded-2xl text-center">
                    <span className="text-[11px] text-[#8C9B9A] font-bold">Biến thể bật</span>
                    <p className="text-lg font-black text-[#1F2A2A] mt-0.5">{activeVariantCount}</p>
                  </div>
                  <div className="neu-inset p-3 rounded-2xl text-center">
                    <span className="text-[11px] text-[#8C9B9A] font-bold">Tổng tồn kho</span>
                    <p className="text-lg font-black text-[#6F8746] mt-0.5">{totalStock}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Bottom Sticky Action Bar */}
          <div className="neu-card mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl">
            <p className="text-xs text-[#8C9388]">
              {form.updatedAt
                ? `Cập nhật lần cuối: ${new Date(form.updatedAt).toLocaleString("vi-VN")}`
                : "Sản phẩm chưa được lưu."}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="/shop/dashboard?view=products"
                className="neu-btn-raised text-xs !px-4 !py-2.5 text-[#6E756B] hover:text-[#1F241D]"
              >
                Hủy
              </a>
              <button
                type="submit"
                disabled={status === "saving" || !hasActivePlan}
                className="neu-btn-primary flex items-center gap-2 text-xs !px-5 !py-2.5"
              >
                <Save className="h-4 w-4" />
                {status === "saving" ? "Đang lưu..." : isNew ? "Tạo sản phẩm" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function FormField({ children, label, required, wide }) {
  return (
    <label className={`grid gap-1.5 ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-black uppercase tracking-wider text-[#6E756B]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

