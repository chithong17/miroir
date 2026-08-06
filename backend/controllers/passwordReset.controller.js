import { confirmPasswordReset, requestPasswordReset, verifyPasswordResetOtp } from "../services/passwordReset.service.js";
export const request = async (req, res, next) => { try { res.json({ success: true, ...(await requestPasswordReset(req.body)) }); } catch (error) { next(error); } };
export const verify = async (req, res, next) => { try { res.json({ success: true, ...(await verifyPasswordResetOtp(req.body)) }); } catch (error) { next(error); } };
export const confirm = async (req, res, next) => { try { res.json({ success: true, ...(await confirmPasswordReset(req.body)) }); } catch (error) { next(error); } };
