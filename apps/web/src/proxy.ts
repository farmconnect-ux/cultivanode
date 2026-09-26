import { NextResponse, type NextRequest } from "next/server";
import { hasLocale, localeCookie, localeFromAcceptLanguage, type Locale } from "@/i18n/config";

// Sends visitors without a language in the URL to /en/... or /yo/...
// Order: the language they chose before (cookie), then their browser setting, then English.
// Supabase session refresh joins this file in M1, when sign-in arrives.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
