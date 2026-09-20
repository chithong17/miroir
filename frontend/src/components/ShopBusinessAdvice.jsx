import React from "react";
import {
  Sparkles,
  Calendar,
  AlertCircle,
  Clock,
  BarChart2,
  Lightbulb,
  Target,
  Info,
  FileText,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return String(value);
  }
};

export default function ShopBusinessAdvice({ advice, status, error, onRetry }) {
  const displayRange = advice?.range ? advice.range.replace("d", "") : "30";

  return (
    <section
      aria-labelledby="business-advice-title"
      className="neu-card p-5 sm:p-7 mt-7 transition-all"
    >
      {/* 1. Header Section */}
      <header className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#E8EFE0]">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#B3D07E] to-[#6F8746] flex items-center justify-center text-white shadow-[0_6px_16px_rgba(111,135,70,0.3)] shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6F8746] bg-[#B3D07E]/20 px-2 py-0.5 rounded-md">
                Phân tích & Đề xuất AI
              </span>
            </div>
            <h2
              id="business-advice-title"
              className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-[#1F2A2A]"
            >
              Gợi ý kinh doanh
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-medium text-[#6E7D7C]">
              Hiểu số liệu · Chọn việc cần làm · Theo dõi kết quả
            </p>
          </div>
        </div>

        {advice?.period && status === "ready" && (
          <div className="neu-inset px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-[#E2EBD5]/80">
            <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-[#6F8746] shadow-2xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs font-black text-[#1F2A2A]">
                {displayRange} ngày gần nhất
              </div>
              <div className="text-[11px] font-medium text-[#7A8B89] mt-0.5">
                {formatDate(advice.period.start)} – {formatDate(advice.period.end)}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. Status States */}
      {status === "loading" || status === "idle" ? (
        <div role="status" className="py-10">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#6F8746]">
            <div className="h-4 w-4 rounded-full border-2 border-[#6F8746] border-t-transparent animate-spin" />
            <span>Đang tổng hợp số liệu và xếp hạng các đề xuất tối ưu…</span>
          </div>
          <div aria-hidden="true" className="mt-6 grid gap-5 lg:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-64 rounded-2xl bg-[#F9FAF5] border border-[#E8EFE0] p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 w-1/3 rounded-lg bg-[#E2EBD5]" />
                  <div className="h-6 w-3/4 rounded-lg bg-[#E8EFE0]" />
                </div>
                <div className="h-24 rounded-xl bg-white border border-[#E8EFE0]" />
              </div>
            ))}
          </div>
        </div>
      ) : status === "error" ? (
        <div role="alert" className="py-8">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 flex items-start gap-3.5 text-rose-900">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">
                {error || "Chưa tải được gợi ý kinh doanh. Vui lòng thử lại."}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="neu-btn-primary mt-3 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Thử lại
              </button>
            </div>
          </div>
        </div>
      ) : advice ? (
        <div className="pt-6">
          {/* Mock Data Banner */}
          {advice.dataQuality?.containsMockData && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-[#FFFDF5] px-4 py-3 text-xs text-amber-900 shadow-2xs">
              <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-extrabold uppercase tracking-wide text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-md">
                  Dữ liệu mô phỏng
                </span>
                <span className="font-medium text-amber-950">
                  Kỳ này có <strong className="font-bold">{advice.dataQuality.mockOrderCount}</strong> đơn mẫu
                  {advice.dataQuality.realOrderCount
                    ? ` và ${advice.dataQuality.realOrderCount} đơn khác`
                    : ""}
                  . Dùng để minh họa cách phân tích số liệu thực tế.
                </span>
              </div>
            </div>
          )}

          {/* Headline & Summary Banner */}
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#F4F7EE]/70 border border-[#E2EBD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-[#6F8746] mt-2 shrink-0 shadow-xs" />
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#1F2A2A] tracking-tight">
                  {advice.headline}
                </h3>
                <p className="mt-1 max-w-4xl text-xs sm:text-[13px] leading-relaxed text-[#6E7D7C]">
                  {advice.summary}
                </p>
              </div>
            </div>
            {advice.sections?.length > 0 && (
              <div className="shrink-0 self-start sm:self-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6F8746] bg-[#B3D07E]/20 px-3 py-1.5 rounded-xl border border-[#B3D07E]/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {advice.sections.length} trọng tâm hành động
                </span>
              </div>
            )}
          </div>

          {/* 3 Action Suggestion Cards Grid */}
          <div className="grid items-stretch gap-6 xl:grid-cols-3">
            {(advice.sections || []).map((section, index) => {
              const isHighPriority = section.priority === "high";

              return (
                <article
                  key={section.id}
                  className="neu-card-hover flex min-w-0 flex-col justify-between rounded-2xl bg-white border border-[#E2EBD5] p-5 sm:p-6 shadow-[4px_8px_20px_rgba(195,208,180,0.25),-4px_-4px_16px_#FFFFFF] hover:shadow-[8px_14px_28px_rgba(195,208,180,0.36),-6px_-6px_20px_#FFFFFF] transition-all duration-300 group"
                >
                  {/* Top: Category and Priority Badge */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#F0F4EB]">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-[#6F8746] bg-[#B3D07E]/25 px-2 py-0.5 rounded-lg">
                          0{index + 1}
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-[#4E6628] truncate">
                          {section.category}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.8 text-[10px] font-extrabold shadow-2xs ${
                          isHighPriority
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-[#F1F5E8] text-[#556B2F] border border-[#E2EBD5]"
                        }`}
                      >
                        {isHighPriority ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Ưu tiên kiểm tra
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-[#6F8746]" />
                            Cần theo dõi
                          </>
                        )}
                      </span>
                    </div>

                    {/* Action Title */}
                    <h4 className="mt-3 text-base sm:text-[17px] font-black leading-snug tracking-tight text-[#1F2A2A] min-h-[44px]">
                      {section.title}
                    </h4>

                    {/* Evidence Box (Dẫn chứng trong kỳ) */}
                    <div className="mt-4 rounded-xl border border-[#E5EBDD] bg-[#F9FAF5] p-3.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-[#6F8746] mb-2.5">
                        <span className="flex items-center gap-1.5">
                          <BarChart2 className="h-3.5 w-3.5 text-[#6F8746]" />
                          Dẫn chứng trong kỳ
                        </span>
                        <span className="text-[10px] font-medium text-[#96A5A4] lowercase">
                          {section.evidence.length} chỉ số
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {section.evidence.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl p-2.5 border border-[#E8EFE0] shadow-2xs flex flex-col justify-between"
                          >
                            <span
                              className="text-[11px] font-medium text-[#7A8B89] truncate"
                              title={item.label}
                            >
                              {item.label}
                            </span>
                            <span
                              className="text-sm sm:text-[15px] font-black text-[#1F2A2A] mt-0.5 tracking-tight truncate"
                              title={item.value}
                            >
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reasoning Box (Nhận định) */}
                    <div className="mt-3.5 rounded-xl bg-[#F1F5E8]/70 border border-[#E2EBD5] p-3.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#6F8746] mb-1">
                        <Lightbulb className="h-3.5 w-3.5 text-[#6F8746]" />
                        <span>Nhận định từ dữ liệu</span>
                      </div>
                      <p className="text-xs text-[#334141] leading-relaxed font-medium">
                        {section.reasoning}
                      </p>
                    </div>

                    {/* Action Items List (Hành động đề xuất) */}
                    <div className="mt-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#1F2A2A] mb-2">
                        <Target className="h-3.5 w-3.5 text-[#6F8746]" />
                        <span>Hành động đề xuất</span>
                      </div>
                      <ul className="space-y-2">
                        {section.actions.map((action, i) => (
                          <li
                            key={action}
                            className="group/action flex items-start gap-2.5 p-2 rounded-xl bg-white border border-[#EBF0E4] hover:border-[#B3D07E] hover:bg-[#F9FAF5] transition-all"
                          >
                            <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md bg-[#B3D07E]/25 text-[10px] font-black text-[#4E6628] group-hover/action:bg-[#6F8746] group-hover/action:text-white transition-colors">
                              {i + 1}
                            </span>
                            <span className="text-xs text-[#2C3B3A] font-medium leading-relaxed">
                              {action}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom: Limitation & Collapsible Details */}
                  <div className="mt-5 pt-3.5 border-t border-[#F0F4EB] space-y-2.5">
                    {/* Limitation notice */}
                    <div className="flex items-start gap-2 rounded-xl bg-[#F9FAF5] p-2.5 border border-[#EBF0E4] text-[11px] text-[#7A8B89] leading-relaxed">
                      <Info className="h-3.5 w-3.5 text-[#96A5A4] shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-[#556B2F]">Giới hạn: </strong>
                        <span>{section.limitation}</span>
                      </div>
                    </div>

                    {/* Interactive Accordion for Sources & Formula */}
                    <details className="group/dt rounded-xl bg-[#F9FAF5] border border-[#EBF0E4] transition-all overflow-hidden">
                      <summary className="cursor-pointer select-none flex items-center justify-between p-2.5 text-[11px] font-bold text-[#6E7D7C] hover:text-[#1F2A2A] focus:outline-none">
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-[#6F8746]" />
                          Nguồn & cách tính ({section.evidence.length} dẫn chứng)
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-[#96A5A4] transition-transform duration-200 group-open/dt:rotate-180" />
                      </summary>
                      <div className="p-3 pt-1 space-y-2.5 border-t border-[#EBF0E4] bg-white">
                        {section.evidence.map((item) => (
                          <div key={item.id} className="text-[11px] space-y-0.5">
                            <div className="font-bold text-[#1F2A2A]">{item.label}</div>
                            <div className="text-[#556B2F] font-semibold text-[10px]">
                              Nguồn: {item.source}
                            </div>
                            <div className="text-[#7A8B89] italic font-mono text-[10px]">
                              {item.formula}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Follow Up Reminder */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7A8B89] px-1 pt-1">
                      <Clock className="h-3 w-3 text-[#6F8746] shrink-0" />
                      <span className="truncate">
                        <strong className="text-[#556B2F]">Theo dõi: </strong>
                        {section.followUp}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 4. Footer info */}
          <footer className="mt-7 pt-4 border-t border-[#E8EFE0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7A8B89]">
            <p className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#6F8746]" />
              {advice.source === "ai_ranked"
                ? "AI sắp xếp ưu tiên dựa trên dữ liệu giao dịch thực tế của shop."
                : "Phân tích tự động từ dữ liệu shop theo các quy tắc kiểm soát chuẩn."}
            </p>
            <p>
              Cập nhật lúc:{" "}
              <strong className="text-[#556B2F]">
                {new Date(advice.createdAt).toLocaleString("vi-VN")}
              </strong>
            </p>
          </footer>
        </div>
      ) : null}
    </section>
  );
}
