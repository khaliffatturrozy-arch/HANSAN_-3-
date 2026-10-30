"use client";
import * as React from "react";
import Link from "next/link";

export function POSShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hansan-surface-soft text-hansan-ink">
      <header className="sticky top-0 z-header flex h-[var(--shell-header-h)] items-center justify-between gap-3 border-b border-hansan-line bg-hansan-surface-raised/95 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-sm border border-hansan-ink bg-hansan-orange text-sm font-black text-white shadow-neu-raised-sm">H</span>
          <span className="text-sm font-black tracking-tight text-hansan-ink">HANSAN POS</span>
        </div>
        <Link
          href="/login"
          className="rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-xs font-semibold text-hansan-ink transition hover:border-hansan-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-hansan-blue"
        >
          Sign out
        </Link>
      </header>
      <main className="mx-auto max-w-[var(--shell-content-max)] px-4 py-4 sm:px-6 sm:py-6">{children}</main>
    </div>
  );
}
