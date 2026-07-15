"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/types/finance";

export type DashboardPeriodState = {
  period: DashboardPeriod;
  from: string;
  to: string;
};

type DashboardPeriodFilterProps = {
  value: DashboardPeriodState;
  onChange: (value: DashboardPeriodState) => void;
};

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "month", label: "Mês atual" },
  { value: "year", label: "Ano atual" },
  { value: "custom", label: "Personalizado" },
  { value: "all", label: "Todo período" },
];

export function DashboardPeriodFilter({
  value,
  onChange,
}: DashboardPeriodFilterProps) {
  return (
    <div className="min-w-0 space-y-3 rounded-2xl border border-border/70 bg-card/70 p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={value.period === option.value ? "default" : "outline"}
            className={cn(
              "h-10 min-w-0 px-2 text-xs sm:h-8 sm:flex-none sm:px-3 sm:text-sm",
              value.period === option.value && "shadow-sm",
            )}
            onClick={() => onChange({ ...value, period: option.value })}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {value.period === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dashboard-from">De</Label>
            <Input
              id="dashboard-from"
              type="date"
              value={value.from}
              onChange={(event) =>
                onChange({ ...value, from: event.target.value })
              }
              className="h-11 text-base md:h-8 md:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dashboard-to">Até</Label>
            <Input
              id="dashboard-to"
              type="date"
              value={value.to}
              onChange={(event) =>
                onChange({ ...value, to: event.target.value })
              }
              className="h-11 text-base md:h-8 md:text-sm"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
