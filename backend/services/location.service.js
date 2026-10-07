import { readFileSync } from "node:fs";

const dataset = JSON.parse(
  readFileSync(new URL("../data/vn-admin-units.json", import.meta.url), "utf8")
);
const provinceByCode = new Map(dataset.provinces.map((item) => [item.code, item]));

export const getLocationDatasetVersion = () => dataset.datasetVersion;

export const listProvinces = () => dataset.provinces.map(({ code, name }) => ({ code, name }));

const normalizeCode = (code) => String(code || "").replace(/^0+/, "");

export const listDistricts = (provinceCode) => {
  const normProv = normalizeCode(provinceCode);
  const province = dataset.provinces.find(p => normalizeCode(p.code) === normProv);
  if (!province) {
    const error = new Error("Province was not found in the current location dataset.");
    error.statusCode = 404;
    throw error;
  }
  return province.districts.map(({ code, name }) => ({ code, name }));
};

export const listWards = (districtCode) => {
  const normDist = normalizeCode(districtCode);
  let foundDistrict = null;
  for (const province of dataset.provinces) {
    foundDistrict = province.districts.find(d => normalizeCode(d.code) === normDist);
    if (foundDistrict) break;
  }

  if (!foundDistrict) {
    const error = new Error("District was not found in the current location dataset.");
    error.statusCode = 404;
    throw error;
  }
  return foundDistrict.wards.map(({ code, name }) => ({ code, name }));
};

export const resolveLocation = ({ provinceCode, districtCode, wardCode }) => {
  const normProv = normalizeCode(provinceCode);
  const normDist = normalizeCode(districtCode);
  const normWard = normalizeCode(wardCode);

  const province = dataset.provinces.find((item) => normalizeCode(item.code) === normProv);
  const district = province?.districts.find((item) => normalizeCode(item.code) === normDist);
  const ward = district?.wards.find((item) => normalizeCode(item.code) === normWard);
  
  if (!province || !district || !ward) {
    const error = new Error("Province, district or ward is invalid for the current location dataset.");
    error.statusCode = 400;
    throw error;
  }
  
  return {
    provinceCode: province.code,
    provinceName: province.name,
    districtCode: district.code,
    districtName: district.name,
    wardCode: ward.code,
    wardName: ward.name,
    datasetVersion: dataset.datasetVersion,
  };
};
