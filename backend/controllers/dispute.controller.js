import { uploadImageBuffer } from "../services/cloudinary.service.js";
import { adminUpdateDispute, createRefundDispute, getDispute, listAdminDisputes, listCustomerDisputes, listOwnerDisputes, replyDispute } from "../services/dispute.service.js";

const attachments = async (files = []) => Promise.all(files.map(async (file) => {
  const result = await uploadImageBuffer(file.buffer, file.originalname);
  return { imageUrl: result.secure_url, publicId: result.public_id };
}));

export const createMyDispute = async (req, res, next) => { try { res.status(201).json({ success: true, dispute: await createRefundDispute({ userId: req.user.id, orderId: req.params.orderId, message: req.body.message, attachments: await attachments(req.files) }) }); } catch (e) { next(e); } };
export const myDisputes = async (req, res, next) => { try { res.json({ success: true, disputes: await listCustomerDisputes(req.user.id) }); } catch (e) { next(e); } };
export const myDispute = async (req, res, next) => { try { res.json({ success: true, dispute: await getDispute({ disputeId: req.params.disputeId, actorType: "customer", actorId: req.user.id }) }); } catch (e) { next(e); } };
export const replyMyDispute = async (req, res, next) => { try { res.json({ success: true, dispute: await replyDispute({ disputeId: req.params.disputeId, actorType: "customer", actorId: req.user.id, message: req.body.message, attachments: await attachments(req.files) }) }); } catch (e) { next(e); } };
export const ownerDisputes = async (req, res, next) => { try { res.json({ success: true, disputes: await listOwnerDisputes(req.owner.id) }); } catch (e) { next(e); } };
export const ownerDispute = async (req, res, next) => { try { res.json({ success: true, dispute: await getDispute({ disputeId: req.params.disputeId, actorType: "shop", actorId: req.owner.id }) }); } catch (e) { next(e); } };
export const replyOwnerDispute = async (req, res, next) => { try { res.json({ success: true, dispute: await replyDispute({ disputeId: req.params.disputeId, actorType: "shop", actorId: req.owner.id, message: req.body.message, attachments: await attachments(req.files) }) }); } catch (e) { next(e); } };
export const adminDisputes = async (req, res, next) => { try { res.json({ success: true, disputes: await listAdminDisputes(req.query) }); } catch (e) { next(e); } };
export const adminDispute = async (req, res, next) => { try { res.json({ success: true, dispute: await getDispute({ disputeId: req.params.disputeId, actorType: "admin", actorId: req.admin.id }) }); } catch (e) { next(e); } };
export const updateAdminDispute = async (req, res, next) => { try { res.json({ success: true, dispute: await adminUpdateDispute({ adminId: req.admin.id, disputeId: req.params.disputeId, status: req.body.status, resolution: req.body.resolution, message: req.body.message, attachments: await attachments(req.files) }) }); } catch (e) { next(e); } };
