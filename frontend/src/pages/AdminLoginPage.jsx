import { useState } from "react";
import { loginAdmin, setAdminToken } from "../api/adminApi.js";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#67558c]";

function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const updateField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await loginAdmin(form);
      setAdminToken(response.token);
      window.location.href = "/admin/dashboard";
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Could not authenticate admin.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <form onSubmit={submit} className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <a href="/" className="text-xl font-extrabold text-slate-950">
            MIROIR
          </a>
          <h1 className="mt-8 text-2xl font-bold text-slate-950">Admin login</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage shop accounts, shops, products, and catalogue spreadsheets.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase text-slate-500">Email</span>
              <input className={inputClass} value={form.email} onChange={updateField("email")} />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase text-slate-500">Password</span>
              <input
                className={inputClass}
                type="password"
                value={form.password}
                onChange={updateField("password")}
              />
            </label>

            {status === "error" ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {status === "loading" ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AdminLoginPage;
