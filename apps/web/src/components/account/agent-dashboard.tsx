import Link from "next/link";
import { Badge, Card, LinkButton } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Account } from "@/lib/account/session";
import { formatDate, localPhone } from "@/lib/text";

type AgentFarmer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  state: string | null;
  lga: string | null;
  created_at: string;
};

export function AgentDashboard({
  lang,
  account,
  t,
  farmers = [],
}: {
  lang: Locale;
  account: Account;
  t: Dictionary;
  farmers: AgentFarmer[];
}) {
  const agentName = account.profile.full_name?.split(" ")[0] ?? "Agent";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-leaf-800 sm:text-4xl">
            Field Console · {agentName}
          </h1>
          <p className="mt-1 text-base text-muted">
            Field agent operations: Register, verify, and assist local farmers.
          </p>
        </div>
        <LinkButton
          href={`/${lang}/account/agent?action=register&ws=agent`}
          className="bg-leaf-700 text-white font-bold"
        >
          + Register Farmer
        </LinkButton>
      </div>

      {/* Today's Activity Metrics */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Today&apos;s Field Activity</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="flex flex-col justify-between gap-1 p-5 border-l-4 border-l-leaf-600">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Farmers Onboarded</span>
            <span className="text-3xl font-extrabold text-leaf-800">{farmers.length}</span>
            <span className="text-xs text-muted">Registered in zone</span>
          </Card>

          <Card className="flex flex-col justify-between gap-1 p-5 border-l-4 border-l-node-600">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Assisted Bookings</span>
            <span className="text-3xl font-extrabold text-node-800">3</span>
            <span className="text-xs text-muted">Tractor & spray work</span>
          </Card>

          <Card className="flex flex-col justify-between gap-1 p-5 border-l-4 border-l-harvest-500">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Verifications</span>
            <span className="text-3xl font-extrabold text-harvest-700">2</span>
            <span className="text-xs text-muted">Pending field check</span>
          </Card>

          <Card className="flex flex-col justify-between gap-1 p-5 border-l-4 border-l-leaf-500">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Jobs Monitored</span>
            <span className="text-3xl font-extrabold text-leaf-700">4</span>
            <span className="text-xs text-muted">Active in your LGA</span>
          </Card>
        </div>
      </div>

      {/* TODAY'S TASKS LIST */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold text-leaf-900">Today&apos;s Tasks & Field Visits</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex flex-col justify-between gap-3 p-5 border-l-4 border-l-harvest-500">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-leaf-900">Visit Adewale Maize Farm</h3>
                <Badge className="bg-harvest-100 text-harvest-800">Boundary Verification</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">
                Coordinate boundary walkthrough for 4.2 ha plot.
              </p>
              <p className="mt-2 text-xs font-semibold text-leaf-700">📍 Approx. 2.7 km away (Ogbomosho North)</p>
            </div>
            <LinkButton
              href={`/${lang}/account/agent?action=verify&ws=agent`}
              variant="secondary"
              className="self-start text-xs font-bold"
            >
              Open Task →
            </LinkButton>
          </Card>

          <Card className="flex flex-col justify-between gap-3 p-5 border-l-4 border-l-node-500">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-leaf-900">Assisted Ploughing Booking</h3>
                <Badge className="bg-node-100 text-node-800">Booking Help</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">
                Help Ibrahim schedule tractor harrowing for next Monday.
              </p>
              <p className="mt-2 text-xs font-semibold text-leaf-700">📍 Approx. 4.1 km away (Surulere LGA)</p>
            </div>
            <LinkButton
              href={`/${lang}/account/agent?action=book&ws=agent`}
              variant="secondary"
              className="self-start text-xs font-bold"
            >
              Open Task →
            </LinkButton>
          </Card>
        </div>
      </section>

      {/* REGISTERED FARMERS DIRECTORY */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-leaf-900">
            Your Registered Farmers ({farmers.length})
          </h2>
          <Link
            href={`/${lang}/account/agent?ws=agent`}
            className="text-sm font-bold text-leaf-700 hover:underline"
          >
            View All →
          </Link>
        </div>

        {farmers.length === 0 ? (
          <Card className="p-8 text-center text-muted">
            <p className="font-bold">No farmers registered yet.</p>
            <p className="mt-1 text-sm">
              Use the field onboarding tool to register local farmers and map their plots.
            </p>
            <LinkButton
              href={`/${lang}/account/agent?action=register&ws=agent`}
              className="mt-4 bg-leaf-700 text-white font-bold"
            >
              + Register First Farmer
            </LinkButton>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {farmers.slice(0, 6).map((f) => (
              <li key={f.id}>
                <Card className="flex flex-col justify-between gap-2 p-4">
                  <div>
                    <h3 className="font-bold text-leaf-900">{f.full_name || "Unnamed Farmer"}</h3>
                    <p className="text-sm text-muted">
                      {localPhone(f.phone)} · {[f.lga, f.state].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-xs text-muted">Joined {formatDate(f.created_at, lang)}</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-line">
                    <Link
                      href={`/${lang}/account/agent?farmer=${f.id}&action=add_farm&ws=agent`}
                      className="text-xs font-bold text-leaf-700 hover:underline"
                    >
                      + Add Farm Plot
                    </Link>
                    <span className="text-muted">·</span>
                    <Link
                      href={`/${lang}/account/agent?farmer=${f.id}&action=book&ws=agent`}
                      className="text-xs font-bold text-node-700 hover:underline"
                    >
                      Assisted Booking
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
