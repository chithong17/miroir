import AddressLocationFields from "../AddressLocationFields.jsx";
import { TextField } from "../ui/index.jsx";

export default function PickupAddressFields({ value, onChange }) {
  const form = value || { addressVersion: "v2", provinceCode: "", wardCode: "", carrierLegacyWardCode: "", address_detail: "", phone: "", contact_name: "" };
  return <div className="rounded-xl border border-line bg-canvas p-4">
    <h3 className="font-bold">Địa chỉ lấy hàng sau sáp nhập</h3>
    <p className="mt-2 text-xs leading-5 text-muted">Chọn lại địa chỉ lấy hàng và khu vực cũ tương ứng để báo phí, tạo vận đơn chính xác. Không dùng địa chỉ mặc định ở tỉnh khác.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <AddressLocationFields form={form} requireCarrier setForm={(update) => onChange(typeof update === "function" ? update(form) : update)} />
      <TextField label="Địa chỉ lấy hàng chi tiết" required value={form.address_detail || ""} onChange={(event) => onChange({ ...form, addressVersion: "v2", address_detail: event.target.value })} />
      <TextField label="Điện thoại lấy hàng" required value={form.phone || ""} onChange={(event) => onChange({ ...form, phone: event.target.value })} />
      <TextField label="Người liên hệ lấy hàng" value={form.contact_name || ""} onChange={(event) => onChange({ ...form, contact_name: event.target.value })} />
    </div>
  </div>;
}
