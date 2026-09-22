import React, { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingBag,
  BarChart3,
  Users,
  CreditCard,
  Store,
  FileSpreadsheet,
  Trash2,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  LogOut,
  Globe,
  Menu,
  X,
  HelpCircle,
  Sparkles,
  Plus,
} from "lucide-react";
import { useLanguage } from "../../i18n.jsx";
import { NeuSearch, NeuButton, NeuBadge } from "./NeuComponents.jsx";

export const SELLER_NAV_ITEMS = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "messages", label: "Tin nhắn", icon: MessageSquare, badgeKey: "chatUnread", badgeColor: "bg-[#FF8F8F]" },
  { id: "products", label: "Sản phẩm", icon: Package },
  { id: "orders", label: "Đơn hàng", icon: ShoppingBag, badgeKey: "orderUnread", badgeColor: "bg-[#68A7FF]" },
  { id: "analytics", label: "Phân tích", icon: BarChart3, dividerBefore: true },
  { id: "insights", label: "Thấu hiểu khách hàng", icon: Sparkles },
  { id: "billing", label: "Gói & thanh toán", icon: CreditCard, dividerBefore: true },
  { id: "shop", label: "Hồ sơ Cửa hàng", icon: Store },
  { id: "import", label: "Nhập Excel", icon: FileSpreadsheet },
  { id: "trash", label: "Thùng rác", icon: Trash2, dividerBefore: true },
];

