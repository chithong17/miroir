const PENDING_WELCOME_KEY = "miroir_pending_welcome_offer";

export const queueWelcomeOffer = (userId) => {
  sessionStorage.setItem(PENDING_WELCOME_KEY, userId);
};

export const showPendingWelcomeOffer = (userId, isVi) => {
  if (!userId || sessionStorage.getItem(PENDING_WELCOME_KEY) !== userId) return;
  sessionStorage.removeItem(PENDING_WELCOME_KEY);
  return showWelcomeOffer(isVi);
};

// Native modal dialog supplies focus trapping, Escape handling and focus restoration.
export const showWelcomeOffer = (isVi = true) => new Promise((resolve) => {
  const dialog = document.createElement("dialog");
  dialog.className = "m-auto w-[min(92vw,440px)] rounded-3xl border border-line bg-canvas p-8 text-center text-ink shadow-xl backdrop:bg-black/40";
  dialog.setAttribute("aria-labelledby", "welcome-offer-title");
  dialog.setAttribute("aria-describedby", "welcome-offer-description");
  const badge = document.createElement("p");
  badge.className = "text-6xl font-black text-green-700";
  badge.textContent = "−40%";
  const title = document.createElement("h2");
  title.id = "welcome-offer-title";
  title.className = "mt-4 text-2xl font-bold";
  title.textContent = isVi ? "Đặc quyền dành riêng cho bạn!" : "Your welcome gift is here!";
  const description = document.createElement("p");
  description.id = "welcome-offer-description";
  description.className = "mt-4 text-sm leading-6";
  description.textContent = isVi
    ? "Chào mừng bạn đến với MIROIR! Bạn được giảm 40% cho 1 sản phẩm bất kỳ. Ưu đãi dùng một lần, tự động áp dụng cho 1 món có giá cao nhất khi đặt hàng, không bao gồm phí vận chuyển."
    : "Welcome to MIROIR! Enjoy 40% off any one item. This one-time gift is automatically applied to one highest-priced item when you place an order. Shipping is excluded.";
  const button = document.createElement("button");
  button.className = "dark-button mt-6 min-h-12 w-full";
  button.textContent = isVi ? "Tuyệt vời, tiếp tục" : "Lovely, let's continue";
  button.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { dialog.remove(); resolve(); }, { once: true });
  dialog.append(badge, title, description, button);
  document.body.append(dialog);
  dialog.showModal();
});
