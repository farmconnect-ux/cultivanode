import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { Button } from "@/components/ui";
import { InsuranceHub } from "@/components/screens/insurance-hub";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  purchaseInsurancePolicy,
  fileInsuranceClaim,
} from "@/actions/insurance";

export const metadata: Metadata = { title: "Insurance & risk underwriting" };

export default async function Page({ params }: PageProps<"/[lang]/account/insurance">) {
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
    .select("id, name, state, lga, area_ha")
    .or(scope.join(","))
    .order("created_at");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: policies } = farmIds.length
    ? await (supabase.from("farm_insurance_policies") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const policyList = (policies ?? []) as any[];
  const hasLivePolicies = policyList.length > 0;

  const totalSumInsuredMinor = policyList.reduce(
    (sum, p) => sum + (Number(p.sum_insured_minor) || 0),
    0
  );

  const newPolicyModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="add_moderator" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Underwrite Multi-Peril / Parametric Policy
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={purchaseInsurancePolicy} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Insured Farm Enterprise <span className="text-error">*</span>
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
            <label className="block text-sm font-medium text-on-surface mb-1">Coverage Type</label>
            <select
              name="coverage_type"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="drought_parametric">Satellite Parametric Drought</option>
              <option value="flood_excess_rainfall">Excess Rainfall &amp; Inundation</option>
              <option value="multi_peril_yield">Multi-Peril Crop Yield Guarantee</option>
              <option value="biological_pest_shield">Fall Armyworm &amp; Blight Outbreak</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Insured Area (Ha)</label>
            <input
              name="insured_area_ha"
              type="number"
              step="0.1"
              defaultValue="5.0"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Total Sum Insured (₦) <span className="text-error">*</span>
          </label>
          <input
            name="sum_insured_minor"
            type="number"
            required
            placeholder="e.g. 2500000"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="verified_user" className="text-base shrink-0" />
          <span>Parametric claims disburse automatically via Leadway Assurance smart contracts when Sentinel-2 NDVI falls 25% below the 10-year mean. Direct settlement policy: 0% commission.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium">
            Cancel
          </ScreenDialogClose>
          <Button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Activate Policy
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLivePolicies ? "live" : "preview"}>
        {hasLivePolicies
          ? `Showing ${policyList.length} active insurance polic${policyList.length === 1 ? "y" : "ies"} (₦${(totalSumInsuredMinor / 100).toLocaleString("en-NG")} total sum insured) backed by Leadway & NAIC.`
          : "Insurance and risk underwriting displays reference actuarial indices until you underwrite a crop policy for your farm."}
      </LiveStrip>

      <InsuranceHub
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog title="Underwrite New Policy" side="center" panel={newPolicyModal}>
                <Button
                  className="flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-lg shadow-sm font-semibold"
                >
                  <Icon name="add_moderator" className="text-[18px]" />
                  <span>+ Underwrite New Policy</span>
                </Button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/crops`}
                className="flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-lg"
              >
                <Icon name="eco" className="text-[18px] text-primary" />
                <span>Crop Parity</span>
              </Link>
            </div>
          ),
        }}
      />
    </>
  );
}
