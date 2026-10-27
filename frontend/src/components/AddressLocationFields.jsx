import { useEffect, useState } from "react";
import { listV2Provinces, listV2Wards, listDeliveryAreas } from "../api/commerceApi.js";
import { SelectField } from "./ui/index.jsx";

export function DeliveryAreaField({ provinceCode, wardCode, value = "", onChange, required = false }) {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setAreas([]); setError("");
    if (!provinceCode || !wardCode) return;
    setLoading(true);
    listDeliveryAreas(provinceCode, wardCode).then((result) => {
      if (!cancelled) setAreas(result.areas || []);
    }).catch(() => { if (!cancelled) setError("Không tải được khu vực đối chiếu vận chuyển."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [provinceCode, wardCode, retry]);
  if (!provinceCode || !wardCode) return null;
  return <div className="sm:col-span-2">
    {loading ? <p role="status" className="text-xs text-muted">Đang tải khu vực giao hàng…</p> : error ? <p role="alert" className="text-sm text-red-600">{error} <button type="button" onClick={() => setRetry((value) => value + 1)} className="underline">Thử lại</button></p> : areas.length > 1 ? <>
      <SelectField label="Xác nhận khu vực giao hàng" value={value} required={required} onChange={(event) => onChange(event.target.value)}>
        <option value="">Chọn khu vực tương ứng với nơi nhận hàng</option>
        {areas.map((area) => <option key={area.wardCode} value={area.wardCode}>{area.label}</option>)}
      </SelectField>
      <p className="mt-2 text-xs leading-5 text-muted">Hãng vận chuyển cần xác nhận thêm khu vực để tính đúng phí giao hàng.</p>
    </> : !areas.length && <p className="text-xs text-muted">Hãng vận chuyển chưa xác định được tuyến giao hàng tại khu vực này.</p>}
  </div>;
}

export default function AddressLocationFields({ form, setForm, requireCarrier = false }) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    listV2Provinces().then((result) => { if (!cancelled) setProvinces(result.provinces || []); })
      .catch(() => { if (!cancelled) setError("Không tải được danh mục tỉnh/thành."); });
    return () => { cancelled = true; };
  }, [retry]);
  useEffect(() => {
    let cancelled = false;
    setWards([]); setError("");
    if (!form.provinceCode) return;
    setLoading(true);
    listV2Wards(form.provinceCode).then((result) => { if (!cancelled) setWards(result.wards || []); })
      .catch(() => { if (!cancelled) setError("Không tải được danh mục phường/xã."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [form.provinceCode, retry]);
  const change = (field, value) => setForm((current) => ({
    ...current, addressVersion: "v2", [field]: value, carrierLegacyWardCode: "",
    ...(field === "provinceCode" ? { wardCode: "", provinceName: provinces.find((item) => item.code === value)?.name || "", wardName: "" } : { wardName: wards.find((item) => item.code === value)?.name || "" }),
    districtCode: "", districtName: "",
  }));
  return <>
    <SelectField label="Tỉnh/Thành phố" required value={form.provinceCode || ""} onChange={(event) => change("provinceCode", event.target.value)}>
      <option value="">Chọn tỉnh/thành phố</option>
      {provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
    </SelectField>
    <SelectField label="Phường/Xã" required disabled={!form.provinceCode || loading} value={form.wardCode || ""} onChange={(event) => change("wardCode", event.target.value)}>
      <option value="">{loading ? "Đang tải…" : "Chọn phường/xã"}</option>
      {wards.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
    </SelectField>
    {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error} <button type="button" onClick={() => setRetry((value) => value + 1)} className="underline">Thử lại</button></p>}
    {requireCarrier && <DeliveryAreaField provinceCode={form.provinceCode} wardCode={form.wardCode} value={form.carrierLegacyWardCode} required onChange={(value) => setForm((current) => ({ ...current, carrierLegacyWardCode: value }))} />}
  </>;
}
