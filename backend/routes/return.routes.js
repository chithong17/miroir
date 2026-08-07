import { Router } from "express";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import { uploadOrderAttachments } from "../middlewares/upload.middleware.js";
import { createMyReturn, escalateMyReturn, myReturn, myReturns, submitMyReturnShipment } from "../controllers/return.controller.js";

const router = Router();
router.use(requireUser);
router.get("/me", myReturns);
router.get("/me/:returnId", myReturn);
router.post("/me/:orderId", uploadOrderAttachments, createMyReturn);
router.post("/:returnId/shipment", uploadOrderAttachments, submitMyReturnShipment);
router.post("/:returnId/disputes", escalateMyReturn);
export default router;
