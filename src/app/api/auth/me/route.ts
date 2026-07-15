import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Não autenticado", 401);
    }

    return jsonOk({
      id: session.userId,
      name: session.name,
      email: session.email,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
