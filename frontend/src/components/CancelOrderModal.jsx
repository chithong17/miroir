import { useEffect, useState } from "react";
import { cancelMyOrder } from "../api/commerceApi.js";
import { formatMoney } from "./ui/index.jsx";

const PRESET_REASONS = [
  { id: "address", label: "Tôi muốn thay đổi địa chỉ nhận hàng" },
  { id: "product_variation", label: "Tôi muốn đổi kích cỡ, màu sắc hoặc sản phẩm" },
  { id: "payment_promo", label: "Tôi muốn đổi hình thức thanh toán / voucher" },
  { id: "better_price", label: "Tìm thấy giá tốt hơn hoặc đã mua ở nơi khác" },
  { id: "change_mind", label: "Thời gian giao không phù hợp / Không còn nhu cầu" },
  { id: "other", label: "Lý do khác" },
];

const displayedCode = (value = "") =>
  value.length === 22
    ? `${value.slice(0, 3)} ${value.slice(3, 9)} ${value.slice(9, 18)} ${value.slice(18)}`
    : value;

export default function CancelOrderModal({
  isOpen,
  order,
  onClose,
  onSuccess,
}) {
  const [selectedReasonId, setSelectedReasonId] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset form when modal opens with a new order
  useEffect(() => {
    if (isOpen) {
      setSelectedReasonId("");
      setCustomReason("");
      setErrorMessage("");
      setSubmitting(false);
    }
  }, [isOpen, order?.id]);

  // ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !order) return null;

  const isPendingConfirmation = order.orderStatus === "pending_confirmation";
  const isPaidOrTransfer =
    order.paymentStatus === "paid" ||
    order.paymentMethod === "bank_transfer";

  const handleConfirm = async () => {
    if (!selectedReasonId) {
      setErrorMessage("Vui lòng chọn một lý do hủy.");
      return;
    }

    let finalReason = "";
    if (selectedReasonId === "other") {
      const trimmed = customReason.trim();
      if (!trimmed) {
        setErrorMessage("Vui lòng nhập chi tiết lý do của bạn.");
        return;
      }
      finalReason = trimmed;
    } else {
      const match = PRESET_REASONS.find((r) => r.id === selectedReasonId);
      finalReason = match?.label || "Khách hàng hủy đơn";
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await cancelMyOrder(order.id, finalReason);
      onSuccess?.();
      onClose();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Không thể thực hiện hủy đơn lúc này. Vui lòng thử lại sau.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-[#141A13]/60 backdrop-blur-sm transition-opacity"
      onClick={() => {
        if (!submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
    >
      <div
        className="relative w-full max-w-md rounded-[22px] border border-white/80 bg-white shadow-[0_20px_50px_rgba(20,35,18,0.22)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="flex items-start justify-between border-b border-[#EEF3EC] px-5 pt-4 pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF5EA] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#426E36]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#507A42]" />
              MIROIR · {isPendingConfirmation ? "HỦY ĐƠN" : "YÊU CẦU HỦY"}
            </span>
            <h2
              id="cancel-order-title"
              className="mt-1 text-lg font-black text-[#171E15] sm:text-xl"
            >
              {isPendingConfirmation
                ? "Xác nhận hủy đơn hàng"
                : "Gửi yêu cầu hủy đơn hàng"}
            </h2>
            <p className="text-[11px] text-[#6F7B6B]">
              {isPendingConfirmation
                ? "Đơn chưa xác nhận sẽ được hủy ngay lập tức và hoàn trả kho."
                : "Đơn đang chuẩn bị. Yêu cầu hủy sẽ được gửi đến shop xem xét."}
            </p>
          </div>

          <button
            type="button"
            aria-label="Đóng popup"
            disabled={submitting}
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#DDE6DA] text-[#697965] transition hover:bg-[#F3F8EF] hover:text-[#253023] disabled:opacity-40"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 py-3 space-y-2">
          {/* Order Snapshot Mini-card (1-line compact) */}
          <div className="flex items-center justify-between rounded-xl bg-[#F6F9F3] border border-[#E3ECE0] px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#798575]">
                Mã đơn:
              </span>
              <span className="font-mono font-black text-[#1E281C]">
                {displayedCode(order.orderCode)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#798575]">
                {order.items?.length || 1} sản phẩm
              </span>
              <span>·</span>
              <span className="font-black text-[#426E36]">
                {formatMoney(order.total)}
              </span>
            </div>
          </div>

          {/* Reason Selection Header */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#546250]">
              Chọn lý do hủy <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-[#7A8676]">Chọn 1 mục bên dưới</span>
          </div>

          {/* Reasons List - 1 single line per item */}
          <div className="space-y-1.5">
            {PRESET_REASONS.map((reason) => {
              const isSelected = selectedReasonId === reason.id;
              return (
                <div
                  key={reason.id}
                  onClick={() => {
                    if (!submitting) {
                      setSelectedReasonId(reason.id);
                      if (errorMessage) setErrorMessage("");
                    }
                  }}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition-all border ${
                    isSelected
                      ? "border-[#426E36] bg-[#F3F8EF] shadow-xs"
                      : "border-[#E5ECE2] bg-white hover:border-[#CCDCC8] hover:bg-[#FAFBF9]"
                  }`}
                >
                  <span
                    className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border transition ${
                      isSelected
                        ? "border-[#426E36] bg-white"
                        : "border-[#CBD7C7] bg-white"
                    }`}
                  >
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#426E36]" />
                    )}
                  </span>
                  <p
                    className={`text-xs sm:text-[13px] leading-tight select-none truncate ${
                      isSelected
                        ? "font-bold text-[#1B291A]"
                        : "font-medium text-[#2D392B]"
                    }`}
                  >
                    {reason.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Manual Input (only when "other" is selected) */}
          {selectedReasonId === "other" && (
            <div className="rounded-xl border border-[#DCE7DA] bg-[#F9FBF8] p-2.5 transition-all">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="custom-cancel-reason"
                  className="text-[11px] font-bold text-[#2C382A]"
                >
                  Nhập lý do cụ thể <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-[#7E8B7A]">
                  {customReason.length}/200
                </span>
              </div>
              <textarea
                id="custom-cancel-reason"
                value={customReason}
                maxLength={200}
                disabled={submitting}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="Vui lòng nhập lý do của bạn..."
                rows={2}
                className="w-full resize-none rounded-lg border border-[#D4E0D1] bg-white p-2 text-xs text-[#1B2419] placeholder:text-gray-400 focus:border-[#426E36] focus:outline-none focus:ring-1 focus:ring-[#426E36]/20 transition"
              />
            </div>
          )}

          {/* Paid / Bank Transfer notice (1 line) */}
          {isPaidOrTransfer && (
            <p className="flex items-center gap-1.5 rounded-lg bg-[#F0F6EC] border border-[#DEEADE] px-2.5 py-1 text-[11px] text-[#395034]">
              <span className="shrink-0">💳</span>
              <span>Đơn đã thanh toán sẽ tự động chuyển sang <strong>Chờ hoàn tiền</strong> sau khi hủy.</span>
            </p>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700 flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions - Compact */}
        <div className="flex items-center gap-2.5 border-t border-[#EEF3EC] bg-white px-5 py-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#D6E2D3] bg-white py-2 text-xs sm:text-sm font-bold text-[#426E36] transition hover:bg-[#F3F8EF] disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            disabled={
              submitting ||
              !selectedReasonId ||
              (selectedReasonId === "other" && !customReason.trim())
            }
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-[#507A42] py-2 text-xs sm:text-sm font-bold text-white shadow-[0_6px_16px_rgba(79,115,60,0.22)] transition hover:bg-[#426E36] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang xử lý...</span>
              </>
            ) : isPendingConfirmation ? (
              "Xác nhận hủy đơn"
            ) : (
              "Gửi yêu cầu hủy"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
