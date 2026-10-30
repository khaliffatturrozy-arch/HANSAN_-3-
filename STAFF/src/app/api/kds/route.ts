import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderStationTickets, orderItems } from "@/db/schema";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const station = url.searchParams.get("station");
  if (station !== "kitchen" && station !== "bar") {
    return NextResponse.json({ ok: false, error: { code: "INVALID_STATION", message: "station must be kitchen or bar" } }, { status: 400 });
  }
  const db = getDb();
  const tickets = await db.select().from(orderStationTickets).where(eq(orderStationTickets.station, station));
  const enriched = await Promise.all(tickets.map(async (t) => {
    const orderRows = await db.select().from(orders).where(eq(orders.id, t.orderId)).limit(1);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, t.orderId));
    const stationItems = items.filter((i) => i.station === station);
    return { ticket: t, order: orderRows[0] ?? null, items: stationItems };
  }));
  return NextResponse.json({ ok: true, tickets: enriched });
}
