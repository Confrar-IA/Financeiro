import { handleApiError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/category";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const categories = await prisma.category.findMany({
      where: {
        userId: session.userId,
        ...(type === "income" || type === "expense" ? { type } : {}),
      },
      orderBy: { name: "asc" },
    });

    return jsonOk(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = categorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        ...data,
        userId: session.userId,
      },
    });

    return jsonOk(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
