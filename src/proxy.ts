import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  if (!(process.env.NEXT_PUBLIC_API_URL ?? "").trim()) return NextResponse.next();
  const path = request.nextUrl.pathname;
  const publicPage = path === "/icon" || path === "/login" || path === "/tienda" || path.startsWith("/tienda/");
  if (publicPage) return NextResponse.next();

  const cookie = request.cookies.get("retail360_session");
  const upstream = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
  if (cookie && upstream) {
    try {
      const response = await fetch(`${upstream}/api/auth/session`, {
        headers: { Cookie: `retail360_session=${cookie.value}` },
        cache: "no-store", signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const session = await response.json();
        const owner = session.actor ?? session.user;
        if (owner?.mustChangePassword && path !== "/cambiar-contrasena") return NextResponse.redirect(new URL("/cambiar-contrasena",request.url));
        if (!owner?.mustChangePassword && path === "/cambiar-contrasena") return NextResponse.redirect(new URL("/",request.url));
        return NextResponse.next();
      }
    } catch { /* Fail closed when session verification is unavailable. */ }
  }
  const url = new URL("/login", request.url);
  url.searchParams.set("next", `${path}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!aurix-api(?:/|$)|api(?:/|$)|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|pdf)$).*)"],
};
