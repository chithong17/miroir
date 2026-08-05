import { createAddress, deleteAddress, listAddresses, setDefaultAddress, updateAddress } from "../services/address.service.js";

export const getMyAddresses = async (req, res, next) => { try { res.json({ success: true, addresses: await listAddresses(req.user.id) }); } catch (e) { next(e); } };
export const createMyAddress = async (req, res, next) => { try { res.status(201).json({ success: true, address: await createAddress({ userId: req.user.id, body: req.body }) }); } catch (e) { next(e); } };
export const updateMyAddress = async (req, res, next) => { try { res.json({ success: true, address: await updateAddress({ userId: req.user.id, addressId: req.params.addressId, body: req.body }) }); } catch (e) { next(e); } };
export const defaultMyAddress = async (req, res, next) => { try { res.json({ success: true, address: await setDefaultAddress({ userId: req.user.id, addressId: req.params.addressId }) }); } catch (e) { next(e); } };
export const removeMyAddress = async (req, res, next) => { try { res.json({ success: true, address: await deleteAddress({ userId: req.user.id, addressId: req.params.addressId }) }); } catch (e) { next(e); } };
