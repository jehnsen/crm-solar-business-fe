import { NextResponse, type NextRequest } from "next/server";

/**
 * Route gate. Runs on the edge, before any page or layout, so an
 * unauthenticated visitor never gets far enough to trigger `getReferenceData()`
 * in the root layout — which would otherwise throw an `ApiError` and render
 * the framework's error page instead of a login screen.
 *
 * Named `proxy.ts` per Next 16's rename of the `middleware.ts` convention —
 * the exported function is renamed too, from `middleware` to `proxy`.
 *
 * This only checks whether the session cookie *exists* — it can't verify the
 * token against the backend from the edge without an extra round trip on
 * every navigation. A token Laravel has since revoked still gets past this
 * gate and fails at the first `apiGet()` call instead; that failure is
 * loud (`ApiError`), not silent, which is the property that matters here.
 */

const SESSION_COOKIE_NAME = "solar_session";
const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasSession && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - _next/static, _next/image (framework assets)
     *  - favicon.ico
     *  - anything under /api (route handlers do their own auth, and the
     *    login route handler must stay reachable while signed out)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
