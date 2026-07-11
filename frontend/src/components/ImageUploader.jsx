function ImageUploader({
  label,
  hint,
  file,
  previewUrl,
  onChange,
  required = false,
}) {
  return (
    <label className="input-card block cursor-pointer">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            {label} {required ? <span className="text-tertiary">*</span> : null}
          </p>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </div>
        <span className="rounded-full border border-line/70 bg-white/80 px-3 py-1 text-xs text-muted">
          Image
        </span>
      </div>

      <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line/80 bg-white/80">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="px-6 text-center text-sm text-muted">
            Click to upload JPG, PNG, or WEBP up to 10MB
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{file?.name || "No file selected yet"}</span>
        <span className="font-semibold text-tertiarySoft">Choose file</span>
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </label>
  );
}

export default ImageUploader;
