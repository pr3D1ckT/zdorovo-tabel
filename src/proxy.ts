import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/session";

export default async function proxy(request: NextRequest) {
  const session = await getSession();

  const { pathname } = request.nextUrl;

  if (!session && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session) {
    if (pathname.startsWith("/login") || pathname === "/") {
      if (session.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/tracker", request.url));
      }
    }

    if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/tracker", request.url));
    }

    if (pathname.startsWith("/tracker") && session.role !== "WORKER") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
