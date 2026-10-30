import * as React from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
}

export function Card({ className, raised, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-sm border border-hansan-line bg-hansan-surface-raised p-4 sm:p-5",
        raised && "shadow-neu-raised-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex items-center justify-between gap-2", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-bold tracking-tight text-hansan-ink", className)} {...props}>{children}</h3>;
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-hansan-ink-muted", className)} {...props}>{children}</p>;
}
