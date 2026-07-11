import { useEffect, useState } from "react";
import { getUserMe, saveUserProfile, setUserToken, skipUserProfile, uploadUserProfilePhoto } from "../api/userApi.js";
import { AppShell, Button, PageHeader, SelectField, TextField, TopNav } from "../components/ui/index.jsx";
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
        <form onSubmit={save} className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="glass-panel flex flex-col p-4 sm:p-6">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-[2rem] border border-line bg-white/80 shadow-inner">
              {user?.profile?.modelImageUrl ? (
                <img src={user.profile.modelImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-sm font-medium text-muted/60">{t("onboarding.uploadPhoto")}</div>
              )}
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted">{t("onboarding.savedPhoto")}</span>
              <input className="miroir-field" type="file" accept="image/*" onChange={uploadPhoto} />
            </label>
          </aside>
          <section className="glass-panel flex flex-col p-4 sm:p-6 md:p-8">
            <header className="mb-6 sm:mb-8">
              <h2 className="editorial-title text-2xl font-extrabold text-ink sm:text-3xl">{t("onboarding.fitData")}</h2>
              <p className="mt-2 text-sm text-muted sm:text-base">{t("onboarding.description")}</p>
            </header>

            <div className="mb-6 grid gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-5">
              <SelectField label={t("profile.gender")} value={form.gender || ""} onChange={updateField("gender")}>
                <option value="" disabled>{t("profile.gender")}</option>
                <option value="female">{t("common.female")}</option>
                <option value="male">{t("common.male")}</option>
                <option value="unisex">{t("common.unisex")}</option>
              </SelectField>

              <SelectField label={t("profile.bodyShape")} value={form.bodyShape || ""} onChange={updateField("bodyShape")}>
                <option value="" disabled>{t("profile.bodyShape")}</option>
                <option value="hourglass">{t("profile.shape.hourglass")}</option>
                <option value="pear">{t("profile.shape.pear")}</option>
                <option value="apple">{t("profile.shape.apple")}</option>
                <option value="rectangle">{t("profile.shape.rectangle")}</option>
                <option value="inverted_triangle">{t("profile.shape.invertedTriangle")}</option>
              </SelectField>

              <SelectField label={t("profile.skinTone")} value={form.skinTone || ""} onChange={updateField("skinTone")}>
                <option value="" disabled>{t("profile.skinTone")}</option>
                <option value="light">{t("profile.skin.light")}</option>
                <option value="medium">{t("profile.skin.medium")}</option>
                <option value="dark">{t("profile.skin.dark")}</option>
              </SelectField>

              <SelectField label={t("profile.stylePreferences")} value={form.stylePreferences || ""} onChange={updateField("stylePreferences")}>
                <option value="" disabled>{t("profile.stylePreferences")}</option>
                <option value="minimal">{t("profile.style.minimal")}</option>
                <option value="streetwear">{t("profile.style.streetwear")}</option>
                <option value="elegant">{t("profile.style.elegant")}</option>
                <option value="vintage">{t("profile.style.vintage")}</option>
                <option value="casual">{t("profile.style.casual")}</option>
              </SelectField>
            </div>

            <MeasurementInputs form={form} t={t} updateField={updateField} />
            <MeasurementShape form={form} t={t} updateField={updateField} />

            {message ? <p className={`mt-4 text-sm ${status === "error" ? "text-red-700" : "text-emerald-700"}`}>{message}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
              <Button disabled={status === "loading"} type="submit" className="w-full sm:w-auto">{t("common.saveProfile")}</Button>
              <Button type="button" variant="secondary" onClick={skip} className="w-full sm:w-auto">{t("common.skipForNow")}</Button>
            </div>
          </section>
        </form>
      </main>
    </AppShell>
  );
}

function MeasurementInputs({ form, t, updateField }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:hidden">
      <TextField type="number" label={t("profile.height")} placeholder="cm" value={form.height || ""} onChange={updateField("height")} />
      <TextField type="number" label={t("profile.weight")} placeholder="kg" value={form.weight || ""} onChange={updateField("weight")} />
      <TextField type="number" label={t("profile.shoulder")} placeholder="cm" value={form.shoulder || ""} onChange={updateField("shoulder")} />
      <TextField type="number" label={t("profile.bust")} placeholder="cm" value={form.bust || ""} onChange={updateField("bust")} />
      <TextField type="number" label={t("profile.waist")} placeholder="cm" value={form.waist || ""} onChange={updateField("waist")} />
      <TextField type="number" label={t("profile.hips")} placeholder="cm" value={form.hips || ""} onChange={updateField("hips")} />
    </div>
  );
}

