import axios from "axios";
import { getShopToken } from "./shopApi.js";
import { getUserToken } from "./userApi.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const clientFor = (actorType) => {
  const client = axios.create({ baseURL: API_BASE_URL, timeout: 90000 });
  client.interceptors.request.use((config) => {
    const token = actorType === "shop" ? getShopToken() : getUserToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
};

const clients = { user: clientFor("user"), shop: clientFor("shop") };
const root = (actorType) => actorType === "shop" ? "/shop-chat" : "/chat";

export const listChatConversations = async (actorType, params = {}) =>
  (await clients[actorType].get(`${root(actorType)}/conversations`, { params })).data;

export const openChatConversation = async (actorType, payload) =>
  (await clients[actorType].post(`${root(actorType)}/conversations`, payload)).data;

export const listChatMessages = async (actorType, conversationId, params = {}) =>
  (await clients[actorType].get(`${root(actorType)}/conversations/${encodeURIComponent(conversationId)}/messages`, { params })).data;

export const sendChatMessage = async (actorType, conversationId, { text, images = [], context, clientMessageId }) => {
  const form = new FormData();
  if (text) form.append("text", text);
  form.append("clientMessageId", clientMessageId);
  if (context?.type && context?.id) {
    form.append("contextType", context.type);
    form.append("contextId", context.id);
  }
  images.slice(0, 3).forEach((file) => form.append("images", file));
  return (await clients[actorType].post(
    `${root(actorType)}/conversations/${encodeURIComponent(conversationId)}/messages`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  )).data;
};

export const markChatRead = async (actorType, conversationId) =>
  (await clients[actorType].patch(`${root(actorType)}/conversations/${encodeURIComponent(conversationId)}/read`)).data;

export const chatSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  return API_BASE_URL.replace(/\/api\/?$/, "");
};

export const getChatToken = (actorType) => actorType === "shop" ? getShopToken() : getUserToken();

export const beginCustomerChat = async (payload, pendingContext = null) => {
  const result = await openChatConversation("user", payload);
  sessionStorage.setItem(`miroir_chat_conversation_${result.conversation.id}`, JSON.stringify(result.conversation));
  if (pendingContext) sessionStorage.setItem(`miroir_chat_context_${result.conversation.id}`, JSON.stringify(pendingContext));
  window.location.href = `/app/messages/${encodeURIComponent(result.conversation.id)}`;
};

export const beginShopOrderChat = async (orderId) => {
  const result = await openChatConversation("shop", { orderId });
  sessionStorage.setItem(`miroir_shop_chat_conversation_${result.conversation.id}`, JSON.stringify(result.conversation));
  sessionStorage.setItem(`miroir_shop_chat_context_${result.conversation.id}`, JSON.stringify({ type: "order", id: orderId }));
  window.location.href = `/shop/messages/${encodeURIComponent(result.conversation.id)}`;
};
