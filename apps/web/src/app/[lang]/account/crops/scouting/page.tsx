import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { Button } from "@/components/ui";
import { FieldScouting } from "@/components/screens/field-scouting";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import { logCropObservation } from "@/actions/crop-plans";

export const metadata: Metadata = { title: "Field scouting & crop health" };

export default async function Page({ params }: PageProps<"/[lang]/account/crops/scouting">) {
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

  const { data: plots } = farmIds.length
    ? await supabase.from("plots").select("id, farm_id, name, area_ha").in("farm_id", farmIds)
    : { data: [] };

  const plotList = plots ?? [];
  const plotIds = plotList.map((p) => p.id);
  const plotMap = new Map(plotList.map((p) => [p.id, p]));

  const { data: cycles } = plotIds.length
    ? await supabase
        .from("crop_cycles")
        .select("*")
        .in("plot_id", plotIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const rawCycles = (cycles ?? []) as any[];
  const cycleList = rawCycles.map((c) => {
    let cropName = c.crop_name;
    let variety = c.variety || c.variety_id || "";
    let startDate = c.start_date || c.planting_date;

    if (!cropName && c.notes && typeof c.notes === "string" && c.notes.includes("[front_end_meta:")) {
      const match = c.notes.match(/\[front_end_meta:\s*([^\]]+)\]/);
      if (match && match[1]) {
        const parts = match[1].split(",").map((s: string) => s.trim());
        for (const part of parts) {
          const [k, v] = part.split(":");
          if (k === "crop_name" && v) cropName = v;
          if (k === "variety" && v && !variety) variety = v;
          if (k === "start_date" && v && !startDate) startDate = v;
        }
      }
    }

    if (!cropName) {
      cropName = c.crop_id ? c.crop_id.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Crop";
    }

    return {
      ...c,
      crop_name: cropName,
      variety,
      start_date: startDate,
    };
  });
  const cycleIds = cycleList.map((c) => c.id);
  const cycleMap = new Map(cycleList.map((c) => [c.id, c]));

  const { data: observations } = cycleIds.length
    ? await supabase
        .from("crop_observations")
        .select("*")
        .in("crop_cycle_id", cycleIds)
        .order("observed_at", { ascending: false })
    : { data: [] };

  const rawObs = (observations ?? []) as any[];
  const obsList = rawObs.map((o) => ({
    ...o,
    observation_type: o.observation_type || o.category || "General",
    recommended_action: o.recommended_action || "",
  }));
  const hasLiveObs = obsList.length > 0;
  const criticalCount = obsList.filter((o) => o.severity === "high" || o.severity === "critical").length;

  const logModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="add_a_photo" className="text-secondary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Log New Scouting Observation
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={logCropObservation} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Target Crop Cycle <span className="text-error">*</span>
          </label>
          <select
            name="crop_cycle_id"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          >
            {cycleList.length === 0 ? (
              <option value="">No active crop cycles available</option>
            ) : (
              cycleList.map((c) => {
                const plot = c.plot_id ? plotMap.get(c.plot_id) : undefined;
                return (
                  <option key={c.id} value={c.id}>
                    {c.crop_name} {c.variety ? `(${c.variety})` : ""} · {plot?.name || "Plot"}
                  </option>
                );
              })
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Observation Category</label>
            <select
              name="observation_type"
              defaultValue="pest"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="pest">Pest / Insect Vector</option>
              <option value="disease">Fungal / Bacterial Blight</option>
              <option value="weed">Weed Encroachment</option>
              <option value="nutrient">Nutrient Deficiency</option>
              <option value="water">Moisture / Drought Stress</option>
              <option value="general">General Canopy Vigor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Severity Rating</label>
            <select
              name="severity"
              defaultValue="low"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="low">Low (Normal / Baseline)</option>
              <option value="medium">Medium (Precautionary)</option>
              <option value="high">High (Action Required)</option>
              <option value="critical">Critical (Economic Threshold Exceeded)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Diagnosis / Observation Title <span className="text-error">*</span>
          </label>
          <input
            name="title"
            type="text"
            placeholder="e.g. Early Blight lesions on lower canopy"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Field Inspection Notes (Akiyesi Aaye)
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Describe foliage symptoms, pest count per plant, water pooled or wilting..."
            className="w-full p-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Recommended Agronomic Action
          </label>
          <input
            name="recommended_action"
            type="text"
            placeholder="e.g. Rogue infected plants, apply bio-fungicide, adjust drip valve"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <ScreenDialogClose className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md">
            Cancel
          </ScreenDialogClose>
          <Button
            className="px-5 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary font-semibold shadow-sm"
            type="submit"
            disabled={cycleList.length === 0}
          >
            Save Scouting Record
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveObs ? "live" : "preview"}>
        {hasLiveObs
          ? `Showing ${obsList.length} field scouting observation${obsList.length === 1 ? "" : "s"} across ${cycleList.length} active crop cycle${cycleList.length === 1 ? "" : "s"}.`
          : "This module shows the design's sample records until you log your first field observation."}
      </LiveStrip>
      <FieldScouting
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <Link
                href={`/${lang}/account/crops`}
                className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all"
              >
                <Icon name="arrow_back" className="text-lg text-secondary" />
                <span>Crop Portfolio Engine</span>
              </Link>
              <ScreenDialog title="Log Field Scout" side="center" panel={logModal}>
                <Button
                  className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-container transition-all font-semibold"
                >
                  <Icon name="add_a_photo" className="text-lg" />
                  <span>+ Log New Scouting Observation</span>
                </Button>
              </ScreenDialog>
            </div>
          ),
          kpis: hasLiveObs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-lg">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold tracking-wider">
                    Total Season Scouting
                  </span>
                  <span className="p-1.5 rounded-lg bg-surface-container text-secondary">
                    <Icon name="fact_check" className="text-base" />
                  </span>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-metric-num text-metric-num text-on-surface">{obsList.length}</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center">
                    <Icon name="check" className="text-sm" /> Live logs
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Across {cycleList.length} active crop cycle{cycleList.length === 1 ? "" : "s"}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
                  <div className="bg-secondary h-1" style={{ width: "100%" }} />
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm uppercase text-error font-bold tracking-wider">
                    Critical / High Alerts
                  </span>
                  <span className="p-1.5 rounded-lg bg-error-container text-on-error-container">
                    <Icon name="bug_report" className="text-base" />
                  </span>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-metric-num text-metric-num text-error">{criticalCount}</span>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                    {criticalCount > 0 ? "Action Required" : "All Clear"}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Vectors requiring immediate agronomist hold or treatment
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
                  <div className="bg-error h-1" style={{ width: criticalCount > 0 ? "80%" : "0%" }} />
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold tracking-wider">
                    Cycles Tracked
                  </span>
                  <span className="p-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed-variant">
                    <Icon name="eco" className="text-base" />
                  </span>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-metric-num text-metric-num text-on-surface">{cycleList.length}</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center">
                    <Icon name="verified" className="text-sm" /> Monitored
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Phenological stages under telemetry observation
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
                  <div className="bg-secondary h-1" style={{ width: "90%" }} />
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold tracking-wider">
                    Extension Telemetry
                  </span>
                  <span className="p-1.5 rounded-lg bg-secondary-container text-on-secondary-container">
                    <Icon name="timer" className="text-base" />
                  </span>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-metric-num text-metric-num text-on-surface">24/7</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                    Live Sync
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Connected to farm inspection protocols
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
                  <div className="bg-secondary-container h-1" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          ) : undefined,
          feed: hasLiveObs ? (
            <div className="xl:col-span-7 flex flex-col gap-space-lg">
              {obsList.map((obs) => {
                const cycle = cycleMap.get(obs.crop_cycle_id);
                const isCrit = obs.severity === "high" || obs.severity === "critical";
                return (
                  <article
                    key={obs.id}
                    className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden relative"
                  >
                    <div className={`h-1.5 w-full ${isCrit ? "bg-error" : "bg-secondary"}`} />
                    <div className="p-space-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm pb-space-md">
                        <div>
                          <div className="flex items-center gap-space-xs mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1 uppercase ${
                                isCrit
                                  ? "bg-error-container text-on-error-container"
                                  : "bg-secondary-container text-on-secondary-container"
                              }`}
                            >
                              {obs.severity} Alert
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold capitalize">
                              {obs.observation_type}
                            </span>
                          </div>
                          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                            {obs.title}
                          </h2>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                            {cycle ? `${cycle.crop_name} (${cycle.variety || "Standard"})` : "Crop Cycle"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start bg-surface-container-low px-space-sm py-1 rounded-lg">
                          <Icon name="schedule" className="text-sm text-secondary" />
                          <span className="font-label-sm text-label-sm text-on-surface">
                            {obs.observed_at ? formatDate(obs.observed_at, lang) : "Logged recently"}
                          </span>
                        </div>
                      </div>

                      {obs.description && (
                        <div className="p-space-sm bg-surface-container-low rounded-lg mb-space-md border-l-4 border-secondary">
                          <p className="font-body-sm text-body-sm text-on-surface">{obs.description}</p>
                        </div>
                      )}

                      {obs.recommended_action && (
                        <div className="p-space-xs bg-surface-container rounded font-label-sm text-label-sm text-on-surface space-y-0.5 mb-space-sm">
                          <span className="font-bold text-primary flex items-center gap-1">
                            <Icon name="recommend" className="text-sm" /> Recommended Agronomic Action:
                          </span>
                          <p className="text-xs text-on-surface-variant">{obs.recommended_action}</p>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : undefined,
        }}
      />
    </>
  );
}
