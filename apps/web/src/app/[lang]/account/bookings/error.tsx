"use client";

// Fallback when a bookings page fails to load (network drop on 3G, database unavailable). The account menu stays
// usable; "Try again" re-renders the segment. Wording lives here because client error boundaries cannot load the
// server dictionaries.
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui";

const TEXT = {
  en: { title: "This page did not load", body: "Check your connection and try again. Your bookings are safe.", retry: "Try again", back: "All bookings" },
  yo: { title: "Ojú-ìwé yìí kò ṣí", body: "Ṣàyẹ̀wò ìsopọ̀ rẹ kí o sì tún gbìyànjú. Àwọn iṣẹ́ rẹ wà ní ààbò.", retry: "Tún gbìyànjú", back: "Gbogbo iṣẹ́" },
} as const;

export default function BookingsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const t = lang === "yo" ? TEXT.yo : TEXT.en;
  useEffect(() => {
    console.error("bookings_page_error", error.digest ?? "");
  }, [error]);
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-lg border-2 border-danger/40 bg-red-50 p-5">
      <h1 className="text-2xl font-bold text-danger">{t.title}</h1>
      <p>{t.body}</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => retry()}>{t.retry}</Button>
        <Link href={`/${lang === "yo" ? "yo" : "en"}/account/bookings`} className="inline-flex min-h-11 items-center font-semibold text-leaf-700 underline">
          {t.back}
        </Link>
      </div>
    </div>
  );
}
