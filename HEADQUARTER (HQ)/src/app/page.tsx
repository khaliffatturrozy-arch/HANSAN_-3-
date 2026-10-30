import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HANSAN HQ — Headquarter operations",
  description: "Headquarter operations for the HANSAN F&B platform.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-hansan-surface-soft text-hansan-ink">
      <div className="mx-auto flex min-h-screen max-w-shell flex-col justify-center px-6 py-16">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-sm border border-hansan-ink bg-hansan-orange text-lg font-black text-white">
            H
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-hansan-ink-muted">HANSAN HQ</span>
        </div>
        <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-hansan-ink sm:text-6xl">
          Headquarter operations, in one place.
        </h1>
        <p className="mt-5 max-w-xl text-base text-hansan-ink-muted">
          Sign in to manage catalog, inventory, workforce, finance and settings for your outlets.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-sm border border-hansan-ink bg-hansan-orange px-5 py-3 text-sm font-semibold text-white shadow-neu-raised-sm transition hover:translate-y-[-1px]"
          >
            Sign in
          </Link>
          <Link
            href="/hq"
            className="inline-flex items-center justify-center rounded-sm border border-hansan-line bg-hansan-surface-raised px-5 py-3 text-sm font-semibold text-hansan-ink transition hover:border-hansan-line-strong"
          >
            HQ overview
          </Link>
        </div>
      </div>
    </main>
  );
}
