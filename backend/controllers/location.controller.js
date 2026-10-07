import { getLocationDatasetVersion, listProvinces, listDistricts, listWards } from "../services/location.service.js";

export const provinces = (_req, res) => res.json({
  success: true,
  datasetVersion: getLocationDatasetVersion(),
  provinces: listProvinces(),
});

export const districts = (req, res, next) => {
  try {
    return res.json({
      success: true,
      datasetVersion: getLocationDatasetVersion(),
      districts: listDistricts(req.params.provinceCode),
    });
  } catch (error) { next(error); }
};

export const wards = (req, res, next) => {
  try {
    return res.json({
      success: true,
      datasetVersion: getLocationDatasetVersion(),
      wards: listWards(req.params.districtCode),
    });
  } catch (error) { next(error); }
};
