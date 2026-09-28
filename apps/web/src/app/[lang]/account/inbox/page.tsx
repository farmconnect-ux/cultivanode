import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkAllRead } from "@/components/account/booking-forms";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill, formatDateTime, formatDay } from "@/lib/text";

type Note = {
  id: string;
  kind: string;
  booking_id: string | null;
  data: { title?: string; job_date?: string; name?: string };
  read_at: string | null;
  created_at: string;
};

export default async function InboxPage({ params }: PageProps<"/[lang]/account/inbox">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const t = await getDictionary(lang);
  const m = t.acct.inbox;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, booking_id, data, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const notes = (data ?? []) as unknown as Note[];
  const unread = notes.some((n) => !n.read_at);

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{m.title}</h1>
        <p className="mt-2 text-muted">{m.intro}</p>
      </div>
      {unread && <MarkAllRead lang={lang} t={t.acct} />}
      {notes.length === 0 ? (
        <p className="text-muted">{m.none}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => {
            const template = m.kinds[n.kind as keyof typeof m.kinds];
            if (!template) return null;
            const text = fill(template, {
              name: n.data.name || "—",
              title: n.data.title ?? "",
              date: n.data.job_date ? formatDay(n.data.job_date, lang) : "",
            });
            return (
              <li key={n.id}>
                <Card className={n.read_at ? "flex flex-col gap-1" : "flex flex-col gap-1 border-l-4 border-l-leaf-600"}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className={n.read_at ? "" : "font-semibold"}>{text}</p>
                    {!n.read_at && <Badge className="bg-leaf-100 text-leaf-800">{m.unread}</Badge>}
                  </div>
                  <p className="text-sm text-muted">{formatDateTime(n.created_at, lang)}</p>
                  {n.booking_id && (
                    <Link href={`/${lang}/account/bookings/${n.booking_id}`} className="self-start font-semibold text-leaf-700 underline">
                      {m.open}
                    </Link>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
