import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sendMessage, startThread } from "@/actions/ecosystem";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog, InlineForm } from "@/components/live/action-form";
import { Chip, Section, Stack, StartHere } from "@/components/live/kit";
import { hasLocale } from "@/i18n/config";
import { sellerParties } from "@/lib/account/counterparties";
import { requireAccount } from "@/lib/account/session";
import { ago, label } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function Page({ params, searchParams }: PageProps<"/[lang]/account/messages">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang, { customer: true });
  const supabase = await createClient();
  const sp = await searchParams;
  const [{ data: threads }, { data: people }, { data: mine }, sellers] = await Promise.all([
    supabase.from("message_threads").select("id, subject, context_type, last_message_at, created_at").order("last_message_at", { ascending: false, nullsFirst: false }),
    supabase.rpc("my_thread_people"),
    supabase.from("message_participants").select("thread_id, last_read_at").eq("profile_id", account.userId),
    sellerParties(),
  ]);
  const t = threads ?? [];
  const active = t.find((x) => x.id === sp.t) ?? t[0];
  const { data: msgs } = active ? await supabase.from("messages").select("id, sender_id, body, created_at").eq("thread_id", active.id).order("created_at") : { data: [] };
  const names = new Map((people ?? []).map((p) => [p.profile_id, p.full_name]));
  const others = (threadId: string) => (people ?? []).filter((p) => p.thread_id === threadId && p.profile_id !== account.userId).map((p) => p.full_name).join(", ");
  const readAt = new Map((mine ?? []).map((m) => [m.thread_id, m.last_read_at]));
  const unread = (x: (typeof t)[number]) => x.last_message_at && (!readAt.get(x.id) || readAt.get(x.id)! < x.last_message_at);
  const contacts = new Map<string, string>();
  for (const p of people ?? []) if (p.profile_id !== account.userId) contacts.set(p.profile_id, p.full_name);
  for (const s of sellers) if (s.value !== account.userId && !contacts.has(s.value)) contacts.set(s.value, s.label);

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="forum">{t.filter(unread).length} unread</Chip>}
        title="Messages"
        description="Conversations with buyers, sellers, operators and your cooperative — linked to the order, booking or contract they're about."
        actions={
          <ActionDialog
            title="New conversation"
            trigger="New message"
            icon="edit"
            action={startThread}
            hidden={{ lang }}
            fields={[
              { name: "recipient_id", label: "To", type: "select", required: true, options: [...contacts.entries()].map(([value, l]) => ({ value, label: l })), wide: true },
              { name: "subject", label: "Subject", required: true, wide: true },
              { name: "context_type", label: "About", type: "select", defaultValue: "general", options: ["general", "order", "booking", "contract", "support"].map((v) => ({ value: v, label: label(v) })) },
              { name: "body", label: "Message", type: "textarea", required: true },
            ]}
          />
        }
      />
      {!t.length && <StartHere icon="forum" title="No conversations yet">Start one with a seller, buyer or operator.</StartHere>}
      {t.length > 0 && (
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-3">
          <Section title="Inbox" icon="inbox" bodyClassName="p-2">
            <ul className="flex flex-col">
              {t.map((x) => (
                <li key={x.id}>
                  <Link href={`?t=${x.id}`} className={cn("flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-container-low", active?.id === x.id && "bg-secondary-container/40")}>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-body-md", unread(x) ? "font-semibold text-on-surface" : "text-on-surface")}>{x.subject}</span>
                      <span className="shrink-0 text-body-sm text-on-surface-variant">{ago(x.last_message_at ?? x.created_at)}</span>
                    </span>
                    <span className="truncate text-body-sm text-on-surface-variant">
                      {others(x.id) || "Just you"} · {label(x.context_type)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
          {active && (
            <Section title={active.subject} description={`With ${others(active.id) || "—"}`} icon="chat" className="lg:col-span-2">
              <ol className="mb-4 flex max-h-[52vh] flex-col gap-3 overflow-y-auto pr-1">
                {(msgs ?? []).map((m) => {
                  const me = m.sender_id === account.userId;
                  return (
                    <li key={m.id} className={cn("flex max-w-[80%] flex-col gap-0.5", me ? "self-end items-end" : "self-start")}>
                      <span className="text-body-sm text-on-surface-variant">
                        {me ? "You" : names.get(m.sender_id) ?? "Member"} · {ago(m.created_at)}
                      </span>
                      <p className={cn("whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-body-md", me ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface")}>{m.body}</p>
                    </li>
                  );
                })}
              </ol>
              <InlineForm action={sendMessage} hidden={{ lang, thread_id: active.id }} fields={[{ name: "body", label: "Reply", type: "textarea", required: true }]} />
            </Section>
          )}
        </div>
      )}
    </Stack>
  );
}
