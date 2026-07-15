import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { isPaymentMethodAllowed } from "@/lib/payment-methods";
import { prisma } from "@/lib/prisma";
import { transactionUpdateSchema } from "@/lib/validations/transaction";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: session.userId },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      return jsonError("Transação não encontrada", 404);
    }

    return jsonOk(transaction);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const body = await request.json();
    const data = transactionUpdateSchema.parse(body);

    if (Object.keys(data).length === 0) {
      return jsonError("Nenhum campo para atualizar");
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return jsonError("Transação não encontrada", 404);
    }

    const nextType = data.type ?? existing.type;
    const nextCategoryId = data.categoryId ?? existing.categoryId;
    const nextPaymentMethod = data.paymentMethod ?? existing.paymentMethod;

    if (!isPaymentMethodAllowed(nextType, nextPaymentMethod)) {
      return jsonError("Método de pagamento inválido para o tipo", 400);
    }

    const category = await prisma.category.findFirst({
      where: { id: nextCategoryId, userId: session.userId },
    });

    if (!category) {
      return jsonError("Categoria não encontrada", 404);
    }

    if (category.type !== nextType) {
      return jsonError(
        `A categoria "${category.name}" é do tipo ${category.type}`,
        400,
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        paymentMethod: nextPaymentMethod,
      },
      include: {
        category: true,
      },
    });

    return jsonOk(transaction);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return jsonError("Transação não encontrada", 404);
    }

    await prisma.transaction.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
