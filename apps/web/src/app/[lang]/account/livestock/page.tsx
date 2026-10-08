import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import {
  createLivestockAnimal,
  logLivestockHealthTreatment,
  logLivestockFeeding,
  logLivestockProduction,
} from "@/actions/livestock";

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ species?: string }>;
}

export default async function LivestockPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang as Locale);
  const supabase = await createClient();

  // Fetch farmer's farms
  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name")
    .or(scope.join(","))
    .order("name");

  const farmIds = (farms || []).map((f) => f.id);

  // Fetch livestock animals
  let animalQuery = supabase
    .from("farm_livestock_animals")
    .select("*, farms(name)")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  if (sp.species) {
    animalQuery = animalQuery.eq("species", sp.species);
  }

  const { data: animals } = await animalQuery;

  // Fetch recent health treatments
  const animalIds = (animals || []).map((a) => a.id);
  const { data: treatments } = await supabase
    .from("farm_livestock_health_events")
    .select("*, farm_livestock_animals(tag_number, species)")
    .in("animal_id", animalIds.length > 0 ? animalIds : ["00000000-0000-0000-0000-000000000000"])
    .order("administered_at", { ascending: false })
    .limit(10);

  // Fetch recent production logs
  const { data: productionLogs } = await supabase
    .from("farm_livestock_production_logs")
    .select("*")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("log_date", { ascending: false })
    .limit(5);

  const activeWithdrawals = (treatments || []).filter((t) => {
    if (!t.withdrawal_end_date) return false;
    return new Date(t.withdrawal_end_date).getTime() > Date.now();
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-leaf-900 sm:text-3xl">Livestock Enterprise</h1>
          <p className="text-xs text-muted mt-1">
            Manage herd & flock identification, breeding genetics, food safety drug withdrawals, and daily yield.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Total Stock Head</p>
          <p className="text-xl font-black text-leaf-900 mt-1">{animals?.length || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-danger-600">
          <p className="text-xs font-medium text-muted">Active Drug Withdrawals</p>
          <p className="text-xl font-black text-danger-900 mt-1">{activeWithdrawals.length}</p>
          <p className="text-[10px] text-muted">Slaughter/sale restricted</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-harvest-600">
          <p className="text-xs font-medium text-muted">Cattle Headcount</p>
          <p className="text-xl font-black text-harvest-900 mt-1">
            {animals?.filter((a) => a.species === "cattle").length || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600">
          <p className="text-xs font-medium text-muted">Small Ruminants / Poultry</p>
          <p className="text-xl font-black text-sky-900 mt-1">
            {animals?.filter((a) => a.species !== "cattle").length || 0}
          </p>
        </Card>
      </div>

      {/* Active Medical Withdrawal Warning Banner */}
      {activeWithdrawals.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200 border text-amber-900 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950">
              Active Medication Withdrawal Restrictions in Effect
            </p>
            <p>
              {activeWithdrawals.length} animal(s) are currently undergoing post-treatment drug clearance. Meat and
              milk from these animals must not enter the commercial food supply chain until withdrawal ends.
            </p>
          </div>
        </Card>
      )}

      {/* Main Grid: Animals Roster & Registration */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Animals Register & Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Animals List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Animal Identification Register</h2>
              <Badge tone="leaf">{animals?.length || 0} Animals</Badge>
            </div>

            {(!animals || animals.length === 0) ? (
              <Card className="p-8 text-center border-dashed">
                <span className="text-3xl">🐄</span>
                <p className="mt-2 text-sm font-bold text-ink">No livestock registered</p>
                <p className="text-xs text-muted mt-1">
                  Register individual animals or flocks with ear tag numbers and breed profiles.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {animals.map((animal) => (
                  <Card key={animal.id} className="p-4 border border-line flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-ink">{animal.tag_number}</span>
                        <Badge tone={animal.status === "active" ? "leaf" : "default"}>
                          {animal.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-leaf-800 capitalize">
                        {animal.species} {animal.breed ? `(${animal.breed})` : ""} &bull; {animal.sex}
                      </p>
                      <div className="text-[11px] text-muted space-y-0.5">
                        <p>Farm: {animal.farms?.name}</p>
                        {animal.current_weight_kg && <p>Current Weight: {animal.current_weight_kg} kg</p>}
                        {animal.rfid_tag && <p>RFID / Microchip: {animal.rfid_tag}</p>}
                        {(animal.sire_tag || animal.dam_tag) && (
                          <p>Pedigree: Sire {animal.sire_tag || "—"} / Dam {animal.dam_tag || "—"}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Health Treatments Table */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Recent Health & Medication Logs</h2>
            {(!treatments || treatments.length === 0) ? (
              <Card className="p-4 text-center border-dashed">
                <p className="text-xs text-muted">No health events logged.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-line text-neutral-600 font-bold">
                    <tr>
                      <th className="p-2.5">Tag</th>
                      <th className="p-2.5">Treatment</th>
                      <th className="p-2.5">Medication</th>
                      <th className="p-2.5">Withdrawal</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {treatments.map((t) => {
                      const isRestricted =
                        t.withdrawal_end_date && new Date(t.withdrawal_end_date).getTime() > Date.now();
                      return (
                        <tr key={t.id}>
                          <td className="p-2.5 font-bold">{t.farm_livestock_animals?.tag_number}</td>
                          <td className="p-2.5">{t.treatment_name}</td>
                          <td className="p-2.5">{t.medication_name || "—"}</td>
                          <td className="p-2.5">{t.withdrawal_days} days</td>
                          <td className="p-2.5">
                            <Badge tone={isRestricted ? "danger" : "leaf"}>
                              {isRestricted ? "Under Withdrawal" : "Cleared"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>

        {/* Right Col: Register Animal & Health Forms */}
        <div className="space-y-6">
          {/* Register Animal Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Register Livestock</h3>
            <form action={createLivestockAnimal} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Farm *</label>
                <select
                  name="farm_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Farm...</option>
                  {(farms || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Tag Number *</label>
                  <input
                    type="text"
                    name="tag_number"
                    required
                    placeholder="e.g. NG-BOV-102"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Species *</label>
                  <select
                    name="species"
                    required
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="cattle">Cattle</option>
                    <option value="goat">Goat</option>
                    <option value="sheep">Sheep</option>
                    <option value="poultry">Poultry</option>
                    <option value="pig">Pig</option>
                    <option value="fish">Aquaculture / Fish</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Breed</label>
                  <input
                    type="text"
                    name="breed"
                    placeholder="e.g. White Fulani"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Sex</label>
                  <select
                    name="sex"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="castrated">Castrated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="current_weight_kg"
                    placeholder="e.g. 350"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">RFID / Microchip</label>
                  <input
                    type="text"
                    name="rfid_tag"
                    placeholder="Optional chip ID"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs py-2">
                🐄 Save Livestock Record
              </Button>
            </form>
          </Card>

          {/* Log Health Treatment Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Log Health & Withdrawal</h3>
            <form action={logLivestockHealthTreatment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Select Animal *</label>
                <select
                  name="animal_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Tag...</option>
                  {(animals || []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.tag_number} ({a.species})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Treatment Description *</label>
                <input
                  type="text"
                  name="treatment_name"
                  required
                  placeholder="e.g. Antibiotic for pneumonia"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Medication Name</label>
                  <input
                    type="text"
                    name="medication_name"
                    placeholder="e.g. Oxytetracycline"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Withdrawal Days</label>
                  <input
                    type="number"
                    name="withdrawal_days"
                    defaultValue="14"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-danger-700 hover:bg-danger-800 text-white font-bold text-xs py-2">
                💉 Record Treatment & Quarantine
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
