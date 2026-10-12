import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { Button } from "@/components/ui";
import { IotSmartFarm } from "@/components/screens/iot-smart-farm";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { recordTelemetryReading } from "@/actions/iot";

export const metadata: Metadata = { title: "IoT telemetry & smart farm" };

export default async function Page({ params }: PageProps<"/[lang]/account/iot">) {
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

  const { data: telemetry } = farmIds.length
    ? await (supabase.from("farm_iot_telemetry") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("recorded_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const telemetryList = (telemetry ?? []) as any[];
  const hasLiveTelemetry = telemetryList.length > 0;

  const sensorModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="sensors" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Simulate / Ingest Sensor Telemetry
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={recordTelemetryReading} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Target Farm Node <span className="text-error">*</span>
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
            <label className="block text-sm font-medium text-on-surface mb-1">Device Type</label>
            <select
              name="device_type"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="soil_sensor">FMCW Multi-Depth Soil Moisture</option>
              <option value="weather_station">Micro-Climatic Weather Station</option>
              <option value="water_flow">Ultrasonic Water Flow Meter</option>
              <option value="storage_temp">Silo Environmental Probe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Device Hardware ID</label>
            <input
              name="device_id"
              defaultValue="LORA-NODE-04"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Moisture (%)</label>
            <input
              name="soil_moisture"
              type="number"
              step="0.1"
              defaultValue="28.4"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Temp (°C)</label>
            <input
              name="soil_temperature"
              type="number"
              step="0.1"
              defaultValue="26.8"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">EC (dS/m)</label>
            <input
              name="electrical_conductivity"
              type="number"
              step="0.1"
              defaultValue="1.4"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="cell_tower" className="text-base shrink-0" />
          <span>LoRaWAN gateway ingests telemetry via ChirpStack v4 and syncs live rollups to irrigation automation triggers.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium">
            Cancel
          </ScreenDialogClose>
          <Button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Dispatch Telemetry Packet
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveTelemetry ? "live" : "preview"}>
        {hasLiveTelemetry
          ? `Telemetry Active: Ingesting live packets from ${telemetryList.length} edge transceivers across LoRaWAN Savanna Belts.`
          : "Sensor readings show reference telemetry until a device is provisioned to one of your farm plots."}
      </LiveStrip>

      <IotSmartFarm
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog title="Simulate Sensor Reading" side="center" panel={sensorModal}>
                <Button
                  className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-label-lg text-label-lg shadow-sm font-semibold"
                >
                  <Icon name="sensors" className="text-[18px]" />
                  <span>Ingest / Test Reading</span>
                </Button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/irrigation`}
                className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-all font-label-lg text-label-lg"
              >
                <Icon name="water_drop" className="text-[18px] text-secondary" />
                <span>Irrigation Control</span>
              </Link>
            </div>
          ),
        }}
      />
    </>
  );
}
