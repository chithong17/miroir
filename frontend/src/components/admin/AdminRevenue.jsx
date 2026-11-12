import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeDollarSign, CalendarDays, ChevronRight, CircleDollarSign, CreditCard, Search, Store, X } from "lucide-react";
import { getAdminRevenue } from "../../api/adminApi.js";

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const dateTime = (value) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
const dateInput = (date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(date);
const inputClass = "w-full rounded-xl border border-[#DCE4D6] bg-white px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#B3D07E]";
const initialRange = () => { const now = new Date(); return { from: `${dateInput(now).slice(0, 7)}-01`, to: dateInput(now) }; };

const Stat = ({ label, value, note, icon: Icon }) => <article className="rounded-3xl border border-white bg-white/80 p-5 shadow-[0_16px_35px_rgba(79,101,63,.08)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#7D8D7B]">{label}</p><p className="mt-2 text-2xl font-black text-[#1F2A2A]">{value}</p><p className="mt-1 text-[11px] text-[#96A5A4]">{note}</p></div><span className="rounded-2xl bg-[#EEF5E3] p-3 text-[#6F8746]"><Icon size={19} /></span></div></article>;

export default function AdminRevenue({ refreshing = false }) {
  const [range, setRange] = useState(initialRange);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [type, setType] = useState("all");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setData(await getAdminRevenue(range)); }
    catch (requestError) { setError(requestError.response?.data?.message || "Không tải được báo cáo doanh thu."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [range.from, range.to]);
  useEffect(() => { if (!refreshing && data) load(); }, [refreshing]);

  const filteredTransactions = useMemo(() => (data?.transactions || []).filter((item) => {
    const term = search.trim().toLowerCase();
    return (!term || `${item.shopName} ${item.ownerName} ${item.ownerEmail} ${item.orderCode}`.toLowerCase().includes(term)) && (plan === "all" || item.planCode === plan) && (type === "all" || item.type === type);
  }), [data, search, plan, type]);
  const filteredShops = useMemo(() => (data?.shops || []).filter((item) => { const term = search.trim().toLowerCase(); return !term || `${item.shopName} ${item.ownerName} ${item.ownerEmail}`.toLowerCase().includes(term); }), [data, search]);
  const selectedShop = (data?.shops || []).find((item) => item.ownerId === selectedOwnerId);
  const selectedTransactions = (data?.transactions || []).filter((item) => item.ownerId === selectedOwnerId);
  const maxDaily = Math.max(1, ...(data?.timeSeries || []).map((item) => item.total));
  const applyPreset = (days) => { const end = new Date(); const start = new Date(end.getTime() - (days - 1) * 86400000); setRange({ from: dateInput(start), to: dateInput(end) }); };

  if (loading && !data) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-3xl bg-[#EEF2E7]" />)}</div>;
  if (error && !data) return <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center"><AlertCircle className="mx-auto text-red-500" /><p className="mt-3 text-sm font-bold text-red-700">{error}</p><button onClick={load} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white">Thử lại</button></div>;
  const summary = data?.summary || {};

  return <div className="space-y-6">
    <section className="rounded-3xl border border-white bg-white/70 p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#6F8746]">Tiền đã thu từ shop</p><h2 className="mt-2 text-xl font-black">Doanh thu gói và phí phát sinh</h2><p className="mt-1 text-xs text-[#7D8D7B]">Chỉ tính giao dịch đã thanh toán; không tính gói admin cấp miễn phí.</p></div><div className="flex flex-wrap gap-2">{[[7, "7 ngày"], [30, "30 ngày"], [90, "90 ngày"]].map(([days, label]) => <button key={days} onClick={() => applyPreset(days)} className="rounded-xl border border-[#DCE4D6] bg-white px-3 py-2 text-xs font-bold text-[#6F8746]">{label}</button>)}</div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"><label className="text-[11px] font-bold text-[#6E7D7C]">Từ ngày<input className={`${inputClass} mt-1`} type="date" value={range.from} max={range.to} onChange={(event) => setRange((old) => ({ ...old, from: event.target.value }))} /></label><label className="text-[11px] font-bold text-[#6E7D7C]">Đến ngày<input className={`${inputClass} mt-1`} type="date" value={range.to} min={range.from} onChange={(event) => setRange((old) => ({ ...old, to: event.target.value }))} /></label><div className="flex items-end"><span className="rounded-xl bg-[#EEF5E3] px-4 py-2.5 text-xs font-bold text-[#6F8746]"><CalendarDays className="mr-2 inline" size={14} />GMT+7</span></div></div></section>
    {error && <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Tổng thực thu" value={money(summary.grossCollected)} note={`${summary.paidTransactions || 0} giao dịch thành công`} icon={CircleDollarSign} /><Stat label="Doanh thu gói" value={money(summary.planRevenue)} note={`${summary.payingShops || 0} shop đã trả phí`} icon={CreditCard} /><Stat label="Phí phát sinh đã thu" value={money((summary.overageRevenue || 0) + (summary.commissionRevenue || 0))} note={`Try-On ${money(summary.overageRevenue)} · Hoa hồng ${money(summary.commissionRevenue)}`} icon={BadgeDollarSign} /><Stat label="Công nợ chưa thu" value={money(summary.outstandingAmount)} note={`Quá hạn ${money(summary.overdueAmount)}`} icon={AlertCircle} /></div>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]"><DailyChart rows={data?.timeSeries || []} max={maxDaily} /><PlanBreakdown rows={data?.plans || []} /></div>
    <ShopTable rows={filteredShops} search={search} setSearch={setSearch} onSelect={setSelectedOwnerId} />
    <TransactionTable rows={filteredTransactions} plans={data?.plans || []} plan={plan} setPlan={setPlan} type={type} setType={setType} />
    {(data?.outstanding || []).length > 0 && <Outstanding rows={data.outstanding} />}
    {selectedShop && <ShopDrawer shop={selectedShop} transactions={selectedTransactions} onClose={() => setSelectedOwnerId("")} />}
  </div>;
}

function DailyChart({ rows, max }) {
  return <section className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm"><h3 className="text-sm font-black">Doanh thu theo ngày</h3><p className="mt-1 text-[11px] text-[#96A5A4]">Tổng tiền thực nhận theo ngày thanh toán</p><div className="mt-6 flex h-48 items-end gap-2 overflow-x-auto pb-1">{rows.map((item) => <div key={item.date} className="flex h-full min-w-9 flex-1 flex-col items-center justify-end gap-2" title={`${item.date}: ${money(item.total)}`}><span className="hidden text-[9px] font-bold text-[#6F8746] 2xl:block">{item.total ? `${Math.round(item.total / 1000)}k` : "0"}</span><div className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-[#6F8746] to-[#B3D07E]" style={{ height: `${Math.max(3, item.total / max * 132)}px` }} /><span className="text-[9px] text-[#96A5A4]">{item.date.slice(8)}</span></div>)}{!rows.length && <p className="m-auto text-xs text-[#96A5A4]">Chưa có giao dịch trong kỳ.</p>}</div></section>;
}

function PlanBreakdown({ rows }) {
  return <section className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm"><h3 className="text-sm font-black">Doanh thu từng gói</h3><div className="mt-5 space-y-4">{rows.map((item) => <div key={item.planCode}><div className="mb-2 flex items-end justify-between gap-3"><div><p className="text-xs font-bold">{item.planName}</p><p className="text-[10px] text-[#96A5A4]">{item.transactions} giao dịch · {item.payingShops} shop · {item.activeShops} đang dùng</p></div><p className="text-sm font-black">{money(item.revenue)}</p></div><div className="h-2 overflow-hidden rounded-full bg-[#EEF2E7]"><div className="h-full rounded-full bg-[#8FB56B]" style={{ width: `${item.share * 100}%` }} /></div></div>)}</div></section>;
}

function ShopTable({ rows, search, setSearch, onSelect }) {
  return <section className="overflow-hidden rounded-3xl border border-white bg-white/80 shadow-sm"><div className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-black">Shop đã trả bao nhiêu</h3><p className="mt-1 text-[11px] text-[#96A5A4]">Bấm vào shop để xem từng lần thanh toán.</p></div><span className="text-xs font-bold text-[#6F8746]">{rows.length} shop</span></div><div className="relative mt-4 max-w-lg"><Search className="absolute left-3 top-3 text-[#96A5A4]" size={14} /><input className={`${inputClass} pl-9`} placeholder="Tìm tên shop hoặc email chủ shop..." value={search} onChange={(event) => setSearch(event.target.value)} /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#F1F5E8] text-[#6E7D7C]"><tr>{["Shop / chủ shop", "Phí gói", "Try-On vượt mức", "Hoa hồng", "Tổng đã trả", "Lần trả gần nhất", ""].map((label) => <th key={label} className="px-5 py-3 font-bold">{label}</th>)}</tr></thead><tbody>{rows.map((item) => <tr key={item.ownerId} className="border-t border-[#EEF2E7] hover:bg-[#F9FAF4]"><td className="px-5 py-4"><p className="font-bold">{item.shopName}</p><p className="mt-1 text-[10px] text-[#96A5A4]">{item.ownerEmail || item.ownerName}</p></td><td className="px-5 py-4">{money(item.planRevenue)}</td><td className="px-5 py-4">{money(item.overageRevenue)}</td><td className="px-5 py-4">{money(item.commissionRevenue)}</td><td className="px-5 py-4 font-black text-[#58752E]">{money(item.total)}</td><td className="px-5 py-4 text-[#6E7D7C]">{dateTime(item.lastPaidAt)}</td><td className="px-5 py-4"><button aria-label={`Xem thanh toán của ${item.shopName}`} onClick={() => onSelect(item.ownerId)} className="rounded-xl bg-[#EEF5E3] p-2 text-[#6F8746]"><ChevronRight size={16} /></button></td></tr>)}</tbody></table>{!rows.length && <div className="p-10 text-center text-xs text-[#96A5A4]"><Store className="mx-auto mb-3" />Chưa có shop trả phí trong kỳ.</div>}</div></section>;
}

function TransactionTable({ rows, plans, plan, setPlan, type, setType }) {
  return <section className="overflow-hidden rounded-3xl border border-white bg-white/80 shadow-sm"><div className="p-5"><h3 className="text-sm font-black">Lịch sử giao dịch</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><select className={inputClass} value={plan} onChange={(event) => setPlan(event.target.value)}><option value="all">Tất cả gói</option>{plans.map((item) => <option key={item.planCode} value={item.planCode}>{item.planName}</option>)}</select><select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}><option value="all">Tất cả loại thu</option><option value="plan">Phí gói</option><option value="invoice">Phí phát sinh</option></select><span className="flex items-center text-xs text-[#96A5A4]">{rows.length} giao dịch phù hợp</span></div></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#F1F5E8] text-[#6E7D7C]"><tr>{["Thời gian", "Shop", "Nội dung", "Mã PayOS", "Số tiền"].map((label) => <th key={label} className="px-5 py-3 font-bold">{label}</th>)}</tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-t border-[#EEF2E7]"><td className="px-5 py-4">{dateTime(item.paidAt)}</td><td className="px-5 py-4"><p className="font-bold">{item.shopName}</p><p className="text-[10px] text-[#96A5A4]">{item.ownerEmail}</p></td><td className="px-5 py-4">{item.type === "plan" ? `${item.planName} · ${item.purchaseKind === "renewal" ? "Gia hạn" : item.purchaseKind === "change" ? "Đổi gói" : "Mua mới"}` : `Phí phát sinh · Try-On ${money(item.breakdown.tryonOverage)} · Hoa hồng ${money(item.breakdown.commission)}`}</td><td className="px-5 py-4 font-mono text-[11px]">{item.orderCode}</td><td className="px-5 py-4 font-black">{money(item.amount)}</td></tr>)}</tbody></table></div></section>;
}

function Outstanding({ rows }) {
  return <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5"><h3 className="text-sm font-black text-amber-900">Công nợ cần theo dõi</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{rows.map((item) => <div key={item.id} className="rounded-2xl bg-white p-4 text-xs"><div className="flex justify-between gap-3"><div><p className="font-bold">{item.shopName}</p><p className="mt-1 text-[10px] text-[#96A5A4]">Hạn {dateTime(item.dueAt)}</p></div><div className="text-right"><p className="font-black text-amber-800">{money(item.amount)}</p><p className="mt-1 text-[10px] uppercase">{item.status}</p></div></div></div>)}</div></section>;
}

function ShopDrawer({ shop, transactions, onClose }) {
  return <div className="fixed inset-0 z-[70] flex justify-end bg-black/25" onClick={onClose}><aside className="h-full w-full max-w-xl overflow-y-auto bg-[#F9FAF4] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#6F8746]">Chi tiết doanh thu shop</p><h2 className="mt-2 text-xl font-black">{shop.shopName}</h2><p className="mt-1 text-xs text-[#96A5A4]">{shop.ownerEmail}</p></div><button onClick={onClose} className="rounded-xl border border-[#DCE4D6] bg-white p-2"><X size={18} /></button></div><div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"><Stat label="Tổng đã trả" value={money(shop.total)} note={`${shop.transactions} giao dịch`} icon={CircleDollarSign} /><Stat label="Phí gói" value={money(shop.planRevenue)} note={`Phát sinh ${money(shop.overageRevenue + shop.commissionRevenue)}`} icon={CreditCard} /></div><h3 className="mt-7 text-sm font-black">Các lần thanh toán</h3><div className="mt-3 space-y-3">{transactions.map((item) => <div key={item.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm"><div className="flex justify-between gap-4"><div><p className="text-xs font-bold">{item.type === "plan" ? item.planName : "Phí phát sinh"}</p><p className="mt-1 text-[10px] text-[#96A5A4]">{dateTime(item.paidAt)} · #{item.orderCode}</p></div><p className="text-sm font-black text-[#58752E]">{money(item.amount)}</p></div>{item.type === "invoice" && <p className="mt-2 text-[10px] text-[#6E7D7C]">Try-On: {money(item.breakdown.tryonOverage)} · Hoa hồng: {money(item.breakdown.commission)}</p>}</div>)}</div></aside></div>;
}
