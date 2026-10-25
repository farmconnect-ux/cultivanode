import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ds/page-header";
import { CheckoutClient } from "@/components/marketplace/checkout-client";
import { hasLocale } from "@/i18n/config";
import { isOn } from "@/lib/flags";
import { createClient } from "@/lib/supabase/server";
import { serverPhrasebook, setPageLocale } from "@/i18n/marketing-server";
import YO from "@/i18n/yo-marketing/marketplace-checkout-page";

const tYo = serverPhrasebook(YO);

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: PageProps<"/[lang]/marketplace/checkout">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  setPageLocale(lang);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  let defaults = { state: "", lga: "", phone: "" };
  if (auth.user) {
    const { data: profile } = await supabase.from("profiles").select("state, lga, phone").eq("id", auth.user.id).maybeSingle();
    defaults = { state: profile?.state ?? "", lga: profile?.lga ?? "", phone: profile?.phone ?? auth.user.phone ?? "" };
  }

  const escrowOn = await isOn("escrow_payments");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: `/${lang}/marketplace`, label: "Back to the marketplace" }}
        title={tYo("Checkout")}
        description={
          escrowOn
            ? tYo("Prices and stock are checked again before you pay. Your payment is held in escrow until you confirm delivery.")
            : tYo("Prices and stock are checked again when you place the order. You then pay each seller directly by bank transfer. Paying through CultivaNode is coming soon.")
        }
      />
      <CheckoutClient lang={lang} signedIn={Boolean(auth.user)} defaults={defaults} escrowOn={escrowOn} />
    </div>
  );
}
