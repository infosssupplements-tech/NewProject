import { MongoClient, ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB;
const secret = process.env.AUTH_SECRET;
let clientPromise;

export function database() {
  if (!uri || !databaseName) throw new Error("MongoDB server configuration is missing.");
  if (!clientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 20, serverSelectionTimeoutMS: 8000 });
    clientPromise = client.connect();
  }
  return clientPromise.then((client) => client.db(databaseName));
}

const sign = (value) => createHmac("sha256", secret || "").update(value).digest("base64url");
const safeEqual = (a, b) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
const otpHash = (email, code) => sign(`otp:${email}:${code}`);

export async function issueSession(identity) {
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ ...identity, iat: now, exp: now + 60 * 60 * 12 })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const jar = await cookies();
  jar.set("ss_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}

export async function currentIdentity() {
  const token = (await cookies()).get("ss_session")?.value;
  if (!token || !secret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;
  try {
    const identity = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!identity.exp || identity.exp < Date.now() / 1000) return null;
    if (identity.role === "EMPLOYEE") {
      const db = await database();
      const employee = await db.collection("employees").findOne({ _id: new ObjectId(identity.id), active: true }, { projection: { name: 1, email: 1, shopIds: 1, permissions: 1, lastActiveAt: 1, sessionVersion: 1 } });
      if (!employee || (employee.sessionVersion || 0) !== (identity.sessionVersion || 0)) return null;
      if (!employee.lastActiveAt || employee.lastActiveAt < new Date(Date.now() - 5 * 60 * 1000)) {
        await db.collection("employees").updateOne({ _id: employee._id, $or: [{ lastActiveAt: { $exists: false } }, { lastActiveAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } }] }, { $set: { lastActiveAt: new Date() } });
      }
      return { id: employee._id.toString(), role: "EMPLOYEE", name: employee.name, email: employee.email, shopIds: (employee.shopIds || []).map(String), permissions: employee.permissions || [] };
    }
    return identity.role === "SUPER_ADMIN" ? identity : null;
  } catch {
    return null;
  }
}

export async function requireIdentity(roles = ["SUPER_ADMIN", "EMPLOYEE"]) {
  const identity = await currentIdentity();
  if (!identity || !roles.includes(identity.role)) return { identity: null, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  return { identity, response: null };
}

export async function canUseShop(identity, shopId, permission) {
  if (identity.role === "SUPER_ADMIN") return true;
  if (!identity.shopIds?.includes(String(shopId))) return false;
  if (permission && !identity.permissions?.includes(permission)) return false;
  return true;
}

export function createInvitationToken() {
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token) {
  if (!secret || secret.length < 32 || typeof token !== "string") return "";
  return sign(`invite:${token}`);
}

export async function sendIntegrationEmail(to, subject, message) {
  const emailUrl = process.env.APPS_SCRIPT_EMAIL_API_URL;
  const emailKey = process.env.APPS_SCRIPT_API_KEY;
  if (!emailUrl || !emailKey) return false;
  try {
    const response = await fetch(emailUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: emailKey, to, subject, message }), cache: "no-store", signal: AbortSignal.timeout(10000) });
    return response.ok;
  } catch {
    return false;
  }
}

export async function sendLoginCode(email) {
  const db = await database();
  const otpCollection = db.collection("otp_verifications");
  const now = new Date();
  const cooldown = new Date(Date.now() - 60_000);
  const recent = await otpCollection.findOne({ email, purpose: "login", createdAt: { $gt: cooldown } });
  if (recent) return { error: "Please wait before requesting another code." };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const ttl = Math.min(900, Math.max(60, Number(process.env.OTP_TTL_SECONDS) || 600));
  await otpCollection.updateOne({ email, purpose: "login" }, { $set: { codeHash: otpHash(email, code), attempts: 0, expiresAt: new Date(Date.now() + ttl * 1000), createdAt: now } }, { upsert: true });
  await otpCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const delivered = await sendIntegrationEmail(email, "SS Supplement sign-in code", `Your sign-in code is ${code}. It expires in ${Math.ceil(ttl / 60)} minutes.`);
  if (!delivered) {
    await otpCollection.deleteOne({ email, purpose: "login" });
    return { error: "Could not deliver the verification email." };
  }
  return { ok: true };
}

export async function verifyLoginCode(email, code) {
  const db = await database();
  const collection = db.collection("otp_verifications");
  const otp = await collection.findOne({ email, purpose: "login", expiresAt: { $gt: new Date() } });
  const maxAttempts = Math.min(10, Math.max(1, Number(process.env.OTP_MAX_ATTEMPTS) || 5));
  if (!otp || otp.attempts >= maxAttempts) return null;
  if (!safeEqual(otp.codeHash, otpHash(email, code))) {
    await collection.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
    return null;
  }
  await collection.deleteOne({ _id: otp._id });
  return true;
}

export async function verifyPassword(password, encoded) {
  if (!encoded || typeof password !== "string") return false;
  try {
    if (/^\$2[aby]\$/.test(encoded)) return await bcrypt.compare(password, encoded);
    return false;
  } catch {
    return false;
  }
}

export function validObjectId(value) {
  return typeof value === "string" && ObjectId.isValid(value);
}

export function objectId(value) {
  return new ObjectId(value);
}

export function safeObjectId(value) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

export function auditRecord({ action, actor, shopId = null, reference = null, changes = {} }) {
  return { action, actorId: actor.id, actorName: actor.name, actorRole: actor.role, shopId: shopId ? String(shopId) : null, reference, changes, createdAt: new Date() };
}
