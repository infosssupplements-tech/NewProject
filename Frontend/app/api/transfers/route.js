import { ObjectId } from "mongodb";
import { currentIdentity, database, validObjectId } from "../../../lib/inventory-server.js";

export const runtime = "nodejs";

export async function GET() {
  const user = await currentIdentity();
  if (!user || user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const db = await database();
    const [transfers, shops] = await Promise.all([db.collection("stock_transfers").find({}).sort({ createdAt: -1 }).limit(2000).toArray(), db.collection("shops").find({}, { projection: { name: 1 } }).toArray()]);
    const shopNames = new Map(shops.map((shop) => [shop._id.toString(), shop.name]));
    return Response.json({ transfers: transfers.map((transfer) => ({ ...transfer, _id: transfer._id.toString(), sourceShop: shopNames.get(transfer.sourceShopId) || "Unknown shop", destinationShop: shopNames.get(transfer.destinationShopId) || "Unknown shop" })) });
  } catch (error) {
    console.error("Transfer list failed:", error);
    return Response.json({ error: "Transfer history is temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await currentIdentity();
  if (!user || user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const db = await database();
    const now = new Date();
    const transfers = db.collection("stock_transfers");
    const batches = db.collection("product_batches");
    const audit = db.collection("audit_logs");
    if (body.action === "create") {
      const sourceShopId = String(body.sourceShopId || "");
      const destinationShopId = String(body.destinationShopId || "");
      const batchId = String(body.batchId || "");
      const quantity = Number(body.quantity);
      if (!validObjectId(sourceShopId) || !validObjectId(destinationShopId) || sourceShopId === destinationShopId || !validObjectId(batchId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) return Response.json({ error: "Choose two different shops, a batch, and a whole quantity." }, { status: 400 });
      const [source, destination, batch] = await Promise.all([
        db.collection("shops").findOne({ _id: new ObjectId(sourceShopId), active: true }),
        db.collection("shops").findOne({ _id: new ObjectId(destinationShopId), active: true }),
        batches.findOne({ _id: new ObjectId(batchId), shopId: sourceShopId }),
      ]);
      if (!source || !destination || !batch) return Response.json({ error: "An active shop or source batch could not be found." }, { status: 404 });
      if (batch.availableQty < quantity) return Response.json({ error: "Quantity exceeds available stock." }, { status: 409 });
      const reference = `TR-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${new ObjectId().toString().slice(-6).toUpperCase()}`;
      const item = { batchId, productId: batch.productId, productName: String((await db.collection("products").findOne({ _id: new ObjectId(batch.productId) }, { projection: { name: 1 } }))?.name || "Product"), batchNumber: batch.batchNumber, expiryDate: batch.expiryDate, unitCost: batch.unitCost, unitPrice: batch.unitPrice, quantity };
      const result = await transfers.insertOne({ reference, sourceShopId, destinationShopId, items: [item], status: "PENDING", createdAt: now, updatedAt: now, createdBy: user.id, createdByName: user.name });
      await audit.insertOne({ action: "TRANSFER_REQUESTED", actorId: user.id, actorName: user.name, actorRole: user.role, shopId: sourceShopId, reference, changes: { sourceShop: source.name, destinationShop: destination.name, item }, createdAt: now });
      return Response.json({ ok: true, id: result.insertedId.toString(), reference }, { status: 201 });
    }

    const transferId = validObjectId(body.id) ? new ObjectId(body.id) : null;
    if (!transferId) return Response.json({ error: "Invalid transfer." }, { status: 400 });
    const session = db.client.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        const transfer = await transfers.findOne({ _id: transferId }, { session });
        if (!transfer) throw new Error("Transfer not found.");
        if (body.action === "dispatch") {
          if (transfer.status !== "PENDING") throw new Error("Only pending transfers can be dispatched.");
          for (const item of transfer.items) {
            const update = await batches.updateOne({ _id: new ObjectId(item.batchId), shopId: transfer.sourceShopId, availableQty: { $gte: item.quantity } }, { $inc: { availableQty: -item.quantity, inTransitQty: item.quantity }, $set: { updatedAt: now } }, { session });
            if (!update.modifiedCount) throw new Error("Source stock changed; confirm the available quantity and retry.");
          }
          result = await transfers.updateOne({ _id: transferId, status: "PENDING" }, { $set: { status: "DISPATCHED", dispatchedAt: now, dispatchedBy: user.id, dispatchedByName: user.name, updatedAt: now } }, { session });
        } else if (body.action === "receive") {
          if (transfer.status !== "DISPATCHED") throw new Error("Only dispatched transfers can be received.");
          for (const item of transfer.items) {
            const sourceUpdate = await batches.updateOne({ _id: new ObjectId(item.batchId), shopId: transfer.sourceShopId, inTransitQty: { $gte: item.quantity } }, { $inc: { inTransitQty: -item.quantity }, $set: { updatedAt: now } }, { session });
            if (!sourceUpdate.modifiedCount) throw new Error("Transfer quantity could not be reconciled at the source.");
            const destinationBatchFilter = { shopId: transfer.destinationShopId, productId: item.productId, batchNumber: item.batchNumber };
            const destinationBatch = await batches.findOne(destinationBatchFilter, { session });
            if (destinationBatch && new Date(destinationBatch.expiryDate).getTime() !== new Date(item.expiryDate).getTime()) throw new Error("Destination batch has a different expiry date.");
            await batches.updateOne(destinationBatchFilter, { $setOnInsert: { ...destinationBatchFilter, expiryDate: item.expiryDate, purchaseDate: now, unitCost: item.unitCost, unitPrice: item.unitPrice, supplier: "Inter-store transfer", createdAt: now }, $inc: { availableQty: item.quantity, transferredInQty: item.quantity }, $set: { updatedAt: now } }, { upsert: true, session });
          }
          result = await transfers.updateOne({ _id: transferId, status: "DISPATCHED" }, { $set: { status: "RECEIVED", receivedAt: now, receivedBy: user.id, receivedByName: user.name, updatedAt: now } }, { session });
        } else if (body.action === "cancel") {
          if (transfer.status !== "PENDING") throw new Error("Only pending transfers can be cancelled.");
          result = await transfers.updateOne({ _id: transferId, status: "PENDING" }, { $set: { status: "CANCELLED", cancelledAt: now, cancelledBy: user.id, updatedAt: now } }, { session });
        } else throw new Error("Unsupported transfer action.");
        const auditAction = { dispatch: "TRANSFER_DISPATCHED", receive: "TRANSFER_RECEIVED", cancel: "TRANSFER_CANCELLED" }[body.action];
        await audit.insertOne({ action: auditAction, actorId: user.id, actorName: user.name, actorRole: user.role, shopId: transfer.sourceShopId, reference: transfer.reference, changes: { status: body.action.toUpperCase() }, createdAt: now }, { session });
      });
    } finally { await session.endSession(); }
    if (!result?.matchedCount) return Response.json({ error: "Transfer state changed; refresh and retry." }, { status: 409 });
    return Response.json({ ok: true });
  } catch (error) {
    const status = /not found|Only |changed|exceeds|reconciled|Unsupported|expiry|available quantity/.test(error.message) ? 409 : 500;
    if (status === 500) console.error("Transfer action failed:", error);
    return Response.json({ error: status === 500 ? "Transfer could not be completed." : error.message }, { status });
  }
}
