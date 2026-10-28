import { Activity, ArrowUpRight, CheckCircle2, Eye, Shirt, Sparkles, Users } from "lucide-react";

const number = (value) => new Intl.NumberFormat("vi-VN").format(value || 0);
const percent = (part, total) => total > 0 ? Math.round(part / total * 1000) / 10 : 0;
const shortDate = (value) => value ? `${value.slice(8, 10)}/${value.slice(5, 7)}` : "—";
export const reportSections = [{ id: "acquisition", label: "01 · Đăng ký" }, { id: "engagement", label: "02 · Hoạt động" }, { id: "usage", label: "03 · Sử dụng" }];
const usageItems = [
  { key: "product_view", label: "Xem sản phẩm", unit: "lượt xem", icon: Eye, color: "#526C42" },
  { key: "tryon_started", label: "Bắt đầu thử đồ", unit: "lượt bắt đầu", icon: Shirt, color: "#8DA76C" },
  { key: "stylist_product_recommended", label: "Sản phẩm được Stylist gợi ý", unit: "lượt sản phẩm", icon: Sparkles, color: "#BD9A62" },
  { key: "product_feedback", label: "Phản hồi sản phẩm", unit: "lượt phản hồi", icon: CheckCircle2, color: "#718D91" },
];

function Metric({ label, value, note, icon: Icon, featured = false }) {
  return <div className={`min-w-0 rounded-[22px] border p-5 ${featured ? "border-[#344B32] bg-[#344B32] text-white" : "border-[#E3E9DB] bg-white text-[#23352B]"}`}>
    <div className={`flex items-center justify-between gap-2 text-xs font-semibold ${featured ? "text-[#D8E5CB]" : "text-[#6A786B]"}`}><span>{label}</span><Icon size={17} className="shrink-0" /></div>
    <p className="mt-4 text-4xl font-black tracking-tight tabular-nums sm:text-[42px]">{value}</p>
    <p className={`mt-2 text-xs leading-5 ${featured ? "text-[#D8E5CB]" : "text-[#7A8579]"}`}>{note}</p>
  </div>;
}

function Panel({ eyebrow, title, description, children, className = "" }) {
  return <section className={`min-w-0 rounded-[26px] border border-[#E3E9DB] bg-white p-5 ${className}`}>
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#81916E]">{eyebrow}</p>
    <h3 className="mt-2 text-lg font-bold tracking-tight text-[#23352B] sm:text-xl">{title}</h3>
    {description && <p className="mt-1.5 text-xs leading-5 text-[#7A8579]">{description}</p>}
    {children}
  </section>;
}

