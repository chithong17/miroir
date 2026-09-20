import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  NeuCard,
  NeuButton,
  NeuBadge,
} from "./NeuComponents.jsx";

export default function SellerImportView({
  onDownloadTemplate,
  onImportFile,
  importResult,
  loading = false,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = () => {
    if (selectedFile && onImportFile) {
      onImportFile(selectedFile);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1F2A2A]">
          Nhập sản phẩm hàng loạt bằng file Excel
        </h2>
        <p className="text-xs text-[#6E7D7C] mt-0.5">
          Quy trình chuẩn hóa 3 bước giúp tải lên hàng trăm sản phẩm cùng lúc vào kho hàng MIROIR an toàn và nhanh chóng
        </p>
      </div>

      {/* 3-Step Process Indicator with colorful badges */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="neu-card p-4 flex items-center gap-3 bg-gradient-to-r from-white to-[#F1F5E8]">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#68A7FF] to-[#3B82F6] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
            1
          </div>
          <div>
            <p className="font-bold text-xs text-[#1F2A2A]">Tải file mẫu chuẩn</p>
            <p className="text-[11px] text-[#6E7D7C]">Định dạng Excel .xlsx</p>
          </div>
        </div>

        <div className="neu-card p-4 flex items-center gap-3 bg-gradient-to-r from-white to-[#F1F5E8]">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#B3D07E] to-[#6F8746] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
            2
          </div>
          <div>
            <p className="font-bold text-xs text-[#1F2A2A]">Điền dữ liệu & Kéo thả</p>
            <p className="text-[11px] text-[#6E7D7C]">Tối đa 1000 sản phẩm</p>
          </div>
        </div>

        <div className="neu-card p-4 flex items-center gap-3 bg-gradient-to-r from-white to-[#F1F5E8]">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#8B7CFF] to-[#6366F1] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
            3
          </div>
          <div>
            <p className="font-bold text-xs text-[#1F2A2A]">Đối soát & Nhập kho</p>
            <p className="text-[11px] text-[#6E7D7C]">Đồng bộ ngay tức thì</p>
          </div>
        </div>
      </div>

      {/* Step 1: Download Template */}
      <NeuCard className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFFFFF]">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl neu-inset bg-[#F1F5E8] text-[#6F8746] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#1F2A2A]">
              File Excel mẫu nhập sản phẩm MIROIR
            </h4>
            <p className="text-xs text-[#6E7D7C] mt-0.5">
              Bao gồm đầy đủ các cột: Tên, Mã SKU, Giá bán, Tồn kho, Danh mục, Màu sắc, Kích cỡ, Thẻ phong cách & URL ảnh
            </p>
          </div>
        </div>

        <NeuButton
          variant="secondary"
          icon={Download}
          onClick={onDownloadTemplate}
          className="shrink-0 text-[#6F8746] font-bold"
        >
          Tải file mẫu (.xlsx)
        </NeuButton>
      </NeuCard>

      {/* Step 2: Upload Dropzone */}
      <NeuCard>
        <h4 className="font-black text-sm text-[#1F2A2A] mb-4">
          Tải lên file dữ liệu sản phẩm
        </h4>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`neu-inset p-8 sm:p-12 text-center rounded-3xl transition border-2 border-dashed ${
            dragOver ? "border-[#6F8746] bg-[#F1F5E8]/80" : "border-[#B3D07E]/60 bg-[#F9FAF4]"
          }`}
        >
          <div className="h-16 w-16 mx-auto rounded-2xl neu-icon-btn bg-white text-[#6F8746] flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="h-8 w-8" />
          </div>

          <h5 className="font-bold text-sm text-[#1F2A2A]">
            Kéo và thả file Excel của bạn vào khu vực này
          </h5>
          <p className="text-xs text-[#8C9B9A] mt-1">
            Hỗ trợ định dạng .xlsx, .xls hoặc .csv (dung lượng tối đa 15MB)
          </p>

          <label className="mt-5 inline-block">
            <span className="neu-btn-raised px-5 py-2.5 text-xs text-[#1F2A2A] cursor-pointer inline-flex items-center gap-2 font-bold hover:text-[#6F8746] transition">
              Chọn file từ máy tính
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <div className="mt-6 p-4 rounded-2xl bg-white border border-[#E2EBD5] inline-flex items-center gap-3 shadow-md max-w-md w-full justify-between animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 truncate text-left">
                <FileCheck className="h-5 w-5 text-[#6F8746] shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-[#1F2A2A] truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-[#8C9B9A]">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <NeuButton
                variant="primary"
                size="sm"
                disabled={loading}
                onClick={handleExecuteImport}
                className="shrink-0"
              >
                {loading ? "Đang xử lý..." : "Tiến hành nhập kho"}
              </NeuButton>
            </div>
          )}
        </div>
      </NeuCard>

      {/* Step 3: Import Result & Verification Details */}
      {importResult && (
        <NeuCard className="animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3 border-b border-[#E2EBD5] pb-4 mb-4">
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-[#7EDC9A]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-[#1F2A2A]">
                Kết quả đối soát & Nhập file
              </h4>
              <p className="text-xs text-[#6E7D7C]">
                Hệ thống đã hoàn tất xử lý và thêm sản phẩm vào gian hàng
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <div className="neu-inset p-4 rounded-2xl text-center bg-white/60">
              <span className="text-xs text-[#6E7D7C] font-medium">Tổng số dòng phát hiện</span>
              <p className="text-2xl font-black text-[#68A7FF] mt-1">
                {importResult.totalRows || importResult.importedCount || 0}
              </p>
            </div>
            <div className="neu-inset p-4 rounded-2xl text-center bg-white/60">
              <span className="text-xs text-[#6E7D7C] font-medium">Nhập thành công</span>
              <p className="text-2xl font-black text-[#7EDC9A] mt-1">
                {importResult.createdCount || importResult.importedCount || 0}
              </p>
            </div>
            <div className="neu-inset p-4 rounded-2xl text-center bg-white/60">
              <span className="text-xs text-[#6E7D7C] font-medium">Dòng lỗi / Bỏ qua</span>
              <p className="text-2xl font-black text-[#FF8F8F] mt-1">
                {importResult.failedCount || 0}
              </p>
            </div>
          </div>

          {importResult.errors?.length > 0 && (
            <div className="neu-inset p-4 rounded-2xl space-y-2 bg-red-50/50 border border-red-200">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Các cảnh báo đối soát cần lưu ý:
              </span>
              <ul className="text-xs text-red-800 space-y-1 pl-5 list-disc">
                {importResult.errors.map((err, i) => (
                  <li key={i}>{typeof err === "string" ? err : JSON.stringify(err)}</li>
                ))}
              </ul>
            </div>
          )}
        </NeuCard>
      )}
    </div>
  );
}
