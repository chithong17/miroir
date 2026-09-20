import React, { useState } from "react";
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  Filter,
  Edit2,
  Copy,
  Archive,
  Trash2,
  Package,
  Eye,
  Sparkles,
  CheckSquare,
  Square,
  Upload,
  MoreHorizontal,
  FileSpreadsheet,
} from "lucide-react";
import {
  NeuCard,
  NeuButton,
  NeuInput,
  NeuSearch,
  NeuBadge,
  NeuModal,
  NeuTabs,
} from "./NeuComponents.jsx";

const STATUS_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "published", label: "Đang bán" },
  { id: "draft", label: "Bản nháp" },
  { id: "out_of_stock", label: "Hết hàng" },
];

export default function SellerProductsView({
  products = [],
  onCreateProduct,
  onEditProduct,
  onDuplicateProduct,
  onArchiveProduct,
  onDeleteProduct,
  onBulkEdit,
  onNavigateImport,
  formatMoney,
}) {
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("published");

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesStatus =
      activeStatus === "all"
        ? true
        : activeStatus === "out_of_stock"
        ? p.availability === "out_of_stock" || Number(p.stock) === 0
        : p.status === activeStatus;

    const matchesSearch =
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyBulk = () => {
    if (onBulkEdit) {
      onBulkEdit(selectedIds, { status: bulkStatus });
    }
    setIsBulkModalOpen(false);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <NeuTabs
            tabs={STATUS_TABS.map((t) => ({
              ...t,
              count:
                t.id === "all"
                  ? products.length
                  : t.id === "out_of_stock"
                  ? products.filter((p) => p.availability === "out_of_stock" || Number(p.stock) === 0).length
                  : products.filter((p) => p.status === t.id).length,
            }))}
            activeTab={activeStatus}
            onChange={setActiveStatus}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-64">
            <NeuSearch
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Tìm theo tên, SKU..."
            />
          </div>

          {/* View Mode Toggle */}
          <div className="neu-inset p-1 flex items-center rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition ${
                viewMode === "grid" ? "neu-btn-raised text-[#6F8746] shadow-sm" : "text-[#96A5A4]"
              }`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl transition ${
                viewMode === "table" ? "neu-btn-raised text-[#6F8746] shadow-sm" : "text-[#96A5A4]"
              }`}
              title="Xem dạng danh sách"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <NeuButton
            variant="secondary"
            icon={FileSpreadsheet}
            onClick={onNavigateImport}
            size="md"
          >
            Nhập Excel
          </NeuButton>

          <NeuButton
            variant="primary"
            icon={Plus}
            onClick={onCreateProduct}
            size="md"
          >
            Thêm sản phẩm
          </NeuButton>
        </div>
      </div>

      {/* Bulk Action Bar (when products selected) */}
      {selectedIds.length > 0 && (
        <div className="neu-card p-4 bg-[#F1F5E8] border border-[#B3D07E] flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1F2A2A]">
            <span>Đã chọn {selectedIds.length} sản phẩm</span>
          </div>
          <div className="flex items-center gap-2">
            <NeuButton
              variant="secondary"
              size="sm"
              onClick={() => setIsBulkModalOpen(true)}
            >
              Đổi trạng thái hàng loạt
            </NeuButton>
            <NeuButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              Bỏ chọn
            </NeuButton>
          </div>
        </div>
      )}

      {/* Product Content: Grid or Table */}
      {filteredProducts.length === 0 ? (
        <div className="neu-card p-12 text-center flex flex-col items-center justify-center">
          <Package className="h-16 w-16 text-[#B3D07E] mb-3" />
          <h4 className="text-base font-bold text-[#1F2A2A]">
            {search ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm nào"}
          </h4>
          <p className="text-xs text-[#6E7D7C] mt-1 max-w-sm">
            Bắt đầu tải lên bộ sưu tập thời trang đầu tiên của bạn để bán hàng cùng MIROIR!
          </p>
          <NeuButton
            variant="primary"
            icon={Plus}
            onClick={onCreateProduct}
            className="mt-5"
          >
            Thêm sản phẩm mới
          </NeuButton>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            const isOutOfStock = product.availability === "out_of_stock" || Number(product.stock) === 0;

            return (
              <div
                key={product.id}
                className={`neu-card p-4 flex flex-col justify-between neu-card-hover group relative ${
                  isSelected ? "ring-2 ring-[#6F8746]" : ""
                }`}
              >
                {/* Select checkbox */}
                <button
                  type="button"
                  onClick={() => toggleSelectOne(product.id)}
                  className="absolute top-6 left-6 z-10 neu-icon-btn h-7 w-7 text-[#6F8746] bg-white/90"
                >
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4 text-[#96A5A4]" />
                  )}
                </button>

                {/* Status Badge */}
                <div className="absolute top-6 right-6 z-10">
                  <NeuBadge
                    variant={
                      isOutOfStock
                        ? "coral"
                        : product.status === "published"
                        ? "green"
                        : "yellow"
                    }
                  >
                    {isOutOfStock ? "Hết hàng" : product.status === "published" ? "Đang bán" : "Bản nháp"}
                  </NeuBadge>
                </div>

                {/* Product Image Thumbnail */}
                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-white mb-3.5 border border-[#E2EBD5] shadow-inner flex items-center justify-center relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-[#96A5A4]" />
                  )}

                  {/* AI Try-On Tag with Violet Gradient */}
                  <div className="absolute bottom-2 left-2 bg-[#8B7CFF]/90 backdrop-blur-md text-white px-2.5 py-0.5 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <Sparkles className="h-3 w-3 text-white" />
                    <span>{product.views || product.tryOns || 0} lượt thử AI</span>
                  </div>
                </div>

                {/* Product Details */}
                <div>
                  <p className="text-[11px] font-mono text-[#96A5A4] uppercase">
                    SKU: {product.sku || "N/A"}
                  </p>
                  <h4 className="font-bold text-sm text-[#1F2A2A] line-clamp-2 mt-0.5" title={product.name}>
                    {product.name}
                  </h4>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-base font-black text-[#6F8746]">
                      {formatMoney ? formatMoney(product.price) : `${Number(product.price || 0).toLocaleString()}đ`}
                    </span>
                    <span className="text-xs text-[#6E7D7C]">
                      Kho: <strong>{product.stock ?? 0}</strong>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-[#E2EBD5] flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditProduct(product)}
                    className="neu-btn-raised flex-1 py-1.5 text-xs text-[#1F2A2A] flex items-center justify-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-[#6F8746]" />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateProduct && onDuplicateProduct(product)}
                    className="neu-icon-btn h-8 w-8 text-[#6E7D7C] hover:text-[#1F2A2A]"
                    title="Sao chép"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onArchiveProduct(product.id)}
                    className="neu-icon-btn h-8 w-8 text-[#6E7D7C] hover:text-red-700"
                    title="Lưu trữ / Đưa vào thùng rác"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <NeuCard padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="neu-inset bg-[#F1F5E8] text-[#6E7D7C] text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-4 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="neu-icon-btn h-6 w-6 text-[#6F8746]"
                    >
                      {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                        <CheckSquare className="h-3.5 w-3.5" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-[#96A5A4]" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Sản phẩm</th>
                  <th className="p-4">Giá bán</th>
                  <th className="p-4">Tồn kho</th>
                  <th className="p-4">Lượt thử AI</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EBD5]">
                {filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isOutOfStock = p.availability === "out_of_stock" || Number(p.stock) === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#F1F5E8]/60 transition ${
                        isSelected ? "bg-[#B3D07E]/15" : ""
                      }`}
                    >
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(p.id)}
                          className="neu-icon-btn h-6 w-6 text-[#6F8746]"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-3.5 w-3.5" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-[#96A5A4]" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-white border border-[#E2EBD5] overflow-hidden shrink-0 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-[#96A5A4]" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#1F2A2A]">{p.name}</p>
                            <p className="text-xs text-[#96A5A4] font-mono">SKU: {p.sku || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-black text-[#6F8746]">
                        {formatMoney ? formatMoney(p.price) : `${Number(p.price || 0).toLocaleString()}đ`}
                      </td>
                      <td className="p-4 text-xs font-semibold text-[#1F2A2A]">
                        {p.stock ?? 0} chiếc
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8B7CFF]">
                          <Sparkles className="h-3.5 w-3.5" />
                          {p.views || p.tryOns || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <NeuBadge
                          variant={
                            isOutOfStock
                              ? "coral"
                              : p.status === "published"
                              ? "green"
                              : "yellow"
                          }
                        >
                          {isOutOfStock ? "Hết hàng" : p.status === "published" ? "Đang bán" : "Bản nháp"}
                        </NeuBadge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            className="neu-icon-btn h-8 w-8 text-[#6F8746]"
                            title="Sửa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onArchiveProduct(p.id)}
                            className="neu-icon-btn h-8 w-8 text-[#96A5A4] hover:text-red-700"
                            title="Lưu trữ"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </NeuCard>
      )}

      {/* Bulk Status Edit Modal */}
      <NeuModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Cập nhật trạng thái hàng loạt"
        subtitle={`Thay đổi trạng thái cho ${selectedIds.length} sản phẩm đã chọn.`}
      >
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-[#6E7D7C]">
            Chọn trạng thái mới
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBulkStatus("published")}
              className={`p-4 rounded-2xl text-center font-bold text-sm transition ${
                bulkStatus === "published"
                  ? "neu-btn-primary text-white"
                  : "neu-btn-raised text-[#1F2A2A]"
              }`}
            >
              Đang bán (Published)
            </button>
            <button
              type="button"
              onClick={() => setBulkStatus("draft")}
              className={`p-4 rounded-2xl text-center font-bold text-sm transition ${
                bulkStatus === "draft"
                  ? "neu-btn-primary text-white"
                  : "neu-btn-raised text-[#1F2A2A]"
              }`}
            >
              Bản nháp (Draft)
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#E2EBD5]">
            <NeuButton variant="ghost" onClick={() => setIsBulkModalOpen(false)}>
              Hủy
            </NeuButton>
            <NeuButton variant="primary" onClick={handleApplyBulk}>
              Áp dụng thay đổi
            </NeuButton>
          </div>
        </div>
      </NeuModal>
    </div>
  );
}
