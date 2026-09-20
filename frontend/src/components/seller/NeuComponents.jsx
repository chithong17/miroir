import React from "react";
import { X, Search, MoreHorizontal, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function NeuCard({
  children,
  className = "",
  variant = "white", // "white" | "blue" | "coral" | "teal" | "violet" | "green"
  hover = false,
  padding = "p-6",
}) {
  const variantClasses = {
    white: "neu-card",
    blue: "neu-card-blue",
    coral: "neu-card-coral",
    teal: "neu-card-teal",
    violet: "neu-card-violet",
    green: "neu-card-green",
  };

  return (
    <div
      className={`${variantClasses[variant] || variantClasses.white} ${
        hover ? "neu-card-hover" : ""
      } ${padding} ${className}`}
    >
      {children}
    </div>
  );
}

export function NeuStatCard({
  icon: Icon,
  variant = "white", // "white" | "blue" | "coral" | "teal" | "violet" | "green"
  title,
  value,
  trend,
  trendPositive = true,
  subtitle,
  sparkline = "wave", // "wave" | "bars" | "none"
  chartColor,
  onClick,
  className = "",
}) {
  const isColored = variant !== "white";

  return (
    <div
      onClick={onClick}
      className={`neu-card-hover relative overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl ${
        variant === "blue"
          ? "neu-card-blue"
          : variant === "coral"
          ? "neu-card-coral"
          : variant === "teal"
          ? "neu-card-teal"
          : variant === "violet"
          ? "neu-card-violet"
          : variant === "green"
          ? "neu-card-green"
          : "neu-card"
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5">
        <span
          className={`text-[11px] font-black uppercase tracking-wider truncate ${
            isColored ? "text-white/90" : "text-[#6E7D7C]"
          }`}
          title={title}
        >
          {title}
        </span>
        {Icon ? (
          <div
            className={`h-7 w-7 shrink-0 rounded-xl flex items-center justify-center ${
              isColored
                ? "bg-white/20 text-white backdrop-blur-xs border border-white/25 shadow-xs"
                : "neu-icon-btn text-[#6F8746]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        ) : isColored ? (
          <button
            type="button"
            className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Main Value */}
      <div className="mt-1.5">
        <div
          className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${
            isColored ? "text-white" : "text-[#1F2A2A]"
          }`}
        >
          {value}
        </div>

        {/* Trend & Subtitle */}
        {(trend || subtitle) && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {trend ? (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 font-bold ${
                  isColored
                    ? "bg-white/25 text-white backdrop-blur-sm"
                    : trendPositive
                    ? "bg-[#7EDC9A]/20 text-[#2B7D45]"
                    : "bg-[#FF8F8F]/20 text-[#C93B3B]"
                }`}
              >
                {trendPositive ? "+" : "-"} {trend}
              </span>
            ) : null}
            {subtitle ? (
              <span className={`truncate ${isColored ? "text-white/80" : "text-[#96A5A4]"}`}>
                {subtitle}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Mini Graphic decoration at bottom */}
      {sparkline === "wave" && (
        <div className="mt-2 pt-0.5">
          <svg
            className="w-full h-6 overflow-visible"
            viewBox="0 0 160 30"
            fill="none"
          >
            <path
              d="M0 24 Q 40 4, 80 18 T 160 6"
              stroke={isColored ? "rgba(255, 255, 255, 0.9)" : chartColor || "#68A7FF"}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      )}

      {sparkline === "bars" && (
        <div className="mt-2 flex items-end justify-end gap-1.5 h-6">
          {[35, 55, 85, 60, 100].map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all duration-300"
              style={{
                height: `${h}%`,
                backgroundColor: isColored ? "#FFFFFF" : chartColor || "#7EDC9A",
                opacity: isColored ? 0.4 + (i * 0.14) : 0.5 + (i * 0.12),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* 3D Donut Statistics Component (from Reference Image) */
export function NeuDonutStat({
  title = "Thống kê tỷ lệ",
  totalLabel = "Tổng số",
  totalValue = "1,240",
  segments = [
    { label: "Doanh số online", percentage: 60, color: "#8EC5FC" },
    { label: "Khách trực tiếp", percentage: 25, color: "#FFD099" },
    { label: "Thử đồ AI", percentage: 10, color: "#A7E8BD" },
    { label: "Trả hàng/Khác", percentage: 5, color: "#B4A7F5" },
  ],
  className = "",
}) {
  return (
    <div className={`neu-card p-5 sm:p-6 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6E7D7C]">
          {title}
        </span>
        <button
          type="button"
          className="neu-icon-btn h-7 w-7 text-[#96A5A4] hover:text-[#1F2A2A]"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        {/* Circular Donut Ring */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#F1F5E8"
              strokeWidth="4.2"
            />
            {/* 60% Pastel Blue segment */}
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#8EC5FC"
              strokeWidth="4.2"
              strokeDasharray="52.7 88"
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* 25% Pastel Orange segment */}
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#FFD099"
              strokeWidth="4.2"
              strokeDasharray="22 88"
              strokeDashoffset="-54"
              strokeLinecap="round"
            />
            {/* 10% Pastel Mint Green segment */}
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#A7E8BD"
              strokeWidth="4.2"
              strokeDasharray="8.8 88"
              strokeDashoffset="-77"
              strokeLinecap="round"
            />
            {/* 5% Pastel Violet segment */}
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#B4A7F5"
              strokeWidth="4.2"
              strokeDasharray="4.4 88"
              strokeDashoffset="-86"
              strokeLinecap="round"
            />
          </svg>

          {/* Centered Donut Stat Card */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-black text-[#1F2A2A]">{totalValue}</span>
            <span className="text-[10px] font-bold text-[#96A5A4]">{totalLabel}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 text-xs flex-1 min-w-0">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-[11px] font-medium text-[#6E7D7C] truncate">
                  {seg.label}
                </span>
              </div>
              <span className="font-bold text-[11px] text-[#1F2A2A]">
                {seg.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 3D Curvy Line Analytics Chart (from Reference Image) */
export function NeuCurveChart({
  title = "Biểu đồ phân tích doanh thu",
  timeframe = "Tuần này",
  pointTooltip = "2.340.000₫",
  className = "",
}) {
  return (
    <div className={`neu-card p-6 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between border-b border-[#E2EBD5] pb-4">
        <div>
          <h3 className="text-base font-black text-[#1F2A2A]">{title}</h3>
          <p className="text-xs text-[#96A5A4]">Xu hướng tăng trưởng qua các ngày trong tuần</p>
        </div>
        <div className="neu-inset px-3 py-1.5 rounded-full text-xs font-bold text-[#6F8746] flex items-center gap-1">
          <span>{timeframe}</span>
          <span className="text-[10px]">▾</span>
        </div>
      </div>

      <div className="relative mt-6 h-56 flex items-end">
        {/* Y Axis */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-semibold text-[#96A5A4] select-none">
          <span>4M</span>
          <span>3M</span>
          <span>2M</span>
          <span>1M</span>
          <span>0</span>
        </div>

        {/* Chart Canvas */}
        <div className="relative ml-8 w-full h-full pb-6">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 500 160"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#68A7FF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#68A7FF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="0" y1="0" x2="500" y2="0" stroke="#F1F5E8" strokeDasharray="4 4" />
            <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5E8" strokeDasharray="4 4" />
            <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5E8" strokeDasharray="4 4" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5E8" strokeDasharray="4 4" />

            {/* Area Fill */}
            <path
              d="M 0 140 Q 60 145, 100 110 T 200 95 T 300 45 T 400 90 T 500 70 L 500 160 L 0 160 Z"
              fill="url(#chartGradient)"
            />

            {/* Smooth Curve Line */}
            <path
              d="M 0 140 Q 60 145, 100 110 T 200 95 T 300 45 T 400 90 T 500 70"
              stroke="#68A7FF"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Highlighted Glowing Data Point */}
            <circle cx="300" cy="45" r="7" fill="#68A7FF" />
            <circle cx="300" cy="45" r="3.5" fill="#FFFFFF" />
          </svg>

          {/* Floating Tooltip Pill (like $2,340 in reference image) */}
          <div
            className="absolute -top-3 left-[56%] -translate-x-1/2 rounded-xl bg-white px-3 py-1 text-xs font-black text-[#1F2A2A] shadow-lg border border-[#68A7FF]/30"
          >
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#68A7FF]" />
              <span>{pointTooltip}</span>
            </div>
          </div>
        </div>

        {/* X Axis Labels */}
        <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[11px] font-bold text-[#96A5A4]">
          <span>Thứ 2</span>
          <span>Thứ 3</span>
          <span>Thứ 4</span>
          <span>Thứ 5</span>
          <span>Thứ 6</span>
          <span>Thứ 7</span>
          <span>CN</span>
        </div>
      </div>
    </div>
  );
}

export function NeuButton({
  children,
  variant = "secondary",
  size = "md",
  icon: Icon,
  disabled = false,
  onClick,
  type = "button",
  className = "",
}) {
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5 rounded-xl",
    md: "px-4.5 py-2.5 text-sm gap-2 rounded-2xl",
    lg: "px-6 py-3.5 text-base gap-2.5 rounded-2xl",
    icon: "h-10 w-10 p-0 rounded-full",
  };

  const variantClasses = {
    primary: "neu-btn-primary text-white",
    blue: "neu-card-blue !border-0 text-white font-bold",
    coral: "neu-card-coral !border-0 text-white font-bold",
    violet: "neu-card-violet !border-0 text-white font-bold",
    secondary: "neu-btn-raised text-[#1F2A2A]",
    inset: "neu-inset text-[#6F8746] font-bold",
    ghost: "bg-transparent text-[#6E7D7C] hover:text-[#1F2A2A] hover:bg-[#F1F5E8]/80",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 shadow-sm",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.secondary} ${className}`}
    >
      {Icon && <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />}
      {children}
    </button>
  );
}

export function NeuInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  icon: Icon,
  error = "",
  disabled = false,
  className = "",
  helper = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-[#6E7D7C]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-[#96A5A4] pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`neu-input w-full px-4 py-2.5 text-sm font-medium ${
            Icon ? "pl-10" : ""
          } ${error ? "border-red-400 bg-red-50/50" : ""}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : helper ? (
        <p className="text-xs text-[#96A5A4]">{helper}</p>
      ) : null}
    </div>
  );
}

export function NeuSearch({
  value,
  onChange,
  onClear,
  placeholder = "Tìm kiếm dữ liệu...",
  className = "",
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3.5 h-4 w-4 text-[#96A5A4] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="neu-input w-full pl-10 pr-9 py-2.5 text-sm text-[#1F2A2A] placeholder:text-[#96A5A4]"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 text-[#96A5A4] hover:text-[#1F2A2A]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function NeuTabs({
  tabs = [],
  activeTab,
  onChange,
  className = "",
}) {
  return (
    <div className={`neu-inset p-1.5 flex items-center gap-1.5 rounded-2xl overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
              isActive
                ? "neu-btn-raised text-[#6F8746] shadow-md"
                : "text-[#6E7D7C] hover:text-[#1F2A2A] hover:bg-white/50"
            }`}
          >
            {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-[#B3D07E] text-[#1F2A2A] font-black"
                    : "bg-[#E2EBD5] text-[#6E7D7C]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function NeuBadge({ children, variant = "neutral", className = "" }) {
  const badgeStyles = {
    neutral: "bg-[#F1F5E8] text-[#6E7D7C] border border-[#E2EBD5]",
    teal: "bg-[#B3D07E]/25 text-[#6F8746] border border-[#B3D07E]/60 font-bold",
    green: "bg-[#A7E8BD]/35 text-[#22543D] border border-[#A7E8BD]/60 font-bold",
    blue: "bg-[#8EC5FC]/28 text-[#1E40AF] border border-[#8EC5FC]/55 font-bold",
    violet: "bg-[#B4A7F5]/28 text-[#4C1D95] border border-[#B4A7F5]/55 font-bold",
    coral: "bg-[#FFAAA6]/30 text-[#991B1B] border border-[#FFAAA6]/55 font-bold",
    pink: "bg-[#FFB3D9]/30 text-[#9D174D] border border-[#FFB3D9]/55 font-bold",
    orange: "bg-[#FFD099]/32 text-[#9A3412] border border-[#FFD099]/60 font-bold",
    yellow: "bg-[#FFE58F]/35 text-[#854D0E] border border-[#FFE58F]/60 font-bold",
    success: "bg-[#A7E8BD]/35 text-[#22543D] border border-[#A7E8BD]/60 font-bold",
    warning: "bg-[#FFD099]/32 text-[#9A3412] border border-[#FFD099]/60 font-bold",
    danger: "bg-[#FFAAA6]/30 text-[#991B1B] border border-[#FFAAA6]/55 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-semibold ${
        badgeStyles[variant] || badgeStyles.neutral
      } ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}

export function NeuProgressBar({
  progress = 0,
  gradient = "teal", // "teal" | "blue" | "violet" | "coral" | "green" | "orange"
  height = "h-2.5",
  className = "",
}) {
  const clamped = Math.min(Math.max(progress, 0), 100);

  const gradients = {
    teal: "bg-gradient-to-r from-[#B3D07E] to-[#6F8746]",
    blue: "bg-gradient-to-r from-[#93C5FD] to-[#60A5FA]",
    violet: "bg-gradient-to-r from-[#C4B5FD] to-[#818CF8]",
    coral: "bg-gradient-to-r from-[#FFAAA6] to-[#F87171]",
    green: "bg-gradient-to-r from-[#A7E8BD] to-[#4ADE80]",
    orange: "bg-gradient-to-r from-[#FFE58F] to-[#FDBA74]",
  };

  return (
    <div className={`neu-inset-deep w-full overflow-hidden p-0.5 ${height} ${className}`}>
      <div
        className={`${height} rounded-full transition-all duration-500 shadow-sm ${
          gradients[gradient] || gradients.teal
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function NeuModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-2xl",
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1F2A2A]/40 p-4 backdrop-blur-md transition-all animate-fadeIn"
      onMouseDown={onClose}
    >
      <div
        className={`neu-card w-full ${maxWidth} max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E0EFEF] pb-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-[#1F2A2A]">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs text-[#6E7D7C]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-icon-btn h-8 w-8 text-[#6E7D7C] hover:text-[#1F2A2A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function NeuEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="neu-card p-10 text-center flex flex-col items-center justify-center">
      {Icon && (
        <div className="h-16 w-16 rounded-3xl neu-icon-btn bg-[#F1F5E8] text-[#6F8746] mb-4">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h4 className="text-lg font-bold text-[#1F2A2A]">{title}</h4>
      {description && (
        <p className="mt-1 max-w-md text-sm text-[#6E7D7C]">{description}</p>
      )}
      {actionLabel && onAction && (
        <NeuButton
          variant="primary"
          onClick={onAction}
          className="mt-5"
        >
          {actionLabel}
        </NeuButton>
      )}
    </div>
  );
}
