import { LanguageToggle, useLanguage } from "../../i18n.jsx";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export function AppShell({ children, nav, sidebar }) {
  if (sidebar) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
          {sidebar}
          <main className="min-w-0 px-4 py-5 md:px-8 lg:px-10">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {nav}
      {children}
    </div>
  );
}

export function TopNav({ user, onLogout, compact = false }) {
  const { t } = useLanguage();

  return (
    <nav className="sticky top-6 z-40 mx-auto max-w-[1440px] px-6 md:px-12 xl:px-20">
      <div className="flex items-center justify-between rounded-full border border-white/10 bg-canvasDeep/60 px-6 py-4 backdrop-blur-xl shadow-glass">
        <a href={user ? "/app" : "/"} className="font-display text-2xl font-extrabold tracking-normal text-ink">
          MIROIR
        </a>
        <div className="hidden items-center gap-2 rounded-full bg-white/5 p-1.5 text-sm font-semibold md:flex">
          <a className="rounded-full px-5 py-2 text-muted transition hover:bg-white/10 hover:text-ink" href="/app">
            {t("nav.marketplace")}
          </a>
          <a className="rounded-full px-5 py-2 text-muted transition hover:bg-white/10 hover:text-ink" href="/app/stylist">
            {t("nav.stylist")}
          </a>
          <a className="rounded-full px-5 py-2 text-muted transition hover:bg-white/10 hover:text-ink" href="/app/try-on">
            {t("nav.tryOn")}
          </a>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>
          {user ? (
            <div className="relative group">
              <div className="flex items-center gap-2 cursor-pointer py-2 pl-3 pr-2 rounded-full transition hover:bg-white/5">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {!compact ? (
                      <span className="hidden text-sm text-muted group-hover:text-ink sm:inline font-bold transition-colors">
                        {user.name}
                      </span>
                    ) : null}
                    {user?.subscription?.isPremium ? (
                      <span className="flex items-center justify-center rounded-md bg-rose/15 border border-rose/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose">
                        Premium
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="text-muted group-hover:text-ink text-xs transition-colors">▼</span>
              </div>
              
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-canvasDeep/95 backdrop-blur-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-top-right scale-95 group-hover:scale-100">
                <div className="p-1.5">
                  <a className="block px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink hover:bg-white/10 rounded-xl transition-colors" href="/app/profile">
                    {t("app.profile")}
                  </a>
                  <button type="button" onClick={onLogout} className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-rose hover:bg-white/10 hover:text-roseDeep rounded-xl transition-colors mt-1">
                    {t("nav.logout")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <a href="/login" className="soft-button !py-2.5 !px-6">{t("nav.login")}</a>
              <a href="/register" className="dark-button !py-2.5 !px-6">{t("nav.register")}</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function Sidebar({ brand = "MIROIR", eyebrow, children, footer }) {
  return (
    <aside className="border-r border-white/10 bg-canvasDeep/40 px-6 py-8 text-ink backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose/20 text-lg font-black text-rose shadow-glow">
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
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose">{eyebrow}</p> : null}
        <h1 className="editorial-title mt-3 text-4xl leading-tight md:text-6xl">{title}</h1>
        {description ? <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{description}</p> : null}
      </div>
      {action && <div>{action}</div>}
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
      className={cx("inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ink transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50", className)}
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
    <div className={cx("flex flex-wrap rounded-full border border-white/10 bg-white/5 p-1.5", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cx(
            "rounded-full px-6 py-2.5 text-sm font-bold capitalize transition",
            value === item.value ? "bg-rose text-canvasDeep shadow-glow" : "text-muted hover:bg-white/10 hover:text-ink"
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
    success: "border-emerald-300/40 bg-emerald-300/14 text-emerald-100",
    warning: "border-amber-300/45 bg-amber-300/14 text-amber-100",
    danger: "border-red-300/45 bg-red-300/14 text-red-100",
    neutral: "border-white/10 bg-white/5 text-muted",
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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-6 text-2xl">🍃</div>
      <p className="font-display text-2xl font-bold text-ink">{title === "Nothing here yet" ? t("app.noProductsTitle") : title}</p>
      <p className="mt-3 max-w-md text-base text-muted">{text}</p>
    </div>
  );
}

export function Modal({ children, maxWidth = "max-w-4xl", onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvasDeep/80 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <div className={cx("max-h-[92vh] w-full overflow-y-auto glass-panel p-6 shadow-2xl", maxWidth)} onMouseDown={(event) => event.stopPropagation()}>
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

export function ProductCard({ product, onDetail, onTryOn }) {
  const { t } = useLanguage();

  return (
    <article className="glass-panel group relative overflow-hidden transition-all duration-500 hover:border-white/30 hover:-translate-y-1">
      <button type="button" className="block aspect-[4/5] w-full bg-canvasDeep/50" onClick={() => onDetail?.(product)}>
        {product?.imageUrl ? (
          <img src={product.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">{t("common.noImage")}</div>
        )}
      </button>
      <div className="p-5">
        <p className="line-clamp-1 font-display text-lg font-bold text-ink">{product?.name || t("product.untitled")}</p>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{product?.shop?.name || product?.category || t("product.catalogue")}</p>
        {product?.shopId ? (
          <a
            className="mt-2 inline-flex text-xs font-bold uppercase tracking-[0.16em] text-rose transition hover:text-roseDeep"
            href={`/app/shops/${encodeURIComponent(product.shopId)}`}
          >
            {t("shopPage.viewShop")}
          </a>
        ) : null}
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xl font-extrabold text-rose">{formatMoney(product?.price)}</p>
          {onTryOn ? <Button className="!py-2 !px-5" onClick={() => onTryOn(product)}>{t("common.tryOn")}</Button> : null}
        </div>
      </div>
    </article>
  );
}

export function DataTable({ children, headers }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-canvasDeep/30 backdrop-blur-md">
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
