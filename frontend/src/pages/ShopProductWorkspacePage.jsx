import { useEffect, useMemo, useState } from "react";
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
import { Button, StatusBadge, formatMoney } from "../components/ui/index.jsx";

const inputClass = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition focus:border-mintDeep focus:ring-2 focus:ring-mintSoft/40 disabled:bg-panel disabled:text-muted";
const emptyForm = {
  id: "",
  name: "",
  category: "",
  description: "",
  price: "",
  gender: "unisex",
  status: "draft",
  fitType: "",
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
  variants: (product.variants || []).map((variant) => ({ ...variant, stockQuantity: Number(variant.stockQuantity || 0) })),
});
const normalizeSkuPart = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^A-Za-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .toUpperCase();
const makeSku = (name, color, size, index = 0) => [normalizeSkuPart(name || "SP"), normalizeSkuPart(color || "DEFAULT"), normalizeSkuPart(size || "ONE"), index ? String(index + 1) : ""].filter(Boolean).join("-").slice(0, 64);

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
  const totalStock = useMemo(() => form.variants.reduce((sum, item) => sum + (item.active ? Number(item.stockQuantity || 0) : 0), 0), [form.variants]);
  const activeVariantCount = useMemo(() => form.variants.filter((item) => item.active).length, [form.variants]);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => product.status !== "trashed" && (!query || [product.name, product.category, product.id].some((value) => String(value || "").toLowerCase().includes(query))));
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
      variants: current.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, [field]: value } : variant),
    }));
  };

  const addVariant = () => {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, {
        id: "",
        sku: makeSku(current.name, "", "", current.variants.length),
        color: "",
        size: "",
        stockQuantity: 0,
        active: true,
      }],
    }));
  };

  const removeVariant = (index) => setForm((current) => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }));

  const generateVariantMatrix = () => {
    const colors = splitList(matrixColors);
    const sizes = splitList(matrixSizes);
    const colorValues = colors.length ? colors : [""];
    const sizeValues = sizes.length ? sizes : [""];
    const existing = new Map(form.variants.map((item) => [`${item.color || ""}::${item.size || ""}`, item]));
    const variants = [];
    colorValues.forEach((color) => sizeValues.forEach((size) => {
      const old = existing.get(`${color}::${size}`);
      variants.push(old || {
        id: "",
        sku: makeSku(form.name, color, size, variants.length),
        color,
        size,
        stockQuantity: 0,
        active: true,
      });
    }));
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
    if (!form.name.trim() || !form.category.trim() || !form.description.trim()) return showNotice("Tên, danh mục và mô tả là bắt buộc.", "error");
    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) return showNotice("Giá sản phẩm không hợp lệ.", "error");
    const variants = form.variants.map((variant) => ({
      id: variant.id || undefined,
      sku: String(variant.sku || "").trim().toUpperCase(),
      color: String(variant.color || "").trim(),
      size: String(variant.size || "").trim(),
      stockQuantity: Number(variant.stockQuantity),
      active: variant.active !== false,
    }));
    if (variants.some((variant) => !variant.sku)) return showNotice("Mỗi biến thể cần có SKU.", "error");
    if (variants.some((variant) => !Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 0)) return showNotice("Tồn kho phải là số nguyên không âm.", "error");
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

  if (status === "loading") return <div className="grid min-h-screen place-items-center bg-white text-muted">Đang tải không gian sản phẩm...</div>;

  return (
    <div className="min-h-screen bg-[#F6F8F3] text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <a className="font-display text-2xl font-black" href="/shop/dashboard">MIROIR</a>
            <div className="hidden h-8 border-l border-line sm:block" />
            <div className="min-w-0"><p className="truncate text-sm font-black">{isNew ? "Tạo sản phẩm mới" : form.name || "Chi tiết sản phẩm"}</p><div className="mt-0.5 flex items-center gap-2"><p className="truncate text-xs text-muted">{shop?.name || "Kênh người bán"}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${hasActivePlan ? "bg-[#E5F0D8] text-[#49652D]" : "bg-amber-100 text-amber-700"}`}>{hasActivePlan ? "Gói hoạt động" : "Cần gia hạn"}</span></div></div>
          </div>
          <div className="flex items-center gap-2">
            <a className="soft-button !px-4 !py-2.5" href="/shop/dashboard">Quay lại danh sách</a>
            <Button disabled={status === "saving" || !hasActivePlan} onClick={() => document.getElementById("shop-product-form")?.requestSubmit()}>{status === "saving" ? "Đang lưu..." : "Lưu sản phẩm"}</Button>
            <button type="button" className="rounded-full px-3 py-2 text-sm font-bold text-muted hover:bg-panel" onClick={logout}>Đăng xuất</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] items-start gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[310px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-2xl border border-line bg-white shadow-glow lg:sticky lg:top-24">
          <div className="border-b border-line p-4">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-black">Sản phẩm của shop</h2><p className="text-xs text-muted">{products.filter((item) => item.status !== "trashed").length} sản phẩm</p></div><a className="flex h-10 w-10 items-center justify-center rounded-full bg-mintDeep text-xl font-black text-white" href="/shop/products/new" title="Sản phẩm mới">+</a></div>
            <input className={`${inputClass} mt-3 !py-2.5`} placeholder="Tìm tên, danh mục, mã..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="max-h-[calc(100vh-245px)] overflow-y-auto p-2">
            {filteredProducts.map((product) => {
              const stock = (product.variants || []).reduce((sum, item) => sum + (item.active ? Number(item.stockQuantity || 0) : 0), 0);
              const active = product.id === form.id;
              return <a key={product.id} href={`/shop/products/${encodeURIComponent(product.id)}`} className={`mb-1 flex gap-3 rounded-xl border p-2.5 transition ${active ? "border-mintDeep bg-accentSoft" : "border-transparent hover:border-line hover:bg-panel"}`}><div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-panel">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{product.name}</p><p className="mt-1 truncate text-xs text-muted">{product.category} · {formatMoney(product.price)}</p><div className="mt-2 flex items-center justify-between gap-2"><StatusBadge status={product.status} /><span className="text-[11px] font-bold text-muted">Kho {stock}</span></div></div></a>;
            })}
            {!filteredProducts.length ? <p className="p-6 text-center text-sm text-muted">Không tìm thấy sản phẩm.</p> : null}
          </div>
        </aside>

        <form id="shop-product-form" className="min-w-0 overflow-hidden" onSubmit={save}>
          {notice ? <div className={`mb-5 rounded-xl border p-4 text-sm font-bold ${noticeType === "error" ? "border-red-200 bg-red-50 text-red-700" : noticeType === "success" ? "border-mintSoft bg-accentSoft text-mintDeep" : "border-line bg-panel text-ink"}`}>{notice}</div> : null}

          <ProductSummary form={form} totalStock={totalStock} activeVariantCount={activeVariantCount} />

          <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid min-w-0 gap-5">
              <EditorSection title="Thông tin cơ bản" description="Thông tin khách hàng nhìn thấy trên sàn và trang chi tiết.">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Tên sản phẩm" required><input className={inputClass} required value={form.name} onChange={updateField("name")} /></FormField>
                  <FormField label="Danh mục" required><input className={inputClass} required placeholder="Ví dụ: Jeans, Áo, Váy" value={form.category} onChange={updateField("category")} /></FormField>
                  <FormField label="Giá bán (VND)" required><input className={inputClass} min="0" required type="number" value={form.price} onChange={updateField("price")} /></FormField>
                  <FormField label="Đối tượng"><select className={inputClass} value={form.gender} onChange={updateField("gender")}><option value="female">Nữ</option><option value="male">Nam</option><option value="unisex">Unisex</option></select></FormField>
                  <FormField label="Dáng sản phẩm"><input className={inputClass} placeholder="Slim, regular, oversized..." value={form.fitType} onChange={updateField("fitType")} /></FormField>
                  <FormField label="Mô tả" required wide><textarea className={`${inputClass} min-h-32 resize-y`} required value={form.description} onChange={updateField("description")} /></FormField>
                </div>
              </EditorSection>

              <VariantEditor
                form={form}
                matrixColors={matrixColors}
                matrixSizes={matrixSizes}
                setMatrixColors={setMatrixColors}
                setMatrixSizes={setMatrixSizes}
                generateVariantMatrix={generateVariantMatrix}
                addVariant={addVariant}
                removeVariant={removeVariant}
                updateVariant={updateVariant}
              />

              <EditorSection title="Phân loại và AI Stylist" description="Các tag giúp tìm kiếm và gợi ý trang phục chính xác hơn.">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Phong cách"><input className={inputClass} placeholder="casual, minimal, streetwear" value={form.styleTags} onChange={updateField("styleTags")} /><FieldHint>Phân tách bằng dấu phẩy.</FieldHint></FormField>
                  <FormField label="Dịp sử dụng"><input className={inputClass} placeholder="đi làm, dự tiệc, hẹn hò" value={form.occasionTags} onChange={updateField("occasionTags")} /><FieldHint>Phân tách bằng dấu phẩy.</FieldHint></FormField>
                </div>
              </EditorSection>
            </div>

            <div className="grid min-w-0 self-start gap-5 xl:sticky xl:top-24">
              <EditorSection title="Ảnh sản phẩm" description="Ảnh dọc, rõ toàn bộ trang phục sẽ cho kết quả try-on tốt hơn.">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-panel">{form.imageUrl ? <img src={form.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">Chưa có ảnh sản phẩm</div>}</div>
                <label className="mt-4 block"><span className="soft-button block cursor-pointer text-center">{uploading ? "Đang tải ảnh..." : "Tải ảnh mới"}</span><input className="hidden" type="file" accept="image/*" disabled={uploading || !hasActivePlan} onChange={uploadImage} /></label>
                <FormField label="Hoặc URL ảnh"><input className={inputClass} value={form.imageUrl} onChange={updateField("imageUrl")} /></FormField>
              </EditorSection>

              <EditorSection title="Trạng thái bán" description="Published chỉ xuất hiện trên marketplace khi còn ít nhất một biến thể đang bật và có tồn kho.">
                <select className={inputClass} value={form.status} onChange={updateField("status")}><option value="draft">Bản nháp</option><option value="published">Đang bán</option><option value="archived">Tạm lưu trữ</option></select>
                <div className="mt-4 grid grid-cols-2 gap-3"><MiniMetric label="Biến thể bật" value={activeVariantCount} /><MiniMetric label="Tổng tồn kho" value={totalStock} /></div>
              </EditorSection>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-glow"><p className="text-sm text-muted">{form.updatedAt ? `Cập nhật gần nhất ${new Date(form.updatedAt).toLocaleString("vi-VN")}` : "Sản phẩm chưa được lưu"}</p><div className="flex gap-2"><a className="soft-button" href="/shop/dashboard">Hủy</a><Button disabled={status === "saving" || !hasActivePlan} type="submit">{status === "saving" ? "Đang lưu..." : isNew ? "Tạo sản phẩm" : "Lưu thay đổi"}</Button></div></div>
        </form>
      </main>
    </div>
  );
}

function ProductSummary({ activeVariantCount, form, totalStock }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-glow">
      <div className="grid gap-5 p-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:p-6">
        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-panel">{form.imageUrl ? <img src={form.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={form.status} /><span className="rounded-full bg-panel px-3 py-1.5 text-xs font-bold text-muted">{form.category || "Chưa có danh mục"}</span></div><h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">{form.name || "Sản phẩm mới"}</h1><p className="mt-2 text-2xl font-black text-mintDeep">{formatMoney(form.price)}</p><p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-muted">{form.description || "Nhập mô tả để khách hàng hiểu rõ sản phẩm."}</p><div className="mt-5 flex flex-wrap gap-4 text-sm"><span><strong>{activeVariantCount}</strong> biến thể đang bật</span><span><strong>{totalStock}</strong> sản phẩm trong kho</span>{form.id ? <span className="font-mono text-xs text-muted">ID: {form.id}</span> : null}</div></div>
      </div>
    </section>
  );
}

function VariantEditor({ addVariant, form, generateVariantMatrix, matrixColors, matrixSizes, removeVariant, setMatrixColors, setMatrixSizes, updateVariant }) {
  return (
    <EditorSection title="Biến thể, SKU và tồn kho" description="Mỗi dòng là một phiên bản màu–size riêng. Đơn hàng sẽ trừ tồn kho đúng dòng khách đã chọn.">
      <div className="rounded-2xl border border-mintSoft bg-accentSoft/60 p-4">
        <p className="text-sm font-black">Tạo nhanh tổ hợp</p><p className="mt-1 text-xs text-muted">Nhập danh sách màu và size, hệ thống sẽ tạo toàn bộ tổ hợp. Tồn kho của tổ hợp đã có sẽ được giữ lại.</p>
        <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><input className={`${inputClass} min-w-0`} placeholder="Màu: Trắng, Đen, Xám" value={matrixColors} onChange={(event) => setMatrixColors(event.target.value)} /><input className={`${inputClass} min-w-0`} placeholder="Size: S, M, L, XL" value={matrixSizes} onChange={(event) => setMatrixSizes(event.target.value)} /><Button className="whitespace-nowrap" variant="secondary" onClick={generateVariantMatrix}>Tạo tổ hợp</Button></div>
      </div>

      <div className="mt-4 max-w-full overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm"><colgroup><col className="w-[21%]" /><col className="w-[14%]" /><col className="w-[29%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[8%]" /></colgroup><thead><tr className="border-b border-line bg-panel text-xs font-black uppercase tracking-[0.1em] text-muted"><th className="px-3 py-3">Màu sắc</th><th className="px-3 py-3">Size</th><th className="px-3 py-3">SKU</th><th className="px-3 py-3">Tồn kho</th><th className="px-3 py-3">Đang bán</th><th className="px-3 py-3" /></tr></thead>
          <tbody>{form.variants.map((variant, index) => <tr className="border-b border-line last:border-0" key={variant.id || `new-${index}`}><td className="min-w-0 p-2"><input className={`${inputClass} min-w-0 !py-2.5`} placeholder="Mặc định" value={variant.color} onChange={(event) => updateVariant(index, "color", event.target.value)} /></td><td className="min-w-0 p-2"><input className={`${inputClass} min-w-0 !py-2.5`} placeholder="Một cỡ" value={variant.size} onChange={(event) => updateVariant(index, "size", event.target.value)} /></td><td className="min-w-0 p-2"><input className={`${inputClass} min-w-0 !py-2.5 font-mono text-xs uppercase`} value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value.toUpperCase())} /></td><td className="min-w-0 p-2"><input className={`${inputClass} min-w-0 !py-2.5`} min="0" type="number" value={variant.stockQuantity} onChange={(event) => updateVariant(index, "stockQuantity", Number(event.target.value))} /></td><td className="p-2"><label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap"><input className="h-5 w-5 accent-[#94B16F]" type="checkbox" checked={variant.active !== false} onChange={(event) => updateVariant(index, "active", event.target.checked)} /><span className="text-xs font-bold">{variant.active !== false ? "Bật" : "Tắt"}</span></label></td><td className="p-2"><button type="button" className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50" title="Xóa biến thể" onClick={() => removeVariant(index)}>×</button></td></tr>)}</tbody>
        </table>
        {!form.variants.length ? <div className="p-8 text-center"><p className="font-bold">Chưa có biến thể</p><p className="mt-1 text-sm text-muted">Tạo tổ hợp màu–size hoặc thêm một dòng thủ công.</p></div> : null}
      </div>
      <button type="button" className="mt-3 rounded-xl border border-dashed border-mintDeep px-4 py-3 text-sm font-black text-mintDeep hover:bg-accentSoft" onClick={addVariant}>+ Thêm một biến thể</button>
    </EditorSection>
  );
}

function EditorSection({ children, description, title }) {
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-glow sm:p-6"><div className="mb-5 min-w-0"><h2 className="text-xl font-black">{title}</h2>{description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}</div>{children}</section>;
}
function FormField({ children, label, required, wide }) { return <label className={`grid gap-2 ${wide ? "md:col-span-2" : ""}`}><span className="text-xs font-black uppercase tracking-[0.12em] text-muted">{label}{required ? <span className="text-red-500"> *</span> : null}</span>{children}</label>; }
function FieldHint({ children }) { return <span className="text-xs text-muted">{children}</span>; }
function MiniMetric({ label, value }) { return <div className="rounded-xl bg-panel p-3"><p className="text-xs font-bold text-muted">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>; }
