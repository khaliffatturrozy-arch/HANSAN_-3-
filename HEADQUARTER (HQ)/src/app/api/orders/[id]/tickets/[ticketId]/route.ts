import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { updateStationTicket } from "@/lib/orders";

const schema = z.object({ status: z.enum(["new", "preparing", "ready", "cancelled"]) });

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  }
  try {
    const ticket = await updateStationTicket(params.ticketId, parsed.data.status);
    return NextResponse.json({ ok: true, ticket });
  } catch (e: any) {
    const msg = e?.message ?? "UPDATE_FAILED";
    const status = msg === "TICKET_NOT_FOUND" ? 404 : msg === "INVALID_TRANSITION" ? 409 : 400;
    return NextResponse.json({ ok: false, error: { code: msg, message: msg } }, { status });
  }
}
