import { uploadImageBuffer } from "../services/cloudinary.service.js";
import {
  addCartItem, checkoutCart, customerCancelOrder, decideCancellation, getCart,
  getCustomerOrder, getShopOrder, listCustomerOrders, listShopOrders,
  previewBuyNow, removeCartItem, reportTransfer, selectCartAddress, updateCartItem,
  updateShopOrderStatus, updateShopPayment,
} from "../services/commerce.service.js";

const proofFromFile = async (file) => {
  if (!file) return null;
  const result = await uploadImageBuffer(file.buffer, file.originalname);
  return { imageUrl: result.secure_url, publicId: result.public_id };
};

export const myCart = async (req, res, next) => { try { res.json({ success: true, cart: await getCart(req.user.id) }); } catch (e) { next(e); } };
export const addToMyCart = async (req, res, next) => { try { res.status(201).json({ success: true, cart: await addCartItem({ userId: req.user.id, ...req.body }) }); } catch (e) { next(e); } };
export const updateMyCartItem = async (req, res, next) => { try { res.json({ success: true, cart: await updateCartItem({ userId: req.user.id, productId: req.params.productId, variantId: req.params.variantId, quantity: req.body.quantity }) }); } catch (e) { next(e); } };
export const removeMyCartItem = async (req, res, next) => { try { res.json({ success: true, cart: await removeCartItem({ userId: req.user.id, productId: req.params.productId, variantId: req.params.variantId }) }); } catch (e) { next(e); } };
export const setMyCartAddress = async (req, res, next) => { try { res.json({ success: true, cart: await selectCartAddress({ userId: req.user.id, addressId: req.body.addressId }) }); } catch (e) { next(e); } };
export const previewMyBuyNow = async (req, res, next) => { try { res.json({ success: true, cart: await previewBuyNow({ userId: req.user.id, items: req.body.items }) }); } catch (e) { next(e); } };
export const checkout = async (req, res, next) => { try { res.status(201).json({ success: true, orders: await checkoutCart({ userId: req.user.id, body: req.body }) }); } catch (e) { next(e); } };
export const myOrders = async (req, res, next) => { try { res.json({ success: true, orders: await listCustomerOrders({ userId: req.user.id, query: req.query }) }); } catch (e) { next(e); } };
export const myOrder = async (req, res, next) => { try { res.json({ success: true, order: await getCustomerOrder({ userId: req.user.id, orderId: req.params.orderId }) }); } catch (e) { next(e); } };
export const reportMyTransfer = async (req, res, next) => { try { res.json({ success: true, order: await reportTransfer({ userId: req.user.id, orderId: req.params.orderId, proof: await proofFromFile(req.file) }) }); } catch (e) { next(e); } };
export const cancelMyOrder = async (req, res, next) => { try { res.json({ success: true, order: await customerCancelOrder({ userId: req.user.id, orderId: req.params.orderId, reason: req.body.reason }) }); } catch (e) { next(e); } };

export const shopOrders = async (req, res, next) => { try { res.json({ success: true, orders: await listShopOrders({ ownerId: req.owner.id, query: req.query }) }); } catch (e) { next(e); } };
export const shopOrder = async (req, res, next) => { try { res.json({ success: true, order: await getShopOrder({ ownerId: req.owner.id, orderId: req.params.orderId }) }); } catch (e) { next(e); } };
export const changeShopOrderStatus = async (req, res, next) => { try { res.json({ success: true, order: await updateShopOrderStatus({ ownerId: req.owner.id, orderId: req.params.orderId, status: req.body.status, reason: req.body.reason }) }); } catch (e) { next(e); } };
export const resolveShopCancellation = async (req, res, next) => { try { res.json({ success: true, order: await decideCancellation({ ownerId: req.owner.id, orderId: req.params.orderId, approved: req.body.approved === true, reason: req.body.reason }) }); } catch (e) { next(e); } };
export const changeShopPayment = async (req, res, next) => { try { res.json({ success: true, order: await updateShopPayment({ ownerId: req.owner.id, orderId: req.params.orderId, action: req.body.action, reason: req.body.reason, proof: await proofFromFile(req.file) }) }); } catch (e) { next(e); } };
