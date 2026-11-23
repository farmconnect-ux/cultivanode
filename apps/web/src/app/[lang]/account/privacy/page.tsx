import { notFound } from "next/navigation";
import { cancelDataRequest, setConsent } from "@/actions/account";
import { DeletionForm } from "@/components/account/deletion-form";
import { Badge, Button, Card } from "@/components/ui";
import { buttonClass } from "@/components/ui/button";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill, formatDate } from "@/lib/text";

const ORDER = [
  "terms_of_use", "privacy_policy", "data_processing", "marketing_messages",
  "share_with_lenders", "share_with_buyers", "share_with_investors", "share_with_partners", "ai_intelligence",
] as const;

export default async function PrivacyPage({ params }: PageProps<"/[lang]/account/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang, { customer: true });
  const t = await getDictionary(lang);
  const p = t.acct.privacy;
  const supabase = await createClient();
  const [{ data: consents }, { data: requests }] = await Promise.all([
    supabase.from("current_consents").select("consent_type, granted, created_at").eq("profile_id", account.userId),
    supabase.from("data_requests").select("id, kind, status, created_at, resolution_note")
      .eq("profile_id", account.userId).eq("kind", "deletion").order("created_at", { ascending: false }),
  ]);
  const current = new Map((consents ?? []).map((c) => [c.consent_type, c]));
  const openDeletion = (requests ?? []).some((r) => r.status === "open");

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{p.title}</h1>
        <p className="mt-2 text-muted">{p.intro}</p>
      </div>

      <Card className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">{p.choices}</h2>
        <ul className="flex flex-col divide-y divide-line">
          {ORDER.map((type) => {
            const c = current.get(type);
            const on = c?.granted === true;
            const required = type === "terms_of_use" || type === "privacy_policy";
            return (
              <li key={type} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.consentNames[type]}</span>
                  <span className="block text-sm text-muted">
                    {required ? p.required : c?.created_at ? fill(p.lastChanged, { date: formatDate(c.created_at, lang) }) : ""}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge className={on ? "bg-leaf-100 text-leaf-800" : "bg-line text-muted"}>{on ? p.on : p.off}</Badge>
                  {!required && (
                    <form action={setConsent}>
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="consent_type" value={type} />
                      <input type="hidden" name="granted" value={on ? "false" : "true"} />
                      <Button type="submit" variant={on ? "ghost" : "secondary"}>{on ? p.turnOff : p.turnOn}</Button>
                    </form>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{p.download}</h2>
        <p className="text-muted">{p.downloadHint}</p>
        <a href="/api/account/export" download className={buttonClass("secondary", "md", "self-start")}>{p.download}</a>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{p.delete}</h2>
        <p className="text-muted">{p.deleteHint}</p>
        {(requests ?? []).length > 0 && (
          <ul className="flex flex-col gap-2">
            {(requests ?? []).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <span>{formatDate(r.created_at, lang)}</span>
                <Badge>{t.status[r.status as keyof typeof t.status]}</Badge>
                {r.resolution_note && <span className="text-sm text-muted">{r.resolution_note}</span>}
                {r.status === "open" && (
                  <form action={cancelDataRequest}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="request_id" value={r.id} />
                    <Button type="submit" variant="ghost">{p.cancelRequest}</Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {!openDeletion && <DeletionForm lang={lang} t={t} />}
      </Card>
    </>
  );
}
