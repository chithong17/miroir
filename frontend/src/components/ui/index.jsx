import { useEffect, useMemo, useState } from "react";
import { LanguageToggle, useLanguage } from "../../i18n.jsx";
import { addCartItem, getCart, listNotifications, readNotification, removeCartItem, updateCartItem } from "../../api/commerceApi.js";
import { getUserToken } from "../../api/userApi.js";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export function AppShell({ children, nav, sidebar }) {
  if (sidebar) {
    return (
      <div className="min-h-screen bg-white text-ink">
        <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
          {sidebar}
          <main className="min-w-0 px-4 py-5 md:px-8 lg:px-10">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      {nav}
      {children}
    </div>
  );
}

export function TopNav({ user, onLogout, compact = false }) {
  const { t } = useLanguage();
  const pathname = typeof window === "undefined" ? "" : window.location.pathname;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cart, setCart] = useState(null);
  const [cartNotice, setCartNotice] = useState("");
  useEffect(() => {
    if (!user) return undefined;
    const refresh = () => Promise.all([listNotifications(), getCart()]).then(([result, cartResult]) => { setNotifications(result.notifications || []); setUnreadCount(result.unreadCount || 0); setCart(cartResult.cart || null); }).catch(() => {});
    refresh();
    const interval = setInterval(refresh, 30000);
    const focus = () => refresh();
    window.addEventListener("focus", focus);
    window.addEventListener("miroir:cart-updated", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", focus);
      window.removeEventListener("miroir:cart-updated", refresh);
    };
  }, [user?.id]);
  const cartCount = cart?.itemCount || 0;
  const cartItems = (cart?.groups || []).flatMap((group) => group.items || []);
  const changeCartQuantity = async (item, quantity) => {
    try {
      const result = await updateCartItem(item.productId, item.variantId, quantity);
      setCart(result.cart);
      setCartNotice("");
      window.dispatchEvent(new Event("miroir:cart-updated"));
    } catch (error) {
      setCartNotice(error.response?.data?.message || "Không thể cập nhật số lượng.");
    }
  };
  const removeQuickCartItem = async (item) => {
    try {
      const result = await removeCartItem(item.productId, item.variantId);
      setCart(result.cart);
      setCartNotice("");
      window.dispatchEvent(new Event("miroir:cart-updated"));
    } catch (error) {
      setCartNotice(error.response?.data?.message || "Không thể xóa sản phẩm.");
    }
  };
  const navItems = [
    { href: "/app", label: t("nav.marketplace"), active: pathname === "/app" || pathname === "/app/products" },
    { href: "/app/stylist", label: t("nav.stylist"), active: pathname === "/app/stylist" },
    { href: "/app/try-on", label: t("nav.tryOn"), active: pathname === "/app/try-on" },
  ];

  return (
    <nav className="sticky top-3 z-40 mx-auto max-w-[1440px] px-3 sm:px-4 md:px-8 xl:px-20">
      <div className="flex items-center justify-between gap-3 rounded-[26px] border border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl shadow-glass sm:rounded-[34px] sm:px-5 sm:py-3.5">
        <a href={user ? "/app" : "/"} className="font-display text-xl font-extrabold tracking-normal text-ink sm:text-2xl">
          MIROIR
        </a>
        <div className="hidden items-center gap-2 rounded-full border border-line/70 bg-panel/80 p-1.5 text-sm font-semibold md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              className={`rounded-full px-5 py-2 transition ${
                item.active ? "bg-mintDeep text-white shadow-glow" : "text-muted hover:bg-white hover:text-ink"
              }`}
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:gap-3">
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>
          {user ? (
            <>
            <details className="relative">
              <summary
                aria-label="Giỏ hàng"
                className={`relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border bg-white transition hover:bg-panel [&::-webkit-details-marker]:hidden ${pathname === "/app/cart" ? "border-mintDeep text-mintDeep" : "border-line text-ink"}`}
                title="Giỏ hàng"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6" />
                  <circle cx="10" cy="20" r="1" fill="currentColor" stroke="none" />
                  <circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" />
                </svg>
                {cartCount ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-mintDeep px-1 text-center text-[10px] font-black text-white">{cartCount > 99 ? "99+" : cartCount}</span> : null}
              </summary>
              <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="font-black text-ink">Giỏ hàng</p>
                  <span className="text-xs font-bold text-muted">{cartCount} sản phẩm</span>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {cartItems.slice(0, 5).map((item) => (
                    <div className="flex gap-3 rounded-xl p-2 hover:bg-panel" key={`${item.productId}-${item.variantId}`}>
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-panel">
                        {item.product?.imageUrl ? <img alt="" className="h-full w-full object-cover" src={item.product.imageUrl} /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{item.product?.name || "Sản phẩm"}</p>
                        <p className="truncate text-xs text-muted">{item.variant?.color || "Mặc định"} · {item.variant?.size || "Một cỡ"} · x{item.quantity}</p>
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-black text-mintDeep">{Number(item.product?.price || 0).toLocaleString("vi-VN")} VND</p>
                          <div className="flex items-center gap-1">
                            <button type="button" aria-label="Giảm số lượng" disabled={item.quantity <= 1} className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white font-black disabled:opacity-40" onClick={() => changeCartQuantity(item, item.quantity - 1)}>−</button>
                            <span className="min-w-7 text-center text-xs font-black">{item.quantity}</span>
                            <button type="button" aria-label="Tăng số lượng" disabled={item.quantity >= (item.variant?.stockQuantity || 0)} className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white font-black disabled:opacity-40" onClick={() => changeCartQuantity(item, item.quantity + 1)}>+</button>
                            <button type="button" className="ml-1 text-xs font-bold text-red-600 hover:underline" onClick={() => removeQuickCartItem(item)}>Xóa</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!cartItems.length ? <p className="px-4 py-8 text-center text-sm text-muted">Giỏ hàng đang trống.</p> : null}
                  {cartItems.length > 5 ? <p className="px-3 py-2 text-center text-xs font-bold text-muted">Và {cartItems.length - 5} sản phẩm khác</p> : null}
                  {cartNotice ? <p className="px-3 py-2 text-xs font-bold text-red-600">{cartNotice}</p> : null}
                </div>
                <div className="border-t border-line p-3">
                  <a className="block rounded-full bg-mintDeep px-4 py-2.5 text-center text-sm font-black text-white transition hover:opacity-90" href="/app/cart">Mở trang giỏ hàng</a>
                </div>
              </div>
            </details>
            <details className="relative">
              <summary aria-label="Thông báo" className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-line bg-white text-ink [&::-webkit-details-marker]:hidden">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0" /></svg>
                {unreadCount ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-mintDeep px-1 text-center text-[10px] font-black text-white">{unreadCount}</span> : null}
              </summary>
              <div className="absolute right-0 top-full mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-2xl">{notifications.slice(0, 12).map((item) => <button key={item.id} className={`block w-full rounded-xl p-3 text-left text-sm ${item.readAt ? "text-muted" : "bg-accentSoft font-bold"}`} onClick={async () => { await readNotification(item.id); setUnreadCount((value) => Math.max(value - (item.readAt ? 0 : 1), 0)); setNotifications((all) => all.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date() } : entry)); if (item.orderId) window.location.href = `/app/orders/${item.orderId}`; }}><span className="block">{item.title}</span><span className="mt-1 block text-xs font-normal">{item.message}</span></button>)}{!notifications.length ? <p className="p-4 text-center text-sm text-muted">Chưa có thông báo.</p> : null}</div>
            </details><details className="relative group">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full py-2 pl-3 pr-2 transition hover:bg-panel [&::-webkit-details-marker]:hidden">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {!compact ? (
                      <span className="hidden text-sm text-muted group-hover:text-ink sm:inline font-bold transition-colors">
                        {user.name}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="text-xs font-black text-muted">v</span>
              </summary>
              
              <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-[24px] border border-line bg-white/95 shadow-2xl backdrop-blur-xl">
                <div className="p-1.5">
                  <a className="block px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink hover:bg-panel rounded-[18px] transition-colors" href="/app/profile">
                    {t("app.profile")}
                  </a>
                  <a className="block px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink hover:bg-panel rounded-[18px] transition-colors" href="/app/favorites">
                    {t("app.favorites")}
                  </a>
                  <a className="block px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink hover:bg-panel rounded-[18px] transition-colors" href="/app/orders">
                    Đơn hàng
                  </a>
                  <button type="button" onClick={onLogout} className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-ink hover:bg-panel rounded-[18px] transition-colors mt-1">
                    {t("nav.logout")}
                  </button>
                </div>
              </div>
            </details></>
          ) : (
            <>
              <a href="/login" className="soft-button !px-4 !py-2.5 sm:!px-6">{t("nav.login")}</a>
              <a href="/register" className="dark-button !px-4 !py-2.5 sm:!px-6">{t("nav.register")}</a>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto rounded-[22px] border border-white/80 bg-white/75 p-1.5 shadow-glow backdrop-blur-xl md:hidden">
        {navItems.map((item) => (
          <a
            key={item.href}
            className={`min-w-max flex-1 rounded-full px-4 py-2.5 text-center text-sm font-bold transition ${
              item.active ? "bg-mintDeep text-white" : "text-muted hover:bg-white hover:text-ink"
            }`}
            href={item.href}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function Sidebar({ brand = "MIROIR", eyebrow, children, footer }) {
  return (
    <aside className="border-r border-line bg-white/80 px-6 py-8 text-ink backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-accentSoft text-lg font-black text-ink shadow-glow">
          M
        </div>
        <div>
          <div className="font-display text-2xl font-extrabold">{brand}</div>
          {eyebrow ? <p className="text-xs uppercase tracking-widest text-muted">{eyebrow}</p> : null}
        </div>
      </div>
      <nav className="mt-10 grid gap-2">{children}</nav>
      {footer ? <div className="mt-8">{footer}</div> : null}
    </aside>
  );
}

export function PageHeader({ title, eyebrow, description, action }) {
  return (
    <header className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-accentStrong sm:text-sm sm:tracking-[0.16em]">{eyebrow}</p> : null}
        <h1 className="editorial-title mt-2 text-2xl leading-tight sm:mt-3 sm:text-3xl md:text-5xl">{title}</h1>
        {description ? <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base md:text-lg">{description}</p> : null}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </header>
  );
}

export function Button({ children, className, disabled, type = "button", variant = "primary", ...props }) {
  const styles = variant === "primary" ? "dark-button" : variant === "ghost" ? "soft-button !bg-transparent" : "soft-button";
  return (
    <button type={type} disabled={disabled} className={cx(styles, className)} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ children, className, title, ...props }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={cx("inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/80 text-ink shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextField({ label, wide = false, as: Component = "input", className, ...props }) {
  return (
    <label className={cx("grid gap-2", wide && "md:col-span-2")}>
      {label ? <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</span> : null}
      <Component className={cx("miroir-field", className)} {...props} />
    </label>
  );
}

export function SelectField({ children, label, wide = false, className, ...props }) {
  return (
    <label className={cx("grid gap-2", wide && "md:col-span-2")}>
      {label ? <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</span> : null}
      <select className={cx("miroir-field", className)} {...props}>{children}</select>
    </label>
  );
}

export function SegmentedTabs({ items, value, onChange, className }) {
  return (
    <div className={cx("flex w-full flex-wrap rounded-[22px] border border-white/80 bg-white/80 p-1.5 shadow-sm sm:w-auto sm:rounded-full", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cx(
            "flex-1 rounded-full px-4 py-2.5 text-center text-sm font-bold capitalize transition sm:flex-none sm:px-6",
            value === item.value ? "bg-mintDeep text-white shadow-glow" : "text-muted hover:bg-white hover:text-ink"
          )}
        >
          {item.label || item.value}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status, tone }) {
  const resolvedTone = tone || {
    active: "success",
    published: "success",
    premium: "success",
    success: "success",
    pending: "warning",
    draft: "warning",
    error: "danger",
    rejected: "danger",
    trashed: "danger",
    archived: "neutral",
    inactive: "neutral",
    free: "neutral",
  }[String(status || "").toLowerCase()] || "neutral";

  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    neutral: "border-line bg-white text-muted",
  };

  return (
    <span className={cx("inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize", styles[resolvedTone])}>
      {status || "-"}
    </span>
  );
}

export function EmptyState({ text, title = "Nothing here yet" }) {
  const { t } = useLanguage();

  return (
    <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accentSoft text-2xl font-black text-ink">M</div>
      <p className="font-display text-2xl font-bold text-ink">{title === "Nothing here yet" ? t("app.noProductsTitle") : title}</p>
      <p className="mt-3 max-w-md text-base text-muted">{text}</p>
    </div>
  );
}

export function Modal({ children, maxWidth = "max-w-4xl", onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-white/85 p-2 backdrop-blur-md sm:items-center sm:p-4" onMouseDown={onClose}>
      <div className={cx("max-h-[94vh] w-full overflow-y-auto glass-panel p-4 shadow-2xl sm:max-h-[92vh] sm:p-6", maxWidth)} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function MetricTile({ label, value }) {
  return (
    <div className="glass-panel p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 font-display text-4xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

const uniqueVariantValues = (variants, field) => [...new Set(variants.map((item) => String(item[field] || "")))];
const variantOptionKey = (value) => value || "__default__";
const variantOptionValue = (key) => key === "__default__" ? "" : key;

export function ProductPurchaseActions({ compact = false, product }) {
  const variants = useMemo(
    () => (product?.variants || []).filter((item) => item.active !== false && Number(item.stockQuantity) > 0),
    [product],
  );
  const colorValues = useMemo(() => uniqueVariantValues(variants, "color"), [variants]);
  const hasColor = colorValues.some(Boolean);
  const [colorKey, setColorKey] = useState("");
  const [sizeKey, setSizeKey] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setColorKey("");
    setSizeKey("");
    setQuantity(1);
    setNotice("");
  }, [product?.id]);

  const colorFilteredVariants = hasColor && colorKey
    ? variants.filter((item) => String(item.color || "") === variantOptionValue(colorKey))
    : variants;
  const sizeValues = uniqueVariantValues(colorFilteredVariants, "size");
  const hasSize = variants.some((item) => String(item.size || ""));
  const selectedVariant = variants.find((item) => (
    (!hasColor || (colorKey && String(item.color || "") === variantOptionValue(colorKey))) &&
    (!hasSize || (sizeKey && String(item.size || "") === variantOptionValue(sizeKey)))
  ));
  const selectionComplete = Boolean(selectedVariant) && (!hasColor || colorKey) && (!hasSize || sizeKey);

  const requireLogin = () => {
    if (getUserToken()) return true;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    sessionStorage.setItem("miroir_after_login", returnTo);
    window.location.href = "/login";
    return false;
  };
  const add = async () => {
    if (!requireLogin() || !selectionComplete) return;
    try {
      await addCartItem({ productId: product.id, variantId: selectedVariant.id, quantity });
      window.dispatchEvent(new Event("miroir:cart-updated"));
      setNotice("Đã thêm vào giỏ hàng.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Không thể thêm vào giỏ hàng.");
    }
  };
  const buyNow = () => {
    if (!requireLogin() || !selectionComplete) return;
    sessionStorage.setItem("miroir_buy_now", JSON.stringify([{
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
    }]));
    window.location.href = "/app/checkout?mode=buy-now";
  };

  if (!variants.length) return <p className="mt-3 text-sm font-bold text-red-600">Sản phẩm hiện đã hết hàng.</p>;

  return (
    <div className={compact ? "mt-3 border-t border-line pt-3" : "mt-6 rounded-2xl border border-line bg-panel/50 p-4"} onClick={(event) => event.stopPropagation()}>
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-3"}`}>
        {hasColor ? (
          <SelectField label={compact ? "Màu" : "Màu sắc"} value={colorKey} onChange={(event) => { setColorKey(event.target.value); setSizeKey(""); setNotice(""); }}>
            <option value="">Chọn màu</option>
            {colorValues.map((value) => <option key={variantOptionKey(value)} value={variantOptionKey(value)}>{value || "Mặc định"}</option>)}
          </SelectField>
        ) : null}
        {hasSize ? (
          <SelectField label="Kích thước" disabled={hasColor && !colorKey} value={sizeKey} onChange={(event) => { setSizeKey(event.target.value); setNotice(""); }}>
            <option value="">Chọn size</option>
            {sizeValues.map((value) => <option key={variantOptionKey(value)} value={variantOptionKey(value)}>{value || "Mặc định"}</option>)}
          </SelectField>
        ) : null}
        {!compact ? <TextField label="Số lượng" type="number" min="1" max={selectedVariant?.stockQuantity || 1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, selectedVariant?.stockQuantity || 1)))} /> : null}
      </div>
      {compact && selectionComplete ? <p className="mt-2 text-xs font-semibold text-muted">Còn {selectedVariant.stockQuantity} sản phẩm</p> : null}
      {!selectionComplete ? <p className="mt-2 text-xs font-semibold text-muted">Vui lòng chọn {hasColor && hasSize ? "màu sắc và kích thước" : hasColor ? "màu sắc" : hasSize ? "kích thước" : "biến thể"}.</p> : null}
      <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        <Button className="w-full !px-3 !py-2.5" disabled={!selectionComplete} onClick={add}>Thêm vào giỏ</Button>
        <Button className="w-full !px-3 !py-2.5" variant="secondary" disabled={!selectionComplete} onClick={buyNow}>Mua ngay</Button>
      </div>
      {notice ? <p className="mt-2 text-xs font-bold text-mintDeep">{notice}</p> : null}
    </div>
  );
}