function MeasurementShape({ form, t, updateField }) {
  return (
    <div className="relative hidden w-full items-center justify-center overflow-hidden rounded-[2rem] border border-white/5 bg-panel px-4 py-12 shadow-inner md:flex md:min-h-[550px] md:px-8">
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
        <svg viewBox="0 0 100 250" className="h-[90%] max-h-[500px] text-ink drop-shadow-2xl" fill="currentColor">
          <path d="M50 10 C42 10 37 16 37 25 C37 34 42 40 46 41 L46 46 C32 48 24 55 22 65 L18 135 A 4 4 0 0 0 26 135 L30 75 L32 120 C32 135 28 145 28 160 L28 235 A 4 4 0 0 0 36 235 L42 150 L50 145 L58 150 L64 235 A 4 4 0 0 0 72 235 L72 160 C72 145 68 135 68 120 L70 75 L74 135 A 4 4 0 0 0 82 135 L78 65 C76 55 68 48 54 46 L54 41 C58 40 63 34 63 25 C63 16 58 10 50 10 Z" />
        </svg>
      </div>

      <div className="absolute inset-0 mx-auto max-w-2xl pointer-events-none">
        <div className="absolute top-[8%] left-[5%] md:left-[10%] w-[120px] md:w-[140px] pointer-events-auto">
          <TextField type="number" label={t("profile.height")} placeholder="cm" value={form.height || ""} onChange={updateField("height")} className="!bg-canvas/80 backdrop-blur-md" />
        </div>
        <div className="absolute top-[8%] right-[5%] md:right-[10%] w-[120px] md:w-[140px] pointer-events-auto">
          <TextField type="number" label={t("profile.weight")} placeholder="kg" value={form.weight || ""} onChange={updateField("weight")} className="!bg-canvas/80 backdrop-blur-md" />
        </div>
        <div className="absolute top-[18%] right-[5%] md:right-[15%] w-[120px] md:w-[140px] pointer-events-auto">
          <div className="relative">
            <div className="hidden md:block absolute right-full top-1/2 w-12 h-px bg-rose/30 -translate-y-1/2 mr-2" />
            <TextField type="number" label={t("profile.shoulder")} placeholder="cm" value={form.shoulder || ""} onChange={updateField("shoulder")} className="!bg-canvas/80 backdrop-blur-md" />
          </div>
        </div>
        <div className="absolute top-[30%] left-[5%] md:left-[15%] w-[120px] md:w-[140px] pointer-events-auto">
          <div className="relative">
            <div className="hidden md:block absolute left-full top-1/2 w-12 h-px bg-rose/30 -translate-y-1/2 ml-2" />
            <TextField type="number" label={t("profile.bust")} placeholder="cm" value={form.bust || ""} onChange={updateField("bust")} className="!bg-canvas/80 backdrop-blur-md" />
          </div>
        </div>
        <div className="absolute top-[44%] right-[5%] md:right-[15%] w-[120px] md:w-[140px] pointer-events-auto">
          <div className="relative">
            <div className="hidden md:block absolute right-full top-1/2 w-12 h-px bg-rose/30 -translate-y-1/2 mr-2" />
            <TextField type="number" label={t("profile.waist")} placeholder="cm" value={form.waist || ""} onChange={updateField("waist")} className="!bg-canvas/80 backdrop-blur-md" />
          </div>
        </div>
        <div className="absolute top-[56%] left-[5%] md:left-[15%] w-[120px] md:w-[140px] pointer-events-auto">
          <div className="relative">
            <div className="hidden md:block absolute left-full top-1/2 w-12 h-px bg-rose/30 -translate-y-1/2 ml-2" />
            <TextField type="number" label={t("profile.hips")} placeholder="cm" value={form.hips || ""} onChange={updateField("hips")} className="!bg-canvas/80 backdrop-blur-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileOnboardingPage;
