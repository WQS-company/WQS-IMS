import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: "primary" | "success" | "warning" | "danger";
  indeterminate?: boolean;
  showLabel?: boolean;
  showPercentage?: boolean;
}

const colorClasses = {
  primary: "bg-gradient-to-r from-indigo-600 to-violet-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

function Progress({
  className,
  value = 0,
  max = 100,
  color = "primary",
  indeterminate = false,
  showLabel = false,
  showPercentage = false,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)} {...props}>
      {(showLabel || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between">
          {showLabel && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Progress
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            colorClasses[color],
            indeterminate && "animate-indeterminate w-full"
          )}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export { Progress };
