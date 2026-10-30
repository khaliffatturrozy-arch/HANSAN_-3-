import * as React from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="border-b border-hansan-line pb-4">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hansan-ink-muted">{eyebrow}</p>}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-black tracking-tight text-hansan-ink">{title}</h1>
        {actions}
      </div>
      {description && <p className="mt-2 max-w-2xl text-sm text-hansan-ink-muted">{description}</p>}
    </header>
  );
}
