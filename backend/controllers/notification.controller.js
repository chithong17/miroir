import { listNotifications, markNotificationRead } from "../services/notification.service.js";

export const userNotifications = async (req, res, next) => { try { res.json({ success: true, ...(await listNotifications({ audienceType: "customer", audienceId: req.user.id, limit: req.query.limit })) }); } catch (e) { next(e); } };
export const readUserNotification = async (req, res, next) => { try { res.json({ success: true, notification: await markNotificationRead({ audienceType: "customer", audienceId: req.user.id, notificationId: req.params.id }) }); } catch (e) { next(e); } };
export const shopNotifications = async (req, res, next) => { try { res.json({ success: true, ...(await listNotifications({ audienceType: "shop", audienceId: req.owner.id, limit: req.query.limit })) }); } catch (e) { next(e); } };
export const readShopNotification = async (req, res, next) => { try { res.json({ success: true, notification: await markNotificationRead({ audienceType: "shop", audienceId: req.owner.id, notificationId: req.params.id }) }); } catch (e) { next(e); } };
export const adminNotifications = async (req, res, next) => { try { res.json({ success: true, ...(await listNotifications({ audienceType: "admin", audienceId: null, limit: req.query.limit })) }); } catch (e) { next(e); } };
export const readAdminNotification = async (req, res, next) => { try { res.json({ success: true, notification: await markNotificationRead({ audienceType: "admin", audienceId: null, notificationId: req.params.id }) }); } catch (e) { next(e); } };
