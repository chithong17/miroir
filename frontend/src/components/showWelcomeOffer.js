const PENDING_WELCOME_KEY = "miroir_pending_welcome_offer";

export const queueWelcomeOffer = (userId) => {
  sessionStorage.setItem(PENDING_WELCOME_KEY, userId);
};

export const showPendingWelcomeOffer = (userId, isVi) => {
  if (!userId || sessionStorage.getItem(PENDING_WELCOME_KEY) !== userId) return;
  sessionStorage.removeItem(PENDING_WELCOME_KEY);
  return showWelcomeOffer(isVi);
};

// The artwork supplies all visible copy; the native dialog keeps keyboard and
// screen-reader access, with real buttons aligned to the artwork's controls.
export const showWelcomeOffer = (isVi = true) => new Promise((resolve) => {
  const dialog = document.createElement("dialog");
  dialog.className = "m-auto w-full overflow-hidden border-0 bg-transparent p-0 shadow-2xl outline-none backdrop:bg-black/35";
  dialog.style.maxWidth = "min(88vw, 540px, calc((100dvh - 40px) * 1399 / 754))";
  dialog.style.borderRadius = "min(28px, 4.8%)";
  dialog.tabIndex = -1;
  dialog.setAttribute("aria-labelledby", "welcome-offer-title");
  dialog.setAttribute("aria-describedby", "welcome-offer-description");

  const title = document.createElement("h2");
  title.id = "welcome-offer-title";
  title.className = "sr-only";
  title.textContent = isVi ? "Chào mừng bạn đến với MIROIR! Giảm 50%" : "Welcome to MIROIR! Enjoy 50% off";
  const description = document.createElement("p");
  description.id = "welcome-offer-description";
  description.className = "sr-only";
  description.textContent = isVi
    ? "Giảm 50% cho 1 sản phẩm bất kỳ. Áp dụng 1 lần, tự động giảm cho 1 món có giá cao nhất trong đơn. Không bao gồm phí vận chuyển."
    : "Get 50% off any one item. Applied once, automatically to one highest-priced item in your order. Shipping is excluded.";

  // High-resolution banner image with clean transparent rounded corners.
  const frame = document.createElement("div");
  frame.className = "relative w-full overflow-hidden";
  frame.style.aspectRatio = "1399 / 754";
  const artwork = document.createElement("img");
  artwork.src = "/hero/welcome-offer-hd.png";
  artwork.alt = "";
  artwork.width = 1399;
  artwork.height = 754;
  artwork.draggable = false;
  artwork.className = "block h-auto w-full select-none";
  frame.append(artwork);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "absolute left-[94.9%] top-[8.5%] -translate-x-1/2 -translate-y-1/2 aspect-square min-h-11 min-w-11 w-[7%] rounded-full border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174F36]";
  close.setAttribute("aria-label", isVi ? "Đóng thông báo ưu đãi" : "Close welcome offer");
  close.addEventListener("click", () => dialog.close());

  const claim = document.createElement("button");
  claim.type = "button";
  claim.className = "absolute left-[55.4%] top-[81.5%] h-[14%] min-h-11 w-[37.6%] rounded-full border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174F36]";
  claim.setAttribute("aria-label", isVi ? "Nhận ưu đãi" : "Claim welcome offer");
  claim.addEventListener("click", () => dialog.close());

  dialog.addEventListener("close", () => { dialog.remove(); resolve(); }, { once: true });
  dialog.append(title, description, frame, close, claim);
  document.body.append(dialog);
  dialog.showModal();
  // Start focus on the dialog so opening it does not outline the image CTA.
  // Tab still reaches the close and claim buttons with visible keyboard focus.
  dialog.focus({ preventScroll: true });
});
