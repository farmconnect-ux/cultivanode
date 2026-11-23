import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AiFarmAssistant } from "@/components/account/ai-farm-assistant";
import { PageHeader } from "@/components/ds/page-header";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Farm assistant" };

// Only the real assistant is shown. The design screen around it (components/screens/intelligence-hub)
// carried a sample "morning briefing", a made-up tomato diagnosis, invented accuracy figures and buttons
// such as "Release Escrow Funds" that did nothing; it is no longer used here.
export default async function AssistantPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farmsData } = await supabase.from("farms").select("id, name, state, zone").or(scope.join(",")).order("created_at");
  // No invented farm when the user has none. Every answer is audited against a farm, so the
  // assistant asks the user to add a farm first (FARM_CONTEXT_REQUIRED_FOR_AUDIT on the API).
  const farms = (farmsData ?? []).map((f) => ({ id: f.id, name: f.name, state: f.state, zone: f.zone as string | null }));
  const farmIds = farms.map((f) => f.id);
  const [{ data: plotsData }, { data: cyclesData }, { data: consent }] = await Promise.all([
    farmIds.length
      ? supabase.from("plots").select("id, farm_id, name, area_ha").in("farm_id", farmIds)
      : Promise.resolve({ data: [] as Array<{ id: string; farm_id: string; name: string; area_ha: number | null }> }),
    // Batch 03.4: the farmer picks one of their own active crop cycles; the server re-verifies it.
    // Same lifecycle values as the Live Farm Context service (planning and terminal states excluded).
    farmIds.length
      ? supabase
          .from("crop_cycles")
          .select("id, farm_id, plot_id, crop_id, current_stage, status")
          .in("farm_id", farmIds)
          .in("status", ["land_preparation", "planting", "establishment", "maintenance", "harvesting"])
          .order("planting_date", { ascending: false })
      : Promise.resolve({
          data: [] as Array<{ id: string; farm_id: string; plot_id: string | null; crop_id: string; current_stage: string; status: string }>,
        }),
    // The assistant API refuses requests without current `ai_intelligence` consent, so ask first.
    supabase
      .from("current_consents")
      .select("granted")
      .eq("profile_id", account.userId)
      .eq("consent_type", "ai_intelligence")
      .maybeSingle(),
  ]);
  const cycles = (cyclesData ?? []).map((c) => ({
    id: c.id,
    farm_id: c.farm_id,
    plot_id: c.plot_id,
    crop_id: c.crop_id,
    current_stage: c.current_stage,
  }));

  return (
    <>
      <PageHeader
        title="Farm assistant"
        description="Ask about your crops, fertiliser, pests or animals in English, Yorùbá or Pidgin. Answers use the records of the farm and crop you pick. Check any chemical advice with the product label or an extension agent before you spray."
      />
      <section className="overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg">
        <AiFarmAssistant
          farms={farms}
          plots={plotsData ?? []}
          cycles={cycles}
          aiConsentGranted={consent?.granted === true}
          lang={lang}
        />
      </section>
    </>
  );
}
