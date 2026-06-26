import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, id, maxLength, showCount, value, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
      if (typeof value === "string") {
        setCount(value.length);
      }
    }, [value]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          maxLength={maxLength}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
            error
              ? "border-rose-500 focus-visible:ring-rose-500"
              : "border-slate-200 dark:border-slate-700",
            className
          )}
          ref={ref}
          value={value}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {error && (
              <p id={`${textareaId}-error`} className="text-xs text-rose-500">
                {error}
              </p>
            )}
            {!error && hint && (
              <p id={`${textareaId}-hint`} className="text-xs text-slate-500">
                {hint}
              </p>
            )}
          </div>
          {showCount && maxLength && (
            <span className="text-xs text-slate-400">
              {count}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
