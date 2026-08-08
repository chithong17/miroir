import { createTryOnTask, getTryOnTaskStatus } from "../api/tryonApi.js";
import { useTryOn } from "../contexts/TryOnContext.jsx";

const initialFiles = {
  modelImage: null,
  upperImage: null,
  lowerImage: null,
  dressImage: null,
};

const initialPreviews = {
  modelImage:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  upperImage: "",
  lowerImage: "",
  dressImage:
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80",
};

const POLLING_INTERVAL = 4000;
const INITIAL_POLL_DELAY = 15000;

const statusDots = {
  pending: "bg-secondarySoft",
  processing: "bg-sky-300 animate-pulse",
  completed: "bg-tertiary",
  failed: "bg-red-400",
};

const revokePreviewUrls = (previews) => {
  Object.values(previews).forEach((preview) => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
  });
};

  const { currentTask, startTask: startGlobalTask, clearTask } = useTryOn();
  const [tryOnType, setTryOnType] = useState("dress");
  const [files, setFiles] = useState(initialFiles);
  const [previews, setPreviews] = useState(initialPreviews);
  const [status, setStatus] = useState("pending");
  const [taskId, setTaskId] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => () => revokePreviewUrls(previews), [previews]);

  const validationMessage = useMemo(() => {
    if (!files.modelImage) {
      return "Please upload a full-body model image.";
    }

    if (tryOnType === "dress" && !files.dressImage) {
      return "Please upload a dress image.";
    }

    if (tryOnType === "upper_lower" && !files.upperImage && !files.lowerImage) {
      return "Please upload at least one upper or lower garment image.";
    }

    if (files.dressImage && (files.upperImage || files.lowerImage)) {
      return "Dress mode cannot be combined with upper or lower garment uploads.";
    }

    return "";
  }, [files, tryOnType]);

  useEffect(() => {
    if (tryOnType === "dress" && (files.upperImage || files.lowerImage)) {
      setFiles((previous) => ({
        ...previous,
        upperImage: null,
        lowerImage: null,
      }));
      setPreviews((previous) => ({
        ...previous,
        upperImage: "",
        lowerImage: "",
      }));
    }

    if (tryOnType === "upper_lower" && files.dressImage) {
      setFiles((previous) => ({
        ...previous,
        dressImage: null,
      }));
      setPreviews((previous) => ({
        ...previous,
        dressImage: "",
      }));
    }
  }, [files.dressImage, files.lowerImage, files.upperImage, tryOnType]);

  useEffect(() => {
    if (currentTask) {
      setTaskId(currentTask.id);
      if (currentTask.status === "completed") {
        setStatus("completed");
        setResultUrl(currentTask.resultUrl);
        setErrorMessage("");
      } else if (currentTask.status === "failed") {
        setStatus("failed");
        setErrorMessage(currentTask.errorMessage);
      } else {
        setStatus("processing");
        setErrorMessage("");
      }
    }
  }, [currentTask]);

  const handleFileChange = (fieldName) => (event) => {
    const file = event.target.files?.[0] || null;

    setFiles((previous) => ({
      ...previous,
      [fieldName]: file,
    }));

    setPreviews((previous) => {
      const next = { ...previous };

      if (next[fieldName]?.startsWith("blob:")) {
        URL.revokeObjectURL(next[fieldName]);
      }

      next[fieldName] = file ? URL.createObjectURL(file) : "";
      return next;
    });

    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const formData = new FormData();
    formData.append("tryOnType", tryOnType);
    formData.append("batchSize", "1");

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });

    try {
      setIsSubmitting(true);
      setStatus("pending");
      setResultUrl("");
      setTaskId("");
      setErrorMessage("");

      const response = await createTryOnTask(formData);
      setTaskId(response.taskId);
      setStatus("processing");
      startGlobalTask(response.taskId, null, tryOnType);
    } catch (error) {
      setStatus("failed");
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to upload images or create the try-on task."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentGarmentPreview =
    tryOnType === "dress"
      ? previews.dressImage
      : previews.upperImage || previews.lowerImage;

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="fixed left-0 top-0 z-50 w-full bg-canvas/80 shadow-sm backdrop-blur-xl">
        <div className="section-shell flex items-center justify-between py-4">
          <a href="/" className="font-display text-2xl font-extrabold tracking-tight text-ink">
            MIROIR
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a href="/" className="text-sm font-medium text-muted transition hover:opacity-80">
              Home
            </a>
            <a href="/" className="text-sm font-medium text-muted transition hover:opacity-80">
              Features
            </a>
            <a href="/try-on" className="border-b-2 border-ink pb-1 text-sm font-bold text-ink">
              Try-On
            </a>
          </div>

          <a href="/try-on" className="dark-button">
            Get Started
          </a>
        </div>
      </nav>

      <main className="section-shell w-full flex-grow pb-24 pt-32">
        <header className="mb-12 text-center md:text-left">
          <h1 className="editorial-title text-4xl font-bold md:text-[40px]">
            Virtual Atelier
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Step into the future of fashion. Upload your silhouette and the
            garment, and let our AI seamlessly blend them into reality.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="mt-8 hidden flex-col gap-4 lg:col-span-1 lg:flex">
            {["pending", "processing", "completed"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${statusDots[item]}`} />
                <span
                  className={`text-xs capitalize ${
                    status === item ? "font-semibold text-ink" : "text-muted"
                  }`}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          <section className="lg:col-span-3 flex flex-col gap-6">
            <div className="glass-panel ambient-shadow flex min-h-[400px] flex-col rounded-[1.5rem] p-4 sm:rounded-[2rem] sm:p-6 lg:h-[500px]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-ink">
                  Your Silhouette
                </h2>
                <span className="text-lg text-muted">Person</span>
              </div>
              <p className="mb-6 text-xs text-muted">
                Use a clear full-body image for best results.
              </p>

              <label className="group relative flex flex-grow cursor-pointer overflow-hidden rounded-[1.5rem] border border-line bg-panelSoft">
                <img
                  alt="User silhouette preview"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={previews.modelImage}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-sm">
                    Change
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange("modelImage")}
                />
              </label>
            </div>
          </section>

          <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel ambient-shadow flex min-h-[400px] flex-col rounded-[1.5rem] p-4 sm:rounded-[2rem] sm:p-6 lg:h-[500px]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-ink">The Garment</h2>
                <span className="text-lg text-muted">Style</span>
              </div>

              <div className="mb-6 flex gap-2 rounded-full bg-panelSoft p-1">
                <button
                  type="button"
                  onClick={() => setTryOnType("dress")}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                    tryOnType === "dress"
                      ? "bg-white text-ink shadow-sm"
                      : "text-muted hover:bg-white/60"
                  }`}
                >
                  Dress
                </button>
                <button
                  type="button"
                  onClick={() => setTryOnType("upper_lower")}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                    tryOnType === "upper_lower"
                      ? "bg-white text-ink shadow-sm"
                      : "text-muted hover:bg-white/60"
                  }`}
                >
                  Upper / Lower
                </button>
              </div>

              <p className="mb-6 text-xs text-muted">
                Upload a clean product image with minimal background.
              </p>

              <div className="flex flex-grow flex-col gap-4">
                <label className="group relative flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border border-line bg-white p-4">
                  {currentGarmentPreview ? (
                    <img
                      alt="Garment preview"
                      className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-105"
                      src={currentGarmentPreview}
                    />
                  ) : (
                    <span className="text-sm text-muted">Upload garment</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-sm">
                      Replace
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange(
                      tryOnType === "dress" ? "dressImage" : "upperImage"
                    )}
                  />
                </label>

                {tryOnType === "upper_lower" ? (
                  <label className="group relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border border-line bg-white p-4">
                    {previews.lowerImage ? (
                      <img
                        alt="Lower garment preview"
                        className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-105"
                        src={previews.lowerImage}
                      />
                    ) : (
                      <span className="text-sm text-muted">
                        Optional lower garment
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange("lowerImage")}
                    />
                  </label>
                ) : null}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || status === "processing"}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-mintDeep py-4 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-mint hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>Generate Try-On</span>
                </button>
              </div>

              {taskId ? (
                <div className="mt-4 rounded-[1.5rem] border border-line bg-white/80 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                    Current task
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-ink">
                    {taskId}
                  </p>
                  <p className="mt-2 text-xs capitalize text-muted">
                    Status: <span className="font-semibold text-ink">{status}</span>
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel ambient-shadow relative flex min-h-[400px] flex-col overflow-hidden rounded-[1.5rem] p-4 sm:rounded-[2rem] sm:p-6 lg:h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-white to-tertiarySoft/10 opacity-50" />
              <div
                className={`absolute inset-0 rounded-[2rem] border ${
                  status === "processing" ? "border-tertiarySoft pulse-border" : "border-transparent"
                }`}
              />

              <div className="relative z-10 flex flex-grow flex-col items-center justify-center px-4 text-center">
                {resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Try-on result"
                    className="max-h-full rounded-[1.5rem] object-contain shadow-glass"
                  />
                ) : (
                  <>
                    <div className={`mb-6 text-5xl text-mintDeep ${status === "processing" ? "spin-slow" : ""}`}>
                      ✦
                    </div>
                    <h3 className="text-2xl font-semibold text-ink">
                      {status === "failed"
                        ? "Generation could not complete"
                        : "Artisanal AI at Work"}
                    </h3>
                    <p className="mt-2 text-base text-muted">
                      {errorMessage ||
                        (status === "processing"
                          ? "AI is creating your virtual try-on result. The first status check starts after about 15 seconds."
                          : "Upload your images and start a new try-on render.")}
                    </p>
                    <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-panel">
                      <div
                        className={`h-full rounded-full bg-mintDeep ${
                          status === "processing" ? "w-1/2 animate-pulse" : "w-1/4"
                        }`}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="relative z-10 mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFiles(initialFiles);
                    setPreviews(initialPreviews);
                    setStatus("pending");
                    setTaskId("");
                    setResultUrl("");
                    setErrorMessage("");
                    clearTask();
                  }}
                  className="glass-panel flex-1 py-3 text-sm font-semibold text-ink"
                >
                  Reset
                </button>
                <a
                  href={resultUrl || "#"}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className={`flex flex-1 items-center justify-center rounded-full py-3 text-sm font-semibold ${
                    resultUrl
                      ? "bg-mintDeep text-white hover:bg-mint"
                      : "pointer-events-none bg-mintDeep text-white opacity-30"
                  }`}
                >
                  Download
                </a>
              </div>

              {status === "processing" ? (
                <p className="relative z-10 mt-4 text-center text-xs text-muted">
                  MIROIR waits briefly after task creation, then checks status every few seconds.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full border-t border-line bg-white px-5 py-12 md:px-16">
        <div className="section-shell flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-2xl font-bold text-ink">MIROIR</div>
          <div className="flex gap-6 text-sm text-muted">
            <a href="/">About</a>
            <a href="/">Privacy</a>
            <a href="/">Terms</a>
            <a href="/">AI Ethics</a>
            <a href="/">Contact</a>
          </div>
          <div className="text-xs text-muted">© 2026 MIROIR. The Digital Atelier.</div>
        </div>
      </footer>
    </div>
  );
}

export default TryOnPage;
