import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, users } from "@/db/schema";
import { listUsers } from "@/lib/userManagement";
import { getSupabaseUser } from "@/lib/auth/supabase";
import { resolveAccess } from "@/lib/users";

async function resolveRequestUser(req: NextRequest) {
  const authUser = await getSupabaseUser(req);
  if (authUser) {
    const { upsertUser } = await import("@/lib/users");
    const profile = await upsertUser(authUser.id, authUser.email ?? "");
    return profile.supabaseUserId;
  }
  if (process.env.NODE_ENV === "production") return null;
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.supabaseUserId, "demo-user-00000000-0000-0000-0000-000000000000")).limit(1);
  return rows[0]?.supabaseUserId ?? null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orgSlug = url.searchParams.get("orgSlug") ?? "demo";
  const db = getDb();
  const orgRows = await db.select().from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
  if (orgRows.length === 0) return NextResponse.json({ ok: false, error: { code: "ORG_NOT_FOUND", message: "Organization not found." } }, { status: 404 });
  const org = orgRows[0];
  const supabaseUserId = await resolveRequestUser(req);
  if (!supabaseUserId) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
  try { await resolveAccess(supabaseUserId, org.id, undefined, ["owner", "admin", "manager", "developer"]); } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }
  const users = await listUsers(org.id);
  return NextResponse.json({ ok: true, users });
}
