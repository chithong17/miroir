import { useEffect, useState } from "react";
import { getPaymentStatus } from "../api/userApi.js";
import { Button } from "../components/ui/index.jsx";
import { useLanguage } from "../i18n.jsx";

function PaymentResultPage({ result }) {
  const { t } = useLanguage();
  const params = new URLSearchParams(window.location.search);
  const orderCode = params.get("orderCode");
  const accountType = params.get("accountType");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(t("payment.checkingMessage"));
  const destination = accountType === "shop_owner" ? "/shop/dashboard" : "/app";

  useEffect(() => {
    const loadStatus = async () => {
      if (!orderCode) {
        setStatus("error");
        setMessage(t("payment.missingOrder"));
        return;
      }

      try {
        const response = await getPaymentStatus(orderCode);
        const orderStatus = response.order?.status;
        if (result === "success" && orderStatus === "paid") {
          setStatus("success");
          setMessage(t("payment.confirmedMessage"));
          setTimeout(() => { window.location.href = destination; }, 1600);
          return;
        }
        if (result === "success") {
          setStatus("pending");
          setMessage(t("payment.pendingMessage"));
          return;
        }
        setStatus("cancel");
        setMessage(t("payment.cancelledMessage"));
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || t("payment.statusError"));
      }
    };

    loadStatus();
  }, [destination, orderCode, result]);

  const title = {
    success: t("payment.confirmed"),
    cancel: t("payment.cancelled"),
    pending: t("payment.pending"),
    error: t("payment.failed"),
    loading: t("payment.checking"),
  }[status] || t("payment.checking");

  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-4 text-ink">
      <section className="glass-panel w-full max-w-md p-7 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl font-black text-rose">
          {status === "success" ? "✓" : status === "cancel" ? "×" : "…"}
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-rose">{t("payment.miroir")}</p>
        <h1 className="mt-3 text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{message}</p>
        <a href={destination} className="mt-6 inline-flex">
          <Button>{t("payment.back")}</Button>
        </a>
      </section>
    </main>
  );
}

export default PaymentResultPage;
