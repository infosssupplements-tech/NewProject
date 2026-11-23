import { ObjectId } from "mongodb";
import { currentIdentity, database, validObjectId } from "../../../lib/inventory-server.js";

export const runtime = "nodejs";

export async function PATCH(request) {
  const admin = await currentIdentity();
  if (!admin || admin.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    if (!validObjectId(body.id)) return Response.json({ error: "Invalid shop." }, { status: 400 });
    const db = await database();
    const collection = db.collection("shops");
    const shop = await collection.findOne({ _id: new ObjectId(body.id) });
    if (!shop) return Response.json({ error: "Shop not found." }, { status: 404 });
    const allowed = {};
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name.length < 2 || name.length > 100) return Response.json({ error: "Shop name must be 2–100 characters." }, { status: 400 });
      allowed.name = name;
    }
    if (typeof body.code === "string") allowed.code = body.code.trim().toUpperCase().slice(0, 20);
    if (typeof body.address === "string") allowed.address = body.address.trim().slice(0, 200);
    if (typeof body.active === "boolean") allowed.active = body.active;
    if (!Object.keys(allowed).length) return Response.json({ error: "No shop changes provided." }, { status: 400 });
    allowed.updatedAt = new Date();
    await collection.updateOne({ _id: shop._id }, { $set: allowed });
    await db.collection("audit_logs").insertOne({ action: allowed.active === false ? "SHOP_DEACTIVATED" : allowed.active === true ? "SHOP_ACTIVATED" : "SHOP_UPDATED", actorId: admin.id, actorName: admin.name, actorRole: admin.role, shopId: shop._id.toString(), reference: shop._id.toString(), changes: { previous: { name: shop.name, code: shop.code, address: shop.address, active: shop.active }, next: allowed }, createdAt: new Date() });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Shop update failed:", error);
    return Response.json({ error: "Shop update could not be completed." }, { status: 500 });
  }
}
