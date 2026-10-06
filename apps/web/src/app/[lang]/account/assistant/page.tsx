import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFarmAssistant } from "@/components/account/ai-farm-assistant";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "AI Farm Assistant | CultivaNode",
};

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];

  const { data: farmsData } = await supabase
    .from("farms")
    .select("id, name, state, zone")
    .or(scope.join(","))
    .order("created_at");

  const farms =
    farmsData && farmsData.length > 0
      ? farmsData.map((f) => ({
          id: f.id,
          name: f.name,
          state: f.state,
          zone: f.zone as string | null,
        }))
      : [
          {
            id: "default-sw-farm",
            name: "South-West Pilot Parcel",
            state: "Oyo",
            zone: "rainforest",
          },
        ];

  const farmIds = farms.map((f) => f.id);
  const { data: plotsData } = await supabase
    .from("plots")
    .select("id, farm_id, name, area_ha")
    .in("farm_id", farmIds);

  const plots = plotsData ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <Link
            href={`/${lang}/account?ws=farmer`}
            className="text-xs font-semibold text-leaf-700 hover:underline"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-leaf-900">
            Agricultural AI Assistant
          </h1>
          <p className="text-xs text-muted">
            Grounding agronomy advice in IITA/NIHORT standards and enforcing NAFDAC agrochemical safety.
          </p>
        </div>
      </div>

      <AiFarmAssistant farms={farms} plots={plots} lang={lang} />
    </div>
  );
}
