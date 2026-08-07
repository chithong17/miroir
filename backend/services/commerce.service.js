import crypto from "node:crypto";
import { resolveCheckoutRecipient } from "./address.service.js";
import { getMongoDb, withMongoTransaction } from "./mongo.service.js";
import { createNotification } from "./notification.service.js";
import { getPremiumShopIds } from "./subscription.service.js";

export const ORDER_STATUSES = [
  "pending_confirmation", "confirmed", "preparing", "shipping", "delivered",
  "cancel_requested", "cancelled", "expired",
];
export const PAYMENT_STATUSES = [
  "cod_pending", "awaiting_transfer", "pending_verification", "paid", "refund_pending", "refunded",
];
const FINAL_ORDER_STATUSES = new Set(["delivered", "cancelled", "expired"]);
const clean = (value) => String(value || "").trim();
const fail = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
export const normalizeOrderCode = (value) => clean(value).toUpperCase().replace(/[^A-Z0-9]/g, "");

export const normalizeBuyNowItems = (value) => {
  if (!Array.isArray(value) || !value.length) fail("buyNowItems must contain at least one item.");
  const seen = new Set();
  return value.map((item) => {
    const productId = clean(item?.productId);
    const variantId = clean(item?.variantId);
    const quantity = Number(item?.quantity);
    if (!productId || !variantId) fail("Each buy-now item requires productId and variantId.");
    if (!Number.isInteger(quantity) || quantity < 1) fail("Buy-now quantity must be a positive integer.");
    const key = `${productId}:${variantId}`;
    if (seen.has(key)) fail("Duplicate product variant in buyNowItems.");
    seen.add(key);
    return { productId, variantId, quantity };
  });
};

const vnParts = (date) => Object.fromEntries(
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "2-digit", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
);

export const generateOrderCode = (date = new Date()) => {
  const p = vnParts(date);
  const millis = String(date.getMilliseconds()).padStart(3, "0");
  const suffix = Number.parseInt(crypto.randomBytes(4).toString("hex"), 16).toString(36).toUpperCase().padStart(4, "0").slice(-4);
  return `MIR${p.year}${p.month}${p.day}${p.hour}${p.minute}${p.second}${millis}${suffix}`;
};

export const formatOrderCode = (value) => {
  const code = normalizeOrderCode(value);
  return code.length === 22 ? `${code.slice(0, 3)} ${code.slice(3, 9)} ${code.slice(9, 18)} ${code.slice(18)}` : code;
};

const getCartDocument = async (db, userId, session) => db.collection("carts").findOne({ userId }, { session });

const enrichCart = async ({ db, userId, session, itemsOverride = null }) => {
  const savedCart = await getCartDocument(db, userId, session) || { id: null, userId, items: [] };
  const cart = itemsOverride ? { ...savedCart, items: itemsOverride } : savedCart;
  const productIds = [...new Set(cart.items.map((item) => item.productId))];
  const products = productIds.length ? await db.collection("products").find({ id: { $in: productIds } }, { session }).toArray() : [];
  const productById = new Map(products.map((item) => [item.id, item]));
  const shopIds = [...new Set(products.map((item) => item.shopId))];
  const shops = shopIds.length ? await db.collection("shops").find({ id: { $in: shopIds } }, { session }).toArray() : [];
  const activePaidShopIds = await getPremiumShopIds(shopIds);
  const shopById = new Map(shops.map((item) => [item.id, item]));
  const groups = new Map();
  for (const item of cart.items) {
    const product = productById.get(item.productId);
    const variant = product?.variants?.find((entry) => entry.id === item.variantId);
    const shop = product ? shopById.get(product.shopId) : null;
    const available = Boolean(
      product && variant?.active && variant.stockQuantity >= item.quantity &&
      product.status === "published" && product.availability === "in_stock" &&
      shop?.status === "active" && activePaidShopIds.has(shop.id)
    );
    const enriched = {
      ...item,
      product: product ? { id: product.id, name: product.name, imageUrl: product.imageUrl || "", price: product.price } : null,
      variant: variant || null,
      shopId: product?.shopId || null,
      available,
      issue: !product ? "product_removed" : !variant?.active ? "variant_unavailable" : variant.stockQuantity < item.quantity ? "insufficient_stock" : !activePaidShopIds.has(product.shopId) ? "shop_subscription_inactive" : null,
      lineTotal: product ? Number(product.price) * item.quantity : 0,
    };
    const key = enriched.shopId || "unavailable";
    if (!groups.has(key)) groups.set(key, { shop: shop ? { id: shop.id, name: shop.name, logoUrl: shop.logoUrl || "", bankTransferAvailable: Boolean(shop.paymentSettings?.bankTransferEnabled && shop.paymentSettings?.bankName && shop.paymentSettings?.accountHolder && shop.paymentSettings?.accountNumber && shop.paymentSettings?.qrImageUrl) } : null, items: [], subtotal: 0 });
    groups.get(key).items.push(enriched);
    groups.get(key).subtotal += enriched.lineTotal;
  }
  const resultGroups = [...groups.values()];
  return {
    id: cart.id, addressId: cart.addressId || null, groups: resultGroups,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: resultGroups.reduce((sum, group) => sum + group.subtotal, 0),
    updatedAt: cart.updatedAt || null,
  };
};

