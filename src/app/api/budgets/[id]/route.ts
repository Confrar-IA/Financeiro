import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetUpdateSchema } from "@/lib/validations/budget";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    const budget = await prisma.budget.findFirst({
      where: { id, userId: session.userId },
      include: { category: true },
    });

    if (!budget) {
      return jsonError("Orçamento não encontrado", 404);
    }

    return jsonOk(budget);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const body = await request.json();
    const data = budgetUpdateSchema.parse(body);

    if (Object.keys(data).length === 0) {
      return jsonError("Nenhum campo para atualizar");
    }

    const existing = await prisma.budget.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return jsonError("Orçamento não encontrado", 404);
    }

    const nextCategoryId = data.categoryId ?? existing.categoryId;
    const nextMonth = data.month ?? existing.month;
    const nextYear = data.year ?? existing.year;

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: session.userId },
      });

      if (!category) {
        return jsonError("Categoria não encontrada", 404);
      }

      if (category.type !== "expense") {
        return jsonError("Orçamentos só podem usar categorias de despesa");
      }
    }

    const conflict = await prisma.budget.findFirst({
      where: {
        id: { not: id },
        userId: session.userId,
        categoryId: nextCategoryId,
        month: nextMonth,
        year: nextYear,
      },
    });

    if (conflict) {
      return jsonError(
        "Já existe um orçamento para esta categoria no período selecionado",
        409,
      );
    }

    const budget = await prisma.budget.update({
      where: { id },
      data,
      include: { category: true },
    });

    return jsonOk(budget);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    const existing = await prisma.budget.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return jsonError("Orçamento não encontrado", 404);
    }

    await prisma.budget.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
