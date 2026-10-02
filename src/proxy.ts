import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/demo-images") ||
    // Static marketing imagery for the public landing page — needs to be
    // reachable by signed-out visitors, same as demo-images/uploads above.
    pathname.startsWith("/landing") ||
    pathname.startsWith("/_next") ||
    // Public, token-gated outfit sharing and "Ask a Friend" — the friend
    // responding here is never expected to have (or need) a matchin'
    // account. Access control for these is the unguessable token itself,
    // checked inside each route/page, not session auth.
    pathname.startsWith("/s/") ||
    pathname.startsWith("/ask/") ||
    pathname.startsWith("/api/public/");

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|uploads|demo-images).*)"],
};
