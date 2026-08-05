import { getLocationDatasetVersion, listProvinces, listWards } from "../services/location.service.js";

export const provinces = (_req, res) => res.json({
  success: true,
  datasetVersion: getLocationDatasetVersion(),
  provinces: listProvinces(),
});

export const wards = (req, res, next) => {
  try {
    return res.json({
      success: true,
      datasetVersion: getLocationDatasetVersion(),
      wards: listWards(req.params.provinceCode),
    });
  } catch (error) { next(error); }
};
