"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/types/finance";

type SummaryCardsProps = {
  summary: DashboardSummary;
};

export function SummaryCards({ summary }: SummaryCardsProps) {
  const balancePositive = summary.balance >= 0;

  const cards = [
    {
      title: "Saldo do período",
      value: summary.balance,
      hint: summary.periodLabel,
      icon: Wallet,
      tone: balancePositive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400",
      badgeIcon: balancePositive ? TrendingUp : TrendingDown,
      accent: balancePositive
        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    },
    {
      title: "Receitas",
      value: summary.income,
      hint: summary.periodLabel,
      icon: ArrowUpRight,
      tone: "text-emerald-600 dark:text-emerald-400",
      badgeIcon: TrendingUp,
      accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    {
      title: "Despesas",
      value: summary.expense,
      hint: summary.periodLabel,
      icon: ArrowDownRight,
      tone: "text-rose-600 dark:text-rose-400",
      badgeIcon: TrendingDown,
      accent: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const BadgeIcon = card.badgeIcon;

        return (
          <Card
            key={card.title}
            className="overflow-hidden border-border/70 bg-card/80"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <p className="text-xs capitalize text-muted-foreground/80">
                  {card.hint}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-xl",
                  card.accent,
                )}
              >
                <Icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-3">
                <p className={cn("font-heading text-2xl font-semibold", card.tone)}>
                  {formatCurrency(card.value)}
                </p>
                <BadgeIcon className={cn("mb-1 size-4", card.tone)} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
