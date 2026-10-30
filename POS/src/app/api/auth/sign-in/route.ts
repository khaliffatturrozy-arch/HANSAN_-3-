import { NextResponse, type NextRequest } from "next/server";
import { DEV_ACCOUNTS } from "@/types/roles";
import { createDemoSession, signSession } from "@/server/session";
import { getSessionSecret } from "@/config/environment";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/server/session";

export async function POST(req: NextRequest) {
  const { secret, source } = getSessionSecret();
  let body: { email?: string; password?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  // Find matching dev account
  const role = (Object.keys(DEV_ACCOUNTS) as (keyof typeof DEV_ACCOUNTS)[]).find(
    (r) => DEV_ACCOUNTS[r].email.toLowerCase() === email
  );

  if (!role || password !== "hansan-dev") {
    return NextResponse.json({ ok: false, error: { code: "INVALID_CREDENTIALS", message: "Unknown development account." } }, { status: 401 });
  }

  if (!secret) {
    // Auth not configured (production without SESSION_SECRET): honest fail-closed for API.
    if (source === "unconfigured") {
      return NextResponse.json({ ok: false, error: { code: "AUTH_NOT_CONFIGURED", message: "Authentication is not configured on this deployment." } }, { status: 503 });
    }
  }

  const payload = createDemoSession({ userId: `dev_${role}`, role, email: DEV_ACCOUNTS[role].email });
  const token = await signSession(payload, secret);

  const res = NextResponse.json({ ok: true });
  if (token) {
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
  }
  return res;
}
