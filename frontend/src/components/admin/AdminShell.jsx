import { useState } from "react";
import { LayoutDashboard, Store, Users, CreditCard, ShieldCheck, Bell, LogOut, Menu, X, Package, Trash2, FileSpreadsheet, Settings, RefreshCw, ArrowLeft, Layers } from "lucide-react";

const navigation = [
  ["overview", "Tổng quan", LayoutDashboard],
  ["customers", "Khách hàng", Users],
  ["shops", "Quản lý cửa hàng", Store],
  ["owners", "Tài khoản chủ shop", Users],
  ["subscriptions", "Shop đăng ký gói", Layers],
  ["plans", "Gói & thanh toán", CreditCard],
  ["disputes", "Khiếu nại & thông báo", Bell],
];
const shopNavigation = [["products", "Sản phẩm", Package], ["profile", "Hồ sơ cửa hàng", Settings], ["excel", "Nhập Excel", FileSpreadsheet], ["trash", "Thùng rác", Trash2]];
const titles = Object.fromEntries([...navigation, ...shopNavigation].map(([id, label]) => [id, label]));

export default function AdminShell({ view, setView, admin, selectedShop, pendingCount, unreadCount, logout, refresh, refreshing, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (id) => { setView(id); setMenuOpen(false); };
  return <div className="admin-workspace min-h-screen bg-[#F9FAF4] text-[#1F2A2A] lg:flex">
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[#E2EBD5] bg-[#F9FAF4]/95 p-4 backdrop-blur lg:hidden">
      <span className="font-display font-black">MIROIR <span className="ml-2 text-xs text-[#6F8746]">ADMIN CENTER</span></span>
      <button className="neu-icon-btn h-10 w-10" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
    </div>
    {menuOpen && <button aria-label="Đóng menu" className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setMenuOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] shrink-0 p-3 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="neu-sidebar-capsule flex h-full flex-col p-4">
        <div className="flex items-center gap-3 border-b border-[#E2EBD5] pb-5"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B3D07E] to-[#6F8746] font-display text-xl font-black text-white">M</span><div><p className="font-display text-lg font-black tracking-tight">MIROIR</p><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6F8746]">Admin Center</p></div></div>
        <div className="neu-inset my-5 flex items-center gap-2 rounded-2xl p-3"><ShieldCheck size={20} className="shrink-0 text-[#6F8746]" /><div className="min-w-0"><p className="text-xs font-bold">Quản trị hệ thống</p><p className="mt-1 truncate text-[11px] text-[#6E7D7C]" title={admin?.email}>{admin?.email}</p></div></div>
        <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-2 overflow-y-auto">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-[#96A5A4]">Không gian quản lý</p>
          {navigation.map(([id, label, Icon]) => <button key={id} onClick={() => navigate(id)} aria-current={view === id ? "page" : undefined} className={`neu-nav-item w-full ${view === id ? "neu-nav-item-active" : ""}`}><Icon size={16} /><span className="flex-1 text-left">{label}</span>{((id === "owners" && pendingCount) || (id === "disputes" && unreadCount)) > 0 && <span className="rounded-full bg-[#FFE7C4] px-2 py-0.5 text-[10px] text-[#8A5B20]">{id === "owners" ? pendingCount : unreadCount}</span>}</button>)}
          {selectedShop && <div className="mt-5 border-t border-[#E2EBD5] pt-4"><p className="mb-3 truncate px-3 text-xs font-bold text-[#6F8746]">{selectedShop.name}</p>{shopNavigation.map(([id, label, Icon]) => <button key={id} onClick={() => navigate(id)} className={`neu-nav-item w-full ${view === id ? "neu-nav-item-active" : ""}`}><Icon size={15} />{label}</button>)}</div>}
        </nav>
        <div className="mt-5 border-t border-[#E2EBD5] pt-4"><p className="px-3 text-[10px] leading-relaxed text-[#96A5A4]">Kết nối cửa hàng.<br />Đồng hành cùng tăng trưởng.</p><button onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-xl p-3 text-xs font-bold text-[#6E7D7C] hover:bg-red-50 hover:text-red-700"><LogOut size={16} />Đăng xuất</button></div>
      </div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2EBD5] px-4 py-5 sm:px-8"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.15em] text-[#6F8746]">MIROIR / Quản trị</p><h1 className="text-2xl font-black tracking-tight">{titles[view]}</h1>{view !== "customers" && <p className="mt-1 text-xs text-[#6E7D7C]">{shopNavigation.some(([id]) => id === view) ? selectedShop?.name : "Theo dõi hoạt động và phát triển mạng lưới cửa hàng."}</p>}</div><div className="flex items-center gap-3"><button onClick={() => navigate("disputes")} className="neu-icon-btn relative h-10 w-10" aria-label={`Thông báo: ${unreadCount} chưa đọc`}><Bell size={17} />{unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#FF8F8F]" />}</button><button onClick={refresh} disabled={refreshing} className="neu-btn-raised flex items-center gap-2 px-4 py-2.5 text-xs font-bold disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Đang cập nhật" : "Làm mới"}</button></div></header>
      <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">{shopNavigation.some(([id]) => id === view) && <button onClick={() => navigate("shops")} className="mb-4 flex items-center gap-2 text-xs font-bold text-[#6F8746]"><ArrowLeft size={14} />Danh sách cửa hàng</button>}{children}</main>
    </div>
  </div>;
}
