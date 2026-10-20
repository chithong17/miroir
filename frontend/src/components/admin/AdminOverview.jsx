import { useMemo, useState } from "react";
import { Store, CreditCard, Users, Clock3, ArrowUpRight, Search, Package } from "lucide-react";
import { NeuCard, NeuStatCard } from "../seller/NeuComponents.jsx";
import { subscriptionState, hasCurrentPlan, normalizePlan, stateLabels, dateLabel, moneyLabel } from "./adminMetrics.js";

export function SubscriptionBadge({ owner }) {
  const state = subscriptionState(owner);
  const color = { active: "bg-[#EAF3DB] text-[#58752E]", expiring: "bg-amber-50 text-amber-700", suspended: "bg-red-50 text-red-700", expired: "bg-slate-100 text-slate-500" }[state] || "bg-slate-100 text-slate-500";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${color}`}>{stateLabels[state]}</span>;
}

export default function AdminOverview({ shops, owners, plans, invoices, setView, openShop }) {
  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));
  const subscribed = shops.filter((shop) => hasCurrentPlan(ownerMap.get(shop.ownerId)));
  const expiring = subscribed.filter((shop) => subscriptionState(ownerMap.get(shop.ownerId)) === "expiring");
  const pending = owners.filter((owner) => owner.status === "pending").length;
  const openInvoices = invoices.filter((invoice) => invoice.status === "unpaid" || invoice.status === "overdue");
  const latest = [...shops].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const monthly = Array.from({ length: 6 }, (_, index) => {
    const today = new Date();
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5 + index, 1));
    const key = date.toISOString().slice(0, 7);
    return { label: `T${date.getUTCMonth() + 1}`, count: shops.filter((shop) => shop.createdAt && new Date(shop.createdAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).startsWith(key)).length };
  });
  const maxCount = Math.max(1, ...monthly.map((item) => item.count));
  return <div className="space-y-6">
    <div className="neu-inset flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5 sm:p-6"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#6F8746]">Bức tranh toàn hệ thống</p><h2 className="mt-2 text-xl font-black">Mỗi cửa hàng, một cơ hội phát triển.</h2><p className="mt-2 text-xs text-[#6E7D7C]">Dữ liệu hiện tại từ cửa hàng, tài khoản và gói đăng ký trên MIROIR.</p></div><button onClick={() => setView("shops")} className="neu-btn-raised flex items-center gap-2 px-4 py-3 text-xs font-bold">Quản lý cửa hàng <ArrowUpRight size={15} /></button></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <NeuStatCard title="Tổng cửa hàng" value={shops.length} subtitle={`${shops.filter((shop) => shop.status === "active").length} đang hoạt động`} icon={Store} sparkline="none" />
      <NeuStatCard title="Shop có gói hiệu lực" value={subscribed.length} subtitle="Bao gồm trả phí, dùng thử và được cấp" icon={CreditCard} variant="green" sparkline="none" />
      <NeuStatCard title="Chờ duyệt tài khoản" value={pending} subtitle="Chủ shop đang chờ xét duyệt" icon={Users} sparkline="none" />
      <NeuStatCard title="Sắp hết hạn gói" value={expiring.length} subtitle="Còn tối đa 7 ngày sử dụng" icon={Clock3} sparkline="none" />
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <NeuCard><div className="flex items-center justify-between"><div><h3 className="text-sm font-black">Cửa hàng đăng ký mới</h3><p className="mt-1 text-xs text-[#96A5A4]">6 tháng gần nhất · theo ngày tạo cửa hàng</p></div><Store size={18} className="text-[#6F8746]" /></div><div className="mt-6 flex h-44 items-end gap-3" role="img" aria-label={monthly.map((item) => `${item.label}: ${item.count} cửa hàng`).join(", ")}>{monthly.map((item) => <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-bold text-[#6F8746]">{item.count}</span><div className="w-full max-w-14 rounded-t-xl bg-gradient-to-t from-[#B3D07E] to-[#DAE9C4]" style={{ height: `${Math.max(3, item.count / maxCount * 112)}px` }} /><span className="text-[11px] text-[#96A5A4]">{item.label}</span></div>)}</div></NeuCard>
      <NeuCard><h3 className="text-sm font-black">Phân bổ gói đang sử dụng</h3><p className="mt-1 text-xs text-[#96A5A4]">Tính trên shop có gói còn hiệu lực</p><div className="mt-5 space-y-4">{plans.map((plan) => {
        const count = subscribed.filter((shop) => normalizePlan(ownerMap.get(shop.ownerId)?.subscription?.planCode) === plan.code).length;
        return <div key={plan.code}><div className="mb-2 flex justify-between text-xs"><span className="font-bold">{plan.name}</span><span className="text-[#6E7D7C]">{count} shop</span></div><div className="h-2 overflow-hidden rounded-full bg-[#EEF2E7]"><div className="h-full rounded-full bg-[#B3D07E]" style={{ width: `${subscribed.length ? count / subscribed.length * 100 : 0}%` }} /></div></div>;
      })}{!plans.length && <p className="text-xs text-[#96A5A4]">Chưa có gói đăng ký.</p>}</div><button onClick={() => setView("subscriptions")} className="mt-5 flex items-center gap-2 text-xs font-bold text-[#6F8746]">Xem shop theo gói <ArrowUpRight size={14} /></button></NeuCard>
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <NeuCard padding="p-0" className="overflow-hidden"><div className="flex items-center justify-between p-5"><h3 className="text-sm font-black">Cửa hàng mới tham gia</h3><button onClick={() => setView("shops")} className="text-xs font-bold text-[#6F8746]">Xem tất cả</button></div>{latest.map((shop) => <button key={shop.id} onClick={() => openShop(shop)} className="flex w-full items-center gap-3 border-t border-[#EEF2E7] px-5 py-4 text-left hover:bg-[#F9FAF4]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1F5E8] text-[#6F8746]"><Store size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{shop.name}</p><p className="mt-1 truncate text-[11px] text-[#96A5A4]">{shop.owner?.email || "Chưa gán chủ shop"} · {dateLabel(shop.createdAt)}</p></div><SubscriptionBadge owner={ownerMap.get(shop.ownerId)} /></button>)}{!latest.length && <p className="p-8 text-center text-xs text-[#96A5A4]">Chưa có cửa hàng nào.</p>}</NeuCard>
      <NeuCard><h3 className="text-sm font-black">Cần theo dõi</h3><div className="mt-4 space-y-3">{[["Tài khoản cần phê duyệt", pending, "owners"], ["Shop sắp hết hạn gói", expiring.length, "subscriptions"], ["Hóa đơn chờ thanh toán / quá hạn", openInvoices.length, "plans"]].map(([label, count, target]) => <button key={target} onClick={() => setView(target)} className="neu-inset flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left text-xs"><span className="text-[#6E7D7C]">{label}</span><span className="font-black text-[#6F8746]">{count} <ArrowUpRight className="ml-1 inline" size={13} /></span></button>)}</div><div className="mt-5 flex items-center gap-2 text-xs text-[#6E7D7C]"><Package size={16} />{shops.reduce((sum, shop) => sum + (shop.productCount || 0), 0).toLocaleString("vi-VN")} sản phẩm trên hệ thống</div></NeuCard>
    </div>
  </div>;
}

export function AdminSubscriptions({ shops, owners, plans, openShop }) {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const rows = useMemo(() => {
    const byId = new Map(owners.map((owner) => [owner.id, owner]));
    return shops.map((shop) => ({ shop, owner: byId.get(shop.ownerId) })).filter(({ shop, owner }) => {
      const sub = owner?.subscription;
      return `${shop.name} ${shop.slug} ${owner?.email || ""}`.toLowerCase().includes(search.toLowerCase())
        && (plan === "all" || (plan === "FREE" ? !sub?.planCode || sub.planCode === "FREE" : normalizePlan(sub?.planCode) === plan))
        && (status === "all" || subscriptionState(owner) === status)
        && (source === "all" || (source === "paid" ? sub?.planCode && sub.planCode !== "FREE" && !sub.grantType : sub?.grantType === source));
    });
  }, [shops, owners, search, plan, status, source]);
  const inputClass = "w-full rounded-xl border border-[#DCE4D6] bg-white px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#B3D07E]";
  return <NeuCard padding="p-0" className="overflow-hidden"><div className="p-5"><h2 className="text-sm font-black">Shop & gói đăng ký</h2><p className="mt-1 text-xs text-[#96A5A4]">{rows.length} cửa hàng · Gói được gắn với tài khoản chủ shop. Sắp hết hạn: trong 7 ngày.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="relative"><Search size={14} className="absolute left-3 top-3 text-[#96A5A4]" /><input aria-label="Tìm shop theo gói" className={`${inputClass} pl-9`} placeholder="Tên shop, email, slug..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><select aria-label="Lọc gói" className={inputClass} value={plan} onChange={(event) => setPlan(event.target.value)}><option value="all">Tất cả gói</option><option value="FREE">Chưa đăng ký</option>{plans.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select><select aria-label="Lọc hiệu lực" className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tất cả trạng thái gói</option>{Object.entries(stateLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><select aria-label="Lọc hình thức đăng ký" className={inputClass} value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Tất cả hình thức</option><option value="paid">Trả phí</option><option value="trial">Dùng thử</option><option value="admin_grant">Admin cấp</option></select></div></div>
    <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="bg-[#F1F5E8] text-[#6E7D7C]"><tr>{["Cửa hàng / Chủ shop", "Gói đăng ký", "Hình thức", "Hiệu lực gói", "Ngày hết hạn", "Quản lý"].map((label) => <th key={label} className="px-5 py-3 font-bold">{label}</th>)}</tr></thead><tbody>{rows.map(({ shop, owner }) => {
      const sub = owner?.subscription;
      const selectedPlan = plans.find((item) => item.code === normalizePlan(sub?.planCode));
      return <tr key={shop.id} className="border-t border-[#EEF2E7] hover:bg-[#F9FAF4]"><td className="px-5 py-4"><p className="font-bold">{shop.name}</p><p className="mt-1 text-[11px] text-[#96A5A4]">{owner?.email || "Chưa gán chủ shop"}</p><p className="mt-1 text-[10px] text-[#96A5A4]">{shop.status === "active" ? "Shop hoạt động" : "Shop ngừng hoạt động"}</p></td><td className="px-5 py-4"><p className="font-bold">{selectedPlan?.name || sub?.planCode || "Chưa đăng ký"}</p>{selectedPlan && <p className="mt-1 text-[10px] text-[#96A5A4]">Giá hiện tại: {moneyLabel(selectedPlan.amount)}/tháng</p>}</td><td className="px-5 py-4">{!sub?.planCode || sub.planCode === "FREE" ? "—" : sub.grantType === "trial" ? "Dùng thử" : sub.grantType ? "Admin cấp" : "Trả phí"}</td><td className="px-5 py-4"><SubscriptionBadge owner={owner} /></td><td className="px-5 py-4">{dateLabel(sub?.expiresAt)}</td><td className="px-5 py-4"><button onClick={() => openShop(shop)} className="neu-icon-btn h-8 w-8 text-[#6F8746]" aria-label={`Quản lý ${shop.name}`}><ArrowUpRight size={16} /></button></td></tr>;
    })}</tbody></table>{!rows.length && <div className="p-12 text-center"><Store size={28} className="mx-auto text-[#B3D07E]" /><p className="mt-3 text-xs text-[#96A5A4]">Không có cửa hàng phù hợp với bộ lọc.</p></div>}</div>
  </NeuCard>;
}
