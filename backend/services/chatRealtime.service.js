let chatNamespace;

export const setChatNamespace = (namespace) => {
  chatNamespace = namespace;
};

export const userRoom = (userId) => `user:${userId}`;
export const shopRoom = (shopId) => `shop:${shopId}`;

export const emitChatEvent = ({ room, event, payload }) => {
  chatNamespace?.to(room).emit(event, payload);
};

export const disconnectShopSessions = (shopId) => {
  chatNamespace?.in(shopRoom(shopId)).disconnectSockets(true);
};
