import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { NgoProgrammes } from "@/components/screens/ngo-programmes";
import { hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "NGO & smallholder development programmes" };

export default async function Page({ params }: PageProps<"/[lang]/account/ngo">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const supabase = await createClient();

  const [{ count: memberCount }, { count: grantCount }] = await Promise.all([
    (supabase.from("farm_cooperative_members") as any).select("*", { count: "exact", head: true }),
    (supabase.from("farm_grant_applications") as any).select("*", { count: "exact", head: true }),
  ]);

  const hasData = (memberCount ?? 0) > 0 || (grantCount ?? 0) > 0;

  return (
    <>
      <LiveStrip tone={hasData ? "live" : "preview"}>
        {hasData
          ? `Development Impact Terminal: Supporting ${memberCount ?? 0} verified cooperative smallholders and ${grantCount ?? 0} active subsidy voucher interventions.`
          : "Development programmes dashboard displays reference smallholder metrics until project indicators sync."}
      </LiveStrip>
      <NgoProgrammes lang={lang} />
    </>
  );
}
