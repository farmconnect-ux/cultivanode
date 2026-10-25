import { NextResponse, type NextRequest } from "next/server";
import { hasLocale, localeCookie, localeFromAcceptLanguage, type Locale } from "@/i18n/config";
import { ADMIN_SIGN_IN } from "@/lib/admin/paths";
import { updateSession } from "@/lib/supabase/session";

export const GITHUB_APK_LATEST_URL =
  "https://github.com/farmconnect-ux/cultivanode-android/releases/latest/download/cultivanode.apk";

// Admin console and the account area: keep the Supabase session fresh and require sign-in.
// Direct APK download routes: redirect straight to the latest public GitHub release.
// Everything else: send visitors without a language in the URL to /en/... or /yo/...
// (the language they chose before, then their browser setting, then English).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Direct APK download entry points
  if (
    pathname === "/download/android" ||
    pathname === "/en/download/android" ||
    pathname === "/yo/download/android"
  ) {
    return NextResponse.redirect(GITHUB_APK_LATEST_URL, { status: 302 });
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return updateSession(request, ADMIN_SIGN_IN);
  }

  const [, first = "", section = ""] = pathname.split("/");
  if (hasLocale(first)) {
    // Signed-in areas: refresh the session and send signed-out visitors to that language's sign-in page.
    if (section === "account" || section === "onboarding") return updateSession(request, `/${first}/sign-in`);
    return NextResponse.next();
  }

  const saved = request.cookies.get(localeCookie)?.value ?? "";
  const locale: Locale = hasLocale(saved) ? saved : localeFromAcceptLanguage(request.headers.get("accept-language"));

  if (pathname === "/app" || pathname === "/download") {
    return NextResponse.redirect(new URL(`/${locale}/download`, request.url), { status: 302 });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (icons, robots.txt, sitemap.xml).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
