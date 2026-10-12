import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { CreditReadiness } from "@/components/screens/credit-readiness";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  generateCreditDossier,
  submitLoanApplication,
} from "@/actions/credit";

export const metadata: Metadata = { title: "Verified records & credit readiness" };

export default async function Page({ params }: PageProps<"/[lang]/account/reports">) {
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

  const { data: assessments } = farmIds.length
    ? await (supabase.from("farm_credit_assessments") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const assessmentList = (assessments ?? []) as any[];
  const hasLiveAssessments = assessmentList.length > 0;
  const latestAssessment = assessmentList[0];

  const generateDossierModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="verified_user" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Generate Credit Readiness Dossier (§9.1 / §9.6)
          </h3>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={generateCreditDossier} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Target Farm Enterprise <span className="text-error">*</span>
          </label>
          <select
            name="farm_id"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          >
            {farmList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.area_ha ?? 2.5} ha - {f.lga}, {f.state})
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 rounded-lg bg-surface-container-low text-xs space-y-2">
          <div className="font-semibold text-on-surface flex items-center gap-1.5">
            <Icon name="shield" className="text-secondary text-sm" />
            <span>Cryptographic Proof Ingredients Included:</span>
          </div>
          <ul className="list-disc pl-4 text-on-surface-variant space-y-1">
            <li>Cadastral boundary survey polygons and satellite NDVI historical index</li>
            <li>Crop phenology cycle yields corroborated by harvest off-taker waybills</li>
            <li>Mechanization service booking records with GPS clock-in logs</li>
            <li>Zero algorithmic black-box bias; CBN &amp; NIRSAL underwriting compliant</li>
          </ul>
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
            Compile &amp; Seal Dossier
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveAssessments ? "live" : "preview"}>
        {hasLiveAssessments
          ? `Active Credit Dossier: Score ${latestAssessment.risk_score}/100 (${latestAssessment.credit_readiness_tier}) backed by ${latestAssessment.verified_cadastral_hectares} ha verified cadastral data.`
          : "Scores and records show reference samples; compile your formal credit dossier from your verified crop cycles and farm plots."}
      </LiveStrip>

      <CreditReadiness
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
              <ScreenDialog title="Generate Credit Dossier" side="center" panel={generateDossierModal}>
                <button
                  type="button"
                  className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-label-lg text-label-lg shadow-sm"
                >
                  <Icon name="verified_user" className="text-[18px]" />
                  <span>Generate Credit Dossier</span>
                </button>
              </ScreenDialog>
              <Link
                href={`/${lang}/account/lender`}
                className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors font-label-lg text-label-lg shadow-sm"
              >
                <Icon name="account_balance" className="text-[18px] text-primary" />
                <span>Lender Window</span>
              </Link>
            </div>
          ),
        }}
      />
    </>
  );
}
