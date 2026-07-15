"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardPeriodFilter } from "@/components/dashboard/dashboard-period-filter";
import { ExpensesPieChart } from "@/components/dashboard/expenses-pie-chart";
import { IncomeExpenseBarChart } from "@/components/dashboard/income-expense-bar-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";
import { toDateInputValue } from "@/lib/format";
import type { DashboardData, DashboardPeriod } from "@/types/finance";

type PeriodState = {
  period: DashboardPeriod;
  from: string;
  to: string;
};

function buildDashboardUrl(periodState: PeriodState) {
  const params = new URLSearchParams();
  params.set("period", periodState.period);

  if (periodState.period === "custom") {
    if (periodState.from) params.set("from", periodState.from);
    if (periodState.to) params.set("to", periodState.to);
  }

  return `/api/dashboard?${params.toString()}`;
}

export function DashboardView() {
  const today = useMemo(() => new Date(), []);
  const [periodState, setPeriodState] = useState<PeriodState>({
    period: "month",
    from: toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: toDateInputValue(today),
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const canLoad =
    periodState.period !== "custom" ||
    (Boolean(periodState.from) &&
      Boolean(periodState.to) &&
      periodState.from <= periodState.to);

  const loadDashboard = useCallback(async () => {
    if (!canLoad) {
      toast.error("Informe um intervalo de datas válido");
      return;
    }

    setLoading(true);
    try {
      const response = await apiGet<DashboardData>(
        buildDashboardUrl(periodState),
      );
      setData(response);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, [canLoad, periodState]);

  useEffect(() => {
    if (periodState.period === "custom") return;
    void loadDashboard();
  }, [loadDashboard, periodState.period]);

  useEffect(() => {
    if (periodState.period !== "custom") return;
    if (!periodState.from || !periodState.to) return;
    if (periodState.from > periodState.to) return;

    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadDashboard, periodState]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <DashboardPeriodFilter value={periodState} onChange={setPeriodState} />
        <div className="rounded-2xl border border-border/70 bg-card/70 p-10 text-center text-sm text-muted-foreground">
          Carregando dashboard...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <DashboardPeriodFilter value={periodState} onChange={setPeriodState} />
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 text-center">
          <p className="font-medium">Não foi possível carregar os dados</p>
          <Button className="mt-4" onClick={() => void loadDashboard()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Escolha o período para gerar o resumo, os gráficos e as movimentações.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadDashboard()}
          disabled={loading || !canLoad}
        >
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
          Atualizar
        </Button>
      </div>

      <DashboardPeriodFilter value={periodState} onChange={setPeriodState} />

      <SummaryCards summary={data.summary} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ExpensesPieChart
          data={data.expensesByCategory}
          periodLabel={data.periodLabel}
        />
        <IncomeExpenseBarChart
          data={data.monthlyComparison}
          periodLabel={data.periodLabel}
        />
      </div>

      <RecentTransactions transactions={data.recentTransactions} />
    </div>
  );
}
