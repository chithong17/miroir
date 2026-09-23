import { useEffect, useMemo, useState } from "react";
import {
  cancelMyOrder,
  checkoutCart,
  createAddress,
  deleteAddress,
  getCart,
  getMyOrder,
  listAddresses,
  listMyOrders,
  listProvinces,
  listWards,
  removeCartItem,
  previewBuyNow,
  reportMyTransfer,
  selectCartAddress,
  setDefaultAddress,
  updateAddress,
  updateCartItem,
  createRefundDispute,
  createReturnRequest,
  escalateReturn,
  listMyDisputes,
  listMyReturns,
  replyMyDispute,
  submitReturnShipment,
  submitFitFeedback,
} from "../api/commerceApi.js";
import { getUserMe, setUserToken } from "../api/userApi.js";
import {
  AppShell,
  Button,
  EmptyState,
  PageHeader,
  SelectField,
  StatusBadge,
  TextField,
  TopNav,
  formatMoney,
} from "../components/ui/index.jsx";
import { beginCustomerChat } from "../api/chatApi.js";
import CancelOrderModal from "../components/CancelOrderModal.jsx";

const blankAddress = {
  label: "Nhà riêng",
  recipientName: "",
  phone: "",
  provinceCode: "",
  wardCode: "",
  addressLine: "",
  note: "",
};
const orderLabels = {
  pending_confirmation: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancel_requested: "Yêu cầu hủy",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};
const paymentLabels = {
  cod_pending: "Tiền mặt – chưa thu",
  awaiting_transfer: "Chờ chuyển khoản",
  pending_verification: "Chờ shop đối soát",
  paid: "Đã thanh toán",
  refund_pending: "Chờ hoàn tiền",
  refunded: "Đã hoàn tiền",
};
const orderSegments = [
  ["all", "Tất cả"],
  ["payment", "Chờ thanh toán"],
  ["transport", "Vận chuyển"],
  ["delivery", "Chờ giao hàng"],
  ["completed", "Hoàn thành"],
  ["cancelled", "Đã hủy"],
  ["returns", "Trả hàng/Hoàn tiền"],
];
const isInOrderSegment = (order, segment, returnOrderIds = new Set()) => {
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
        order.paymentStatus,
      )
    );
  if (segment === "transport")
    return ["confirmed", "preparing"].includes(order.orderStatus);
  if (segment === "delivery") return order.orderStatus === "shipping";
  if (segment === "completed") return order.orderStatus === "delivered";
  return ["cancel_requested", "cancelled", "expired"].includes(
    order.orderStatus,
  );
};

const copy = async (value) => navigator.clipboard.writeText(value);
const displayedCode = (value = "") =>
  value.length === 22
    ? `${value.slice(0, 3)} ${value.slice(3, 9)} ${value.slice(9, 18)} ${value.slice(18)}`
    : value;

