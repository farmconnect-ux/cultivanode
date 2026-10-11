import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { IotSmartFarm } from "@/components/screens/iot-smart-farm";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "IoT & smart farm" };

export default async function Page({ params }: PageProps<"/[lang]/account/iot">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">Sensor readings show sample data until a device is provisioned to one of your plots.</LiveStrip>
      <IotSmartFarm lang={lang} />
    </>
  );
}
