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
  // No invented farm when the user has none: the assistant still answers general questions.
  const farms = (farmsData ?? []).map((f) => ({ id: f.id, name: f.name, state: f.state, zone: f.zone as string | null }));
  const { data: plotsData } = farms.length
    ? await supabase.from("plots").select("id, farm_id, name, area_ha").in("farm_id", farms.map((f) => f.id))
    : { data: [] };

  return (
    <>
      <PageHeader
        title="Farm assistant"
        description="Ask about your crops, fertiliser, pests or animals in English, Yorùbá or Pidgin. Answers use your farms and plots. Check any chemical advice with the product label or an extension agent before you spray."
      />
      <section className="overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg">
        <AiFarmAssistant farms={farms} plots={plotsData ?? []} lang={lang} />
      </section>
    </>
  );
}
