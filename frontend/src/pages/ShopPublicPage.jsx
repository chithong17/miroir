import { useEffect, useMemo, useState } from "react";
import { getCatalogShop, listCatalogProducts } from "../api/catalogApi.js";
import { getUserMe, setUserToken } from "../api/userApi.js";
import {
  AppShell,
  Button,
  EmptyState,
  Modal,
  PageHeader,
  ProductCard,
  TopNav,
  formatMoney,
} from "../components/ui/index.jsx";
import { useLanguage } from "../i18n.jsx";

const getShopIdFromPath = () => {
  const match = window.location.pathname.match(/^\/app\/shops\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
};

function ShopPublicPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const shopId = useMemo(getShopIdFromPath, []);
  const displayName = shop?.displayName || shop?.name || t("shopPage.anonymousName");

  useEffect(() => {
    getUserMe()
      .then((response) => setUser(response.user))
      .catch(() => {
        setUserToken("");
        setUser(null);
      });
  }, []);

  useEffect(() => {
    loadShopPage(1);
  }, [shopId]);

  const loadShopPage = async (page = 1) => {
    if (!shopId) {
      setStatus("error");
      setMessage(t("shopPage.loadError"));
      return;
    }

    try {
      setStatus("loading");
      const [shopResponse, productResponse] = await Promise.all([
        getCatalogShop(shopId),
        listCatalogProducts({ shopId, page, limit: 12 }),
      ]);
      setShop(shopResponse.shop);
      setProducts(productResponse.products || []);
      setPagination(productResponse.pagination || { page, totalPages: 1, total: 0 });
      setStatus("idle");
      setMessage("");
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || t("shopPage.loadError"));
    }
  };

  const onLogout = () => {
    setUserToken("");
    window.location.href = "/";
  };

  const goToTryOn = (product) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    window.location.href = `/app/try-on?productId=${encodeURIComponent(product.id)}`;
  };

  const openProduct = (product) => {
    window.location.href = `/app/products/${encodeURIComponent(product.id)}`;
  };

  return (
    <AppShell nav={<TopNav user={user} onLogout={onLogout} />}>
      <main className="section-shell py-8">
        <PageHeader
          eyebrow={t("shopPage.eyebrow")}
          title={displayName}
          description={shop?.description}
          action={<a className="soft-button px-5 py-2" href="/app">{t("nav.marketplace")}</a>}
        />

        {message ? (
          <div className="mt-6 rounded-2xl border border-red-300/45 bg-red-300/14 p-4 text-red-700">
            {message}
          </div>
        ) : null}

        {shop ? (
          <ShopHero shop={shop} />
        ) : status === "loading" ? (
          <div className="glass-panel mt-6 p-8 text-muted">{t("common.loading")}</div>
        ) : null}

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose">
                {t("shopPage.productsTitle")}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">
                {t("shopAdmin.products")}
              </h2>
            </div>
            <p className="text-sm font-bold text-muted">{pagination.total || products.length}</p>
          </div>

          {products.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDetail={openProduct}
                  onTryOn={goToTryOn}
                  showPurchaseActions
                />
              ))}
            </div>
          ) : status === "loading" ? (
            <div className="glass-panel mt-5 p-8 text-muted">{t("common.loading")}</div>
          ) : (
            <div className="mt-5">
              <EmptyState text={t("shopPage.noProducts")} />
            </div>
          )}

          {pagination.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                disabled={pagination.page <= 1}
                onClick={() => loadShopPage(pagination.page - 1)}
              >
                {t("common.prev")}
              </Button>
              <span className="text-sm font-bold text-muted">
                {t("common.page", { page: pagination.page, totalPages: pagination.totalPages })}
              </span>
              <Button
                variant="secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadShopPage(pagination.page + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          ) : null}
        </section>
      </main>

    </AppShell>
  );
}

function ShopHero({ shop }) {
  const { t } = useLanguage();
  const contact = shop.contact || {};

  return (
    <section className="glass-panel mt-6 overflow-hidden">
      <div className="relative min-h-52 bg-white/85">
        {shop.coverUrl ? (
          <img src={shop.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/20 to-transparent" />
        <div className="relative flex min-h-52 flex-wrap items-end gap-5 p-6">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/80 bg-white/10 text-3xl font-black text-rose shadow-glass">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              "M"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose">
              {shop.slug}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">
              {shop.name}
            </h2>
            {shop.description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{shop.description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-line p-5 text-sm text-muted md:grid-cols-3">
          <InfoLine label={t("shopPage.address")} value={contact.address} />
          <InfoLine label={t("shopPage.email")} value={contact.email} />
          <InfoLine label={t("shopPage.phone")} value={contact.phone} />
      </div>
    </section>
  );
}

function InfoLine({ label, value }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-line bg-white/80 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-semibold text-ink">{value || t("product.notProvided")}</p>
    </div>
  );
}

function ShopProductModal({ onClose, onTryOn, product }) {
  const { t } = useLanguage();

  return (
    <Modal onClose={onClose} maxWidth="max-w-4xl">
      <div className="grid gap-5 p-5 md:grid-cols-[0.9fr_1fr]">
        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-white/80">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose">
            {product.category || t("product.product")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">{product.name}</h2>
          <p className="mt-2 text-2xl font-black text-rose">{formatMoney(product.price)}</p>
          <p className="mt-5 text-sm leading-7 text-muted">{product.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => onTryOn(product)}>{t("common.tryOn")}</Button>
            <Button variant="secondary" onClick={onClose}>{t("common.close")}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ShopPublicPage;
