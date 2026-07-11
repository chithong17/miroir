import { useEffect, useState } from "react";
import { getPaymentStatus } from "../api/userApi.js";

function PaymentResultPage({ result }) {
  const params = new URLSearchParams(window.location.search);
  const orderCode = params.get("orderCode");
  const accountType = params.get("accountType");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Checking payment status...");
  const destination = accountType === "shop_owner" ? "/shop/dashboard" : "/app";

  useEffect(() => {
    const loadStatus = async () => {
      if (!orderCode) {
        setStatus("error");
        setMessage("Missing payment order code.");
        return;
      }

      try {
        const response = await getPaymentStatus(orderCode);
        const orderStatus = response.order?.status;

        if (result === "success" && orderStatus === "paid") {
          setStatus("success");
          setMessage("Payment confirmed. Your MIROIR plan is active.");
          setTimeout(() => {
            window.location.href = destination;
          }, 1600);
          return;
        }

        if (result === "success") {
          setStatus("pending");
          setMessage("Payment is being confirmed. Please refresh this page in a moment.");
          return;
        }

        setStatus("cancel");
        setMessage("Payment was cancelled. You can try again whenever you are ready.");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Could not check payment status.");
      }
    };

    loadStatus();
  }, [destination, orderCode, result]);

  return (
    <main className="grid min-h-screen place-items-center bg-hero p-4">
      <section className="w-full max-w-md rounded-lg border border-line/70 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          MIROIR Payment
        </p>
        <h1 className="mt-3 text-2xl font-bold text-ink">
          {status === "success"
            ? "Payment confirmed"
            : status === "cancel"
              ? "Payment cancelled"
              : status === "pending"
                ? "Payment pending"
                : status === "error"
                  ? "Payment check failed"
                  : "Checking payment"}
        </h1>
        <p className="mt-3 text-sm text-muted">{message}</p>
        <a className="dark-button mt-5 inline-flex rounded-lg" href={destination}>
          Back to MIROIR
        </a>
      </section>
    </main>
  );
}

export default PaymentResultPage;
