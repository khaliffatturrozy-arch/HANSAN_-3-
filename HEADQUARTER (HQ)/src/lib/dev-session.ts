"use client";

import type { DevRole } from "@/types/roles";
import { DEV_ACCOUNTS } from "@/types/roles";

const KEY = "hansan_dev_session";

export function writeDevSession(role: DevRole): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, role); } catch { /* ignore */ }
}

export function readDevSession(): DevRole | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    if (v && (DEV_ACCOUNTS as Record<string, unknown>)[v]) return v as DevRole;
  } catch { /* ignore */ }
  return null;
}

export function clearDevSession(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function verifyDevCredentials(email: string, password: string): DevRole | null {
  const e = email.trim().toLowerCase();
  const p = password;
  for (const role of Object.keys(DEV_ACCOUNTS) as DevRole[]) {
    const acc = DEV_ACCOUNTS[role];
    if (acc.email.toLowerCase() === e && p === "hansan-dev") return role;
  }
  return null;
}

export function devCredentialsFor(role: DevRole): { email: string; password: string } {
  return { email: DEV_ACCOUNTS[role].email, password: "hansan-dev" };
}