export const getCart = async (userId) => enrichCart({ db: await getMongoDb(), userId });

export const previewBuyNow = async ({ userId, items }) => enrichCart({
  db: await getMongoDb(),
  userId,
  itemsOverride: normalizeBuyNowItems(items),
});

export const addCartItem = async ({ userId, productId, variantId, quantity = 1 }) => {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) fail("quantity must be a positive integer.");
  const db = await getMongoDb();
  const product = await db.collection("products").findOne({ id: productId, status: "published" });
  const variant = product?.variants?.find((item) => item.id === variantId && item.active);
  if (!product || !variant) fail("Product variant is not available.", 404);
  if (variant.stockQuantity < qty) fail("Insufficient stock.", 409);
  const activeShopIds = await getPremiumShopIds([product.shopId]);
  if (!activeShopIds.has(product.shopId)) fail("Shop subscription is inactive.", 409);
  const now = new Date();
  const cart = await db.collection("carts").findOne({ userId });
  const existing = cart?.items?.find((item) => item.productId === productId && item.variantId === variantId);
  const nextQuantity = (existing?.quantity || 0) + qty;
  if (nextQuantity > variant.stockQuantity) fail("Insufficient stock.", 409);
  if (!cart) {
    await db.collection("carts").insertOne({ id: crypto.randomUUID(), userId, addressId: null, items: [{ productId, variantId, quantity: qty }], createdAt: now, updatedAt: now });
  } else if (existing) {
    await db.collection("carts").updateOne({ userId, "items.productId": productId, "items.variantId": variantId }, { $set: { "items.$.quantity": nextQuantity, updatedAt: now } });
  } else {
    await db.collection("carts").updateOne({ userId }, { $push: { items: { productId, variantId, quantity: qty } }, $set: { updatedAt: now } });
  }
  return getCart(userId);
};

export const updateCartItem = async ({ userId, productId, variantId, quantity }) => {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) fail("quantity must be a positive integer.");
  const db = await getMongoDb();
  const product = await db.collection("products").findOne({ id: productId });
  const variant = product?.variants?.find((item) => item.id === variantId);
  if (!variant || variant.stockQuantity < qty) fail("Insufficient stock or variant unavailable.", 409);
  const result = await db.collection("carts").updateOne(
    { userId, items: { $elemMatch: { productId, variantId } } },
    { $set: { "items.$.quantity": qty, updatedAt: new Date() } }
  );
  if (!result.matchedCount) fail("Cart item was not found.", 404);
  return getCart(userId);
};

export const removeCartItem = async ({ userId, productId, variantId }) => {
  const db = await getMongoDb();
  await db.collection("carts").updateOne({ userId }, { $pull: { items: { productId, variantId } }, $set: { updatedAt: new Date() } });
  return getCart(userId);
};

export const selectCartAddress = async ({ userId, addressId }) => {
  const db = await getMongoDb();
  if (addressId && !await db.collection("user_addresses").findOne({ id: addressId, userId })) fail("Address was not found.", 404);
  const now = new Date();
  await db.collection("carts").updateOne(
    { userId },
    { $set: { addressId: addressId || null, updatedAt: now }, $setOnInsert: { id: crypto.randomUUID(), userId, items: [], createdAt: now } },
    { upsert: true }
  );
  return getCart(userId);
};

