import React, { useState } from "react";
import {
  Users,
  Sparkles,
  Heart,
  TrendingUp,
  Tag,
  Palette,
  DollarSign,
  Star,
  Activity,
  UserCheck,
  PieChart,
} from "lucide-react";
import {
  NeuCard,
  NeuTabs,
} from "./NeuComponents.jsx";

const RANGE_TABS = [
  { id: "7d", label: "7 ngày qua" },
  { id: "30d", label: "30 ngày qua" },
  { id: "90d", label: "90 ngày qua" },
];

// Refined Pastel Palette inspired by user's specification
const PASTEL_PALETTE = [
  "#8EC5FC", // 🔷 Pastel Blue (Total Revenue / Main)
  "#B4A7F5", // 🟣 Pastel Violet (AI Try-on / Segment)
  "#FFAAA6", // 🌸 Pastel Coral / Pink (New Clients / Alert)
  "#FFD099", // 🍊 Pastel Orange / Peach (Pending / Delivery)
  "#A7E8BD", // 🟢 Pastel Mint Green (Net Profit / Trajectory)
  "#B3D07E", // 🌿 Miroir Soft Sage Green
  "#FFB3D9", // 🎀 Pastel Rose Pink
  "#FFE58F", // ☀️ Pastel Butter Yellow
];

export default function SellerInsightsView({
  insights,
  range = "30d",
  setRange,
  status,
  strategyReport,
  strategyStatus,
  onRetryStrategy,
}) {
  const breakdowns = insights?.breakdowns || {};
  const enoughData = insights?.enoughData;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1F2A2A]">
            Thấu hiểu khách hàng & Xu hướng
          </h2>
          <p className="text-xs text-[#6E7D7C] mt-0.5">
            Hồ sơ dáng người, tone da, phong cách yêu thích và phân tích tương tác mua sắm
          </p>
        </div>

        <NeuTabs
          tabs={RANGE_TABS}
          activeTab={range}
          onChange={setRange}
        />
      </div>

      {/* Data Quality & Privacy Notice */}
      {!enoughData && (
        <div className="neu-card p-6 bg-[#F1F5E8] border border-[#B3D07E] flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl neu-inset bg-white text-[#6F8746] flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#1F2A2A]">
              Đang tích lũy tín hiệu khách hàng
            </h4>
            <p className="text-xs text-[#6E7D7C] mt-0.5">
              Cần tối thiểu 3 lượt tương tác từ người dùng riêng biệt để hiển thị dữ liệu ẩn danh đảm bảo quyền riêng tư. Hiện tại: {insights?.eventCount || 0} lượt ({insights?.userCount || 0} khách).
            </p>
          </div>
        </div>
      )}

      {/* Audience Breakdown Grid - 3D Volumetric Pastel Donut Charts */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <InsightDonutCard
          id="gender"
          icon={Users}
          title="Giới tính (Gender)"
          items={breakdowns.gender || []}
        />
        <InsightDonutCard
          id="bodyShape"
          icon={Activity}
          title="Dáng người (Body Shape)"
          items={breakdowns.bodyShape || []}
        />
        <InsightDonutCard
          id="skinTone"
          icon={Heart}
          title="Tone da (Skin Tone)"
          items={breakdowns.skinTone || []}
        />
        <InsightDonutCard
          id="stylePreferences"
          icon={Sparkles}
          title="Phong cách yêu thích (Styles)"
          items={breakdowns.stylePreferences || []}
        />
        <InsightDonutCard
          id="occasions"
          icon={Tag}
          title="Dịp sử dụng (Occasions)"
          items={breakdowns.occasions || []}
        />
        <InsightDonutCard
          id="budgetBuckets"
          icon={DollarSign}
          title="Phân khúc ngân sách (Budget)"
          items={breakdowns.budgetBuckets || []}
        />
        <InsightDonutCard
          id="colors"
          icon={Palette}
          title="Tông màu ưa chuộng (Colors)"
          items={breakdowns.colors || []}
        />
        <InsightDonutCard
          id="ratings"
          icon={Star}
          title="Mức độ hài lòng (Ratings)"
          items={breakdowns.ratings || []}
        />
        <InsightDonutCard
          id="styleTags"
          icon={TrendingUp}
          title="Thẻ phong cách được tìm kiếm"
          items={breakdowns.styleTags || []}
        />
      </div>
    </div>
  );
}

