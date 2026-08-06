import {
  listConversations, listMessages, markConversationRead, openConversation, sendMessage,
} from "../services/chat.service.js";
import { getMongoDb } from "../services/mongo.service.js";

const actorFrom = (req, type) => type === "user"
  ? { type, id: req.user.id }
  : { type, id: req.owner.id, shopId: null };

const withOwnerShop = async (req, type, work) => {
  const actor = actorFrom(req, type);
  if (type === "shop") {
    const db = await getMongoDb();
    const shop = await db.collection("shops").findOne({ ownerId: actor.id });
    actor.shopId = shop?.id || "__missing_shop__";
  }
  return work(actor);
};

export const chatHandlers = (type) => ({
  list: async (req, res, next) => {
    try {
      const result = await withOwnerShop(req, type, (actor) => listConversations({ actor, query: req.query }));
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },
  open: async (req, res, next) => {
    try {
      const conversation = await withOwnerShop(req, type, (actor) => openConversation({ actor, body: req.body }));
      res.status(201).json({ success: true, conversation });
    } catch (error) { next(error); }
  },
  messages: async (req, res, next) => {
    try {
      const result = await withOwnerShop(req, type, (actor) => listMessages({ actor, conversationId: req.params.id, query: req.query }));
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },
  send: async (req, res, next) => {
    try {
      const result = await withOwnerShop(req, type, (actor) => sendMessage({ actor, conversationId: req.params.id, body: req.body, files: req.files || [] }));
      res.status(result.duplicate ? 200 : 201).json({ success: true, ...result });
    } catch (error) { next(error); }
  },
  read: async (req, res, next) => {
    try {
      const conversation = await withOwnerShop(req, type, (actor) => markConversationRead({ actor, conversationId: req.params.id }));
      res.json({ success: true, conversation });
    } catch (error) { next(error); }
  },
});
