import * as React from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-sm border border-dashed border-hansan-line bg-hansan-surface-soft p-8 text-center", className)}>
      <p className="text-sm font-semibold text-hansan-ink">{title}</p>
      {description && <p className="mt-1 text-xs text-hansan-ink-muted">{description}</p>}
    </div>
  );
}
