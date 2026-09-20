import React, { useState } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Layers,
} from "lucide-react";
import {
  NeuCard,
  NeuButton,
  NeuBadge,
  NeuProgressBar,
} from "./NeuComponents.jsx";
import { getShopPlanQuote } from "../../api/shopApi.js";

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const date = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");

export default function SellerBillingView({
  subscription,
  plans = [],
  invoices = [],
  onCheckout,
  onTrial,
  onInvoicePay,
  status,
}) {
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [loadingCode, setLoadingCode] = useState("");

  const choose = async (code) => {
    setError("");
    setLoadingCode(code);
    try {
      const res = await getShopPlanQuote(code);
      setQuote(res.quote);
    } catch (failure) {
      setError(failure.response?.data?.message || "Không tải được giá chuyển gói.");
    } finally {
      setLoadingCode("");
    }
  };

  const usagePercent = subscription?.usage?.quota
    ? Math.round(((subscription.usage.used || 0) / subscription.usage.quota) * 100)
    : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Active Plan Overview Card */}
      <NeuCard className="p-6 sm:p-8 bg-gradient-to-r from-[#FFFFFF] via-[#F9FAF4] to-[#F1F5E8] border border-[#E2EBD5]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2EBD5] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#6F8746]">
                Trạng thái gói đăng ký
              </span>
              <NeuBadge
                variant={
                  subscription?.status === "suspended"
                    ? "danger"
                    : subscription?.isPremium
                    ? "success"
                    : "neutral"
                }
              >
                {subscription?.status === "suspended"
                  ? "Tạm ngưng do quá hạn"
                  : subscription?.isPremium
                  ? "Đang hoạt động"
                  : "Chưa kích hoạt"}
              </NeuBadge>
              {subscription?.grantType === "trial" && (
                <NeuBadge variant="violet">Dùng thử</NeuBadge>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1F2A2A]">
              Gói hiện tại: {subscription?.previousPlanCode || subscription?.planCode || "Chưa có gói"}
            </h2>
            <p className="text-xs text-[#6E7D7C] mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#6F8746]" />
              <span>Thời hạn đến: <strong>{date(subscription?.expiresAt)}</strong></span>
            </p>
          </div>

          <div className="text-left md:text-right p-4 rounded-2xl neu-inset bg-white/70">
            <p className="text-xs text-[#8C9B9A] font-medium">Tín dụng ví shop</p>
            <p className="text-2xl font-black text-[#6F8746]">
              {money(subscription?.creditBalance || 0)}
            </p>
          </div>
        </div>

        {/* Usage Progress and Metric Counters with multi-color 3D tiles */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="neu-inset p-4 rounded-2xl bg-white/50">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-[#6E7D7C]">Try-On AI Quota</span>
              <span className="text-[#6F8746]">{subscription?.usage?.used || 0}/{subscription?.usage?.quota || 0}</span>
            </div>
            <NeuProgressBar progress={usagePercent} gradient="teal" />
            <p className="text-[11px] text-[#8C9B9A] mt-1.5">Đã sử dụng {usagePercent}% hạn mức</p>
          </div>

          <div className="neu-inset p-4 rounded-2xl bg-white/50">
            <span className="text-xs font-bold text-[#6E7D7C]">Ảnh phát sinh vượt quota</span>
            <p className="text-xl font-black text-[#68A7FF] mt-1">
              +{subscription?.usage?.overage || 0} lượt
            </p>
            <p className="text-[11px] text-[#8C9B9A] mt-0.5">Tự động kết toán kỳ sau</p>
          </div>

          <div className="neu-inset p-4 rounded-2xl bg-white/50">
            <span className="text-xs font-bold text-[#6E7D7C]">Phí phát sinh dự tính</span>
            <p className="text-xl font-black text-[#7EDC9A] mt-1">
              {money(subscription?.usage?.estimatedFees || 0)}
            </p>
            <p className="text-[11px] text-[#8C9B9A] mt-0.5">Hoa hồng & dịch vụ bổ sung</p>
          </div>

          <div className="neu-inset p-4 rounded-2xl bg-white/50">
            <span className="text-xs font-bold text-[#6E7D7C]">Hóa đơn chưa thanh toán</span>
            <p className="text-xl font-black text-[#FF8F8F] mt-1">
              {money(subscription?.usage?.outstanding || 0)}
            </p>
            <p className="text-[11px] text-[#8C9B9A] mt-0.5">Cần thanh toán đúng hạn</p>
          </div>
        </div>
      </NeuCard>

      {/* 2. Available Subscription Plans Grid */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-[#1F2A2A]">
              Các gói giải pháp MIROIR Seller
            </h3>
            <p className="text-xs text-[#6E7D7C] mt-0.5">
              Nâng cấp để mở rộng lượt thử đồ AI, tăng uy tín gian hàng và mở khóa tính năng phân tích độc quyền
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const annualDiscount =
              plan.code === "STARTER_A" ? 0 : plan.code === "STARTER_B" ? 10 : plan.code === "GROWTH" ? 15 : 0;
            const isCurrent = subscription?.planCode === plan.code;

            return (
              <div
                key={plan.code}
                className={`neu-card p-6 sm:p-7 flex flex-col justify-between neu-card-hover relative transition-all duration-300 ${
                  isCurrent ? "ring-2 ring-[#B3D07E] shadow-lg" : ""
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <NeuBadge variant="teal">Đang sử dụng</NeuBadge>
                  </div>
                )}

                <div>
                  <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center mb-4 text-[#6F8746]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-xl font-black text-[#1F2A2A]">{plan.name}</h4>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[#6F8746]">
                      {money(plan.amount)}
                    </span>
                    <span className="text-xs text-[#8C9B9A] font-semibold">/tháng</span>
                  </div>

                  {annualDiscount > 0 && (
                    <span className="inline-block mt-2 text-[11px] font-bold text-[#6F8746] bg-[#F1F5E8] border border-[#E2EBD5] px-2.5 py-0.5 rounded-full">
                      Tiết kiệm {annualDiscount}% khi thanh toán theo năm
                    </span>
                  )}

                  <ul className="my-6 space-y-3 text-xs text-[#6E7D7C]">
                    <li className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#F1F5E8] flex items-center justify-center text-[#6F8746]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>Hạn mức Try-On: <strong className="text-[#1F2A2A]">{plan.tryOnQuota}</strong> lượt/tháng</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#F1F5E8] flex items-center justify-center text-[#6F8746]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>Hoa hồng bán hàng: <strong className="text-[#1F2A2A]">{plan.commissionRate ? "2.5%" : "0%"}</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#F1F5E8] flex items-center justify-center text-[#6F8746]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>Vượt hạn mức: <strong className="text-[#1F2A2A]">{money(plan.overagePrice)}</strong>/ảnh</span>
                    </li>
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#F1F5E8] flex items-center justify-center text-[#6F8746]">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className="text-[#1F2A2A]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 border-t border-[#E2EBD5] space-y-2.5">
                  {plan.trialEnabled && subscription?.trialEligible && (
                    <NeuButton
                      variant="secondary"
                      onClick={() => onTrial(plan.code)}
                      className="w-full text-xs font-bold text-[#6F8746]"
                    >
                      Dùng thử miễn phí 1 tháng
                    </NeuButton>
                  )}

                  <NeuButton
                    variant={isCurrent ? "secondary" : "primary"}
                    disabled={Boolean(loadingCode) || isCurrent}
                    onClick={() => choose(plan.code)}
                    className="w-full"
                  >
                    {loadingCode === plan.code
                      ? "Đang tính toán..."
                      : isCurrent
                      ? "Gia hạn gói"
                      : "Chọn gói này"}
                  </NeuButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Quote Calculation Modal/Box */}
      {quote && (
        <div className="neu-card p-6 sm:p-7 bg-[#F1F5E8] border border-[#B3D07E] animate-in slide-in-from-bottom-2 duration-200">
          <h3 className="font-black text-lg text-[#1F2A2A] flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#6F8746]" />
            Xác nhận thay đổi gói {quote.planCode}
          </h3>
          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-white rounded-xl neu-inset">
              <span className="text-[#8C9B9A]">Giá niêm yết:</span>
              <p className="text-sm font-black text-[#1F2A2A] mt-0.5">{money(quote.planAmount)}</p>
            </div>
            <div className="p-3 bg-white rounded-xl neu-inset">
              <span className="text-[#8C9B9A]">Khấu trừ thời gian cũ:</span>
              <p className="text-sm font-black text-[#68A7FF] mt-0.5">-{money(quote.proratedCredit)}</p>
            </div>
            <div className="p-3 bg-white rounded-xl neu-inset">
              <span className="text-[#8C9B9A]">Tín dụng sẵn có:</span>
              <p className="text-sm font-black text-[#8B7CFF] mt-0.5">-{money(quote.existingCredit)}</p>
            </div>
            <div className="p-3 bg-white rounded-xl neu-inset border-2 border-[#B3D07E]">
              <span className="text-[#6F8746] font-bold">Thực trả kỳ này:</span>
              <p className="text-lg font-black text-[#6F8746] mt-0.5">{money(quote.payable)}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <NeuButton
              variant="primary"
              onClick={() => onCheckout(quote.planCode)}
            >
              Tiến hành thanh toán ngay
            </NeuButton>
            <NeuButton
              variant="ghost"
              onClick={() => setQuote(null)}
            >
              Hủy bỏ
            </NeuButton>
          </div>
        </div>
      )}

      {/* 4. Invoices History Table */}
      <NeuCard padding="p-0" className="overflow-hidden">
        <div className="p-6 border-b border-[#E2EBD5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-[#1F2A2A]">
              Lịch sử giao dịch & hóa đơn
            </h3>
            <p className="text-xs text-[#6E7D7C] mt-0.5">
              Toàn bộ lịch sử nâng cấp gói, phí hoa hồng đơn hàng và phí phát sinh theo chu kỳ
            </p>
          </div>
          <span className="text-xs font-bold text-[#6F8746] bg-[#F1F5E8] px-3 py-1 rounded-full w-fit">
            {invoices.length} bản ghi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="neu-inset bg-[#F1F5E8]/60 text-[#6E7D7C] text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4 pl-6">Ngày phát hành</th>
                <th className="p-4">Hạn thanh toán</th>
                <th className="p-4">Số tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 pr-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EBD5]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-xs text-[#8C9B9A]">
                    Chưa phát sinh hóa đơn nào trên hệ thống.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F1F5E8]/30 transition">
                    <td className="p-4 pl-6 font-bold text-xs text-[#1F2A2A]">{date(inv.issuedAt)}</td>
                    <td className="p-4 text-xs text-[#6E7D7C]">{date(inv.dueAt)}</td>
                    <td className="p-4 font-black text-sm text-[#1F2A2A]">{money(inv.amount)}</td>
                    <td className="p-4">
                      <NeuBadge variant={inv.status === "paid" ? "success" : "warning"}>
                        {inv.status === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
                      </NeuBadge>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {inv.status !== "paid" ? (
                        <NeuButton
                          variant="primary"
                          size="sm"
                          onClick={() => onInvoicePay(inv.id)}
                        >
                          Thanh toán ngay
                        </NeuButton>
                      ) : (
                        <span className="text-xs font-bold text-[#6F8746]">Đã thanh toán</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {error && (
        <p className="text-xs font-bold text-red-600 p-4 neu-card bg-red-50/50 border-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
