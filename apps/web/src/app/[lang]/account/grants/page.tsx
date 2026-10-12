import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { Button } from "@/components/ui";
import { GrantsHub } from "@/components/screens/grants-hub";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import { submitGrantApplication } from "@/actions/grants";

export const metadata: Metadata = { title: "Grants, subsidies & sovereign agro-programmes" };

export default async function Page({ params }: PageProps<"/[lang]/account/grants">) {
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

  const { data: grants } = farmIds.length
    ? await (supabase.from("farm_grant_applications") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const grantList = (grants ?? []) as any[];
  const hasLiveGrants = grantList.length > 0;

  const grantModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="assignment_add" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Apply for Agro-Subsidy &amp; Input Voucher
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <form action={submitGrantApplication} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Beneficiary Farm <span className="text-error">*</span>
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
          <label className="block text-sm font-medium text-on-surface mb-1">Programme Window</label>
          <select
            name="programme_name"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          >
            <option value="National Agricultural Growth Scheme (NAGS-AP)">National Agricultural Growth Scheme (NAGS-AP)</option>
            <option value="Oyo State Cares (Oyo-AgRes) Input Subsidies">Oyo State Cares (Oyo-AgRes) Input Subsidies</option>
            <option value="AfDB Special Agro-Industrial Processing Zone (SAPZ)">AfDB Special Agro-Industrial Processing Zone (SAPZ)</option>
            <option value="World Bank Agro-Climatic Resilience (ACReSAL)">World Bank Agro-Climatic Resilience (ACReSAL)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Grant / Voucher Type</label>
            <select
              name="grant_type"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="fertilizer_voucher">50% Subsidized Fertilizer Voucher</option>
              <option value="certified_seed_pack">Foundation Certified Seeds Grant</option>
              <option value="solar_irrigation_kit">Off-Grid Solar Water Pump Grant</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Requested Value (₦)</label>
            <input
              name="requested_value_minor"
              type="number"
              defaultValue="250000"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="verified" className="text-base shrink-0" />
          <span>Vouchers are tokenized with unique cryptographic codes redeemable directly at verified agro-dealer redemption centers across Oyo State. Direct settlement policy: 0% platform commission.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium">
            Cancel
          </ScreenDialogClose>
          <Button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveGrants ? "live" : "preview"}>
        {hasLiveGrants
          ? `Showing ${grantList.length} sovereign subsidy voucher${grantList.length === 1 ? "" : "s"} under NAGS-AP and Oyo-AgRes verification.`
          : "Government and donor subsidy window displays reference allocations until you apply for input or mechanization grants."}
      </LiveStrip>

      <GrantsHub
        lang={lang}
        slots={{
          actions: (
            <div className="flex items-center gap-space-sm">
              <ScreenDialog title="Apply for Voucher" side="center" panel={grantModal}>
                <Button
                  className="flex items-center gap-space-xs px-space-md py-1.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-primary transition-all font-semibold"
                >
                  <Icon name="assignment_add" className="text-[18px] text-secondary-fixed" />
                  <span>Apply for Voucher</span>
                </Button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/cooperative`}
                className="flex items-center gap-space-xs px-space-md py-1.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-lg shadow-sm hover:bg-surface-container transition-all"
              >
                <Icon name="groups" className="text-[18px] text-secondary" />
                <span>Cooperative Pooling</span>
              </Link>
            </div>
          ),
        }}
      />
    </>
  );
}
