import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  FileDown,
  Lightbulb,
  User,
  Shirt,
  ShoppingCart,
  CircleDollarSign,
  Target,
  ClipboardList,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Layers,
  HelpCircle,
} from "lucide-react";

export default function ShopAiReport({ title, report, status, onRetry, retryLabel }) {
  const data = report?.structuredData;

  return (
    <section className="neu-card p-5 sm:p-7 mt-7 transition-all" aria-live="polite">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E8EFE0]">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#B3D07E] to-[#6F8746] flex items-center justify-center text-white shadow-[0_6px_16px_rgba(111,135,70,0.3)] shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6F8746] bg-[#B3D07E]/20 px-2 py-0.5 rounded-md">
                Dựa trên dữ liệu hành vi & phân khúc
              </span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-[#1F2A2A]">
              {title}
            </h2>
          </div>
        </div>

        <button
          className="neu-btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-black shadow-md cursor-pointer"
          type="button"
        >
          <FileDown className="h-4 w-4" />
          <span>Tải báo cáo PDF</span>
        </button>
      </header>

      <div className="pt-6">
        {/* Loading State */}
        {status === "loading" ? (
          <div className="py-8 animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded-xl bg-[#E8EFE0]" />
            <div className="h-4 w-1/2 rounded-xl bg-[#E8EFE0]" />
            <div className="h-4 w-5/6 rounded-xl bg-[#E8EFE0]" />
          </div>
        ) : null}

        {/* Error State */}
        {status === "error" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 flex flex-wrap items-center justify-between gap-3 text-rose-900">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <p className="text-sm font-semibold">
                Dịch vụ AI tạm thời chưa phản hồi. Số liệu phân tích của shop vẫn có thể xem bình thường.
              </p>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="neu-btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {retryLabel || "Thử lại"}
            </button>
          </div>
        ) : null}

        {data ? (
          <div className="space-y-7">
            {/* 1. Style Section */}
            {data.style ? (
              <div className="neu-card-hover rounded-2xl border border-[#E2EBD5] bg-white p-5 sm:p-6 shadow-[4px_8px_20px_rgba(195,208,180,0.25),-4px_-4px_16px_#FFFFFF] transition-all">
                {/* Section Header */}
                <div className="flex items-center gap-3.5 border-b border-[#F0F4EB] pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#B3D07E] to-[#6F8746] text-white font-black text-sm shadow-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-[#1F2A2A] tracking-tight">
                      Phân tích phong cách (Style)
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6E7D7C] font-medium">
                      Xu hướng, đặc điểm khách hàng và tông màu được ưa chuộng
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-6 lg:grid-cols-2">
                  {/* Left Column: Xu hướng phong cách chủ đạo */}
                  <div className="rounded-2xl bg-[#F9FAF5] border border-[#E8EFE0] p-5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider text-[#556B2F] flex items-center gap-2 mb-4">
                        <Sparkles className="h-4 w-4 text-[#6F8746]" />
                        Xu hướng phong cách chủ đạo
                      </h4>
                      <div className="grid gap-3.5">
                        {data.style.topStyles?.map((style, i) => (
                          <div key={i} className="text-sm">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-bold text-[#1F2A2A] text-[13px]">
                                {style.name}
                              </span>
                              <span className="text-xs font-black text-[#556B2F] bg-[#B3D07E]/20 px-2 py-0.5 rounded-md">
                                {style.percentage}%
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-2.5 flex-1 rounded-full bg-[#E8EFE0] overflow-hidden p-0.5 shadow-inner">
                                <div
                                  className="h-full bg-gradient-to-r from-[#B3D07E] to-[#6F8746] rounded-full transition-all duration-500 shadow-2xs"
                                  style={{ width: `${style.percentage}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-[#7A8B89] w-14 text-right">
                                {style.count} lượt
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {data.style.advice ? (
                      <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#E2EBD5] bg-white p-3.5 text-xs text-[#334141] shadow-2xs">
                        <div className="h-6 w-6 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                          <Lightbulb className="h-3.5 w-3.5" />
                        </div>
                        <div className="leading-relaxed">
                          <strong className="text-[#1F2A2A] font-bold">Gợi ý: </strong>
                          {data.style.advice}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Right Column: Đặc điểm khách hàng & Tông màu yêu thích */}
                  <div className="rounded-2xl bg-[#F9FAF5] border border-[#E8EFE0] p-5 flex flex-col justify-between shadow-2xs">
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider text-[#556B2F] mb-3.5">
                        Đặc điểm khách hàng
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E8EFE0] shadow-2xs">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-pink-50 border border-pink-200/70 text-pink-500 shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm text-[#1F2A2A] truncate">
                              {data.style.customerProfile?.topGender?.name || "N/A"}
                            </p>
                            <p className="text-[11px] text-[#7A8B89] font-medium mt-0.5">
                              {data.style.customerProfile?.topGender?.count} lượt (
                              {data.style.customerProfile?.topGender?.percentage}%)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E8EFE0] shadow-2xs">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#EDF3E5] border border-[#DCE5D4] text-[#6F8746] shrink-0">
                            <Shirt className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm text-[#1F2A2A] truncate">
                              {data.style.customerProfile?.topBodyShape?.name || "N/A"}
                            </p>
                            <p className="text-[11px] text-[#7A8B89] font-medium mt-0.5">
                              {data.style.customerProfile?.topBodyShape?.count} lượt (
                              {data.style.customerProfile?.topBodyShape?.percentage}%)
                            </p>
                          </div>
                        </div>
                      </div>

                      {data.style.favoriteColors?.length > 0 ? (
                        <>
                          <h4 className="mt-5 font-black text-xs uppercase tracking-wider text-[#556B2F] mb-3">
                            Tông màu yêu thích
                          </h4>
                          <div className="flex flex-wrap items-center gap-3">
                            {data.style.favoriteColors.map((color, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-[#E8EFE0] shadow-2xs"
                              >
                                <div
                                  className="h-6 w-6 rounded-full border border-black/10 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)]"
                                  style={{ backgroundColor: color.hex || "#ccc" }}
                                />
                                <span className="text-xs font-bold text-[#1F2A2A]">
                                  {color.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* 2. Budget Section */}
            {data.budget ? (
              <div className="neu-card-hover rounded-2xl border border-[#E2EBD5] bg-white p-5 sm:p-6 shadow-[4px_8px_20px_rgba(195,208,180,0.25),-4px_-4px_16px_#FFFFFF] transition-all">
                {/* Section Header */}
                <div className="flex items-center gap-3.5 border-b border-[#F0F4EB] pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#B3D07E] to-[#6F8746] text-white font-black text-sm shadow-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-[#1F2A2A] tracking-tight">
                      Phân tích ngân sách (Budget)
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6E7D7C] font-medium">
                      Tổng quan dữ liệu đơn hàng và hiệu quả chi tiêu
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_240px_1fr]">
                  {/* Column 1: Segments */}
                  <div className="grid gap-3">
                    {data.budget.segments?.map((seg, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-[#E8EFE0] p-3.5 shadow-2xs bg-[#F9FAF5] flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-[#6F8746]" />
                            <p className="font-bold text-sm text-[#1F2A2A]">{seg.name}</p>
                          </div>
                          <span className="text-xs font-black text-[#556B2F] bg-[#B3D07E]/20 px-2 py-0.5 rounded-md">
                            {seg.percentage}%
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-[#7A8B89] mt-1 mb-2 ml-6">
                          {seg.count} lượt ghi nhận
                        </p>
                        <div className="h-2 w-full rounded-full bg-[#E8EFE0] overflow-hidden p-0.5 shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-[#B3D07E] to-[#6F8746] rounded-full transition-all duration-500 shadow-2xs"
                            style={{ width: `${seg.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Column 2: AOV Center Card */}
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#F4F7EE] to-[#F9FAF5] p-5 text-center border border-[#E2EBD5] shadow-2xs">
                    <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#6F8746] shadow-[0_4px_12px_rgba(111,135,70,0.18)] border border-[#E2EBD5]">
                      <CircleDollarSign className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7A8B89]">
                      Giá trị đơn hàng TB (AOV)
                    </p>
                    <p className="mt-1.5 text-2xl font-black text-[#1F2A2A] tracking-tight">
                      {data.budget.aov || "N/A"}
                    </p>
                  </div>

                  {/* Column 3: Insight */}
                  <div className="rounded-2xl bg-[#F9FAF5] p-5 border border-[#E8EFE0] shadow-2xs flex flex-col">
                    <h4 className="font-black text-xs uppercase tracking-wider text-[#556B2F] flex items-center gap-2 mb-2.5">
                      <Target className="h-4 w-4 text-[#6F8746]" />
                      Nhận định
                    </h4>
                    <p className="text-xs sm:text-[13px] text-[#334141] leading-relaxed font-normal">
                      {data.budget.insight}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* 3. Strategy Priorities Section */}
            {data.priorities?.length > 0 ? (
              <div className="neu-card-hover rounded-2xl border border-[#E2EBD5] bg-white p-5 sm:p-6 shadow-[4px_8px_20px_rgba(195,208,180,0.25),-4px_-4px_16px_#FFFFFF] transition-all">
                {/* Section Header */}
                <div className="flex items-center gap-3.5 border-b border-[#F0F4EB] pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#B3D07E] to-[#6F8746] text-white font-black text-sm shadow-xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-[#1F2A2A] tracking-tight">
                      Ưu tiên chiến lược
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6E7D7C] font-medium">
                      Các đề xuất hành động dựa trên phân tích dữ liệu
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {data.priorities.map((priority, i) => (
                    <article
                      key={i}
                      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2EBD5] bg-[#F9FAF5] shadow-2xs hover:shadow-md transition-all duration-300"
                    >
                      <div className="p-5 flex-1">
                        <div className="flex items-start gap-3.5">
                          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#6F8746] border border-[#E2EBD5] shadow-2xs">
                            {i === 0 ? (
                              <Shirt className="h-5 w-5" />
                            ) : i === 1 ? (
                              <ClipboardList className="h-5 w-5" />
                            ) : (
                              <TrendingUp className="h-5 w-5" />
                            )}
                          </span>
                          <div>
                            <span className="inline-flex items-center rounded-lg bg-[#B3D07E]/30 text-[#4E6628] border border-[#B3D07E]/50 px-2.5 py-0.8 text-[10px] font-black uppercase tracking-wider mb-1.5 shadow-2xs">
                              Ưu tiên {priority.id || i + 1}
                            </span>
                            <h4 className="font-black text-[#1F2A2A] text-base leading-snug tracking-tight">
                              {priority.title}
                            </h4>
                          </div>
                        </div>

                        {/* Evidences list */}
                        <ul className="mt-4 space-y-2 text-xs sm:text-[13px] text-[#4A5958] ml-2 sm:ml-4">
                          {priority.evidences?.map((ev, j) => (
                            <li key={j} className="flex items-start gap-2.5">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6F8746]" />
                              <span className="leading-relaxed">{ev}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Action Proposal */}
                        {priority.action ? (
                          <div className="mt-4 rounded-xl bg-white p-3.5 text-xs border border-[#E2EBD5] shadow-2xs">
                            <strong className="text-[#556B2F] flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] mb-1">
                              <Sparkles className="h-3.5 w-3.5 text-[#6F8746]" />
                              {priority.actionLabel || "Đề xuất"}
                            </strong>
                            <p className="text-[#334141] leading-relaxed font-medium">
                              {priority.action}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      {/* Potential Impact */}
                      {priority.impact?.revenue ? (
                        <div className="flex items-center justify-between border-t border-[#E8EFE0] bg-white p-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F4F7EE] text-[#6F8746] shadow-2xs">
                              <BarChart3 className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-xs font-bold text-[#1F2A2A]">
                                Tác động tiềm năng
                              </p>
                              <p className="text-[11px] text-[#7A8B89]">
                                {priority.impact.description}
                              </p>
                            </div>
                          </div>
                          <p className="font-black text-base text-[#556B2F]">
                            {priority.impact.revenue}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 4. Additional Markdown Advice */}
            {(data.additionalAdvice || report?.text) && (
              <div className="neu-card-hover rounded-2xl border border-[#E2EBD5] bg-[#F9FAF5] p-6 shadow-2xs">
                <h3 className="text-lg font-black text-[#1F2A2A] border-b border-[#E8EFE0] pb-3.5 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#6F8746]" />
                  Tư vấn bổ sung từ AI
                </h3>
                <div className="mt-4 text-sm leading-relaxed text-[#334141] space-y-3 [&>h1]:text-lg [&>h1]:font-black [&>h1]:text-[#1F2A2A] [&>h2]:text-base [&>h2]:font-bold [&>h2]:mt-4 [&>h2]:text-[#556B2F] [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-[#1F2A2A] [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:ml-5 [&>p]:mt-2 [&>strong]:font-bold [&>strong]:text-[#1F2A2A]">
                  <ReactMarkdown>{data.additionalAdvice || report.text}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ) : report?.text ? (
          <div className="neu-card-hover rounded-2xl border border-[#E2EBD5] bg-[#F9FAF5] p-6 text-sm leading-relaxed text-[#334141] space-y-4">
            <ReactMarkdown>{report.text}</ReactMarkdown>
          </div>
        ) : null}
      </div>
    </section>
  );
}
