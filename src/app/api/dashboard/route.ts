import {
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  dashboardQuerySchema,
  type DashboardPeriod,
} from "@/lib/validations/dashboard";

type PeriodRange = {
  from?: Date;
  to?: Date;
  label: string;
  period: DashboardPeriod;
};

function resolvePeriodRange(
  period: DashboardPeriod,
  from?: string,
  to?: string,
): PeriodRange {
  const now = new Date();

  if (period === "month") {
    return {
      from: startOfMonth(now),
      to: endOfMonth(now),
      label: format(now, "MMMM yyyy", { locale: ptBR }),
      period,
    };
  }

  if (period === "year") {
    return {
      from: startOfYear(now),
      to: endOfYear(now),
      label: format(now, "yyyy"),
      period,
    };
  }

  if (period === "custom" && from && to) {
    const fromDate = startOfDay(new Date(`${from}T00:00:00`));
    const toDate = endOfDay(new Date(`${to}T00:00:00`));

    return {
      from: fromDate,
      to: toDate,
      label: `${format(fromDate, "dd/MM/yyyy")} – ${format(toDate, "dd/MM/yyyy")}`,
      period,
    };
  }

  return {
    label: "Todo o período",
    period: "all",
  };
}

function buildComparisonBuckets(range: PeriodRange) {
  if (range.from && range.to) {
    return eachMonthOfInterval({ start: range.from, end: range.to }).map(
      (monthDate) => ({
        key: format(monthDate, "yyyy-MM"),
        label:
          range.period === "year"
            ? format(monthDate, "MMM", { locale: ptBR })
            : format(monthDate, "MMM/yy", { locale: ptBR }),
        income: 0,
        expense: 0,
        mode: "month" as const,
      }),
    );
  }

  const now = new Date();
  const fallbackStart = startOfYear(new Date(now.getFullYear() - 4, 0, 1));
  return eachYearOfInterval({
    start: fallbackStart,
    end: endOfYear(now),
  }).map((yearDate) => ({
    key: format(yearDate, "yyyy"),
    label: format(yearDate, "yyyy"),
    income: 0,
    expense: 0,
    mode: "year" as const,
  }));
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const parsed = dashboardQuerySchema.safeParse({
      period: searchParams.get("period") ?? "month",
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError("Período inválido", 400, parsed.error.flatten());
    }

    const range = resolvePeriodRange(
      parsed.data.period,
      parsed.data.from,
      parsed.data.to,
    );

    const userId = session.userId;
    const dateFilter =
      range.from || range.to
        ? {
            ...(range.from ? { gte: range.from } : {}),
            ...(range.to ? { lte: range.to } : {}),
          }
        : undefined;

    const [periodTransactions, recentTransactions, historyForChart] =
      await Promise.all([
        prisma.transaction.findMany({
          where: {
            userId,
            ...(dateFilter ? { date: dateFilter } : {}),
          },
          include: {
            category: true,
          },
        }),
        prisma.transaction.findMany({
          where: {
            userId,
            ...(dateFilter ? { date: dateFilter } : {}),
          },
          include: {
            category: true,
          },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 5,
        }),
        prisma.transaction.findMany({
          where: {
            userId,
            ...(dateFilter ? { date: dateFilter } : {}),
          },
          select: {
            amount: true,
            type: true,
            date: true,
          },
        }),
      ]);

    const income = periodTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);

    const expense = periodTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    const expensesByCategoryMap = new Map<
      string,
      { name: string; color: string; value: number }
    >();

    for (const transaction of periodTransactions) {
      if (transaction.type !== "expense") continue;

      const current = expensesByCategoryMap.get(transaction.categoryId);
      if (current) {
        current.value += transaction.amount;
      } else {
        expensesByCategoryMap.set(transaction.categoryId, {
          name: transaction.category.name,
          color: transaction.category.color,
          value: transaction.amount,
        });
      }
    }

    const expensesByCategory = Array.from(expensesByCategoryMap.values()).sort(
      (a, b) => b.value - a.value,
    );

    let buckets = buildComparisonBuckets(range);

    // For "all", rebuild years/months based on actual data range
    if (range.period === "all" && historyForChart.length > 0) {
      const dates = historyForChart.map((item) => item.date);
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
      const years = eachYearOfInterval({
        start: startOfYear(minDate),
        end: endOfYear(maxDate),
      });

      if (years.length > 1) {
        buckets = years.map((yearDate) => ({
          key: format(yearDate, "yyyy"),
          label: format(yearDate, "yyyy"),
          income: 0,
          expense: 0,
          mode: "year" as const,
        }));
      } else {
        buckets = eachMonthOfInterval({
          start: startOfMonth(minDate),
          end: endOfMonth(maxDate),
        }).map((monthDate) => ({
          key: format(monthDate, "yyyy-MM"),
          label: format(monthDate, "MMM/yy", { locale: ptBR }),
          income: 0,
          expense: 0,
          mode: "month" as const,
        }));
      }
    }

    for (const transaction of historyForChart) {
      const key =
        buckets[0]?.mode === "year"
          ? format(transaction.date, "yyyy")
          : format(transaction.date, "yyyy-MM");

      const bucket = buckets.find((item) => item.key === key);
      if (!bucket) continue;

      if (transaction.type === "income") {
        bucket.income += transaction.amount;
      } else {
        bucket.expense += transaction.amount;
      }
    }

    return jsonOk({
      period: range.period,
      periodLabel: range.label,
      from: range.from?.toISOString() ?? null,
      to: range.to?.toISOString() ?? null,
      summary: {
        balance: income - expense,
        income,
        expense,
        periodLabel: range.label,
      },
      expensesByCategory,
      monthlyComparison: buckets.map(({ label, income: i, expense: e }) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        income: i,
        expense: e,
      })),
      recentTransactions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
