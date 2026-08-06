import { getMongoDb } from "./mongo.service.js";
import { getUserById, verifyUserToken } from "./userAuth.service.js";
import { getShopOwnerById, verifyOwnerToken } from "./shopAuth.service.js";
import { setChatNamespace, shopRoom, userRoom } from "./chatRealtime.service.js";

export const configureChatSocket = (io) => {
  const namespace = io.of("/chat");
  namespace.use(async (socket, next) => {
    try {
      const actorType = socket.handshake.auth?.actorType;
      const token = String(socket.handshake.auth?.token || "");
      if (!token || !["user", "shop"].includes(actorType)) return next(new Error("Unauthorized"));

      if (actorType === "user") {
        const payload = verifyUserToken(token);
        const user = payload.role === "user" && payload.userId ? await getUserById(payload.userId) : null;
        if (!user || user.status !== "active") return next(new Error("Unauthorized"));
        socket.data.actor = { type: "user", id: user.id };
        return next();
      }

      const payload = verifyOwnerToken(token);
      const owner = payload.ownerId ? await getShopOwnerById(payload.ownerId) : null;
      if (!owner || owner.status !== "active") return next(new Error("Unauthorized"));
      const db = await getMongoDb();
      const shop = await db.collection("shops").findOne({ ownerId: owner.id });
      socket.data.actor = { type: "shop", id: owner.id, shopId: shop?.id || null };
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  namespace.on("connection", (socket) => {
    const actor = socket.data.actor;
    if (actor.type === "user") socket.join(userRoom(actor.id));
    if (actor.type === "shop" && actor.shopId) socket.join(shopRoom(actor.shopId));
  });
  setChatNamespace(namespace);
  return namespace;
};
