"use client";

import { cn } from "@/lib/utils";

type BudgetProgressProps = {
  value: number;
  status: "ok" | "warning" | "over";
  className?: string;
};

const statusStyles = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  over: "bg-rose-500",
} as const;

export function BudgetProgress({
  value,
  status,
  className,
}: BudgetProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          statusStyles[status],
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
