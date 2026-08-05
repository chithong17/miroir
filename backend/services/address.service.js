import crypto from "node:crypto";
import { getMongoDb } from "./mongo.service.js";
import { resolveLocation } from "./location.service.js";

const clean = (value) => String(value || "").trim();

export const normalizeRecipient = (body = {}, { requireLabel = false } = {}) => {
  const recipientName = clean(body.recipientName ?? body.name);
  const phone = clean(body.phone);
  const addressLine = clean(body.addressLine);
  const label = clean(body.label) || "Khác";
  if (!recipientName || !phone || !addressLine || !body.provinceCode || !body.wardCode) {
    const error = new Error(
      "recipientName, phone, provinceCode, wardCode and addressLine are required."
    );
    error.statusCode = 400;
    throw error;
  }
  if (requireLabel && !label) {
    const error = new Error("label is required.");
    error.statusCode = 400;
    throw error;
  }
  const location = resolveLocation(body);
  return {
    label,
    recipientName,
    phone,
    ...location,
    addressLine,
    fullAddress: `${addressLine}, ${location.wardName}, ${location.provinceName}`,
  };
};

const setOnlyDefault = async ({ db, userId, addressId, session }) => {
  await db.collection("user_addresses").updateMany(
    { userId },
    { $set: { isDefault: false, updatedAt: new Date() } },
    { session }
  );
  await db.collection("user_addresses").updateOne(
    { id: addressId, userId },
    { $set: { isDefault: true, updatedAt: new Date() } },
    { session }
  );
};

export const listAddresses = async (userId) => {
  const db = await getMongoDb();
  return db.collection("user_addresses").find({ userId }).sort({ isDefault: -1, createdAt: -1 }).toArray();
};

export const createAddress = async ({ userId, body, db: suppliedDb, session }) => {
  const db = suppliedDb || await getMongoDb();
  const normalized = normalizeRecipient(body, { requireLabel: true });
  const count = await db.collection("user_addresses").countDocuments({ userId }, { session });
  const now = new Date();
  const address = {
    id: crypto.randomUUID(),
    userId,
    ...normalized,
    isDefault: count === 0 || body.isDefault === true || body.setAsDefault === true,
    createdAt: now,
    updatedAt: now,
  };
  if (address.isDefault) {
    await db.collection("user_addresses").updateMany(
      { userId }, { $set: { isDefault: false, updatedAt: now } }, { session }
    );
  }
  await db.collection("user_addresses").insertOne(address, { session });
  return address;
};

export const updateAddress = async ({ userId, addressId, body }) => {
  const db = await getMongoDb();
  const current = await db.collection("user_addresses").findOne({ id: addressId, userId });
  if (!current) {
    const error = new Error("Address was not found."); error.statusCode = 404; throw error;
  }
  const normalized = normalizeRecipient({ ...current, ...body }, { requireLabel: true });
  const patch = { ...normalized, updatedAt: new Date() };
  await db.collection("user_addresses").updateOne({ id: addressId, userId }, { $set: patch });
  if (body.isDefault === true) await setOnlyDefault({ db, userId, addressId });
  return db.collection("user_addresses").findOne({ id: addressId, userId });
};

export const setDefaultAddress = async ({ userId, addressId }) => {
  const db = await getMongoDb();
  const exists = await db.collection("user_addresses").findOne({ id: addressId, userId });
  if (!exists) { const error = new Error("Address was not found."); error.statusCode = 404; throw error; }
  await setOnlyDefault({ db, userId, addressId });
  return db.collection("user_addresses").findOne({ id: addressId, userId });
};

export const deleteAddress = async ({ userId, addressId }) => {
  const db = await getMongoDb();
  const address = await db.collection("user_addresses").findOne({ id: addressId, userId });
  if (!address) { const error = new Error("Address was not found."); error.statusCode = 404; throw error; }
  const cartReference = await db.collection("carts").findOne({ userId, addressId });
  if (cartReference) {
    const error = new Error("This address is currently selected in your cart."); error.statusCode = 409; throw error;
  }
  await db.collection("user_addresses").deleteOne({ id: addressId, userId });
  if (address.isDefault) {
    const replacement = await db.collection("user_addresses").findOne({ userId }, { sort: { createdAt: -1 } });
    if (replacement) await setOnlyDefault({ db, userId, addressId: replacement.id });
  }
  return address;
};

export const resolveCheckoutRecipient = async ({ db, session, userId, body }) => {
  if (body.addressId) {
    const address = await db.collection("user_addresses").findOne({ id: body.addressId, userId }, { session });
    if (!address) { const error = new Error("Address was not found."); error.statusCode = 404; throw error; }
    return { ...address, note: clean(body.note) };
  }
  const normalized = normalizeRecipient(body.recipient || {});
  if (body.saveAddress) {
    await createAddress({
      userId,
      body: { ...body.recipient, setAsDefault: body.setAsDefault },
      db,
      session,
    });
  }
  return { ...normalized, note: clean(body.recipient?.note) };
};
