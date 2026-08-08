import { createFitFeedback, recommendFit, trackFitEvent } from "../services/fit.service.js";

export const getFitRecommendation = async (req, res, next) => { try { const recommendation = await recommendFit({ userId: req.user.id, productId: req.body.productId, profileOverride: req.body.profileOverride || {}, fitPreference: req.body.fitPreference }); res.json({ success: true, recommendation }); } catch (error) { next(error); } };
export const createFitEvent = async (req, res, next) => { try { res.status(201).json({ success: true, event: await trackFitEvent({ userId: req.user.id, body: req.body || {} }) }); } catch (error) { next(error); } };
export const submitFitFeedback = async (req, res, next) => { try { res.status(201).json({ success: true, feedback: await createFitFeedback({ userId: req.user.id, orderId: req.params.orderId, item: req.body || {}, outcome: req.body.outcome }) }); } catch (error) { next(error); } };
