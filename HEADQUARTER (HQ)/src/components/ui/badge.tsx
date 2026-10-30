import * as React from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps {
  children: React.ReactNode;
  tone?: "default" | "orange" | "blue" | "success" | "danger" | "muted";
  className?: string;
}

export function Badge({ children, tone = "default", className }: BadgeProps) {
  const tones: Record<string, string> = {
    default: "border-hansan-line bg-hansan-surface-raised text-hansan-ink",
    orange: "border-hansan-orange/40 bg-hansan-orange/10 text-hansan-orange",
    blue: "border-hansan-blue/40 bg-hansan-blue/10 text-hansan-blue",
    success: "border-hansan-success/40 bg-hansan-success/10 text-hansan-success",
    danger: "border-hansan-danger/40 bg-hansan-danger/10 text-hansan-danger",
    muted: "border-hansan-line bg-hansan-surface-sunken text-hansan-ink-muted",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
