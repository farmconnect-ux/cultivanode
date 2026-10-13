import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ds/page-header";
import { Chip, DataTable, KpiGrid, Section, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num, relDays } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Proof-of-work log" };

export default async function Page({ params }: PageProps<"/[lang]/account/machinery/dispatch">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, listing_title, farm_name, job_lga, job_state, job_date, unit, quantity, total_kobo, status, checked_in_at, check_in_distance_m, work_submitted_at, hectares_done, distance_km")
    .eq("provider_id", account.userId)
    .order("job_date", { ascending: false })
    .limit(60);
  const jobs = data ?? [];
  const live = jobs.filter((j) => ["accepted", "in_progress", "awaiting_confirmation"].includes(j.status));
  const done = jobs.filter((j) => j.status === "completed");
  const earned = done.reduce((s, j) => s + Number(j.total_kobo), 0);
  const ha = done.reduce((s, j) => s + Number(j.hectares_done ?? (j.unit === "hectare" ? j.quantity : 0)), 0);

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="fact_check">GPS check-in · photo proof · farmer sign-off</Chip>}
        title="Dispatch & Proof-of-Work"
        description="Jobs you've accepted, where your crew checked in, and what's waiting for the farmer to confirm."
      />
      <KpiGrid>
        <MetricCard label="Jobs in flight" value={live.length} icon="local_shipping" foot="Accepted, on site or awaiting sign-off" />
        <MetricCard label="Awaiting farmer sign-off" value={jobs.filter((j) => j.status === "awaiting_confirmation").length} icon="pending" foot="Escrow releases on confirmation" />
        <MetricCard label="Hectares completed" value={num(ha, 1)} unit="ha" icon="grid_on" foot={`${done.length} completed jobs`} />
        <MetricCard label="Earned" value={naira(earned)} icon="payments" foot="Completed jobs" />
      </KpiGrid>
      <Section title="Job log" icon="list_alt">
        <DataTable
          rows={jobs}
          rowKey={(j) => j.id}
          empty="No jobs yet. Requests for your listings appear here once accepted."
          columns={[
            { label: "Job date", cell: (j) => `${formatDay(j.job_date, lang)} (${relDays(j.job_date)})` },
            { label: "Service", cell: (j) => <Link className="font-medium text-primary-container hover:underline" href={`/${lang}/account/bookings/${j.id}`}>{j.listing_title}</Link> },
            { label: "Farm", cell: (j) => `${j.farm_name} · ${[j.job_lga, j.job_state].filter(Boolean).join(", ")}` },
            { label: "Size", numeric: true, cell: (j) => `${num(j.quantity, 1)} ${label(j.unit)}` },
            { label: "Check-in", cell: (j) => (j.checked_in_at ? `${j.check_in_distance_m ?? "—"} m from farm` : "—") },
            { label: "Total", numeric: true, cell: (j) => naira(j.total_kobo) },
            { label: "Status", cell: (j) => <Status value={j.status} /> },
          ]}
        />
      </Section>
    </Stack>
  );
}
