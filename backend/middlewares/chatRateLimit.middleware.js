const buckets = new Map();

const identity = (req) =>
  req.user?.id || req.owner?.id || req.ip || "anonymous";

export const chatRateLimit = ({ limit, windowMs, scope }) => (req, res, next) => {
  const now = Date.now();
  const key = `${scope}:${identity(req)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (current.count >= limit) {
    res.set("Retry-After", String(Math.max(Math.ceil((current.resetAt - now) / 1000), 1)));
    return res.status(429).json({
      success: false,
      message: "Too many chat requests. Please try again shortly.",
    });
  }

  current.count += 1;
  return next();
};

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
cleanup.unref();