export function ProductCard({ isFavorite = false, onDetail, onFavoriteToggle, onTryOn, product, showPurchaseActions = false }) {
  const { t } = useLanguage();
  const productHref = `/app/products/${encodeURIComponent(product?.id || "")}`;
  const openDetail = () => {
    if (onDetail) onDetail(product);
    else window.location.href = productHref;
  };

  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-line bg-white p-2 shadow-glow transition-all duration-500 hover:-translate-y-0.5 hover:border-accentStrong/35 sm:rounded-[24px]">
      {onFavoriteToggle ? (
        <button
          type="button"
          aria-label={isFavorite ? t("product.removeFavorite") : t("product.addFavorite")}
          title={isFavorite ? t("product.removeFavorite") : t("product.addFavorite")}
          className={cx(
            "absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border text-xl font-black shadow-glass backdrop-blur-xl transition",
            isFavorite ? "border-accentStrong/30 bg-accentSoft text-ink" : "border-white/80 bg-white/85 text-muted hover:text-ink"
          )}
          onClick={(event) => {
            event.stopPropagation();
            onFavoriteToggle(product);
          }}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      ) : null}
      <button type="button" className="block aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-panel" onClick={openDetail}>
        {product?.imageUrl ? (
          <img src={product.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">{t("common.noImage")}</div>
        )}
      </button>
      <div className="p-3 sm:p-5">
        <p className="line-clamp-2 font-display text-base font-bold text-ink sm:line-clamp-1 sm:text-lg">{product?.name || t("product.untitled")}</p>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{product?.shop?.name || product?.category || t("product.catalogue")}</p>
        {product?.shopId ? (
          <a
            className="mt-2 inline-flex text-xs font-bold uppercase tracking-[0.16em] text-accentStrong transition hover:text-ink"
            href={`/app/shops/${encodeURIComponent(product.shopId)}`}
          >
            {t("shopPage.viewShop")}
          </a>
        ) : null}
        <div className="mt-4 grid gap-3 sm:mt-5 sm:flex sm:items-center sm:justify-between">
          <p className="text-lg font-extrabold text-ink sm:text-xl">{formatMoney(product?.price)}</p>
          <div className="flex gap-2">
            <Button className="!px-4 !py-2" variant="secondary" onClick={openDetail}>Chi tiết</Button>
            {onTryOn ? <Button className="!px-4 !py-2" onClick={() => onTryOn(product)}>{t("common.tryOn")}</Button> : null}
          </div>
        </div>
        {showPurchaseActions ? <ProductPurchaseActions compact product={product} /> : null}
      </div>
    </article>
  );
}

export function DataTable({ children, headers }) {
  return (
    <div className="overflow-x-auto rounded-[26px] border border-line bg-white shadow-glow">
      <table className="miroir-table">
        <thead>
          <tr className="text-xs uppercase tracking-[0.15em]">
            {headers.map((header) => (
              <th key={header} className="px-6 py-4 font-bold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
