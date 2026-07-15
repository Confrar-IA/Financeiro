import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth-constants";

const publicPaths = ["/login", "/register"];
const publicExactPaths = ["/sw.js", "/manifest.webmanifest", "/manifest.json"];

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = getSecret();
  if (!token || !secret) return false;

  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    publicExactPaths.includes(pathname) ||
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isApi = pathname.startsWith("/api/");
  const authenticated = await hasValidSession(request);

  if (isAuthApi) {
    return NextResponse.next();
  }

  if (isApi && !authenticated) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!isPublic && !authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && authenticated) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/";
    appUrl.search = "";
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};
