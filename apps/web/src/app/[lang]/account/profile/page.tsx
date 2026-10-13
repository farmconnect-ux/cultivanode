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
  const account = await requireAccount(lang, { customer: true });
  const t = await getDictionary(lang);
  const p = t.acct.profile;
  return (
    <>
      <h1 className="text-3xl font-extrabold text-leaf-800">{p.title}</h1>
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h2 className="text-xl font-bold text-leaf-900">{t.acct.yourRoles}</h2>
            <p className="text-xs text-muted">
              {lang === "yo"
                ? "Àwọn ipa tí o ní lọ́wọ́lọ́wọ́ lórí pẹpẹ CultivaNode."
                : "Active roles currently attached to your account."}
            </p>
          </div>
          <a
            href={`/${lang}/account/roles`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-leaf-50 px-3 py-1.5 text-xs font-bold text-leaf-800 border border-leaf-200 hover:bg-leaf-100 transition-colors"
          >
            <span>{lang === "yo" ? "Ṣàkóso àti Beere Ipa Òmíràn" : "Manage & Request Other Roles"}</span>
            <span>&rarr;</span>
          </a>
        </div>
        {account.roles.length === 0 ? (
          <p className="text-sm text-muted">{t.acct.noRoles}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {account.roles.map((x) => (
              <span
                key={`${x.role}-${x.provider_type}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1 text-xs font-bold text-leaf-900"
              >
                <span className="text-leaf-600">✓</span>
                <span>
                  {x.provider_type
                    ? `${t.roleNames[x.role as keyof typeof t.roleNames]}: ${t.providerTypes[x.provider_type as keyof typeof t.providerTypes]}`
                    : t.roleNames[x.role as keyof typeof t.roleNames]}
                </span>
              </span>
            ))}
          </div>
        )}
      </Card>
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
