import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { FieldOperationsCalendar } from "@/components/screens/field-operations-calendar";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Field operations & calendar" };

export default async function Page({ params }: PageProps<"/[lang]/account/tasks">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">The calendar shows sample operations; your booked machinery jobs are listed under My Bookings.</LiveStrip>
      <FieldOperationsCalendar lang={lang} />
    </>
  );
}
