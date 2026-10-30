import { NextResponse, type NextRequest } from "next/server";
import { getUserDetail } from "@/lib/userManagement";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const detail = await getUserDetail(params.id);
  if (!detail) return NextResponse.json({ ok: false, error: { code: "USER_NOT_FOUND", message: "User not found." } }, { status: 404 });
  return NextResponse.json({ ok: true, ...detail });
}
