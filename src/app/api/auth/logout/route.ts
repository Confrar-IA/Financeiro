import { handleApiError, jsonOk } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearSessionCookie();
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
