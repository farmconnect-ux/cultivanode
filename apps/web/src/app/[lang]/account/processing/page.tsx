import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { Button } from "@/components/ui";
import { ProcessingOps } from "@/components/screens/processing-ops";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  recordProcessingIntake,
  recordProcessingOutput,
} from "@/actions/processing";

export const metadata: Metadata = { title: "Agro-processing & value-addition operations" };

export default async function Page({ params }: PageProps<"/[lang]/account/processing">) {
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

  const { data: batches } = farmIds.length
    ? await (supabase.from("farm_processing_batches") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const batchList = (batches ?? []) as any[];
  const hasLiveBatches = batchList.length > 0;

  const intakeModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="factory" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Log Raw Material Intake &amp; Run
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={recordProcessingIntake} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Producing Farm / Sourcing <span className="text-error">*</span>
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
            <label className="block text-sm font-medium text-on-surface mb-1">
              Raw Commodity Intake <span className="text-error">*</span>
            </label>
            <input
              name="commodity_intake"
              required
              placeholder="e.g. Cassava Roots (TME-419), Paddy Rice"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Intake Weight (kg) <span className="text-error">*</span>
            </label>
            <input
              name="intake_weight_kg"
              type="number"
              step="1"
              required
              placeholder="e.g. 10000"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Target Value Product <span className="text-error">*</span>
            </label>
            <input
              name="processed_output_product"
              required
              placeholder="e.g. High Quality Cassava Flour (HQCF), Parboiled Rice"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Processing Facility</label>
            <input
              name="processing_facility"
              defaultValue="Iseyin Agro-Industrial Milling Complex"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="verified" className="text-base shrink-0" />
          <span>Extraction yield ratios and boiler energy consumption metrics are auto-computed according to standard agro-processing benchmarks.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium">
            Cancel
          </ScreenDialogClose>
          <Button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Start Processing Run
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveBatches ? "live" : "preview"}>
        {hasLiveBatches
          ? `Showing ${batchList.length} active value-addition batch${batchList.length === 1 ? "" : "es"} across processing facilities.`
          : "Agro-processing operations show reference extraction runs until you log your first material transformation batch."}
      </LiveStrip>

      <ProcessingOps
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog title="Log Raw Material Intake" side="center" panel={intakeModal}>
                <Button
                  className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all"
                >
                  <Icon name="input" className="text-[18px]" />
                  <span>Log Raw Material Intake</span>
                </Button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/harvest`}
                className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container transition-all"
              >
                <Icon name="grain" className="text-[18px] text-primary" />
                <span>Harvest Silo Feed</span>
              </Link>
            </div>
          ),
          batches: hasLiveBatches ? (
            <>
              {batchList.map((batch) => {
                const isCompleted = batch.status === "completed";
                const intakeMt = (Number(batch.intake_weight_kg) / 1000).toFixed(1);
                const outputMt = (Number(batch.output_quantity_kg) / 1000).toFixed(1);
                return (
                  <tr key={batch.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-space-sm font-semibold text-on-surface">
                      {batch.commodity_intake}
                      <span className="block font-label-sm text-label-sm font-normal text-on-surface-variant">
                        {batch.processed_output_product}
                      </span>
                    </td>
                    <td className="py-3 px-space-sm text-on-surface font-medium">
                      {intakeMt} MT
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-semibold text-primary">
                        {outputMt} MT ({batch.extraction_efficiency_rate}%)
                      </div>
                      <span className="text-secondary font-label-sm text-label-sm">
                        {batch.processing_facility}
                      </span>
                    </td>
                    <td className="py-3 px-space-sm text-on-surface-variant">
                      NAFDAC / ISO Compliant
                    </td>
                    <td className="py-3 px-space-sm text-on-surface font-medium capitalize">
                      {batch.status}
                    </td>
                    <td className="py-3 px-space-sm text-right">
                      {!isCompleted ? (
                        <form action={recordProcessingOutput}>
                          <input type="hidden" name="batch_id" value={batch.id} />
                          <Button
                            type="submit"
                            className="px-2 py-1 rounded bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
                          >
                            Complete Batch
                          </Button>
                        </form>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold font-label-sm text-label-sm">
                          Finished
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </>
          ) : undefined,
        }}
      />
    </>
  );
}
