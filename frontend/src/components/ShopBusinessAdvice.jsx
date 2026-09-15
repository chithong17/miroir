const date = (value) => new Date(value).toLocaleDateString("vi-VN");

function SparkIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-6 w-6"><path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z" /><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z" /></svg>;
}

export default function ShopBusinessAdvice({ advice, status, error, onRetry }) {
  return (
    <section aria-labelledby="business-advice-title" className="mt-5 overflow-hidden rounded-2xl border border-[#DCE5D4] bg-[#F8FAF5] text-slate-800">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E9DC] bg-gradient-to-r from-[#EDF3E5] to-[#F8FAF5] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-xl border border-[#DCE5D4] bg-white p-2.5 text-[#587541]"><SparkIcon /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#587541]">Phân tích & đề xuất</p>
            <h2 id="business-advice-title" className="mt-1 text-xl font-bold tracking-tight text-[#243621]">Gợi ý kinh doanh</h2>
            <p className="mt-1 text-sm text-slate-600">Hiểu số liệu. Chọn việc cần làm. Theo dõi kết quả.</p>
          </div>
        </div>
        {advice?.period && status === "ready" && <div className="text-left text-xs text-slate-600 sm:text-right"><span className="inline-block rounded-full border border-[#DCE5D4] bg-white px-3 py-1.5 font-semibold">{advice.range.replace("d", "")} ngày gần nhất</span><p className="mt-2">{date(advice.period.start)} – {date(advice.period.end)}</p></div>}
      </header>

      {status === "loading" || status === "idle" ? <div role="status" className="p-6"><p className="text-sm text-slate-600">Đang tổng hợp số liệu và sắp xếp các đề xuất…</p><div aria-hidden="true" className="mt-4 grid animate-pulse gap-4 lg:grid-cols-3">{[1, 2, 3].map((key) => <div key={key} className="h-48 rounded-xl border border-slate-100 bg-white p-5"><div className="h-3 w-1/3 rounded bg-slate-100" /><div className="mt-4 h-5 w-3/4 rounded bg-slate-100" /><div className="mt-6 h-16 rounded bg-slate-50" /></div>)}</div></div>
        : status === "error" ? <div role="alert" className="p-6"><p className="text-sm text-slate-600">{error || "Chưa tải được gợi ý kinh doanh. Vui lòng thử lại."}</p><button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-[#354B2A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#26381E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#354B2A]">Thử lại</button></div>
          : advice && <div className="p-4 sm:p-6">
            {advice.dataQuality?.containsMockData && <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span className="font-bold">Dữ liệu mô phỏng</span><span>Kỳ này có {advice.dataQuality.mockOrderCount} đơn mẫu{advice.dataQuality.realOrderCount ? ` và ${advice.dataQuality.realOrderCount} đơn khác` : ""}. Dùng để minh họa cách phân tích.</span></div>}
            <div className="mb-5"><h3 className="text-base font-bold text-slate-900">{advice.headline}</h3><p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">{advice.summary}</p></div>
            <div className="grid items-stretch gap-4 xl:grid-cols-3">
              {(advice.sections || []).map((section, index) => <article key={section.id} className="flex min-w-0 flex-col rounded-xl border border-[#DFE6D9] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-[#587541]"><span className="mr-2 text-slate-400">0{index + 1}</span>{section.category}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${section.priority === "high" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{section.priority === "high" ? "Ưu tiên kiểm tra" : "Cần theo dõi"}</span></div>
                <h4 className="mt-3 text-lg font-bold leading-7 tracking-tight text-slate-900">{section.title}</h4>
                <div className="mt-4 rounded-lg border border-[#E5EBDD] bg-[#F7F9F4] p-3.5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#587541]">Dẫn chứng trong kỳ</p><dl className="mt-3 space-y-3">{section.evidence.map((item) => <div key={item.id}><dt className="text-xs leading-5 text-slate-600">{item.label}</dt><dd className="break-words text-sm font-bold leading-6 text-slate-900">{item.value}</dd></div>)}</dl></div>
                <div className="mt-4"><h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">Nhận định</h5><p className="mt-2 text-sm leading-6 text-slate-600">{section.reasoning}</p></div>
                <div className="mt-4"><h5 className="text-xs font-bold uppercase tracking-wide text-[#587541]">Hành động đề xuất</h5><ul className="mt-2 space-y-2.5">{section.actions.map((action, i) => <li key={action} className="flex gap-2.5 text-sm leading-6 text-slate-700"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EDF3E5] text-[10px] font-bold text-[#587541]">{i + 1}</span><span>{action}</span></li>)}</ul></div>
                <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500"><strong className="font-semibold text-slate-600">Giới hạn: </strong>{section.limitation}</p>
                <div className="mt-auto pt-4"><details className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"><summary className="cursor-pointer text-xs font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#587541]">Nguồn & cách tính · {section.evidence.length} dẫn chứng</summary><div className="mt-3 space-y-3">{section.evidence.map((item) => <div key={item.id} className="text-xs leading-5"><p className="font-bold text-slate-700">{item.label}</p><p className="text-[#587541]">Nguồn: {item.source}</p><p className="text-slate-500">{item.formula}</p></div>)}</div></details></div>
                <p className="mt-3 text-xs leading-5 text-slate-500"><strong>Theo dõi: </strong>{section.followUp}</p>
              </article>)}
            </div>
            <footer className="mt-5 flex flex-wrap justify-between gap-2 text-xs leading-5 text-slate-500"><p>{advice.source === "ai_ranked" ? "AI sắp xếp ưu tiên · Nhận định và số liệu được tính từ dữ liệu shop." : "Phân tích tự động từ dữ liệu shop · Ưu tiên theo các tín hiệu ghi nhận."}</p><p>Cập nhật {new Date(advice.createdAt).toLocaleString("vi-VN")}</p></footer>
          </div>}
    </section>
  );
}
