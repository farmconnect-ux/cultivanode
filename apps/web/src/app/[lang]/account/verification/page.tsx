import { notFound } from "next/navigation";
import { setConsent } from "@/actions/account";
import { BankCheckForm, IdCheckForm } from "@/components/account/identity-forms";
import { Badge, Button, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { callFunction } from "@/lib/account/functions";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

export default async function VerificationPage({ params }: PageProps<"/[lang]/account/verification">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const v = t.acct.verification;
  const supabase = await createClient();
  const [{ data: checks }, { data: accounts }, { data: consent }] = await Promise.all([
    supabase.from("verifications").select("kind, status, masked_value, created_at")
      .eq("profile_id", account.userId).order("created_at", { ascending: false }),
    supabase.from("bank_accounts").select("id, bank_name, account_name, account_number_last4, status, is_default")
      .eq("profile_id", account.userId).order("created_at", { ascending: false }),
    supabase.from("current_consents").select("granted").eq("profile_id", account.userId).eq("consent_type", "data_processing").maybeSingle(),
  ]);
  const verified = (kind: string) => (checks ?? []).find((c) => c.kind === kind && c.status === "verified");
  const nin = verified("nin");
  const bvn = verified("bvn");
  const hasConsent = consent?.granted === true;

  let banks: { code: string; name: string }[] | null = null;
  if (hasConsent && nin) {
    const res = await callFunction<{ banks: { code: string; name: string }[] }>("verify-identity", { action: "banks" });
    banks = res.ok ? [...res.data.banks].sort((a, b) => a.name.localeCompare(b.name)) : null;
  }

  const statusLine = (row: { masked_value: string | null } | undefined) =>
    row ? <Badge className="bg-leaf-100 text-leaf-800">{fill(v.verifiedAs, { masked: row.masked_value ?? "" })}</Badge>
        : <Badge>{v.notYet}</Badge>;

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{v.title}</h1>
        <p className="mt-2 text-muted">{v.intro}</p>
        <p className="mt-2 font-semibold text-leaf-700">{t.acct.tiers[account.profile.verification_tier]}</p>
      </div>

      {!hasConsent ? (
        <Card className="flex flex-col gap-3">
          <p>{v.consentNeeded}</p>
          <p className="text-muted">{t.onboarding.consentData}</p>
          <form action={setConsent}>
            <input type="hidden" name="lang" value={lang} />
            <input type="hidden" name="consent_type" value="data_processing" />
            <input type="hidden" name="granted" value="true" />
            <Button type="submit">{v.consentButton}</Button>
          </form>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">{v.nin}</h2>
              {statusLine(nin)}
            </div>
            {!nin && <IdCheckForm lang={lang} kind="nin" t={v} />}
          </Card>
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">{v.bvn}</h2>
              {statusLine(bvn)}
            </div>
            {!bvn && (nin ? <IdCheckForm lang={lang} kind="bvn" t={v} /> : <p className="text-muted">{v.needsNinFirst}</p>)}
          </Card>
          <Card className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">{v.bank}</h2>
            <p className="text-muted">{v.bankHint}</p>
            {(accounts ?? []).length > 0 && (
              <ul className="flex flex-col gap-2">
                {(accounts ?? []).map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{b.bank_name} ••••{b.account_number_last4}</span>
                    <span className="text-muted">{b.account_name}</span>
                    <Badge className={b.status === "verified" ? "bg-leaf-100 text-leaf-800" : "bg-red-50 text-danger"}>
                      {t.status[b.status as keyof typeof t.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {!nin ? <p className="text-muted">{v.needsNinFirst}</p>
              : banks ? <BankCheckForm lang={lang} banks={banks} t={v} />
              : <p className="text-muted">{v.banksUnavailable}</p>}
          </Card>
        </>
      )}
    </>
  );
}
