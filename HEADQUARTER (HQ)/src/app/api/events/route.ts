import { NextResponse, type NextRequest } from "next/server";
import { eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { orderEvents } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orgSlug = url.searchParams.get("orgSlug") ?? "demo";
  const outletSlug = url.searchParams.get("outletSlug");
  const station = url.searchParams.get("station");
  const db = getDb();
  const orgRows = await db.select().from((await import("@/db/schema")).organizations).where(eq((await import("@/db/schema")).organizations.slug, orgSlug)).limit(1);
  if (orgRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORG_NOT_FOUND" } }, { status: 404 });
  const org = orgRows[0];
  let outletId: string | null = null;
  if (outletSlug) {
    const or = await db.select().from((await import("@/db/schema")).outlets).where(eq((await import("@/db/schema")).outlets.slug, outletSlug)).limit(1);
    outletId = or[0]?.id ?? null;
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastId: string | null = null;
      const send = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      send(JSON.stringify({ type: "connected", timestamp: new Date().toISOString() }));
      // poll outbox every 2s
      const interval = setInterval(async () => {
        try {
          const { orderEvents: oe } = await import("@/db/schema");
          const rows = await db.select().from(oe).where(eq(oe.organizationId, org.id)).orderBy(oe.createdAt);
          const filtered = rows.filter((r: any) => {
            if (outletId && r.outletId !== outletId) return false;
            if (station && r.station && r.station !== station) return false;
            return true;
          });
          for (const r of filtered) {
            if (lastId && r.id <= lastId) continue;
            lastId = r.id;
            send(JSON.stringify({ id: r.id, type: r.eventType, version: r.version, organizationId: r.organizationId, outletId: r.outletId, orderId: r.orderId, station: r.station, timestamp: r.createdAt }));
          }
        } catch { /* ignore */ }
      }, 2000);
      req.signal.addEventListener("abort", () => { clearInterval(interval); controller.close(); });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
