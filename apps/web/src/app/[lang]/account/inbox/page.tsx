import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkAllRead } from "@/components/account/booking-forms";
import { openMarketplaceOrderNotification } from "@/actions/notifications";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon, type IconName } from "@/components/ds/icon";
import { MetricCard } from "@/components/live/metric-card";
import { NotificationCentre } from "@/components/screens/notification-centre";
import { Badge } from "@/components/shadcn/badge";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { fill, formatDateTime, formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Notifications" };

type Note = {
  id: string;
  kind: string;
  booking_id: string | null;
  data: { title?: string; job_date?: string; name?: string; item_summary?: string; order_id?: string; order_number?: string; tracking?: string; note?: string };
  read_at: string | null;
  created_at: string;
};

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "jobs", label: "Jobs & bookings" },
  { key: "verification", label: "Verification" },
  { key: "payments", label: "Payments" },
  { key: "disputes", label: "Disputes" },
] as const;

function categoryOf(n: Note): string {
  if (n.kind.includes("marketplace_order")) return "jobs";
  if (n.kind.includes("dispute")) return "disputes";
  if (n.kind.includes("payment") || n.kind.includes("payout")) return "payments";
  if (n.kind.includes("verification") || n.kind.includes("tier") || n.kind.includes("role")) return "verification";
  if (n.booking_id || n.kind.includes("booking")) return "jobs";
  return "system";
}

const LOOK: Record<string, { icon: IconName; bar: string; chip: string }> = {
  disputes: { icon: "gavel", bar: "bg-error", chip: "bg-error-container text-on-error-container" },
  payments: { icon: "account_balance_wallet", bar: "bg-tertiary-container", chip: "bg-tertiary-fixed text-on-tertiary-fixed" },
  verification: { icon: "verified_user", bar: "bg-secondary", chip: "bg-secondary-container/60 text-on-secondary-container" },
  jobs: { icon: "agriculture", bar: "bg-primary-container", chip: "bg-surface-container-high text-primary" },
  system: { icon: "notifications", bar: "bg-outline-variant", chip: "bg-surface-container text-on-surface-variant" },
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
  await requireAccount(lang, { customer: true });
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
  const all = (data ?? []) as unknown as Note[];
  const notes = currentCat === "all" ? all : all.filter((n) => categoryOf(n) === currentCat);
  const unread = all.filter((n) => !n.read_at).length;
  const count = (k: string) => (k === "all" ? all.length : all.filter((n) => categoryOf(n) === k).length);

  return (
    <NotificationCentre
      lang={lang}
      slots={{
        actions: (
          <div className="flex flex-wrap items-center gap-space-sm">
            {unread > 0 && <MarkAllRead lang={lang} t={t.acct} />}
            <Link href={`/${lang}/account/settings`} className="flex items-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-md py-2 font-label-md text-label-md text-on-surface shadow-sm hover:bg-surface-container-low">
              <Icon name="tune" className="text-base" /> Preferences
            </Link>
          </div>
        ),
        kpis: (
          <div className="mb-space-xl grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Unread" value={unread} icon="mark_email_unread" iconTone="bg-error-container/60 text-error" foot={`${all.length} in the last 100 messages`} />
            <MetricCard label="Jobs & bookings" value={count("jobs")} icon="agriculture" foot="Requests, acceptances, proof of work" />
            <MetricCard label="Verification" value={count("verification")} icon="verified_user" iconTone="bg-primary-fixed/60 text-on-primary-fixed-variant" foot="Roles, documents and tiers" />
            <MetricCard label="Payments & disputes" value={count("payments") + count("disputes")} icon="account_balance_wallet" iconTone="bg-tertiary-fixed/50 text-tertiary-container" foot="Marked payments and contested jobs" />
          </div>
        ),
        filters: (
          <div className="mb-space-lg rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
            <nav aria-label="Filter notifications" className="no-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-surface-container-low p-1">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.key}
                  href={`/${lang}/account/inbox${c.key === "all" ? "" : `?cat=${c.key}`}`}
                  aria-current={currentCat === c.key ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 font-label-md text-label-md transition-all",
                    currentCat === c.key ? "bg-surface-container-lowest text-primary shadow-card" : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {c.label} <span className="ml-0.5 text-outline">({count(c.key)})</span>
                </Link>
              ))}
            </nav>
          </div>
        ),
        stream: (
          <div className="mb-space-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-space-xs font-headline-md text-headline-md text-on-surface">
                <Icon name="stream" className="text-secondary" /> {m.title}
              </h2>
              <span className="text-label-sm text-on-surface-variant">{m.intro}</span>
            </div>
            {notes.length === 0 ? (
              <EmptyState icon="notifications" title={m.none} />
            ) : (
              notes.map((n) => {
                const cat = categoryOf(n);
                const look = LOOK[cat] ?? LOOK.system!;
                const text = fill(m.kinds[n.kind as keyof typeof m.kinds] ?? m.unknown, {
                  name: n.data.name || "—",
                  title: n.data.item_summary ?? n.data.title ?? "",
                  order_number: n.data.order_number ?? "",
                  tracking: n.data.tracking ?? "",
                  note: n.data.note ?? "",
                  date: n.data.job_date ? formatDay(n.data.job_date, lang) : "",
                });
                return (
                  <article
                    key={n.id}
                    className={cn(
                      "relative overflow-hidden rounded-lg bg-surface-container-lowest p-space-md pl-6 shadow-sm transition-shadow hover:shadow-lift lg:p-space-lg lg:pl-8",
                      n.read_at && "opacity-80",
                    )}
                  >
                    <span className={cn("absolute bottom-0 left-0 top-0 w-1.5", look.bar)} />
                    <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-start">
                      <div className="flex min-w-0 gap-space-md">
                        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", look.chip)}>
                          <Icon name={look.icon} className="text-xl" />
                        </span>
                        <div className="min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                              {CATEGORIES.find((c) => c.key === cat)?.label ?? "System"} · {formatDateTime(n.created_at, lang)}
                            </span>
                            {!n.read_at && <Badge tone="critical" dot>{m.unread}</Badge>}
                          </div>
                          <p className={cn("text-body-md text-on-surface", !n.read_at && "font-semibold")}>{text}</p>
                        </div>
                      </div>
                      {n.kind.startsWith("marketplace_order_") && n.data.order_id && (
                        <form action={openMarketplaceOrderNotification}>
                          <input type="hidden" name="notification_id" value={n.id} />
                          <input type="hidden" name="lang" value={lang} />
                          <button type="submit" className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-primary-container px-3 py-2 font-label-md text-label-md text-white hover:bg-primary">
                            {m.openOrder} <Icon name="arrow_forward" className="text-base" />
                          </button>
                        </form>
                      )}
                      {n.booking_id && (
                        <Link
                          href={`/${lang}/account/bookings/${n.booking_id}`}
                          className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-primary-container px-3 py-2 font-label-md text-label-md text-white hover:bg-primary"
                        >
                          {m.open} <Icon name="arrow_forward" className="text-base" />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        ),
        statusBar: null,
      }}
    />
  );
}
