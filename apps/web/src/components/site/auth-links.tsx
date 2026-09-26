"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LinkButton } from "@/components/ui";
import type { Locale } from "@/i18n/config";

// Public pages are static, so the server cannot know who is signed in. The Supabase session cookie
// is readable here; it only switches the links (the account pages check the session properly).
const hasSession = () => /(?:^|;\s*)sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie);
const subscribe = () => () => {};

export function AuthLinks({ lang, t, variant }: { lang: Locale; t: { signIn: string; signUp: string; myAccount: string }; variant: "bar" | "menu" }) {
  const signedIn = useSyncExternalStore(subscribe, hasSession, () => false);
  if (variant === "bar") {
    return signedIn ? (
      <LinkButton href={`/${lang}/account`}>{t.myAccount}</LinkButton>
    ) : (
      <>
        <Link href={`/${lang}/sign-in`} className="rounded-md px-3 py-2 font-semibold text-leaf-700 hover:bg-leaf-50">
          {t.signIn}
        </Link>
        <LinkButton href={`/${lang}/sign-up`}>{t.signUp}</LinkButton>
      </>
    );
  }
  return signedIn ? (
    <li className="mt-2 border-t border-line pt-2">
      <Link href={`/${lang}/account`} className="block rounded-md bg-leaf-600 px-3 py-3 text-center font-semibold text-white">
        {t.myAccount}
      </Link>
    </li>
  ) : (
    <>
      <li className="mt-2 border-t border-line pt-2">
        <Link href={`/${lang}/sign-in`} className="block rounded-md px-3 py-3 font-semibold text-leaf-700 hover:bg-leaf-50">
          {t.signIn}
        </Link>
      </li>
      <li>
        <Link href={`/${lang}/sign-up`} className="block rounded-md bg-leaf-600 px-3 py-3 text-center font-semibold text-white">
          {t.signUp}
        </Link>
      </li>
    </>
  );
}
