import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return jsonError("E-mail ou senha inválidos", 401);
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      return jsonError("E-mail ou senha inválidos", 401);
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    return jsonOk({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