export default function SellerShell({
  view,
  setView,
  shop,
  subscription,
  unreadCount = 0,
  chatUnreadCount = 0,
  notifications = [],
  onReadNotification,
  logout,
  children,
  pageTitle,
  pageSubtitle,
  headerActions,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm dữ liệu cửa hàng...",
}) {
  const { language, toggleLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const planName = subscription?.planCode || "MIROIR SELLER";
  const unreadNotifs = (notifications || []).filter((n) => !n.readAt);

  return (
    <div className="min-h-screen bg-[#F9FAF4] text-[#1F2A2A] flex flex-col lg:flex-row antialiased selection:bg-[#B3D07E]/40 selection:text-[#1F2A2A]">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b border-[#E2EBD5] shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="neu-icon-btn h-9 w-9 text-[#6F8746]"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black tracking-tight text-lg text-[#1F2A2A]">
              MIROIR
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#6F8746] bg-[#F1F5E8] px-2 py-0.5 rounded-full border border-[#B3D07E]/50">
              Seller
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="neu-icon-btn h-9 w-9 relative text-[#6E7D7C]"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FF8F8F]" />
            )}
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#B3D07E] to-[#6F8746] flex items-center justify-center font-black text-xs text-white shadow-sm">
            {shop?.name ? shop.name.charAt(0).toUpperCase() : "S"}
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Floating 3D Capsule Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-68 p-3 lg:p-3.5 transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:block flex-shrink-0 ${
          isMobileMenuOpen ? "translate-x-0 bg-[#F9FAF4] shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="neu-sidebar-capsule h-full flex flex-col justify-between p-3.5 sm:p-4 overflow-hidden">
          {/* Top Logo & Traffic Light dots */}
          <div className="shrink-0">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E2EBD5]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#B3D07E] to-[#6F8746] flex items-center justify-center text-white font-display font-black text-base shadow-sm">
                  M
                </div>
                <div>
                  <span className="font-display font-black tracking-tight text-[15px] text-[#1F2A2A] leading-none block">
                    MIROIR
                  </span>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6F8746] mt-0.5">
                    Seller Center
                  </p>
                </div>
              </div>

              {/* 3D Traffic Light Dots */}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF6F7D] shadow-2xs" />
                <span className="h-2 w-2 rounded-full bg-[#FFD95E] shadow-2xs" />
                <span className="h-2 w-2 rounded-full bg-[#7EDC9A] shadow-2xs" />
              </div>
            </div>

            {/* Shop Profile Capsule */}
            <div className="neu-inset p-2 my-2 rounded-xl flex items-center gap-2.5">
              <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-[#E2EBD5] shadow-2xs">
                {shop?.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-black text-xs text-[#6F8746]">
                    {shop?.name ? shop.name.slice(0, 2).toUpperCase() : "SH"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs truncate text-[#1F2A2A] leading-tight">
                  {shop?.name || "Cửa hàng của tôi"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-[#B3D07E]/25 text-[#6F8746]">
                    {planName}
                  </span>
                  {shop?.slug && (
                    <a
                      href={`/app/shops/${shop.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#96A5A4] hover:text-[#6F8746] inline-flex items-center"
                      title="Xem cửa hàng công khai"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Nav Menu - Evenly Distributed with Area Dividers */}
          <nav className="flex-1 flex flex-col justify-between my-1.5 min-h-0">
            {SELLER_NAV_ITEMS.map((item) => {
              const isActive = view === item.id;
              const Icon = item.icon;
              const badge =
                item.badgeKey === "chatUnread"
                  ? chatUnreadCount
                  : item.badgeKey === "orderUnread"
                  ? unreadCount
                  : null;

              return (
                <React.Fragment key={item.id}>
                  {item.dividerBefore && (
                    <div className="w-full border-t border-[#E2EBD5]/90 my-0.5" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full neu-nav-item ${
                      isActive ? "neu-nav-item-active" : ""
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#6F8746]" : "text-[#96A5A4]"}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge > 0 ? (
                      <span className={`h-4.5 min-w-4.5 px-1.5 rounded-full ${item.badgeColor || "bg-[#68A7FF]"} text-white text-[10px] font-bold flex items-center justify-center shadow-2xs`}>
                        {badge}
                      </span>
                    ) : null}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Bottom Card / Actions */}
          <div className="pt-2 border-t border-[#E2EBD5] space-y-1.5">
            <div className="neu-inset px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[#6E7D7C]">
                <Globe className="h-3.5 w-3.5" />
                <span>Ngôn ngữ:</span>
              </div>
              <button
                type="button"
                onClick={toggleLanguage}
                className="font-bold text-[#6F8746] hover:underline uppercase"
              >
                {language === "vi" ? "Tiếng Việt" : "English"}
              </button>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-1.5 p-1.5 rounded-xl text-xs font-bold text-[#6E7D7C] hover:text-red-700 hover:bg-red-50/70 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-[#E2EBD5]/80 bg-[#F9FAF4]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-6 flex-1 max-w-xl">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1F2A2A]">
                {pageTitle || "Kênh Người Bán"}
              </h1>
              {pageSubtitle && (
                <p className="text-xs text-[#6E7D7C] mt-0.5">{pageSubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search Bar with Pill Neumorphic Style */}
            {onSearchChange && (
              <div className="w-64 xl:w-80">
                <NeuSearch
                  value={searchQuery}
                  onChange={onSearchChange}
                  onClear={() => onSearchChange({ target: { value: "" } })}
                  placeholder={searchPlaceholder}
                />
              </div>
            )}

            {/* Contextual Header Actions */}
            {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}

            {/* Quick Action Pill Button (+) - Miroir Mint */}
            <a
              href="/shop/products/new"
              className="h-10 w-10 rounded-full bg-[#B3D07E] hover:bg-[#A3C46C] text-white shadow-[0_4px_14px_rgba(179,208,126,0.4)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-[#A3C46C]/40"
              title="Thêm sản phẩm mới"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </a>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="neu-icon-btn h-10 w-10 relative text-[#4A5D48] hover:text-[#1F2A2A] border border-[#DCE4D6] shadow-xs"
                title="Thông báo"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#FF8F8F] ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationsOpen && (
                <div className="shop-notification-popover absolute right-0 mt-3 w-80 sm:w-96 neu-card p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-[#E2EBD5] pb-3 mb-3">
                    <span className="font-black text-sm text-[#1F2A2A]">
                      Thông báo ({unreadNotifs.length} mới)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs font-bold text-[#6E7D7C] hover:text-[#1F2A2A]"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-[#96A5A4]">
                        Chưa có thông báo nào.
                      </p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onReadNotification && onReadNotification(n)}
                          className={`p-3 rounded-2xl cursor-pointer text-xs transition ${
                            n.readAt
                              ? "bg-white/40 text-[#6E7D7C]"
                              : "neu-inset text-[#1F2A2A] font-medium"
                          }`}
                        >
                          <p className="font-bold text-[#6F8746]">{n.title}</p>
                          <p className="mt-0.5 text-[#6E7D7C] line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Capsule */}
            <div className="rounded-full border border-[#DCE4D6] bg-white px-3.5 py-1.5 flex items-center gap-2.5 shadow-xs">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#B3D07E] to-[#6F8746] flex items-center justify-center font-black text-xs text-white shadow-xs">
                {shop?.name ? shop.name.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-[#1F2A2A] max-w-[120px] truncate">
                  {shop?.name || "Chủ Shop"}
                </p>
                <p className="text-[10px] text-[#96A5A4] capitalize">
                  {subscription?.planCode ? subscription.planCode.toLowerCase() : "Seller"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
