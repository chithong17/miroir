import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getMongoDb } from "./mongo.service.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured.");
    error.statusCode = 503;
    throw error;
  }

  return process.env.JWT_SECRET;
};

const publicOwner = (owner) => ({
  id: owner.id,
  email: owner.email,
  name: owner.name,
  status: owner.status,
  createdAt: owner.createdAt,
  updatedAt: owner.updatedAt,
});

export const signOwnerToken = (owner) =>
  jwt.sign(
    {
      ownerId: owner.id,
      email: owner.email,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

export const verifyOwnerToken = (token) =>
  jwt.verify(token, getJwtSecret());

export const registerShopOwner = async ({ email, password, name }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password || !name) {
    const error = new Error("email, password, and name are required.");
    error.statusCode = 400;
    throw error;
  }

  if (String(password).length < 8) {
    const error = new Error("Password must be at least 8 characters.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const existing = await db
    .collection("shop_owners")
    .findOne({ email: normalizedEmail });

  if (existing) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const now = new Date();
  const owner = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    name: String(name).trim(),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("shop_owners").insertOne(owner);

  return {
    owner: publicOwner(owner),
    token: signOwnerToken(owner),
  };
};

export const loginShopOwner = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    const error = new Error("email and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const owner = await db
    .collection("shop_owners")
    .findOne({ email: normalizedEmail });

  if (!owner || !(await bcrypt.compare(password, owner.passwordHash))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (owner.status !== "active") {
    const error = new Error("This shop owner account is not active.");
    error.statusCode = 403;
    throw error;
  }

  return {
    owner: publicOwner(owner),
    token: signOwnerToken(owner),
  };
};

export const getShopOwnerById = async (ownerId) => {
  const db = await getMongoDb();
  const owner = await db.collection("shop_owners").findOne({ id: ownerId });

  return owner ? publicOwner(owner) : null;
};
