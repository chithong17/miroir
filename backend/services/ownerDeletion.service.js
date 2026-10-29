import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { withMongoTransaction } from "./mongo.service.js";
import { disconnectShopSessions } from "./chatRealtime.service.js";

const failure = (message, statusCode) => Object.assign(new Error(message), { statusCode });

// Dependencies are injectable so destructive operations are tested without a live database.
export const createOwnerAccountDeletion = ({ transact, compare, disconnect = () => {} }) => async (input = {}) => {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password || password.length > 1024) throw failure("Email and current password are required.", 400);
  if (input.confirmation !== "DELETE") throw failure("Type DELETE to confirm permanent account deletion.", 400);

  const removedShopIds = await transact(async (db, session) => {
    const options = { session };
    const owner = await db.collection("shop_owners").findOne({ email }, options);
    // Do not expose whether an email exists; also allow pending owners to delete their registration.
    if (!owner || !(await compare(password, owner.passwordHash))) throw failure("Invalid email or password.", 401);
    const shops = await db.collection("shops").find({ ownerId: owner.id }, options).toArray();
    const shopIds = shops.map(shop => shop.id);
    const products = shopIds.length ? await db.collection("products").find({ shopId: { $in: shopIds } }, options).toArray() : [];
    const assets = [...new Map(products.filter(p => p.imagePublicId).map(p => [p.imagePublicId, { publicId: p.imagePublicId, url: p.imageUrl || "" }])).values()];
    if (assets.length) await db.collection("account_media_deletions").insertMany(assets.map(asset => ({ id: crypto.randomUUID(), ...asset, status: "pending", attempts: 0, nextAttemptAt: new Date(), createdAt: new Date() })), options);
    if (shopIds.length) {
      await db.collection("products").deleteMany({ shopId: { $in: shopIds } }, options);
      // Keep only a non-personal tombstone so historical orders/returns still resolve their shop ID.
      for (const shop of shops) await db.collection("shops").replaceOne({ id: shop.id, ownerId: owner.id }, { id: shop.id, slug: `closed-${shop.id}`, name: "Closed boutique", status: "inactive", closedAt: new Date() }, options);
    }
    await db.collection("password_reset_otps").deleteMany({ email, accountType: "shop_owner" }, options);
    await db.collection("notifications").deleteMany({ audienceType: "shop", audienceId: owner.id }, options);
    await db.collection("shop_owners").deleteOne({ id: owner.id }, options);
    return shopIds;
  });
  // A committed deletion revokes HTTP authentication through the owner lookup and existing sockets here.
  for (const id of removedShopIds) {
    try { disconnect(id); } catch { console.error("Unable to disconnect a closed shop socket."); }
  }
  return { success: true, message: "Shop owner account deleted. Your boutique is closed and its catalog removed. Order, payment, return and conversation records are retained for transaction support and applicable obligations." };
};

export const deleteShopOwnerAccount = createOwnerAccountDeletion({ transact: withMongoTransaction, compare: bcrypt.compare, disconnect: disconnectShopSessions });
