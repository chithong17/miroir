import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CustomerReport, { reportSections } from "./CustomerReport.jsx";
import { Download, Maximize2, RefreshCw, Search, X } from "lucide-react";
import { getAdminCustomerAnalytics } from "../../api/adminApi.js";
import { NeuCard } from "../seller/NeuComponents.jsx";

const number = (value) => new Intl.NumberFormat("vi-VN").format(value || 0);
const date = (value) => value ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const fieldClass = "min-h-11 rounded-xl border border-[#DCE4D6] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#B3D07E]";
const usageLabels = { product_view: "Lượt xem sản phẩm", tryon_started: "Lượt bắt đầu thử đồ", stylist_product_recommended: "Lượt sản phẩm được AI gợi ý", product_feedback: "Lượt phản hồi sản phẩm" };

function exportReport(report) {
  const rows = [
    ["Thống kê customer MIROIR", "Dữ liệu từ hệ thống, không gồm shop owner/admin"],
    ["Từ", date(report.start)], ["Đến", date(report.end)], ["Múi giờ", report.timezone],
    ...(report.insights ? [["Tổng tài khoản đến cuối kỳ", report.insights.registeredAtEnd], ["DAU (ngày cuối kỳ)", report.insights.dau], ["WAU (7 ngày đến cuối kỳ)", report.insights.wau], ["MAU (30 ngày đến cuối kỳ)", report.insights.mau], ["Engagement Rate (MAU / tổng tài khoản đến cuối kỳ, %)", report.insights.engagementRate]] : []),
    ["Tổng customer hiện có", report.summary.total], ["Đăng ký mới trong kỳ", report.summary.newInRange],
    ["Customer có hoạt động trong kỳ", report.summary.activeInRange], ["Tỷ lệ hoạt động (%)", report.summary.activityRate],
    ["Hồ sơ hoàn tất (toàn bộ)", report.summary.completedProfiles], ["Đơn tạo trong kỳ", report.summary.orders],
    ["Customer có đơn đã thanh toán, không hủy/hết hạn (đơn tạo trong kỳ)", report.summary.payingCustomers],
    ...Object.entries(report.usage).map(([key, value]) => [usageLabels[key], value]),
    [], ["Ngày đăng ký (giờ Việt Nam)", "Customer mới"], ...report.daily.map((row) => [row.date, row.count]),
    ...(report.insights ? [[], ["Ngày", "Tài khoản tích lũy"], ...report.insights.growth.map(row => [row.date, row.registered]), [], ["Ngày", "Người hoạt động duy nhất", "Sự kiện tính năng"], ...report.insights.daily.map(row => [row.date, row.activeUsers, row.featureEvents])] : []),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `miroir-customers-${report.range}-${report.daily.at(-1)?.date}.csv`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminCustomers({ refreshing = false }) {
  const [presenting, setPresenting] = useState(false);
  const [section, setSection] = useState("acquisition");
  const [range, setRange] = useState("30d");
  const [month, setMonth] = useState("");
  const [registrationView, setRegistrationView] = useState("month");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    if (refreshing) return;
    setLoading(true); setError("");
    const timer = setTimeout(() => {
      getAdminCustomerAnalytics({ range, month: month || undefined, search, status, page }).then((result) => {
        if (!cancelled) setReport(result.analytics);
      }).catch((failure) => {
        if (!cancelled) setError(failure.response?.data?.message || "Không tải được thống kê khách hàng. Vui lòng thử lại.");
      }).finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [range, month, search, status, page, revision, refreshing]);

  useEffect(() => {
    if (!presenting) return;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const close = (event) => {
      if (event.key === "Escape") setPresenting(false);
      if (event.key === "Tab") {
        const buttons = [...(document.getElementById("customer-report-dialog")?.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex='0']") || [])].filter(element => element.getClientRects().length > 0);
        const first = buttons[0], last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", close); previousFocus?.focus(); };
  }, [presenting]);

  const renderReport = () => <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E3E9DB] pb-5">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#81916E]">MIROIR · User acquisition & engagement</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-[#23352B] sm:text-3xl">{section === "acquisition" ? "Quy mô khách hàng" : section === "engagement" ? "Khách hàng có hoạt động" : "Mức độ sử dụng sản phẩm"}</h2><p className="mt-2 text-xs leading-5 text-[#7A8579]">{date(report.start)} – {date(report.end)} · Giờ Việt Nam</p></div>
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-[#E3E9DB] bg-white p-1" aria-label="Nội dung báo cáo">{reportSections.map(item => <button key={item.id} type="button" aria-pressed={section === item.id} onClick={() => setSection(item.id)} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-semibold transition ${section === item.id ? "bg-[#344B32] text-white" : "text-[#7A8579] hover:bg-[#F1F5E9]"}`}>{item.label}</button>)}</div>
    </div>
    <CustomerReport report={report} section={section} registrationView={registrationView} onRegistrationViewChange={setRegistrationView} onMonthSelect={(value) => { setMonth(value); if (!value) setRange("90d"); }} />
    <p className="text-[10px] text-[#8A9485]">Cập nhật dữ liệu: {date(report.generatedAt)}</p>
  </div>;

  return <div className="space-y-6 py-5" aria-hidden={presenting || undefined}>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-[#6F8746]">Customer analytics</p><h1 className="mt-2 text-2xl font-black">Khách hàng đăng ký & sử dụng</h1><p className="mt-2 max-w-2xl text-sm text-[#6E7D7C]">Chỉ thống kê tài khoản customer hiện có. Không cộng tài khoản chủ shop hoặc admin. Múi giờ Việt Nam.</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!report || loading || refreshing || Boolean(error)} onClick={() => setPresenting(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DCE4D6] bg-white px-4 text-sm font-bold text-[#526D38] disabled:opacity-50"><Maximize2 size={16} />Chế độ trình bày</button>
        <select aria-label="Khoảng thời gian thống kê customer" className={fieldClass} value={month ? "month" : range} onChange={(event) => { if (event.target.value !== "month") { setRange(event.target.value); setMonth(""); } }}>{month && <option value="month">Th&#225;ng {month.slice(5)}/{month.slice(0, 4)}</option>}<option value="7d">7 ngày gần nhất</option><option value="30d">30 ngày gần nhất</option><option value="90d">90 ngày gần nhất</option></select>
        <button type="button" aria-label="Làm mới thống kê customer" disabled={loading || refreshing} onClick={() => setRevision((value) => value + 1)} className="neu-icon-btn h-11 w-11 disabled:opacity-50"><RefreshCw size={16} /></button>
        <button type="button" disabled={!report || loading || refreshing || Boolean(error)} onClick={() => exportReport(report)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#526D38] px-4 text-sm font-bold text-white disabled:opacity-50"><Download size={16} />Xuất CSV</button>
      </div>
    </header>
    {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => setRevision((value) => value + 1)} className="ml-3 underline">Thử lại</button></div> : null}
    {(loading || refreshing) && report && <p role="status" className="text-sm text-[#6F8746]">Đang cập nhật dữ liệu…</p>}
    {(loading || refreshing) && !report ? <NeuCard><p role="status" className="py-10 text-center text-sm text-[#6F8746]">Đang tải dữ liệu khách hàng…</p></NeuCard> : !error && report ? <>
      {renderReport()}
      <NeuCard padding="p-0" className="overflow-hidden"><div className="p-5"><h2 className="text-base font-black">Danh sách customer</h2><p className="mt-1 text-xs text-[#6E7D7C]">Toàn thời gian, sắp xếp đăng ký mới nhất. Bộ lọc dưới đây chỉ áp dụng cho danh sách.</p><div className="mt-4 flex flex-wrap gap-3"><div className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-3.5 text-[#6E7D7C]" /><input aria-label="Tìm customer theo tên hoặc email" placeholder="Tìm tên hoặc email customer…" className={`${fieldClass} w-full pl-9`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div><select aria-label="Trạng thái tài khoản customer" className={fieldClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">Tất cả trạng thái</option><option value="active">Được phép sử dụng</option><option value="other">Trạng thái khác</option></select></div></div>
        <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="bg-[#F1F5E8]"><tr>{["Khách hàng", "Email", "Ngày đăng ký (VN)", "Tài khoản", "Hồ sơ"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody>{report.customers.map((customer) => <tr key={customer.id} className="border-t border-[#EEF2E7]"><td className="px-5 py-4 font-bold">{customer.name || "Chưa có tên"}</td><td className="px-5 py-4">{customer.email}</td><td className="px-5 py-4">{date(customer.createdAt)}</td><td className="px-5 py-4">{customer.status === "active" ? "Được phép sử dụng" : customer.status || "—"}</td><td className="px-5 py-4">{customer.profileCompleted ? "Đã hoàn tất" : customer.profileSkipped ? "Đã bỏ qua" : "Chưa thiết lập"}</td></tr>)}</tbody></table></div>
        {!report.customers.length && <p className="p-8 text-center text-sm text-[#6E7D7C]">Không có customer phù hợp.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF2E7] p-5 text-xs"><span>{number(report.pagination.total)} customer · Trang {page}/{report.pagination.totalPages}</span><div className="flex gap-2"><button className={fieldClass} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</button><button className={fieldClass} disabled={page >= report.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div></div>
      </NeuCard>
    </> : null}
    {presenting && report && createPortal(<div id="customer-report-dialog" role="dialog" aria-modal="true" aria-label="Báo cáo khách hàng MIROIR" className="fixed inset-0 z-[250] overflow-y-auto bg-[#F6F8F1] text-[#23352B]">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-8 sm:py-6 lg:px-12">
        <div className="mb-5 flex items-center justify-between gap-4"><span className="text-sm font-black tracking-[0.22em] text-[#344B32]">MIROIR</span><button autoFocus type="button" onClick={() => setPresenting(false)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#DCE4D6] bg-white px-4 text-xs font-semibold text-[#6E7D7C]"><X size={15} />Đóng trình bày · Esc</button></div>
        {renderReport()}
        {(loading || refreshing) && <p role="status" className="mt-3 text-xs text-[#526D38]">Đang cập nhật số liệu…</p>}
        {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
      </div>
    </div>, document.body)}
  </div>;
}
