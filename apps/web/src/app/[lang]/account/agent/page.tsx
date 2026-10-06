import { notFound } from "next/navigation";
import { AgentAssistedBooking } from "@/components/account/agent-assisted-booking";
import { AgentRegister } from "@/components/account/agent-register";
import { FarmForm } from "@/components/account/farm-form";
import { Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill, formatDate, localPhone } from "@/lib/text";

export default async function AgentPage({ params, searchParams }: PageProps<"/[lang]/account/agent">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const g = t.acct.agent;
  const sp = await searchParams;
  const action = typeof sp.action === "string" ? sp.action : "";
  const selectedFarmer = typeof sp.farmer === "string" ? sp.farmer : "";

  if (!account.isAgent) {
    return (
      <>
        <h1 className="text-3xl font-extrabold text-leaf-800">{g.title}</h1>
        <p className="text-muted">{g.notAgent}</p>
      </>
    );
  }

  const supabase = await createClient();
  const { data: farmers } = await supabase
    .from("profiles")
    .select("id, full_name, phone, state, lga, created_at")
    .eq("onboarded_by", account.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = (farmers ?? []).map((f) => f.id);
  const { data: farms } = ids.length
    ? await supabase.from("farms").select("id, owner_id, name, state, lga, area_ha").in("owner_id", ids)
    : { data: [] as { id: string; owner_id: string; name: string; state: string | null; lga: string | null; area_ha: number | null }[] };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{g.title}</h1>
        <p className="mt-2 text-muted">{g.intro}</p>
      </div>

      {/* If assisted booking action is requested */}
      {action === "book" && (
        <AgentAssistedBooking
          lang={lang}
          farmers={farmers ?? []}
          farms={farms ?? []}
          initialFarmerId={selectedFarmer}
          t={t}
        />
      )}

      {/* Onboarding Register Form */}
      <section aria-labelledby="register-h" className="flex flex-col gap-3">
        <h2 id="register-h" className="text-xl font-bold text-leaf-900">
          Field Onboarding & Farmer Registration
        </h2>
        <Card className={action === "register" ? "border-2 border-leaf-700 bg-leaf-50/20" : ""}>
          <AgentRegister lang={lang} t={t} defaultState={account.profile.state} />
        </Card>
      </section>

      {/* Registered Farmers Directory */}
      <section aria-labelledby="my-farmers" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="my-farmers" className="text-xl font-bold text-leaf-900">
            {g.yourFarmers} ({(farmers ?? []).length})
          </h2>
        </div>

        {(farmers ?? []).length === 0 && <p className="text-muted">{g.none}</p>}

        {(farmers ?? []).map((f) => {
          const theirFarms = (farms ?? []).filter((x) => x.owner_id === f.id);
          const isTargeted = f.id === selectedFarmer;

          return (
            <Card
              key={f.id}
              className={`flex flex-col gap-3 p-5 ${
                isTargeted ? "border-2 border-leaf-600 bg-leaf-50/30" : ""
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-leaf-900">{f.full_name}</h3>
                  <span className="text-sm text-muted">
                    {localPhone(f.phone)} · {[f.lga, f.state].filter(Boolean).join(", ")} · {formatDate(f.created_at, lang)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/${lang}/account/agent?action=book&farmer=${f.id}&ws=agent`}
                    className="inline-flex items-center rounded-md bg-leaf-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-leaf-800"
                  >
                    + Assisted Booking
                  </a>
                </div>
              </div>

              {theirFarms.length > 0 && (
                <div className="rounded-md bg-cream p-3 text-sm">
                  <span className="font-semibold text-leaf-900">Farms ({theirFarms.length}):</span>{" "}
                  {theirFarms.map((x) => `${x.name} (${x.area_ha ?? "?"} ha)`).join(", ")}
                </div>
              )}

              <details className="rounded-md border border-line" open={isTargeted && action === "add_farm"}>
                <summary className="min-h-11 cursor-pointer px-4 py-2 font-semibold text-leaf-700">
                  {g.addFarm}
                </summary>
                <div className="border-t border-line p-4">
                  <p className="mb-3 font-medium">
                    {fill(t.acct.farms.forFarmer, { name: f.full_name ?? "" })}
                  </p>
                  <FarmForm lang={lang} t={t} forProfile={f.id} defaultState={f.state} />
                </div>
              </details>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
