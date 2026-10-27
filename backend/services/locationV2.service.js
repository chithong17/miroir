import { readFileSync } from "node:fs";
import { resolveLocation as resolveLegacy } from "./location.service.js";

const load = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const dataset = load("vn-admin-units-v2.json");
const legacy = load("vn-admin-units.json");
const conversion = load("vn-ward-conversion.json");
const code = (value) => String(value ?? "").replace(/^0+(?=\d)/, "");
const fail = (message) => { const error = new Error(message); error.statusCode = 400; throw error; };
export const locationV2Version = dataset.datasetVersion;
export const listV2Provinces = () => dataset.provinces.map(({ code, name }) => ({ code, name }));
export const listV2Wards = (provinceCode) => {
  const province = dataset.provinces.find((item) => item.code === code(provinceCode));
  if (!province) fail("Tỉnh/thành không có trong danh mục sau sáp nhập.");
  return province.wards;
};
const legacyByWard = new Map();
for (const province of legacy.provinces) for (const district of province.districts) for (const ward of district.wards) {
  legacyByWard.set(code(ward.code), {
    provinceCode: province.code, provinceName: province.name,
    districtCode: district.code, districtName: district.name, wardCode: ward.code, wardName: ward.name,
  });
}
const deliveryAreas = new Map();
for (const [oldCode, row] of Object.entries(conversion.wards)) {
  const old = legacyByWard.get(oldCode);
  if (!old) continue; // Unmatched legacy codes are never guessed by name.
  for (const target of row.targets) {
    const key = `${code(target.provinceCode)}:${code(target.wardCode)}`;
    if (!deliveryAreas.has(key)) deliveryAreas.set(key, []);
    deliveryAreas.get(key).push({ ...old, label: `${old.wardName}, ${old.districtName}, ${old.provinceName}` });
  }
}
export const resolveV2Location = ({ provinceCode, wardCode, carrierLegacyWardCode }) => {
  const province = dataset.provinces.find((item) => item.code === code(provinceCode));
  const ward = province?.wards.find((item) => item.code === code(wardCode));
  if (!province || !ward) fail("Tỉnh/thành và phường/xã sau sáp nhập không hợp lệ.");
  const candidates = getLegacyDeliveryAreas(province.code, ward.code);
  const selected = carrierLegacyWardCode
    ? candidates.find((item) => code(item.wardCode) === code(carrierLegacyWardCode))
    : candidates.length === 1 ? candidates[0] : null;
  if (carrierLegacyWardCode && !selected) fail("Khu vực giao hàng cũ không thuộc phường/xã đã chọn.");
  return {
    addressVersion: "v2", datasetVersion: dataset.datasetVersion,
    provinceCode: province.code, provinceName: province.name,
    wardCode: ward.code, wardName: ward.name, districtCode: "", districtName: "",
    carrierLegacyWardCode: selected?.wardCode || "",
    carrierAddress: selected || null,
  };
};
export const getLegacyDeliveryAreas = (provinceCode, wardCode) => {
  const result = [...(deliveryAreas.get(`${code(provinceCode)}:${code(wardCode)}`) || [])];
  return result.sort((a, b) => a.label.localeCompare(b.label, "vi"));
};

// Only whole-ward, single-target conversions are automatic. Split wards require
// confirmation even when a code/name happens to be reused by a new ward.
export const migrateAddressView = (address) => {
  if (address.addressVersion === "v2") return address;
  const row = conversion.wards[code(address.wardCode)];
  let validLegacy;
  try { validLegacy = resolveLegacy(address); } catch { /* Invalid old codes must be confirmed. */ }
  if (!row || !validLegacy || row.partlyMerged || row.targets.length !== 1 ||
      code(row.provinceCode) !== code(address.provinceCode) || code(row.districtCode) !== code(address.districtCode)) {
    return { ...address, requiresAddressConfirmation: true };
  }
  try {
    const next = resolveV2Location({ ...row.targets[0], carrierLegacyWardCode: address.wardCode });
    return {
      ...address, ...next, requiresAddressConfirmation: false,
      legacyAddress: address.legacyAddress || { ...validLegacy, fullAddress: address.fullAddress },
      fullAddress: [address.addressLine, next.wardName, next.provinceName].filter(Boolean).join(", "),
    };
  } catch { return { ...address, requiresAddressConfirmation: true }; }
};

export const normalizeCarrierAddress = (address) => {
  if (address.addressVersion !== "v2") {
    if (!address.provinceName || !address.districtName || !address.wardName) fail("Vui lòng xác nhận đầy đủ khu vực giao hàng.");
    return address;
  }
  const normalized = resolveV2Location(address);
  if (!normalized.carrierAddress) {
    const error = new Error("Vui lòng xác nhận khu vực giao hàng để hãng vận chuyển tính đúng phí.");
    error.statusCode = 400;
    error.code = "DELIVERY_AREA_REQUIRED";
    throw error;
  }
  return { ...address, ...normalized.carrierAddress, addressVersion: "legacy", administrativeAddress: normalized };
};
