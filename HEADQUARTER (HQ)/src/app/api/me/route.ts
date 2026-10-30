import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { upsertUser, resolveUserContext } from "@/lib/users";

export async function GET(req: NextRequest) {
  const authUser = await getSupabaseUser(req);
  if (!authUser) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  }
  try {
    const profile = await upsertUser(authUser.id, authUser.email ?? "");
    const ctx = await resolveUserContext(profile.supabaseUserId);
    if (!ctx) {
      return NextResponse.json({ ok: false, error: { code: "USER_NOT_LINKED", message: "Internal user record not found" } }, { status: 403 });
    }
    return NextResponse.json({ ok: true, user: ctx.user, orgIds: ctx.orgIds, outletIds: ctx.outletIds });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to resolve user" } }, { status: 500 });
  }
}
