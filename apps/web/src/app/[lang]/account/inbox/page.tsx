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

export default async function InboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ cat?: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const sp = searchParams ? await searchParams : {};
  const currentCat = typeof sp.cat === "string" ? sp.cat : "all";

  const t = await getDictionary(lang);
  const m = t.acct.inbox;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, booking_id, data, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const rawNotes = (data ?? []) as unknown as Note[];
  
  const notes = rawNotes.filter((n) => {
    if (currentCat === "all") return true;
    if (currentCat === "jobs") return n.booking_id || n.kind.includes("booking");
    if (currentCat === "verification") return n.kind.includes("verification") || n.kind.includes("tier");
    if (currentCat === "payments") return n.kind.includes("payment") || n.kind.includes("payout");
    if (currentCat === "disputes") return n.kind.includes("dispute");
    return true;
  });

  const unread = rawNotes.some((n) => !n.read_at);

  const categories = [
    { key: "all", label: "All Notifications" },
    { key: "jobs", label: "Jobs" },
    { key: "verification", label: "Verification" },
    { key: "payments", label: "Payments" },
    { key: "disputes", label: "Disputes" },
    { key: "system", label: "System" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-800">{m.title}</h1>
          <p className="mt-2 text-muted">{m.intro}</p>
        </div>
        {unread && <MarkAllRead lang={lang} t={t.acct} />}
      </div>

      {/* Category Filter Pills (Section 27) */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-line">
        {categories.map((c) => (
          <Link
            key={c.key}
            href={`/${lang}/account/inbox${c.key === "all" ? "" : `?cat=${c.key}`}`}
            className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${
              currentCat === c.key
                ? "bg-leaf-800 text-white"
                : "bg-surface border border-line text-muted hover:text-ink hover:border-leaf-600"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

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
