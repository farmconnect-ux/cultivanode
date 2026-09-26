import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

export default async function AccountHome({ params, searchParams }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { welcome } = await searchParams;
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const a = t.acct;
  const supabase = await createClient();

  const [{ data: requests }, { data: farms }, { data: banks }, { data: docs }] = await Promise.all([
    supabase.from("role_requests").select("id, role, status").eq("profile_id", account.userId).eq("status", "pending"),
    supabase.from("farms").select("id").eq("owner_id", account.userId).limit(1),
    supabase.from("bank_accounts").select("id").eq("profile_id", account.userId).eq("status", "verified").limit(1),
    supabase.from("verification_documents").select("role_request_id").eq("profile_id", account.userId),
  ]);
  const { data: roleRules } = await supabase.from("roles").select("role, requires_documents");
  const needsDocs = new Set((roleRules ?? []).filter((r) => r.requires_documents).map((r) => r.role));
  const withDocs = new Set((docs ?? []).map((d) => d.role_request_id));

  const tier = account.profile.verification_tier;
  const base = `/${lang}/account`;
  const steps: { href: string; label: string }[] = [];
  if (tier < 1) steps.push({ href: `${base}/verification`, label: a.stepVerify });
  if (account.isFarmer && (farms ?? []).length === 0) steps.push({ href: `${base}/farms`, label: a.stepFarm });
  for (const r of requests ?? []) {
    if (needsDocs.has(r.role) && !withDocs.has(r.id)) {
      steps.push({ href: `${base}/roles`, label: fill(a.stepDocs, { role: t.roleNames[r.role as keyof typeof t.roleNames] }) });
    }
  }
  const earns = account.roles.some((r) => r.role === "machinery_owner" || r.role === "service_provider");
  if (tier >= 1 && earns && (banks ?? []).length === 0) steps.push({ href: `${base}/verification`, label: a.stepBank });

  return (
    <>
      {welcome && <Alert>{a.welcomeNew}</Alert>}
      <h1 className="text-3xl font-extrabold text-leaf-800 sm:text-4xl">
        {fill(a.welcome, { name: account.profile.full_name?.split(" ")[0] ?? "" })}
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{a.tierTitle}</h2>
          <p className="text-lg font-semibold text-leaf-700">{a.tiers[tier] ?? a.tiers[0]}</p>
          {tier < 2 && <p className="text-muted">{a.tierHint}</p>}
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">{a.yourRoles}</h2>
          {account.roles.length === 0 && (requests ?? []).length === 0 ? (
            <p className="text-muted">{a.noRoles}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {account.roles.map((r) => (
                <li key={`${r.role}-${r.provider_type}`}>
                  <Badge className="bg-leaf-100 text-leaf-800">
                    {r.provider_type
                      ? t.providerTypes[r.provider_type as keyof typeof t.providerTypes]
                      : t.roleNames[r.role as keyof typeof t.roleNames]}
                  </Badge>
                </li>
              ))}
              {(requests ?? []).map((r) => (
                <li key={r.id}>
                  <Badge>
                    {t.roleNames[r.role as keyof typeof t.roleNames]}: {t.status.pending}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{a.nextSteps}</h2>
        {steps.length === 0 ? (
          <p>{a.allDone}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <li key={s.label}>
                <Link href={s.href} className="flex min-h-12 items-center justify-between gap-3 rounded-md border-2 border-line px-4 py-2 font-semibold hover:border-leaf-600">
                  <span>
                    {i + 1}. {s.label}
                  </span>
                  <span aria-hidden="true" className="text-leaf-700">→</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        <p className="text-sm text-muted">{a.comingSoonTools}</p>
      </Card>
    </>
  );
}
