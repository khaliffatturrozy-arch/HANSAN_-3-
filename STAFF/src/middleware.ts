import { NextResponse, type NextRequest } from "next/server";
import { getSessionSecret } from "@/config/environment";
import { verifySession, SESSION_COOKIE } from "@/server/session";
import { workspaceAllowed } from "@/server/authz";

const PUBLIC_API = ["/api/health", "/api/auth/"];

const WORKSPACE_ROOTS = ["/hq"];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const { secret, source } = getSessionSecret();

  if (isApi) {
    if (isPublicApi(pathname)) return NextResponse.next();
    if (!secret && source === "unconfigured") {
      return NextResponse.json(
        { ok: false, error: { code: "AUTH_NOT_CONFIGURED", message: "Authentication is not configured on this deployment (SESSION_SECRET missing)" } },
        { status: 503 }
      );
    }
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token, secret);
    if (!session) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign-in required" } }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Page routes
  if (pathname === "/login" || pathname === "/") return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, secret);
  if (session) {
    const root = `/${pathname.split("/")[1] ?? ""}`;
    if (WORKSPACE_ROOTS.includes(root) && !workspaceAllowed(session.role, root)) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  if (source === "unconfigured") return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/hq/:path*", "/api/:path*"],
};
