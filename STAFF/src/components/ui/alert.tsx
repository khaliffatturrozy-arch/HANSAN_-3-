import * as React from "react";
import { cn } from "@/lib/cn";

export interface AlertProps {
  variant?: "info" | "danger" | "success";
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = "info", children, className }: AlertProps) {
  const variants: Record<string, string> = {
    info: "border-hansan-line bg-hansan-surface-raised text-hansan-ink",
    danger: "border-hansan-danger/40 bg-hansan-danger/5 text-hansan-danger",
    success: "border-hansan-success/40 bg-hansan-success/5 text-hansan-success",
  };
  return (
    <div role="alert" className={cn("rounded-sm border px-3 py-2 text-sm", variants[variant], className)}>
      {children}
    </div>
  );
}
