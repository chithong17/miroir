import { useMemo, useState } from "react";
import {
  getStylistRecommendation,
  submitStylistFeedback,
} from "../api/stylistApi.js";

const initialForm = {
  userId: "demo-user",
  gender: "female",
  occasion: "date",
  skinTone: "warm",
  bodyShape: "triangle",
  stylePreferences: "minimalist, smart casual",
  feedback: "I prefer relaxed fit and comfortable outfits.",
  budgetMin: "0",
  budgetMax: "1500000",
  height: "165",
  weight: "52",
  bust: "84",
  waist: "66",
  hips: "90",
  shoulder: "38",
};

const feedbackTypes = ["liked", "disliked", "tried_on", "purchased", "returned"];

const inputClass =
  "w-full rounded-lg border border-line/70 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-tertiary";

const labelClass = "text-xs font-semibold uppercase tracking-[0.12em] text-muted";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

function StylistPage() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");

  const selectedProductIds = useMemo(() => {
    const items = result?.recommended_outfit?.items || [];
    return items.map((item) => item.product?.id).filter(Boolean);
  }, [result]);

  const updateField = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const buildPayload = () => ({
    userId: form.userId.trim(),
    gender: form.gender,
    occasion: form.occasion.trim(),
    skinTone: form.skinTone.trim(),
    bodyShape: form.bodyShape.trim(),
    stylePreferences: form.stylePreferences
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    feedback: form.feedback.trim(),
    budget: {
      min: toNumber(form.budgetMin) || 0,
      max: toNumber(form.budgetMax),
    },
    measurements: {
      height: toNumber(form.height),
      weight: toNumber(form.weight),
      bust: toNumber(form.bust),
      waist: toNumber(form.waist),
      hips: toNumber(form.hips),
      shoulder: toNumber(form.shoulder),
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setFeedbackStatus("");
    setResult(null);

    try {
      const response = await getStylistRecommendation(buildPayload());
      setResult(response);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(
        error.response?.data?.message ||
          "Could not generate a grounded recommendation."
      );
    }
  };

  const handleFeedback = async (eventType) => {
    if (!selectedProductIds.length) {
      return;
    }

    try {
      setFeedbackStatus("Saving feedback...");
      await submitStylistFeedback({
        userId: form.userId,
        productIds: selectedProductIds,
        outfitId: `stylist-${Date.now()}`,
        eventType,
        reason: form.feedback,
      });
      setFeedbackStatus(`Feedback saved: ${eventType}`);
    } catch (error) {
      setFeedbackStatus(
        error.response?.data?.message || "Could not save feedback."
      );
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="fixed left-0 top-0 z-50 w-full bg-canvas/85 shadow-sm backdrop-blur-xl">
        <div className="section-shell flex items-center justify-between py-4">
          <a href="/" className="font-display text-2xl font-extrabold text-ink">
            MIROIR
          </a>
          <div className="hidden items-center gap-8 md:flex">
            <a href="/" className="text-sm font-medium text-muted">
              Home
            </a>
            <a href="/try-on" className="text-sm font-medium text-muted">
              Try-On
            </a>
            <a href="/stylist" className="border-b-2 border-ink pb-1 text-sm font-bold text-ink">
              Stylist
            </a>
          </div>
          <a href="/try-on" className="dark-button">
            Try On
          </a>
        </div>
      </nav>

      <main className="section-shell grid gap-8 pb-20 pt-28 lg:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="glass-panel p-5">
          <div className="mb-6">
            <h1 className="editorial-title text-3xl font-bold">AI Stylist</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Personal recommendations grounded in catalog, outfit, fashion rule,
              review, and memory context.
            </p>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className={labelClass}>User ID</span>
              <input className={inputClass} value={form.userId} onChange={updateField("userId")} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2">
                <span className={labelClass}>Gender</span>
                <select className={inputClass} value={form.gender} onChange={updateField("gender")}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="unisex">Unisex</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className={labelClass}>Skin Tone</span>
                <input className={inputClass} value={form.skinTone} onChange={updateField("skinTone")} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2">
                <span className={labelClass}>Occasion</span>
                <input className={inputClass} value={form.occasion} onChange={updateField("occasion")} />
              </label>
              <label className="grid gap-2">
                <span className={labelClass}>Body Shape</span>
                <input className={inputClass} value={form.bodyShape} onChange={updateField("bodyShape")} />
              </label>
            </div>

            <label className="grid gap-2">
              <span className={labelClass}>Style Preferences</span>
              <input className={inputClass} value={form.stylePreferences} onChange={updateField("stylePreferences")} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2">
                <span className={labelClass}>Budget Min</span>
                <input className={inputClass} value={form.budgetMin} onChange={updateField("budgetMin")} />
              </label>
              <label className="grid gap-2">
                <span className={labelClass}>Budget Max</span>
                <input className={inputClass} value={form.budgetMax} onChange={updateField("budgetMax")} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {["height", "weight", "bust", "waist", "hips", "shoulder"].map((field) => (
                <label key={field} className="grid gap-2">
                  <span className={labelClass}>{field}</span>
                  <input className={inputClass} value={form[field]} onChange={updateField(field)} />
                </label>
              ))}
            </div>

            <label className="grid gap-2">
              <span className={labelClass}>Feedback</span>
              <textarea
                className={`${inputClass} min-h-24 resize-none`}
                value={form.feedback}
                onChange={updateField("feedback")}
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Generating..." : "Generate Recommendation"}
            </button>
          </div>
        </form>

        <section className="min-h-[680px]">
          <div className="glass-panel h-full p-5">
            {status === "idle" ? (
              <div className="flex h-full items-center justify-center text-center text-muted">
                <p className="max-w-md text-base leading-7">
                  Your grounded stylist result will appear here after MongoDB
                  Vector Search and Gemini generation complete.
                </p>
              </div>
            ) : null}

            {status === "error" ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {message}
              </div>
            ) : null}

            {status === "success" && result ? (
              <div className="space-y-6">
                {result.noMatch ? (
                  <div className="rounded-lg border border-line/70 bg-white p-4">
                    <h2 className="text-xl font-semibold text-ink">No match found</h2>
                    <p className="mt-2 text-sm text-muted">{result.message}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-line/70 bg-white p-4">
                        <p className={labelClass}>Body Shape</p>
                        <p className="mt-2 text-sm text-ink">{result.analysis?.bodyShape || "N/A"}</p>
                      </div>
                      <div className="rounded-lg border border-line/70 bg-white p-4">
                        <p className={labelClass}>Skin Tone</p>
                        <p className="mt-2 text-sm text-ink">{result.analysis?.skinTone || "N/A"}</p>
                      </div>
                      <div className="rounded-lg border border-line/70 bg-white p-4">
                        <p className={labelClass}>Score</p>
                        <p className="mt-2 text-sm text-ink">{result.recommended_outfit?.score || 0}/100</p>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-ink">Recommended Outfit</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                        {result.recommended_outfit?.whyItMatches}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {(result.recommended_outfit?.items || []).map((item) => (
                        <article key={item.product.id} className="rounded-lg border border-line/70 bg-white p-4">
                          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-panelSoft">
                            {item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <h3 className="mt-4 text-lg font-semibold text-ink">{item.product.name}</h3>
                          <p className="mt-1 text-sm text-muted">
                            {item.product.category} · {Number(item.product.price || 0).toLocaleString()} VND
                          </p>
                          {item.product.shop?.name ? (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                              {item.product.shop.name}
                            </p>
                          ) : null}
                          <p className="mt-3 text-sm leading-6 text-muted">{item.reason}</p>
                        </article>
                      ))}
                    </div>

                    {result.alternatives?.length ? (
                      <div>
                        <h2 className="text-xl font-semibold text-ink">Alternatives</h2>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {result.alternatives.map((item) => (
                            <div key={item.product.id} className="rounded-lg border border-line/70 bg-white p-4">
                              <p className="font-semibold text-ink">{item.product.name}</p>
                              {item.product.shop?.name ? (
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                                  {item.product.shop.name}
                                </p>
                              ) : null}
                              <p className="mt-2 text-sm text-muted">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-lg border border-line/70 bg-white p-4">
                        <h2 className="font-semibold text-ink">Fit Warnings</h2>
                        <ul className="mt-3 space-y-2 text-sm text-muted">
                          {(result.fitWarnings || []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                          {!result.fitWarnings?.length ? <li>No major fit warnings.</li> : null}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-line/70 bg-white p-4">
                        <h2 className="font-semibold text-ink">Fashion Tips</h2>
                        <ul className="mt-3 space-y-2 text-sm text-muted">
                          {(result.fashionTips || []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {feedbackTypes.map((eventType) => (
                        <button
                          key={eventType}
                          type="button"
                          onClick={() => handleFeedback(eventType)}
                          className="rounded-lg border border-line/70 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-tertiary"
                        >
                          {eventType.replace("_", " ")}
                        </button>
                      ))}
                      <a href="/try-on" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
                        Try On
                      </a>
                    </div>
                    {feedbackStatus ? <p className="text-sm text-muted">{feedbackStatus}</p> : null}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

export default StylistPage;
