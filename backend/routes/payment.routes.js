import { Router } from "express";
import {
  createPayment,
  claimTrial,
  paymentPlans,
  paymentMe,
  paymentStatus,
  payosWebhook,
  planQuote,
  paymentInvoices,
} from "../controllers/payment.controller.js";
import { requirePaymentAccount } from "../middlewares/paymentAuth.middleware.js";

const router = Router();

router.get("/plans", paymentPlans);
router.get("/quote/:planCode", requirePaymentAccount, planQuote);
router.get("/invoices", requirePaymentAccount, paymentInvoices);
router.post("/create", requirePaymentAccount, createPayment);
router.post("/trial", requirePaymentAccount, claimTrial);
router.post("/payos-webhook", payosWebhook);
router.get("/status/:orderCode", paymentStatus);
router.get("/me", requirePaymentAccount, paymentMe);

export default router;
