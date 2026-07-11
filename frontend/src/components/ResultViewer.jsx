const statusStyles = {
  pending: "border-line/70 bg-white/80 text-muted",
  processing: "border-tertiarySoft/50 bg-tertiarySoft/15 text-tertiarySoft",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

function ResultViewer({ status, resultUrl, errorMessage, isPolling }) {
  const resolvedStatus = status || "pending";

  return (
    <section className="glass-panel p-6 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-muted">
            Result
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            Virtual try-on preview
          </h2>
        </div>
        <span
          className={`rounded-full border px-4 py-2 text-sm font-medium capitalize ${
            statusStyles[resolvedStatus]
          }`}
        >
          {resolvedStatus}
        </span>
      </div>

      <div className="mt-6 flex min-h-[360px] items-center justify-center overflow-hidden rounded-lg border border-line/60 bg-white/80 p-4">
        {resultUrl ? (
          <img
            src={resultUrl}
            alt="Virtual try-on result"
            className="max-h-[620px] rounded-2xl object-contain"
          />
        ) : (
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full border border-line/60 bg-white/10" />
            <p className="text-lg font-medium text-ink">
              {resolvedStatus === "failed"
                ? "We could not generate the try-on image."
                : "Your AI-generated outfit preview will appear here."}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {errorMessage ||
                "Processing can take a little while. Keep this page open while MIROIR checks the task status for you."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {isPolling
            ? "MIROIR is polling the backend every few seconds for the latest AI task status."
            : "When the task is completed, you can download the final image here."}
        </p>

        {resultUrl ? (
          <a
            href={resultUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="dark-button"
          >
            Download result
          </a>
        ) : null}
      </div>
    </section>
  );
}

export default ResultViewer;
