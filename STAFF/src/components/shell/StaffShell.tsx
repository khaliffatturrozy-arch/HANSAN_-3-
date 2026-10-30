"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/hq", implemented: true },
  { label: "Kitchen KDS", href: "/hq/kitchen", implemented: true },
  { label: "Bar KDS", href: "/hq/bar", implemented: true },
];

export function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navLinks = NAV_ITEMS.filter((i) => i.implemented).map((item) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={[
          "flex items-center rounded-sm px-3 py-2 text-sm font-semibold transition",
          active
            ? "bg-hansan-orange/10 text-hansan-orange border border-hansan-orange/30"
            : "text-hansan-ink hover:bg-hansan-surface-sunken border border-transparent",
        ].join(" ")}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <div className="min-h-screen bg-hansan-surface-soft text-hansan-ink">
      <aside className="fixed inset-y-0 left-0 z-sidebar hidden w-[var(--shell-sidebar-w)] border-r border-hansan-line bg-hansan-surface-raised lg:block" aria-label="Primary navigation">
        <div className="flex h-[var(--shell-header-h)] items-center gap-3 border-b border-hansan-line px-5">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-sm border border-hansan-ink bg-hansan-orange text-sm font-black text-white shadow-neu-raised-sm">H</span>
          <span className="text-sm font-black tracking-tight text-hansan-ink">HANSAN Staff</span>
        </div>
        <nav className="flex flex-col gap-1 p-4">{navLinks}</nav>
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-drawer lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" className="absolute inset-0 bg-hansan-ink/40" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[80vw] border-r border-hansan-line bg-hansan-surface-raised shadow-neu-raised">
            <div className="flex h-[var(--shell-header-h)] items-center justify-between border-b border-hansan-line px-5">
              <span className="text-sm font-black tracking-tight text-hansan-ink">HANSAN Staff</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-xs px-2 py-1 text-xs font-semibold text-hansan-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-hansan-blue" aria-label="Close navigation menu">Close</button>
            </div>
            <nav className="flex flex-col gap-1 p-4">{navLinks}</nav>
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-header flex h-[var(--shell-header-h)] items-center gap-3 border-b border-hansan-line bg-hansan-surface-raised/95 px-4 backdrop-blur sm:px-6 lg:ml-[var(--shell-sidebar-w)]">
        <button type="button" className="inline-flex items-center justify-center rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm font-semibold text-hansan-ink lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-hansan-blue" aria-label="Open navigation menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>Menu</button>
        <h1 className="text-base font-bold tracking-tight text-hansan-ink sm:text-lg">Staff</h1>
      </header>
      <main className="lg:ml-[var(--shell-sidebar-w)]">
        <div className="mx-auto max-w-[var(--shell-content-max)] px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}


