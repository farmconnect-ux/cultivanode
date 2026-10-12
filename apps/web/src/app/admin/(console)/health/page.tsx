import type { Metadata } from "next";
import { Icon } from "@/components/ds/icon";
import { MetricCard } from "@/components/live/metric-card";
import { SystemHealth } from "@/components/screens/system-health";
import { Badge } from "@/components/shadcn/badge";
import { requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Super admin & system health" };

type HealthService = {
  name: string;
  category: "core" | "external" | "infrastructure";
  status: "healthy" | "operational" | "degraded" | "failing";
  latencyMs: number | null;
  details: string;
};

const STATUS_TONE = { healthy: "positive", operational: "positive", degraded: "caution", failing: "critical" } as const;

export default async function AdminHealthPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  const supabase = await createClient();

  // Live probes: database and auth round-trips from this server.
  // eslint-disable-next-line react-hooks/purity -- Server-side latency measurement
  const t0 = performance.now();
  const { error: dbError } = await supabase.from("roles").select("role").limit(1);
  // eslint-disable-next-line react-hooks/purity -- Server-side latency measurement
  const dbLatency = Math.round(performance.now() - t0);
  // eslint-disable-next-line react-hooks/purity -- Server-side latency measurement
  const tAuth0 = performance.now();
  const { error: authError } = await supabase.auth.getUser();
  // eslint-disable-next-line react-hooks/purity -- Server-side latency measurement
  const authLatency = Math.round(performance.now() - tAuth0);

  const { data: integrationsData } = await supabase.rpc("admin_integration_overview");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const integrations = (integrationsData ?? {}) as Record<string, any>;

  // eslint-disable-next-line react-hooks/purity -- Server Component: timestamp for 24h window queries
  const now = Date.now();
  const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const [
    { count: auditCount24h },
    { count: bookingEventsCount24h },
    { count: smsTotal24h },
    { count: smsFailed24h },
    { count: smsRetrying24h },
    { count: disputes24h },
    { count: cancelled24h },
    { count: totalFarms },
    { count: totalPlots },
    { count: totalSoilRecords },
  ] = await Promise.all([
    supabase.from("audit_log").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("booking_events").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("sms_outbox").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("sms_outbox").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
    supabase.from("sms_outbox").select("id", { count: "exact", head: true }).gt("attempts", 1).gte("created_at", since),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "disputed").gte("created_at", since),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "cancelled").gte("created_at", since),
    supabase.from("farms").select("id", { count: "exact", head: true }),
    supabase.from("plots").select("id", { count: "exact", head: true }),
    supabase.from("soil_records").select("id", { count: "exact", head: true }),
  ]);

  const totalEvents24h = (auditCount24h ?? 0) + (bookingEventsCount24h ?? 0) + (smsTotal24h ?? 0);
  const criticalErrors24h = (smsFailed24h ?? 0) + (disputes24h ?? 0);
  const warnings24h = (smsRetrying24h ?? 0) + (cancelled24h ?? 0);
  const smsDelivery = smsTotal24h ? Math.round((1 - (smsFailed24h ?? 0) / smsTotal24h) * 1000) / 10 : null;

  const services: HealthService[] = [
    { name: "PostgreSQL & PostGIS", category: "core", status: dbError ? "degraded" : "healthy", latencyMs: dbLatency, details: "Spatial indexes and row-level security on every table" },
    { name: "Supabase Auth (phone & email OTP)", category: "core", status: authError ? "degraded" : "healthy", latencyMs: authLatency, details: "Session layer and JWT verification" },
    { name: "SMS dispatch gateway", category: "external", status: integrations?.sms?.active_provider ? "operational" : "degraded", latencyMs: null, details: `Provider: ${integrations?.sms?.active_provider ?? "not configured"}` },
    { name: "Identity verification", category: "external", status: integrations?.identity?.active_provider ? "operational" : "degraded", latencyMs: null, details: `Provider: ${integrations?.identity?.active_provider ?? "not configured"} · NIN / BVN / CAC` },
    { name: "Agro-meteorological weather", category: "external", status: integrations?.weather?.active_provider ? "operational" : "degraded", latencyMs: null, details: `Provider: ${integrations?.weather?.active_provider ?? "not configured"} · 30-min cache` },
    { name: "Farm operations store", category: "infrastructure", status: "healthy", latencyMs: dbLatency, details: `${totalFarms ?? 0} farms · ${totalPlots ?? 0} plots · ${totalSoilRecords ?? 0} soil lab records` },
  ];
  const degraded = services.filter((s) => s.status === "degraded" || s.status === "failing").length;

  return (
    <SystemHealth
      lang="en"
      slots={{
        kpis: (
          <section className="flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
                <Icon name="monitoring" className="text-secondary" /> Platform telemetry · last 24 hours
              </h2>
              <Badge tone={degraded ? "caution" : "positive"} dot pulse>
                {degraded ? `${degraded} service${degraded > 1 ? "s" : ""} degraded` : "All systems operational"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total events" value={totalEvents24h.toLocaleString("en-NG")} icon="stream" foot="Audit log, booking events and SMS" />
              <MetricCard label="Critical errors" value={criticalErrors24h} icon="error" iconTone="bg-error-container/60 text-error" foot="Failed SMS and new disputes" />
              <MetricCard label="Warnings" value={warnings24h} icon="warning" iconTone="bg-tertiary-fixed/50 text-tertiary-container" foot="SMS retries and cancellations" />
              <MetricCard label="SMS delivery" value={smsDelivery === null ? "—" : `${smsDelivery}%`} icon="sms" iconTone="bg-surface-container-high text-primary" foot={`${smsTotal24h ?? 0} messages queued`} />
            </div>
          </section>
        ),
        services: (
          <section className="flex flex-col gap-space-sm">
            <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
              <Icon name="hub" className="text-secondary" /> Service & integration health
            </h2>
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-3">
              {services.map((s) => (
                <div key={s.name} className="card-interactive flex flex-col justify-between gap-3 rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{s.category}</span>
                    <Badge tone={STATUS_TONE[s.status]} dot pulse={s.status !== "degraded"}>{s.status}</Badge>
                  </div>
                  <div>
                    <p className="font-headline-sm text-[1rem] text-on-surface">{s.name}</p>
                    <p className="text-body-sm text-on-surface-variant">{s.details}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-surface-container pt-2 text-label-sm text-on-surface-variant">
                    <span>Latency</span>
                    <span className="font-semibold tnum text-on-surface">{s.latencyMs === null ? "via edge function" : `${s.latencyMs} ms`}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ),
        queue: null,
        ledger: null,
      }}
    />
  );
}
