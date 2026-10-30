import type { DevRole } from "@/types/roles";

export const SESSION_COOKIE = "hansan_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

const DEV_FALLBACK_SECRET = "hansan-dev-only-session-key-not-for-production-use";

export interface SessionPayload {
  v: 1;
  mode: "demo" | "live";
  sub: string;
  role: DevRole;
  email: string;
  tenantId: string;
  outletIds: string[];
  dataScope: "DEMO" | "PRODUCTION";
  iat: number;
  exp: number;
}

export function createDemoSession(params: { userId: string; role: DevRole; email: string; now?: Date }): SessionPayload {
  const now = params.now ?? new Date();
  const iat = Math.floor(now.getTime() / 1000);
  return {
    v: 1, mode: "demo", sub: params.userId, role: params.role, email: params.email,
    tenantId: "ten_demo_sandbox", outletIds: ["out_demo_sandbox"], dataScope: "DEMO",
    iat, exp: iat + SESSION_TTL_SECONDS,
  };
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}
async function signData(secret: string, data: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64urlEncode(new Uint8Array(sig));
}
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(payload: SessionPayload, secret: string | null): Promise<string | null> {
  if (!secret) return null;
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await signData(secret, `v1.${body}`);
  return `v1.${body}.${sig}`;
}

export async function verifySession(token: string | undefined | null, secret: string | null): Promise<SessionPayload | null> {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const expected = await signData(secret, `${parts[0]}.${parts[1]}`);
  if (!constantTimeEqual(expected, parts[2])) return null;
  try {
    const json = new TextDecoder().decode(b64urlDecode(parts[1]));
    const payload = JSON.parse(json) as SessionPayload;
    if (payload.v !== 1) return null;
    if (payload.mode !== "demo" && payload.mode !== "live") return null;
    if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub || !payload.role || !payload.tenantId) return null;
    if (payload.dataScope !== "DEMO" && payload.dataScope !== "PRODUCTION") return null;
    return payload;
  } catch {
    return null;
  }
}
