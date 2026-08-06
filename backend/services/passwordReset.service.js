import axios from "axios";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getMongoDb } from "./mongo.service.js";

const RESET_COLLECTION = "password_reset_otps";
const OTP_TTL_MINUTES = Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10);
const OTP_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeAccountType = (accountType) => accountType === "shop_owner" ? "shop_owner" : "user";
const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");
const createError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const getAccountCollection = (accountType) => accountType === "shop_owner" ? "shop_owners" : "users";

let indexesPromise;
const ensureResetIndexes = async (db) => {
  if (!indexesPromise) {
    indexesPromise = Promise.all([
      db.collection(RESET_COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection(RESET_COLLECTION).createIndex({ email: 1, accountType: 1, createdAt: -1 }),
    ]).catch((error) => { indexesPromise = undefined; throw error; });
  }
  await indexesPromise;
};

const sendResetEmail = async ({ email, otp, accountType }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MIROIR Official <noreply@miroir.id.vn>";
  if (!apiKey) {
    throw createError("Email delivery is not configured. Set RESEND_API_KEY on the server.", 503);
  }
  const accountLabel = accountType === "shop_owner" ? "shop owner" : "customer";
  const subject = "Your MIROIR password reset code";
  const text = `Your MIROIR ${accountLabel} password reset code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#17210f"><div style="font-size:12px;letter-spacing:3px;font-weight:700;color:#5f7f3d">MIROIR</div><h1 style="font-size:28px;margin:16px 0">Reset your password</h1><p>Use this verification code for your ${accountLabel} account. It expires in ${OTP_TTL_MINUTES} minutes.</p><div style="margin:24px 0;padding:18px;border-radius:14px;background:#eef5e3;font-size:30px;font-weight:800;letter-spacing:8px;text-align:center">${otp}</div><p style="color:#65705d;font-size:14px">If you did not request a password reset, you can safely ignore this email.</p></div>`;
  try {
    await axios.post("https://api.resend.com/emails", { from, to: [email], subject, text, html }, { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, timeout: 15000 });
  } catch (error) {
    console.error("Resend password reset delivery failed:", error.response?.data || error.message);
    throw createError("We could not send the reset email. Please try again shortly.", 502);
  }
};

const findActiveAccount = async (db, email, accountType) => {
  const account = await db.collection(getAccountCollection(accountType)).findOne({ email });
  return account?.status === "active" ? account : null;
};

export const requestPasswordReset = async ({ email, accountType }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw createError("Email is required.");
  const normalizedType = normalizeAccountType(accountType);
  const db = await getMongoDb();
  await ensureResetIndexes(db);
  const account = await findActiveAccount(db, normalizedEmail, normalizedType);
  if (!account) return { message: "If an active account exists for this email, a reset code has been sent.", cooldownSeconds: OTP_COOLDOWN_SECONDS };
  const now = new Date();
  const latest = await db.collection(RESET_COLLECTION).findOne({ email: normalizedEmail, accountType: normalizedType, usedAt: null, expiresAt: { $gt: now } }, { sort: { createdAt: -1 } });
  const elapsedSeconds = latest ? Math.floor((now - latest.createdAt) / 1000) : OTP_COOLDOWN_SECONDS;
  if (elapsedSeconds < OTP_COOLDOWN_SECONDS) return { message: "If an active account exists for this email, a reset code has been sent.", cooldownSeconds: OTP_COOLDOWN_SECONDS - elapsedSeconds };
  const otp = crypto.randomInt(100000, 1000000).toString();
  await db.collection(RESET_COLLECTION).updateMany({ email: normalizedEmail, accountType: normalizedType, usedAt: null }, { $set: { usedAt: now, updatedAt: now } });
  await db.collection(RESET_COLLECTION).insertOne({ id: crypto.randomUUID(), email: normalizedEmail, accountType: normalizedType, otpHash: hashOtp(otp), attempts: 0, maxAttempts: MAX_OTP_ATTEMPTS, expiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60000), usedAt: null, createdAt: now, updatedAt: now });
  await sendResetEmail({ email: normalizedEmail, otp, accountType: normalizedType });
  return { message: "If an active account exists for this email, a reset code has been sent.", cooldownSeconds: OTP_COOLDOWN_SECONDS };
};

const findValidOtp = async (db, { email, accountType, otp, incrementAttempt = false }) => {
  const now = new Date();
  const record = await db.collection(RESET_COLLECTION).findOne({ email: normalizeEmail(email), accountType: normalizeAccountType(accountType), usedAt: null, expiresAt: { $gt: now } }, { sort: { createdAt: -1 } });
  if (!record || record.attempts >= MAX_OTP_ATTEMPTS || record.otpHash !== hashOtp(otp)) {
    if (record && incrementAttempt) await db.collection(RESET_COLLECTION).updateOne({ _id: record._id }, { $inc: { attempts: 1 }, $set: { updatedAt: now } });
    throw createError("The verification code is invalid or has expired.");
  }
  return record;
};

export const verifyPasswordResetOtp = async ({ email, accountType, otp }) => {
  if (!String(otp || "").match(/^\d{6}$/)) throw createError("Enter the 6-digit verification code.");
  const db = await getMongoDb();
  await findValidOtp(db, { email, accountType, otp, incrementAttempt: true });
  return { message: "Code verified. You can now set a new password." };
};

export const confirmPasswordReset = async ({ email, accountType, otp, newPassword }) => {
  if (String(newPassword || "").length < 6) throw createError("Password must be at least 6 characters.");
  if (!String(otp || "").match(/^\d{6}$/)) throw createError("Enter the 6-digit verification code.");
  const normalizedEmail = normalizeEmail(email);
  const normalizedType = normalizeAccountType(accountType);
  const db = await getMongoDb();
  const reset = await findValidOtp(db, { email: normalizedEmail, accountType: normalizedType, otp, incrementAttempt: true });
  const account = await findActiveAccount(db, normalizedEmail, normalizedType);
  if (!account) throw createError("The verification code is invalid or has expired.");
  const now = new Date();
  await db.collection(getAccountCollection(normalizedType)).updateOne({ _id: account._id }, { $set: { passwordHash: await bcrypt.hash(newPassword, 12), updatedAt: now } });
  await db.collection(RESET_COLLECTION).updateOne({ _id: reset._id }, { $set: { usedAt: now, updatedAt: now } });
  return { message: "Password updated. You can now sign in." };
};