const createUniqueOrderCode = async (db, session) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateOrderCode();
    if (!await db.collection("orders").findOne({ orderCode: code }, { session })) return code;
  }
  fail("Could not generate a unique order code.", 503);
};

export const checkoutCart = async ({ userId, body }) => {
  const idempotencyKey = clean(body.idempotencyKey);
  if (!idempotencyKey) fail("idempotencyKey is required.");
  const buyNowItems = body.buyNowItems === undefined ? null : normalizeBuyNowItems(body.buyNowItems);
  const existingDb = await getMongoDb();
  const existing = await existingDb.collection("orders").find({ userId, checkoutIdempotencyKey: idempotencyKey }).sort({ createdAt: 1 }).toArray();
  if (existing.length) return existing;

  return withMongoTransaction(async (db, session) => {
    const duplicate = await db.collection("orders").find({ userId, checkoutIdempotencyKey: idempotencyKey }, { session }).toArray();
    if (duplicate.length) return duplicate;
    try {
      await db.collection("checkout_batches").insertOne({ id: crypto.randomUUID(), userId, idempotencyKey, createdAt: new Date() }, { session });
    } catch (error) {
      if (error.code === 11000) fail("Checkout with this idempotency key is already being processed.", 409);
      throw error;
    }
    const cart = await enrichCart({ db, userId, session, itemsOverride: buyNowItems });
    if (!cart.itemCount) fail("Cart is empty.", 409);
    if (cart.groups.some((group) => group.items.some((item) => !item.available))) fail("Cart contains unavailable items. No order was created.", 409);
    const recipient = await resolveCheckoutRecipient({
      db, session, userId,
      body: { ...body, addressId: body.recipient ? null : (body.addressId || cart.addressId) },
    });
    const methods = body.paymentMethods && typeof body.paymentMethods === "object" ? body.paymentMethods : {};
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const created = [];
    for (const group of cart.groups) {
      const shop = await db.collection("shops").findOne({ id: group.shop.id }, { session });
      const paymentMethod = methods[shop.id] || "cash";
      if (!["cash", "bank_transfer"].includes(paymentMethod)) fail(`Invalid payment method for shop ${shop.name}.`);
      const settings = shop.paymentSettings || {};
      const bankReady = settings.bankTransferEnabled && settings.bankName && settings.accountHolder && settings.accountNumber && settings.qrImageUrl;
      if (paymentMethod === "bank_transfer" && !bankReady) fail(`${shop.name} has not configured bank transfer.`, 409);
      for (const item of group.items) {
        const stock = await db.collection("products").updateOne(
          { id: item.productId, status: "published", variants: { $elemMatch: { id: item.variantId, active: true, stockQuantity: { $gte: item.quantity } } } },
          { $inc: { "variants.$.stockQuantity": -item.quantity }, $set: { updatedAt: now } },
          { session }
        );
        if (!stock.modifiedCount) fail(`Stock changed for ${item.product?.name || item.productId}. No order was created.`, 409);
      }
      const orderCode = await createUniqueOrderCode(db, session);
      const order = {
        id: crypto.randomUUID(), orderCode, transferContent: orderCode,
        checkoutIdempotencyKey: idempotencyKey, userId, shopId: shop.id,
        shopSnapshot: { id: shop.id, name: shop.name, logoUrl: shop.logoUrl || "" },
        recipient: {
          name: recipient.recipientName, phone: recipient.phone,
          provinceCode: recipient.provinceCode, provinceName: recipient.provinceName,
          wardCode: recipient.wardCode, wardName: recipient.wardName,
          addressLine: recipient.addressLine, fullAddress: recipient.fullAddress,
          note: recipient.note || "", datasetVersion: recipient.datasetVersion,
        },
        items: group.items.map((item) => ({
          productId: item.productId, variantId: item.variantId,
          name: item.product.name, imageUrl: item.product.imageUrl,
          sku: item.variant.sku, color: item.variant.color, size: item.variant.size,
          unitPrice: item.product.price, quantity: item.quantity, lineTotal: item.lineTotal,
        })),
        subtotal: group.subtotal, shippingFee: 0, total: group.subtotal,
        paymentMethod,
        paymentStatus: paymentMethod === "cash" ? "cod_pending" : "awaiting_transfer",
        paymentSnapshot: paymentMethod === "bank_transfer" ? {
          bankName: settings.bankName, accountHolder: settings.accountHolder,
          accountNumber: settings.accountNumber, qrImageUrl: settings.qrImageUrl,
          qrImagePublicId: settings.qrImagePublicId || "",
        } : null,
        orderStatus: "pending_confirmation", previousStatusBeforeCancelRequest: null,
        statusHistory: [{ status: "pending_confirmation", actorType: "customer", actorId: userId, note: "Order placed", createdAt: now }],
        expiresAt, paymentDueAt: null, transferReportedAt: null,
        paymentProof: null, refund: null, inventoryRestockedAt: null,
        createdAt: now, updatedAt: now,
      };
      await db.collection("orders").insertOne(order, { session });
      await createNotification({ audienceType: "shop", audienceId: shop.ownerId, type: "order_created", title: "Đơn hàng mới", message: `${orderCode} vừa được tạo.`, orderId: order.id, db, session });
      created.push(order);
    }
    if (!buyNowItems) {
      await db.collection("carts").updateOne({ userId }, { $set: { items: [], updatedAt: now } }, { session });
    }
    return created;
  });
};

