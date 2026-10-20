export const normalizePlan = (code) => ["SHOP_OWNER_MONTHLY", "PRO_INSIGHT"].includes(code) ? "GROWTH" : code;

export function subscriptionState(owner, now = Date.now()) {
  const sub = owner?.subscription;
  if (!sub?.planCode || sub.planCode === "FREE") return "free";
  if (sub.suspendedAt) return "suspended";
  const expiry = new Date(sub.expiresAt).getTime();
  if (!Number.isFinite(expiry) || expiry <= now) return "expired";
  if (sub.status !== "active") return "inactive";
  return expiry - now <= 7 * 86400000 ? "expiring" : "active";
}

export const hasCurrentPlan = (owner, now) => ["active", "expiring"].includes(subscriptionState(owner, now));
export const dateLabel = (value) => value && Number.isFinite(new Date(value).getTime())
  ? new Date(value).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
export const moneyLabel = (value) => Number(value || 0).toLocaleString("vi-VN") + " ₫";
export const stateLabels = { free: "Chưa đăng ký", active: "Còn hiệu lực", expiring: "Sắp hết hạn", expired: "Đã hết hạn", suspended: "Tạm ngừng", inactive: "Không hoạt động" };
