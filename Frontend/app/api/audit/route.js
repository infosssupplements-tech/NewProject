import { currentIdentity, database, safeObjectId } from "../../../lib/inventory-server.js";

export const runtime = "nodejs";
let auditIndexPromise;

export async function GET(request) {
  const user = await currentIdentity();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page")) || 1));
  const limit = 50;
  const selectedShop = url.searchParams.get("shopId");
  try {
    const db = await database();
    const filter = {};
    if (user.role === "EMPLOYEE") {
      filter.actorId = user.id;
      if (selectedShop) {
        if (!safeObjectId(selectedShop) || !await db.collection("shops").findOne({ _id: safeObjectId(selectedShop), active: true })) return Response.json({ error: "Forbidden" }, { status: 403 });
        if (!user.shopIds.includes(selectedShop)) return Response.json({ error: "Forbidden" }, { status: 403 });
        filter.shopId = selectedShop;
      } else filter.shopId = { $in: user.shopIds };
    } else if (selectedShop) {
      if (!safeObjectId(selectedShop)) return Response.json({ error: "Invalid shop filter." }, { status: 400 });
      filter.shopId = selectedShop;
    }
    if (!auditIndexPromise) auditIndexPromise = db.collection("audit_logs").createIndex({ createdAt: -1 });
    await auditIndexPromise;
    const [logs, total] = await Promise.all([
      db.collection("audit_logs").find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      db.collection("audit_logs").countDocuments(filter),
    ]);
    return Response.json({ logs: logs.map((log) => ({ ...log, _id: log._id.toString() })), page, limit, total, pageCount: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Audit history failed:", error);
    return Response.json({ error: "Audit history is temporarily unavailable." }, { status: 500 });
  }
}