const customerOrder = async ({ db, userId, orderId }) => {
  const order = await db.collection("orders").findOne({ id: orderId, userId });
  if (!order) fail("Order was not found.", 404);
  return order;
};

const ownerOrder = async ({ db, ownerId, orderId }) => {
  const shop = await db.collection("shops").findOne({ ownerId });
  if (!shop) fail("Shop was not found.", 404);
  const order = await db.collection("orders").findOne({ id: orderId, shopId: shop.id });
  if (!order) fail("Order was not found.", 404);
  return { order, shop };
};

export const listCustomerOrders = async ({ userId, query = {} }) => {
  const db = await getMongoDb();
  const filter = { userId };
  if (query.status) filter.orderStatus = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  return db.collection("orders").find(filter).sort({ createdAt: -1 }).toArray();
};
export const getCustomerOrder = async ({ userId, orderId }) => customerOrder({ db: await getMongoDb(), userId, orderId });

export const listShopOrders = async ({ ownerId, query = {} }) => {
  const db = await getMongoDb();
  const shop = await db.collection("shops").findOne({ ownerId });
  if (!shop) return [];
  const filter = { shopId: shop.id };
  if (query.search) filter.orderCode = normalizeOrderCode(query.search);
  if (query.orderStatus) filter.orderStatus = query.orderStatus;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  return db.collection("orders").find(filter).sort({ createdAt: -1 }).toArray();
};
export const getShopOrder = async ({ ownerId, orderId }) => (await ownerOrder({ db: await getMongoDb(), ownerId, orderId })).order;

const restoreInventory = async ({ db, session, order }) => {
  if (order.inventoryRestockedAt) return order;
  const now = new Date();
  const claimed = await db.collection("orders").updateOne(
    { id: order.id, inventoryRestockedAt: null }, { $set: { inventoryRestockedAt: now } }, { session }
  );
  if (!claimed.modifiedCount) return order;
  for (const item of order.items) {
    await db.collection("products").updateOne(
      { id: item.productId, "variants.id": item.variantId },
      { $inc: { "variants.$.stockQuantity": item.quantity }, $set: { availability: "in_stock", updatedAt: now } },
      { session }
    );
  }
  return { ...order, inventoryRestockedAt: now };
};

const paymentAfterCancellation = (order) => order.paymentStatus === "paid" ? "refund_pending" : order.paymentStatus;

export const reportTransfer = async ({ userId, orderId, proof }) => {
  const db = await getMongoDb();
  const order = await customerOrder({ db, userId, orderId });
  if (order.paymentMethod !== "bank_transfer" || !["awaiting_transfer", "pending_verification"].includes(order.paymentStatus)) fail("This order is not awaiting a bank transfer.", 409);
  const now = new Date();
  const patch = { paymentStatus: "pending_verification", transferReportedAt: now, paymentDueAt: null, updatedAt: now };
  if (proof) patch.paymentProof = { ...proof, uploadedBy: userId, uploadedAt: now };
  const paymentUpdate = await db.collection("orders").updateOne(
    { id: order.id, paymentStatus: order.paymentStatus }, { $set: patch }
  );
  if (!paymentUpdate.modifiedCount) fail("Payment state changed; reload the order and try again.", 409);
  const shop = await db.collection("shops").findOne({ id: order.shopId });
  await createNotification({ audienceType: "shop", audienceId: shop.ownerId, type: "transfer_reported", title: "Khách đã báo chuyển khoản", message: `${order.orderCode} cần đối soát.`, orderId: order.id });
  return { ...order, ...patch };
};

