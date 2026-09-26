import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@cultivanode/shared";
import { supabaseEnv } from "./env";

/**
 * Refreshes the Supabase session cookie on signed-in areas (the admin console for now) and
 * sends signed-out visitors to the sign-in page. Public website pages never run this, so they stay static.
 */
export async function updateSession(request: NextRequest, signInPath: string): Promise<NextResponse> {
  const { url, key } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() asks Supabase Auth, so a forged or expired cookie never passes.
  const { data } = await supabase.auth.getUser();
  const onSignIn = request.nextUrl.pathname === signInPath;
  if (!data.user && !onSignIn) {
    const to = request.nextUrl.clone();
    to.pathname = signInPath;
    to.search = "";
    return NextResponse.redirect(to);
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
