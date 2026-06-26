import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circle" | "card";
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-800",
        variant === "circle" ? "rounded-full" : variant === "card" ? "rounded-xl" : "rounded-md",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
