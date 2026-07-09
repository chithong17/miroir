import { useState } from "react";
import {
  loginShopOwner,
  registerShopOwner,
  setShopToken,
} from "../api/shopApi.js";

const inputClass =
  "w-full rounded-lg border border-line/70 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-tertiary";
const labelClass = "text-xs font-semibold uppercase tracking-[0.12em] text-muted";

function ShopAuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const updateField = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = isRegister
        ? await registerShopOwner(form)
        : await loginShopOwner({
            email: form.email,
            password: form.password,
          });
      if (response.token) {
        setShopToken(response.token);
        window.location.href = "/shop/dashboard";
        return;
      }

      setStatus("success");
      setMessage(response.message || "Your shop owner account is pending admin approval.");
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Could not authenticate.");
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="fixed left-0 top-0 z-50 w-full bg-canvas/85 shadow-sm backdrop-blur-xl">
        <div className="section-shell flex items-center justify-between py-4">
          <a href="/" className="font-display text-2xl font-extrabold text-ink">
            MIROIR
          </a>
          <a href="/stylist" className="text-sm font-semibold text-muted">
            AI Stylist
          </a>
        </div>
      </nav>

      <main className="section-shell flex min-h-screen items-center justify-center pt-24">
        <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md p-6">
          <h1 className="editorial-title text-3xl font-bold">
            {isRegister ? "Create shop account" : "Shop owner login"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Manage shops, products, image uploads, and Excel imports for AI Stylist.
          </p>

          <div className="mt-6 grid gap-4">
            {isRegister ? (
              <label className="grid gap-2">
                <span className={labelClass}>Name</span>
                <input className={inputClass} value={form.name} onChange={updateField("name")} />
              </label>
            ) : null}

            <label className="grid gap-2">
              <span className={labelClass}>Email</span>
              <input className={inputClass} value={form.email} onChange={updateField("email")} />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Password</span>
              <input
                className={inputClass}
                type="password"
                value={form.password}
                onChange={updateField("password")}
              />
            </label>

            {status === "error" || status === "success" ? (
              <div className={`rounded-lg border p-3 text-sm ${
                status === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}>
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:opacity-60"
            >
              {status === "loading" ? "Working..." : isRegister ? "Register" : "Login"}
            </button>

            <a
              className="text-center text-sm font-semibold text-tertiary"
              href={isRegister ? "/shop/login" : "/shop/register"}
            >
              {isRegister ? "Already have an account? Login" : "New shop owner? Register"}
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}

export default ShopAuthPage;
