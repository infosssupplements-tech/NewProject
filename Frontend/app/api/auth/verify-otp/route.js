import { adminEmail, database, issueSession, verifyLoginCode } from "../../../../lib/inventory-server.js";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) return Response.json({ error: "Enter the six-digit verification code." }, { status: 400 });
    if (!await verifyLoginCode(email, code)) return Response.json({ error: "The code is incorrect or expired." }, { status: 401 });

    let identity;
    let db;
    if (email === adminEmail && adminEmail) {
      identity = { id: "super-admin", role: "SUPER_ADMIN", name: "SS Supplement Admin", email };
    } else {
      db = await database();
      const employee = await db.collection("employees").findOne({ email, active: true }, { projection: { name: 1, email: 1, shopIds: 1, permissions: 1, sessionVersion: 1 } });
      if (!employee) return Response.json({ error: "This employee account is inactive." }, { status: 403 });
      identity = { id: employee._id.toString(), role: "EMPLOYEE", name: employee.name, email: employee.email, sessionVersion: employee.sessionVersion || 0, shopIds: employee.shopIds || [], permissions: employee.permissions || [] };
    }
    await issueSession(identity);
    if (identity.role === "EMPLOYEE") {
      try {
        await db.collection("employees").updateOne({ _id: new ObjectId(identity.id) }, { $set: { lastLoginAt: new Date(), lastActiveAt: new Date() } });
      } catch (activityError) {
        console.error("Employee login activity update failed:", activityError);
      }
    }
    return Response.json({ role: identity.role, name: identity.name });
  } catch (error) {
    console.error("OTP verification failed:", error);
    return Response.json({ error: "Verification is temporarily unavailable." }, { status: 500 });
  }
}
