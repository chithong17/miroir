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
  dialog.className = "m-auto w-full overflow-hidden border-0 bg-[#FDFBF5] p-0 shadow-xl outline-none backdrop:bg-black/35";
  dialog.style.maxWidth = "min(88vw, 480px, calc((100dvh - 40px) * 1334 / 784))";
  dialog.style.borderRadius = "5% / 8.5%";
  dialog.tabIndex = -1;
  dialog.setAttribute("aria-labelledby", "welcome-offer-title");
  dialog.setAttribute("aria-describedby", "welcome-offer-description");

  const title = document.createElement("h2");
  title.id = "welcome-offer-title";
  title.className = "sr-only";
  title.textContent = isVi ? "Chào mừng bạn đến với MIROIR! Giảm 40%" : "Welcome to MIROIR! Enjoy 40% off";
  const description = document.createElement("p");
  description.id = "welcome-offer-description";
  description.className = "sr-only";
  description.textContent = isVi
    ? "Giảm 40% cho 1 sản phẩm bất kỳ. Áp dụng 1 lần, tự động giảm cho 1 món có giá cao nhất trong đơn. Không bao gồm phí vận chuyển."
    : "Get 40% off any one item. Applied once, automatically to one highest-priced item in your order. Shipping is excluded.";

  // Crop the supplied canvas in CSS, preserving the original high-resolution file.
  const frame = document.createElement("div");
  frame.className = "relative w-full overflow-hidden";
  frame.style.aspectRatio = "1334 / 784";
  const artwork = document.createElement("img");
  artwork.src = "/hero/welcome-offer-hd.png";
  artwork.alt = "";
  artwork.width = 1536;
  artwork.height = 1024;
  artwork.draggable = false;
  artwork.className = "absolute block h-auto max-w-none select-none";
  artwork.style.width = `${1536 / 1334 * 100}%`;
  artwork.style.left = `${-103 / 1334 * 100}%`;
  artwork.style.top = `${-134 / 784 * 100}%`;
  frame.append(artwork);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "absolute right-[1.5%] top-[1%] aspect-square min-h-11 min-w-11 w-[8%] rounded-full border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#174F36]";
  close.setAttribute("aria-label", isVi ? "Đóng thông báo ưu đãi" : "Close welcome offer");
  close.addEventListener("click", () => dialog.close());

  const claim = document.createElement("button");
  claim.type = "button";
  claim.className = "absolute left-[54.5%] top-[89.3%] h-[13%] min-h-11 w-[38.5%] -translate-y-1/2 rounded-full border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174F36]";
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
