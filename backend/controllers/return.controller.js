import { uploadImageBuffer } from "../services/cloudinary.service.js";
import { adminDecideReturn, createReturnRequest, decideReturn, escalateReturn, getCustomerReturn, getShopReturn, listCustomerReturns, listShopReturns, receiveReturn, refundReturn, submitReturnShipment } from "../services/return.service.js";

const attachments = async (files = []) => Promise.all(files.map(async (file) => { const result = await uploadImageBuffer(file.buffer, file.originalname); return { imageUrl: result.secure_url, publicId: result.public_id }; }));
const parseItems = (value) => { try { return typeof value === "string" ? JSON.parse(value) : value; } catch { const error = new Error("items must be valid JSON."); error.statusCode = 400; throw error; } };
const proof = async (files) => attachments(files);

export const createMyReturn = async (req, res, next) => { try { res.status(201).json({ success: true, return: await createReturnRequest({ userId: req.user.id, orderId: req.params.orderId, items: parseItems(req.body.items), reason: req.body.reason, reasonCode: req.body.reasonCode, refundAccount: req.body, attachments: await attachments(req.files) }) }); } catch (error) { next(error); } };
export const myReturns = async (req, res, next) => { try { res.json({ success: true, returns: await listCustomerReturns(req.user.id) }); } catch (error) { next(error); } };
export const myReturn = async (req, res, next) => { try { res.json({ success: true, return: await getCustomerReturn({ userId: req.user.id, returnId: req.params.returnId }) }); } catch (error) { next(error); } };
export const submitMyReturnShipment = async (req, res, next) => { try { res.json({ success: true, return: await submitReturnShipment({ userId: req.user.id, returnId: req.params.returnId, trackingCode: req.body.trackingCode, attachments: await proof(req.files) }) }); } catch (error) { next(error); } };
export const escalateMyReturn = async (req, res, next) => { try { res.status(201).json({ success: true, dispute: await escalateReturn({ userId: req.user.id, returnId: req.params.returnId, message: req.body.message }) }); } catch (error) { next(error); } };

export const shopReturns = async (req, res, next) => { try { res.json({ success: true, returns: await listShopReturns({ ownerId: req.owner.id, query: req.query }) }); } catch (error) { next(error); } };
export const shopReturn = async (req, res, next) => { try { res.json({ success: true, return: await getShopReturn({ ownerId: req.owner.id, returnId: req.params.returnId }) }); } catch (error) { next(error); } };
export const decideShopReturn = async (req, res, next) => { try { res.json({ success: true, return: await decideReturn({ ownerId: req.owner.id, returnId: req.params.returnId, approved: req.body.approved === true, reason: req.body.reason, instructions: req.body.instructions }) }); } catch (error) { next(error); } };
export const receiveShopReturn = async (req, res, next) => { try { res.json({ success: true, return: await receiveReturn({ ownerId: req.owner.id, returnId: req.params.returnId }) }); } catch (error) { next(error); } };
export const refundShopReturn = async (req, res, next) => { try { const result = await attachments(req.files); res.json({ success: true, return: await refundReturn({ ownerId: req.owner.id, returnId: req.params.returnId, note: req.body.note, proof: result[0] || null }) }); } catch (error) { next(error); } };

export const decideAdminReturn = async (req, res, next) => { try { res.json({ success: true, return: await adminDecideReturn({ adminId: req.admin.id, returnId: req.params.returnId, approved: req.body.approved === true, reason: req.body.reason, instructions: req.body.instructions }) }); } catch (error) { next(error); } };
