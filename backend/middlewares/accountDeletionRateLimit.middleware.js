const attempts = new Map();
const windowMs = 15 * 60 * 1000;
export const accountDeletionRateLimit = (req, res, next) => {
  const now = Date.now();
  for (const [key, bucket] of attempts) if (bucket.resetAt <= now) attempts.delete(key);
  const key = req.ip || "anonymous";
  const bucket = attempts.get(key) || { count: 0, resetAt: now + windowMs };
  if (bucket.count >= 10 || (!attempts.has(key) && attempts.size >= 10000)) {
    res.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    return res.status(429).json({ success: false, message: "Too many verification attempts. Please try again later." });
  }
  bucket.count += 1;
  attempts.set(key, bucket);
  next();
};
