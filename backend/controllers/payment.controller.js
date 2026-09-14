import {
  createPaymentLink,
  getCheckoutPlanForAccountType,
  getPaymentProfile,
  getPaymentStatus,
  handlePayOsWebhook,
} from "../services/payment.service.js";
import { listPaymentPlans } from "../services/subscription.service.js";
import { getPaymentPlan } from "../services/subscription.service.js";
import { listOwnerInvoices, quotePlanChange } from "../services/billing.service.js";
import { ensureLegacyCycle } from "../services/billing.service.js";
import { grantShopPlan } from "../services/planGrant.service.js";

export const paymentPlans = async (_req, res, next) => {
  try {
    const plans = await listPaymentPlans();
    return res.json({ success: true, plans });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const account = await ensureLegacyCycle(req.paymentAccount);
    const planCode = req.body?.planCode || getCheckoutPlanForAccountType(account.accountType);
    const result = await createPaymentLink({
      account,
      planCode,
      invoiceId: req.body?.invoiceId || null,
    });

    return res.status(201).json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      order: result.order,
    });
  } catch (error) {
    next(error);
  }
};

export const claimTrial = async (req, res, next) => {
  try {
    const grant = await grantShopPlan({ ownerId: req.paymentAccount.id, planCode: req.body?.planCode, grantType: "trial" });
    return res.status(201).json({ success: true, grant });
  } catch (error) { next(error); }
};

export const planQuote = async (req, res, next) => {
  try {
    const plan = await getPaymentPlan(req.params.planCode);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found." });
    return res.json({ success: true, quote: await quotePlanChange({ owner: await ensureLegacyCycle(req.paymentAccount), plan }) });
  } catch (error) { next(error); }
};

export const paymentInvoices = async (req, res, next) => {
  try { res.json({ success: true, invoices: await listOwnerInvoices(req.paymentAccount.id) }); }
  catch (error) { next(error); }
};

export const payosWebhook = async (req, res, next) => {
  try {
    const result = await handlePayOsWebhook(req.body || {});

    return res.json({
      success: true,
      message: "Webhook delivered.",
      alreadyProcessed: result.alreadyProcessed,
      data: result.webhookData,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentStatus = async (req, res, next) => {
  try {
    const order = await getPaymentStatus(req.params.orderCode);
    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentMe = async (req, res, next) => {
  try {
    const subscription = await getPaymentProfile(req.paymentAccount);
    return res.json({
      success: true,
      accountType: req.paymentAccount.accountType,
      subscription,
    });
  } catch (error) {
    next(error);
  }
};
