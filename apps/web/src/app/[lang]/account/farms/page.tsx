import { notFound } from "next/navigation";
import { FarmForm } from "@/components/account/farm-form";
import { Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

export default async function FarmsPage({ params }: PageProps<"/[lang]/account/farms">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const f = t.acct.farms;
  const supabase = await createClient();
  const { data: farms } = await supabase.from("farms").select("id, name, state, lga, area_ha, plots(count)")
    .eq("owner_id", account.userId).order("created_at");

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{f.title}</h1>
        <p className="mt-2 text-muted">{f.intro}</p>
      </div>
      {(farms ?? []).length === 0 ? (
        <p className="text-muted">{f.none}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {(farms ?? []).map((farm) => (
            <li key={farm.id}>
              <Card className="flex h-full flex-col gap-1">
                <h2 className="text-lg font-bold">{farm.name}</h2>
                <p className="text-muted">{[farm.lga, farm.state].filter(Boolean).join(", ")}</p>
                <p>{farm.area_ha ? fill(f.area, { area: Number(farm.area_ha).toLocaleString(lang === "yo" ? "yo-NG" : "en-NG", { maximumFractionDigits: 2 }) }) : f.areaUnknown}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{f.add}</h2>
        {account.isFarmer ? <FarmForm lang={lang} t={t} defaultState={account.profile.state} /> : <p className="text-muted">{f.needsFarmerRole}</p>}
      </Card>
    </>
  );
}
