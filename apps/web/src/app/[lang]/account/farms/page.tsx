import { notFound } from "next/navigation";
import { FarmerDashboard } from "@/components/account/farmer-dashboard";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export default async function FarmsPage({ params }: PageProps<"/[lang]/account/farms">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
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

  return (
    <FarmerDashboard
      lang={lang}
      account={account}
      t={t}
      farms={farms ?? []}
      bookings={[]}
      initialTab="farms"
    />
  );
}
