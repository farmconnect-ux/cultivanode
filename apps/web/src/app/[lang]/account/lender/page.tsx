import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { LenderHub } from "@/components/screens/lender-hub";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import { submitLoanApplication } from "@/actions/credit";

export const metadata: Metadata = { title: "Lender & agricultural credit portal" };

export default async function Page({ params }: PageProps<"/[lang]/account/lender">) {
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

  const { data: applications } = farmIds.length
    ? await (supabase.from("farm_credit_assessments") as any)
        .select("*")
        .in("farm_id", farmIds)
        .not("loan_requested_minor", "is", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  const appList = (applications ?? []) as any[];
  const hasLiveApps = appList.length > 0;

  const applyModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="account_balance" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Apply for Agricultural Credit Facility
          </h3>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={submitLoanApplication} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Applicant Farm Enterprise <span className="text-error">*</span>
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
              Facility Amount (₦) <span className="text-error">*</span>
            </label>
            <input
              name="loan_requested_minor"
              type="number"
              required
              placeholder="e.g. 5000000"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Lending Institution</label>
            <select
              name="lender_institution"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="Bank of Agriculture (BOA)">Bank of Agriculture (BOA)</option>
              <option value="Sterling Bank Agri-Desk">Sterling Bank Agri-Desk</option>
              <option value="Jaiz Bank Non-Interest Agro-Finance">Jaiz Bank Non-Interest Agro-Finance</option>
              <option value="NIRSAL Microfinance Bank">NIRSAL Microfinance Bank</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Facility Purpose &amp; Allocation <span className="text-error">*</span>
          </label>
          <input
            name="loan_purpose"
            required
            defaultValue="Seasonal Inputs, Mechanization Services & Irrigation Working Capital"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="verified_user" className="text-base shrink-0" />
          <span>Facility proceeds are disbursed directly to verified input suppliers and tractor syndicates in structured tranches to eliminate cash diversion and maximize repayment certainty.</span>
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
            Submit Credit Appraisal
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveApps ? "live" : "preview"}>
        {hasLiveApps
          ? `Showing ${appList.length} active credit appraisal application${appList.length === 1 ? "" : "s"} under institutional review.`
          : "Commercial agricultural credit window displays reference appraisals until you submit a credit request for your farm."}
      </LiveStrip>

      <LenderHub
        lang={lang}
        slots={{
          actions: (
            <div className="flex items-center gap-space-sm">
              <ScreenDialog title="Apply for Facility" side="center" panel={applyModal}>
                <button
                  type="button"
                  className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-lg flex items-center gap-1.5 hover:bg-primary-container transition-all shadow-sm font-semibold"
                >
                  <Icon name="add_circle" className="text-[18px]" />
                  <span>+ New Facility Appraisal</span>
                </button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/reports`}
                className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1 hover:bg-surface-container-high transition-colors font-medium"
              >
                <Icon name="verified_user" className="text-[18px] text-primary" />
                <span>Credit Dossier</span>
              </Link>
            </div>
          ),
        }}
      />
    </>
  );
}
