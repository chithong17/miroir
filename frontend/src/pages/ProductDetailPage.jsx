import { useEffect, useState } from "react";
import {
  getCatalogProduct,
  listCatalogProducts,
  submitProductFeedback,
} from "../api/catalogApi.js";
import { getUserMe, saveUserProfile, setUserToken } from "../api/userApi.js";
import { getFitRecommendation, trackFitEvent } from "../api/fitApi.js";
import { beginCustomerChat } from "../api/chatApi.js";
import FitSilhouette, {
  BodyMeasurementPreview,
} from "../components/fit/FitSilhouette.jsx";
import {
  AppShell,
  Button,
  EmptyState,
  ProductCard,
  ProductPurchaseActions,
  Modal,
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
  const [feedback, setFeedback] = useState({
    rating: "5",
    fitFeedback: "true_to_size",
    comment: "",
  });
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [fitOpen, setFitOpen] = useState(false);
  const [recommendedVariantId, setRecommendedVariantId] = useState("");
  const [fitVisual, setFitVisual] = useState(null);
  const [fitEditVersion, setFitEditVersion] = useState(0);

  useEffect(() => {
    getUserMe()
      .then((result) => setUser(result.user))
      .catch(() => {
        setUserToken("");
        sessionStorage.setItem("miroir_after_login", window.location.pathname);
        window.location.href = "/login";
      });
  }, []);

  useEffect(() => {
    setStatus("loading");
    Promise.all([
      getCatalogProduct(productId),
      listCatalogProducts({ limit: 10 }),
    ])
      .then(([detailResult, listResult]) => {
        setProduct(detailResult.product);
        setRelatedProducts(
          (listResult.products || [])
            .filter((item) => item.id !== productId)
            .slice(0, 5),
        );
        setStatus("ready");
      })
      .catch((error) => {
        setMessage(
          error.response?.data?.message || "Không tải được thông tin sản phẩm.",
        );
        setStatus("error");
      });
  }, [productId]);

  const logout = () => {
    setUserToken("");
    window.location.href = "/";
  };

  const openFitFinder = () => {
    setFitOpen(true);
    if (!product) return;
    trackFitEvent({
      type: "opened",
      productId: product.id,
      shopId: product.shopId,
    }).catch(() => {});
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    try {
      setFeedbackNotice("Đang lưu đánh giá...");
      await submitProductFeedback(product.id, {
        ...feedback,
        rating: Number(feedback.rating),
        context: "product",
      });
      setFeedbackNotice("Đã lưu đánh giá. Cảm ơn bạn!");
      setFeedback((current) => ({ ...current, comment: "" }));
    } catch (error) {
      setFeedbackNotice(
        error.response?.data?.message || "Không thể lưu đánh giá.",
      );
    }
  };

  return (
    <AppShell nav={<TopNav user={user} onLogout={logout} />}>
      <main className="section-shell py-8">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
          <a className="hover:text-ink" href="/app">
            Marketplace
          </a>
          <span>/</span>
          <span className="text-ink">
            {product?.name || "Chi tiết sản phẩm"}
          </span>
        </nav>

        {status === "loading" ? (
          <div className="glass-panel p-12 text-center text-muted">
            Đang tải sản phẩm...
          </div>
        ) : null}
        {status === "error" ? (
          <EmptyState title="Không mở được sản phẩm" text={message} />
        ) : null}

        {product ? (
          <>
            <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)]">
              <div className="flex h-full flex-col gap-4">
                <div className="glass-panel flex flex-1 items-center justify-center p-4 sm:p-6">
                  {product.imageUrl ? (
                    <img 
                      alt={product.name} 
                      className="h-auto w-auto max-h-[440px] max-w-full rounded-[24px] shadow-sm" 
                      src={product.imageUrl} 
                    />
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center rounded-[24px] bg-panel text-muted">
                      Chưa có ảnh sản phẩm
                    </div>
                  )}
                </div>

                {product.shopId ? (
                  <div className="glass-panel mt-auto p-4 sm:p-6">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted">Thông tin Shop</p>
                    {product.shop ? (
                      <div className="mt-3">
                        <p className="font-black text-ink">{product.shop.name}</p>
                        <p className="mt-1 text-sm text-muted">{product.shop.contact?.address || product.shop.contact?.email || "Shop chưa cập nhật thông tin liên hệ."}</p>
                      </div>
                    ) : null}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <a className="soft-button block text-center" href={`/app/shops/${encodeURIComponent(product.shopId)}`}>Xem shop</a>
                      <Button className="w-full" variant="secondary" onClick={() => beginCustomerChat({ shopId: product.shopId }, { type: "product", id: product.id })}>Nhắn tin shop</Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="glass-panel p-4 sm:p-6 lg:p-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-mintDeep">{product.category || "Sản phẩm"}</p>
                <h1 className="mt-2 font-display text-2xl font-black leading-tight text-ink sm:text-3xl md:text-4xl">{product.name}</h1>
                <p className="mt-2 text-2xl font-black text-mintDeep">{formatMoney(product.price)}</p>
                <p className="mt-4 text-sm leading-6 text-muted">{product.description || "Shop chưa cung cấp mô tả cho sản phẩm này."}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ProductInfo label="Chất liệu" value={product.material} />
                  <ProductInfo label="Dáng sản phẩm" value={product.fitType} />
                  <ProductInfo
                    label="Màu đang bán"
                    value={(product.colors || []).join(", ")}
                  />
                  <ProductInfo
                    label="Kích thước"
                    value={(product.sizes || []).join(", ")}
                  />
                </div>

                <div className="mt-4">
                  <ProductPurchaseActions
                    product={product}
                    recommendedVariantId={recommendedVariantId}
                    onOpenFitFinder={openFitFinder}
                    onFitAction={(type, variantId) =>
                      trackFitEvent({
                        type,
                        productId: product.id,
                        shopId: product.shopId,
                        variantId,
                      }).catch(() => {})
                    }
                  />
                </div>

                <div className="mt-4">
                  <a className="soft-button block w-full text-center" href={`/app/try-on?productId=${encodeURIComponent(product.id)}`}>Thử đồ với AI</a>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <form className="glass-panel p-5 sm:p-6" onSubmit={submitFeedback}>
                <h2 className="text-xl font-black text-ink">
                  Đánh giá sản phẩm
                </h2>
                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="w-full shrink-0 md:w-36">
                    <SelectField
                      label="Số sao"
                      value={feedback.rating}
                      onChange={(event) =>
                        setFeedback((current) => ({
                          ...current,
                          rating: event.target.value,
                        }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} sao
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="w-full shrink-0 md:w-48">
                    <SelectField
                      label="Độ vừa vặn"
                      value={feedback.fitFeedback}
                      onChange={(event) =>
                        setFeedback((current) => ({
                          ...current,
                          fitFeedback: event.target.value,
                        }))
                      }
                    >
                      <option value="true_to_size">Đúng kích thước</option>
                      <option value="runs_small">Nhỏ hơn dự kiến</option>
                      <option value="runs_large">Lớn hơn dự kiến</option>
                      <option value="not_sure">Chưa chắc chắn</option>
                    </SelectField>
                  </div>
                  <div className="min-w-0 flex-1">
                    <TextField
                      label="Nhận xét"
                      value={feedback.comment}
                      placeholder="Chia sẻ cảm nhận của bạn..."
                      onChange={(event) =>
                        setFeedback((current) => ({
                          ...current,
                          comment: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="w-full shrink-0 md:w-auto">
                    <Button type="submit" className="w-full">Gửi đánh giá</Button>
                  </div>
                </div>
                {feedbackNotice ? (
                  <p className="mt-3 text-sm font-semibold text-muted">
                    {feedbackNotice}
                  </p>
                ) : null}
              </form>
            </section>

            <section className="mt-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-mintDeep">
                Có thể bạn cũng thích
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {relatedProducts.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    showPurchaseActions
                    onTryOn={(chosen) => {
                      window.location.href = `/app/try-on?productId=${encodeURIComponent(chosen.id)}`;
                    }}
                  />
                ))}
              </div>
            </section>
          </>
        ) : null}
        {fitOpen && product ? (
          <FitFinder
            key={fitEditVersion}
            product={product}
            user={user}
            onApply={(variantId) => {
              setRecommendedVariantId(variantId);
              setFitOpen(false);
            }}
            onClose={() => setFitOpen(false)}
            onUserChange={setUser}
            onVisualResult={setFitVisual}
          />
        ) : null}
        {fitVisual && product ? (
          <FitVirtualModelV2
            product={product}
            result={fitVisual}
            onClose={() => setFitVisual(null)}
            onEdit={() => {
              setFitVisual(null);
              setFitEditVersion((version) => version + 1);
            }}
            onApply={(variantId) => {
              setRecommendedVariantId(variantId);
              setFitVisual(null);
              setFitOpen(false);
            }}
          />
        ) : null}
      </main>
    </AppShell>
  );
}

const fitLabels = {
  tight: "Ôm/chật",
  regular: "Vừa",
  relaxed: "Rộng",
  insufficient_data: "Thiếu dữ liệu",
};
const confidenceLabels = {
  high: "Độ tin cậy cao",
  moderate: "Độ tin cậy trung bình",
  low: "Độ tin cậy thấp",
};
const profileForm = (profile = {}) => ({
  gender: profile.gender || "",
  fitPreference: profile.fitPreference || "regular",
  height: profile.measurements?.height || "",
  weight: profile.measurements?.weight || "",
  bust: profile.measurements?.bust || "",
  waist: profile.measurements?.waist || "",
  hips: profile.measurements?.hips || "",
  shoulder: profile.measurements?.shoulder || "",
});

function FitFinder({
  product,
  user,
  onApply,
  onClose,
  onUserChange,
  onVisualResult,
}) {
  const [form, setForm] = useState(() => profileForm(user?.profile));
  const [consent, setConsent] = useState(Boolean(user?.profile?.fitConsentAt));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));
  const calculate = async () => {
    if (!consent)
      return setNotice("Hãy đồng ý dùng số đo cơ thể cho Fit Finder.");
    setBusy(true);
    setNotice("");
    const profile = {
      gender: form.gender,
      fitPreference: form.fitPreference,
      fitConsent: true,
      measurements: Object.fromEntries(
        ["height", "weight", "bust", "waist", "hips", "shoulder"].map((key) => [
          key,
          Number(form[key]) || undefined,
        ]),
      ),
    };
    try {
      const saved = await saveUserProfile(profile);
      onUserChange(saved.user);
      const response = await getFitRecommendation({
        productId: product.id,
        fitPreference: form.fitPreference,
        profileOverride: profile,
      });
      setResult(response.recommendation);
      onVisualResult({
        ...response.recommendation,
        bodyMeasurements: profile.measurements,
        fitPreference: form.fitPreference,
      });
      trackFitEvent({
        type: "recommended",
        productId: product.id,
        shopId: product.shopId,
        variantId: response.recommendation.recommendedVariantId,
        dataStatus: response.recommendation.dataStatus,
        confidence: response.recommendation.confidence,
      }).catch(() => {});
    } catch (error) {
      setNotice(
        error.response?.data?.message || "Không thể tính size phù hợp.",
      );
    } finally {
      setBusy(false);
    }
  };
  const recommended = product.variants?.find(
    (item) => item.id === result?.recommendedVariantId,
  );
  const zoneLabels = {
    chest: "Ngực",
    waist: "Eo",
    hips: "Mông",
    shoulder: "Vai",
  };
  return (
    <Modal maxWidth="max-w-2xl" onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-mintDeep">
            Fit Finder
          </p>
          <h2 className="mt-1 text-2xl font-black text-ink">
            Tìm size phù hợp
          </h2>
          <p className="text-sm text-muted">
            Dùng số đo cơ thể và dữ liệu của từng size.
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          ×
        </Button>
      </div>
      {!result ? (
        <div className="mt-3 grid min-h-0 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs font-bold">
              Kiểu mặc
              <select
                className="miroir-field !py-2"
                value={form.fitPreference}
                onChange={change("fitPreference")}
              >
                <option value="slim">Ôm vừa</option>
                <option value="regular">Regular</option>
                <option value="relaxed">Rộng thoải mái</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-bold">
              Giới tính
              <select
                className="miroir-field !py-2"
                value={form.gender}
                onChange={change("gender")}
              >
                <option value="">Không muốn nêu</option>
                <option value="female">Nữ</option>
                <option value="male">Nam</option>
                <option value="unisex">Khác</option>
              </select>
            </label>
          </div>
          <BodyMeasurementPreview
            measurements={form}
            onChange={(key, value) =>
              setForm((current) => ({ ...current, [key]: value }))
            }
          />
          <label className="flex items-start gap-2.5 rounded-xl bg-panel p-2.5 text-xs leading-5">
            <input
              className="mt-1"
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            Tôi đồng ý dùng số đo này để gợi ý size. Shop không thấy dữ liệu cơ
            thể cá nhân của tôi.
          </label>
          {notice ? (
            <p className="rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-700">
              {notice}
            </p>
          ) : null}
          <Button className="w-full" disabled={busy} onClick={calculate}>
            {busy ? "Đang phân tích..." : "Tiếp tục xem size phù hợp"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          <section className="rounded-2xl border border-mintSoft bg-accentSoft p-4">
            <p className="text-sm font-bold text-mintDeep">
              {confidenceLabels[result.confidence]}
            </p>
            <h3 className="mt-1 text-3xl font-black">
              {recommended ? `Size ${recommended.size}` : "Chưa thể gợi ý"}
            </h3>
            <p className="mt-2 text-sm text-muted">{result.message}</p>
          </section>
          {result.zoneFits?.length ? (
            <section className="grid gap-2 sm:grid-cols-2">
              {result.zoneFits.map((zone) => (
                <div
                  className="rounded-xl border border-line p-3"
                  key={zone.zone}
                >
                  <p className="text-xs font-bold uppercase text-muted">
                    {zoneLabels[zone.zone] || zone.zone}
                  </p>
                  <p className="mt-1 font-black">{fitLabels[zone.status]}</p>
                  <p className="text-xs text-muted">
                    {zone.ease === null ? "" : `Độ dư ${zone.ease} cm`}
                  </p>
                </div>
              ))}
            </section>
          ) : null}
          {result.alternatives?.length ? (
            <p className="text-sm text-muted">
              Lựa chọn khác:{" "}
              {result.alternatives
                .map(
                  (item) =>
                    `${product.variants.find((variant) => variant.id === item.variantId)?.size || ""} (${item.label})`,
                )
                .join(" · ")}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!result.recommendedVariantId}
              onClick={() => {
                trackFitEvent({
                  type: "applied",
                  productId: product.id,
                  shopId: product.shopId,
                  variantId: result.recommendedVariantId,
                  dataStatus: result.dataStatus,
                  confidence: result.confidence,
                }).catch(() => {});
                onApply(result.recommendedVariantId);
              }}
            >
              Dùng size đề xuất
            </Button>
            <Button variant="secondary" onClick={() => setResult(null)}>
              Chỉnh số đo
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function FitVirtualModelV2({ product, result, onApply, onClose, onEdit }) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    result.recommendedVariantId || "",
  );
  const category = product.fitCategory || "top";
  const variants = Object.values(
    (product.variants || [])
      .filter((item) => item.active !== false && Number(item.stockQuantity) > 0)
      .reduce((bySize, item) => {
        const key = String(item.size || "One").trim() || "One";
        if (!bySize[key] || item.id === result.recommendedVariantId) bySize[key] = item;
        return bySize;
      }, {}),
  );
  const selected = product.variants?.find(
    (item) => item.id === selectedVariantId,
  );
  const measurements = selected?.fitMeasurements || {};
  const body = result.bodyMeasurements || {};
  const bodyKey = {
    chest: "bust",
    waist: "waist",
    hips: "hips",
    shoulder: "shoulder",
  };
  const easeTarget = {
    slim: { chest: 6, waist: 4, hips: 5, shoulder: 0.5 },
    regular: { chest: 12, waist: 8, hips: 9, shoulder: 1.5 },
    relaxed: { chest: 18, waist: 14, hips: 15, shoulder: 3 },
  }[result.fitPreference || "regular"];
  const zone = (name) => {
    const garment = Number(measurements[name]);
    const person = Number(body[bodyKey[name]]);
    if (!garment || !person) return { status: "insufficient_data", ease: null };
    const ease = Number((garment - person).toFixed(1));
    const tolerance = name === "shoulder" ? 1.5 : 4;
    return {
      ease,
      status:
        ease < Math.max(0, easeTarget[name] - tolerance)
          ? "tight"
          : ease > easeTarget[name] + tolerance
            ? "relaxed"
            : "regular",
    };
  };
  const styleFor = (name) =>
    ({
      tight: { fill: "#FECACA", accent: "#EF4444", label: "Ôm" },
      regular: { fill: "#E4F4D9", accent: "#63A35C", label: "Vừa" },
      relaxed: { fill: "#DBEAFE", accent: "#3B82F6", label: "Rộng" },
      insufficient_data: {
        fill: "#F3F4F6",
        accent: "#9CA3AF",
        label: "Ước tính",
      },
    })[zone(name).status];
  const fitZones = Object.fromEntries(
    ["chest", "waist", "hips", "shoulder"].map((name) => [
      name,
      { ...zone(name), ...styleFor(name) },
    ]),
  );
  const zoneNames = {
    chest: "ngực",
    waist: "eo",
    hips: "mông",
    shoulder: "vai",
  };
  const relevantZoneKeys =
    category === "bottom"
      ? ["waist", "hips"]
      : ["chest", "waist", "hips", "shoulder"];
  const zonesWithStatus = (status) =>
    relevantZoneKeys.filter((name) => fitZones[name].status === status);
  const formatZoneNames = (names) =>
    names.map((name) => zoneNames[name]).join(", ");
  const tightZones = zonesWithStatus("tight");
  const relaxedZones = zonesWithStatus("relaxed");
  const missingZones = zonesWithStatus("insufficient_data");
  const recommendedVariant = product.variants?.find(
    (item) => item.id === result.recommendedVariantId,
  );
  const isRecommended = selectedVariantId === result.recommendedVariantId;
  const fitExplanation = (() => {
    if (!selected) return "Chọn một size để xem đánh giá độ vừa vặn.";
    if (result.dataStatus === "estimated") {
      return `Size ${selected.size} được ước tính từ chiều cao, cân nặng và nhãn size; cần thêm số đo quần áo để đánh giá từng vùng.`;
    }
    if (tightZones.length && relaxedZones.length) {
      return `Size ${selected.size} có thể chật ở ${formatZoneNames(tightZones)}, đồng thời rộng ở ${formatZoneNames(relaxedZones)}.`;
    }
    if (tightZones.length) {
      return `Size ${selected.size} có thể chật ở ${formatZoneNames(tightZones)} vì độ dư thấp hơn mức an toàn.`;
    }
    if (relaxedZones.length) {
      return `Size ${selected.size} rộng ở ${formatZoneNames(relaxedZones)} so với kiểu mặc ${result.fitPreference || "regular"}.`;
    }
    if (missingZones.length) {
      return `Chưa đủ số đo ${formatZoneNames(missingZones)} của size ${selected.size} để kết luận chính xác.`;
    }
    if (isRecommended) {
      return `Các số đo ${formatZoneNames(relevantZoneKeys)} của size ${selected.size} tạo độ dư gần nhất với kiểu mặc ${result.fitPreference || "regular"}.`;
    }
    return `Size ${selected.size} vẫn nằm trong ngưỡng vừa, nhưng độ dư chưa sát kiểu mặc ${result.fitPreference || "regular"} bằng size ${recommendedVariant?.size || "đề xuất"}.`;
  })();
  return (
    <Modal maxWidth="max-w-2xl" onClose={onClose}>
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <button
          type="button"
          aria-label="Đóng mô phỏng"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-xl font-medium text-ink transition hover:bg-panel"
          onClick={onClose}
        >
          ×
        </button>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accentSoft text-mintDeep">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <circle cx="12" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8.5 21 10 14l-2-3.5L10 8h4l2 2.5-2 3.5 1.5 7M10 14h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </span>
          <button
            type="button"
            className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-black text-ink transition hover:border-mintDeep"
            onClick={onEdit}
          >
            Chỉnh số đo
          </button>
        </div>
        <div className="rounded-full bg-accentSoft px-3 py-1.5 text-[10px] font-black tracking-wide text-mintDeep">
          FIT LIVE
        </div>
      </div>
      <div className="mt-2 text-center">
        <h2 className="text-xl font-black text-ink">Ướm size trên cơ thể</h2>
        <p className="text-xs leading-5 text-muted">
          Chạm vào size để xem vùng nào vừa, chật hoặc rộng.
        </p>
      </div>
      <div className="mt-2 grid min-h-0 gap-3 md:grid-cols-[minmax(0,1.65fr)_minmax(270px,0.75fr)] md:items-center">
        <section className="relative grid min-h-0 place-items-center overflow-hidden rounded-[22px] border border-line bg-gradient-to-b from-white to-[#F7F8FA] px-1 py-1.5">
          <FitSilhouette
            bodyMeasurements={body}
            category={category}
            measurements={measurements}
            zones={fitZones}
          />
        </section>
        <aside className="grid content-center gap-3">
          <div className="rounded-[18px] border border-line bg-white p-2.5 shadow-sm">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              Chọn size để so sánh
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 overflow-x-auto px-0.5 pb-1 md:flex-wrap">
              {product.imageUrl ? (
                <img
                  className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow ring-1 ring-line"
                  src={product.imageUrl}
                  alt={product.name}
                />
              ) : null}
              {variants.map((variant) => (
                <button
                  type="button"
                  className={`group relative grid h-10 min-w-10 place-items-center rounded-full border text-sm font-black transition ${selectedVariantId === variant.id ? "border-[#273043] bg-[#273043] text-white shadow-lg" : "border-line bg-white text-ink hover:border-mintDeep"}`}
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                >
                  {variant.size || "One"}
                  {variant.id === result.recommendedVariantId ? (
                    <>
                      <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-mintDeep text-[9px] text-white" aria-label="Size được đề xuất">✓</span>
                      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 w-max -translate-x-1/2 rounded bg-ink px-2 py-1 text-[9px] font-bold text-white opacity-0 shadow transition group-hover:opacity-100">Size được đề xuất</span>
                    </>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-[18px] bg-panel px-3 py-3 text-center">
            <p className="text-2xl font-black text-ink">
              {selected ? `Size ${selected.size}` : "Chưa đủ dữ liệu"}
            </p>
            <p className="mx-auto mt-1 line-clamp-3 max-w-lg text-xs leading-5 text-muted">
              {fitExplanation}
            </p>
          </div>
          <Button
            className="w-full !py-3"
            disabled={!selectedVariantId}
            onClick={() => {
              trackFitEvent({
                type: "applied",
                productId: product.id,
                shopId: product.shopId,
                variantId: selectedVariantId,
                dataStatus: result.dataStatus,
                confidence: result.confidence,
              }).catch(() => {});
              onApply(selectedVariantId);
            }}
          >
            {selected ? `Dùng size ${selected.size}` : "Dùng size đề xuất"}
          </Button>
        </aside>
      </div>
    </Modal>
  );
}

function ProductInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-bold text-ink">{value || "Chưa cập nhật"}</p>
    </div>
  );
}
