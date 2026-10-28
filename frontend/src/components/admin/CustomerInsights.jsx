import { Activity, Users, UserPlus, Shirt, Palette, Eye, MessageSquare } from "lucide-react";

const number = value => new Intl.NumberFormat("vi-VN").format(value || 0);
const dateLabel = date => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

export function InsightMetrics({ report }) {
  const i = report.insights;
  const items = [
    { label: "Tổng khách hàng", value: number(i.registeredAtEnd), icon: Users, note: "Đến cuối kỳ" },
    { label: "Hoạt động 30 ngày", value: number(i.mau), icon: Activity, note: "Khách hàng duy nhất" },
    { label: "Khách hàng mới", value: number(report.summary.newInRange), icon: UserPlus, note: "Trong kỳ" },
    { label: "Tỷ lệ hoạt động", value: `${number(i.engagementRate)}%`, icon: Activity, note: "Hoạt động / Tổng khách hàng" },
  ];
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(({ label, value, icon: Icon, note }, index) => <div key={label} className="min-w-0 rounded-3xl border border-[#E0E7D8] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-2 text-sm font-semibold text-[#65745F]"><span>{label}</span><Icon size={18} className="shrink-0 text-[#8A9D7C]" /></div><p className={`mt-5 text-[42px] font-black leading-none tracking-tight tabular-nums ${index === 0 ? "text-[#527D3D]" : "text-[#23352B]"}`}>{value}</p><p className="mt-3 text-xs text-[#7B8777]">{note}</p></div>)}</div>;
}

function ChartCard({ number: index, title, subtitle, children, note }) {
  return <section className="min-w-0 rounded-[26px] border border-[#E0E7D8] bg-white p-5 sm:p-7"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF4E8] text-sm font-bold text-[#6E8C51]">{index}</span><div><h3 className="text-xl font-bold tracking-tight text-[#23352B]">{title}</h3>{subtitle && <p className="mt-1.5 text-sm leading-6 text-[#7B8777]">{subtitle}</p>}</div></div>{children}{note && <p className="mt-4 text-xs leading-5 text-[#7B8777]">{note}</p>}</section>;
}

function groupPoints(rows, key, cumulative) {
  if (rows.length <= 35) return rows.map(row => ({ label: dateLabel(row.date), date: row.date, value: row[key] || 0 }));
  const points = [];
  for (let index = 0; index < rows.length; index += 7) {
    const week = rows.slice(index, index + 7), last = week.at(-1);
    points.push({ label: dateLabel(last.date), date: last.date, value: cumulative ? last[key] : week.reduce((sum, row) => sum + (row[key] || 0), 0) });
  }
  return points;
}

function LineChart({ points, label, color = "#5E8647", unit = "" }) {
  const width = 1000, height = 290, left = 62, right = 35, top = 35, bottom = 46;
  const plotW = width - left - right, plotH = height - top - bottom;
  const step = Math.max(1, Math.ceil(Math.max(0, ...points.map(row => row.value)) / 4)), max = step * 4;
  const x = index => left + index * plotW / Math.max(1, points.length - 1);
  const y = value => top + plotH - value / max * plotH;
  const tick = Math.max(1, Math.ceil(points.length / 7));
  const labels = points.map((_, index) => index).filter(index => index % tick === 0 || index === points.length - 1).filter(index => index === points.length - 1 || points.length - 1 - index >= Math.max(1, tick / 2));
  const line = points.map((row, index) => `${x(index)},${y(row.value)}`).join(" ");
  return <div className="mt-5 overflow-x-auto rounded-xl" tabIndex={0} aria-label={label}><div className="min-w-[620px]"><svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={label}>
    {[0, 1, 2, 3, 4].map(index => <g key={index}><line x1={left} x2={width - right} y1={y(step * index)} y2={y(step * index)} stroke="#E1E8DA" strokeDasharray="4 5" /><text x={left - 12} y={y(step * index) + 5} textAnchor="end" fontSize="14" fill="#6D7C67">{number(step * index)}{unit}</text></g>)}
    {points.length > 0 && <><polygon points={`${left},${y(0)} ${line} ${x(points.length - 1)},${y(0)}`} fill={color} opacity="0.07" /><polyline points={line} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />{points.map((row, index) => <g key={row.date}><title>{row.date}: {row.value}{unit}</title><circle cx={x(index)} cy={y(row.value)} r="4" fill="white" stroke={color} strokeWidth="2.5" />{labels.includes(index) && <text x={x(index)} y={y(row.value) - 12} textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{number(row.value)}{unit}</text>}</g>)}</>}
    {labels.map(index => <text key={index} x={x(index)} y={height - 15} textAnchor="middle" fontSize="14" fill="#6D7C67">{points[index].label}</text>)}
  </svg></div></div>;
}

