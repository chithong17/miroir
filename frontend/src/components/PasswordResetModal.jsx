import { useEffect, useState } from "react";
import { confirmPasswordReset, requestPasswordReset, verifyPasswordReset } from "../api/userApi.js";

function PasswordResetModal({ accountType, onClose }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const run = async (action) => {
    setWorking(true); setError(""); setMessage("");
    try { await action(); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || "Could not complete this request."); }
    finally { setWorking(false); }
  };

  const requestCode = () => run(async () => {
    if (!email.includes("@")) throw new Error("Enter a valid email address.");
    const response = await requestPasswordReset({ email, accountType });
    setCooldown(response.cooldownSeconds || 60);
    setStep(1);
    setMessage("If an active account exists, a 6-digit code has been sent.");
  });
  const verifyCode = () => run(async () => {
    await verifyPasswordReset({ email, accountType, otp });
    setStep(2); setMessage("Code verified. Set your new password.");
  });
  const updatePassword = () => run(async () => {
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    if (password !== confirmPassword) throw new Error("Passwords do not match.");
    await confirmPasswordReset({ email, accountType, otp, newPassword: password });
    setMessage("Password updated. You can now sign in.");
    window.setTimeout(onClose, 900);
  });

  const title = step === 0 ? "Reset password" : step === 1 ? "Verify your email" : "Set a new password";
  return <div className="fixed inset-0 z-[100] grid place-items-end bg-ink/40 p-4 sm:place-items-center" role="dialog" aria-modal="true">
    <section className="w-full max-w-md rounded-3xl border border-line bg-canvas p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-tertiary">MIROIR</p><h2 className="mt-2 text-2xl font-extrabold text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{accountType === "shop_owner" ? "Shop owner" : "Customer"} account recovery</p></div><button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-2 text-xl text-muted hover:bg-line">×</button></div>
      <div className="mt-5 flex gap-2">{[0, 1, 2].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-mintDeep" : "bg-line"}`} />)}</div>
      <div className="mt-6 grid gap-4">
        {step === 0 ? <label className="grid gap-2 text-sm font-semibold text-ink">Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-mintDeep" /></label> : null}
        {step === 1 ? <><label className="grid gap-2 text-sm font-semibold text-ink">6-digit code<input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className="rounded-xl border border-line bg-white px-4 py-3 tracking-[.38em] outline-none focus:border-mintDeep" /></label><button type="button" disabled={working || cooldown > 0} onClick={requestCode} className="text-left text-sm font-bold text-mintDeep disabled:text-muted">{cooldown ? `Resend available in ${cooldown}s` : "Resend code"}</button></> : null}
        {step === 2 ? <><label className="grid gap-2 text-sm font-semibold text-ink">New password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-mintDeep" /></label><label className="grid gap-2 text-sm font-semibold text-ink">Confirm password<input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" className="rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-mintDeep" /></label></> : null}
        {message ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <button type="button" disabled={working} onClick={step === 0 ? requestCode : step === 1 ? verifyCode : updatePassword} className="rounded-xl bg-mintDeep px-5 py-3 font-bold text-white disabled:opacity-60">{working ? "Please wait..." : step === 0 ? "Send verification code" : step === 1 ? "Verify code" : "Update password"}</button>
      </div>
    </section>
  </div>;
}
export default PasswordResetModal;

