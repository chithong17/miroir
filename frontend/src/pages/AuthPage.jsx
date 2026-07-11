import { useState } from "react";
import { loginAdmin, setAdminToken } from "../api/adminApi.js";
import { loginShopOwner, registerShopOwner, setShopToken } from "../api/shopApi.js";
import { loginUser, registerUser, setUserToken } from "../api/userApi.js";

const fieldClass = "w-full rounded-lg border border-line/70 bg-white px-3 py-2 text-sm outline-none focus:border-tertiary";

function AuthPage({ mode = "login" }) {
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
        setMessage(response.message || "Shop owner account is pending admin approval.");
        return;
      }

      const response = await registerUser(form);
      setUserToken(response.token);
      const user = response.user;
      window.location.href = user.profileCompleted || user.profileSkipped ? "/app" : "/onboarding/profile";
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Could not authenticate.");
    }
  };

  return (
    <div className="min-h-screen bg-hero">
      <UnifiedNav />
      <main className="section-shell flex min-h-[calc(100vh-80px)] items-center justify-center py-12">
        <form onSubmit={submit} className="glass-panel w-full max-w-md p-6">
          <h1 className="editorial-title text-3xl font-bold">{isRegister ? "Create account" : "Login"}</h1>
          <p className="mt-2 text-sm text-muted">
            {isRegister
              ? "Choose the account type you want to create."
              : "Use your email and password. MIROIR will open the right workspace automatically."}
          </p>

          {isRegister ? (
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-panelSoft p-1">
              <button type="button" onClick={() => setRole("user")} className={`rounded-md py-2 text-sm font-semibold ${role === "user" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
                User
              </button>
              <button type="button" onClick={() => setRole("shop")} className={`rounded-md py-2 text-sm font-semibold ${role === "shop" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
                Shop Owner
              </button>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            {isRegister ? (
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase text-muted">Name</span>
                <input className={fieldClass} value={form.name} onChange={updateField("name")} />
              </label>
            ) : null}
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase text-muted">Email</span>
              <input className={fieldClass} value={form.email} onChange={updateField("email")} />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase text-muted">Password</span>
              <input className={fieldClass} type="password" value={form.password} onChange={updateField("password")} />
            </label>

            {message ? (
              <div className={`rounded-lg border p-3 text-sm ${status === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {message}
              </div>
            ) : null}

            <button disabled={status === "loading"} className="dark-button rounded-lg" type="submit">
              {status === "loading" ? "Working..." : isRegister ? "Register" : "Login"}
            </button>
            <a className="text-center text-sm font-semibold text-tertiary" href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Already have an account? Login" : "Need an account? Register"}
            </a>
          </div>
        </form>
      </main>
    </div>
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
    // Keep trying other account types. A single login form should not expose role lookup details.
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
  return (
    <nav className="sticky top-0 z-40 border-b border-line/50 bg-canvas/90 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between py-4">
        <a href={user ? "/app" : "/"} className="font-display text-2xl font-extrabold">MIROIR</a>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <a href="/app" className="text-muted hover:text-ink">Marketplace</a>
          <a href="/app/stylist" className="text-muted hover:text-ink">Stylist</a>
          {user ? (
            <>
              <a href="/app/profile" className="text-muted hover:text-ink">{user.name}</a>
              <button type="button" onClick={onLogout} className="rounded-full border border-line px-4 py-2">Logout</button>
            </>
          ) : (
            <>
              <a href="/login" className="text-muted hover:text-ink">Login</a>
              <a href="/register" className="dark-button px-4 py-2">Register</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default AuthPage;
