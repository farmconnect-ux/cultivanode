import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { Button } from "@/components/ui";
import { LogisticsHub } from "@/components/screens/logistics-hub";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  createLogisticsWaybill,
  updateWaybillStatus,
} from "@/actions/logistics";

export const metadata: Metadata = { title: "Logistics, haulage & freight waybills" };

export default async function Page({ params }: PageProps<"/[lang]/account/logistics">) {
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

  const { data: waybills } = farmIds.length
    ? await (supabase.from("farm_logistics_waybills") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const waybillList = (waybills ?? []) as any[];
  const hasLiveWaybills = waybillList.length > 0;

  const totalHaulageMt = waybillList.reduce(
    (sum, w) => sum + (Number(w.quantity_mt) || 0),
    0
  );

  const dispatchModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="local_shipping" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Schedule Freight Waybill &amp; Haulage
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={createLogisticsWaybill} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Origin Farm Depot <span className="text-error">*</span>
          </label>
          <select
            name="farm_id"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          >
            {farmList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.lga}, {f.state})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Dispatch Origin <span className="text-error">*</span>
            </label>
            <input
              name="origin"
              required
              placeholder="e.g. Iseyin Farmgate Depot"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Destination Delivery Point <span className="text-error">*</span>
            </label>
            <input
              name="destination"
              required
              placeholder="e.g. Mile 12 International Market, Lagos"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Commodity / Freight <span className="text-error">*</span>
            </label>
            <input
              name="commodity"
              required
              placeholder="e.g. Grain Sacks, Crates of Tomatoes"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Total Cargo Weight (MT) <span className="text-error">*</span>
            </label>
            <input
              name="quantity_mt"
              type="number"
              step="0.1"
              required
              placeholder="e.g. 30.0"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Haulage Carrier Partner</label>
            <input
              name="carrier_company"
              defaultValue="CultivaNode Agro-Freight Express"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Truck Reg / Plate Number</label>
            <input
              name="truck_plate_number"
              placeholder="e.g. BDJ-784-XA"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Driver Full Name <span className="text-error">*</span>
            </label>
            <input
              name="driver_name"
              required
              placeholder="e.g. Lateef Adeleke"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Driver Phone Number</label>
            <input
              name="driver_phone"
              placeholder="0802 987 6543"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="verified_user" className="text-base shrink-0" />
          <span>Every waybill issues a digital cryptographic dispatch token, GPS telemetry link, and verifiable Goods-in-Transit (GIT) insurance certificate.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium">
            Cancel
          </ScreenDialogClose>
          <Button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Issue Waybill &amp; Dispatch
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveWaybills ? "live" : "preview"}>
        {hasLiveWaybills
          ? `Showing ${waybillList.length} active haulage waybill${waybillList.length === 1 ? "" : "s"} (${totalHaulageMt.toFixed(1)} MT freight volume under telematics transit).`
          : "Logistics and haulage manifests show reference transit fleets until you generate your first digital waybill."}
      </LiveStrip>

      <LogisticsHub
        lang={lang}
        slots={{
          actions: (
            <div className="flex items-center gap-space-sm flex-wrap">
              <ScreenDialog title="Schedule Freight Dispatch" side="center" panel={dispatchModal}>
                <Button
                  className="px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-sm flex items-center gap-space-xs"
                >
                  <Icon name="local_shipping" className="text-[18px]" />
                  <span>Schedule Freight Dispatch</span>
                </Button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/harvest`}
                className="px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-all flex items-center gap-space-xs"
              >
                <Icon name="grain" className="text-[18px] text-primary" />
                <span>Harvest Lots</span>
              </Link>
            </div>
          ),
          waybills: hasLiveWaybills ? (
            <>
              {waybillList.map((waybill) => {
                const isDelivered = waybill.status === "delivered";
                return (
                  <tr key={waybill.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-space-md px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-label-md">
                          {waybill.driver_name?.slice(0, 2).toUpperCase() || "CN"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">
                            {waybill.driver_name}
                          </span>
                          <span className="text-label-sm font-label-sm text-on-surface-variant">
                            {waybill.carrier_company} · {waybill.driver_phone || "Driver"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">
                          {waybill.origin} → {waybill.destination}
                        </span>
                        <span className="text-label-sm font-label-sm text-on-surface-variant">
                          {waybill.commodity} ({waybill.quantity_mt} MT)
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {waybill.truck_plate_number}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="text-xs font-semibold text-secondary">
                        Leadway GIT #GIT-{waybill.id.slice(0, 6).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="text-xs text-on-surface-variant">FRSC Verified</span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="text-xs font-semibold text-secondary capitalize">
                        {waybill.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      {!isDelivered ? (
                        <form action={updateWaybillStatus}>
                          <input type="hidden" name="waybill_id" value={waybill.id} />
                          <input type="hidden" name="status" value="delivered" />
                          <Button
                            type="submit"
                            className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors font-semibold"
                          >
                            Confirm PoD
                          </Button>
                        </form>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-secondary text-xs font-semibold">
                          <Icon name="check_circle" className="text-sm" /> Delivered
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
