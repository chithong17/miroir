import { Router } from "express";
import {
  createPayment,
  paymentPlans,
  paymentMe,
  paymentStatus,
  payosWebhook,
} from "../controllers/payment.controller.js";
import { requirePaymentAccount } from "../middlewares/paymentAuth.middleware.js";

const router = Router();

router.get("/plans", paymentPlans);
router.post("/create", requirePaymentAccount, createPayment);
router.post("/payos-webhook", payosWebhook);
router.get("/status/:orderCode", paymentStatus);
router.get("/me", requirePaymentAccount, paymentMe);

export default router;
