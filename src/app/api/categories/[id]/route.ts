import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categoryUpdateSchema } from "@/lib/validations/category";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    const category = await prisma.category.findFirst({
      where: { id, userId: session.userId },
    });

    if (!category) {
      return jsonError("Categoria não encontrada", 404);
    }

    return jsonOk(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const body = await request.json();
    const data = categoryUpdateSchema.parse(body);

    if (Object.keys(data).length === 0) {
      return jsonError("Nenhum campo para atualizar");
    }

    const existing = await prisma.category.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return jsonError("Categoria não encontrada", 404);
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return jsonOk(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    const existing = await prisma.category.findFirst({
      where: { id, userId: session.userId },
      include: { _count: { select: { transactions: true } } },
    });

    if (!existing) {
      return jsonError("Categoria não encontrada", 404);
    }

    if (existing._count.transactions > 0) {
      return jsonError(
        "Não é possível excluir categoria com transações vinculadas",
        409,
      );
    }

    await prisma.category.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
