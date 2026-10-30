"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEV_ACCOUNTS } from "@/types/roles";
import type { DevRole } from "@/types/roles";
import { devCredentialsFor, verifyDevCredentials, writeDevSession } from "@/lib/dev-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const POS_ROLES: DevRole[] = ["pos"];

export default function LoginPage() {
  const router = useRouter();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => { emailRef.current?.focus(); }, []);

  async function establishSession(creds: { email: string; password: string }): Promise<boolean | null> {
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (res.ok && json?.ok) return true;
      if (res.status === 401) return false;
      return null;
    } catch {
      return null;
    }
  }

  function finishSignIn(role: DevRole) {
    writeDevSession(role);
    router.replace("/");
  }

  function validate(): boolean {
    let ok = true;
    if (!email.trim()) { setEmailError("Email is required."); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError("Enter a valid email address."); ok = false; }
    else setEmailError(null);
    if (!password) { setPasswordError("Password is required."); ok = false; }
    else setPasswordError(null);
    return ok;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    const localRole = verifyDevCredentials(email, password);
    if (!localRole) { setFormError("Unknown development account. Use one listed below."); return; }
    if (!POS_ROLES.includes(localRole)) { setFormError("This account has no Point of Sale access."); return; }
    setSubmitting(true);
    const server = await establishSession({ email, password });
    if (server === false) { setSubmitting(false); setFormError("Sign-in rejected by the server."); return; }
    finishSignIn(localRole);
    setSubmitting(false);
  }

  async function quickSignIn(role: DevRole) {
    setSubmitting(true);
    setFormError(null);
    const server = await establishSession(devCredentialsFor(role));
    if (server === false) {
      setSubmitting(false);
      setFormError("Sign-in rejected by the server.");
      return;
    }
    finishSignIn(role);
    setSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-hansan-surface-soft px-4 py-10 sm:px-6">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3" aria-label="HANSAN home">
          <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-sm border border-hansan-ink bg-hansan-orange text-xl font-black text-white shadow-neu-raised-sm">H</span>
          <span className="text-3xl font-black tracking-tight text-hansan-ink">HANSAN</span>
        </Link>
        <section
          aria-labelledby="login-title"
          className="rounded-sm border border-hansan-line bg-hansan-surface-raised p-8 shadow-neu-flat sm:p-10"
        >
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hansan-ink-muted">Point of Sale</p>
            <h1 id="login-title" className="mt-1 text-3xl font-black tracking-tight text-hansan-ink">Sign in</h1>
            <p className="mt-2 text-sm text-hansan-ink-muted">
              Development sign-in. Use a development account below.
            </p>
          </header>
          <div aria-live="polite" className="mb-4 min-h-[1.25rem]">
            {formError && <Alert variant="danger">{formError}</Alert>}
          </div>
          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate aria-busy={submitting}>
            <Input
              ref={emailRef}
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
              placeholder="pos@hansan.local"
              disabled={submitting}
              required
              error={emailError}
              className="py-2.5 text-base"
            />
            <Input
              label="Password"
              id="pos-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }}
              placeholder="hansan-dev"
              disabled={submitting}
              required
              error={passwordError}
              className="py-2.5 text-base"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xs px-2 py-1 text-xs font-semibold text-hansan-blue hover:bg-hansan-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-hansan-blue"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            />
            <Button type="submit" loading={submitting} className="mt-3 w-full py-2.5 text-base">
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 border-t border-hansan-line pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">Development accounts</p>
            <ul className="flex flex-col gap-2" aria-label="Development accounts">
              {POS_ROLES.map((role) => {
                const account = DEV_ACCOUNTS[role];
                return (
                  <li key={role}>
                    <button
                      type="button"
                      onClick={() => quickSignIn(role)}
                      disabled={submitting}
                      className="flex w-full items-center justify-between rounded-sm border border-hansan-line bg-hansan-surface-soft px-3 py-2 text-left transition hover:border-hansan-line-strong hover:bg-hansan-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-hansan-blue disabled:opacity-50"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-hansan-ink">{account.label}</span>
                        <span className="block font-mono text-xs text-hansan-ink-muted">{account.email}</span>
                      </span>
                      <span className="text-xs font-semibold text-hansan-blue" aria-hidden>Enter</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-hansan-ink-muted">
              Password for all development accounts: <span className="font-mono">hansan-dev</span>
            </p>
          </div>
          )}
        </section>
        <p className="mt-6 text-center text-xs text-hansan-ink-muted">
          <Link href="/" className="font-semibold text-hansan-blue hover:underline">Back to home</Link>
        </p>
        {process.env.NODE_ENV !== "production" && (
        <p className="mt-2 text-center text-xs text-hansan-ink-muted/70">
          Authentication is development-only (demo session). Production authentication is not configured.
        </p>
        )}
      </div>
    </main>
  );
}
