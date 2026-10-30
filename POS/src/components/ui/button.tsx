import * as React from "react";
import { cn } from "@/lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, disabled, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 rounded-sm border px-4 py-2 text-sm font-semibold transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-hansan-blue disabled:cursor-not-allowed disabled:opacity-50";
    const variants: Record<string, string> = {
      primary: "bg-hansan-orange text-white border-hansan-ink shadow-neu-raised-sm hover:translate-y-[-1px]",
      secondary: "bg-hansan-surface-raised text-hansan-ink border-hansan-line hover:border-hansan-line-strong",
      ghost: "bg-transparent text-hansan-ink border-transparent hover:bg-hansan-surface-sunken",
    };
    return (
      <button ref={ref} className={cn(base, variants[variant], className)} disabled={disabled || loading} {...props}>
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
