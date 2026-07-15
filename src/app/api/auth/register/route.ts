import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import {
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createUserDefaults } from "@/lib/user-defaults";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return jsonError("Já existe uma conta com este e-mail", 409);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    await createUserDefaults(user.id);

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    return jsonOk(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
