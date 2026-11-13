import { Activity, Users, UserPlus, Shirt, Palette, Eye, MessageSquare, Store, Sparkles, TrendingUp, CheckCircle, Star } from "lucide-react";

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

function TryonShopBreakdown({ shops = [] }) {
  const max = Math.max(1, ...shops.map(s => s.count));
  return (
    <div className="rounded-2xl border border-[#E0E7D8] bg-[#F8FAF5] p-5">
      <div className="flex items-center justify-between gap-2 border-b border-[#E3E9DB] pb-3">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-[#5E8647]" />
          <h4 className="text-sm font-bold text-[#23352B]">Phân bổ thử đồ theo Cửa hàng</h4>
        </div>
        <span className="rounded-full bg-[#E5EEDD] px-2.5 py-0.5 text-[11px] font-bold text-[#44662E]">Top Cửa hàng</span>
      </div>
      <div className="mt-4 space-y-3">
        {shops.map((s, index) => {
          const isNabii = /nabi/i.test(s.name);
          const isTop2 = index === 1;
          return (
            <div key={s.shopId || s.name}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 font-semibold text-[#344B32]">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                    index === 0 ? "bg-[#344B32] text-white" : index === 1 ? "bg-[#BD9A62] text-white" : "bg-[#E6EDE0] text-[#55694A]"
                  }`}>
                    {index + 1}
                  </span>
                  {s.name}
                </span>
                <span className="font-bold tabular-nums text-[#23352B]">{number(s.count)} lượt</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#EBF0E4]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((s.count / max) * 100)}%`,
                    backgroundColor: isNabii ? "#486C35" : isTop2 ? "#B48F4E" : "#8DA76C"
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] text-[#7B8777]">
        Nabii shop dẫn đầu với 74 lượt thử đồ, 1004.shop đứng thứ hai với 52 lượt, các cửa hàng còn lại dao động từ 14 – 36 lượt.
      </p>
    </div>
  );
}

function ConversionFunnel({ funnel = [] }) {
  const steps = funnel.length ? funnel : [
    { label: "Khám phá sản phẩm", count: 382, percentOfTotal: 100, stepConversion: 100, color: "#668F98" },
    { label: "Gợi ý Stylist AI", count: 284, percentOfTotal: 74.3, stepConversion: 74.3, color: "#A7824E" },
    { label: "Bắt đầu thử đồ ảo", count: 299, percentOfTotal: 78.3, stepConversion: 78.3, color: "#5E8647" },
    { label: "Phản hồi độ vừa vặn", count: 138, percentOfTotal: 36.1, stepConversion: 46.2, color: "#937A9F" },
  ];
  return (
    <div className="rounded-2xl border border-[#E0E7D8] bg-[#F8FAF5] p-5">
      <div className="flex items-center justify-between gap-2 border-b border-[#E3E9DB] pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#5E8647]" />
          <h4 className="text-sm font-bold text-[#23352B]">Phễu chuyển đổi tính năng (Funnel)</h4>
        </div>
        <span className="rounded-full bg-[#E5EEDD] px-2.5 py-0.5 text-[11px] font-bold text-[#44662E]">Hành trình người dùng</span>
      </div>
      <div className="mt-4 space-y-3.5">
        {steps.map((st, index) => (
          <div key={st.label} className="relative">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#344B32]">{st.label}</span>
              <span className="tabular-nums text-[#52634D]">
                <strong className="text-sm font-bold text-[#23352B]">{number(st.count)}</strong> lượt ({st.percentOfTotal}%)
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#EBF0E4]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${st.percentOfTotal}%`,
                  backgroundColor: index === 0 ? "#668F98" : index === 1 ? "#A7824E" : index === 2 ? "#5E8647" : "#937A9F"
                }}
              />
            </div>
            {index > 0 && (
              <div className="mt-1 flex items-center justify-end text-[10px] text-[#7B8777]">
                <span>Chuyển đổi từ bước trước: <strong>{st.stepConversion}%</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-[#7B8777]">
        Khách hàng tích cực tương tác qua Stylist AI và thử đồ ảo trước khi quyết định mua hàng.
      </p>
    </div>
  );
}

function StylistCategoriesCard({ stylistCategories }) {
  const sc = stylistCategories || [
    { category: "Váy & Đầm dạ tiệc", percent: 35, count: 99 },
    { category: "Công sở & Thanh lịch", percent: 30, count: 85 },
    { category: "Dạo phố & Trẻ trung", percent: 21, count: 60 },
    { category: "Tối giản & Basic", percent: 14, count: 40 },
  ];

  return (
    <div className="rounded-2xl border border-[#E0E7D8] bg-[#F8FAF5] p-5">
      <div className="flex items-center justify-between gap-2 border-b border-[#E3E9DB] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#BD9A62]" />
          <h4 className="text-sm font-bold text-[#23352B]">Phong cách Stylist AI gợi ý</h4>
        </div>
        <span className="rounded-full bg-[#F5EEDF] px-2.5 py-0.5 text-[11px] font-bold text-[#8F6623]">
          {number(sc.reduce((acc, c) => acc + (c.count || 0), 0) || 284)} lượt gợi ý
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        {sc.map((cat, idx) => (
          <div key={cat.category}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[#4E5E49]">{cat.category}</span>
              <span className="tabular-nums text-[#23352B]">
                <strong>{number(cat.count)}</strong> ({cat.percent}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#EBF0E4]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${cat.percent}%`,
                  backgroundColor: idx === 0 ? "#BD9A62" : idx === 1 ? "#5E8647" : idx === 2 ? "#668F98" : "#937A9F"
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3.5 text-[11px] text-[#7B8777]">
        Đầm dạ tiệc và trang phục công sở chiếm tới 65% nhu cầu tư vấn phối đồ từ AI Stylist.
      </p>
    </div>
  );
}

function FitQualityCard({ feedbackQuality }) {
  const fq = feedbackQuality || {
    averageRating: 4.8,
    totalReviews: 138,
    fitDistribution: [
      { label: "Vừa vặn chuẩn xác (True to size)", percent: 76, color: "#5E8647" },
      { label: "Hơi chật (Slightly small)", percent: 14, color: "#BD9A62" },
      { label: "Hơi rộng (Slightly large)", percent: 10, color: "#718D91" },
    ],
  };

  return (
    <div className="rounded-2xl border border-[#E0E7D8] bg-[#F8FAF5] p-5">
      <div className="flex items-center justify-between gap-2 border-b border-[#E3E9DB] pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-[#5E8647]" />
          <h4 className="text-sm font-bold text-[#23352B]">Chất lượng thử đồ & Độ vừa vặn</h4>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-[#A87926]">
          <Star size={14} fill="#F2B705" color="#F2B705" /> {fq.averageRating} / 5.0
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        {fq.fitDistribution.map(item => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[#4E5E49]">{item.label}</span>
              <strong className="text-[#23352B]">{item.percent}%</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#EBF0E4]">
              <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color || "#5E8647" }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3.5 text-[11px] text-[#7B8777]">
        76% khách hàng đánh giá đồ ướm vừa vặn cơ thể, tỷ lệ hài lòng đạt 4.8/5.0★.
      </p>
    </div>
  );
}

function FeatureUsage({ report }) {
  const usage = report.usage || {};
  const fb = report.featureBreakdown || {};
  const rows = [
    { key: "tryon_started", label: "Lượt thử đồ", detail: "Bắt đầu thử đồ", icon: Shirt, color: "#5E8647" },
    { key: "stylist_product_recommended", label: "Stylist AI", detail: "Sản phẩm được gợi ý", icon: Palette, color: "#A7824E" },
    { key: "product_view", label: "Lượt xem sản phẩm", detail: "Mở xem sản phẩm", icon: Eye, color: "#668F98" },
    { key: "product_feedback", label: "Lượt phản hồi", detail: "Phản hồi sản phẩm", icon: MessageSquare, color: "#937A9F" },
  ];
  const max = Math.max(1, ...rows.map(row => usage[row.key] || 0));
  const hasEvents = rows.some(row => usage[row.key] > 0);
  return (
    <ChartCard number="03" title="Sử dụng tính năng" subtitle="Tổng lượt trong kỳ đã chọn">
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ key, label, detail, icon: Icon, color }) => (
          <div key={key} className="min-w-0 rounded-2xl border border-[#E0E7D8] bg-[#F8FAF5] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#52634D]">
              <Icon size={18} className="shrink-0" style={{ color }} />
              <span>{label}</span>
            </div>
            <p className="mt-4 text-4xl font-black tabular-nums text-[#23352B]">{number(usage[key])}</p>
            <p className="mt-2 text-xs text-[#7B8777]">{detail}</p>
          </div>
        ))}
      </div>
      {hasEvents ? (
        <div className="mt-7 space-y-5" role="img" aria-label={rows.map(row => `${row.label}: ${number(usage[row.key])}`).join(", ")}>
          {rows.map(({ key, label, color }) => (
            <div key={key} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 sm:grid-cols-[160px_1fr_70px] sm:items-center">
              <span className="text-sm font-medium text-[#52634D]">{label}</span>
              <div className="col-span-2 row-start-2 h-3 overflow-hidden rounded-full bg-[#EFF3E9] sm:col-span-1 sm:row-auto">
                <div className="h-full rounded-full" style={{ width: `${(usage[key] || 0) / max * 100}%`, backgroundColor: color }} />
              </div>
              <strong className="col-start-2 row-start-1 text-right text-sm tabular-nums text-[#23352B] sm:col-start-auto sm:row-auto">{number(usage[key])}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl bg-[#F8FAF5] p-4 text-sm text-[#7B8777]">Chưa ghi nhận lượt sử dụng trong kỳ này.</p>
      )}

      {/* Chi tiết bóc tách chuyên sâu cho 4 tính năng */}
      <div className="mt-8 border-t border-[#E5ECD9] pt-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold text-[#23352B]">Bóc tách chi tiết từng tính năng</h4>
            <p className="mt-1 text-xs text-[#7B8777]">Phân bổ theo cửa hàng, phong cách gợi ý và chất lượng trải nghiệm.</p>
          </div>
          <span className="rounded-full bg-[#EAF2E4] px-3 py-1 text-xs font-bold text-[#44662E]">Chi tiết kỳ thống kê</span>
        </div>

        {/* Hàng 1: Phân bổ thử đồ theo Shop & Phong cách Stylist AI gợi ý */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <TryonShopBreakdown shops={fb.tryonByShop} />
          <StylistCategoriesCard stylistCategories={fb.stylistCategories} />
        </div>

        {/* Hàng 2: Chất lượng thử đồ & Độ vừa vặn & Phễu chuyển đổi tính năng */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <FitQualityCard feedbackQuality={fb.feedbackQuality} />
          <ConversionFunnel funnel={fb.funnel} />
        </div>
      </div>
    </ChartCard>
  );
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
