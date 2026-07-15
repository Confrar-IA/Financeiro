import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { isPaymentMethodAllowed } from "@/lib/payment-methods";
import { prisma } from "@/lib/prisma";
import { buildTransactionSeries } from "@/lib/transaction-series";
import {
  transactionQuerySchema,
  transactionSchema,
} from "@/lib/validations/transaction";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const query = transactionQuerySchema.parse({
      type: searchParams.get("type") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      paymentMethod: searchParams.get("paymentMethod") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.userId,
        type: query.type,
        categoryId: query.categoryId,
        paymentMethod: query.paymentMethod,
        date:
          query.from || query.to
            ? {
                ...(query.from ? { gte: query.from } : {}),
                ...(query.to ? { lte: query.to } : {}),
              }
            : undefined,
      },
      include: {
        category: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: query.limit ?? 100,
    });

    return jsonOk(transactions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = transactionSchema.parse(body);

    if (!isPaymentMethodAllowed(data.type, data.paymentMethod)) {
      return jsonError("Método de pagamento inválido para o tipo", 400);
    }

    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: session.userId },
    });

    if (!category) {
      return jsonError("Categoria não encontrada", 404);
    }

    if (category.type !== data.type) {
      return jsonError(
        `A categoria "${category.name}" é do tipo ${category.type}`,
        400,
      );
    }

    const series = buildTransactionSeries({
      description: data.description,
      amount: data.amount,
      type: data.type,
      date: data.date,
      categoryId: data.categoryId,
      paymentMethod: data.paymentMethod,
      userId: session.userId,
      scheduleType: data.scheduleType,
      recurrenceMonths: data.recurrenceMonths,
      installments: data.installments,
    });

    const created = await prisma.$transaction(
      series.map((item) =>
        prisma.transaction.create({
          data: item,
          include: {
            category: true,
          },
        }),
      ),
    );

    return jsonOk(
      {
        count: created.length,
        transactions: created,
        first: created[0],
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
