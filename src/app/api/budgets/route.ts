import { endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validations/budget";

function resolvePeriod(searchParams: URLSearchParams) {
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 2000
  ) {
    throw new Error("INVALID_PERIOD");
  }

  return { month, year };
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    let month: number;
    let year: number;

    try {
      ({ month, year } = resolvePeriod(searchParams));
    } catch {
      return jsonError("Mês ou ano inválido");
    }

    const periodDate = new Date(year, month - 1, 1);
    const periodStart = startOfMonth(periodDate);
    const periodEnd = endOfMonth(periodDate);

    const [budgets, expenses] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: session.userId, month, year },
        include: { category: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.transaction.findMany({
        where: {
          userId: session.userId,
          type: "expense",
          date: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        select: {
          categoryId: true,
          amount: true,
        },
      }),
    ]);

    const spentByCategory = new Map<string, number>();
    for (const expense of expenses) {
      spentByCategory.set(
        expense.categoryId,
        (spentByCategory.get(expense.categoryId) ?? 0) + expense.amount,
      );
    }

    const items = budgets.map((budget) => {
      const spent = spentByCategory.get(budget.categoryId) ?? 0;
      const remaining = budget.limitAmount - spent;
      const percentage =
        budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        status:
          percentage >= 100
            ? ("over" as const)
            : percentage >= 70
              ? ("warning" as const)
              : ("ok" as const),
      };
    });

    const totals = items.reduce(
      (acc, item) => {
        acc.limit += item.limitAmount;
        acc.spent += item.spent;
        return acc;
      },
      { limit: 0, spent: 0 },
    );

    return jsonOk({
      month,
      year,
      monthLabel: format(periodDate, "MMMM yyyy", { locale: ptBR }),
      totals: {
        ...totals,
        remaining: totals.limit - totals.spent,
        percentage: totals.limit > 0 ? (totals.spent / totals.limit) * 100 : 0,
      },
      budgets: items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const now = new Date();
    const data = budgetSchema.parse({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      ...body,
    });

    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: session.userId },
    });

    if (!category) {
      return jsonError("Categoria não encontrada", 404);
    }

    if (category.type !== "expense") {
      return jsonError(
        "Orçamentos só podem ser criados para categorias de despesa",
      );
    }

    const existing = await prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId: session.userId,
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
        },
      },
    });

    if (existing) {
      return jsonError(
        "Já existe um orçamento para esta categoria no período selecionado",
        409,
      );
    }

    const budget = await prisma.budget.create({
      data: {
        ...data,
        userId: session.userId,
      },
      include: { category: true },
    });

    return jsonOk(budget, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
