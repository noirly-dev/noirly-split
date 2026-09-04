import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isLanding = pathname === "/";
  const isLogin = pathname === "/login";
  const isLoginPopup =
    pathname === "/login/popup" || pathname === "/login/popup-complete";
  const isInvite = pathname.startsWith("/invites/");
  const isPublic = isLanding || isLogin || isLoginPopup || isInvite;

  const session = await auth();

  if (!session?.user?.id && !isPublic) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (session?.user?.id && isLogin) {
    const next = request.nextUrl.searchParams.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (session?.user?.id && isLanding) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
