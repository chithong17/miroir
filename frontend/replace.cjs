
const fs = require("fs");
const file = "d:/FPTDocuments/Semester_7/EXE101/miroir/frontend/src/pages/TryOnStudioPage.jsx";
let content = fs.readFileSync(file, "utf8");
const lines = content.split("\n");
const start = lines.findIndex(l => l.includes("<section className=\"mt-5 grid gap-4 sm:mt-6 sm:gap-5 xl:grid-cols-3\">"));
const end = lines.findIndex((l, i) => i > start && l.includes("</section>"));

const newLayout = `
        {/* TIER 1: Previews (Fixed Height, No scroll) */}
        <section className="mt-5 flex flex-wrap justify-center gap-4 sm:mt-6 sm:gap-6">
          <div className="flex w-full max-w-[240px] flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mintDeep text-[10px] font-black text-white">1</span>
              <h2 className="text-base font-extrabold text-ink">{t("tryon.originalPhoto")}</h2>
            </div>
            <PreviewFrame image={modelPreview} empty={t("tryon.savedOrUpload")} />
          </div>

          <div className="flex w-full max-w-[240px] flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mintDeep text-[10px] font-black text-white">2</span>
              <h2 className="text-base font-extrabold text-ink">{t("tryon.productOutfit")}</h2>
            </div>
            <GarmentPreview product={product} dressPreview={dressPreview} upperPreview={upperPreview} lowerPreview={lowerPreview} />
          </div>

          <div className="flex w-full max-w-[240px] flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mintDeep text-[10px] font-black text-white">3</span>
              <h2 className="text-base font-extrabold text-ink">{t("tryon.result")}</h2>
            </div>
            <PreviewFrame
              image={resultUrl}
              empty={t("tryon.resultEmpty")}
              isLoading={status === "loading" || status === "processing"}
              loadingText={status === "loading" ? "Creating try-on task..." : "Rendering your preview..."}
            />
          </div>
        </section>

        {/* TIER 2: Controls */}
        <section className="mt-4 grid gap-4 sm:gap-5 xl:grid-cols-3">
          <div className="glass-panel flex flex-col justify-center p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Upload Model</p>
            <input className="miroir-field bg-white/50" type="file" accept="image/*" onChange={onModelFile} />
            <p className="mt-2 text-xs text-muted">
              {user?.profile?.modelImageUrl ? t("tryon.savedOrUpload") : t("tryon.platformRequires")}
            </p>
          </div>

          <div className="glass-panel flex flex-col justify-center p-5">
            {product && !dressFile && !upperFile && !lowerFile ? (
              <div className="mb-3 rounded-xl border border-line bg-white/50 p-3">
                <h3 className="text-sm font-bold text-ink line-clamp-1">{product.name}</h3>
                <p className="text-xs font-bold text-rose">{formatMoney(product.price)}</p>
              </div>
            ) : (
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{t("tryon.uploadGarment")}</p>
            )}
            <div className="flex flex-col gap-2">
              <SelectField value={customTryOnType} onChange={(event) => setCustomTryOnType(event.target.value)}>
                <option value="dress">Dress / one-piece</option>
                <option value="upper_lower">Upper / lower</option>
              </SelectField>
              {customTryOnType === "dress" ? (
                <input className="miroir-field bg-white/50" type="file" accept="image/*" onChange={(event) => setGarmentFile("dress", event.target.files?.[0] || null)} />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="miroir-field bg-white/50" type="file" accept="image/*" onChange={(event) => setGarmentFile("upper", event.target.files?.[0] || null)} />
                  <input className="miroir-field bg-white/50" type="file" accept="image/*" onChange={(event) => setGarmentFile("lower", event.target.files?.[0] || null)} />
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-center p-5">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-muted">Ready?</p>
            <Button className="w-full py-4 text-base shadow-glow transition hover:-translate-y-0.5" disabled={status === "loading" || status === "processing"} onClick={startTryOn}>
              {status === "loading" || status === "processing" ? t("tryon.generating") : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t("tryon.generate")}
                </span>
              )}
            </Button>
            {message ? <p className={\`mt-3 text-center text-sm \${status === "error" ? "text-red-700" : "text-muted"}\`}>{message}</p> : null}
          </div>
        </section>

        {/* TIER 3: Results Action & Feedback (Hidden until completed) */}
        {status === "completed" && resultUrl && product && completedTryOnProductId === product.id ? (
          <section className="mt-4 grid gap-4 sm:gap-5 xl:grid-cols-2">
            <div className="glass-panel border-mintDeep/30 bg-gradient-to-br from-mintDeep/5 to-transparent p-5">
              <p className="text-base font-black text-ink">Ung ý v?i s?n ph?m này?</p>
              <p className="mb-4 mt-1 text-sm text-muted">Ch?n màu s?c và kích thu?c d? d?t mua ngay.</p>
              <ProductPurchaseActions product={product} />
              <a className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-line bg-white py-2.5 text-sm font-bold text-mintDeep transition-colors hover:bg-panel" href={\`/app/products/\${encodeURIComponent(product.id)}\`}>
                Xem chi ti?t s?n ph?m
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </a>
            </div>
            
            <form onSubmit={sendTryOnFeedback} className="glass-panel flex flex-col gap-3 p-5">
              <p className="text-sm font-bold text-ink">{t("product.feedback")}</p>
              <div className="grid grid-cols-2 gap-3">
                <SelectField value={feedbackForm.rating} onChange={updateFeedback("rating")}>
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                </SelectField>
                <SelectField value={feedbackForm.fitFeedback} onChange={updateFeedback("fitFeedback")}>
                  <option value="true_to_size">True to size</option>
                  <option value="runs_small">Runs small</option>
                  <option value="runs_large">Runs large</option>
                  <option value="not_sure">Not sure</option>
                </SelectField>
              </div>
              <TextField as="textarea" rows="2" placeholder="Feedback about this product" value={feedbackForm.comment} onChange={updateFeedback("comment")} />
              <Button type="submit" variant="secondary" className="mt-auto">{t("common.submitFeedback")}</Button>
              {feedbackNotice ? <p className="text-center text-xs text-muted">{feedbackNotice}</p> : null}
            </form>
          </section>
        ) : null}
`;

lines.splice(start, end - start + 1, newLayout.trim());
fs.writeFileSync(file, lines.join("\n"));
console.log("Replaced lines " + start + " to " + end);

