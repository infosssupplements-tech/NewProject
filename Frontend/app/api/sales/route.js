import { ObjectId } from "mongodb";
import { currentIdentity, database, safeObjectId } from "../../../lib/inventory-server.js";

export const runtime = "nodejs";
const pageLimit = 50;

export async function GET(request) {
  const user = await currentIdentity();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN" && !user.permissions?.some((permission) => ["sales", "billing"].includes(permission))) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page")) || 1));
    const selectedShop = url.searchParams.get("shopId");
    if (selectedShop && !safeObjectId(selectedShop)) return Response.json({ error: "Invalid shop filter." }, { status: 400 });
    if (selectedShop && user.role === "EMPLOYEE" && !user.shopIds.includes(selectedShop)) return Response.json({ error: "Forbidden" }, { status: 403 });
    const filter = {};
    if (user.role === "EMPLOYEE") filter.shopId = selectedShop || { $in: user.shopIds };
    else if (selectedShop) filter.shopId = selectedShop;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (from || to) {
      const range = {};
      if (from) { const date = new Date(from); if (Number.isNaN(date.getTime())) return Response.json({ error: "Invalid start date." }, { status: 400 }); range.$gte = date; }
      if (to) { const date = new Date(to); if (Number.isNaN(date.getTime())) return Response.json({ error: "Invalid end date." }, { status: 400 }); date.setUTCHours(23, 59, 59, 999); range.$lte = date; }
      filter.createdAt = range;
    }
    const db = await database();
    const [sales, total, summary] = await Promise.all([
      db.collection("sales").find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageLimit).limit(pageLimit).toArray(),
      db.collection("sales").countDocuments(filter),
      db.collection("sales").aggregate([{ $match: filter }, { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } }]).toArray(),
    ]);
    const productIds = [...new Set(sales.map((sale) => sale.productId).filter((id) => safeObjectId(id)))].map((id) => new ObjectId(id));
    const shopIds = [...new Set(sales.map((sale) => sale.shopId).filter((id) => safeObjectId(id)))].map((id) => new ObjectId(id));
    const [products, shops] = await Promise.all([
      productIds.length ? db.collection("products").find({ _id: { $in: productIds } }, { projection: { name: 1, sku: 1, category: 1 } }).toArray() : [],
      shopIds.length ? db.collection("shops").find({ _id: { $in: shopIds } }, { projection: { name: 1, code: 1 } }).toArray() : [],
    ]);
    const productById = new Map(products.map((product) => [product._id.toString(), product]));
    const shopById = new Map(shops.map((shop) => [shop._id.toString(), shop]));
    return Response.json({ sales: sales.map((sale) => ({ ...sale, _id: sale._id.toString(), productName: productById.get(sale.productId)?.name || "Unknown product", productSku: productById.get(sale.productId)?.sku || "—", shopName: shopById.get(sale.shopId)?.name || "Unknown shop" })), page, pageCount: Math.ceil(total / pageLimit), total, summary: summary[0] || { revenue: 0, count: 0 } });
  } catch (error) {
    console.error("Sales report failed:", error);
    return Response.json({ error: "Sales data is temporarily unavailable." }, { status: 500 });
  }
}
