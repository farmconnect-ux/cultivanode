import { notFound } from "next/navigation";
import { AgentRegister } from "@/components/account/agent-register";
import { FarmForm } from "@/components/account/farm-form";
import { Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill, formatDate, localPhone } from "@/lib/text";

export default async function AgentPage({ params }: PageProps<"/[lang]/account/agent">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const g = t.acct.agent;
  if (!account.isAgent) {
    return (
      <>
        <h1 className="text-3xl font-extrabold text-leaf-800">{g.title}</h1>
        <p className="text-muted">{g.notAgent}</p>
      </>
    );
  }
  const supabase = await createClient();
  const { data: farmers } = await supabase.from("profiles").select("id, full_name, phone, state, lga, created_at")
    .eq("onboarded_by", account.userId).order("created_at", { ascending: false }).limit(100);
  const ids = (farmers ?? []).map((f) => f.id);
  const { data: farms } = ids.length
    ? await supabase.from("farms").select("id, owner_id, name").in("owner_id", ids)
    : { data: [] as { id: string; owner_id: string; name: string }[] };

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{g.title}</h1>
        <p className="mt-2 text-muted">{g.intro}</p>
      </div>
      <Card>
        <AgentRegister lang={lang} t={t} defaultState={account.profile.state} />
      </Card>
      <section aria-labelledby="my-farmers" className="flex flex-col gap-3">
        <h2 id="my-farmers" className="text-xl font-bold">{g.yourFarmers}</h2>
        {(farmers ?? []).length === 0 && <p className="text-muted">{g.none}</p>}
        {(farmers ?? []).map((f) => {
          const theirFarms = (farms ?? []).filter((x) => x.owner_id === f.id);
          return (
            <Card key={f.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold">{f.full_name}</h3>
                <span className="text-sm text-muted">{localPhone(f.phone)} · {formatDate(f.created_at, lang)}</span>
              </div>
              {theirFarms.length > 0 && <p>{theirFarms.map((x) => x.name).join(", ")}</p>}
              <details className="rounded-md border border-line">
                <summary className="min-h-11 cursor-pointer px-4 py-2 font-semibold text-leaf-700">{g.addFarm}</summary>
                <div className="border-t border-line p-4">
                  <p className="mb-3 font-medium">{fill(t.acct.farms.forFarmer, { name: f.full_name ?? "" })}</p>
                  <FarmForm lang={lang} t={t} forProfile={f.id} defaultState={f.state} />
                </div>
              </details>
            </Card>
          );
        })}
      </section>
    </>
  );
}
