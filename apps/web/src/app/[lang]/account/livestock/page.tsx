import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { Button } from "@/components/ui";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { LivestockManagement } from "@/components/screens/livestock-management";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  createLivestockAnimal,
  logLivestockFeeding,
  logLivestockHealthTreatment,
} from "@/actions/livestock";

export const metadata: Metadata = { title: "Livestock & aquaculture" };

export default async function Page({ params }: PageProps<"/[lang]/account/livestock">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, state, lga")
    .or(scope.join(","))
    .order("created_at");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: animals } = farmIds.length
    ? await supabase
        .from("farm_livestock_animals")
        .select("id, farm_id, species, breed, tag_number, sex, current_weight_kg, status, birth_date, created_at")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const animalList = animals ?? [];
  const hasLiveAnimals = animalList.length > 0;

  const totalHead = animalList.length;
  const totalWeightKg = animalList.reduce((sum, a) => sum + (Number(a.current_weight_kg) || 0), 0);
  const totalWeightMt = (totalWeightKg / 1000).toFixed(2);

  // Group animals by species
  const bySpecies = new Map<string, number>();
  for (const a of animalList) {
    const s = a.species || "other";
    bySpecies.set(s, (bySpecies.get(s) || 0) + 1);
  }

  const registerModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="pets" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Register Livestock Batch / Animal
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={createLivestockAnimal} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Target Farm <span className="text-error">*</span>
          </label>
          <select
            name="farm_id"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          >
            {farmList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({[f.lga, f.state].filter(Boolean).join(", ") || "Oyo"})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Species / Enterprise <span className="text-error">*</span>
            </label>
            <select
              name="species"
              defaultValue="poultry"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="poultry">Poultry (Broilers / Layers / Kuroiler)</option>
              <option value="fish">Aquaculture (Catfish / Tilapia)</option>
              <option value="cattle">Cattle (White Fulani / Bunaji / Sokoto Gudali)</option>
              <option value="goat">Goat (Red Sokoto / West African Dwarf)</option>
              <option value="sheep">Sheep (Yankasa / Ouda / Balami)</option>
              <option value="pig">Swine / Pigs</option>
              <option value="other">Other Livestock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Tag / Batch Identifier <span className="text-error">*</span>
            </label>
            <input
              name="tag_number"
              type="text"
              placeholder="e.g. BATCH-POULTRY-B4 or TAG-102"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Breed Name</label>
            <input
              name="breed"
              type="text"
              placeholder="e.g. Cobb 500, Clarias Gariepinus, Red Sokoto"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Sex</label>
            <select
              name="sex"
              defaultValue="female"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="mixed">Mixed (Flock / Pond Batch)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Current Weight (kg)</label>
            <input
              name="current_weight_kg"
              type="number"
              step="0.05"
              min="0"
              placeholder="e.g. 1.35"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Stocking / Birth Date</label>
            <input
              name="birth_date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <ScreenDialogClose className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md">
            Cancel
          </ScreenDialogClose>
          <Button
            className="px-5 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary font-semibold shadow-sm"
            type="submit"
            disabled={farmList.length === 0}
          >
            Register Batch
          </Button>
        </div>
      </form>
    </div>
  );

  const feedingModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="water_drop" className="text-secondary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Log Feeding &amp; Nutrition
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={logLivestockFeeding} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Target Farm <span className="text-error">*</span>
          </label>
          <select
            name="farm_id"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          >
            {farmList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Feed Formulation / Type <span className="text-error">*</span>
            </label>
            <input
              name="feed_type"
              type="text"
              placeholder="e.g. Broiler Finisher Pellets, 2mm Extruded Feed"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Quantity Fed (kg) <span className="text-error">*</span>
            </label>
            <input
              name="quantity_kg"
              type="number"
              step="0.5"
              min="0.5"
              defaultValue="50"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Cost (Kobo / Minor Units)</label>
          <input
            name="cost_minor"
            type="number"
            placeholder="e.g. 3400000 (₦34,000)"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <ScreenDialogClose className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md">
            Cancel
          </ScreenDialogClose>
          <Button
            className="px-5 py-2 bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:bg-primary font-semibold shadow-sm"
            type="submit"
            disabled={farmList.length === 0}
          >
            Record Feeding
          </Button>
        </div>
      </form>
    </div>
  );

  const vetModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="vaccines" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Record Veterinary Health &amp; Vaccination
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={logLivestockHealthTreatment} className="space-y-4 text-left">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Treatment / Event Type
            </label>
            <select
              name="treatment_type"
              defaultValue="vaccination"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="vaccination">Vaccination Protocol</option>
              <option value="deworming">Deworming</option>
              <option value="antibiotic">Therapeutic Antibiotic</option>
              <option value="supplement">Vitamin / Mineral Supplement</option>
              <option value="quarantine">Biosecurity Quarantine</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Treatment Protocol Name <span className="text-error">*</span>
            </label>
            <input
              name="treatment_name"
              type="text"
              placeholder="e.g. NDV Lasota Booster"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Medication / Vaccine Name</label>
            <input
              name="medication_name"
              type="text"
              placeholder="e.g. Lasota Live Vial"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Drug Withdrawal Period (Days)</label>
            <input
              name="withdrawal_days"
              type="number"
              defaultValue="0"
              min="0"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
            <p className="mt-1 text-xs text-on-surface-variant">Mandatory days before meat/egg sale</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Veterinary Notes &amp; Cold-Chain Log</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Attending veterinarian, vial batch #, temperature validation..."
            className="w-full p-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <ScreenDialogClose className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md">
            Cancel
          </ScreenDialogClose>
          <Button
            className="px-5 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container font-semibold shadow-sm"
            type="submit"
          >
            Record Treatment
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveAnimals ? "live" : "preview"}>
        {hasLiveAnimals
          ? `Showing ${animalList.length} registered animal batch${animalList.length === 1 ? "" : "es"} across your farm holding.`
          : "Herd, flock and pond records show sample data until you register animals or ponds."}
      </LiveStrip>
      <LivestockManagement
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog title="Register New Batch" side="center" panel={registerModal}>
                <Button
                  className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors shadow-sm font-semibold"
                  type="button"
                >
                  <Icon name="add_circle" className="text-base text-primary" />
                  <span>Register New Batch</span>
                </Button>
              </ScreenDialog>
              <ScreenDialog title="Log Feed & Water" side="center" panel={feedingModal}>
                <Button
                  className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors shadow-sm font-semibold"
                  type="button"
                >
                  <Icon name="water_drop" className="text-base text-secondary" />
                  <span>Log Feed &amp; Water</span>
                </Button>
              </ScreenDialog>
              <ScreenDialog title="Veterinary Health" side="center" panel={vetModal}>
                <Button
                  className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-colors shadow-sm font-semibold"
                  type="button"
                >
                  <Icon name="vaccines" className="text-base" />
                  <span>Schedule Vet Visit</span>
                </Button>
              </ScreenDialog>
            </div>
          ),
          kpis: hasLiveAnimals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-lg">
              <div className="flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Animal Inventory &amp; Biomass
                    </span>
                    <div className="mt-space-xs font-metric-num text-metric-num text-on-surface">
                      {totalHead}{" "}
                      <span className="font-label-md text-label-md text-on-surface-variant font-normal">
                        Head
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low text-primary">
                    <Icon name="pets" />
                  </div>
                </div>
                <div className="mt-space-md space-y-space-xs">
                  <div className="flex items-center justify-between font-label-md text-label-md">
                    <span className="text-on-surface">Estimated Biomass</span>
                    <span className="font-bold text-primary">{totalWeightMt} MT</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Enterprises Active
                    </span>
                    <div className="mt-space-xs font-metric-num text-metric-num text-secondary">
                      {bySpecies.size}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low text-secondary">
                    <Icon name="category" />
                  </div>
                </div>
                <div className="mt-space-md space-y-space-xs">
                  <div className="flex items-center justify-between font-label-md text-label-md">
                    <span className="text-on-surface">Species Diversity</span>
                    <span className="font-bold text-secondary">
                      {Array.from(bySpecies.keys()).join(" · ") || "None"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Biosecurity Status
                    </span>
                    <div className="mt-space-xs font-metric-num text-metric-num text-primary">100%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low text-primary">
                    <Icon name="shield_with_heart" />
                  </div>
                </div>
                <div className="mt-space-md space-y-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    Biosecurity Level 1 Synchronized
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Registered Farms
                    </span>
                    <div className="mt-space-xs font-metric-num text-metric-num text-on-surface">
                      {farmList.length}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low text-primary">
                    <Icon name="terrain" />
                  </div>
                </div>
                <div className="mt-space-md space-y-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    All holding facilities validated
                  </span>
                </div>
              </div>
            </div>
          ) : undefined,
          batches: hasLiveAnimals ? (
            <div className="space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <Icon name="dataset" className="text-primary text-xl" />
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">
                    Active Production Batches ({animalList.length})
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
                {animalList.map((animal) => (
                  <div
                    key={animal.id}
                    className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between border border-outline-variant"
                  >
                    <div className="space-y-space-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold uppercase">
                            {animal.species}
                          </span>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1 font-bold">
                            {animal.tag_number}
                          </h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {animal.breed || "Standard Variety"} · {animal.sex}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold capitalize">
                          {animal.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-lg text-xs">
                        <div>
                          <span className="text-on-surface-variant block">Weight:</span>
                          <span className="font-bold text-on-surface">
                            {animal.current_weight_kg ? `${animal.current_weight_kg} kg` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block">Stocked Date:</span>
                          <span className="font-bold text-on-surface">
                            {animal.birth_date ? formatDate(animal.birth_date, lang) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : undefined,
        }}
      />
    </>
  );
}
