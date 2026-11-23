import { ObjectId } from "mongodb";
import { canUseShop, createInvitationToken, currentIdentity, database, sendIntegrationEmail, validObjectId } from "../../../lib/inventory-server.js";

export const runtime = "nodejs";
const permissionSet = new Set(["inventory", "purchases", "sales", "billing"]);

export async function GET() {
  const admin = await currentIdentity();
  if (!admin || admin.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const db = await database();
    const employees = await db.collection("employees").find({}, { projection: { passwordHash: 0, inviteTokenHash: 0 } }).sort({ name: 1 }).limit(5000).toArray();
    return Response.json({ employees: employees.map((employee) => ({ ...employee, _id: employee._id.toString(), shopIds: (employee.shopIds || []).map(String) })) });
  } catch (error) {
    console.error("Employee list failed:", error);
    return Response.json({ error: "Employee records are temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await currentIdentity();
  if (!admin || admin.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const employeeId = String(body.employeeId || "").trim().toUpperCase();
    const contact = String(body.contact || "").trim();
    const shopIds = Array.isArray(body.shopIds) ? [...new Set(body.shopIds.map(String))] : [];
    const permissions = Array.isArray(body.permissions) ? [...new Set(body.permissions.filter((item) => permissionSet.has(item)))] : [];
    if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || employeeId.length < 2 || employeeId.length > 40 || !shopIds.length || shopIds.length > 100 || !shopIds.every(validObjectId)) return Response.json({ error: "Enter valid employee details and assign at least one shop." }, { status: 400 });
    const db = await database();
    await Promise.all([db.collection("employees").createIndex({ email: 1 }, { unique: true }), db.collection("employees").createIndex({ employeeId: 1 }, { unique: true })]);
    const [validShops, duplicate] = await Promise.all([
      db.collection("shops").countDocuments({ _id: { $in: shopIds.map((id) => new ObjectId(id)) }, active: true }),
      db.collection("employees").findOne({ $or: [{ email }, { employeeId }] }, { projection: { _id: 1 } }),
    ]);
    if (validShops !== shopIds.length) return Response.json({ error: "One or more selected shops are inactive or unavailable." }, { status: 400 });
    if (duplicate) return Response.json({ error: "An employee already uses that email or employee ID." }, { status: 409 });
    const { token, tokenHash } = createInvitationToken();
    const now = new Date();
    const employee = { name, email, employeeId, contact, shopIds, permissions, role: "EMPLOYEE", active: true, mustSetPassword: true, inviteTokenHash: tokenHash, inviteExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), sessionVersion: 0, createdAt: now, updatedAt: now, createdBy: admin.id };
    const result = await db.collection("employees").insertOne(employee);
    const origin = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001");
    const inviteUrl = `${origin.replace(/\/$/, "")}/inventory/setup?token=${encodeURIComponent(token)}`;
    const delivered = await sendIntegrationEmail(email, "Your SS Supplement employee account", `Hello ${name},\n\nYour employee account is ready. Set a password using this secure link within 72 hours:\n${inviteUrl}\n\nIf you were not expecting this invitation, contact your store administrator.`);
    await db.collection("audit_logs").insertOne({ action: "EMPLOYEE_CREATED", actorId: admin.id, actorName: admin.name, actorRole: admin.role, shopId: null, reference: result.insertedId.toString(), changes: { name, email, employeeId, shopIds, permissions, inviteEmailDelivered: delivered }, createdAt: now });
    return Response.json({ ok: true, employeeId: result.insertedId.toString(), inviteSent: delivered, ...(delivered ? {} : { inviteUrl }) }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) return Response.json({ error: "That email or employee ID is already registered." }, { status: 409 });
    console.error("Employee creation failed:", error);
    return Response.json({ error: "Employee could not be created." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const admin = await currentIdentity();
  if (!admin || admin.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const employeeObjectId = validObjectId(body.id) ? new ObjectId(body.id) : null;
    if (!employeeObjectId) return Response.json({ error: "Invalid employee." }, { status: 400 });
    const db = await database();
    const collection = db.collection("employees");
    const employee = await collection.findOne({ _id: employeeObjectId });
    if (!employee) return Response.json({ error: "Employee not found." }, { status: 404 });
    const now = new Date();
    if (body.action === "deactivate" || body.action === "activate") {
      const active = body.action === "activate";
      await collection.updateOne({ _id: employeeObjectId }, { $set: { active, updatedAt: now }, $inc: { sessionVersion: 1 } });
      await db.collection("audit_logs").insertOne({ action: active ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_DEACTIVATED", actorId: admin.id, actorName: admin.name, actorRole: admin.role, shopId: null, reference: body.id, changes: { name: employee.name, email: employee.email, active }, createdAt: now });
      return Response.json({ ok: true });
    }
    if (body.action === "reset-password") {
      const { token, tokenHash } = createInvitationToken();
      await collection.updateOne({ _id: employeeObjectId }, { $set: { mustSetPassword: true, inviteTokenHash: tokenHash, inviteExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), updatedAt: now }, $inc: { sessionVersion: 1 } });
      const origin = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001");
      const inviteUrl = `${origin.replace(/\/$/, "")}/inventory/setup?token=${encodeURIComponent(token)}`;
      const delivered = await sendIntegrationEmail(employee.email, "Reset your SS Supplement password", `Hello ${employee.name},\n\nSet a new password using this secure link within 72 hours:\n${inviteUrl}`);
      await db.collection("audit_logs").insertOne({ action: "EMPLOYEE_PASSWORD_RESET", actorId: admin.id, actorName: admin.name, actorRole: admin.role, shopId: null, reference: body.id, changes: { email: employee.email, inviteEmailDelivered: delivered }, createdAt: now });
      return Response.json({ ok: true, inviteSent: delivered, ...(delivered ? {} : { inviteUrl }) });
    }
    if (body.action === "update") {
      const shopIds = Array.isArray(body.shopIds) ? [...new Set(body.shopIds.map(String))] : [];
      const permissions = Array.isArray(body.permissions) ? [...new Set(body.permissions.filter((item) => permissionSet.has(item)))] : [];
      const name = String(body.name || "").trim();
      const employeeId = String(body.employeeId || "").trim().toUpperCase();
      const contact = String(body.contact || "").trim();
      if (name.length < 2 || name.length > 120 || employeeId.length < 2 || employeeId.length > 40 || !shopIds.length || !shopIds.every(validObjectId)) return Response.json({ error: "Enter valid employee details and assign at least one shop." }, { status: 400 });
      const validShops = await db.collection("shops").countDocuments({ _id: { $in: shopIds.map((id) => new ObjectId(id)) }, active: true });
      if (validShops !== shopIds.length) return Response.json({ error: "One or more selected shops are inactive or unavailable." }, { status: 400 });
      await collection.updateOne({ _id: employeeObjectId }, { $set: { name, employeeId, contact, shopIds, permissions, updatedAt: now } });
      await db.collection("audit_logs").insertOne({ action: "EMPLOYEE_UPDATED", actorId: admin.id, actorName: admin.name, actorRole: admin.role, shopId: null, reference: body.id, changes: { previous: { name: employee.name, employeeId: employee.employeeId, contact: employee.contact, shopIds: employee.shopIds, permissions: employee.permissions }, next: { name, employeeId, contact, shopIds, permissions } }, createdAt: now });
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unsupported employee action." }, { status: 400 });
  } catch (error) {
    if (error?.code === 11000) return Response.json({ error: "That employee ID is already in use." }, { status: 409 });
    console.error("Employee update failed:", error);
    return Response.json({ error: "Employee update could not be completed." }, { status: 500 });
  }
}