function InsightDonutCard({ id = "chart", icon: Icon, title, items = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = Math.max(
    items.reduce((sum, item) => sum + Number(item.count || 0), 0),
    0
  );

  // SVG Geometry: radius = 15.9155 in a 44x44 box gives exact circumference of 100
  const radius = 15.91549430918954;
  const circumference = 100;

  let cumulativePercent = 0;
  const slices = items.map((item, index) => {
    const count = Number(item.count || 0);
    const percent = total > 0 ? (count / total) * 100 : 0;
    const offset = cumulativePercent;
    cumulativePercent += percent;
    const color = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
    return {
      ...item,
      count,
      percent: Math.round(percent),
      exactPercent: percent,
      offset,
      color,
    };
  });

  const activeSlice = hoveredIdx !== null && slices[hoveredIdx] ? slices[hoveredIdx] : null;

  return (
    <NeuCard className="flex flex-col justify-between transition-all duration-300 hover:shadow-lg">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#E2EBD5] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-2xl neu-icon-btn bg-white text-[#6F8746] shadow-sm">
              <Icon className="h-4 w-4" />
            </div>
            <h4 className="font-black text-xs uppercase tracking-wider text-[#1F2A2A]">
              {title}
            </h4>
          </div>
          <span className="text-[11px] font-bold text-[#6F8746] bg-[#F1F5E8] px-2.5 py-0.5 rounded-full border border-[#B3D07E]/50">
            {total} lượt
          </span>
        </div>

        {items.length === 0 || total === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full neu-inset flex items-center justify-center text-[#96A5A4] mb-2 opacity-60">
              <PieChart className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#96A5A4] font-medium">Chưa có đủ tín hiệu phân tích.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 pt-1">
            {/* 3D Volumetric Donut SVG Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg
                className="w-full h-full -rotate-90 overflow-visible"
                viewBox="0 0 44 44"
              >
                <defs>
                  {/* Realistic 3D Soft Shadow Filter for tactile volumetric depth */}
                  <filter id={`donutDepth-${id}`} x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="1.2" dy="2.8" stdDeviation="2.2" floodColor="#8B9D75" floodOpacity="0.32" />
                  </filter>
                  <filter id={`donutHover-${id}`} x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="2" dy="4" stdDeviation="3.2" floodColor="#6F8746" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* 3D Inset Track Base Groove */}
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  fill="none"
                  stroke="#E8EFE0"
                  strokeWidth="6.8"
                />

                {/* Slices with 3D drop-shadow and rounded tactile ends */}
                {slices.map((slice, idx) => {
                  const isHovered = hoveredIdx === idx;
                  const isAnyHovered = hoveredIdx !== null;
                  const strokeWidth = isHovered ? 8.2 : 6.4;

                  return (
                    <circle
                      key={slice.label || idx}
                      cx="22"
                      cy="22"
                      r={radius}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${Math.max(slice.exactPercent - 0.8, 0.5)} ${circumference - Math.max(slice.exactPercent - 0.8, 0.5)}`}
                      strokeDashoffset={-slice.offset}
                      strokeLinecap="round"
                      filter={isHovered ? `url(#donutHover-${id})` : `url(#donutDepth-${id})`}
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        opacity: isAnyHovered ? (isHovered ? 1 : 0.55) : 0.96,
                      }}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  );
                })}
              </svg>

              {/* 3D Neumorphic Embossed Core Disc in the Center */}
              <div
                className="absolute w-[78px] h-[78px] rounded-full flex flex-col items-center justify-center text-center p-1 pointer-events-none transition-all duration-300 bg-gradient-to-br from-[#FFFFFF] via-[#FDFEFB] to-[#F1F5E8] border border-[#E2EBD5] shadow-[3px_5px_12px_rgba(195,208,180,0.45),-3px_-3px_8px_#FFFFFF,inset_0_1.5px_2px_rgba(255,255,255,0.95)]"
              >
                {activeSlice ? (
                  <div className="animate-in zoom-in-95 duration-150 flex flex-col items-center justify-center w-full px-1">
                    <span
                      className="text-[10px] font-black uppercase tracking-tight truncate max-w-[70px] leading-tight"
                      style={{ color: activeSlice.color }}
                    >
                      {activeSlice.label}
                    </span>
                    <span className="text-base font-black text-[#1F2A2A] leading-none my-0.5">
                      {activeSlice.percent}%
                    </span>
                    <span className="text-[9px] font-bold text-[#6E7D7C] leading-none">
                      {activeSlice.count} lượt
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-base font-black text-[#1F2A2A] tracking-tight leading-none">
                      {total}
                    </span>
                    <span className="text-[9px] font-extrabold text-[#96A5A4] uppercase tracking-wider mt-0.5">
                      Tổng lượt
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Clean Legend List: Complete full labels without truncation */}
            <div className="flex-1 w-full space-y-1.5 min-w-0">
              {slices.map((slice, idx) => {
                const isHovered = hoveredIdx === idx;
                return (
                  <div
                    key={slice.label || idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`flex items-center gap-2.5 p-2 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      isHovered
                        ? "bg-[#F1F5E8] border border-[#B3D07E]/60 shadow-sm translate-x-1"
                        : "hover:bg-[#F1F5E8]/60 border border-transparent"
                    }`}
                  >
                    {/* Pastel Color Dot */}
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-sm transition-transform duration-200"
                      style={{
                        backgroundColor: slice.color,
                        transform: isHovered ? "scale(1.25)" : "scale(1)",
                      }}
                    />

                    {/* Complete Category Label - Fully legible, zero truncation */}
                    <span
                      className={`text-xs capitalize leading-snug flex-1 ${
                        isHovered ? "font-black text-[#1F2A2A]" : "font-semibold text-[#1F2A2A]"
                      }`}
                    >
                      {slice.label}
                    </span>

                    {/* Highlighted hover percent indicator */}
                    {isHovered && (
                      <span className="text-[11px] font-black text-[#6F8746] bg-white px-2 py-0.5 rounded-md shadow-xs animate-in fade-in duration-150 shrink-0">
                        {slice.percent}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </NeuCard>
  );
}
