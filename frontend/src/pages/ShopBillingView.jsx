import { useState } from "react";
import { getShopPlanQuote } from "../api/shopApi.js";

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const date = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "—";

export default function ShopBillingView({ subscription, plans, invoices, onCheckout, onTrial, onInvoicePay, status }) {
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const choose = async (code) => {
    setError(""); setLoading(code);
    try { setQuote((await getShopPlanQuote(code)).quote); }
    catch (failure) { setError(failure.response?.data?.message || "Không tải được giá chuyển gói."); }
    finally { setLoading(""); }
  };
  return <section className="grid gap-5">
    <div className="rounded-2xl border border-[#DFE8D5] bg-white p-5">
      <h1 className="text-xl font-black">Gói và thanh toán</h1>
      <p className="mt-2 text-sm text-slate-600">Gói hiện tại: <strong>{subscription?.previousPlanCode || "Chưa có"}</strong> · {subscription?.status === "suspended" ? "Tạm ngừng vì hóa đơn quá hạn" : subscription?.isPremium ? `Đến ${date(subscription.expiresAt)}` : "Chưa hoạt động"}</p>
      {subscription?.grantType ? <p className="mt-1 text-sm text-[#49652D]">{subscription.grantType === "trial" ? "Đang dùng thử miễn phí" : "Gói do admin cấp miễn phí"} · phí vượt quota và hoa hồng vẫn áp dụng.</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Metric label="Try-On đã dùng" value={`${subscription?.usage?.used || 0}/${subscription?.usage?.quota || 0}`} />
        <Metric label="Lượt vượt" value={subscription?.usage?.overage || 0} />
        <Metric label="Phí đang phát sinh" value={money(subscription?.usage?.estimatedFees)} />
        <Metric label="Hóa đơn chưa trả" value={money(subscription?.usage?.outstanding)} />
      </div>
      {subscription?.creditBalance > 0 ? <p className="mt-3 text-sm">Tín dụng còn lại: <strong>{money(subscription.creditBalance)}</strong></p> : null}
      {subscription?.pendingRenewal ? <p className="mt-3 text-sm font-bold text-[#49652D]">Đã thanh toán kỳ tiếp theo: {subscription.pendingRenewal.planCode}. Gói sẽ tiếp tục khi kỳ hiện tại kết thúc.</p> : null}
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => <article key={plan.code} className="flex flex-col rounded-2xl border border-[#DFE8D5] bg-white p-5">
        <h2 className="text-lg font-black">{plan.name}</h2><p className="mt-1 text-2xl font-black text-[#668443]">{money(plan.amount)}<span className="text-sm font-medium text-slate-500">/tháng</span></p>
        <p className="mt-3 text-sm">Hoa hồng: {plan.commissionRate ? "2,5%" : "0%"}</p>
        <p className="text-sm">Try-On: {plan.tryOnQuota} lượt/kỳ</p>
        <p className="text-sm">Vượt quota: {money(plan.overagePrice)}/ảnh</p>
        <ul className="my-4 list-disc space-y-1 pl-5 text-sm text-slate-600">{plan.features?.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        {plan.trialEnabled && subscription?.trialEligible ? <><button className="mb-2 rounded-xl border border-[#668443] px-4 py-2.5 font-bold text-[#49652D]" type="button" onClick={() => onTrial(plan.code)}>Dùng thử miễn phí 1 tháng</button><p className="mb-2 text-xs text-slate-500">Phí vượt quota và hoa hồng vẫn áp dụng.</p></> : null}
        <button className="mt-auto rounded-xl bg-[#668443] px-4 py-2.5 font-bold text-white disabled:opacity-50" type="button" disabled={Boolean(loading) || (subscription?.pendingRenewal && subscription.pendingRenewal.planCode === plan.code)} onClick={() => choose(plan.code)}>{loading === plan.code ? "Đang tính..." : subscription?.pendingRenewal?.planCode === plan.code ? "Đã mua kỳ sau" : subscription?.planCode === plan.code ? "Gia hạn" : "Chọn gói"}</button>
      </article>)}
    </div>
    {quote ? <div className="rounded-2xl border border-[#86A95E] bg-[#F5FAEF] p-5">
      <h2 className="font-black">Xác nhận {quote.planCode}</h2>
      <p className="mt-2 text-sm">Giá gói mới: {money(quote.planAmount)} · Bù trừ thời gian còn lại: {money(quote.proratedCredit)} · Tín dụng sẵn có: {money(quote.existingCredit)}{quote.prepaidRenewalCredit ? ` · Kỳ đã mua trước: ${money(quote.prepaidRenewalCredit)}` : ""}</p>
      <p className="mt-2 font-black">Thanh toán ngay: {money(quote.payable)} · Tín dụng chuyển kỳ sau: {money(quote.remainingCredit)}</p>
      <p className="mt-1 text-xs text-slate-600">Gói và quota mới bắt đầu sau khi thanh toán được xác nhận. Phí phát sinh kỳ cũ sẽ xuất hóa đơn riêng.</p>
      <button className="mt-4 rounded-xl bg-[#668443] px-4 py-2.5 font-bold text-white" type="button" onClick={() => onCheckout(quote.planCode)}>Tiếp tục thanh toán</button>
      <button className="ml-3 text-sm font-bold text-slate-600" type="button" onClick={() => setQuote(null)}>Hủy</button>
    </div> : null}
    <div className="rounded-2xl border border-[#DFE8D5] bg-white p-5">
      <h2 className="font-black">Hóa đơn phát sinh</h2>
      <div className="mt-3 grid gap-3">{invoices.map((invoice) => <div className="rounded-xl border border-slate-200 p-3" key={invoice.id}>
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{date(invoice.issuedAt)} · {money(invoice.amount)} · {invoice.status}</p>{invoice.status !== "paid" ? <button className="rounded-lg bg-[#668443] px-3 py-2 text-sm font-bold text-white" type="button" onClick={() => onInvoicePay(invoice.id)}>Thanh toán</button> : null}</div>
        <p className="mt-1 text-xs text-slate-500">Hạn: {date(invoice.dueAt)} · {invoice.entries?.length || 0} khoản</p>
        <ul className="mt-2 text-xs text-slate-600">{invoice.entries?.map((item) => <li key={item.id}>{item.type === "commission" ? "Hoa hồng" : "Try-On vượt quota"} · {item.referenceId} · {money(item.amount)}</li>)}</ul>
      </div>)}{!invoices.length ? <p className="text-sm text-slate-500">Chưa có hóa đơn phát sinh.</p> : null}</div>
    </div>
    {error || status ? <p className="text-sm text-red-700">{error || status}</p> : null}
  </section>;
}

function Metric({ label, value }) { return <div className="rounded-xl bg-[#F5FAEF] p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-black">{value}</p></div>; }
