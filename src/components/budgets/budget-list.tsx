"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { BudgetProgress } from "@/components/budgets/budget-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BudgetWithProgress } from "@/types/finance";

type BudgetListProps = {
  budgets: BudgetWithProgress[];
  loading?: boolean;
  onEdit: (budget: BudgetWithProgress) => void;
  onDelete: (budget: BudgetWithProgress) => void;
};

const statusLabel = {
  ok: "Dentro do limite",
  warning: "Atenção",
  over: "Estourado",
} as const;

export function BudgetList({
  budgets,
  loading = false,
  onEdit,
  onDelete,
}: BudgetListProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/70 p-8 text-center text-sm text-muted-foreground">
        Carregando orçamentos...
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 text-center">
        <p className="font-medium text-foreground">Nenhum orçamento neste mês</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie limites por categoria para acompanhar seus gastos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {budgets.map((budget) => {
        const overAmount =
          budget.status === "over" ? Math.abs(budget.remaining) : 0;

        return (
          <Card
            key={budget.id}
            className="border-border/70 bg-card/80"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: budget.category.color }}
                  />
                  <CardTitle className="truncate text-base">
                    {budget.category.name}
                  </CardTitle>
                </div>
                <CardDescription>
                  Limite {formatCurrency(budget.limitAmount)}
                </CardDescription>
              </div>

              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={cn(
                    budget.status === "ok" &&
                      "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
                    budget.status === "warning" &&
                      "border-amber-500/30 text-amber-700 dark:text-amber-300",
                    budget.status === "over" &&
                      "border-rose-500/30 text-rose-700 dark:text-rose-300",
                  )}
                >
                  {statusLabel[budget.status]}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Abrir ações"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(budget)}>
                      <Pencil className="size-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(budget)}
                    >
                      <Trash2 className="size-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <BudgetProgress
                value={budget.percentage}
                status={budget.status}
              />

              <div className="flex items-end justify-between gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Gasto</p>
                  <p className="font-semibold">{formatCurrency(budget.spent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">
                    {budget.status === "over" ? "Excedente" : "Restante"}
                  </p>
                  <p
                    className={cn(
                      "font-semibold",
                      budget.status === "over"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-foreground",
                    )}
                  >
                    {formatCurrency(
                      budget.status === "over" ? overAmount : budget.remaining,
                    )}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {budget.percentage.toFixed(0)}% do orçamento utilizado
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
