import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { MessagingHub } from "@/components/screens/messaging-hub";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Messages" };

export default async function Page({ params }: PageProps<"/[lang]/account/messages">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">This module shows the design's sample records until it is connected to your account data.</LiveStrip>
      <MessagingHub lang={lang} />
    </>
  );
}
