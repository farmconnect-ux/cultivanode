import { notFound } from "next/navigation";
import { FarmerDashboard } from "@/components/account/farmer-dashboard";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function WeatherStationPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang as Locale);
  const t = await getDictionary(lang as Locale);
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
      lang={lang as Locale}
      account={account}
      t={t}
      farms={farms ?? []}
      bookings={[]}
      initialTab="weather"
    />
  );
}
