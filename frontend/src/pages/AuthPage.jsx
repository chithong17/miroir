import { useState } from "react";
import { loginAdmin, setAdminToken } from "../api/adminApi.js";
import { loginShopOwner, registerShopOwner, setShopToken } from "../api/shopApi.js";
import { loginUser, registerUser, setUserToken } from "../api/userApi.js";
import { AppShell, Button, SegmentedTabs, TextField, TopNav } from "../components/ui/index.jsx";
import { useLanguage } from "../i18n.jsx";

function AuthPage({ mode = "login" }) {
  const { t } = useLanguage();
  const isRegister = mode === "register";
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const updateField = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      if (!isRegister) {
        await loginAnyRole({ email: form.email, password: form.password });
        return;
      }

      if (role === "shop") {
        const response = await registerShopOwner(form);
        setStatus("success");
        setMessage(response.message || t("auth.pendingApproval"));
        return;
      }

      const response = await registerUser(form);
      setUserToken(response.token);
      const user = response.user;
      window.location.href = user.profileCompleted || user.profileSkipped ? "/app" : "/onboarding/profile";
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || t("auth.error"));
    }
  };

  return (
    <AppShell nav={<UnifiedNav />}>
      <main className="section-shell grid min-h-[calc(100vh-76px)] items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="relative hidden min-h-[640px] overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-glass lg:block">
          <img
            src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-86"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-canvasDeep via-canvas/30 to-transparent" />
          <div className="absolute left-8 top-8 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-bold backdrop-blur-xl">
            {t("auth.access")}
          </div>
          <h1 className="absolute bottom-8 left-8 right-8 font-display text-7xl font-extrabold leading-none text-ink">
            {t("auth.imageTitle")}
          </h1>
        </section>

        <form onSubmit={submit} className="glass-panel p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose">
            {isRegister ? t("auth.createWorkspace") : t("auth.welcomeBack")}
          </p>
          <h1 className="editorial-title mt-3 text-4xl font-extrabold">
            {isRegister ? t("auth.join") : t("auth.login")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {isRegister
              ? t("auth.registerDescription")
              : t("auth.loginDescription")}
          </p>

          {isRegister ? (
            <SegmentedTabs
              className="mt-6"
              items={[
                { value: "user", label: t("common.user") },
                { value: "shop", label: t("common.shopOwner") },
              ]}
              value={role}
              onChange={setRole}
            />
          ) : null}

          <div className="mt-6 grid gap-4">
            {isRegister ? (
              <TextField label={t("common.name")} value={form.name} onChange={updateField("name")} />
            ) : null}
            <TextField label={t("common.email")} type="email" value={form.email} onChange={updateField("email")} />
            <TextField label={t("common.password")} type="password" value={form.password} onChange={updateField("password")} />

            {message ? (
              <div className={`rounded-lg border p-3 text-sm ${status === "error" ? "border-red-300/45 bg-red-300/14 text-red-100" : "border-emerald-300/45 bg-emerald-300/14 text-emerald-100"}`}>
                {message}
              </div>
            ) : null}

            <Button disabled={status === "loading"} type="submit" className="w-full">
              {status === "loading" ? t("common.working") : isRegister ? t("auth.register") : t("auth.login")}
            </Button>
            <a className="text-center text-sm font-bold text-rose hover:text-ink" href={isRegister ? "/login" : "/register"}>
              {isRegister ? t("auth.alreadyHave") : t("auth.needAccount")}
            </a>
          </div>
        </form>
      </main>
    </AppShell>
  );
}

const resetAllTokens = () => {
  setAdminToken("");
  setShopToken("");
  setUserToken("");
};

const loginAnyRole = async ({ email, password }) => {
  const payload = { email, password };
  let shopStatusError = null;

  try {
    const response = await loginAdmin(payload);
    resetAllTokens();
    setAdminToken(response.token);
    window.location.href = "/admin/dashboard";
    return;
  } catch (_error) {
    // Keep trying other account types.
  }

  try {
    const response = await loginUser(payload);
    resetAllTokens();
    setUserToken(response.token);
    const user = response.user;
    window.location.href = user.profileCompleted || user.profileSkipped ? "/app" : "/onboarding/profile";
    return;
  } catch (_error) {
    // Try shop owner next.
  }

  try {
    const response = await loginShopOwner(payload);
    resetAllTokens();
    setShopToken(response.token);
    window.location.href = "/shop/dashboard";
    return;
  } catch (error) {
    if (error.response?.status === 403) {
      shopStatusError = error;
    }
  }

  if (shopStatusError) {
    throw shopStatusError;
  }

  const error = new Error("Invalid email or password.");
  error.response = { data: { message: "Invalid email or password." } };
  throw error;
};

export function UnifiedNav({ user, onLogout }) {
  return <TopNav user={user} onLogout={onLogout} />;
}

export default AuthPage;
