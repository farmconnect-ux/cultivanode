import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { ResearchExtension } from "@/components/screens/research-extension";
import { hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Research & agricultural extension station" };

export default async function Page({ params }: PageProps<"/[lang]/account/research">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const supabase = await createClient();

  const [{ count: obsCount }, { count: cycleCount }] = await Promise.all([
    supabase.from("crop_observations").select("*", { count: "exact", head: true }),
    supabase.from("crop_cycles").select("*", { count: "exact", head: true }),
  ]);

  const hasData = (obsCount ?? 0) > 0 || (cycleCount ?? 0) > 0;

  return (
    <>
      <LiveStrip tone={hasData ? "live" : "preview"}>
        {hasData
          ? `IITA & NIHORT Research Station Link: Aggregating ${obsCount ?? 0} field scouting observations and ${cycleCount ?? 0} active phenology trials.`
          : "Agronomic research and extension terminal displays reference trial indices until field observation datasets sync."}
      </LiveStrip>
      <ResearchExtension lang={lang} />
    </>
  );
}
