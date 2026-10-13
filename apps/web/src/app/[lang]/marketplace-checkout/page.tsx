import { redirect } from "next/navigation";

// Old link from the marketplace design; the checkout lives under /marketplace/checkout.
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${lang}/marketplace/checkout`);
}
