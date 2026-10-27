import { Router } from "express";
import { provinces, districts, wards } from "../controllers/location.controller.js";
import { listV2Provinces, listV2Wards, getLegacyDeliveryAreas, locationV2Version } from "../services/locationV2.service.js";
const router = Router();
router.get("/v2/provinces", (_req, res) => res.json({ success: true, datasetVersion: locationV2Version, provinces: listV2Provinces() }));
router.get("/v2/provinces/:provinceCode/wards", (req, res, next) => {
  try { res.json({ success: true, datasetVersion: locationV2Version, wards: listV2Wards(req.params.provinceCode) }); }
  catch (error) { next(error); }
});
router.get("/v2/provinces/:provinceCode/wards/:wardCode/delivery-areas", (req, res, next) => {
  try { res.json({ success: true, areas: getLegacyDeliveryAreas(req.params.provinceCode, req.params.wardCode) }); }
  catch (error) { next(error); }
});
router.get("/provinces", provinces);
router.get("/provinces/:provinceCode/districts", districts);
router.get("/districts/:districtCode/wards", wards);
export default router;