function ActiveChart({ report }) {
  const i = report.insights;
  const rows = [{ label: "DAU", value: i.dau, days: "1 ngày" }, { label: "WAU", value: i.wau, days: "7 ngày" }, { label: "MAU", value: i.mau, days: "30 ngày" }];
  const step = Math.max(1, Math.ceil(Math.max(0, ...rows.map(row => row.value)) / 4)), max = step * 4;
  return <ChartCard number="02" title="Active Users">
    <div className="mt-5 overflow-x-auto" tabIndex={0} aria-label="Biểu đồ DAU WAU MAU"><div className="min-w-[620px]"><svg viewBox="0 0 1000 300" className="w-full" role="img" aria-label={`DAU ${i.dau}, WAU ${i.wau}, MAU ${i.mau}`}>
      {[0, 1, 2, 3, 4].map(index => <g key={index}><line x1="62" x2="965" y1={238 - index * 50} y2={238 - index * 50} stroke="#E1E8DA" strokeDasharray="4 5" /><text x="48" y={243 - index * 50} textAnchor="end" fontSize="14" fill="#6D7C67">{number(index * step)}</text></g>)}
      {rows.map((row, index) => { const h = row.value / max * 200, x = 170 + index * 290; return <g key={row.label}><title>{row.label}: {row.value} · {row.days}</title><rect x={x} y={238 - h} height={h} width="150" rx="10" fill={index === 2 ? "#486C35" : "#91AD75"} /><text x={x + 75} y={226 - h} textAnchor="middle" fontSize="22" fontWeight="700" fill="#344B32">{number(row.value)}</text><text x={x + 75} y="266" textAnchor="middle" fontSize="18" fontWeight="700" fill="#344B32">{row.label}</text><text x={x + 75} y="289" textAnchor="middle" fontSize="12" fill="#7B8777">{row.days}</text></g>; })}
    </svg></div></div>
  </ChartCard>;
}

function FeatureUsage({ report }) {
  const usage = report.usage || {};
  const rows = [
    { key: "tryon_started", label: "Lượt thử đồ", detail: "Bắt đầu thử đồ", icon: Shirt, color: "#5E8647" },
    { key: "stylist_product_recommended", label: "Stylist AI", detail: "Sản phẩm được gợi ý", icon: Palette, color: "#A7824E" },
    { key: "product_view", label: "Lượt xem sản phẩm", detail: "Mở xem sản phẩm", icon: Eye, color: "#668F98" },
    { key: "product_feedback", label: "Lượt phản hồi", detail: "Phản hồi sản phẩm", icon: MessageSquare, color: "#937A9F" },
  ];
  const max = Math.max(1, ...rows.map(row => usage[row.key] || 0));
  const hasEvents = rows.some(row => usage[row.key] > 0);
  return <ChartCard number="03" title="Sử dụng tính năng" subtitle="Tổng lượt trong kỳ đã chọn">
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(({ key, label, detail, icon: Icon, color }) => <div key={key} className="min-w-0 rounded-2xl border border-[#E0E7D8] bg-[#F8FAF5] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#52634D]"><Icon size={18} className="shrink-0" style={{ color }} /><span>{label}</span></div>
        <p className="mt-4 text-4xl font-black tabular-nums text-[#23352B]">{number(usage[key])}</p>
        <p className="mt-2 text-xs text-[#7B8777]">{detail}</p>
      </div>)}
    </div>
    {hasEvents ? <div className="mt-7 space-y-5" role="img" aria-label={rows.map(row => `${row.label}: ${number(usage[row.key])}`).join(", ")}>
      {rows.map(({ key, label, color }) => <div key={key} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 sm:grid-cols-[160px_1fr_70px] sm:items-center">
        <span className="text-sm font-medium text-[#52634D]">{label}</span>
        <div className="col-span-2 row-start-2 h-3 overflow-hidden rounded-full bg-[#EFF3E9] sm:col-span-1 sm:row-auto"><div className="h-full rounded-full" style={{ width: `${(usage[key] || 0) / max * 100}%`, backgroundColor: color }} /></div>
        <strong className="col-start-2 row-start-1 text-right text-sm tabular-nums text-[#23352B] sm:col-start-auto sm:row-auto">{number(usage[key])}</strong>
      </div>)}
    </div> : <p className="mt-6 rounded-xl bg-[#F8FAF5] p-4 text-sm text-[#7B8777]">Chưa ghi nhận lượt sử dụng trong kỳ này.</p>}
  </ChartCard>;
}

export function InsightCharts({ report, section }) {
  const i = report.insights;
  const growth = groupPoints(i.growth, "registered", true);
  return <div className="space-y-5">
    {section === "acquisition" && <ChartCard number="01" title="User Growth"><LineChart points={growth} label="Biểu đồ tăng trưởng khách hàng" /></ChartCard>}
    {["acquisition", "engagement"].includes(section) && <ActiveChart report={report} />}
    {["acquisition", "usage"].includes(section) && <FeatureUsage report={report} />}
    {section === "engagement" && <ChartCard number="03" title="Hoạt động theo ngày" subtitle="Số người dùng duy nhất"><LineChart points={i.daily.map(row => ({ date: row.date, label: dateLabel(row.date), value: row.activeUsers }))} label="Người dùng hoạt động theo ngày" /></ChartCard>}
  </div>;
}
