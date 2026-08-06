import { Router } from "express";
import { chatHandlers } from "../controllers/chat.controller.js";
import { requireShopOwner } from "../middlewares/shopAuth.middleware.js";
import { chatRateLimit } from "../middlewares/chatRateLimit.middleware.js";
import { uploadChatImages } from "../middlewares/upload.middleware.js";

const router = Router();
const handlers = chatHandlers("shop");
router.use(requireShopOwner);
router.get("/conversations", handlers.list);
router.post("/conversations", chatRateLimit({ limit: 10, windowMs: 60_000, scope: "shop-chat-open" }), handlers.open);
router.get("/conversations/:id/messages", handlers.messages);
router.post("/conversations/:id/messages", chatRateLimit({ limit: 30, windowMs: 60_000, scope: "shop-chat-send" }), uploadChatImages, handlers.send);
router.patch("/conversations/:id/read", handlers.read);
export default router;
