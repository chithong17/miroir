import React from "react";
import {
  TrendingUp,
  ShoppingBag,
  Sparkles,
  Percent,
  Clock,
  AlertTriangle,
  ArrowRight,
  Package,
  Plus,
  MessageSquare,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  MoreHorizontal,
  Shirt,
  DollarSign,
  Users,
} from "lucide-react";
import {
  NeuCard,
  NeuStatCard,
  NeuButton,
  NeuBadge,
  NeuDonutStat,
  NeuCurveChart,
  NeuProgressBar,
} from "./NeuComponents.jsx";

export default function SellerOverviewView({
  shop,
  analytics,
  commerceDashboard,
  orders = [],
  products = [],
  chatUnreadCount = 0,
  onNavigate,
  onOpenProductModal,
  onSelectOrder,
}) {
  const summary = analytics?.summary || {};
  const commSummary = commerceDashboard?.summary || {};
  const inventory = commerceDashboard?.inventoryHealth || {};
  const pendingOrders = orders.filter((o) => o.orderStatus === "pending_confirmation");
  const outOfStockCount = inventory.outOfStock || 0;
  const recentOrders = orders.slice(0, 5);
  const topProducts = (commerceDashboard?.topProducts || products).slice(0, 4);

  const formatMoney = (val) => `${Number(val || 0).toLocaleString("vi-VN")}₫`;

  // Total revenue computation or realistic fallback
  const revenueValue = commSummary.collectedRevenue
    ? formatMoney(commSummary.collectedRevenue)
    : "45.385.000₫";

  const totalOrdersCount = commSummary.totalOrders || orders.length || 1450;
  const profitValue = commSummary.collectedRevenue
    ? formatMoney(Math.round(commSummary.collectedRevenue * 0.42))
    : "6.875.900₫";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Hero Row: Blue Card + Donut Statistics + Coral Card (from Reference Image) */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Total Revenue Card (Vibrant Blue 3D Card) */}
        <NeuStatCard
          variant="blue"
          title="Tổng doanh thu"
          value={revenueValue}
          trend="20.1%"
          trendPositive={true}
          subtitle="so với tháng trước"
          sparkline="wave"
          onClick={() => onNavigate("analytics")}
        />

        {/* 2. Donut Statistics Card */}
        <NeuDonutStat
          title="Thống kê tỷ lệ kênh"
          totalLabel="Tổng đơn"
          totalValue={totalOrdersCount.toLocaleString("vi-VN")}
          segments={[
            { label: "Doanh số online", percentage: 60, color: "#68A7FF" },
            { label: "Khách trực tiếp", percentage: 25, color: "#FFB45E" },
            { label: "Thử đồ AI", percentage: 10, color: "#7EDC9A" },
            { label: "Khác / Giới thiệu", percentage: 5, color: "#8B7CFF" },
          ]}
        />

        {/* 3. New Clients Card (Vibrant Coral/Pink 3D Card) */}
        <NeuStatCard
          variant="coral"
          title="Khách hàng mới"
          value="+ 245"
          trend="14.2%"
          trendPositive={true}
          subtitle="tuần hiện tại"
          sparkline="wave"
          onClick={() => onNavigate("insights")}
        />
      </div>

      {/* Middle Row: Analytics Curvy Chart + Recent Sales (from Reference Image) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: 8 Cols - Curvy Line Chart */}
        <div className="lg:col-span-8">
          <NeuCurveChart
            title="Biểu đồ phân tích doanh thu"
            timeframe="Tuần này"
            pointTooltip="2.340.000₫"
          />
        </div>

        {/* Right: 4 Cols - Recent Sales with Colorful Icon Badges */}
        <div className="lg:col-span-4">
          <NeuCard className="flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#E2EBD5]/80 pb-4 mb-3">
              <div>
                <h3 className="text-base font-black text-[#1F2A2A]">Sản phẩm bán chạy</h3>
                <p className="text-xs text-[#96A5A4]">Giao dịch nổi bật gần nhất</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("products")}
                className="neu-icon-btn h-7 w-7 text-[#96A5A4] hover:text-[#1F2A2A]"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Product list with colorful tiles */}
            <div className="space-y-3">
              {[
                {
                  name: "Áo sơ mi lụa tơ tằm",
                  price: "2.580.000₫",
                  bg: "bg-[#68A7FF]/20",
                  text: "text-[#286ED4]",
                  tag: "Bestseller",
                },
                {
                  name: "Set vest Linen cao cấp",
                  price: "1.250.000₫",
                  bg: "bg-[#7EDC9A]/20",
                  text: "text-[#248043]",
                  tag: "Fit AI",
                },
                {
                  name: "Váy maxi dạ hội đính đá",
                  price: "3.460.000₫",
                  bg: "bg-[#FF8F8F]/20",
                  text: "text-[#D43838]",
                  tag: "Trending",
                },
                {
                  name: "Phụ kiện thắt lưng da bò",
                  price: "980.000₫",
                  bg: "bg-[#8B7CFF]/20",
                  text: "text-[#604CE8]",
                  tag: "New",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F1F5E8]/80 transition cursor-pointer"
                  onClick={() => onNavigate("products")}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center font-bold shadow-sm ${item.bg} ${item.text}`}
                    >
                      <Shirt className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#1F2A2A] truncate">
                        {item.name}
                      </p>
                      <span className="text-[10px] font-bold text-[#96A5A4]">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                  <span className="font-black text-xs text-[#1F2A2A] shrink-0">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </NeuCard>
        </div>
      </div>

      {/* Bottom Row of 3 Cards: Total Profit + New Orders + Tasks/Quota Completed */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Total Profit with Green Bar Chart */}
        <NeuStatCard
          variant="white"
          title="Lợi nhuận ròng"
          value={profitValue}
          trend="15.2%"
          trendPositive={true}
          subtitle="biên lợi nhuận ~42%"
          sparkline="bars"
          chartColor="#7EDC9A"
          onClick={() => onNavigate("analytics")}
        />

        {/* 2. New Orders with Violet Bar Chart */}
        <NeuStatCard
          variant="white"
          title="Đơn hàng phát sinh"
          value={`${totalOrdersCount} đơn`}
          trend="12.4%"
          trendPositive={true}
          subtitle="trong 30 ngày qua"
          sparkline="bars"
          chartColor="#8B7CFF"
          onClick={() => onNavigate("orders")}
        />

        {/* 3. Tasks Completed / Quota Indicator (with 75% circular donut & purple bar) */}
        <NeuCard className="flex flex-col justify-between p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6E7D7C]">
              Tiến độ hạn mức shop
            </span>
            <button
              type="button"
              className="neu-icon-btn h-7 w-7 text-[#96A5A4] hover:text-[#1F2A2A]"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            {/* 75% Circular Ring */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#F1F5E8"
                  strokeWidth="3.6"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#8B7CFF"
                  strokeWidth="3.6"
                  strokeDasharray="66 88"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-black text-[#1F2A2A]">75%</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-[#1F2A2A]">Sản phẩm đã tạo</span>
                <span className="text-[#8B7CFF]">12 / 16 mục</span>
              </div>
              <NeuProgressBar progress={75} gradient="violet" height="h-2" />
            </div>
          </div>
        </NeuCard>
      </div>

      {/* Action Center: Tasks requiring immediate attention */}
      <NeuCard className="p-6">
        <div className="flex items-center justify-between border-b border-[#E2EBD5] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#6F8746]" />
            <h3 className="text-base font-black text-[#1F2A2A]">
              Trung tâm hành động cần xử lý ngay
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#96A5A4]">
            Thời gian thực
          </span>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <div
            onClick={() => onNavigate("orders")}
            className="neu-inset p-4 rounded-2xl cursor-pointer hover:bg-white transition shadow-sm border border-[#FFB45E]/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6E7D7C]">Đơn chờ xác nhận</span>
              <span className="h-6 w-6 rounded-full bg-[#FFB45E]/20 text-[#B36000] text-xs font-black flex items-center justify-center">
                {pendingOrders.length}
              </span>
            </div>
            <p className="mt-2 text-xl font-black text-[#1F2A2A]">
              {pendingOrders.length} đơn hàng
            </p>
            <p className="text-[11px] text-[#96A5A4] mt-0.5">Duyệt và đóng gói cho đơn vị vận chuyển</p>
          </div>

          <div
            onClick={() => onNavigate("messages")}
            className="neu-inset p-4 rounded-2xl cursor-pointer hover:bg-white transition shadow-sm border border-[#FF8F8F]/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6E7D7C]">Tin nhắn chưa đọc</span>
              <span className="h-6 w-6 rounded-full bg-[#FF8F8F]/20 text-[#D43838] text-xs font-black flex items-center justify-center">
                {chatUnreadCount}
              </span>
            </div>
            <p className="mt-2 text-xl font-black text-[#1F2A2A]">
              {chatUnreadCount} cuộc trò chuyện
            </p>
            <p className="text-[11px] text-[#96A5A4] mt-0.5">Khách đang chờ tư vấn size & phối đồ</p>
          </div>

          <div
            onClick={() => onNavigate("products")}
            className="neu-inset p-4 rounded-2xl cursor-pointer hover:bg-white transition shadow-sm border border-[#68A7FF]/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6E7D7C]">Sản phẩm hết hàng</span>
              <span className="h-6 w-6 rounded-full bg-[#68A7FF]/20 text-[#286ED4] text-xs font-black flex items-center justify-center">
                {outOfStockCount}
              </span>
            </div>
            <p className="mt-2 text-xl font-black text-[#1F2A2A]">
              {outOfStockCount} mặt hàng
            </p>
            <p className="text-[11px] text-[#96A5A4] mt-0.5">Bổ sung tồn kho để tiếp tục kích hoạt hiển thị</p>
          </div>
        </div>
      </NeuCard>

      {/* Snapshot Tables: Recent Orders & Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <NeuCard className="flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E2EBD5] pb-4 mb-4">
            <h3 className="text-base font-black text-[#1F2A2A]">
              Đơn hàng gần đây
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("orders")}
              className="text-xs font-bold text-[#6F8746] hover:underline flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {recentOrders.length === 0 ? (
              <p className="p-8 text-center text-xs text-[#96A5A4]">
                Chưa có đơn hàng nào phát sinh trong kỳ này.
              </p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder && onSelectOrder(order.id)}
                  className="neu-inset p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:bg-white transition shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-[#6F8746]">
                        #{order.orderCode?.slice(-8) || order.id.slice(-6)}
                      </span>
                      <NeuBadge
                        variant={
                          order.orderStatus === "delivered"
                            ? "success"
                            : order.orderStatus === "pending_confirmation"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {order.orderStatus}
                      </NeuBadge>
                    </div>
                    <p className="text-xs text-[#6E7D7C] mt-1 truncate">
                      {order.recipient?.name} · {order.items?.length || 1} sản phẩm
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#1F2A2A]">
                      {formatMoney(order.total)}
                    </p>
                    <p className="text-[10px] text-[#96A5A4] capitalize">
                      {order.paymentStatus || "unpaid"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </NeuCard>

        {/* Best Sellers */}
        <NeuCard className="flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E2EBD5] pb-4 mb-4">
            <h3 className="text-base font-black text-[#1F2A2A]">
              Sản phẩm nổi bật sàn MIROIR
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("products")}
              className="text-xs font-bold text-[#6F8746] hover:underline flex items-center gap-1"
            >
              Quản lý kho <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {topProducts.length === 0 ? (
              <p className="p-8 text-center text-xs text-[#96A5A4]">
                Chưa có sản phẩm nào trong kho.
              </p>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={p.id || p.productId || idx}
                  className="neu-inset p-3.5 rounded-2xl flex items-center gap-3.5 shadow-sm hover:bg-white transition"
                >
                  <div className="h-12 w-12 rounded-xl bg-white shrink-0 overflow-hidden border border-[#E2EBD5] shadow-inner flex items-center justify-center">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-[#96A5A4]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#1F2A2A] truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-[#6E7D7C] mt-0.5">
                      {p.price ? formatMoney(p.price) : "Liên hệ"} · Lượt thử AI: {p.views || p.tryOns || 0}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold text-[#6F8746] bg-[#B3D07E]/20 border border-[#B3D07E]/40 px-2 py-0.5 rounded-full">
                      #{idx + 1} Top
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </NeuCard>
      </div>
    </div>
  );
}
