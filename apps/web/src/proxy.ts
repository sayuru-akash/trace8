import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function proxy(request: Request) {
  const session = await auth();
  const { pathname } = new URL(request.url);

  const publicPaths = ["/", "/signin", "/signup", "/api/", "/ingest/"];
  const isPublic = publicPaths.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));

  if (pathname === "/") {
    if (session?.user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Unauthenticated users see the landing page
    return NextResponse.next();
  }

  if (!isPublic && !session?.user) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (
    (pathname === "/signin" || pathname === "/signup") &&
    session?.user
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
