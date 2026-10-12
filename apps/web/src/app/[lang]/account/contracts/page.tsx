import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { Button } from "@/components/ui";
import { OfftakeContracts } from "@/components/screens/offtake-contracts";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  createOfftakeContract,
  signOfftakeContract,
  updateContractStatus,
} from "@/actions/contracts";

export const metadata: Metadata = { title: "Off-take contracts & structured agreements" };

export default async function Page({ params }: PageProps<"/[lang]/account/contracts">) {
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

  const { data: contracts } = farmIds.length
    ? await (supabase.from("farm_offtake_contracts") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const contractList = (contracts ?? []) as any[];
  const hasLiveContracts = contractList.length > 0;

  const totalCommittedMt = contractList.reduce(
    (sum, c) => sum + (Number(c.contracted_quantity_mt) || 0),
    0
  );
  const totalValueMinor = contractList.reduce(
    (sum, c) => sum + (Number(c.contract_value_minor) || 0),
    0
  );

  const draftModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="handshake" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Draft Master Off-take Contract
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={createOfftakeContract} className="space-y-4 text-left">
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Off-taker / Buyer Entity <span className="text-error">*</span>
            </label>
            <input
              name="buyer_name"
              required
              placeholder="e.g. Psaltry Int'l, Grand Cereals"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Commodity / Variety <span className="text-error">*</span>
            </label>
            <input
              name="commodity"
              required
              placeholder="e.g. White Maize, Cassava Roots"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Contracted Tonnage (MT) <span className="text-error">*</span>
            </label>
            <input
              name="contracted_quantity_mt"
              type="number"
              step="0.1"
              required
              placeholder="e.g. 500"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Fixed Price per MT (₦) <span className="text-error">*</span>
            </label>
            <input
              name="price_per_mt_minor"
              type="number"
              required
              placeholder="e.g. 420000"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Target Delivery Date <span className="text-error">*</span>
            </label>
            <input
              name="target_delivery_date"
              type="date"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Delivery Depot / Location</label>
            <input
              name="delivery_location"
              placeholder="e.g. Iseyin Aggregation Depot"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Quality &amp; Technical Specifications</label>
          <input
            name="quality_specifications"
            placeholder="e.g. Maximum 12.5% moisture, starch content > 68%, zero mold"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Covenants &amp; Terms</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Multi-stage tranche payments, logistics liability, force majeure provisions..."
            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="verified_user" className="text-base shrink-0" />
          <span>Contracts are structured under CAMA 2020 legal provisions with automated cryptographic SHA-256 seal upon bilateral execution. Direct settlement policy: 0% platform commission.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium">
            Cancel
          </ScreenDialogClose>
          <Button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Create Master Contract
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveContracts ? "live" : "preview"}>
        {hasLiveContracts
          ? `Showing ${contractList.length} legal off-take agreement${contractList.length === 1 ? "" : "s"} (${totalCommittedMt.toFixed(1)} MT committed volume, ₦${(totalValueMinor / 100).toLocaleString("en-NG")} total contracted value).`
          : "Structured off-take contracts show reference legal agreements until you draft your first bilateral off-take contract."}
      </LiveStrip>

      <OfftakeContracts
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog title="Draft Master Contract" side="center" panel={draftModal}>
                <Button
                  className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-md"
                >
                  <Icon name="add_circle" className="text-[18px]" />
                  <span>Draft Master Contract</span>
                </Button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/harvest`}
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors shadow-sm"
              >
                <Icon name="grain" className="text-[18px] text-primary" />
                <span>Produce Lots</span>
              </Link>
              <Link
                href={`/${lang}/account/logistics`}
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors shadow-sm"
              >
                <Icon name="local_shipping" className="text-[18px] text-secondary" />
                <span>Dispatch Schedule</span>
              </Link>
            </div>
          ),
          contracts: hasLiveContracts ? (
            <>
              {contractList.map((contract) => {
                const valueFormatted = contract.contract_value_minor
                  ? `₦${(contract.contract_value_minor / 100).toLocaleString("en-NG")}`
                  : "₦0";
                const isEscrowActive = contract.contract_status === "active_escrow";
                const isCompleted = contract.contract_status === "delivered" || contract.contract_status === "settled";

                return (
                  <tr key={contract.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-space-md px-space-md font-semibold text-primary">
                      <div>#{contract.id.slice(0, 8).toUpperCase()}</div>
                      <span className="text-label-sm font-label-sm text-outline">
                        CAMA 2020 • {contract.commodity}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="font-semibold text-on-surface block">
                        {contract.buyer_company || contract.buyer_name}
                      </span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">
                        {contract.delivery_location || "Designated Depot"}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="font-semibold text-on-surface">
                        {contract.contracted_quantity_mt} MT
                      </div>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">
                        Target: {formatDate(contract.target_delivery_date, lang)}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="font-semibold text-primary">{valueFormatted}</div>
                      <span className="text-label-sm font-label-sm text-outline">
                        @ ₦{((contract.price_per_mt_minor || 0) / 100).toLocaleString("en-NG")} / MT
                      </span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          name={isEscrowActive ? "lock" : "lock_open"}
                          className={`text-sm ${isEscrowActive ? "text-secondary" : "text-on-surface-variant"}`}
                        />
                        <span className="font-semibold text-on-surface text-xs">
                          {contract.escrow_custody_bank || "Zenith Bank Custody"}
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span
                        className={`inline-flex items-center gap-1 px-space-xs py-0.5 rounded text-label-sm font-label-sm font-semibold capitalize ${
                          isCompleted
                            ? "bg-primary/20 text-primary"
                            : isEscrowActive
                              ? "bg-secondary-fixed text-on-secondary-fixed"
                              : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {contract.contract_status?.replace(/_/g, " ") || "Proposed"}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isEscrowActive && !isCompleted && (
                          <form action={signOfftakeContract}>
                            <input type="hidden" name="contract_id" value={contract.id} />
                            <Button
                              type="submit"
                              className="px-space-sm py-1 bg-secondary text-on-secondary rounded text-label-sm font-label-sm hover:opacity-90 font-semibold transition-opacity"
                            >
                              Sign &amp; Lock
                            </Button>
                          </form>
                        )}
                        {isEscrowActive && (
                          <form action={updateContractStatus}>
                            <input type="hidden" name="contract_id" value={contract.id} />
                            <input type="hidden" name="status" value="delivered" />
                            <Button
                              type="submit"
                              className="px-space-sm py-1 bg-primary text-on-primary rounded text-label-sm font-label-sm hover:bg-primary-container font-semibold transition-colors"
                            >
                              Confirm Delivery
                            </Button>
                          </form>
                        )}
                      </div>
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
