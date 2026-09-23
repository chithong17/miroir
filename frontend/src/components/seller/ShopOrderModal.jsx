import { useState } from "react";
import {
  Sparkles,
  User,
  Shirt,
  Package,
  Clock,
  CheckCircle,
  Truck,
  CheckCheck,
  Check,
  Copy,
  MessageSquare,
  X,
  ArrowRight,
  Loader2,
  MapPin,
  Phone,
  CreditCard,
  Banknote,
  Building2,
  AlertTriangle,
  Ban,
  ShieldCheck,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import {
  updateShopOrderStatus,
  updateShopOrderPayment,
  decideShopCancellation,
} from "../../api/commerceApi.js";
import { beginShopOrderChat } from "../../api/chatApi.js";

export const commerceOrderLabels = {
  pending_confirmation: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancel_requested: "Yêu cầu hủy",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

export const SELLER_CANCEL_REASONS = [
  { id: "out_of_stock", label: "Hết hàng trong kho / không đủ số lượng để giao" },
  { id: "cannot_contact", label: "Không thể liên hệ với khách hàng để xác nhận" },
  { id: "invalid_address", label: "Địa chỉ nhận hàng không hợp lệ hoặc ngoài vùng giao" },
  { id: "customer_requested", label: "Khách hàng yêu cầu hủy qua kênh trao đổi riêng" },
  { id: "other", label: "Lý do khác (nhập thủ công)" },
];

export const commercePaymentLabels = {
  cod_pending: "Tiền mặt – chưa thu",
  awaiting_transfer: "Chờ chuyển khoản",
  pending_verification: "Chờ đối soát",
  paid: "Đã thanh toán",
  refund_pending: "Chờ hoàn tiền",
  refunded: "Đã hoàn tiền",
};

export const commerceCode = (value = "") => {
  const code = String(value || "");
  return code.length === 22
    ? `${code.slice(0, 3)} ${code.slice(3, 9)} ${code.slice(9, 18)} ${code.slice(18)}`
    : code;
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString()} VND`;

const ORDER_PROGRESS_STEPS = [
  {
    key: "pending_confirmation",
    number: 1,
    title: "Chờ xác nhận",
    shortDesc: "Đơn tiếp nhận",
    icon: Clock,
  },
  {
    key: "confirmed",
    number: 2,
    title: "Đã xác nhận",
    shortDesc: "Duyệt đơn",
    icon: CheckCircle,
  },
  {
    key: "preparing",
    number: 3,
    title: "Đang chuẩn bị",
    shortDesc: "Đóng gói hàng",
    icon: Package,
  },
  {
    key: "shipping",
    number: 4,
    title: "Đang giao",
    shortDesc: "Bàn giao vận chuyển",
    icon: Truck,
  },
  {
    key: "delivered",
    number: 5,
    title: "Đã giao hàng",
    shortDesc: "Giao thành công",
    icon: CheckCheck,
  },
];

const NEXT_STEP_META = {
  confirmed: {
    actionLabel: "Xác nhận đơn hàng",
    stepName: "Đã xác nhận",
    stepNum: 2,
    hint: "Duyệt đơn để bắt đầu chuẩn bị hàng cho khách",
    btnColor: "from-[#577634] via-[#65883C] to-[#49652B]",
  },
  preparing: {
    actionLabel: "Tiến hành chuẩn bị hàng",
    stepName: "Đang chuẩn bị",
    stepNum: 3,
    hint: "Lấy hàng và đóng gói sản phẩm cẩn thận",
    btnColor: "from-[#577634] via-[#65883C] to-[#49652B]",
  },
  shipping: {
    actionLabel: "Bắt đầu giao hàng",
    stepName: "Đang giao",
    stepNum: 4,
    hint: "Bàn giao kiện hàng cho đơn vị vận chuyển",
    btnColor: "from-[#35728F] via-[#4082A2] to-[#2B5E77]",
  },
  delivered: {
    actionLabel: "Xác nhận đã giao thành công",
    stepName: "Đã giao hàng",
    stepNum: 5,
    hint: "Khách đã nhận kiện hàng, hoàn thành đơn hàng",
    btnColor: "from-[#2A7649] via-[#338A56] to-[#20603A]",
  },
};

export default function ShopOrderModal({ onChanged, onClose, order }) {
  const [notice, setNotice] = useState("");
  const [refundProof, setRefundProof] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonId, setCancelReasonId] = useState("");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const recipient = order?.recipient || {};
  const orderItems = Array.isArray(order?.items) ? order.items.filter(Boolean) : [];
  const statusHistory = Array.isArray(order?.statusHistory) ? order.statusHistory : [];

  const copyText = (text, setFn) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 1600);
  };

  const actStatus = async (status) => {
    if (busy) return;
    const reason = status === "cancelled" ? window.prompt("Lý do hủy đơn (bắt buộc):") : "";
    if (status === "cancelled" && !reason) return;
    setBusy(true);
    setNotice("");
    try {
      await updateShopOrderStatus(order.id, status, reason);
      await onChanged();
    } catch (e) {
      setNotice(e.response?.data?.message || "Không cập nhật được trạng thái.");
    } finally {
      setBusy(false);
    }
  };

  const actPayment = async (action) => {
    if (busy) return;
    const reason = ["reject_transfer", "mark_refunded"].includes(action)
      ? window.prompt(action === "reject_transfer" ? "Lý do từ chối:" : "Ghi chú hoàn tiền:")
      : "";
    setBusy(true);
    setNotice("");
    try {
      await updateShopOrderPayment(
        order.id,
        action,
        reason,
        action === "mark_refunded" ? refundProof : null
      );
      await onChanged();
    } catch (e) {
      setNotice(e.response?.data?.message || "Không cập nhật được thanh toán.");
    } finally {
      setBusy(false);
    }
  };

  const activeStepIndex = ORDER_PROGRESS_STEPS.findIndex((s) => s.key === order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled";
  const isCancelRequested = order.orderStatus === "cancel_requested";
  const isDelivered = order.orderStatus === "delivered";

  const nextTargetKey = {
    pending_confirmation: "confirmed",
    confirmed: "preparing",
    preparing: "shipping",
    shipping: "delivered",
  }[order.orderStatus];

  const nextStepInfo = nextTargetKey ? NEXT_STEP_META[nextTargetKey] : null;

  let progressPercent = 0;
  if (activeStepIndex >= 0) {
    progressPercent = (activeStepIndex / (ORDER_PROGRESS_STEPS.length - 1)) * 100;
  } else if (isCancelled) {
    const prev = order.previousStatusBeforeCancelRequest;
    const prevIdx = ORDER_PROGRESS_STEPS.findIndex((s) => s.key === prev);
    progressPercent = prevIdx >= 0 ? (prevIdx / (ORDER_PROGRESS_STEPS.length - 1)) * 100 : 0;
  }

  const getStepTimestamp = (statusKey) => {
    const historyItem = [...statusHistory]
      .reverse()
      .find((h) => h.status === statusKey);
    if (historyItem?.createdAt) {
      return new Date(historyItem.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (statusKey === "pending_confirmation" && order.createdAt) {
      return new Date(order.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return null;
  };

  const isBankTransfer = order.paymentMethod === "bank_transfer";

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-[#0E150D]/45 p-2 backdrop-blur-md transition-all animate-fadeIn lg:overflow-hidden lg:p-3"
      onMouseDown={onClose}
    >
      <div
        className="shop-order-modal neu-card my-auto w-full max-w-6xl rounded-[22px] border border-[#E0EBD6] bg-white p-4 shadow-[0_24px_64px_rgba(25,38,20,0.2)] sm:p-5 lg:flex lg:h-[calc(100dvh-24px)] lg:max-h-[920px] lg:flex-col lg:overflow-hidden"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[#E4EEDC] pb-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#577634]">
                Chi tiết đơn hàng
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  isCancelled
                    ? "bg-red-50 text-red-700 border-red-200"
                    : isCancelRequested
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : isDelivered
                    ? "bg-[#E6F3D8] text-[#3A601F] border-[#BEDBA4]"
                    : "bg-[#EEF5E7] text-[#486629] border-[#CFE0C1]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isCancelled
                      ? "bg-red-500"
                      : isCancelRequested
                      ? "bg-amber-500"
                      : "bg-[#5E8337]"
                  }`}
                />
                {commerceOrderLabels[order.orderStatus] || order.orderStatus}
              </span>
              {order.createdAt && (
                <span className="text-[11px] text-[#8C9B9A]">
                  · Đặt lúc{" "}
                  {new Date(order.createdAt).toLocaleString("vi-VN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xl font-black tracking-wider text-[#1A261B] sm:text-2xl">
                {commerceCode(order.orderCode)}
              </span>
              <button
                type="button"
                onClick={() => copyText(order.orderCode, setCopiedCode)}
                className="neu-card-sm flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#647563] hover:text-[#1A261B] transition-colors"
                title="Sao chép mã đơn"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-[#577634]" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? "Đã chép" : "Sao chép"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-[#6F7F6E]">
              <span className="inline-flex items-center gap-1 font-medium">
                {isBankTransfer ? (
                  <Building2 className="h-3.5 w-3.5 text-[#577634]" />
                ) : (
                  <Banknote className="h-3.5 w-3.5 text-[#577634]" />
                )}
                {isBankTransfer ? "Chuyển khoản ngân hàng" : "Tiền mặt khi nhận (COD)"}
              </span>
              <span>·</span>
              <span className="font-bold text-[#1A261B]">
                {commercePaymentLabels[order.paymentStatus] || order.paymentStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="neu-btn-primary flex items-center gap-2 !px-4 !py-2.5 text-xs font-bold shadow-sm"
              onClick={() => beginShopOrderChat(order.id)}
            >
              <MessageSquare className="h-4 w-4" />
              Nhắn khách
            </button>
            <button
              type="button"
              className="neu-icon-btn text-[#8C9B9A] hover:text-[#1F2A2A] hover:bg-slate-100/80 transition-colors"
              onClick={onClose}
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* NOTICES / ALERTS */}
        {notice ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-red-50/90 border border-red-200 p-3.5 text-xs font-bold text-red-700 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* HERO PROGRESS LINE / STEPPER */}
        <section className="mt-3 shrink-0 rounded-2xl border border-[#DCE8D3] bg-gradient-to-b from-[#FAFCF8] to-[#F1F6EB]/80 p-3 shadow-sm sm:p-3.5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#597834] text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1F2A2A]">
                  Tiến trình xử lý đơn hàng
                </h4>
                <p className="hidden text-[10px] text-[#71826F] xl:block">
                  Quy trình 5 bước chuẩn hóa từ tiếp nhận đến khi giao thành công
                </p>
              </div>
            </div>

            <div>
              {isCancelled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-200 px-3 py-1 text-xs font-bold text-red-700">
                  <Ban className="h-3.5 w-3.5" />
                  Đơn hàng đã hủy
                </span>
              ) : isCancelRequested ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Khách yêu cầu hủy
                </span>
              ) : isDelivered ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F3D8] border border-[#BBD8A0] px-3.5 py-1 text-xs font-black text-[#3D6320]">
                  <CheckCheck className="h-4 w-4" />
                  Hoàn thành 5/5 bước
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF5E7] border border-[#CFE0C1] px-3.5 py-1 text-xs font-bold text-[#486629]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#628A37] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#486629]"></span>
                  </span>
                  Bước {activeStepIndex + 1}/5 · {ORDER_PROGRESS_STEPS[activeStepIndex]?.title}
                </span>
              )}
            </div>
          </div>

          {/* Stepper Track & Nodes */}
          <div className="relative pt-2 pb-1 overflow-x-auto sm:overflow-visible">
            <div className="min-w-[480px] sm:min-w-0 relative">
              {/* Background connector bar (centered from col 1 to col 5) */}
              <div className="absolute top-4 left-[10%] right-[10%] h-1 -translate-y-1/2 overflow-hidden rounded-full bg-[#E1EBDA]">
                {/* Animated fill track */}
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isCancelled
                      ? "bg-red-400"
                      : "bg-gradient-to-r from-[#597834] via-[#759E47] to-[#8EB758] shadow-[0_0_12px_rgba(98,138,55,0.4)]"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 5 Nodes */}
              <div className="relative grid grid-cols-5 text-center">
                {ORDER_PROGRESS_STEPS.map((step, idx) => {
                  const isCompleted = activeStepIndex > idx;
                  const isCurrent = activeStepIndex === idx && !isCancelled;
                  const isNext = activeStepIndex + 1 === idx && !isCancelled && !isDelivered;
                  const StepIcon = step.icon;
                  const stepTime = getStepTimestamp(step.key);

                  return (
                    <div key={step.key} className="flex flex-col items-center group">
                      <button
                        type="button"
                        disabled={!isNext || busy}
                        onClick={() => {
                          if (isNext && nextTargetKey) actStatus(nextTargetKey);
                        }}
                        className={`relative z-10 grid h-8 w-8 place-items-center rounded-full transition-all duration-300 ${
                          isCompleted
                            ? "bg-[#547530] text-white shadow-md ring-4 ring-[#E4EFD9]"
                            : isCurrent
                            ? "bg-[#456325] text-white shadow-lg ring-4 ring-[#7AA14E]/50 ring-offset-2 scale-110"
                            : isNext
                            ? "bg-white text-[#5E7E38] border-2 border-dashed border-[#7AA14E] shadow-sm hover:scale-105 hover:bg-[#F2F7EC] cursor-pointer"
                            : "bg-white text-[#9CA999] border-2 border-[#D9E4D3] shadow-xs cursor-default"
                        }`}
                        title={isNext ? `Bấm để chuyển sang: ${step.title}` : step.title}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        ) : (
                          <StepIcon className="h-4 w-4 stroke-[2]" />
                        )}

                        {/* Animated halo for active node */}
                        {isCurrent && (
                          <span className="absolute -inset-1 rounded-full border border-[#7AA14E]/60 animate-ping opacity-60 pointer-events-none" />
                        )}
                      </button>

                      <p
                        className={`mt-1.5 text-[11px] transition-colors ${
                          isCurrent
                            ? "text-[#1F2A2A] font-black"
                            : isCompleted
                            ? "text-[#3D5620] font-bold"
                            : isNext
                            ? "text-[#4F6D2B] font-bold"
                            : "text-[#8E9B8D] font-medium"
                        }`}
                      >
                        {step.title}
                      </p>

                      <span className="mt-0.5 text-[9px] font-medium text-[#849582]">
                        {stepTime
                          ? stepTime
                          : isCurrent
                          ? "Đang xử lý"
                          : isCompleted
                          ? "Đã xong"
                          : `Bước ${step.number}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 2-COLUMN BODY */}
        <div className="mt-3 grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] lg:overflow-hidden">
          {/* LEFT COLUMN: INFO & ITEMS */}
          <div className="grid gap-3 lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)_auto]">
            {/* RECIPIENT & ADDRESS */}
            <section className="neu-card-sm border border-[#E2EBD5] p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#577634]" />
                  <h3 className="text-xs font-black text-[#1F2A2A] uppercase tracking-wider">
                    Người nhận & Địa chỉ
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-[#768774]">
                  Thông tin giao hàng
                </span>
              </div>

              <div className="neu-inset space-y-1.5 rounded-xl border border-[#E8EFE2] bg-white/80 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-[#EEF5E7] text-[#4F6E2B] font-black text-xs uppercase shadow-xs">
                      {recipient.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-black text-[#1F2A2A] text-sm">{recipient.name || "Khách mua"}</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={recipient.phone ? `tel:${recipient.phone}` : undefined}
                          className="text-xs font-bold text-[#577634] hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {recipient.phone || "Chưa có số điện thoại"}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText(recipient.phone, setCopiedPhone)}
                          className="text-[10px] font-medium text-[#8C9B9A] hover:text-[#1F2A2A]"
                          title="Sao chép số điện thoại"
                        >
                          {copiedPhone ? "✓ Đã chép" : "Chép"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 border-t border-[#EEF3EA] text-xs text-[#637362] leading-relaxed">
                  <MapPin className="h-3.5 w-3.5 text-[#889B85] shrink-0 mt-0.5" />
                  <span>{recipient.fullAddress || recipient.addressLine || "Chưa có địa chỉ giao hàng"}</span>
                </div>

                {recipient.note ? (
                  <div className="flex items-start gap-2 rounded-xl bg-[#F8FAF4] border border-[#E4EBDC] p-2.5 text-xs text-[#5D6D5C] italic">
                    <MessageSquare className="h-3.5 w-3.5 text-[#577634] shrink-0 mt-0.5 not-italic" />
                    <span>Ghi chú từ khách: "{recipient.note}"</span>
                  </div>
                ) : null}
              </div>
            </section>

            {/* ORDER ITEMS */}
            <section className="neu-card-sm border border-[#E2EBD5] p-3.5 lg:min-h-0 lg:overflow-hidden">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-[#577634]" />
                  <h3 className="text-xs font-black text-[#1F2A2A] uppercase tracking-wider">
                    Sản phẩm trong đơn
                  </h3>
                </div>
                <span className="rounded-full bg-[#EEF5E7] px-2.5 py-0.5 text-[11px] font-bold text-[#4F6E2B]">
                  {orderItems.length} sản phẩm
                </span>
              </div>

              <div className="divide-y divide-[#E6EFE0]">
                {orderItems.map((item, index) => (
                  <div
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                    key={item.variantId || `${item.productId || "item"}-${index}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-10 w-10 shrink-0 rounded-lg border border-[#E2EBD5] object-cover shadow-xs"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E2EBD5] bg-[#F2F6ED] text-[#577634]">
                          <Package className="h-5 w-5 stroke-[1.5]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-[#1F2A2A] text-sm truncate">{item.name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#7B8C7A]">
                          <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {item.sku}
                          </span>
                          <span>·</span>
                          <span>
                            {item.color || "Mặc định"} / {item.size || "Một cỡ"}
                          </span>
                          <span>·</span>
                          <span className="font-black text-[#1F2A2A] bg-[#EEF5E7] px-2 py-0.5 rounded-full text-[11px]">
                            x{item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-sm text-[#1F2A2A] shrink-0">
                      {formatMoney(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* PAYMENT PROOF (IF BANK TRANSFER) */}
            {order.paymentProof?.imageUrl ? (
              <section className="neu-card-sm border border-[#E2EBD5] p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-[#1F241D] uppercase tracking-wider">
                    Biên lai chuyển khoản
                  </h3>
                  <a
                    href={order.paymentProof.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#577634] hover:underline"
                  >
                    Xem ảnh gốc
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="neu-inset rounded-2xl p-2 flex justify-center bg-white/70">
                  <img
                    className="max-h-32 rounded-lg object-contain shadow-sm"
                    src={order.paymentProof.imageUrl}
                    alt="Biên lai chuyển khoản"
                  />
                </div>
              </section>
            ) : null}
          </div>

          {/* RIGHT COLUMN: ACTIONS & PAYMENT */}
          <aside className="grid h-fit gap-3 lg:min-h-0 lg:content-start">
            {/* TOTAL PRICE & PAYMENT DETAILS */}
            <section className="neu-inset rounded-2xl border border-[#DEEAD5] bg-gradient-to-br from-[#F4F8EE] to-[#E9F2E2] p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-[#7A8A76] uppercase tracking-wider">
                  Tổng giá trị đơn
                </p>
                <span className="text-[11px] font-black text-[#577634] bg-white/80 px-2 py-0.5 rounded-full border border-[#DCE8D4]">
                  {order.paymentMethod === "bank_transfer" ? "Chuyển khoản" : "COD"}
                </span>
              </div>
              <p className="mt-1 text-2xl font-black tracking-tight text-[#4B6929]">
                {formatMoney(order.total)}
              </p>

              {order.paymentSnapshot ? (
                <div className="mt-2 space-y-1 border-t border-[#DFEAD7] pt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#576554]">
                      {order.paymentSnapshot.bankName}
                    </span>
                    <span className="text-[10px] text-[#7A8A76] font-medium">
                      {order.paymentSnapshot.accountHolder}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/75 p-2 rounded-xl border border-[#DFEAD7]">
                    <span className="font-mono font-black text-sm text-[#1F241D]">
                      {order.paymentSnapshot.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(order.paymentSnapshot.accountNumber, setCopiedBank)}
                      className="text-[10px] font-bold text-[#577634] hover:text-[#1F241D]"
                    >
                      {copiedBank ? "✓ Đã chép" : "Chép"}
                    </button>
                  </div>
                  {order.transferContent && (
                    <div className="flex items-center justify-between bg-white/75 p-2 rounded-xl border border-[#DFEAD7]">
                      <span className="font-mono text-[11px] text-[#577634] truncate">
                        ND: {order.transferContent}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(order.transferContent, setCopiedContent)}
                        className="text-[10px] font-bold text-[#577634] hover:text-[#1F241D] shrink-0 ml-1"
                      >
                        {copiedContent ? "✓ Đã chép" : "Chép"}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </section>

            {/* CẬP NHẬT TIẾN ĐỘ INTERACTIVE CONTROL */}
            <section className="neu-card-sm border border-[#E2EBD5] p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#577634]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1F241D]">
                    Cập nhật tiến độ
                  </h3>
                </div>
                {nextStepInfo && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#577634] bg-[#EEF5E7] px-2 py-0.5 rounded-full">
                    Nấc {nextStepInfo.stepNum}/5
                  </span>
                )}
              </div>

              {/* ACTION AREA */}
              <div className="grid gap-3">
                {nextStepInfo ? (
                  <div className="space-y-1.5 rounded-xl border border-[#DCE8D3] bg-gradient-to-b from-[#FAFCF8] to-[#F1F6EC] p-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#647563]">Bước kế tiếp:</span>
                      <span className="font-bold text-[#4B6929] bg-[#E5EEDD] px-2 py-0.5 rounded-md">
                        {nextStepInfo.stepName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#697A67] leading-relaxed">
                      {nextStepInfo.hint}
                    </p>

                    {/* BIG PRIMARY ADVANCE BUTTON */}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => actStatus(nextTargetKey)}
                      className={`group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_14px_rgba(75,105,41,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(75,105,41,0.42)] active:scale-[0.99] disabled:opacity-60 ${nextStepInfo.btnColor}`}
                    >
                      {busy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Đang cập nhật...</span>
                        </>
                      ) : (
                        <>
                          <span>{nextStepInfo.actionLabel}</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </div>
                ) : null}

                {/* COMPLETED BANNER */}
                {isDelivered && (
                  <div className="space-y-1.5 rounded-xl border border-[#CDE1BC] bg-[#F3F9EE] p-3 text-center">
                    <div className="mx-auto h-9 w-9 rounded-full bg-[#52742E] text-white flex items-center justify-center shadow-xs">
                      <CheckCheck className="h-5 w-5" />
                    </div>
                    <p className="font-black text-xs text-[#354D1D]">
                      Đơn hàng đã hoàn thành trọn vẹn
                    </p>
                    <p className="text-[11px] text-[#576E43]">
                      Khách hàng đã nhận được kiện hàng. Tiến trình đã kết thúc 100%.
                    </p>
                  </div>
                )}

                {/* CANCEL REQUEST DECISION */}
                {isCancelRequested && (
                  <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/90 p-3">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Khách yêu cầu hủy đơn</span>
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Khách đã gửi yêu cầu hủy đơn này. Vui lòng xác nhận bạn có chấp thuận yêu cầu
                      hủy hay tiếp tục xử lý.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await decideShopCancellation(order.id, true, "Shop chấp nhận hủy");
                            await onChanged();
                          } catch (e) {
                            setNotice(
                              e.response?.data?.message || "Không xử lý được yêu cầu hủy."
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs text-center"
                      >
                        Chấp nhận hủy
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await decideShopCancellation(order.id, false, "Shop từ chối hủy");
                            await onChanged();
                          } catch (e) {
                            setNotice(
                              e.response?.data?.message || "Không xử lý được yêu cầu hủy."
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition text-center"
                      >
                        Từ chối hủy
                      </button>
                    </div>
                  </div>
                )}

                {/* CANCELLED STATE */}
                {isCancelled && (
                  <div className="space-y-1 rounded-xl border border-red-200 bg-red-50/70 p-3 text-center">
                    <div className="mx-auto h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <Ban className="h-4 w-4" />
                    </div>
                    <p className="font-black text-xs text-red-800">Đơn hàng đã bị hủy</p>
                    <p className="text-[11px] text-red-600">
                      Chu trình đơn đã dừng và không thể cập nhật thêm bước kế tiếp.
                    </p>
                  </div>
                )}

                {/* SECONDARY CANCEL BUTTON FOR NORMAL ORDERS */}
                {!isDelivered && !isCancelled && !isCancelRequested && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setCancelReasonId("");
                      setCustomCancelReason("");
                      setShowCancelModal(true);
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-red-600/75 hover:text-red-700 hover:bg-red-50/80 rounded-xl transition-all border border-transparent hover:border-red-200 text-center cursor-pointer"
                  >
                    Hủy đơn hàng này
                  </button>
                )}
              </div>
            </section>

            {/* ĐỐI SOÁT THANH TOÁN */}
            <section className="neu-card-sm border border-[#E2EBD5] p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#577634]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1F241D]">
                    Đối soát thanh toán
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    order.paymentStatus === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {commercePaymentLabels[order.paymentStatus] || order.paymentStatus}
                </span>
              </div>

              <div className="grid gap-2.5">
                {order.paymentStatus === "paid" ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Đã xác nhận thanh toán đầy đủ</span>
                  </div>
                ) : null}

                {["cod_pending", "awaiting_transfer", "pending_verification"].includes(
                  order.paymentStatus
                ) ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="neu-btn-primary !py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                    onClick={() => actPayment("confirm_paid")}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Xác nhận đã nhận tiền
                  </button>
                ) : null}

                {order.paymentStatus === "pending_verification" ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="neu-btn-raised text-red-600 hover:text-red-700 !py-2.5 text-xs font-bold"
                    onClick={() => actPayment("reject_transfer")}
                  >
                    Từ chối biên lai
                  </button>
                ) : null}

                {order.paymentStatus === "refund_pending" ? (
                  <div className="grid gap-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                    <label className="text-[11px] font-bold text-amber-900">
                      Tải ảnh chứng từ hoàn tiền:
                    </label>
                    <input
                      className="neu-input px-3 py-2 text-xs bg-white"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setRefundProof(event.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      className="neu-btn-primary !py-2.5 text-xs font-bold"
                      onClick={() => actPayment("mark_refunded")}
                    >
                      Đánh dấu đã hoàn tiền
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showCancelModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            if (!busy) setShowCancelModal(false);
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/80 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-base text-slate-800">Xác nhận hủy đơn hàng</h4>
                <p className="text-xs text-slate-500 mt-0.5">Chọn lý do để thông báo đến khách hàng</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {SELLER_CANCEL_REASONS.map((r) => {
                const sel = cancelReasonId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setCancelReasonId(r.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs transition ${
                      sel
                        ? "border-[#597834] bg-[#F2F6ED] font-bold text-[#2A3B18]"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span
                      className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${
                        sel ? "border-[#597834] bg-white" : "border-slate-300"
                      }`}
                    >
                      {sel && <span className="h-1.5 w-1.5 rounded-full bg-[#597834]" />}
                    </span>
                    <span>{r.label}</span>
                  </div>
                );
              })}
            </div>

            {cancelReasonId === "other" && (
              <textarea
                value={customCancelReason}
                onChange={(e) => setCustomCancelReason(e.target.value)}
                placeholder="Nhập lý do cụ thể..."
                rows={2}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#597834]"
              />
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  !cancelReasonId ||
                  (cancelReasonId === "other" && !customCancelReason.trim())
                }
                onClick={async () => {
                  const finalReason =
                    cancelReasonId === "other"
                      ? customCancelReason.trim()
                      : SELLER_CANCEL_REASONS.find((r) => r.id === cancelReasonId)?.label ||
                        "Shop hủy đơn";
                  setBusy(true);
                  setNotice("");
                  try {
                    await updateShopOrderStatus(order.id, "cancelled", finalReason);
                    setShowCancelModal(false);
                    await onChanged();
                  } catch (e) {
                    setNotice(e.response?.data?.message || "Không cập nhật được trạng thái.");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {busy ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
