import React, { useState } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Package,
  Search,
  CheckCircle2,
} from "lucide-react";
import {
  NeuCard,
  NeuButton,
  NeuSearch,
  NeuModal,
  NeuBadge,
} from "./NeuComponents.jsx";
import { getProductStock } from "./productInventory.js";

export default function SellerTrashView({
  products = [],
  onRestoreProduct,
  onHardDeleteProduct,
  formatMoney,
}) {
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Filter archived / trashed products
  const trashedProducts = products.filter((p) => {
    const isArchived = p.status === "archived" || p.status === "trashed" || p.isDeleted;
    const matchesSearch =
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase());
    return isArchived && matchesSearch;
  });

  const handleConfirmDelete = () => {
    if (confirmDeleteId && onHardDeleteProduct) {
      onHardDeleteProduct(confirmDeleteId);
    }
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1F2A2A]">
            Thùng rác & Lưu trữ sản phẩm
          </h2>
          <p className="text-xs text-[#6E7D7C] mt-0.5">
            Các sản phẩm đã tạm dừng kinh doanh hoặc đã xóa tạm thời. Bạn có thể khôi phục lại kho hàng bất cứ lúc nào.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <NeuSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Tìm trong thùng rác..."
          />
        </div>
      </div>

      {/* Trash Products Table */}
      <NeuCard padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="neu-inset bg-[#F1F5E8]/60 text-[#6E7D7C] text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4 pl-6">Sản phẩm</th>
                <th className="p-4">Giá bán cũ</th>
                <th className="p-4">Tồn kho cũ</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 pr-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EBD5]">
              {trashedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-xs text-[#8C9B9A]">
                    Thùng rác hiện đang trống. Không có sản phẩm nào bị lưu trữ.
                  </td>
                </tr>
              ) : (
                trashedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F1F5E8]/30 transition">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-white border border-[#E2EBD5] overflow-hidden shrink-0 flex items-center justify-center neu-inset">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover grayscale opacity-70" />
                          ) : (
                            <Package className="h-5 w-5 text-[#8C9B9A]" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#8C9B9A] line-through">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-[#8C9B9A] font-mono">SKU: {p.sku || "N/A"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-[#6E7D7C]">
                      {formatMoney ? formatMoney(p.price) : `${Number(p.price || 0).toLocaleString()}đ`}
                    </td>

                    <td className="p-4 text-xs text-[#8C9B9A]">
                      {getProductStock(p)} chiếc
                    </td>

                    <td className="p-4">
                      <NeuBadge variant="coral">Đã lưu trữ</NeuBadge>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <NeuButton
                          variant="secondary"
                          size="sm"
                          icon={RotateCcw}
                          onClick={() => onRestoreProduct(p.id)}
                          className="text-[#6F8746]"
                        >
                          Khôi phục
                        </NeuButton>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="neu-icon-btn h-8 w-8 text-[#FF8F8F] hover:text-red-600"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {/* Permanent Delete Confirmation Modal */}
      <NeuModal
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title="Xác nhận xóa vĩnh viễn"
        subtitle="Hành động này không thể hoàn tác sau khi thực hiện."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
            <p className="leading-relaxed">
              Sản phẩm này sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu và hệ thống gợi ý AI Virtual Try-On. Mọi liên kết và dữ liệu thử đồ liên quan sẽ bị loại bỏ vĩnh viễn.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2EBD5]">
            <NeuButton
              variant="ghost"
              onClick={() => setConfirmDeleteId(null)}
            >
              Hủy bỏ
            </NeuButton>
            <NeuButton
              variant="danger"
              onClick={handleConfirmDelete}
            >
              Xóa vĩnh viễn
            </NeuButton>
          </div>
        </div>
      </NeuModal>
    </div>
  );
}
