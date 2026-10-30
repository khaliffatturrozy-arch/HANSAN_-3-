import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string | null;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, trailing, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wide text-hansan-ink-muted">
            {label}
          </label>
        )}
        <div className={trailing ? "relative" : undefined}>
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-sm border border-hansan-line bg-hansan-surface-raised px-3 py-2 text-sm text-hansan-ink placeholder:text-hansan-ink-muted/60 shadow-neu-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-hansan-blue focus-visible:border-hansan-blue disabled:opacity-50",
              error && "border-hansan-danger focus-visible:ring-hansan-danger",
              trailing ? "pr-16" : undefined,
              className
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {trailing}
        </div>
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-hansan-ink-muted">{hint}</p>
        )}
        {error && (
          <p id={`${inputId}-err`} className="text-xs font-medium text-hansan-danger" role="alert">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

