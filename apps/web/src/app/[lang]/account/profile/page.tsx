import { notFound } from "next/navigation";
import { signOutEverywhere } from "@/actions/auth";
import { ProfileForm } from "@/components/account/profile-form";
import { Button, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";

export default async function ProfilePage({ params }: PageProps<"/[lang]/account/profile">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const p = t.acct.profile;
  return (
    <>
      <h1 className="text-3xl font-extrabold text-leaf-800">{p.title}</h1>
      <Card>
        <ProfileForm lang={lang} profile={account.profile} t={t} />
      </Card>
      <Card className="flex flex-col gap-3">
        <p className="text-muted">{p.signOutAllHint}</p>
        <form action={signOutEverywhere}>
          <input type="hidden" name="lang" value={lang} />
          <Button type="submit" variant="secondary">{p.signOutAll}</Button>
        </form>
      </Card>
    </>
  );
}
