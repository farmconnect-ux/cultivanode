import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FarmHealthRisk } from "@/components/screens/farm-health-risk";
import { hasLocale } from "@/i18n/config";
import { getLivePilotWeather } from "@/lib/weather";

export const metadata: Metadata = { title: "Farm health & risk" };

export default async function Page({ params }: PageProps<"/[lang]/account/weather">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const weather = await getLivePilotWeather();

  return <FarmHealthRisk lang={lang} weatherData={weather} />;
}
