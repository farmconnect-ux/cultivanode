import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { EmptyState } from "@/components/ds/empty-state";
import { LiveStrip } from "@/components/ds/live-strip";
import { AgentOnboardingHub } from "@/components/screens/agent-onboarding-hub";
import { Badge } from "@/components/shadcn/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import type { Locale } from "@/i18n/config";
import type { Account } from "@/lib/account/session";
import { formatDate, localPhone } from "@/lib/text";
import { MetricCard } from "./metric-card";

type Farmer = { id: string; full_name: string | null; phone: string | null; state: string | null; lga: string | null; created_at: string };

const STEPS = [
  ["Identity & phone", "OTP, name and state"],
  ["Farm location", "GPS point or address"],
  ["Enterprise", "Crops, livestock or both"],
  ["Verification", "NIN / BVN when ready"],
] as const;

/** Field agent home: the assisted-onboarding design with the agent's real farmer roster. */
export function AgentHome({ lang, account, farmers }: { lang: Locale; account: Account; farmers: Farmer[] }) {
  // eslint-disable-next-line react-hooks/purity -- Server Component: timestamp for weekly stats
  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = farmers.filter((f) => new Date(f.created_at).getTime() > weekAgo).length;
  const areas = new Set(farmers.map((f) => f.lga || f.state).filter(Boolean)).size;
  const btn = "flex items-center gap-2 rounded-lg px-4 py-2.5 font-label-lg text-label-lg transition-colors";
  return (
    <>
      <LiveStrip>
        <span className="text-on-surface-variant">Your farmer roster and counts here are live.</span>
      </LiveStrip>
      <AgentOnboardingHub
        lang={lang}
        slots={{
          agentLine: (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Badge tone="brand"><Icon name="badge" /> {account.profile.full_name ?? "Field agent"}</Badge>
              {account.profile.state && <Badge tone="outline"><Icon name="location_on" /> {account.profile.state}</Badge>}
            </div>
          ),
          actions: (
            <div className="flex flex-wrap items-center gap-3 self-start xl:self-center">
              <Link href={`/${lang}/account/agent`} className={`${btn} bg-primary-container text-white hover:bg-primary`}>
                <Icon name="person_add" className="text-lg" /> Register a farmer
              </Link>
              <Link href={`/${lang}/account/bookings/new`} className={`${btn} bg-surface-container-low text-on-surface hover:bg-surface-container-high`}>
                <Icon name="agriculture" className="text-lg text-secondary" /> Book for a farmer
              </Link>
            </div>
          ),
          kpis: (
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Farmers onboarded" value={farmers.length} icon="group" foot={`+${thisWeek} in the last 7 days`} />
              <MetricCard label="Communities reached" value={areas} icon="location_on" iconTone="bg-surface-container-high text-primary" foot="Distinct LGAs / states" />
              <MetricCard label="Latest registration" value={farmers[0] ? formatDate(farmers[0].created_at, lang) : "—"} icon="schedule" iconTone="bg-tertiary-fixed/50 text-tertiary-container" foot={farmers[0]?.full_name ?? "No farmers yet"} className="[&_.font-metric-num]:text-[1.6rem]" />
              <MetricCard label="Commission model" value="₦0" icon="account_balance_wallet" iconTone="bg-primary-fixed/60 text-on-primary-fixed-variant" foot="Pilot: no fees to farmers" />
            </section>
          ),
          wizard: (
            <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm lg:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-surface-container pb-6 md:flex-row md:items-center">
                <div>
                  <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
                    <Icon name="tablet_mac" className="text-secondary" /> Assisted farmer registration
                  </h2>
                  <p className="mt-1 text-body-sm text-on-surface-variant">Register a farmer on their behalf — they confirm with a one-time code on their own phone.</p>
                </div>
                <Link href={`/${lang}/account/agent`} className={`${btn} bg-primary-container text-white hover:bg-primary`}>
                  Start registration <Icon name="arrow_forward" className="text-lg" />
                </Link>
              </div>
              <ol className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {STEPS.map(([title, body], i) => (
                  <li key={title} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-md text-label-md text-white">{i + 1}</span>
                    <span>
                      <span className="block font-label-md text-label-md text-on-surface">{title}</span>
                      <span className="block text-label-sm font-normal text-on-surface-variant">{body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ),
          roster: (
            <section className="space-y-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-2 border-b border-surface-container pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Community farmer roster</h2>
                  <p className="text-body-sm text-on-surface-variant">Farmers you registered, newest first.</p>
                </div>
                <Badge tone="positive">{farmers.length} total</Badge>
              </div>
              {farmers.length === 0 ? (
                <EmptyState icon="group_add" title="No farmers registered yet" description="Farmers you onboard appear here with their location and registration date." />
              ) : (
                <div className="-mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">Farmer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="pr-6">Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {farmers.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="pl-6 font-semibold">{f.full_name ?? "Unnamed farmer"}</TableCell>
                          <TableCell className="tnum">{localPhone(f.phone) || "—"}</TableCell>
                          <TableCell>{[f.lga, f.state].filter(Boolean).join(", ") || "—"}</TableCell>
                          <TableCell className="pr-6 whitespace-nowrap">{formatDate(f.created_at, lang)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          ),
        }}
      />
    </>
  );
}
