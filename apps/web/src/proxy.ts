import { NextResponse, type NextRequest } from "next/server";
import { hasLocale, localeCookie, localeFromAcceptLanguage, type Locale } from "@/i18n/config";
import { ADMIN_SIGN_IN } from "@/lib/admin/paths";
import { updateSession } from "@/lib/supabase/session";

// Admin console: keep the Supabase session fresh and require sign-in.
// Everything else: send visitors without a language in the URL to /en/... or /yo/...
// (the language they chose before, then their browser setting, then English).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return updateSession(request, ADMIN_SIGN_IN);
  }

  const first = pathname.split("/")[1] ?? "";
  if (hasLocale(first)) return NextResponse.next();

  const saved = request.cookies.get(localeCookie)?.value ?? "";
  const locale: Locale = hasLocale(saved) ? saved : localeFromAcceptLanguage(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (icons, robots.txt, sitemap.xml).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
