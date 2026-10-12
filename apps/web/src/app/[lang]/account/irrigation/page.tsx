import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { SmartIrrigation } from "@/components/screens/smart-irrigation";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import {
  recordIrrigationEvent,
  addWaterInfrastructure,
} from "@/actions/irrigation";

export const metadata: Metadata = { title: "Smart irrigation & water command" };

export default async function Page({ params }: PageProps<"/[lang]/account/irrigation">) {
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

  const { data: events } = farmIds.length
    ? await (supabase.from("farm_irrigation_events") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const eventList = (events ?? []) as any[];
  const hasLiveEvents = eventList.length > 0;

  const flushModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="water_drop" className="text-secondary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Execute Precision Irrigation Run
          </h3>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={recordIrrigationEvent} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Target Farm Zone <span className="text-error">*</span>
          </label>
          <select
            name="farm_id"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          >
            {farmList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.state})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Irrigation Sector / Zone</label>
            <input
              name="irrigation_zone"
              defaultValue="Zone A - Lowland Drip Manifold"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Duration (Minutes)</label>
            <input
              name="duration_minutes"
              type="number"
              defaultValue="45"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Water Volume (Litres)</label>
            <input
              name="water_volume_litres"
              type="number"
              defaultValue="1500"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Soil Target Moisture (%)</label>
            <input
              name="soil_moisture_after_percent"
              type="number"
              step="0.1"
              defaultValue="52.0"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="psychology" className="text-base shrink-0" />
          <span>Autonomous closed-loop valve actuator calculates water delivery based on real-time soil suction and solar radiation sensors.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </ScreenDialogClose>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Start Water Cycle
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveEvents ? "live" : "preview"}>
        {hasLiveEvents
          ? `Closed-Loop Irrigation: ${eventList.length} recorded precision water cycle${eventList.length === 1 ? "" : "s"} executed across automated manifold sectors.`
          : "Valve and moisture controls show reference telemetry until you execute a precision irrigation cycle."}
      </LiveStrip>

      <SmartIrrigation
        lang={lang}
        slots={{
          actions: (
            <div className="flex items-center gap-space-sm">
              <ScreenDialog title="Execute Water Cycle" side="center" panel={flushModal}>
                <button
                  type="button"
                  className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg flex items-center gap-1.5 shadow-sm hover:bg-primary-container transition-colors font-semibold"
                >
                  <Icon name="water_drop" className="text-[18px]" />
                  <span>Start Precision Run</span>
                </button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/iot`}
                className="px-space-md py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center gap-1.5 transition-colors"
              >
                <Icon name="sensors" className="text-[18px] text-secondary" />
                <span>IoT Sensors</span>
              </Link>
            </div>
          ),
        }}
      />
    </>
  );
}
