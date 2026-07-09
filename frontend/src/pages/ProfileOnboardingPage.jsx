import { useEffect, useState } from "react";
import {
  getUserMe,
  saveUserProfile,
  setUserToken,
  skipUserProfile,
  uploadUserProfilePhoto,
} from "../api/userApi.js";
import { UnifiedNav } from "./AuthPage.jsx";

const fieldClass = "w-full rounded-lg border border-line/70 bg-white px-3 py-2 text-sm outline-none focus:border-tertiary";
const emptyProfile = {
  gender: "",
  height: "",
  weight: "",
  bust: "",
  waist: "",
  hips: "",
  shoulder: "",
  bodyShape: "",
  skinTone: "",
  stylePreferences: "",
};

function ProfileOnboardingPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    getUserMe()
      .then((response) => setUser(response.user))
      .catch(() => {
        setUserToken("");
        window.location.href = "/login";
      });
  }, []);

  const updateField = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setStatus("loading");
    try {
      await saveUserProfile(form);
      window.location.href = "/app";
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Could not save profile.");
    }
  };

  const skip = async () => {
    await skipUserProfile();
    window.location.href = "/app";
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("loading");
    try {
      await uploadUserProfilePhoto(file);
      const response = await getUserMe();
      setUser(response.user);
      setStatus("idle");
      setMessage("Profile photo saved.");
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Could not upload photo.");
    }
  };

  return (
    <div className="min-h-screen bg-hero">
      <UnifiedNav user={user} onLogout={() => { setUserToken(""); window.location.href = "/"; }} />
      <main className="section-shell py-10">
        <form onSubmit={save} className="glass-panel mx-auto max-w-3xl p-6">
          <h1 className="editorial-title text-3xl font-bold">Complete your fitting profile</h1>
          <p className="mt-2 text-sm text-muted">Measurements help try-on and styling feel more personal. You can skip this now.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Gender"><select className={fieldClass} value={form.gender} onChange={updateField("gender")}><option value="">Any</option><option value="female">Female</option><option value="male">Male</option><option value="unisex">Unisex</option></select></Field>
            <Field label="Body shape"><input className={fieldClass} value={form.bodyShape} onChange={updateField("bodyShape")} /></Field>
            <Field label="Skin tone"><input className={fieldClass} value={form.skinTone} onChange={updateField("skinTone")} /></Field>
            <Field label="Style preferences"><input className={fieldClass} value={form.stylePreferences} onChange={updateField("stylePreferences")} placeholder="minimal, streetwear, elegant" /></Field>
            {["height", "weight", "bust", "waist", "hips", "shoulder"].map((field) => (
              <Field key={field} label={`${field} (cm/kg)`}>
                <input className={fieldClass} value={form[field]} onChange={updateField(field)} />
              </Field>
            ))}
            <Field label="Saved try-on photo">
              <input className={fieldClass} type="file" accept="image/*" onChange={uploadPhoto} />
            </Field>
          </div>

          {message ? <p className={`mt-4 text-sm ${status === "error" ? "text-red-700" : "text-emerald-700"}`}>{message}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="dark-button rounded-lg" disabled={status === "loading"} type="submit">Save profile</button>
            <button type="button" onClick={skip} className="soft-button rounded-lg">Skip for now</button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="grid gap-2"><span className="text-xs font-semibold uppercase text-muted">{label}</span>{children}</label>;
}

export default ProfileOnboardingPage;
