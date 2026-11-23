import bcrypt from "bcryptjs";
import { database, hashInvitationToken } from "../../../../lib/inventory-server.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (token.length < 40 || token.length > 100 || password.length < 12 || password.length > 256) return Response.json({ error: "Use the secure invite link and choose a password of at least 12 characters." }, { status: 400 });
    const db = await database();
    const employee = await db.collection("employees").findOne({ inviteTokenHash: hashInvitationToken(token), inviteExpiresAt: { $gt: new Date() }, active: true });
    if (!employee) return Response.json({ error: "This invitation is invalid or has expired." }, { status: 400 });
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.collection("employees").updateOne({ _id: employee._id, inviteTokenHash: hashInvitationToken(token), inviteExpiresAt: { $gt: new Date() }, active: true }, { $set: { passwordHash, mustSetPassword: false, updatedAt: new Date() }, $unset: { inviteTokenHash: "", inviteExpiresAt: "" }, $inc: { sessionVersion: 1 } });
    if (!result.modifiedCount) return Response.json({ error: "This invitation has already been used or has expired." }, { status: 409 });
    await db.collection("audit_logs").insertOne({ action: "EMPLOYEE_PASSWORD_SET", actorId: employee._id.toString(), actorName: employee.name, actorRole: "EMPLOYEE", shopId: null, reference: employee._id.toString(), changes: { passwordSet: true }, createdAt: new Date() });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Invite acceptance failed:", error);
    return Response.json({ error: "Account setup could not be completed." }, { status: 500 });
  }
}
