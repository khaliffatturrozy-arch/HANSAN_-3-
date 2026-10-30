import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, status: "healthy", db: "connected" });
  } catch (e) {
    return NextResponse.json({ ok: false, status: "unhealthy", error: "DB_UNAVAILABLE" }, { status: 503 });
  }
}
