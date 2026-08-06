import assert from "node:assert/strict";
import test from "node:test";
import { toConversationDto, validateChatMessageInput } from "../services/chat.service.js";

test("chat message validation accepts text, image-only, and context-only payloads", () => {
  assert.deepEqual(validateChatMessageInput({ text: " hello ", clientMessageId: "c1" }), { text: "hello", clientMessageId: "c1" });
  assert.equal(validateChatMessageInput({ fileCount: 1, clientMessageId: "c2" }).text, "");
  assert.equal(validateChatMessageInput({ hasContext: true, clientMessageId: "c3" }).clientMessageId, "c3");
  assert.throws(() => validateChatMessageInput({ clientMessageId: "c4" }), /required/);
  assert.throws(() => validateChatMessageInput({ text: "x".repeat(2001), clientMessageId: "c5" }), /2000/);
  assert.throws(() => validateChatMessageInput({ fileCount: 4, clientMessageId: "c6" }), /at most 3/);
});

test("conversation DTO exposes only the actor counterpart and actor unread count", () => {
  const conversation = {
    id: "c1", userId: "u1", shopId: "s1",
    userSnapshot: { id: "u1", name: "User" }, shopSnapshot: { id: "s1", name: "Shop" },
    userUnreadCount: 2, shopUnreadCount: 5, createdAt: new Date(), updatedAt: new Date(),
  };
  const user = toConversationDto(conversation, { type: "user", id: "u1" });
  const shop = toConversationDto(conversation, { type: "shop", id: "o1", shopId: "s1" });
  assert.equal(user.counterpart.name, "Shop");
  assert.equal(user.unreadCount, 2);
  assert.equal(shop.counterpart.name, "User");
  assert.equal(shop.unreadCount, 5);
});
