import { notFound } from "next/navigation";
import { enableFarmerRole } from "@/actions/account";
import { FarmForm } from "@/components/account/farm-form";
import { Button, Card } from "@/components/ui";
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
  const { data: farms } = await supabase.from("farms").select("id, name, state, lga, area_ha, organization_id, organizations(name)")
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
                      Active Pin
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    {farm.area_ha ? `${Number(farm.area_ha).toFixed(1)} hectares` : "Location mapped"}
                  </p>
                  <p className="text-xs text-muted">{[farm.lga, farm.state].filter(Boolean).join(", ")}</p>
                  <p className="text-xs font-medium text-harvest-800">
                    {farm.state === "Oyo" ? "Derived Savannah Zone" : farm.state === "Osun" ? "Guinea Savannah Zone" : "Humid Forest Zone"}
                  </p>
                  {farm.organizations?.name && (
                    <p className="text-xs font-semibold text-node-600">{farm.organizations.name}</p>
                  )}
                </div>
                <div className="border-t border-line pt-3 flex flex-wrap gap-2">
                  <a
                    href={`/${lang}/account/find?farm=${farm.id}`}
                    className="inline-flex items-center justify-center rounded-md bg-leaf-600 px-3 py-2 text-xs font-bold text-white hover:bg-leaf-700 transition-colors flex-1 text-center"
                  >
                    🚜 Find Machinery
                  </a>
                  <a
                    href={`/${lang}/account/bookings/new?farm=${farm.id}`}
                    className="inline-flex items-center justify-center rounded-md bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-200 transition-colors flex-1 text-center"
                  >
                    ➕ Request Service
                  </a>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {account.isFarmer ? (
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">{f.add}</h2>
          <FarmForm lang={lang} t={t} defaultState={account.profile.state} />
        </Card>
      ) : (
        <Card className="flex flex-col gap-4 border-2 border-dashed border-harvest-300 bg-harvest-50/60 p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden="true">🌱</span>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-ink">{f.add}</h2>
              <p className="text-sm font-semibold text-harvest-900">{f.needsFarmerRole}</p>
              <p className="text-xs text-muted">
                {lang === "yo"
                  ? "Tẹ bọ́tìnnì tí ó wà nísàlẹ̀ yìí láti bẹ̀rẹ̀ lẹ́sẹ̀kẹsẹ̀ láìsí ìdádúró."
                  : "Activate your farmer role instantly with one click to start recording your farm, mapping plots, and logging tasks."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <form action={enableFarmerRole}>
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="role" value="crop_farmer" />
              <Button type="submit" className="bg-leaf-700 hover:bg-leaf-800 text-white font-bold">
                🌱 {lang === "yo" ? "Muu Ipa Àgbẹ̀ Ohun Ọ̀gbìn Ṣiṣẹ́" : "Activate Crop Farmer Role"}
              </Button>
            </form>
            <form action={enableFarmerRole}>
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="role" value="animal_farmer" />
              <Button type="submit" variant="secondary" className="font-semibold">
                🐄 {lang === "yo" ? "Muu Ipa Olùsin Ẹran Ṣiṣẹ́" : "Activate Livestock Farmer Role"}
              </Button>
            </form>
            <a
              href={`/${lang}/account/roles`}
              className="text-xs font-bold text-leaf-700 hover:text-leaf-900 underline ml-1"
            >
              {lang === "yo" ? "Wo gbogbo àwọn ipa &rarr;" : "View and request other roles &rarr;"}
            </a>
          </div>
        </Card>
      )}
    </>
  );
}
