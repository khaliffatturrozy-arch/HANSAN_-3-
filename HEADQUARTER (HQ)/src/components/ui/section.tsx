import * as React from "react";
import { cn } from "@/lib/cn";

export interface SectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Section({ eyebrow, title, description, children, className }: SectionProps) {
  return (
    <section className={cn("py-6", className)}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hansan-ink-muted">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-black tracking-tight text-hansan-ink">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm text-hansan-ink-muted">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
