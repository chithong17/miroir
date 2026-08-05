import { useEffect, useState } from "react";
import { getCatalogProduct, listCatalogProducts, submitProductFeedback } from "../api/catalogApi.js";
import { getUserMe, setUserToken } from "../api/userApi.js";
import {
  AppShell,
  Button,
  EmptyState,
  ProductCard,
  ProductPurchaseActions,
  SelectField,
  TextField,
  TopNav,
  formatMoney,
} from "../components/ui/index.jsx";

export default function ProductDetailPage({ productId }) {
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState({ rating: "5", fitFeedback: "true_to_size", comment: "" });
  const [feedbackNotice, setFeedbackNotice] = useState("");

  useEffect(() => {
    getUserMe()
      .then((result) => setUser(result.user))
      .catch(() => {
        setUserToken("");
        window.location.href = "/login";
      });
  }, []);

  useEffect(() => {
    setStatus("loading");
    Promise.all([
      getCatalogProduct(productId),
      listCatalogProducts({ limit: 8 }),
    ])
      .then(([detailResult, listResult]) => {
        setProduct(detailResult.product);
        setRelatedProducts((listResult.products || []).filter((item) => item.id !== productId).slice(0, 4));
        setStatus("ready");
      })
      .catch((error) => {
        setMessage(error.response?.data?.message || "Không tải được thông tin sản phẩm.");
        setStatus("error");
      });
  }, [productId]);

  const logout = () => {
    setUserToken("");
    window.location.href = "/";
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    try {
      setFeedbackNotice("Đang lưu đánh giá...");
      await submitProductFeedback(product.id, { ...feedback, rating: Number(feedback.rating), context: "product" });
      setFeedbackNotice("Đã lưu đánh giá. Cảm ơn bạn!");
      setFeedback((current) => ({ ...current, comment: "" }));
    } catch (error) {
      setFeedbackNotice(error.response?.data?.message || "Không thể lưu đánh giá.");
    }
  };

  return (
    <AppShell nav={<TopNav user={user} onLogout={logout} />}>
      <main className="section-shell py-8">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
          <a className="hover:text-ink" href="/app">Marketplace</a>
          <span>/</span>
          <span className="text-ink">{product?.name || "Chi tiết sản phẩm"}</span>
        </nav>

        {status === "loading" ? <div className="glass-panel p-12 text-center text-muted">Đang tải sản phẩm...</div> : null}
        {status === "error" ? <EmptyState title="Không mở được sản phẩm" text={message} /> : null}

        {product ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
              <div className="glass-panel overflow-hidden p-3 sm:p-5">
                <div className="aspect-[4/5] overflow-hidden rounded-[24px] bg-panel">
                  {product.imageUrl ? <img alt={product.name} className="h-full w-full object-cover" src={product.imageUrl} /> : <div className="flex h-full items-center justify-center text-muted">Chưa có ảnh sản phẩm</div>}
                </div>
              </div>

              <div className="glass-panel p-5 sm:p-7 lg:p-9">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-mintDeep">{product.category || "Sản phẩm"}</p>
                <h1 className="mt-3 font-display text-3xl font-black leading-tight text-ink sm:text-5xl">{product.name}</h1>
                <p className="mt-4 text-3xl font-black text-mintDeep">{formatMoney(product.price)}</p>
                <p className="mt-6 text-base leading-7 text-muted">{product.description || "Shop chưa cung cấp mô tả cho sản phẩm này."}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <ProductInfo label="Chất liệu" value={product.material} />
                  <ProductInfo label="Dáng sản phẩm" value={product.fitType} />
                  <ProductInfo label="Màu đang bán" value={(product.colors || []).join(", ")} />
                  <ProductInfo label="Kích thước" value={(product.sizes || []).join(", ")} />
                </div>

                <ProductPurchaseActions product={product} />

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <a className="dark-button block text-center" href={`/app/try-on?productId=${encodeURIComponent(product.id)}`}>Thử đồ với AI</a>
                  {product.shopId ? <a className="soft-button block text-center" href={`/app/shops/${encodeURIComponent(product.shopId)}`}>Xem shop</a> : null}
                </div>

                {product.shop ? (
                  <div className="mt-6 rounded-2xl border border-line bg-white p-4">
                    <p className="font-black text-ink">{product.shop.name}</p>
                    <p className="mt-1 text-sm text-muted">{product.shop.contact?.address || product.shop.contact?.email || "Shop chưa cập nhật thông tin liên hệ."}</p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-mintDeep">Có thể bạn cũng thích</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {relatedProducts.map((item) => <ProductCard key={item.id} product={item} showPurchaseActions onTryOn={(chosen) => { window.location.href = `/app/try-on?productId=${encodeURIComponent(chosen.id)}`; }} />)}
                </div>
              </div>

              <form className="glass-panel h-fit p-5" onSubmit={submitFeedback}>
                <h2 className="text-xl font-black text-ink">Đánh giá sản phẩm</h2>
                <div className="mt-4 grid gap-3">
                  <SelectField label="Số sao" value={feedback.rating} onChange={(event) => setFeedback((current) => ({ ...current, rating: event.target.value }))}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}
                  </SelectField>
                  <SelectField label="Độ vừa vặn" value={feedback.fitFeedback} onChange={(event) => setFeedback((current) => ({ ...current, fitFeedback: event.target.value }))}>
                    <option value="true_to_size">Đúng kích thước</option>
                    <option value="runs_small">Nhỏ hơn dự kiến</option>
                    <option value="runs_large">Lớn hơn dự kiến</option>
                    <option value="not_sure">Chưa chắc chắn</option>
                  </SelectField>
                  <TextField as="textarea" label="Nhận xét" rows="4" value={feedback.comment} onChange={(event) => setFeedback((current) => ({ ...current, comment: event.target.value }))} />
                  <Button type="submit">Gửi đánh giá</Button>
                  {feedbackNotice ? <p className="text-sm font-semibold text-muted">{feedbackNotice}</p> : null}
                </div>
              </form>
            </section>
          </>
        ) : null}
      </main>
    </AppShell>
  );
}

function ProductInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 font-bold text-ink">{value || "Chưa cập nhật"}</p>
    </div>
  );
}
