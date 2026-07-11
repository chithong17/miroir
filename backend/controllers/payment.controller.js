import {
  createPaymentLink,
  getCheckoutPlanForAccountType,
  getPaymentProfile,
  getPaymentStatus,
  handlePayOsWebhook,
} from "../services/payment.service.js";
import { listPaymentPlans } from "../services/subscription.service.js";

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
    const account = req.paymentAccount;
    const planCode = req.body?.planCode || getCheckoutPlanForAccountType(account.accountType);
    const result = await createPaymentLink({
      account,
      planCode,
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
