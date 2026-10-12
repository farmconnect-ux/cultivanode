import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { Button } from "@/components/ui";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { HarvestCommerce } from "@/components/screens/harvest-commerce";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  createHarvestBatch,
  listHarvestOnMarketplace,
  deleteHarvestBatch,
} from "@/actions/harvest";

export const metadata: Metadata = { title: "Produce & harvest commerce" };

export default async function Page({ params }: PageProps<"/[lang]/account/harvest">) {
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

  const { data: batches } = farmIds.length
    ? await (supabase.from("farm_harvest_batches") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const batchList = (batches ?? []) as any[];
  const hasLiveBatches = batchList.length > 0;

  const totalMt = batchList.reduce(
    (sum, b) => sum + (Number(b.quantity_metric_tons) || 0),
    0
  );

  const newLotModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="post_add" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            List New Harvest Lot
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={createHarvestBatch} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Producing Farm <span className="text-error">*</span>
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

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Crop or Commodity Name <span className="text-error">*</span>
          </label>
          <input
            name="crop_name"
            required
            placeholder="e.g. DMR-LSR-Y Yellow Maize, Roma Tomatoes, Clarias Catfish"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Harvest Parcel / Field</label>
            <input
              name="parcel_name"
              placeholder="e.g. Plot A1 Lowland"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Available Quantity (MT) <span className="text-error">*</span>
            </label>
            <input
              name="quantity_mt"
              type="number"
              step="0.01"
              required
              placeholder="e.g. 25.5"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Certified Moisture / Brix</label>
            <input
              name="certified_moisture_brix"
              placeholder="e.g. 12.2% moisture, 4.9° Brix"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Quality Grade</label>
            <select
              name="quality_grade"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="Grade A Premium">Grade A Premium (Strict export / Table)</option>
              <option value="Standard Feed Grade">Standard Commercial / Feed Grade</option>
              <option value="Industrial Processing Grade">Industrial Processing Grade</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Asking Farmgate (₦/MT)</label>
            <input
              name="price"
              type="number"
              placeholder="e.g. 420000"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Target Pickup Date</label>
            <input
              name="pickup_window_date"
              type="date"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Batch Notes &amp; Specifications</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Aflatoxin test certificate, storage conditions, packaging details..."
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="verified" className="text-base shrink-0" />
          <span>Automatic syndication dispatches to verified corporate buyers and institutional aggregators. Direct payment policy: 0% platform commission during pilot.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium">
            Cancel
          </ScreenDialogClose>
          <Button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Publish Harvest Lot
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveBatches ? "live" : "preview"}>
        {hasLiveBatches
          ? `Showing ${batchList.length} verified harvest lot${batchList.length === 1 ? "" : "s"} (${totalMt.toFixed(1)} MT total volume) for direct off-taker syndication.`
          : "Produce commerce lots show reference samples until you publish your first harvest lot from your farm."}
      </LiveStrip>

      <HarvestCommerce
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm shrink-0">
              <ScreenDialog title="List New Harvest Lot" side="center" panel={newLotModal}>
                <Button
                  type="button"
                  className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all shadow-md hover:shadow-lg"
                >
                  <Icon name="add_circle" className="text-lg" />
                  <span>List New Harvest Lot</span>
                </Button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/contracts`}
                className="relative inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-low transition-all"
              >
                <Icon name="assignment_turned_in" className="text-lg text-secondary" />
                <span>Review Off-taker Contracts</span>
              </Link>
              <Link
                href={`/${lang}/account/logistics`}
                className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-low transition-all"
              >
                <Icon name="local_shipping" className="text-lg text-on-surface-variant" />
                <span>Logistics &amp; Waybills</span>
              </Link>
            </div>
          ),
          lots: hasLiveBatches ? (
            <div className="flex flex-col gap-space-md">
              {batchList.map((batch) => {
                const priceFormatted = batch.asking_price_per_mt_minor
                  ? `₦${(batch.asking_price_per_mt_minor / 100).toLocaleString("en-NG")}`
                  : "Negotiable";
                return (
                  <div
                    key={batch.id}
                    className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md"
                  >
                    <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-high flex flex-col items-center justify-center p-3 text-center">
                      <Icon name="grain" className="text-4xl text-primary mb-1" />
                      <span className="font-label-sm text-label-sm font-bold text-on-surface line-clamp-1">
                        {batch.crop_name}
                      </span>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">
                        {batch.quality_grade || "Grade A"}
                      </span>
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur font-label-sm text-label-sm text-on-surface font-semibold">
                        {batch.parcel_name || "Field Lot"}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                              {batch.crop_name}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold capitalize">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                              {batch.status?.replace(/_/g, " ") || "Available"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-label-sm text-label-sm text-on-surface-variant block">Asking Farmgate</span>
                            <span className="font-headline-sm text-headline-sm text-primary font-bold">
                              {priceFormatted} <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">/ MT</span>
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 p-2.5 rounded-lg bg-surface-container-low">
                          <div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant block">Volume</span>
                            <span className="font-label-lg text-label-lg font-bold text-on-surface">
                              {batch.quantity_metric_tons} MT
                            </span>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant block">Moisture / Spec</span>
                            <span className="font-label-lg text-label-lg font-bold text-secondary">
                              {batch.certified_moisture_brix || "Verified"}
                            </span>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant block">Pickup Window</span>
                            <span className="font-label-lg text-label-lg font-bold text-on-surface">
                              {batch.pickup_window_date ? formatDate(batch.pickup_window_date, lang) : "Immediate"}
                            </span>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant block">Listed Date</span>
                            <span className="font-label-lg text-label-lg font-bold text-primary truncate block">
                              {formatDate(batch.created_at, lang)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-outline-variant/30">
                        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                          <Icon name="verified" className="text-sm text-secondary" />
                          <span>Direct Settlement Ready • 0% Platform Commission</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {batch.status !== "listed_marketplace" && (
                            <form action={listHarvestOnMarketplace}>
                              <input type="hidden" name="batch_id" value={batch.id} />
                              <Button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm"
                              >
                                Publish to Marketplace
                              </Button>
                            </form>
                          )}
                          <form action={deleteHarvestBatch}>
                            <input type="hidden" name="id" value={batch.id} />
                            <Button
                              type="submit"
                              className="px-3 py-1.5 rounded-lg bg-surface-container text-error hover:bg-error-container hover:text-on-error-container font-label-sm text-label-sm font-semibold transition-colors"
                            >
                              Archive
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : undefined,
        }}
      />
    </>
  );
}
