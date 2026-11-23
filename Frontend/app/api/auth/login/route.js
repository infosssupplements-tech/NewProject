import { adminEmail, adminPasswordHash, database, sendLoginCode, verifyPassword } from "../../../../lib/inventory-server.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 256) return Response.json({ error: "Enter a valid email and password." }, { status: 400 });

    let valid = false;
    if (email === adminEmail && adminEmail) {
      valid = await verifyPassword(password, adminPasswordHash);
    } else {
      const db = await database();
      const employee = await db.collection("employees").findOne({ email, active: true, mustSetPassword: { $ne: true } });
      valid = Boolean(employee && await verifyPassword(password, employee.passwordHash));
    }
    if (!valid) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });

    const result = await sendLoginCode(email);
    if (result.error) return Response.json({ error: result.error, retryAfterSeconds: result.retryAfterSeconds }, { status: result.rateLimited ? 429 : 503 });
    return Response.json({ verificationRequired: true });
  } catch (error) {
    console.error("Inventory login failed:", error);
    return Response.json({ error: "Sign-in is temporarily unavailable." }, { status: 500 });
  }
}
