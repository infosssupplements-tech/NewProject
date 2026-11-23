import { currentIdentity } from "../../../../lib/inventory-server.js";

export const runtime = "nodejs";

export async function GET() {
  const identity = await currentIdentity();
  if (!identity) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user: identity });
}
