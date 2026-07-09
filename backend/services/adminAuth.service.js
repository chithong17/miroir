import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getMongoDb } from "./mongo.service.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const getJwtSecret = () => {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error("JWT_SECRET or ADMIN_JWT_SECRET is not configured.");
    error.statusCode = 503;
    throw error;
  }

  return secret;
};

const toPublicAdmin = (admin) => ({
  id: admin.id,
  email: admin.email,
  name: admin.name,
  status: admin.status,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

export const signAdminToken = (admin) =>
  jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      role: "admin",
    },
    getJwtSecret(),
    {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "7d",
    }
  );

export const verifyAdminToken = (token) => jwt.verify(token, getJwtSecret());

export const seedAdminUser = async ({ email, password, name }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    const error = new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
    error.statusCode = 400;
    throw error;
  }

  if (String(password).length < 8) {
    const error = new Error("ADMIN_PASSWORD must be at least 8 characters.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const now = new Date();
  const existing = await db.collection("admin_users").findOne({ email: normalizedEmail });
  const patch = {
    email: normalizedEmail,
    name: String(name || "MIROIR Admin").trim(),
    passwordHash: await bcrypt.hash(password, 12),
    status: "active",
    updatedAt: now,
  };

  if (existing) {
    await db.collection("admin_users").updateOne({ id: existing.id }, { $set: patch });
    return toPublicAdmin({ ...existing, ...patch });
  }

  const admin = {
    id: crypto.randomUUID(),
    ...patch,
    createdAt: now,
  };

  await db.collection("admin_users").insertOne(admin);
  await db.collection("admin_users").createIndex({ email: 1 }, { unique: true });
  return toPublicAdmin(admin);
};

export const loginAdmin = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    const error = new Error("email and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const db = await getMongoDb();
  const admin = await db.collection("admin_users").findOne({ email: normalizedEmail });

  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (admin.status !== "active") {
    const error = new Error("This admin account is not active.");
    error.statusCode = 403;
    throw error;
  }

  return {
    admin: toPublicAdmin(admin),
    token: signAdminToken(admin),
  };
};

export const getAdminById = async (adminId) => {
  const db = await getMongoDb();
  const admin = await db.collection("admin_users").findOne({ id: adminId });
  return admin ? toPublicAdmin(admin) : null;
};
