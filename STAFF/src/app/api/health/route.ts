import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, status: "healthy", app: "hansan-hq", timestamp: new Date().toISOString() });
}
