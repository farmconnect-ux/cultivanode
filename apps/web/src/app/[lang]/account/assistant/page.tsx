import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AiFarmAssistant } from "@/components/account/ai-farm-assistant";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { IntelligenceHub } from "@/components/screens/intelligence-hub";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CultivaNode Intelligence & AI" };

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
  const farms =
    farmsData && farmsData.length > 0
      ? farmsData.map((f) => ({ id: f.id, name: f.name, state: f.state, zone: f.zone as string | null }))
      : [{ id: "default-sw-farm", name: "South-West Pilot Parcel", state: "Oyo", zone: "rainforest" }];
  const { data: plotsData } = await supabase.from("plots").select("id, farm_id, name, area_ha").in("farm_id", farms.map((f) => f.id));

  return (
    <>
      <LiveStrip>
        <span className="text-on-surface-variant">
          The assistant answers live, grounded in IITA/NIHORT standards with NAFDAC chemical-safety checks. Briefing and vision panels show sample output.
        </span>
      </LiveStrip>
      <IntelligenceHub
        lang={lang}
        slots={{
          chat: (
            <section className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-low p-space-md">
                <div className="flex items-center gap-space-sm">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-container text-on-primary">
                    <Icon name="smart_toy" className="text-xl" />
                  </span>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">CultivaNode Core AI</h2>
                    <p className="text-body-sm text-on-surface-variant">Ask in English, Yorùbá or Pidgin — answers use your farms and plots.</p>
                  </div>
                </div>
              </div>
              <div className="p-space-md sm:p-space-lg">
                <AiFarmAssistant farms={farms} plots={plotsData ?? []} lang={lang} />
              </div>
            </section>
          ),
        }}
      />
    </>
  );
}