export const customerCancelOrder = async ({ userId, orderId, reason }) => withMongoTransaction(async (db, session) => {
  let order = await customerOrder({ db, userId, orderId });
  if (FINAL_ORDER_STATUSES.has(order.orderStatus)) fail("Order can no longer be cancelled.", 409);
  const now = new Date();
  if (order.orderStatus === "pending_confirmation") {
    order = await restoreInventory({ db, session, order });
    const patch = { orderStatus: "cancelled", paymentStatus: paymentAfterCancellation(order), updatedAt: now };
    if (patch.paymentStatus === "refund_pending") patch.refundPendingAt = now;
    await db.collection("orders").updateOne({ id: order.id }, { $set: patch, $push: { statusHistory: { status: "cancelled", actorType: "customer", actorId: userId, note: clean(reason) || "Customer cancelled", createdAt: now } } }, { session });
    return { ...order, ...patch };
  }
  if (order.orderStatus === "cancel_requested") return order;
  const patch = { previousStatusBeforeCancelRequest: order.orderStatus, orderStatus: "cancel_requested", updatedAt: now };
  await db.collection("orders").updateOne({ id: order.id }, { $set: patch, $push: { statusHistory: { status: "cancel_requested", actorType: "customer", actorId: userId, note: clean(reason), createdAt: now } } }, { session });
  return { ...order, ...patch };
});

const SHOP_NEXT = {
  pending_confirmation: new Set(["confirmed", "cancelled"]),
  confirmed: new Set(["preparing", "cancelled"]), preparing: new Set(["shipping", "cancelled"]),
  shipping: new Set(["delivered", "cancelled"]),
};

