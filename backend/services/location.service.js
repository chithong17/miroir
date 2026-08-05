import { readFileSync } from "node:fs";

const dataset = JSON.parse(
  readFileSync(new URL("../data/vn-admin-units.json", import.meta.url), "utf8")
);
const provinceByCode = new Map(dataset.provinces.map((item) => [item.code, item]));

export const getLocationDatasetVersion = () => dataset.datasetVersion;

export const listProvinces = () => dataset.provinces.map(({ code, name }) => ({ code, name }));

export const listWards = (provinceCode) => {
  const province = provinceByCode.get(String(provinceCode || ""));
  if (!province) {
    const error = new Error("Province was not found in the current location dataset.");
    error.statusCode = 404;
    throw error;
  }
  return province.wards;
};

export const resolveLocation = ({ provinceCode, wardCode }) => {
  const province = provinceByCode.get(String(provinceCode || ""));
  const ward = province?.wards.find((item) => item.code === String(wardCode || ""));
  if (!province || !ward) {
    const error = new Error("Province or ward is invalid for the current location dataset.");
    error.statusCode = 400;
    throw error;
  }
  return {
    provinceCode: province.code,
    provinceName: province.name,
    wardCode: ward.code,
    wardName: ward.name,
    datasetVersion: dataset.datasetVersion,
  };
};
