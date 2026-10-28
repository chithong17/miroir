import { Activity, ArrowDownRight, ArrowUpRight, Users, UserPlus } from "lucide-react";

const number = value => new Intl.NumberFormat("vi-VN").format(value || 0);
const dateLabel = date => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
const currentDateLabel = value => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short" }).format(new Date(value));

function Change({ value }) {
  if (!value || value.percent === null) return <span className="text-[#7B8777]">Chưa có nền so sánh</span>;
  const Icon = value.percent < 0 ? ArrowDownRight : ArrowUpRight;
  return <span className={`inline-flex items-center gap-1 ${value.percent < 0 ? "text-[#B36843]" : value.percent > 0 ? "text-[#4D783C]" : "text-[#7B8777]"}`}><Icon size={14} />{number(Math.abs(value.percent))}% so với kỳ trước</span>;
}

export function InsightMetrics({ report }) {
  const i = report.insights;
  const items = [
    { label: "Total Registered Users", value: number(i.registeredAtEnd), icon: Users, change: i.comparison.registered, note: "Tổng tài khoản đến cuối kỳ" },
    { label: "Active Users (MAU)", value: number(i.mau), icon: Activity, change: i.comparison.mau, note: "Người dùng duy nhất trong 30 ngày" },
    { label: "New Users", value: number(report.summary.newInRange), icon: UserPlus, change: i.comparison.newUsers, note: "Đăng ký trong kỳ đã chọn" },
    { label: "Engagement Rate", value: `${number(i.engagementRate)}%`, icon: Activity, note: "MAU / Tổng tài khoản đến cuối kỳ" },
  ];
  return <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(({ label, value, icon: Icon, note, change }, index) => <div key={label} className="min-w-0 rounded-3xl border border-[#E0E7D8] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-2 text-sm font-semibold text-[#65745F]"><span>{label}</span><Icon size={18} className="shrink-0 text-[#8A9D7C]" /></div><p className={`mt-5 text-[42px] font-black leading-none tracking-tight tabular-nums ${index === 0 ? "text-[#527D3D]" : "text-[#23352B]"}`}>{value}</p><div className="mt-4 text-xs font-medium">{change ? <Change value={change} /> : <span className="text-[#7B8777]">Tỷ lệ người dùng hoạt động</span>}</div><p className="mt-2 text-[11px] leading-5 text-[#7B8777]">{note}</p></div>)}</div>
    <p className="text-[11px] leading-5 text-[#7B8777]">Kỳ so sánh: {currentDateLabel(i.comparison.start)} – {currentDateLabel(i.comparison.end)}. Kỳ trước có cùng độ dài; MAU của mỗi kỳ tính trong 30 ngày kết thúc tại cuối kỳ đó.</p>
  </>;
}

