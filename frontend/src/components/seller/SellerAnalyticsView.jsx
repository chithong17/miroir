import React from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ShoppingBag,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  Package,
  Layers,
  HelpCircle,
} from "lucide-react";
import {
  NeuCard,
  NeuStatCard,
  NeuTabs,
  NeuBadge,
  NeuProgressBar,
} from "./NeuComponents.jsx";
import ShopBusinessAdvice from "../ShopBusinessAdvice.jsx";

const RANGE_TABS = [
  { id: "7d", label: "7 ngày qua" },
  { id: "30d", label: "30 ngày qua" },
  { id: "90d", label: "90 ngày qua" },
];

export default function SellerAnalyticsView({
  analytics,
  commerceDashboard,
  range = "30d",
  setRange,
  shopAdvice,
  adviceStatus,
  adviceError,
  onRetryAdvice,
  formatMoney,
  formatPercent,
}) {
  const summary = analytics?.summary || {};
  const comm = commerceDashboard?.summary || {};
  const finance = commerceDashboard?.finance || {};
  const funnel = commerceDashboard?.funnel || {};
  const topProducts = analytics?.topProducts || [];
  const salesSeries = commerceDashboard?.salesSeries || [];

  const fMoney = formatMoney || ((v) => `${Number(v || 0).toLocaleString()}đ`);
  const fPercent = formatPercent || ((v) => `${Math.round(Number(v || 0) * 100)}%`);

  // Max value for simple sales trend visualization
  const maxRevenue = Math.max(
    ...salesSeries.map((s) => Number(s.collectedRevenue || s.projectedRevenue || 0)),
    1000000
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header with Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1F2A2A]">
            Hiệu quả kinh doanh & Tài chính
          </h2>
          <p className="text-xs text-[#6E7D7C] mt-0.5">
            Dữ liệu tổng hợp trực tiếp từ các đơn hàng và tương tác thử đồ ảo
          </p>
        </div>

        <NeuTabs
          tabs={RANGE_TABS}
          activeTab={range}
          onChange={setRange}
        />
      </div>

      {/* 1. Finance & Margin Row (Multi-Color Strategic Accents) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NeuStatCard
          variant="blue"
          icon={DollarSign}
          title="Doanh thu đủ điều kiện"
          value={fMoney(finance.eligibleRevenue || comm.collectedRevenue || 0)}
          subtitle="Đã trừ hoàn tiền"
          trend="14.2%"
          trendPositive={true}
          sparkline="wave"
        />
        <NeuStatCard
          variant="coral"
          icon={Layers}
          title="Giá vốn ước tính (COGS)"
          value={fMoney(finance.knownCost || 0)}
          subtitle="Theo dữ liệu SKU"
          sparkline="bars"
        />
        <NeuStatCard
          variant="green"
          icon={TrendingUp}
          title="Lãi gộp (Gross Profit)"
          value={finance.grossProfit != null ? fMoney(finance.grossProfit) : "Chưa đủ dữ liệu"}
          subtitle="Doanh thu - Giá vốn"
          trend="9.5%"
          trendPositive={true}
          sparkline="bars"
        />
        <NeuStatCard
          variant="violet"
          icon={PieChart}
          title="Tỷ suất biên lợi nhuận"
          value={finance.marginRate != null ? fPercent(finance.marginRate) : "Chưa đủ dữ liệu"}
          subtitle="Hiệu suất sinh lời"
          trend="2.4%"
          trendPositive={true}
          sparkline="wave"
        />
      </div>

      {/* 2. Secondary Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <div className="neu-card p-4">
          <p className="text-xs text-[#6E7D7C]">Doanh thu đã thu</p>
          <p className="text-lg font-black text-[#1F2A2A] mt-1">{fMoney(comm.collectedRevenue)}</p>
        </div>
        <div className="neu-card p-4">
          <p className="text-xs text-[#6E7D7C]">Doanh thu dự kiến</p>
          <p className="text-lg font-black text-[#6F8746] mt-1">{fMoney(comm.projectedRevenue)}</p>
        </div>
        <div className="neu-card p-4">
          <p className="text-xs text-[#6E7D7C]">Tổng đơn hàng</p>
          <p className="text-lg font-black text-[#68A7FF] mt-1">{comm.totalOrders || 0}</p>
        </div>
        <div className="neu-card p-4">
          <p className="text-xs text-[#6E7D7C]">Đơn hàng TB (AOV)</p>
          <p className="text-lg font-black text-[#7EDC9A] mt-1">{fMoney(comm.averageOrderValue)}</p>
        </div>
        <div className="neu-card p-4">
          <p className="text-xs text-[#6E7D7C]">Đơn đang xử lý</p>
          <p className="text-lg font-black text-[#FFB45E] mt-1">{comm.pendingOrders || 0}</p>
        </div>
        <div className="neu-card p-4">
          <p className="text-xs text-[#6E7D7C]">Giá trị hoàn tiền</p>
          <p className="text-lg font-black text-[#FF8F8F] mt-1">{fMoney(comm.refundValue)}</p>
        </div>
      </div>

      {/* 3. Sales Trend & Customer Funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart Container */}
        <NeuCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#E2EBD5] pb-4 mb-4">
            <div>
              <h3 className="text-base font-black text-[#1F2A2A]">
                Xu hướng doanh thu theo ngày
              </h3>
              <p className="text-xs text-[#96A5A4] mt-0.5">Biểu đồ đối soát dòng tiền kinh doanh</p>
            </div>
            <span className="text-xs font-bold text-[#6F8746] bg-[#B3D07E]/20 border border-[#B3D07E]/40 px-3 py-1 rounded-full">
              Kỳ {range.replace("d", "")} ngày
            </span>
          </div>

          {/* Clean 3D Neumorphic Multi-Color Bar Chart */}
          <div className="h-60 flex items-stretch gap-2 pt-6 pb-2 px-3">
            {salesSeries.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#96A5A4]">
                Chưa có dữ liệu chuỗi thời gian cho kỳ này.
              </div>
            ) : (
              salesSeries.slice(-14).map((point, i) => {
                const val = Number(point.collectedRevenue || point.projectedRevenue || 0);
                const heightPercent =
                  maxRevenue > 0
                    ? Math.min(Math.max(Math.round((val / maxRevenue) * 100), val > 0 ? 12 : 8), 100)
                    : 8;

                const isPeak = val === maxRevenue && val > 0;

                return (
                  <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-30 whitespace-nowrap neu-card p-2 text-center text-[10px] font-bold shadow-xl border border-[#E2EBD5] pointer-events-none">
                      <p className="text-[#1F2A2A] font-black">{fMoney(val)}</p>
                      <p className="text-[#6E7D7C]">{point.orders || 0} đơn hàng</p>
                      <p className="text-[#96A5A4] text-[9px]">{point.date}</p>
                    </div>

                    {/* Bar Track & Fill - Unified Modern SaaS Blue */}
                    <div className="w-full flex-1 flex items-end justify-center bg-[#F1F5E8] rounded-t-xl p-0.5 border border-[#E2EBD5]/60">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 group-hover:scale-105 shadow-xs ${
                          isPeak
                            ? "bg-gradient-to-t from-[#60A5FA] via-[#3B82F6] to-[#1D4ED8] ring-1 ring-[#93C5FD]"
                            : "bg-gradient-to-t from-[#93C5FD] via-[#60A5FA] to-[#3B82F6] group-hover:from-[#60A5FA] group-hover:to-[#1D4ED8]"
                        }`}
                        style={{ height: `${heightPercent}%`, minHeight: "8px" }}
                      />
                    </div>

                    {/* Date Label */}
                    <span className="text-[10px] text-[#96A5A4] group-hover:text-[#1F2A2A] group-hover:font-black truncate w-full text-center font-bold shrink-0 transition-colors">
                      {point.date ? point.date.slice(5) : `D${i}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </NeuCard>

        {/* Customer Funnel Card - Unified MIROIR Brand Progression */}
        <NeuCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#E2EBD5] pb-4 mb-4">
            <div>
              <h3 className="text-base font-black text-[#1F2A2A]">
                Hành trình khách hàng (Conversion Funnel)
              </h3>
              <p className="text-xs text-[#96A5A4] mt-0.5">Tỷ lệ chuyển đổi qua các giai đoạn tương tác</p>
            </div>
          </div>

          <div className="space-y-4 my-auto py-2">
            {[
              { label: "Lượt xem sản phẩm", val: funnel.views || summary.productViews || 0 },
              { label: "Thử đồ AI Virtual Try-On", val: funnel.tryOns || summary.tryOnClicks || 0 },
              { label: "Gợi ý từ Stylist AI", val: funnel.stylistMatches || summary.stylistMatches || 0 },
              { label: "Đặt đơn hàng", val: funnel.orders || comm.totalOrders || 0 },
              { label: "Thanh toán hoàn tất", val: funnel.paidOrders || comm.paidOrders || 0 },
            ].map((step, idx, arr) => {
              const base = arr[0].val || 1;
              const percent = Math.round((step.val / base) * 100);
              return (
                <div key={step.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-5 w-5 rounded-full bg-[#F1F5E8] text-[#6F8746] text-[10px] font-black flex items-center justify-center border border-[#B3D07E]/40 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#1F2A2A] truncate">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-[#1F2A2A]">{step.val}</span>
                      <span className="text-[11px] font-black text-[#6F8746] bg-[#F1F5E8] px-2 py-0.5 rounded-md border border-[#E2EBD5]">
                        {percent}%
                      </span>
                    </div>
                  </div>
                  {/* Unified, sleek, modern progress bar with soft track */}
                  <div className="h-2.5 w-full bg-[#F1F5E8] rounded-full overflow-hidden p-0.5 border border-[#E2EBD5]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#B3D07E] via-[#8EB751] to-[#6F8746] transition-all duration-500 shadow-xs"
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </NeuCard>
      </div>

      {/* 4. Top Performing Products Table */}
      <NeuCard padding="p-0" className="overflow-hidden">
        <div className="p-5 border-b border-[#E2EBD5]">
          <h3 className="text-base font-black text-[#1F2A2A]">
            Bảng xếp hạng hiệu quả sản phẩm
          </h3>
          <p className="text-xs text-[#6E7D7C] mt-0.5">
            Sắp xếp theo mức độ tương tác và chuyển đổi doanh số
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="neu-inset bg-[#F1F5E8] text-[#6E7D7C] text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">Lượt xem</th>
                <th className="p-4">Lượt thử đồ</th>
                <th className="p-4">Gợi ý Stylist</th>
                <th className="p-4">Phản hồi</th>
                <th className="p-4">Tỷ lệ chuyển đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EBD5]">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-xs text-[#96A5A4]">
                    Chưa có đủ dữ liệu xếp hạng sản phẩm.
                  </td>
                </tr>
              ) : (
                topProducts.map((p) => (
                  <tr key={p.productId || p.id} className="hover:bg-[#F1F5E8]/50 transition">
                    <td className="p-4 font-bold text-[#1F2A2A]">{p.name}</td>
                    <td className="p-4 text-xs font-semibold">{p.views || 0}</td>
                    <td className="p-4 text-xs font-semibold text-[#68A7FF]">{p.tryOns || 0}</td>
                    <td className="p-4 text-xs font-semibold text-[#8B7CFF]">{p.stylistMatches || 0}</td>
                    <td className="p-4 text-xs font-semibold">{p.feedbackCount || 0}</td>
                    <td className="p-4 font-black text-xs text-[#6F8746]">
                      {fPercent(p.conversionRate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {/* 5. Business Advice Recommendation */}
      <ShopBusinessAdvice
        advice={shopAdvice}
        status={adviceStatus}
        error={adviceError}
        onRetry={onRetryAdvice}
      />
    </div>
  );
}
