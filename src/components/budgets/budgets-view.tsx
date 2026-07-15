"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { BudgetList } from "@/components/budgets/budget-list";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { DeleteBudgetDialog } from "@/components/budgets/delete-budget-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type {
  BudgetWithProgress,
  BudgetsResponse,
  Category,
} from "@/types/finance";

function shiftMonth(month: number, year: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

function getStatus(percentage: number): "ok" | "warning" | "over" {
  if (percentage >= 100) return "over";
  if (percentage >= 70) return "warning";
  return "ok";
}

export function BudgetsView() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<BudgetsResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithProgress | null>(null);
  const [deleting, setDeleting] = useState<BudgetWithProgress | null>(null);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<BudgetsResponse>(
        `/api/budgets?month=${month}&year=${year}`,
      );
      setData(response);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os orçamentos",
      );
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    void apiGet<Category[]>("/api/categories?type=expense")
      .then(setCategories)
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar categorias",
        );
      });
  }, []);

  useEffect(() => {
    void loadBudgets();
  }, [loadBudgets]);

  const usedCategoryIds = data?.budgets.map((budget) => budget.categoryId) ?? [];
  const totalsStatus = getStatus(data?.totals.percentage ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Acompanhe quanto do limite mensal já foi consumido por categoria.
          </p>
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-11 shrink-0 md:size-8"
              aria-label="Mês anterior"
              onClick={() => {
                const next = shiftMonth(month, year, -1);
                setMonth(next.month);
                setYear(next.year);
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="min-w-0 flex-1 truncate text-center text-sm font-medium capitalize sm:min-w-40 sm:flex-none">
              {data?.monthLabel ?? "Carregando..."}
            </p>
            <Button
              variant="outline"
              size="icon"
              className="size-11 shrink-0 md:size-8"
              aria-label="Próximo mês"
              onClick={() => {
                const next = shiftMonth(month, year, 1);
                setMonth(next.month);
                setYear(next.year);
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <Button
          className="w-full shrink-0 sm:w-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Novo orçamento
        </Button>
      </div>

      {data ? (
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>Resumo do mês</CardTitle>
            <CardDescription>
              Total dos limites definidos versus o que já foi gasto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BudgetProgress
              value={data.totals.percentage}
              status={totalsStatus}
              className="h-3"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/60 px-3 py-2">
                <p className="text-xs text-muted-foreground">Limite total</p>
                <p className="font-semibold">
                  {formatCurrency(data.totals.limit)}
                </p>
              </div>
              <div className="rounded-xl bg-muted/60 px-3 py-2">
                <p className="text-xs text-muted-foreground">Gasto total</p>
                <p className="font-semibold">
                  {formatCurrency(data.totals.spent)}
                </p>
              </div>
              <div className="rounded-xl bg-muted/60 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {data.totals.remaining < 0 ? "Excedente" : "Restante"}
                </p>
                <p className="font-semibold">
                  {formatCurrency(Math.abs(data.totals.remaining))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <BudgetList
        budgets={data?.budgets ?? []}
        loading={loading}
        onEdit={(budget) => {
          setEditing(budget);
          setFormOpen(true);
        }}
        onDelete={setDeleting}
      />

      <BudgetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        usedCategoryIds={usedCategoryIds}
        budget={editing}
        month={month}
        year={year}
        onSuccess={() => {
          void loadBudgets();
        }}
      />

      <DeleteBudgetDialog
        open={Boolean(deleting)}
        budget={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onSuccess={() => {
          void loadBudgets();
        }}
      />
    </div>
  );
}