function RegistrationChart({ daily }) {
  const width = 720, height = 180, left = 42, right = 18, top = 22, bottom = 30;
  const plotW = width - left - right, plotH = height - top - bottom;
  const max = Math.max(1, ...daily.map(row => row.count));
  const step = Math.max(1, Math.ceil(max / 4));
  const ceiling = step * 4;
  const barW = plotW / Math.max(1, daily.length);
  const tickIndices = [...new Set([0, Math.floor((daily.length - 1) / 3), Math.floor((daily.length - 1) * 2 / 3), daily.length - 1])].filter(i => i >= 0);
  const peak = daily.reduce((best, row) => row.count > (best?.count || 0) ? row : best, null);
  return <>
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label={`Đăng ký theo ngày, ${number(daily.reduce((sum, row) => sum + row.count, 0))} tài khoản trong kỳ`}>
      {[0, 1, 2, 3, 4].map(i => {
        const y = top + plotH - plotH * i / 4;
        return <g key={i}><line x1={left} x2={width - right} y1={y} y2={y} stroke="#E8EDE3" strokeDasharray={i ? "4 5" : undefined} /><text x={left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#889283">{number(step * i)}</text></g>;
      })}
      {daily.map((row, i) => {
        const h = row.count / ceiling * plotH;
        const x = left + i * barW + barW * 0.15;
        return <g key={row.date}><title>{row.date}: {row.count} đăng ký</title><rect x={x} y={top + plotH - h} width={barW * 0.7} height={h} rx={Math.min(4, barW / 5)} fill={row.date === peak?.date ? "#344B32" : "#A4BB83"} />{row.date === peak?.date && <text x={x + barW * 0.35} y={top + plotH - h - 8} textAnchor="middle" fontWeight="700" fontSize="12" fill="#344B32">{row.count}</text>}</g>;
      })}
      {tickIndices.map(i => <text key={i} x={left + (i + 0.5) * barW} y={height - 10} textAnchor="middle" fontSize="11" fill="#889283">{shortDate(daily[i]?.date)}</text>)}
    </svg>
    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[#7A8579]"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#A4BB83]" />Số tài khoản mới / ngày</span><span>{peak ? `Cao nhất: ${number(peak.count)} · ${shortDate(peak.date)}` : "Chưa có đăng ký trong kỳ"}</span></div>
  </>;
}

function ActivityRing({ active, total }) {
  const rate = percent(active, total);
  return <div className="relative mx-auto my-4 h-52 w-52">
    <svg viewBox="0 0 200 200" role="img" aria-label={`${number(active)} trên ${number(total)} tài khoản có hoạt động, ${rate}%`} className="h-full w-full -rotate-90">
      <circle cx="100" cy="100" r="78" fill="none" stroke="#EEF2E8" strokeWidth="20" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#6C8950" strokeWidth="20" pathLength="100" strokeDasharray={`${Math.min(100, rate)} 100`} strokeLinecap={rate > 0 ? "round" : "butt"} />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-black tracking-tight text-[#344B32]">{number(rate)}%</span><span className="mt-2 text-xs text-[#7A8579]">Có hoạt động trong kỳ</span></div>
  </div>;
}

function UsageChart({ usage }) {
  const max = Math.max(1, ...usageItems.map(item => usage[item.key] || 0));
  return <div className="mt-6 space-y-5">
    {usageItems.map(({ key, label, unit, icon: Icon, color }) => <div key={key}>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 font-medium text-[#526155]"><Icon size={15} className="shrink-0" />{label}</span><span className="shrink-0 text-right"><strong className="text-lg font-bold tabular-nums text-[#23352B]">{number(usage[key])}</strong><span className="ml-2 hidden text-[10px] text-[#7A8579] sm:inline">{unit}</span></span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#F0F3EB]" role="img" aria-label={`${label}: ${number(usage[key])} ${unit}`}><div className="h-full rounded-full" style={{ width: `${(usage[key] || 0) / max * 100}%`, background: color }} /></div>
    </div>)}
    <p className="pt-1 text-[11px] leading-5 text-[#7A8579]">Các chỉ số có đơn vị khác nhau; không cộng thành số người dùng hoặc tỷ lệ chuyển đổi.</p>
  </div>;
}

export default function CustomerReport({ report, section = "acquisition" }) {
  const { summary: s, daily = [], usage = {} } = report;
  const noActivity = Math.max(0, s.total - s.activeInRange);
  return <div className="space-y-4">
    {section === "acquisition" && <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tài khoản khách hàng" value={number(s.total)} note="Tổng tài khoản hiện có trên hệ thống" icon={Users} featured />
        <Metric label="Đăng ký mới trong kỳ" value={number(s.newInRange)} note={`${daily.length} ngày · gồm cả hôm nay`} icon={ArrowUpRight} />
        <Metric label="Có hoạt động trong kỳ" value={number(s.activeInRange)} note={`${number(s.activityRate)}% tổng tài khoản khách hàng`} icon={Activity} />
        <Metric label="Đã hoàn tất hồ sơ" value={number(s.completedProfiles)} note={`${number(percent(s.completedProfiles, s.total))}% tổng tài khoản · toàn thời gian`} icon={CheckCircle2} />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.8fr_1fr]">
        <Panel eyebrow="Acquisition" title="Đăng ký mới theo ngày" description="Phân bố theo ngày đăng ký đang lưu, múi giờ Việt Nam."><RegistrationChart daily={daily} /><div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#EEF2E8] pt-4">{[["Hôm nay", s.today], ["7 ngày gần nhất", s.new7d], ["30 ngày gần nhất", s.new30d]].map(([label, value]) => <div key={label}><p className="text-xl font-bold text-[#344B32]">{number(value)}</p><p className="mt-1 text-[10px] text-[#7A8579]">{label}</p></div>)}</div></Panel>
        <Panel eyebrow="Engagement" title="Tỷ lệ có hoạt động" description="Tài khoản có ít nhất một hành vi được ghi nhận."><ActivityRing active={s.activeInRange} total={s.total} /><div className="space-y-2 text-xs"><div className="flex justify-between gap-3"><span className="flex items-center gap-2 text-[#7A8579]"><span className="h-2 w-2 rounded-full bg-[#6C8950]" />Có hoạt động</span><strong>{number(s.activeInRange)}</strong></div><div className="flex justify-between gap-3"><span className="flex items-center gap-2 text-[#7A8579]"><span className="h-2 w-2 rounded-full bg-[#DCE4D2]" />Chưa ghi nhận trong kỳ</span><strong>{number(noActivity)}</strong></div></div></Panel>
      </div>
    </>}
    {section === "engagement" && <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Metric label="Khách hàng có hoạt động" value={number(s.activeInRange)} note={`Tài khoản duy nhất trong ${daily.length} ngày`} icon={Activity} featured /><Metric label="Tỷ lệ có hoạt động" value={`${number(s.activityRate)}%`} note="Trên tổng tài khoản khách hàng hiện có" icon={Users} /><Metric label="Hồ sơ đã hoàn tất" value={number(s.completedProfiles)} note="Số hồ sơ hoàn tất toàn thời gian" icon={CheckCircle2} /></div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel eyebrow="Active customers" title="Hoạt động trong kỳ"><ActivityRing active={s.activeInRange} total={s.total} /><div className="grid grid-cols-2 gap-3 text-center"><div className="rounded-2xl bg-[#F2F6ED] p-4"><p className="text-2xl font-bold text-[#344B32]">{number(s.activeInRange)}</p><p className="mt-1 text-xs text-[#7A8579]">Có hoạt động</p></div><div className="rounded-2xl bg-[#F7F8F4] p-4"><p className="text-2xl font-bold text-[#7A8579]">{number(noActivity)}</p><p className="mt-1 text-xs text-[#7A8579]">Chưa ghi nhận trong kỳ</p></div></div></Panel>
        <Panel eyebrow="Measurement" title="Một khách hàng được tính khi…" description="Có ít nhất một trong các hành vi sau trong kỳ thống kê:"><div className="mt-4 space-y-2">{["Xem sản phẩm", "Bắt đầu thử đồ AI", "Được Stylist gợi ý sản phẩm", "Gửi phản hồi sản phẩm", "Tạo đơn hàng"].map((label, i) => <div key={label} className="flex items-center gap-3 rounded-xl bg-[#F6F8F2] p-2 text-sm text-[#526155]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#81916E]">{i + 1}</span>{label}</div>)}</div><p className="mt-5 text-xs leading-5 text-[#7A8579]">Mỗi tài khoản chỉ đếm một lần, dù có nhiều hành vi. Trạng thái tài khoản “active” không phải số người dùng hoạt động; chỉ số này không phải tỷ lệ giữ chân.</p></Panel>
      </div>
    </>}
    {section === "usage" && <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{usageItems.map(item => <Metric key={item.key} label={item.label} value={number(usage[item.key])} note={`${item.unit} trong ${daily.length} ngày`} icon={item.icon} featured={item.key === "product_view"} />)}</div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]"><Panel eyebrow="Feature usage" title="Mức độ sử dụng tính năng" description="Số lượt được hệ thống ghi nhận trong kỳ đã chọn."><UsageChart usage={usage} /></Panel><Panel eyebrow="Reading the data" title="Đọc đúng số liệu"><div className="mt-5 space-y-5 text-sm leading-6 text-[#526155]"><p><strong className="text-[#344B32]">Try-On</strong><br />Đếm lượt bắt đầu thử đồ, không đồng nghĩa với lượt tạo ảnh thành công.</p><p><strong className="text-[#344B32]">Stylist AI</strong><br />Đếm từng sản phẩm được gợi ý, không phải số phiên trò chuyện hoặc số người dùng.</p><p><strong className="text-[#344B32]">Phạm vi</strong><br />Chỉ gồm hoạt động có tài khoản customer được lưu; không bao gồm toàn bộ lượt truy cập ẩn danh.</p></div></Panel></div>
    </>}
    <p className="text-[10px] leading-5 text-[#8A9485]">Nguồn: bản ghi hệ thống MIROIR · Chỉ tài khoản khách hàng, không gồm chủ shop/admin · Bao gồm tài khoản thử nghiệm nếu có.</p>
  </div>;
}
