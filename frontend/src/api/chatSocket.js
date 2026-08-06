import { io } from "socket.io-client";
import { chatSocketUrl, getChatToken } from "./chatApi.js";

export const connectChatSocket = (actorType) => io(`${chatSocketUrl()}/chat`, {
  auth: { actorType, token: getChatToken(actorType) },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 700,
  reconnectionDelayMax: 10_000,
  randomizationFactor: 0.4,
});
