import { useEffect, useState } from "react";
import { Activity, Download, RefreshCw, Search, UserCheck, UserPlus, Users } from "lucide-react";
import { getAdminCustomerAnalytics } from "../../api/adminApi.js";
import { NeuCard, NeuStatCard } from "../seller/NeuComponents.jsx";

const number = (value) => new Intl.NumberFormat("vi-VN").format(value || 0);
const date = (value) => value ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const fieldClass = "min-h-11 rounded-xl border border-[#DCE4D6] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#B3D07E]";
const usageLabels = { product_view: "Lượt xem sản phẩm", tryon_started: "Lượt bắt đầu thử đồ", stylist_product_recommended: "Lượt sản phẩm được AI gợi ý", product_feedback: "Lượt phản hồi sản phẩm" };

function exportReport(report) {
  const rows = [
    ["Thống kê customer MIROIR", "Dữ liệu từ hệ thống, không gồm shop owner/admin"],
    ["Từ", date(report.start)], ["Đến", date(report.end)], ["Múi giờ", report.timezone],
    ["Tổng customer hiện có", report.summary.total], ["Đăng ký mới trong kỳ", report.summary.newInRange],
    ["Customer có hoạt động trong kỳ", report.summary.activeInRange], ["Tỷ lệ hoạt động (%)", report.summary.activityRate],
    ["Hồ sơ hoàn tất (toàn bộ)", report.summary.completedProfiles], ["Đơn tạo trong kỳ", report.summary.orders],
    ["Customer có đơn đã thanh toán, không hủy/hết hạn (đơn tạo trong kỳ)", report.summary.payingCustomers],
    ...Object.entries(report.usage).map(([key, value]) => [usageLabels[key], value]),
    [], ["Ngày đăng ký (giờ Việt Nam)", "Customer mới"], ...report.daily.map((row) => [row.date, row.count]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `miroir-customers-${report.range}-${report.daily.at(-1)?.date}.csv`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminCustomers({ refreshing = false }) {
  const [range, setRange] = useState("30d");
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
      getAdminCustomerAnalytics({ range, search, status, page }).then((result) => {
        if (!cancelled) setReport(result.analytics);
      }).catch((failure) => {
        if (!cancelled) setError(failure.response?.data?.message || "Không tải được thống kê khách hàng. Vui lòng thử lại.");
      }).finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [range, search, status, page, revision, refreshing]);

  const summary = report?.summary;
  const max = Math.max(1, ...(report?.daily || []).map((row) => row.count));
  return <div className="space-y-6 py-5">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-[#6F8746]">Customer analytics</p><h1 className="mt-2 text-2xl font-black">Khách hàng đăng ký & sử dụng</h1><p className="mt-2 max-w-2xl text-sm text-[#6E7D7C]">Chỉ thống kê tài khoản customer hiện có. Không cộng tài khoản chủ shop hoặc admin. Múi giờ Việt Nam.</p></div>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Khoảng thời gian thống kê customer" className={fieldClass} value={range} onChange={(event) => setRange(event.target.value)}><option value="7d">7 ngày gần nhất</option><option value="30d">30 ngày gần nhất</option><option value="90d">90 ngày gần nhất</option></select>
        <button type="button" aria-label="Làm mới thống kê customer" disabled={loading || refreshing} onClick={() => setRevision((value) => value + 1)} className="neu-icon-btn h-11 w-11 disabled:opacity-50"><RefreshCw size={16} /></button>
        <button type="button" disabled={!report || loading || refreshing || Boolean(error)} onClick={() => exportReport(report)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#526D38] px-4 text-sm font-bold text-white disabled:opacity-50"><Download size={16} />Xuất CSV</button>
      </div>
    </header>
    {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => setRevision((value) => value + 1)} className="ml-3 underline">Thử lại</button></div> : null}
    {(loading || refreshing) && report && <p role="status" className="text-sm text-[#6F8746]">Đang cập nhật dữ liệu…</p>}
    {(loading || refreshing) && !report ? <NeuCard><p role="status" className="py-10 text-center text-sm text-[#6F8746]">Đang tải dữ liệu khách hàng…</p></NeuCard> : !error && report ? <>
      <p className="text-xs text-[#6E7D7C]">Kỳ: {date(report.start)} – {date(report.end)} · Cập nhật: {date(report.generatedAt)}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NeuStatCard icon={Users} title="Tổng customer" value={number(summary.total)} subtitle="Tài khoản hiện có, toàn thời gian" sparkline="none" />
        <NeuStatCard icon={UserPlus} title="Đăng ký mới trong kỳ" value={number(summary.newInRange)} subtitle={`Hôm nay: ${number(summary.today)} · 7 ngày: ${number(summary.new7d)} · 30 ngày: ${number(summary.new30d)}`} sparkline="none" variant="green" />
        <NeuStatCard icon={Activity} title="Customer có hoạt động" value={number(summary.activeInRange)} subtitle={`${summary.activityRate}% trên tổng customer hiện có, trong kỳ`} sparkline="none" />
        <NeuStatCard icon={UserCheck} title="Đã hoàn tất hồ sơ" value={number(summary.completedProfiles)} subtitle={`${number(summary.enabled)} tài khoản đang được phép sử dụng`} sparkline="none" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <NeuCard><h2 className="text-base font-black">Customer đăng ký theo ngày</h2><p className="mt-1 text-xs text-[#6E7D7C]">{number(summary.newInRange)} đăng ký mới trong {report.daily.length} ngày, gồm cả hôm nay.</p>
          <div role="img" aria-label={`Biểu đồ đăng ký ${report.daily.length} ngày, tổng ${summary.newInRange} customer`} className="mt-6 flex h-44 items-end gap-1 border-b border-[#DCE4D6]">
            {report.daily.map((row) => <div key={row.date} title={`${row.date}: ${row.count} customer`} className="flex h-full min-w-0 flex-1 items-end"><div className="w-full rounded-t bg-[#87A85C]" style={{ height: row.count ? `${Math.max(3, row.count / max * 100)}%` : "2px", opacity: row.count ? 1 : 0.25 }} /></div>)}
          </div><div className="mt-2 flex justify-between text-[11px] text-[#6E7D7C]"><span>{report.daily[0]?.date}</span><span>{report.daily.at(-1)?.date}</span></div>
          {!summary.newInRange && <p className="mt-3 text-sm text-[#6E7D7C]">Chưa có customer đăng ký mới trong kỳ này.</p>}
          <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold text-[#526D38]">Xem số liệu từng ngày</summary><div className="mt-3 max-h-52 overflow-auto"><table className="w-full text-left text-xs"><thead><tr><th className="py-2">Ngày</th><th>Đăng ký mới</th></tr></thead><tbody>{report.daily.map((row) => <tr key={row.date} className="border-t border-[#EEF2E7]"><td className="py-2">{row.date}</td><td>{number(row.count)}</td></tr>)}</tbody></table></div></details>
        </NeuCard>
        <NeuCard><h2 className="text-base font-black">Mức độ sử dụng trong kỳ</h2><dl className="mt-4 divide-y divide-[#E7EDDF]">{Object.entries(report.usage).map(([key, value]) => <div key={key} className="flex items-center justify-between gap-3 py-3 text-sm"><dt>{usageLabels[key]}</dt><dd className="font-black tabular-nums">{number(value)}</dd></div>)}<div className="flex justify-between gap-3 py-3 text-sm"><dt>Đơn hàng tạo trong kỳ</dt><dd className="font-black">{number(summary.orders)}</dd></div><div className="flex justify-between gap-3 py-3 text-sm"><dt>Customer có đơn đã thanh toán*</dt><dd className="font-black">{number(summary.payingCustomers)}</dd></div></dl><p className="mt-3 text-xs leading-5 text-[#6E7D7C]">*Đơn tạo trong kỳ, hiện đã thanh toán và không bị hủy/hết hạn. Một customer chỉ tính một lần.</p></NeuCard>
      </div>
      <NeuCard><h2 className="text-sm font-black">Cách đọc chỉ số</h2><p className="mt-2 text-xs leading-6 text-[#6E7D7C]">Customer có hoạt động là tài khoản duy nhất có sự kiện xem sản phẩm, bắt đầu thử đồ, sản phẩm được AI gợi ý, phản hồi sản phẩm hoặc tạo đơn trong kỳ. Không đồng nghĩa với trạng thái tài khoản “active”, không phải tỷ lệ giữ chân. AI gợi ý được đếm theo sản phẩm, không phải số phiên trò chuyện. Chỉ tính hành vi có lưu trong hệ thống; không suy ra lượt đăng nhập hay thêm giỏ từ dữ liệu chưa được theo dõi. Tài khoản đã xóa không nằm trong báo cáo.</p></NeuCard>
      <NeuCard padding="p-0" className="overflow-hidden"><div className="p-5"><h2 className="text-base font-black">Danh sách customer</h2><p className="mt-1 text-xs text-[#6E7D7C]">Toàn thời gian, sắp xếp đăng ký mới nhất. Bộ lọc dưới đây chỉ áp dụng cho danh sách.</p><div className="mt-4 flex flex-wrap gap-3"><div className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-3.5 text-[#6E7D7C]" /><input aria-label="Tìm customer theo tên hoặc email" placeholder="Tìm tên hoặc email customer…" className={`${fieldClass} w-full pl-9`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div><select aria-label="Trạng thái tài khoản customer" className={fieldClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">Tất cả trạng thái</option><option value="active">Được phép sử dụng</option><option value="other">Trạng thái khác</option></select></div></div>
        <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="bg-[#F1F5E8]"><tr>{["Khách hàng", "Email", "Ngày đăng ký (VN)", "Tài khoản", "Hồ sơ"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody>{report.customers.map((customer) => <tr key={customer.id} className="border-t border-[#EEF2E7]"><td className="px-5 py-4 font-bold">{customer.name || "Chưa có tên"}</td><td className="px-5 py-4">{customer.email}</td><td className="px-5 py-4">{date(customer.createdAt)}</td><td className="px-5 py-4">{customer.status === "active" ? "Được phép sử dụng" : customer.status || "—"}</td><td className="px-5 py-4">{customer.profileCompleted ? "Đã hoàn tất" : customer.profileSkipped ? "Đã bỏ qua" : "Chưa thiết lập"}</td></tr>)}</tbody></table></div>
        {!report.customers.length && <p className="p-8 text-center text-sm text-[#6E7D7C]">Không có customer phù hợp.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF2E7] p-5 text-xs"><span>{number(report.pagination.total)} customer · Trang {page}/{report.pagination.totalPages}</span><div className="flex gap-2"><button className={fieldClass} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</button><button className={fieldClass} disabled={page >= report.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div></div>
      </NeuCard>
    </> : null}
  </div>;
}