export default function CommercePage({ mode, orderId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    getUserMe()
      .then((result) => setUser(result.user))
      .catch(() => {
        setUserToken("");
        window.location.href = "/login";
      });
  }, []);
  return (
    <AppShell
      nav={
        <TopNav
          user={user}
          onLogout={() => {
            setUserToken("");
            window.location.href = "/";
          }}
        />
      }
    >
      <div className="relative min-h-screen overflow-hidden bg-[#FBFCF9]">
        <div className="pointer-events-none absolute -left-[32rem] -top-[31rem] h-[52rem] w-[66rem] rounded-full border border-white/70 bg-[#F1F6EC]/85 shadow-[inset_-10px_-20px_80px_rgba(180,202,160,0.08)]"></div>
        <div className="pointer-events-none absolute -left-24 top-28 h-[25rem] w-[12rem] rounded-r-full border-r border-white/80 bg-[#EEF5E8]/80"></div>
        <div className="pointer-events-none absolute -right-[30rem] top-10 h-[46rem] w-[48rem] rounded-full border border-white/70 bg-[#F0F6EB]/80"></div>
        <div className="pointer-events-none absolute -bottom-[34rem] -right-[21rem] h-[60rem] w-[60rem] rounded-full border border-white/80 bg-[#EEF5E8]/80 shadow-[inset_40px_35px_80px_rgba(170,195,149,0.10)]"></div>
        <div className="pointer-events-none absolute -bottom-[30rem] -left-[24rem] h-[42rem] w-[72rem] rotate-[12deg] rounded-[50%] border border-white/70 bg-[#F5F8F1]/90"></div>

        <main className="section-shell relative z-10 pt-2 pb-10 min-h-[calc(100vh-140px)]">
          {mode === "cart" ? <CartView /> : null}
          {mode === "checkout" ? <CheckoutView /> : null}
          {mode === "addresses" ? <AddressBook /> : null}
          {mode === "orders" ? <OrdersView /> : null}
          {mode === "order" ? <OrderDetail orderId={orderId} /> : null}
        </main>

        <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-6 border-t border-[#E8F0E0] text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">
          <div className="flex items-center gap-4">
            <span>Fashion</span>
            <span>×</span>
            <span>Technology</span>
            <span>×</span>
            <span>A better you</span>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <div className="w-12 h-[1px] bg-[#E8F0E0]"></div>
            <span>Miroir // 2026</span>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}

function CartView() {
  const [cart, setCart] = useState(null);
  const [notice, setNotice] = useState("");

  const [selectedShops, setSelectedShops] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());

  const load = () =>
    getCart()
      .then((result) => {
        setCart(result.cart);
        if (result.cart?.groups) {
          const allShops = new Set();
          const allItems = new Set();
          result.cart.groups.forEach((g) => {
            allShops.add(g.shop?.id || "unavailable");
            g.items.forEach((i) =>
              allItems.add(`${i.productId}-${i.variantId}`),
            );
          });
          setSelectedShops(allShops);
          setSelectedItems(allItems);
        }
      })
      .catch((error) =>
        setNotice(error.response?.data?.message || "Không tải được giỏ hàng."),
      );

  useEffect(() => {
    load();
  }, []);

  const change = async (item, quantity) => {
    try {
      setCart(
        (await updateCartItem(item.productId, item.variantId, quantity)).cart,
      );
      window.dispatchEvent(new Event("miroir:cart-updated"));
    } catch (e) {
      setNotice(e.response?.data?.message || "Không cập nhật được.");
    }
  };

  const remove = async (item) => {
    try {
      setCart((await removeCartItem(item.productId, item.variantId)).cart);
      window.dispatchEvent(new Event("miroir:cart-updated"));
    } catch (e) {
      setNotice(e.response?.data?.message || "Không xóa được.");
    }
  };

  const toggleGroup = (groupId, items) => {
    const newShops = new Set(selectedShops);
    const newItems = new Set(selectedItems);
    if (newShops.has(groupId)) {
      newShops.delete(groupId);
      items.forEach((i) => newItems.delete(`${i.productId}-${i.variantId}`));
    } else {
      newShops.add(groupId);
      items.forEach((i) => newItems.add(`${i.productId}-${i.variantId}`));
    }
    setSelectedShops(newShops);
    setSelectedItems(newItems);
  };

  const toggleItem = (groupId, itemId) => {
    const newItems = new Set(selectedItems);
    if (newItems.has(itemId)) {
      newItems.delete(itemId);
    } else {
      newItems.add(itemId);
    }
    setSelectedItems(newItems);
  };

  const clearCart = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?"))
      return;
    try {
      for (const group of cart.groups) {
        for (const item of group.items) {
          await removeCartItem(item.productId, item.variantId);
        }
      }
      load();
      window.dispatchEvent(new Event("miroir:cart-updated"));
    } catch (error) {
      setNotice("Có lỗi xảy ra khi xóa.");
    }
  };

  const totalSelectedValue = useMemo(() => {
    if (!cart?.groups) return 0;
    let total = 0;
    cart.groups.forEach((g) => {
      g.items.forEach((i) => {
        if (selectedItems.has(`${i.productId}-${i.variantId}`)) {
          total += (i.product?.price || 0) * i.quantity;
        }
      });
    });
    return total;
  }, [cart, selectedItems]);

  const selectedCount = selectedItems.size;

  return (
    <div className="max-w-[1160px] mx-auto w-full">
      {notice ? <Notice text={notice} /> : null}

      {!cart?.itemCount ? (
        <div className="mt-6">
          <EmptyState
            title="Giỏ hàng đang trống"
            text="Chọn biến thể sản phẩm và thêm vào giỏ để bắt đầu."
          />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] items-start mt-0">
          {/* LEFT COLUMN */}
          <div className="grid gap-4">
            {/* Header for Left Column */}
            <div className="mb-8 pt-4">
              <p className="text-[#84B069] text-[10px] font-bold tracking-[0.2em] mb-1 uppercase">
                Shopping Cart
              </p>
              <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-[#1E2B22]">
                Giỏ <span className="text-[#4F733C]">hàng</span>
              </h1>
              <p className="mt-2 text-gray-600 text-xs md:text-sm font-medium">
                Sản phẩm được nhóm theo từng shop. Kiểm tra kỹ trước khi thanh
                toán nhé!
              </p>
            </div>

            {/* Shop Cards */}
            {cart.groups.map((group, groupIndex) => {
              const groupId = group.shop?.id || "unavailable";
              const isGroupSelected = selectedShops.has(groupId);
              return (
                <section
                  key={groupId}
                  className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#F0F5EB] overflow-hidden p-6 sm:p-8"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#F4F7F0]">
                    <div className="flex items-center gap-3">
                      <button
                        className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-colors ${isGroupSelected ? "bg-[#4F733C]" : "border-2 border-[#E1E8D8] hover:border-[#4F733C]"}`}
                        onClick={() => toggleGroup(groupId, group.items)}
                      >
                        {isGroupSelected && (
                          <svg
                            width="10"
                            height="7"
                            viewBox="0 0 12 9"
                            fill="none"
                          >
                            <path
                              d="M1 4L4.5 7.5L11 1"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <h2 className="text-sm font-black tracking-widest text-[#1E2B22] uppercase">
                        {group.shop?.name || "Không khả dụng"}
                      </h2>
                    </div>
                    <span className="text-[13px] font-medium text-gray-400">
                      {group.items.length} sản phẩm
                    </span>
                  </div>

                  <div className="grid gap-4 pt-4">
                    {group.items.map((item) => {
                      const itemId = `${item.productId}-${item.variantId}`;
                      const isItemSelected = selectedItems.has(itemId);
                      return (
                        <div key={itemId} className="flex gap-4 items-center">
                          <button
                            className={`w-6 h-6 shrink-0 rounded-[8px] flex items-center justify-center transition-colors ${isItemSelected ? "bg-[#4F733C]" : "border-2 border-[#E1E8D8] hover:border-[#4F733C]"}`}
                            onClick={() => toggleItem(groupId, itemId)}
                          >
                            {isItemSelected && (
                              <svg
                                width="10"
                                height="7"
                                viewBox="0 0 12 9"
                                fill="none"
                              >
                                <path
                                  d="M1 4L4.5 7.5L11 1"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>

                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[12px] bg-[#F7F9F5] border border-[#F0F5EB]">
                            {item.product?.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                className="h-full w-full object-cover mix-blend-multiply"
                                alt=""
                              />
                            ) : null}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-[#1E2B22] truncate">
                              {item.product?.name || "Sản phẩm đã gỡ"}
                            </h3>
                            <p className="mt-1 text-[14px] font-semibold text-gray-500 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                              {item.variant?.color || "Mặc định"} /{" "}
                              {item.variant?.size || "Một cỡ"}
                            </p>
                            <p className="mt-1 text-[11px] font-bold tracking-wider text-gray-300 uppercase">
                              {item.variant?.sku}
                            </p>
                            <p className="mt-1.5 text-base sm:text-lg font-black text-[#4F733C]">
                              {formatMoney(item.product?.price)}
                            </p>
                            {!item.available && (
                              <p className="text-xs font-bold text-red-600">
                                {item.issue}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 shrink-0">
                            <div className="flex items-center border border-[#E8F0E0] rounded-full p-1 bg-white">
                              <button
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#F4F7F0] hover:text-[#1E2B22] transition-colors"
                                onClick={() =>
                                  change(item, Math.max(1, item.quantity - 1))
                                }
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-[#1E2B22]">
                                {item.quantity}
                              </span>
                              <button
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#F4F7F0] hover:text-[#1E2B22] transition-colors"
                                onClick={() =>
                                  change(
                                    item,
                                    Math.min(
                                      item.variant?.stockQuantity || 1,
                                      item.quantity + 1,
                                    ),
                                  )
                                }
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                <svg
                                  className="w-4 h-4 sm:w-5 sm:h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                  />
                                </svg>
                              </button>
                              <button
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                onClick={() => remove(item)}
                              >
                                <svg
                                  className="w-4 h-4 sm:w-5 sm:h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F4F7F0] flex flex-wrap gap-4 items-center justify-between">
                    <a
                      href="/products"
                      className="flex items-center gap-2 text-[12px] font-bold text-gray-500 hover:text-[#1E2B22] transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Tiếp tục mua sắm
                    </a>
                    <button
                      onClick={clearCart}
                      className="flex items-center gap-2 text-[12px] font-bold text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Xóa tất cả
                    </button>
                  </div>
                </section>
              );
            })}
          </div>

          {/* RIGHT COLUMN */}
          <aside className="lg:sticky lg:top-[24px]">
            {/* Header for Right Column */}
            <div className="hidden lg:flex flex-col items-end mb-8 pt-4">
              <p className="text-[#9DBB87] font-bold tracking-[0.2em] text-[10px] leading-relaxed text-right max-w-[120px]">
                A KINDER YOU
                <br />
                EVERYDAY
              </p>
              <div className="w-12 h-[2px] bg-[#9DBB87] mt-3"></div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[#DDEAD2] bg-white p-6 shadow-[0_20px_48px_rgba(47,75,34,0.10)] sm:p-8">
              <h2 className="text-[20px] font-bold text-[#1E2B22]">
                Tóm tắt đơn hàng
              </h2>

              <div className="mt-5 flex flex-col gap-4 text-[15px] text-gray-600 font-medium">
                <div className="flex items-center justify-between">
                  <span>Tạm tính ({selectedCount} sản phẩm)</span>
                  <span className="font-bold text-[#1E2B22]">
                    {formatMoney(totalSelectedValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    Phí giao hàng{" "}
                    <svg
                      className="w-3.5 h-3.5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  <span className="font-bold text-[#1E2B22]">—</span>
                </div>
              </div>

              <div className="mt-5 mb-4 border-t border-[#F0F5EB]"></div>

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#1E2B22]">
                  Tổng cộng
                </span>
                <span className="text-[22px] sm:text-2xl font-black text-[#4F733C]">
                  {formatMoney(totalSelectedValue)}
                </span>
              </div>
              <p className="mt-1 text-right text-[11px] font-semibold text-gray-400">
                Đã bao gồm VAT (nếu có)
              </p>

              <a
                href="/app/checkout"
                className="mt-6 flex items-center justify-between w-full bg-[#5A7C46] hover:bg-[#4F733C] text-white rounded-full p-2 pl-8 transition-colors shadow-[0_8px_20px_rgba(79,115,60,0.2)]"
              >
                <span className="font-bold text-sm tracking-wide">
                  Tiến hành đặt hàng
                </span>
                <div className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </a>

              <div className="mt-5 flex items-center justify-center gap-3 text-[10px] font-bold text-gray-400">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-[#5A7C46]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>{" "}
                  Thanh toán an toàn
                </span>
                <span className="w-px h-3 bg-gray-300"></span>
                <span>Bảo mật thông tin</span>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 bg-[#F1F6EC] rounded-xl px-3 py-2.5 hover:bg-[#EAF1E3] transition-colors group">
                <span className="flex items-start gap-2 text-[10px] font-bold text-[#4F733C]">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <span className="leading-tight pt-0.5">
                    Thời trang bền vững, vì một phiên bản tốt hơn của bạn
                  </span>
                </span>
                <svg
                  className="w-3 h-3 shrink-0 text-[#4F733C] transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function AddressFields({ form, setForm, provinces, wards }) {
  const change = (field) => (event) =>
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
      ...(field === "provinceCode" ? { wardCode: "" } : {}),
    }));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="Nhãn" value={form.label} onChange={change("label")} />
      <TextField
        label="Tên người nhận"
        required
        value={form.recipientName}
        onChange={change("recipientName")}
      />
      <TextField
        label="Số điện thoại"
        required
        value={form.phone}
        onChange={change("phone")}
      />
      <SelectField
        label="Tỉnh/Thành phố"
        required
        value={form.provinceCode}
        onChange={change("provinceCode")}
      >
        <option value="">Chọn tỉnh/thành</option>
        {provinces.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Xã/Phường"
        required
        value={form.wardCode}
        onChange={change("wardCode")}
      >
        <option value="">Chọn xã/phường</option>
        {wards.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Địa chỉ chi tiết"
        wide
        required
        value={form.addressLine}
        onChange={change("addressLine")}
      />
    </div>
  );
}

function useLocations(form) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [version, setVersion] = useState("");
  useEffect(() => {
    listProvinces().then((result) => {
      setProvinces(result.provinces);
      setVersion(result.datasetVersion);
    });
  }, []);
  useEffect(() => {
    if (form.provinceCode)
      listWards(form.provinceCode).then((result) => setWards(result.wards));
    else setWards([]);
  }, [form.provinceCode]);
  return { provinces, wards, version };
}

function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(blankAddress);
  const [editingId, setEditingId] = useState("");
  const [notice, setNotice] = useState("");
  const { provinces, wards, version } = useLocations(form);
  const load = () =>
    listAddresses()
      .then((result) => setAddresses(result.addresses || []))
      .catch((error) =>
        setNotice(
          error.response?.data?.message || "Không tải được sổ địa chỉ.",
        ),
      );
  useEffect(() => {
    load();
  }, []);
  const save = async (event) => {
    event.preventDefault();
    try {
      if (editingId) await updateAddress(editingId, form);
      else await createAddress(form);
      setForm(blankAddress);
      setEditingId("");
      setNotice("Đã lưu địa chỉ.");
      load();
    } catch (e) {
      setNotice(e.response?.data?.message || "Không lưu được địa chỉ.");
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Tài khoản"
        title="Sổ địa chỉ"
        description={`Danh mục hành chính ${version || "đang tải"}. Bạn có thể lưu nhiều người nhận.`}
      />
      {notice ? <Notice text={notice} /> : null}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-4">
          {addresses.map((item) => (
            <article className="miroir-card" key={item.id}>
              <div className="flex justify-between">
                <div>
                  <p className="font-black">
                    {item.label}{" "}
                    {item.isDefault ? (
                      <span className="text-sm text-accentStrong">
                        · Mặc định
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-2 font-bold">
                    {item.recipientName} · {item.phone}
                  </p>
                  <p className="text-sm text-muted">{item.fullAddress}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {!item.isDefault ? (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await setDefaultAddress(item.id);
                      load();
                    }}
                  >
                    Đặt mặc định
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingId(item.id);
                    setForm({
                      label: item.label,
                      recipientName: item.recipientName,
                      phone: item.phone,
                      provinceCode: item.provinceCode,
                      wardCode: item.wardCode,
                      addressLine: item.addressLine,
                    });
                  }}
                >
                  Sửa
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await deleteAddress(item.id);
                      load();
                    } catch (e) {
                      setNotice(e.response?.data?.message);
                    }
                  }}
                >
                  Xóa
                </Button>
              </div>
            </article>
          ))}
        </div>
        <form className="miroir-card h-fit" onSubmit={save}>
          <h2 className="mb-4 text-xl font-black">
            {editingId ? "Sửa địa chỉ" : "Thêm địa chỉ"}
          </h2>
          <AddressFields {...{ form, setForm, provinces, wards }} />
          <Button className="mt-4 w-full" type="submit">
            Lưu địa chỉ
          </Button>
          {editingId ? (
            <Button
              variant="secondary"
              className="mt-2 w-full"
              onClick={() => {
                setEditingId("");
                setForm(blankAddress);
              }}
            >
              Hủy sửa
            </Button>
          ) : null}
        </form>
      </div>
    </>
  );
}

function CheckoutView() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState("");
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState(blankAddress);
  const [saveAddress, setSaveAddress] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [savedAddressNote, setSavedAddressNote] = useState("");
  const [methods, setMethods] = useState({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const checkoutParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  // `mode=buy-now` was briefly emitted by the product page. Keep accepting it
  // so tabs opened before this fix still lead to the intended checkout.
  const isBuyNow =
    checkoutParams.get("buy_now") === "1" ||
    checkoutParams.get("mode") === "buy-now";
  const buyNowItems = useMemo(() => {
    if (!isBuyNow) return null;
    try {
      const parsed = JSON.parse(
        sessionStorage.getItem("miroir_buy_now") || "null",
      );
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch {
      return null;
    }
  }, [isBuyNow]);
  const version = new URLSearchParams(window.location.search).get("version");

  useEffect(() => {
    listProvinces()
      .then((result) => setProvinces(result.provinces))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (form.provinceCode)
      listWards(form.provinceCode)
        .then((result) => setWards(result.wards))
        .catch(() => {});
    else setWards([]);
  }, [form.provinceCode]);

  useEffect(() => {
    if (isBuyNow && !buyNowItems) {
      setNotice(
        "Phiên mua ngay không hợp lệ. Vui lòng chọn lại sản phẩm và biến thể.",
      );
      return;
    }
    const cartRequest = isBuyNow ? previewBuyNow(buyNowItems) : getCart();
    Promise.all([cartRequest, listAddresses()])
      .then(([cartResult, addressResult]) => {
        setCart(cartResult.cart);
        const nextAddresses = addressResult.addresses || [];
        setAddresses(nextAddresses);
        if (!nextAddresses.length) setManual(true);
        const defaultAddress = nextAddresses.find((item) => item.isDefault);
        setSelected(defaultAddress?.id || nextAddresses[0]?.id || "");
        setMethods(
          Object.fromEntries(
            (cartResult.cart?.groups || [])
              .filter((group) => group.shop)
              .map((group) => [group.shop.id, "cash"]),
          ),
        );
      })
      .catch((error) =>
        setNotice(
          error.response?.data?.message ||
            "Không tải được thông tin thanh toán.",
        ),
      );
  }, []);

  useEffect(() => {
    if (selected) selectCartAddress(selected).catch(() => {});
  }, [selected]);

  const recipientReady = manual
    ? Boolean(
        form.recipientName &&
        form.phone &&
        form.provinceCode &&
        form.wardCode &&
        form.addressLine,
      )
    : Boolean(selected);

  const submit = async () => {
    setBusy(true);
    setNotice("");
    try {
      const payload = {
        idempotencyKey: crypto.randomUUID(),
        paymentMethods: methods,
        ...(buyNowItems ? { buyNowItems } : {}),
        ...(manual
          ? { recipient: form, saveAddress, setAsDefault }
          : { addressId: selected, note: savedAddressNote }),
      };
      const result = await checkoutCart(payload);
      if (buyNowItems) sessionStorage.removeItem("miroir_buy_now");
      sessionStorage.setItem(
        "miroir_checkout_orders",
        JSON.stringify(result.orders),
      );
      window.dispatchEvent(new Event("miroir:cart-updated"));
      window.location.href = `/app/orders/${result.orders[0].id}?checkout=success`;
    } catch (e) {
      setNotice(e.response?.data?.message || "Không thể tạo đơn.");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1160px] mx-auto w-full">
      {notice ? <Notice text={notice} /> : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] items-start mt-0">
        {/* LEFT COLUMN */}
        <div className="grid gap-8">
          {/* Header for Left Column */}
          <div className="pt-4">
            <p className="text-[#84B069] text-[10px] font-bold tracking-[0.2em] mb-1 uppercase">
              Checkout
            </p>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-[#1E2B22]">
              Giỏ <span className="text-[#4F733C]">hàng</span>
            </h1>
            <p className="mt-3 max-w-2xl text-gray-600 text-sm font-medium leading-relaxed">
              {isBuyNow
                ? "Đơn hàng chỉ gồm sản phẩm vừa chọn; các sản phẩm khác trong giỏ được giữ nguyên."
                : "Những món đồ bạn yêu thích, chỉ còn một bước nữa là thuộc về bạn."}
            </p>
          </div>

          <section className="checkout-recipient-card relative overflow-hidden rounded-[28px] border border-[#E8F0E0] bg-white p-5 shadow-[0_18px_45px_rgba(43,68,30,0.06)] sm:p-7">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#EFF6E8] blur-2xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF3E9] pb-5">
              <div className="flex items-center gap-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-[#4F733C]"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8V12L15 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h2 className="text-sm font-black tracking-widest text-[#1E2B22] uppercase">
                  Người nhận
                </h2>
              </div>

              {addresses.length ? (
                <button
                  className="text-xs font-bold px-4 py-2 rounded-full border-2 border-[#E1E8D8] text-[#1E2B22] hover:border-[#4F733C] transition-colors"
                  onClick={() => setManual(!manual)}
                >
                  {manual ? "Chọn địa chỉ đã lưu" : "Nhập địa chỉ mới"}
                </button>
              ) : (
                <span className="rounded-full bg-[#F1F6EC] px-3 py-1.5 text-xs font-bold text-[#4F733C]">
                  Chưa có địa chỉ đã lưu
                </span>
              )}
            </div>

            {manual ? (
              <div className="relative mt-6">
                <AddressFields {...{ form, setForm, provinces, wards }} />
                <TextField
                  className="mt-4"
                  label="Ghi chú"
                  value={form.note}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, note: e.target.value }))
                  }
                />
                <label className="mt-6 flex gap-3 items-center cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-colors ${saveAddress ? "bg-[#4F733C] border-[#4F733C]" : "border-[#E1E8D8] group-hover:border-[#4F733C]"}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                    />
                    {saveAddress && (
                      <svg width="10" height="7" viewBox="0 0 12 9" fill="none">
                        <path
                          d="M1 4L4.5 7.5L11 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#1E2B22]">
                    Lưu vào sổ địa chỉ
                  </span>
                </label>
                {saveAddress ? (
                  <label className="mt-3 flex gap-3 items-center cursor-pointer group ml-1">
                    <div
                      className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-colors ${setAsDefault ? "bg-[#4F733C] border-[#4F733C]" : "border-[#E1E8D8] group-hover:border-[#4F733C]"}`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={setAsDefault}
                        onChange={(e) => setSetAsDefault(e.target.checked)}
                      />
                      {setAsDefault && (
                        <svg
                          width="10"
                          height="7"
                          viewBox="0 0 12 9"
                          fill="none"
                        >
                          <path
                            d="M1 4L4.5 7.5L11 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-500">
                      Đặt làm mặc định
                    </span>
                  </label>
                ) : null}
              </div>
            ) : (
              <div className="relative mt-6 grid gap-3">
                {addresses.map((item) => (
                  <label
                    key={item.id}
                    className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${selected === item.id ? "border-[#4F733C] bg-[#F6FAF2] shadow-[0_10px_22px_rgba(79,115,60,0.08)]" : "border-[#EDF2E8] bg-white hover:-translate-y-0.5 hover:border-[#C9DAB9]"}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${selected === item.id ? "border-[#4F733C]" : "border-[#E1E8D8]"}`}
                      >
                        <input
                          className="hidden"
                          type="radio"
                          checked={selected === item.id}
                          onChange={() => setSelected(item.id)}
                        />
                        {selected === item.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#4F733C]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm sm:text-[15px]">
                          <strong className="text-[#1E2B22] font-black">
                            {item.recipientName}
                          </strong>{" "}
                          <span className="text-gray-400 mx-1">—</span>{" "}
                          <span className="font-bold text-gray-600">
                            {item.phone}
                          </span>
                        </p>
                        <p className="mt-1 text-[13px] text-gray-500 font-medium leading-relaxed">
                          {item.fullAddress}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
                <div className="mt-2">
                  <TextField
                    label="Ghi chú cho đơn hàng"
                    value={savedAddressNote}
                    onChange={(event) =>
                      setSavedAddressNote(event.target.value)
                    }
                  />
                </div>
              </div>
            )}
          </section>

          {cart?.groups.map((group) => (
            <CheckoutShopGroup
              group={group}
              key={group.shop?.id || "unavailable"}
              method={methods[group.shop?.id]}
              onMethodChange={(method) => {
                if (group.shop?.id)
                  setMethods((current) => ({
                    ...current,
                    [group.shop.id]: method,
                  }));
              }}
            />
          ))}
        </div>

        {/* RIGHT COLUMN */}
        <aside className="lg:sticky lg:top-[24px]">
          {/* Header for Right Column */}
          <div className="hidden lg:flex flex-col items-end mb-10 pt-6">
            <p className="text-[#9DBB87] font-bold tracking-[0.2em] text-[10px] leading-relaxed text-right max-w-[120px]">
              A KINDER YOU
              <br />
              EVERYDAY
            </p>
            <div className="w-12 h-[2px] bg-[#9DBB87] mt-3"></div>
          </div>

          <div className="rounded-[28px] border border-[#DDEAD2] bg-white p-6 shadow-[0_20px_48px_rgba(47,75,34,0.10)] sm:p-8">
            <h2 className="text-[19px] font-bold text-[#1E2B22]">
              Tóm tắt đơn hàng
            </h2>

            <div className="mt-6 grid gap-3 rounded-2xl bg-[#F6F9F3] p-4 text-[14px] text-gray-600 font-medium">
              <div className="flex items-center justify-between">
                <span>Tổng sản phẩm</span>
                <span className="font-bold text-[#1E2B22]">
                  {cart?.itemCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">Phí giao hàng</span>
                <span className="font-bold text-[#4F733C]">Theo shop</span>
              </div>
            </div>

            <div className="my-5 border-t border-dashed border-[#DCE8D3]"></div>

            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[#1E2B22]">
                Tổng cộng
              </span>
              <span className="text-[22px] sm:text-2xl font-black text-[#4F733C]">
                {formatMoney(cart?.subtotal || 0)}
              </span>
            </div>
            <p className="mt-1 text-right text-[11px] font-semibold text-gray-400">
              Chưa bao gồm phí vận chuyển
            </p>

            <button
              disabled={busy || !cart?.itemCount || !recipientReady}
              onClick={submit}
              className="mt-7 flex w-full items-center justify-between rounded-2xl bg-[#5A7C46] p-2 pl-6 text-white shadow-[0_12px_24px_rgba(79,115,60,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#4F733C] disabled:cursor-not-allowed disabled:bg-[#E1E8D8]"
            >
              <span className="font-bold text-sm tracking-wide">
                {busy ? "Đang tạo đơn..." : "Đặt hàng ngay"}
              </span>
              <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            {!recipientReady && (
              <p className="mt-4 text-center text-[12px] font-bold text-red-500">
                Vui lòng hoàn tất thông tin người nhận.
              </p>
            )}

            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-gray-500">
              <span className="grid justify-items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-[#5A7C46]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>{" "}
                Thanh toán an toàn
              </span>
              <span className="grid justify-items-center gap-1.5"><svg className="h-4 w-4 text-[#5A7C46]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8 4-8-4m16 0l-8-4-8 4m16 0v10l-8 4-8-4V7" /></svg>Đổi trả dễ dàng</span>
              <span className="grid justify-items-center gap-1.5"><svg className="h-4 w-4 text-[#5A7C46]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M18.364 5.636a9 9 0 10-12.728 12.728A9 9 0 0018.364 5.636zM12 8v4l2.5 1.5" /></svg>Hỗ trợ 24/7</span>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#E1ECD8] bg-[#F1F6EC] px-4 py-3 cursor-default">
              <svg
                className="w-4 h-4 shrink-0 mt-0.5 text-[#4F733C]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <span className="text-[11px] font-bold text-[#4F733C] leading-tight">
                Thời trang bền vững, vì một phiên bản tốt hơn của bạn
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CheckoutShopGroup({ group, method, onMethodChange }) {
  const itemCount = (group.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#E8F0E0] bg-white p-5 shadow-[0_16px_38px_rgba(43,68,30,0.05)] sm:p-7">
      <div className="flex items-center justify-between gap-4 border-b border-[#EEF3E9] pb-5">
        <div className="flex items-center gap-3">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[#4F733C]"
          >
            <path
              d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 9H19L20 21H4L5 9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="text-sm font-black tracking-widest text-[#1E2B22] uppercase">
            {group.shop?.name || "Shop không khả dụng"}
          </h2>
        </div>
        <span className="text-[13px] font-medium text-gray-400">
          {itemCount} sản phẩm —{" "}
          <strong className="text-[#4F733C] font-black">
            {formatMoney(group.subtotal)}
          </strong>
        </span>
      </div>

      <div className="grid gap-3 pt-5">
        {(group.items || []).map((item) => (
          <div
            className="flex gap-4 rounded-2xl border border-[#EEF3E9] bg-[#FCFDFB] p-3 sm:gap-5 sm:p-4 items-center"
            key={`${item.productId}-${item.variantId}`}
          >
            <a
              className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#F1F6EC] border border-[#E5EEDF] sm:h-[88px] sm:w-[88px]"
              href={`/app/products/${encodeURIComponent(item.productId)}`}
            >
              {item.product?.imageUrl ? (
                <img
                  alt={item.product.name}
                  className="h-full w-full object-cover mix-blend-multiply"
                  src={item.product.imageUrl}
                />
              ) : null}
            </a>

            <div className="flex-1 min-w-0">
              <a
                className="text-[15px] sm:text-base font-bold text-[#1E2B22] hover:text-[#4F733C] transition-colors line-clamp-2"
                href={`/app/products/${encodeURIComponent(item.productId)}`}
              >
                {item.product?.name || "Sản phẩm không khả dụng"}
              </a>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                {item.variant?.color ? (
                  <span>Màu: {item.variant.color}</span>
                ) : null}
                {item.variant?.size ? (
                  <>
                    <span className="text-gray-300">/</span>
                    <span>Size: {item.variant.size}</span>
                  </>
                ) : null}
                <span className="text-gray-300">/</span>
                <span className="text-[#4F733C]">
                  Số lượng: {item.quantity}
                </span>
              </div>
              {item.variant?.sku ? (
                <p className="mt-1 text-[10px] font-bold tracking-wider text-gray-300 uppercase">
                  SKU: {item.variant.sku}
                </p>
              ) : null}
              {!item.available ? (
                <p className="mt-1.5 text-xs font-bold text-red-600">
                  Sản phẩm hiện không đủ điều kiện đặt hàng.
                </p>
              ) : null}
            </div>

            <div className="text-right shrink-0">
              <p className="text-[13px] text-gray-400 font-semibold">
                {formatMoney(item.product?.price)} × {item.quantity}
              </p>
              <p className="mt-1 text-base sm:text-lg font-black text-[#4F733C]">
                {formatMoney(item.lineTotal)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 border-t border-[#EEF3E9] pt-6">
        <p className="mb-4 text-sm font-black text-[#1E2B22] uppercase tracking-wider">
          Phương thức thanh toán
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label
            className={`rounded-2xl border-2 p-4 cursor-pointer transition-all group ${method === "cash" ? "border-[#4F733C] bg-[#F6FAF2] shadow-[0_8px_18px_rgba(79,115,60,0.07)]" : "border-[#EDF2E8] bg-white hover:-translate-y-0.5 hover:border-[#C9DAB9]"}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${method === "cash" ? "border-[#4F733C]" : "border-[#E1E8D8] group-hover:border-[#4F733C]"}`}
              >
                <input
                  className="hidden"
                  type="radio"
                  checked={method === "cash"}
                  onChange={() => onMethodChange("cash")}
                />
                {method === "cash" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4F733C]" />
                )}
              </div>
              <div>
                <strong className="text-sm font-black text-[#1E2B22] block">
                  Thanh toán khi nhận hàng
                </strong>
                <span className="mt-1 block text-[13px] text-gray-500 font-medium">
                  Tiền mặt (COD)
                </span>
              </div>
            </div>
          </label>

          <label
            className={`rounded-2xl border-2 p-4 cursor-pointer transition-all group ${!group.shop?.bankTransferAvailable ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200" : method === "bank_transfer" ? "border-[#4F733C] bg-[#F6FAF2] shadow-[0_8px_18px_rgba(79,115,60,0.07)]" : "border-[#EDF2E8] bg-white hover:-translate-y-0.5 hover:border-[#C9DAB9]"}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${method === "bank_transfer" ? "border-[#4F733C]" : "border-[#E1E8D8] group-hover:border-[#4F733C]"}`}
              >
                <input
                  className="hidden"
                  type="radio"
                  disabled={!group.shop?.bankTransferAvailable}
                  checked={method === "bank_transfer"}
                  onChange={() => onMethodChange("bank_transfer")}
                />
                {method === "bank_transfer" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4F733C]" />
                )}
              </div>
              <div>
                <strong className="text-sm font-black text-[#1E2B22] block">
                  Chuyển khoản
                </strong>
                {!group.shop?.bankTransferAvailable ? (
                  <span className="mt-1 block text-[13px] text-gray-500 font-medium">
                    Shop chưa thiết lập
                  </span>
                ) : (
                  <span className="mt-1 block text-[13px] text-gray-500 font-medium">
                    Xác nhận thủ công
                  </span>
                )}
              </div>
            </div>
          </label>
        </div>
      </div>
    </section>
  );
}

function OrderSegmentTabs({ active, counts, onChange }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex min-w-max px-2">
        {orderSegments.map(([key, label]) => (
          <button
            className={`relative px-4 py-4 text-sm font-bold transition sm:px-5 ${active === key ? "text-mintDeep" : "text-muted hover:text-ink"}`}
            key={key}
            onClick={() => onChange(key)}
          >
            {label}
            {counts[key] ? (
              <span
                className={`ml-1.5 text-xs ${active === key ? "text-mintDeep" : "text-muted"}`}
              >
                ({counts[key]})
              </span>
            ) : null}
            {active === key ? (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-mintDeep" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [activeSegment, setActiveSegment] = useState("all");
  useEffect(() => {
    Promise.all([listMyOrders(), listMyReturns()]).then(
      ([orderResult, returnResult]) => {
        setOrders(orderResult.orders || []);
        setReturns(returnResult.returns || []);
      },
    );
  }, []);
  const returnOrderIds = useMemo(
    () => new Set(returns.map((item) => item.orderId)),
    [returns],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        orderSegments.map(([key]) => [
          key,
          orders.filter((order) => isInOrderSegment(order, key, returnOrderIds))
            .length,
        ]),
      ),
    [orders, returnOrderIds],
  );
  const visibleOrders = orders.filter((order) =>
    isInOrderSegment(order, activeSegment, returnOrderIds),
  );
  return (
    <>
      <PageHeader
        eyebrow="Commerce"
        title="Đơn hàng của tôi"
        description="Chọn trạng thái để theo dõi đơn hàng nhanh hơn."
      />
      <div className="mt-6">
        <OrderSegmentTabs
          active={activeSegment}
          counts={counts}
          onChange={setActiveSegment}
        />
      </div>
      <div className="mt-4 grid gap-4">
        {visibleOrders.length ? (
          visibleOrders.map((order) => (
            <a
              href={`/app/orders/${order.id}`}
              key={order.id}
              className="miroir-card grid gap-3 transition hover:-translate-y-0.5 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="font-mono text-lg font-black">
                  {displayedCode(order.orderCode)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {order.shopSnapshot?.name} ·{" "}
                  {new Date(order.createdAt).toLocaleString("vi-VN")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={orderLabels[order.orderStatus]} />
                  <StatusBadge
                    status={
                      returnOrderIds.has(order.id)
                        ? "Đang trả hàng / hoàn tiền"
                        : paymentLabels[order.paymentStatus]
                    }
                  />
                </div>
              </div>
              <p className="text-xl font-black">{formatMoney(order.total)}</p>
            </a>
          ))
        ) : (
          <EmptyState
            title={`Chưa có đơn ${orderSegments.find(([key]) => key === activeSegment)?.[1].toLowerCase() || "hàng"}`}
            text="Các đơn phù hợp với trạng thái này sẽ xuất hiện tại đây."
          />
        )}
      </div>
    </>
  );
}

function OrderDetail({ orderId }) {
  const [order, setOrder] = useState(null);
  const [dispute, setDispute] = useState(null);
  const [returns, setReturns] = useState([]);
  const [notice, setNotice] = useState("");
  const [proof, setProof] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const load = () =>
    Promise.all([getMyOrder(orderId), listMyDisputes(), listMyReturns()])
      .then(([result, disputeResult, returnResult]) => {
        setOrder(result.order);
        setDispute(
          (disputeResult.disputes || []).find(
            (item) => item.orderId === orderId && !item.returnId,
          ) || null,
        );
        setReturns(
          (returnResult.returns || []).filter(
            (item) => item.orderId === orderId,
          ),
        );
      })
      .catch((e) =>
        setNotice(e.response?.data?.message || "Không tải được đơn."),
      );
  useEffect(() => {
    load();
  }, [orderId]);
  if (!order) return <Notice text={notice || "Đang tải đơn hàng..."} />;
  const canCancel = ![
    "delivered",
    "cancelled",
    "expired",
    "cancel_requested",
  ].includes(order.orderStatus);
  const canDispute =
    order.paymentStatus === "refunded" ||
    (order.paymentStatus === "refund_pending" &&
      Date.now() -
        new Date(order.refundPendingAt || order.updatedAt).getTime() >=
        72 * 60 * 60 * 1000);
  const transfer =
    order.paymentMethod === "bank_transfer" ? order.paymentSnapshot : null;
  const deliverySteps = [
    { label: "Chờ xác nhận", statuses: ["pending_confirmation", "confirmed"] },
    { label: "Đang chuẩn bị hàng", statuses: ["preparing"] },
    { label: "Đang giao hàng", statuses: ["shipping"] },
    { label: "Đã giao hàng", statuses: ["delivered"] },
  ];
  const currentDeliveryStep = deliverySteps.findIndex((step) =>
    step.statuses.includes(order.orderStatus),
  );
  const activeDeliveryStep = currentDeliveryStep < 0 ? 0 : currentDeliveryStep;
  const timeForStatus = (statuses) =>
    [...(order.statusHistory || [])]
      .reverse()
      .find((entry) => statuses.includes(entry.status));
  const checkoutOrders =
    new URLSearchParams(window.location.search).get("checkout") === "success"
      ? JSON.parse(sessionStorage.getItem("miroir_checkout_orders") || "[]")
      : [];
  const isCheckoutSuccess =
    new URLSearchParams(window.location.search).get("checkout") === "success";
  return (
    <>
      {isCheckoutSuccess ? (
        <section className="mb-7 pt-3">
          <div className="flex items-center gap-3 text-[#426E36]"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#426E36] text-white shadow-[0_10px_22px_rgba(66,110,54,0.25)]"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span><span className="text-xs font-black uppercase tracking-[0.16em]">Đặt hàng thành công</span></div>
          <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-[#171B16] sm:text-5xl">Cảm ơn bạn đã <span className="text-[#4F733C]">mua hàng!</span></h1>
          <p className="mt-2 text-base text-[#70776E]">Một đơn hàng tuyệt vời vừa được tạo. Chúng tôi sẽ sớm xử lý và giao đến bạn.</p>
          {checkoutOrders.length > 1 ? <div className="mt-5 grid gap-2">
            {checkoutOrders.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"
              >
                <a
                  className="font-mono font-black hover:underline"
                  href={`/app/orders/${item.id}`}
                >
                  {displayedCode(item.orderCode)}
                </a>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatMoney(item.total)}</span>
                  <Button
                    variant="secondary"
                    onClick={() => copy(item.orderCode)}
                  >
                    Sao chép
                  </Button>
                </div>
              </div>
            ))}
          </div> : null}
        </section>
      ) : null}
      {!isCheckoutSuccess ? <PageHeader eyebrow="Chi tiết đơn" title={displayedCode(order.orderCode)} /> : null}
      {notice ? <Notice text={notice} /> : null}
      <section className="mb-6 grid overflow-hidden rounded-[24px] border border-white/80 bg-white/75 shadow-[0_16px_40px_rgba(55,80,42,0.07)] backdrop-blur-sm sm:grid-cols-[1.45fr_.8fr_.85fr]">
        <div className="p-5 sm:p-6"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8B9589]">Mã đơn hàng</p><div className="mt-2 flex flex-wrap items-center gap-3"><p className="font-mono text-lg font-black text-[#151A14] sm:text-xl">{displayedCode(order.orderCode)}</p><button type="button" aria-label="Sao chép mã đơn" onClick={() => copy(order.orderCode)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#DDE8D8] text-[#4F733C] transition hover:bg-[#EEF5E8]"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2" /><path strokeLinecap="round" d="M5 15V5a2 2 0 012-2h10" /></svg></button></div></div>
        <div className="border-t border-[#E7EEE3] p-5 sm:border-l sm:border-t-0 sm:p-6"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8B9589]">Đặt ngày</p><p className="mt-2 text-sm font-bold text-[#3C463A]">{new Date(order.createdAt).toLocaleString("vi-VN")}</p></div>
        <div className="border-t border-[#E7EEE3] p-5 sm:border-l sm:border-t-0 sm:p-6"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8B9589]">Trạng thái</p><div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#EEF6E9] px-3 py-1.5 text-sm font-bold text-[#426E36]"><span className="h-2 w-2 rounded-full bg-[#4F7F42]" />{orderLabels[order.orderStatus] || order.orderStatus}</div></div>
      </section>
      <div className="order-detail grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-7">
        <div className="grid gap-8">
          <section className="miroir-card">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={orderLabels[order.orderStatus]} />
              <StatusBadge status={paymentLabels[order.paymentStatus]} />
            </div>
            <h2 className="mt-5 text-xl font-black">Sản phẩm</h2>
            {order.items.map((item) => (
              <div
                className="mt-4 flex gap-4 border-t border-line pt-4"
                key={item.variantId}
              >
                <div className="h-20 w-20 overflow-hidden rounded-xl bg-panel">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-muted">
                    {item.color || "Mặc định"} · {item.size || "Một cỡ"} ·{" "}
                    {item.sku} · x{item.quantity}
                  </p>
                  <p className="font-black">{formatMoney(item.lineTotal)}</p>
                </div>
              </div>
            ))}
          </section>
          <section className="miroir-card">
            <h2 className="text-xl font-black">Người nhận</h2>
            <p className="mt-3 font-bold">
              {order.recipient.name} · {order.recipient.phone}
            </p>
            <p className="text-sm text-muted">{order.recipient.fullAddress}</p>
            {order.recipient.note ? (
              <p className="mt-2 text-sm">Ghi chú: {order.recipient.note}</p>
            ) : null}
          </section>
          <section className="miroir-card">
            <h2 className="text-xl font-black">Timeline đơn hàng</h2>
            <ol className="mt-5 border-l-2 border-[#DCE8D7] pl-6">
              {deliverySteps.map((step, index) => {
                const entry = timeForStatus(step.statuses);
                const isCurrent = index === activeDeliveryStep;
                const isComplete = index < activeDeliveryStep;
                return <li className="relative pb-5 last:pb-0" key={step.label}><span className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${isCurrent || isComplete ? "bg-[#4F733C] shadow-[0_0_0_3px_rgba(79,115,60,0.12)]" : "bg-[#D7DDD5]"}`} /><div className="flex flex-wrap items-start justify-between gap-2"><div><p className={`font-bold ${isCurrent || isComplete ? "text-[#426E36]" : "text-[#7B857A]"}`}>{step.label}</p><p className="mt-0.5 text-xs text-[#7C857A]">{entry ? new Date(entry.createdAt).toLocaleString("vi-VN") : "Đang chờ cập nhật"}</p></div>{isCurrent && entry?.note ? <p className="max-w-xs text-right text-xs text-[#758073]">{entry.note}</p> : null}</div></li>;
              })}
            </ol>
          </section>
          {order.orderStatus === "delivered" ? (
            <FitFeedbackCard order={order} setNotice={setNotice} />
          ) : null}
          <ReturnRequests
            order={order}
            returns={returns}
            onChanged={load}
            setNotice={setNotice}
          />
          {dispute ? (
            <section className="miroir-card">
              <h2 className="text-xl font-black">
                Khiếu nại hoàn tiền · {dispute.status}
              </h2>
              <div className="mt-4 grid gap-2">
                {dispute.messages.map((item) => (
                  <div className="rounded-xl bg-panel p-3" key={item.id}>
                    <p className="text-xs font-bold uppercase text-muted">
                      {item.actorType}
                    </p>
                    <p>{item.message}</p>
                  </div>
                ))}
              </div>
              {!["resolved", "closed"].includes(dispute.status) ? (
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={async () => {
                    const message = window.prompt("Nội dung phản hồi:");
                    if (message) {
                      await replyMyDispute(dispute.id, message);
                      load();
                    }
                  }}
                >
                  Phản hồi
                </Button>
              ) : null}
            </section>
          ) : null}
        </div>
        <aside className="grid h-fit gap-5">
          {transfer ? (
            <section className="miroir-card">
              <h2 className="text-xl font-black">Chuyển khoản</h2>
              <img
                src={transfer.qrImageUrl}
                alt="QR chuyển khoản"
                className="mx-auto mt-4 max-h-64 rounded-xl"
              />
              <CopyRow
                label={transfer.bankName}
                value={transfer.accountNumber}
              />
              <CopyRow label="Chủ tài khoản" value={transfer.accountHolder} />
              <CopyRow
                label="Số tiền"
                value={String(order.total)}
                display={formatMoney(order.total)}
              />
              <CopyRow
                label="Nội dung"
                value={order.transferContent}
                display={displayedCode(order.transferContent)}
              />
              {["awaiting_transfer", "pending_verification"].includes(
                order.paymentStatus,
              ) ? (
                <>
                  <input
                    className="miroir-field mt-4"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProof(e.target.files?.[0])}
                  />
                  <Button
                    className="mt-3 w-full"
                    onClick={async () => {
                      try {
                        await reportMyTransfer(order.id, proof);
                        setNotice("Đã báo shop kiểm tra chuyển khoản.");
                        load();
                      } catch (e) {
                        setNotice(e.response?.data?.message);
                      }
                    }}
                  >
                    Tôi đã chuyển khoản
                  </Button>
                </>
              ) : null}
            </section>
          ) : null}
          <section className="miroir-card">
            <h2 className="text-xl font-black">Tóm tắt thanh toán</h2>
            <div className="mt-5 grid gap-3 rounded-2xl bg-[#F5F8F2] p-4 text-sm text-[#66705F]"><div className="flex items-center justify-between"><span>Tạm tính ({order.items.length} sản phẩm)</span><strong className="text-[#1E2B22]">{formatMoney(order.total)}</strong></div><div className="flex items-center justify-between"><span>Phí giao hàng</span><strong className="text-[#1E2B22]">—</strong></div></div>
            <div className="my-5 border-t border-dashed border-[#D9E5D3]" />
            <div className="flex items-end justify-between gap-3"><p className="font-black">Tổng cộng</p><p className="text-3xl font-black tracking-tight text-[#4F733C]">{formatMoney(order.total)}</p></div>
            <p className="mt-1 text-right text-[11px] font-semibold text-gray-400">Đã bao gồm VAT (nếu có)</p>
            <a href="/products" className="mt-6 flex w-full items-center justify-between rounded-2xl bg-[#507A42] py-2 pl-5 pr-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,115,60,0.22)] transition hover:-translate-y-0.5 hover:bg-[#426E36]"><span>Tiếp tục mua sắm</span><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/30"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></span></a>
            <button type="button" onClick={() => beginCustomerChat({ orderId: order.id }, { type: "order", id: order.id })} className="mt-3 w-full rounded-xl border border-[#D9E6D4] bg-white px-4 py-3 text-sm font-bold text-[#426E36] transition hover:bg-[#F3F8EF]">Nhắn shop về đơn hàng</button>
            {canCancel ? (
              <Button
                variant="secondary"
                className="mt-5 w-full"
                onClick={() => setShowCancelModal(true)}
              >
                Hủy / yêu cầu hủy
              </Button>
            ) : null}
            {order.orderStatus === "cancel_requested" ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-center text-xs font-bold text-amber-800">
                Đã gửi yêu cầu hủy đơn · Chờ người bán xem xét
              </div>
            ) : null}
            {canDispute ? (
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={async () => {
                  const message = window.prompt(
                    "Mô tả việc chưa nhận được tiền hoàn:",
                  );
                  if (!message) return;
                  try {
                    await createRefundDispute(order.id, message);
                    setNotice("Đã gửi khiếu nại đến shop và admin.");
                  } catch (e) {
                    setNotice(e.response?.data?.message);
                  }
                }}
              >
                Khiếu nại chưa nhận hoàn tiền
              </Button>
            ) : null}
          </section>
        </aside>
      </div>
      <CancelOrderModal
        isOpen={showCancelModal}
        order={order}
        onClose={() => setShowCancelModal(false)}
        onSuccess={() => {
          setNotice(
            order.orderStatus === "pending_confirmation"
              ? "Đã hủy đơn hàng thành công."
              : "Đã gửi yêu cầu hủy đơn đến người bán."
          );
          load();
        }}
      />
    </>
  );
}

function FitFeedbackCard({ order, setNotice }) {
  const [outcomes, setOutcomes] = useState({});
  const [busy, setBusy] = useState("");
  const submit = async (item) => {
    const outcome = outcomes[item.variantId];
    if (!outcome)
      return setNotice("Hãy chọn độ vừa vặn trước khi gửi phản hồi.");
    setBusy(item.variantId);
    try {
      await submitFitFeedback(order.id, item.variantId, outcome);
      setNotice("Cảm ơn bạn đã phản hồi về độ vừa vặn.");
    } catch (error) {
      setNotice(
        error.response?.data?.message || "Không thể gửi phản hồi Fit Finder.",
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <section className="miroir-card">
      <h2 className="text-xl font-black">Độ vừa vặn</h2>
      <p className="mt-1 text-sm text-muted">
        Phản hồi này chỉ dùng ở dạng tổng hợp để shop cải thiện bảng size.
      </p>
      <div className="mt-4 grid gap-3">
        {order.items.map((item) => (
          <div className="rounded-xl bg-panel p-3" key={item.variantId}>
            <p className="font-bold">
              {item.name} · {item.size || "Một cỡ"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                className="miroir-field !w-auto"
                value={outcomes[item.variantId] || ""}
                onChange={(event) =>
                  setOutcomes((current) => ({
                    ...current,
                    [item.variantId]: event.target.value,
                  }))
                }
              >
                <option value="">Chọn phản hồi</option>
                <option value="too_small">Hơi chật / nhỏ</option>
                <option value="true_to_size">Vừa đúng</option>
                <option value="too_large">Hơi rộng / lớn</option>
              </select>
              <Button
                variant="secondary"
                disabled={busy === item.variantId}
                onClick={() => submit(item)}
              >
                {busy === item.variantId ? "Đang gửi..." : "Gửi"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const returnSteps = [
  "Gửi yêu cầu",
  "Shop duyệt",
  "Gửi hàng",
  "Nhận hàng",
  "Hoàn tiền",
];
const returnStatusCopy = {
  requested: {
    title: "Chờ shop phản hồi",
    help: "Shop có tối đa 72 giờ để duyệt hoặc từ chối yêu cầu.",
  },
  approved: {
    title: "Đã được duyệt",
    help: "Gửi hàng theo hướng dẫn của shop và tải biên lai lên đây.",
  },
  return_shipped: {
    title: "Đã gửi hàng trả",
    help: "Shop sẽ xác nhận khi nhận được hàng của bạn.",
  },
  received: {
    title: "Shop đã nhận hàng",
    help: "Yêu cầu đang được chuyển sang bước hoàn tiền.",
  },
  refund_pending: {
    title: "Chờ hoàn tiền",
    help: "Shop đang chuyển tiền vào tài khoản bạn đã cung cấp.",
  },
  refunded: {
    title: "Đã hoàn tiền",
    help: "Hoàn tất. Bạn có thể xem biên lai chuyển khoản bên dưới.",
  },
  rejected: {
    title: "Shop từ chối yêu cầu",
    help: "Bạn có thể gửi yêu cầu cho admin xem xét.",
  },
  disputed: {
    title: "Admin đang xử lý",
    help: "Yêu cầu tạm dừng để admin đưa ra quyết định.",
  },
};
const returnStepIndex = (status) =>
  ({
    requested: 0,
    approved: 1,
    rejected: 1,
    return_shipped: 2,
    received: 3,
    refund_pending: 3,
    refunded: 4,
    disputed: 1,
  })[status] ?? 0;

function ReturnProgress({ status }) {
  const active = returnStepIndex(status);
  return (
    <ol className="mt-4 grid grid-cols-5 gap-1 text-center text-[10px] font-semibold text-muted sm:text-xs">
      {returnSteps.map((label, index) => (
        <li className="grid gap-1" key={label}>
          <span
            className={`mx-auto grid h-6 w-6 place-items-center rounded-full ${index <= active ? "bg-mintDeep text-white" : "bg-panel text-muted"}`}
          >
            {index + 1}
          </span>
          <span className={index === active ? "text-ink" : ""}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function ReturnRequests({ order, returns, onChanged, setNotice }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonCode, setReasonCode] = useState("other");
  const [bank, setBank] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [quantities, setQuantities] = useState({});
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const deliveredAt =
    order.deliveredAt ||
    order.statusHistory?.find((item) => item.status === "delivered")?.createdAt;
  const canCreate =
    order.orderStatus === "delivered" &&
    order.paymentStatus === "paid" &&
    deliveredAt &&
    Date.now() - new Date(deliveredAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
  const selectedItems = order.items
    .map((item) => ({
      ...item,
      returnQuantity: Number(quantities[item.variantId] || 0),
    }))
    .filter((item) => item.returnQuantity > 0);
  const refundEstimate = selectedItems.reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * item.returnQuantity,
    0,
  );
  const submit = async () => {
    if (!selectedItems.length)
      return setFormError("Chọn ít nhất một sản phẩm và số lượng cần trả.");
    if (
      !reason.trim() ||
      !bank.bankName.trim() ||
      !bank.accountNumber.trim() ||
      !bank.accountHolder.trim()
    )
      return setFormError("Điền lý do và đầy đủ thông tin nhận hoàn tiền.");
    setFormError("");
    setBusy(true);
    try {
      await createReturnRequest(
        order.id,
        {
          items: selectedItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.returnQuantity,
          })),
          reason,
          reasonCode,
          ...bank,
        },
        images,
      );
      setOpen(false);
      setReason("");
      setReasonCode("other");
      setQuantities({});
      setImages([]);
      await onChanged();
      setNotice("Đã gửi yêu cầu. Shop sẽ phản hồi trong vòng 72 giờ.");
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Không thể gửi yêu cầu trả hàng.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="miroir-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Trả hàng & hoàn tiền</h2>
          <p className="mt-1 text-sm text-muted">
            Một yêu cầu sẽ đi qua 5 bước rõ ràng; không gồm phí vận chuyển.
          </p>
        </div>
        {canCreate ? (
          <Button
            variant="secondary"
            onClick={() => {
              setFormError("");
              setOpen((value) => !value);
            }}
          >
            {open ? "Đóng biểu mẫu" : "Bắt đầu trả hàng"}
          </Button>
        ) : null}
      </div>
      {open ? (
        <div className="mt-5 grid gap-8 border-t border-line pt-5">
          <section>
            <p className="text-sm font-black">1. Chọn sản phẩm muốn trả</p>
            <div className="mt-3 grid gap-2">
              {order.items.map((item) => (
                <label
                  className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
                  key={item.variantId}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <span className="block text-xs text-muted">
                      {item.sku} · Đã mua {item.quantity} ·{" "}
                      {formatMoney(item.unitPrice)}/sp
                    </span>
                  </span>
                  <input
                    aria-label={`Số lượng trả ${item.name}`}
                    className="miroir-field w-20"
                    min="0"
                    max={item.quantity}
                    type="number"
                    value={quantities[item.variantId] || ""}
                    onChange={(event) =>
                      setQuantities((current) => ({
                        ...current,
                        [item.variantId]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            {selectedItems.length ? (
              <p className="mt-3 text-sm font-bold text-mintDeep">
                Dự kiến hoàn: {formatMoney(refundEstimate)}
              </p>
            ) : null}
          </section>
          <section className="grid gap-3">
            <p className="text-sm font-black">2. Cung cấp thông tin cho shop</p>
            <textarea
              className="miroir-field"
              placeholder="Lý do trả hàng *"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="miroir-field"
                placeholder="Ngân hàng *"
                value={bank.bankName}
                onChange={(event) =>
                  setBank({ ...bank, bankName: event.target.value })
                }
              />
              <input
                className="miroir-field"
                placeholder="Số tài khoản *"
                value={bank.accountNumber}
                onChange={(event) =>
                  setBank({ ...bank, accountNumber: event.target.value })
                }
              />
              <input
                className="miroir-field"
                placeholder="Chủ tài khoản *"
                value={bank.accountHolder}
                onChange={(event) =>
                  setBank({ ...bank, accountHolder: event.target.value })
                }
              />
            </div>
            <label className="text-sm text-muted">
              Ảnh tình trạng hàng (tùy chọn, tối đa 3 ảnh)
              <input
                className="miroir-field mt-2"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  setImages(Array.from(event.target.files || []).slice(0, 3))
                }
              />
            </label>
          </section>
          {formError ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button disabled={busy} onClick={submit}>
              {busy ? "Đang gửi..." : "Gửi yêu cầu cho shop"}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="mt-5 grid gap-3">
        {returns.map((request) => (
          <ReturnRequestCard
            key={request.id}
            request={request}
            onChanged={onChanged}
            setNotice={setNotice}
          />
        ))}
        {!returns.length && !canCreate ? (
          <p className="rounded-xl bg-panel p-3 text-sm text-muted">
            Đơn chỉ có thể trả trong 7 ngày sau khi giao thành công và đã thanh
            toán.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ReturnRequestCard({ request, onChanged, setNotice }) {
  const [trackingCode, setTrackingCode] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const copy = returnStatusCopy[request.status] || {
    title: request.status,
    help: "",
  };
  const shipment = async () => {
    if (!trackingCode.trim() || !images.length)
      return setError("Nhập mã vận đơn và tải ít nhất một ảnh biên lai.");
    setError("");
    setBusy(true);
    try {
      await submitReturnShipment(request.id, trackingCode, images);
      await onChanged();
    } catch (error) {
      setError(
        error.response?.data?.message || "Không thể gửi biên lai trả hàng.",
      );
    } finally {
      setBusy(false);
    }
  };
  const escalate = async () => {
    const message = window.prompt("Mô tả để admin xem xét:");
    if (message === null) return;
    try {
      await escalateReturn(request.id, message);
      await onChanged();
    } catch (error) {
      setError(error.response?.data?.message || "Không thể gửi tranh chấp.");
    }
  };
  const canEscalate =
    request.status === "rejected" ||
    (request.status === "requested" &&
      Date.now() - new Date(request.createdAt).getTime() >=
        72 * 60 * 60 * 1000);
  return (
    <article className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="font-black">{copy.title}</p>
          <p className="mt-1 text-sm text-muted">{copy.help}</p>
        </div>
        <p className="text-lg font-black">
          {formatMoney(request.refundAmount)}
        </p>
      </div>
      <ReturnProgress status={request.status} />
      <div className="mt-4 rounded-xl bg-panel p-3 text-sm">
        <p className="font-semibold">
          {request.items
            .map((item) => `${item.name} × ${item.quantity}`)
            .join(", ")}
        </p>
        <p className="mt-1 text-muted">Lý do: {request.reason}</p>
      </div>
      {request.returnInstructions ? (
        <div className="mt-3 rounded-xl border border-mintSoft bg-accentSoft p-3 text-sm">
          <strong>Việc bạn cần làm:</strong> {request.returnInstructions}
        </div>
      ) : null}
      {request.status === "approved" ? (
        <div className="mt-4 grid gap-2">
          <p className="text-sm font-black">3. Gửi hàng và tải biên lai</p>
          <input
            className="miroir-field"
            placeholder="Mã vận đơn *"
            value={trackingCode}
            onChange={(event) => setTrackingCode(event.target.value)}
          />
          <input
            className="miroir-field"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) =>
              setImages(Array.from(event.target.files || []).slice(0, 3))
            }
          />
          <Button disabled={busy} onClick={shipment}>
            {busy ? "Đang gửi..." : "Xác nhận đã gửi hàng"}
          </Button>
        </div>
      ) : null}
      {canEscalate ? (
        <Button variant="secondary" className="mt-4" onClick={escalate}>
          Yêu cầu admin hỗ trợ
        </Button>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {request.refund?.proof?.imageUrl ? (
        <a
          className="mt-3 block text-sm font-bold text-accentStrong"
          href={request.refund.proof.imageUrl}
          target="_blank"
          rel="noreferrer"
        >
          Xem biên lai hoàn tiền
        </a>
      ) : null}
    </article>
  );
}

function CopyRow({ label, value, display }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-panel p-3">
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="break-all font-mono font-bold">{display || value}</p>
      </div>
      <Button variant="secondary" onClick={() => copy(value)}>
        Copy
      </Button>
    </div>
  );
}
function Notice({ text }) {
  return (
    <p className="mt-5 rounded-xl border border-line bg-accentSoft p-4 text-sm font-semibold">
      {text}
    </p>
  );
}
