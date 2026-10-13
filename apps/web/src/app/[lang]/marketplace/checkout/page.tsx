import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ds/page-header";
import { CheckoutClient } from "@/components/marketplace/checkout-client";
import { hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Checkout & escrow" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: PageProps<"/[lang]/marketplace/checkout">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  let defaults = { state: "", lga: "", phone: "" };
  if (auth.user) {
    const { data: profile } = await supabase.from("profiles").select("state, lga, phone").eq("id", auth.user.id).maybeSingle();
    defaults = { state: profile?.state ?? "", lga: profile?.lga ?? "", phone: profile?.phone ?? auth.user.phone ?? "" };
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: `/${lang}/marketplace`, label: "Back to the marketplace" }}
        title="Checkout"
        description="Prices and stock are checked again before you pay. Your payment is held in escrow until you confirm delivery."
      />
      <CheckoutClient lang={lang} signedIn={Boolean(auth.user)} defaults={defaults} />
    </div>
  );
}
