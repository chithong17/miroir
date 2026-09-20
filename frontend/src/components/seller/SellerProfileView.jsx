import React, { useState } from "react";
import {
  Store,
  Upload,
  QrCode,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import {
  NeuCard,
  NeuButton,
  NeuInput,
  NeuBadge,
} from "./NeuComponents.jsx";

export default function SellerProfileView({
  shop,
  shopForm,
  setShopForm,
  onSaveShop,
  onUploadQr,
  uploadNotice,
  isSaving = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setShopForm((prev) => ({ ...prev, [field]: value }));
  };

  const copyStoreLink = () => {
    if (!shop?.slug) return;
    const url = `${window.location.origin}/app/shops/${shop.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1F2A2A]">
          Hồ sơ Cửa hàng & Cài đặt thanh toán
        </h2>
        <p className="text-xs text-[#6E7D7C] mt-0.5">
          Quản lý thông tin định danh thương hiệu, thông tin liên hệ và tài khoản ngân hàng nhận thanh toán từ khách hàng
        </p>
      </div>

      {/* Store Link Card */}
      {shop?.slug && (
        <div className="neu-card p-4 sm:p-5 bg-gradient-to-r from-[#FFFFFF] via-[#F1F5E8] to-[#F9FAF4] border border-[#B3D07E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-[#6F8746] shrink-0">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1F2A2A] block">
                Đường dẫn gian hàng trực tuyến
              </span>
              <span className="text-xs text-[#6F8746] font-mono font-medium">
                {window.location.origin}/app/shops/{shop.slug}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <NeuButton
              variant="secondary"
              size="sm"
              onClick={copyStoreLink}
              icon={copied ? Check : Copy}
            >
              {copied ? "Đã sao chép" : "Sao chép link"}
            </NeuButton>
            <a
              href={`/app/shops/${shop.slug}`}
              target="_blank"
              rel="noreferrer"
              className="neu-icon-btn h-9 w-9 text-[#6F8746] hover:text-[#1F2A2A]"
              title="Mở gian hàng công khai"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Section 1: Basic Information */}
      <NeuCard>
        <div className="flex items-center gap-3 border-b border-[#E2EBD5] pb-4 mb-5">
          <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-[#6F8746]">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#1F2A2A]">
              Thông tin thương hiệu
            </h3>
            <p className="text-[11px] text-[#8C9B9A]">Hiển thị với người mua sắm trên MIROIR</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <NeuInput
            label="Tên cửa hàng *"
            value={shopForm.name || ""}
            onChange={handleFieldChange("name")}
            placeholder="Ví dụ: Maison de Miroir"
          />

          <NeuInput
            label="Đường dẫn định danh (Slug) *"
            value={shopForm.slug || ""}
            onChange={handleFieldChange("slug")}
            placeholder="maison-de-miroir"
            helper="Dùng để tạo liên kết truy cập gian hàng duy nhất"
          />

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6E7D7C]">
              Mô tả ngắn về cửa hàng
            </label>
            <textarea
              rows={3}
              value={shopForm.description || ""}
              onChange={handleFieldChange("description")}
              placeholder="Giới thiệu phong cách thiết kế, định vị thời trang của shop..."
              className="neu-input p-3.5 text-sm"
            />
          </div>

          <NeuInput
            label="Đường dẫn ảnh đại diện (Logo URL)"
            value={shopForm.logoUrl || ""}
            onChange={handleFieldChange("logoUrl")}
            placeholder="https://..."
          />

          <NeuInput
            label="Đường dẫn ảnh bìa (Cover Image URL)"
            value={shopForm.coverUrl || ""}
            onChange={handleFieldChange("coverUrl")}
            placeholder="https://..."
          />
        </div>
      </NeuCard>

      {/* Section 2: Contact Information */}
      <NeuCard>
        <div className="flex items-center gap-3 border-b border-[#E2EBD5] pb-4 mb-5">
          <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-[#6F8746]">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#1F2A2A]">
              Thông tin liên hệ & Địa chỉ kho
            </h3>
            <p className="text-[11px] text-[#8C9B9A]">Dùng để điều phối vận chuyển và CSKH</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <NeuInput
            label="Email liên hệ *"
            type="email"
            value={shopForm.contactEmail || ""}
            onChange={handleFieldChange("contactEmail")}
            placeholder="contact@shop.com"
            icon={Mail}
          />

          <NeuInput
            label="Số điện thoại CSKH *"
            value={shopForm.contactPhone || ""}
            onChange={handleFieldChange("contactPhone")}
            placeholder="0912 345 678"
            icon={Phone}
          />

          <div className="sm:col-span-2">
            <NeuInput
              label="Địa chỉ gửi hàng / kho hàng *"
              value={shopForm.contactAddress || ""}
              onChange={handleFieldChange("contactAddress")}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              icon={MapPin}
            />
          </div>
        </div>
      </NeuCard>

      {/* Section 3: Bank Transfer Settings */}
      <NeuCard>
        <div className="flex items-center justify-between border-b border-[#E2EBD5] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-[#6F8746]">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1F2A2A]">
                Nhận tiền chuyển khoản ngân hàng trực tiếp
              </h3>
              <p className="text-xs text-[#6E7D7C]">
                Khách hàng quét mã VietQR để thanh toán thẳng vào tài khoản của bạn
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(shopForm.bankTransferEnabled)}
              onChange={handleFieldChange("bankTransferEnabled")}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#E2EBD5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E2EBD5] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6F8746]" />
          </label>
        </div>

        {shopForm.bankTransferEnabled ? (
          <div className="grid gap-5 sm:grid-cols-2 animate-in fade-in duration-200">
            <NeuInput
              label="Tên ngân hàng *"
              value={shopForm.bankName || ""}
              onChange={handleFieldChange("bankName")}
              placeholder="Ví dụ: Vietcombank, Techcombank, MB..."
            />

            <NeuInput
              label="Số tài khoản nhận tiền *"
              value={shopForm.accountNumber || ""}
              onChange={handleFieldChange("accountNumber")}
              placeholder="0123456789"
            />

            <NeuInput
              label="Tên chủ tài khoản (Viết hoa không dấu) *"
              value={shopForm.accountHolder || ""}
              onChange={handleFieldChange("accountHolder")}
              placeholder="NGUYEN VAN A"
            />

            {/* QR Code Upload / Preview */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6E7D7C]">
                Mã VietQR nhận thanh toán
              </label>
              <div className="flex items-center gap-4">
                <label className="neu-btn-raised px-4 py-2.5 text-xs text-[#1F2A2A] cursor-pointer flex items-center gap-2 hover:text-[#6F8746]">
                  <Upload className="h-4 w-4 text-[#6F8746]" />
                  <span>Tải ảnh QR mới</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onUploadQr}
                    className="hidden"
                  />
                </label>
                {shopForm.qrImageUrl && (
                  <div className="h-10 w-10 rounded-xl overflow-hidden neu-inset p-0.5 border border-[#E2EBD5]">
                    <img src={shopForm.qrImageUrl} alt="QR code" className="h-full w-full object-cover rounded-lg" />
                  </div>
                )}
              </div>
              {uploadNotice && (
                <p className="text-xs text-[#6F8746] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {uploadNotice}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#8C9B9A] italic">
            Chức năng chuyển khoản ngân hàng đang tắt. Hãy bật công tắc phía trên để thiết lập tài khoản nhận tiền.
          </p>
        )}
      </NeuCard>

      {/* Save Button Bar */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#E2EBD5]">
        <NeuButton
          variant="primary"
          icon={Save}
          disabled={isSaving}
          onClick={onSaveShop}
          size="lg"
        >
          {isSaving ? "Đang lưu thay đổi..." : "Lưu hồ sơ cửa hàng"}
        </NeuButton>
      </div>
    </div>
  );
}