export const updateShopOrderStatus = async ({ ownerId, orderId, status, reason }) => withMongoTransaction(async (db, session) => {
  let { order } = await ownerOrder({ db, ownerId, orderId });
  if (!ORDER_STATUSES.includes(status) || !SHOP_NEXT[order.orderStatus]?.has(status)) fail("Invalid order status transition.", 409);
  if (status === "cancelled" && !clean(reason)) fail("Cancellation reason is required.");
  const now = new Date();
  const patch = { orderStatus: status, updatedAt: now };
  if (status === "confirmed") {
    patch.confirmedAt = now;
    if (order.paymentMethod === "bank_transfer" && order.paymentStatus === "awaiting_transfer") patch.paymentDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
  if (status === "delivered") patch.deliveredAt = now;
  if (status === "cancelled") {
    order = await restoreInventory({ db, session, order });
    patch.paymentStatus = paymentAfterCancellation(order);
    if (patch.paymentStatus === "refund_pending") patch.refundPendingAt = now;
  }
  await db.collection("orders").updateOne({ id: order.id }, { $set: patch, $push: { statusHistory: { status, actorType: "shop", actorId: ownerId, note: clean(reason), createdAt: now } } }, { session });
  await createNotification({ audienceType: "customer", audienceId: order.userId, type: "order_status", title: "Cập nhật đơn hàng", message: `${order.orderCode}: ${status}`, orderId: order.id, db, session });
  return { ...order, ...patch };
});

export const decideCancellation = async ({ ownerId, orderId, approved, reason }) => withMongoTransaction(async (db, session) => {
  let { order } = await ownerOrder({ db, ownerId, orderId });
  if (order.orderStatus !== "cancel_requested") fail("Order has no pending cancellation request.", 409);
  const now = new Date();
  const status = approved ? "cancelled" : (order.previousStatusBeforeCancelRequest || "confirmed");
  const patch = { orderStatus: status, previousStatusBeforeCancelRequest: null, updatedAt: now };
  if (approved) { order = await restoreInventory({ db, session, order }); patch.paymentStatus = paymentAfterCancellation(order); if (patch.paymentStatus === "refund_pending") patch.refundPendingAt = now; }
  await db.collection("orders").updateOne({ id: order.id }, { $set: patch, $push: { statusHistory: { status, actorType: "shop", actorId: ownerId, note: clean(reason) || (approved ? "Cancellation approved" : "Cancellation rejected"), createdAt: now } } }, { session });
  return { ...order, ...patch };
});

export const updateShopPayment = async ({ ownerId, orderId, action, reason, proof }) => {
  const db = await getMongoDb();
  const { order } = await ownerOrder({ db, ownerId, orderId });
  const now = new Date();
  const patch = { updatedAt: now };
  if (action === "confirm_paid") {
    if (!["cod_pending", "awaiting_transfer", "pending_verification"].includes(order.paymentStatus)) fail("Payment cannot be confirmed from its current state.", 409);
    patch.paymentStatus = "paid"; patch.paidAt = now; patch.paymentDueAt = null;
  } else if (action === "reject_transfer") {
    if (order.paymentStatus !== "pending_verification") fail("Transfer is not pending verification.", 409);
    if (!clean(reason)) fail("Rejection reason is required.");
    patch.paymentStatus = "awaiting_transfer"; patch.paymentRejectionReason = clean(reason); patch.paymentDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (order.orderStatus === "pending_confirmation") patch.expiresAt = patch.paymentDueAt;
  } else if (action === "mark_refunded") {
    if (order.paymentStatus !== "refund_pending") fail("Refund is not pending.", 409);
    patch.paymentStatus = "refunded";
    patch.refund = { ...(order.refund || {}), status: "refunded", note: clean(reason), proof: proof || null, handledBy: ownerId, refundedAt: now };
  } else fail("Unknown payment action.");
  const updated = await db.collection("orders").updateOne(
    { id: order.id, paymentStatus: order.paymentStatus }, { $set: patch }
  );
  if (!updated.modifiedCount) fail("Payment state changed; reload the order and try again.", 409);
  await createNotification({ audienceType: "customer", audienceId: order.userId, type: `payment_${patch.paymentStatus}`, title: "Cập nhật thanh toán", message: `${order.orderCode}: ${patch.paymentStatus}`, orderId: order.id });
  return { ...order, ...patch };
};

export const expireCommerceOrders = async () => {
  const db = await getMongoDb();
  const now = new Date();
  const candidates = await db.collection("orders").find({
    orderStatus: { $in: ["pending_confirmation", "confirmed"] },
    paymentStatus: { $ne: "pending_verification" },
    $or: [
      { orderStatus: "pending_confirmation", expiresAt: { $lte: now }, transferReportedAt: null },
      { paymentDueAt: { $lte: now } },
    ],
  }).limit(100).toArray();
  for (const candidate of candidates) {
    await withMongoTransaction(async (transactionDb, session) => {
      const current = await transactionDb.collection("orders").findOne({ id: candidate.id }, { session });
      if (!current || FINAL_ORDER_STATUSES.has(current.orderStatus) || current.paymentStatus === "pending_verification") return;
      const restored = await restoreInventory({ db: transactionDb, session, order: current });
      await transactionDb.collection("orders").updateOne({ id: current.id }, { $set: { orderStatus: "expired", updatedAt: now }, $push: { statusHistory: { status: "expired", actorType: "system", actorId: null, note: "24-hour deadline elapsed", createdAt: now } } }, { session });
      await createNotification({ audienceType: "customer", audienceId: restored.userId, type: "order_expired", title: "Đơn hàng hết hạn", message: `${restored.orderCode} đã hết hạn.`, orderId: restored.id, db: transactionDb, session });
    });
  }
  const overdueTransfers = await db.collection("orders").find({
    orderStatus: "pending_confirmation",
    paymentStatus: "pending_verification",
    expiresAt: { $lte: now },
    transferOverdueNotifiedAt: null,
  }).limit(100).toArray();
  for (const order of overdueTransfers) {
    const shop = await db.collection("shops").findOne({ id: order.shopId });
    await db.collection("orders").updateOne({ id: order.id, transferOverdueNotifiedAt: null }, { $set: { transferOverdueNotifiedAt: now, updatedAt: now } });
    await createNotification({ audienceType: "shop", audienceId: shop?.ownerId, type: "transfer_overdue", title: "Chuyển khoản chờ xác nhận quá hạn", message: `${order.orderCode} cần shop đối soát, đơn không bị tự hủy.`, orderId: order.id });
  }
  return candidates.length;
};
