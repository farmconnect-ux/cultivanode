import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupportTicket, replyToSupportTicket } from "@/actions/ecosystem";
import { Icon, type IconName } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, Facts, Section, Split, Stack, Status } from "@/components/live/kit";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { ago, label } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { localPhone } from "@/lib/text";

export const metadata: Metadata = { title: "Settings & workspace" };

const LINKS: [string, string, IconName, string][] = [
  ["/account/profile", "Profile", "person", "Name, contact, state and language"],
  ["/account/roles", "Workspace roles", "manage_accounts", "Farmer, provider, buyer, lender and other hubs"],
  ["/account/verification", "Verification", "verified_user", "Identity tier and documents"],
  ["/account/business", "Business & staff", "corporate_fare", "Organisation, CAC number and team"],
  ["/account/privacy", "Privacy & data", "shield_lock", "Consents, export and deletion"],
  ["/account/inbox", "Notifications", "notifications", "What we've told you"],
];

export default async function Page({ params }: PageProps<"/[lang]/account/settings">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang, { customer: true });
  const supabase = await createClient();
  const { data: tickets } = await supabase.from("support_tickets").select("*").eq("requester_id", account.userId).order("created_at", { ascending: false });
  const ticketIds = (tickets ?? []).map((t) => t.id);
  const { data: ticketMessages } = ticketIds.length
    ? await supabase.from("support_ticket_messages").select("id, ticket_id, author_id, body, created_at").in("ticket_id", ticketIds).order("created_at", { ascending: true })
    : { data: [] as { id: string; ticket_id: string; author_id: string; body: string; created_at: string }[] };
  const messagesByTicket = new Map<string, { id: string; author_id: string; body: string; created_at: string }[]>();
  for (const m of ticketMessages ?? []) {
    const list = messagesByTicket.get(m.ticket_id) ?? [];
    list.push(m);
    messagesByTicket.set(m.ticket_id, list);
  }
  const p = account.profile;

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="person">{p.full_name ?? "Your account"}</Chip>
            <Chip icon="verified_user">Tier {p.verification_tier}</Chip>
          </>
        }
        title="Settings & Workspace"
        description="Your profile, the hubs your account can open, and help from the CultivaNode support desk."
        actions={
          <ActionDialog
            title="Contact support"
            trigger="Get help"
            icon="support_agent"
            action={createSupportTicket}
            hidden={{ lang }}
            fields={[
              { name: "subject", label: "Subject", required: true, wide: true },
              { name: "category", label: "Topic", type: "select", required: true, options: ["account", "booking", "payment", "marketplace", "verification", "technical", "agronomy", "other"].map((v) => ({ value: v, label: label(v) })) },
              { name: "priority", label: "Priority", type: "select", defaultValue: "normal", options: ["low", "normal", "high", "urgent"].map((v) => ({ value: v, label: label(v) })) },
              { name: "body", label: "Describe the problem", type: "textarea", required: true },
            ]}
          />
        }
      />
      <Split
        wide={
          <>
            <Section title="Account" icon="manage_accounts">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {LINKS.map(([href, title, icon, desc]) => (
                  <Link key={href} href={`/${lang}${href}`} className="card-interactive flex items-start gap-3 rounded-xl border border-outline-variant/40 p-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-secondary">
                      <Icon name={icon} className="text-lg" />
                    </span>
                    <span>
                      <span className="block font-label-lg text-label-lg text-on-surface">{title}</span>
                      <span className="block text-body-sm text-on-surface-variant">{desc}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
            <Section title="Support tickets" icon="support_agent">
              <DataTable
                rows={tickets ?? []}
                rowKey={(t) => t.id}
                empty="No tickets — use Get help if something isn't working."
                columns={[
                  { label: "Ticket", cell: (t) => <span className="font-medium">{t.ticket_number}</span> },
                  { label: "Subject", cell: (t) => t.subject },
                  { label: "Topic", cell: (t) => label(t.category) },
                  { label: "Opened", cell: (t) => ago(t.created_at) },
                  { label: "Priority", cell: (t) => <Status value={t.priority} /> },
                  { label: "Status", cell: (t) => <Status value={t.status} /> },
                  {
                    label: "Thread",
                    cell: (t) => {
                      const msgs = messagesByTicket.get(t.id) ?? [];
                      const latest = msgs[msgs.length - 1];
                      return (
                        <div className="flex items-center gap-2">
                          <span className="max-w-48 truncate text-caption text-on-surface-variant" title={latest?.body}>
                            {msgs.length ? `${msgs.length} msg: ${latest.body}` : "No replies yet"}
                          </span>
                          <ActionDialog
                            title={`Reply ? ${t.ticket_number}`}
                            trigger="Reply"
                            icon="replay"
                            action={replyToSupportTicket}
                            hidden={{ lang, ticket_id: t.id }}
                            fields={[{ name: "body", label: "Message", type: "textarea", required: true, wide: true }]}
                          />
                        </div>
                      );
                    },
                  },
                ]}
              />
            </Section>
          </>
        }
        side={
          <Section title="Profile" icon="person">
            <Facts
              className="sm:grid-cols-1"
              items={[
                ["Name", p.full_name ?? "—"],
                ["Phone", localPhone(p.phone) || "—"],
                ["Email", p.email ?? "—"],
                ["Location", [p.lga, p.state].filter(Boolean).join(", ") || "—"],
                ["Language", p.preferred_language.toUpperCase()],
                ["Account type", label(p.account_type)],
                ["Roles", account.roles.map((r) => label(r.role)).join(", ") || "—"],
              ]}
            />
          </Section>
        }
      />
    </Stack>
  );
}
