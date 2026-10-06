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
  // My own farms and farms of businesses I belong to (not every farm staff permissions could show).
  const scope = [`owner_id.eq.${account.userId}`, ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : [])];
  const { data: farms } = await supabase.from("farms").select("id, name, state, lga, area_ha, organization_id, organizations(name), plots(count)")
    .or(scope.join(",")).order("created_at");

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
              <Card className="flex h-full flex-col justify-between gap-3 border border-line hover:border-leaf-400 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-leaf-900">{farm.name}</h2>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-leaf-700">
                      <span className="h-2 w-2 rounded-full bg-leaf-500" />
                      Active
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    {farm.area_ha ? `${Number(farm.area_ha).toFixed(1)} hectares` : "Boundary calculated"}
                  </p>
                  <p className="text-xs text-muted">{[farm.lga, farm.state].filter(Boolean).join(", ")}</p>
                  <p className="text-xs font-medium text-harvest-800">
                    {farm.state === "Oyo" ? "Derived Savannah Zone" : farm.state === "Osun" ? "Guinea Savannah Zone" : "Humid Forest Zone"}
                  </p>
                  {farm.organizations?.name && (
                    <p className="text-xs font-semibold text-node-600">{farm.organizations.name}</p>
                  )}
                </div>
                <div className="border-t border-line pt-3 flex flex-col gap-2">
                  <a
                    href={`/${lang}/account/farms/${farm.id}`}
                    className="inline-flex items-center justify-center rounded-md bg-leaf-600 px-3 py-2 text-xs font-bold text-white hover:bg-leaf-700 transition-colors w-full"
                  >
                    Open Farm Enterprise &rarr;
                  </a>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <a
                      href={`/${lang}/account/farms/${farm.id}?tab=crops`}
                      className="px-2 py-1 rounded bg-leaf-50 hover:bg-leaf-100 text-leaf-800 font-medium"
                    >
                      🌽 Crops
                    </a>
                    <a
                      href={`/${lang}/account/farms/${farm.id}?tab=livestock`}
                      className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium"
                    >
                      🐄 Livestock
                    </a>
                    <a
                      href={`/${lang}/account/farms/${farm.id}?tab=farm_books`}
                      className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium"
                    >
                      💰 Farm Account
                    </a>
                    <a
                      href={`/${lang}/account/farms/${farm.id}?tab=workers`}
                      className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium"
                    >
                      👥 Workers
                    </a>
                    <a
                      href={`/${lang}/account/farms/${farm.id}?tab=inventory`}
                      className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium"
                    >
                      📦 Inventory
                    </a>
                    <a
                      href={`/${lang}/account/farms/${farm.id}?tab=records`}
                      className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium"
                    >
                      📁 Records
                    </a>
                  </div>
                </div>
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
