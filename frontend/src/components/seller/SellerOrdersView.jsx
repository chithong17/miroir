import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Copy,
  ExternalLink,
  MessageSquare,
  X,
  FileText,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  NeuCard,
  NeuButton,
  NeuInput,
  NeuSearch,
  NeuBadge,
  NeuTabs,
  NeuModal,
  NeuStatCard,
} from "./NeuComponents.jsx";

const ORDER_SEGMENTS = [
  { id: "all", label: "Tất cả" },
  { id: "payment", label: "Chờ thanh toán" },
  { id: "transport", label: "Vận chuyển" },
  { id: "delivery", label: "Chờ giao hàng" },
  { id: "completed", label: "Hoàn thành" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "returns", label: "Trả hàng / Hoàn tiền" },
];

const ORDER_STATUS_LABELS = {
  pending_confirmation: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  delivered: "Đã giao hàng",
  cancel_requested: "Yêu cầu hủy",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

const PAYMENT_STATUS_LABELS = {
  cod_pending: "Tiền mặt (COD) – chưa thu",
  awaiting_transfer: "Chờ chuyển khoản",
  pending_verification: "Chờ đối soát biên lai",
  paid: "Đã thanh toán",
  refund_pending: "Chờ hoàn tiền",
  refunded: "Đã hoàn tiền",
};

export default function SellerOrdersView({
  orders = [],
  returns = [],
  disputes = [],
  onSelectOrder,
  onUpdateOrderStatus,
  onUpdateOrderPayment,
  onReplyDispute,
  onStartChat,
  formatMoney,
}) {
  const [activeSegment, setActiveSegment] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const returnOrderIds = useMemo(
    () => new Set((returns || []).map((item) => item.orderId)),
    [returns]
  );

  const isInSegment = (order, segment) => {
    if (segment === "all") return true;
    const isReturn =
      returnOrderIds.has(order.id) ||
      ["refund_pending", "refunded"].includes(order.paymentStatus);
    if (segment === "returns") return isReturn;
    if (isReturn) return false;
    if (segment === "payment")
      return (
        order.orderStatus === "pending_confirmation" ||
        ["cod_pending", "awaiting_transfer", "pending_verification"].includes(
          order.paymentStatus
        )
      );
    if (segment === "transport")
      return ["confirmed", "preparing"].includes(order.orderStatus);
    if (segment === "delivery") return order.orderStatus === "shipping";
    if (segment === "completed") return order.orderStatus === "delivered";
    return ["cancel_requested", "cancelled", "expired"].includes(order.orderStatus);
  };

  const segmentCounts = useMemo(() => {
    const counts = {};
    ORDER_SEGMENTS.forEach(({ id }) => {
      counts[id] = orders.filter((o) => isInSegment(o, id)).length;
    });
    return counts;
  }, [orders, returnOrderIds]);

  const filteredOrders = orders.filter((o) => {
    const inSeg = isInSegment(o, activeSegment);
    const matchesSearch =
      (o.orderCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.recipient?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.recipient?.phone || "").includes(search);
    const matchesStatus = statusFilter ? o.orderStatus === statusFilter : true;
    const matchesPayment = paymentFilter ? o.paymentStatus === paymentFilter : true;
    return inSeg && matchesSearch && matchesStatus && matchesPayment;
  });

  const kpis = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((item) => item.orderStatus === "pending_confirmation").length,
      verification: orders.filter((item) => item.paymentStatus === "pending_verification").length,
      revenue: orders
        .filter((item) => item.paymentStatus === "paid")
        .reduce((sum, item) => sum + (item.total || 0), 0),
    };
  }, [orders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NeuStatCard
          variant="blue"
          icon={ShoppingBag}
          title="Tổng số đơn hàng"
          value={kpis.total}
          subtitle="Tất cả thời gian"
          sparkline="wave"
        />
        <NeuStatCard
          variant="coral"
          icon={Clock}
          title="Đơn chờ duyệt"
          value={kpis.pending}
          subtitle="Cần đóng gói ngay"
          sparkline="bars"
        />
        <NeuStatCard
          variant="violet"
          icon={FileText}
          title="Chờ đối soát biên lai"
          value={kpis.verification}
          subtitle="Khách đã gửi ảnh"
          sparkline="bars"
        />
        <NeuStatCard
          variant="green"
          icon={CheckCircle2}
          title="Doanh thu đơn đã trả"
          value={formatMoney ? formatMoney(kpis.revenue) : `${kpis.revenue.toLocaleString()}đ`}
          subtitle="Đã quyết toán"
          trend="8.2%"
          trendPositive={true}
          sparkline="bars"
        />
      </div>

      {/* Segment Tabs */}
      <NeuTabs
        tabs={ORDER_SEGMENTS.map((s) => ({
          ...s,
          count: segmentCounts[s.id] || 0,
        }))}
        activeTab={activeSegment}
        onChange={setActiveSegment}
      />

      {/* Filter and Search Controls */}
      <div className="neu-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <NeuSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Tìm theo mã đơn, người nhận, SĐT..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="neu-input px-3.5 py-2 text-xs font-semibold"
          >
            <option value="">Tất cả trạng thái đơn</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="neu-input px-3.5 py-2 text-xs font-semibold"
          >
            <option value="">Tất cả thanh toán</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <NeuCard padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="neu-inset bg-[#F1F5E8] text-[#6E7D7C] text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Mã đơn hàng</th>
                <th className="p-4">Người nhận & Địa chỉ</th>
                <th className="p-4">Trạng thái đơn</th>
                <th className="p-4">Thanh toán</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EBD5]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xs text-[#96A5A4]">
                    Không có đơn hàng nào trong phân đoạn này.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isReturn = returnOrderIds.has(order.id);
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#F1F5E8]/60 transition group"
                    >
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(order.orderCode)}
                          className="font-mono font-black text-xs text-[#6F8746] hover:underline flex items-center gap-1.5"
                          title="Bấm để sao chép"
                        >
                          <span>{order.orderCode}</span>
                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                        <p className="text-[10px] text-[#96A5A4] mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-sm text-[#1F2A2A]">
                          {order.recipient?.name || "Khách mua"}
                        </p>
                        <p className="text-xs text-[#6E7D7C]">
                          {order.recipient?.phone} · {order.recipient?.fullAddress?.slice(0, 32)}...
                        </p>
                      </td>

                      <td className="p-4">
                        <NeuBadge
                          variant={
                            order.orderStatus === "delivered"
                              ? "green"
                              : order.orderStatus === "shipping"
                              ? "blue"
                              : order.orderStatus === "pending_confirmation"
                              ? "orange"
                              : order.orderStatus === "cancelled"
                              ? "coral"
                              : "neutral"
                          }
                        >
                          {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                        </NeuBadge>
                      </td>

                      <td className="p-4">
                        <NeuBadge
                          variant={
                            order.paymentStatus === "paid"
                              ? "green"
                              : order.paymentStatus === "pending_verification"
                              ? "orange"
                              : isReturn
                              ? "coral"
                              : "neutral"
                          }
                        >
                          {isReturn
                            ? "Trả hàng / Hoàn tiền"
                            : PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
                        </NeuBadge>
                      </td>

                      <td className="p-4 font-black text-sm text-[#1F2A2A]">
                        {formatMoney ? formatMoney(order.total) : `${Number(order.total || 0).toLocaleString()}đ`}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <NeuButton
                            variant="secondary"
                            size="sm"
                            onClick={() => onSelectOrder(order.id)}
                          >
                            Chi tiết
                          </NeuButton>
                          {onStartChat && (
                            <button
                              type="button"
                              onClick={() => onStartChat(order.id)}
                              className="neu-icon-btn h-8 w-8 text-[#6F8746]"
                              title="Nhắn tin với khách"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>
    </div>
  );
}