function ChartCard({ number: index, title, subtitle, children, note }) {
  return <section className="min-w-0 rounded-[26px] border border-[#E0E7D8] bg-white p-5 sm:p-7"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF4E8] text-sm font-bold text-[#6E8C51]">{index}</span><div><h3 className="text-xl font-bold tracking-tight text-[#23352B]">{title}</h3><p className="mt-1.5 text-sm leading-6 text-[#7B8777]">{subtitle}</p></div></div>{children}{note && <p className="mt-4 text-xs leading-5 text-[#7B8777]">{note}</p>}</section>;
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
  const rows = [{ label: "DAU", value: i.dau, days: "Trong ngày cuối kỳ" }, { label: "WAU", value: i.wau, days: "7 ngày đến cuối kỳ" }, { label: "MAU", value: i.mau, days: "30 ngày đến cuối kỳ" }];
  const step = Math.max(1, Math.ceil(Math.max(0, ...rows.map(row => row.value)) / 4)), max = step * 4;
  return <ChartCard number="02" title="Active Users — Mức độ hoạt động" subtitle={`Người dùng duy nhất, tính đến ${currentDateLabel(report.end)}.`} note="DAU, WAU và MAU có thể bao gồm cùng một người dùng; không cộng ba chỉ số. Một hoạt động được ghi nhận là xem sản phẩm, bắt đầu thử đồ, được Stylist gợi ý sản phẩm, phản hồi hoặc tạo đơn.">
    <div className="mt-5 overflow-x-auto" tabIndex={0} aria-label="Biểu đồ DAU WAU MAU"><div className="min-w-[620px]"><svg viewBox="0 0 1000 300" className="w-full" role="img" aria-label={`DAU ${i.dau}, WAU ${i.wau}, MAU ${i.mau}`}>
      {[0, 1, 2, 3, 4].map(index => <g key={index}><line x1="62" x2="965" y1={238 - index * 50} y2={238 - index * 50} stroke="#E1E8DA" strokeDasharray="4 5" /><text x="48" y={243 - index * 50} textAnchor="end" fontSize="14" fill="#6D7C67">{number(index * step)}</text></g>)}
      {rows.map((row, index) => { const h = row.value / max * 200, x = 170 + index * 290; return <g key={row.label}><title>{row.label}: {row.value} · {row.days}</title><rect x={x} y={238 - h} height={h} width="150" rx="10" fill={index === 2 ? "#486C35" : "#91AD75"} /><text x={x + 75} y={226 - h} textAnchor="middle" fontSize="22" fontWeight="700" fill="#344B32">{number(row.value)}</text><text x={x + 75} y="266" textAnchor="middle" fontSize="18" fontWeight="700" fill="#344B32">{row.label}</text><text x={x + 75} y="289" textAnchor="middle" fontSize="12" fill="#7B8777">{row.days}</text></g>; })}
    </svg></div></div>
  </ChartCard>;
}

export function InsightCharts({ report, section }) {
  const i = report.insights, weekly = i.growth.length > 35;
  const growth = groupPoints(i.growth, "registered", true);
  const engagement = groupPoints(i.daily, "featureEvents", false);
  return <div className="space-y-5">
    {section === "acquisition" && <ChartCard number="01" title="User Growth — Tăng trưởng người dùng" subtitle={`Registered Users · Tổng tài khoản tích lũy ${weekly ? "ở cuối mỗi nhóm 7 ngày" : "theo ngày"}.`} note="Đường biểu diễn tổng tài khoản hiện có đến từng mốc, bao gồm tài khoản đăng ký trước kỳ. Số tài khoản đăng ký mới là phần tăng thêm trong kỳ."><LineChart points={growth} label="Tổng tài khoản đăng ký tích lũy" /></ChartCard>}
    {["acquisition", "engagement"].includes(section) && <ActiveChart report={report} />}
    {["acquisition", "usage"].includes(section) && <ChartCard number="03" title="Engagement — Mức độ sử dụng" subtitle={`Feature Events · Sự kiện sử dụng tính năng ${weekly ? "theo nhóm 7 ngày" : "theo ngày"}.`} note="Gồm lượt xem sản phẩm, bắt đầu thử đồ, sản phẩm được Stylist gợi ý và phản hồi có gắn tài khoản. Đây là số sự kiện, không phải số phiên hoặc tỷ lệ quay lại; một lần Stylist có thể tạo nhiều sự kiện sản phẩm."><LineChart points={engagement} label="Sự kiện sử dụng tính năng trong kỳ" color="#A7824E" /></ChartCard>}
    {section === "engagement" && <ChartCard number="03" title="Hoạt động theo ngày" subtitle="Số tài khoản có hoạt động duy nhất trong từng ngày." note="Một người hoạt động nhiều ngày được tính ở mỗi ngày đó, nhưng chỉ đếm một lần trong WAU/MAU."><LineChart points={i.daily.map(row => ({ date: row.date, label: dateLabel(row.date), value: row.activeUsers }))} label="Người dùng hoạt động theo ngày" /></ChartCard>}
  </div>;
}
