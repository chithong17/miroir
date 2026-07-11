import { useEffect, useState } from "react";
import { getUserMe, saveUserProfile, setUserToken, skipUserProfile, uploadUserProfilePhoto } from "../api/userApi.js";
import { AppShell, Button, PageHeader, TextField, TopNav } from "../components/ui/index.jsx";
import { useLanguage } from "../i18n.jsx";

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
  const { t } = useLanguage();
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
      setMessage(error.response?.data?.message || t("onboarding.saveError"));
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
      setMessage(t("onboarding.photoSaved"));
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || t("onboarding.photoError"));
    }
  };

  return (
    <AppShell nav={<TopNav user={user} onLogout={() => { setUserToken(""); window.location.href = "/"; }} />}>
      <main className="section-shell py-10">
        <PageHeader
          eyebrow={t("onboarding.eyebrow")}
          title={t("onboarding.title")}
          description={t("onboarding.description")}
        />
        <form onSubmit={save} className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="glass-panel p-5">
            <div className="aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-white/5">
              {user?.profile?.modelImageUrl ? (
                <img src={user.profile.modelImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">{t("onboarding.uploadPhoto")}</div>
              )}
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted">{t("onboarding.savedPhoto")}</span>
              <input className="miroir-field" type="file" accept="image/*" onChange={uploadPhoto} />
            </label>
          </aside>
          <section className="glass-panel p-5">
            <h2 className="text-2xl font-extrabold">{t("onboarding.fitData")}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextField label={t("common.gender")} value={form.gender} onChange={updateField("gender")} placeholder={t("onboarding.genderPlaceholder")} />
              <TextField label={t("profile.bodyShape")} value={form.bodyShape} onChange={updateField("bodyShape")} />
              <TextField label={t("profile.skinTone")} value={form.skinTone} onChange={updateField("skinTone")} />
              <TextField label={t("profile.stylePreferences")} value={form.stylePreferences} onChange={updateField("stylePreferences")} placeholder={t("onboarding.stylePlaceholder")} />
              {[
                ["height", t("profile.height")],
                ["weight", t("profile.weight")],
                ["bust", t("profile.bust")],
                ["waist", t("profile.waist")],
                ["hips", t("profile.hips")],
                ["shoulder", t("profile.shoulder")],
              ].map(([field, label]) => (
                <TextField key={field} label={`${label} (cm/kg)`} value={form[field]} onChange={updateField(field)} />
              ))}
            </div>
            {message ? <p className={`mt-4 text-sm ${status === "error" ? "text-red-100" : "text-emerald-100"}`}>{message}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button disabled={status === "loading"} type="submit">{t("common.saveProfile")}</Button>
              <Button type="button" variant="secondary" onClick={skip}>{t("common.skipForNow")}</Button>
            </div>
          </section>
        </form>
      </main>
    </AppShell>
  );
}

export default ProfileOnboardingPage;
