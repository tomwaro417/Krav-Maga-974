import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  );
}

function isApi(pathname: string) {
  return pathname.startsWith("/api/");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const needsAuth = pathname.startsWith("/app") || pathname.startsWith("/admin") || pathname.startsWith("/api/");
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    if (isApi(pathname)) return new NextResponse("Unauthorized", { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifySession(token);
  if (!session) {
    if (isApi(pathname)) return new NextResponse("Unauthorized", { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminArea && session.role !== "ADMIN") {
    if (isApi(pathname)) return new NextResponse("Forbidden", { status: 403 });
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
