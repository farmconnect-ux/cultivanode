import type { Metadata } from "next";
import { setContactHandled } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Alert, Badge, Card } from "@/components/ui";
import { phoneLabel, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "website_inbox.manage")) return <Alert tone="danger">You need the website_inbox.manage permission.</Alert>;
  const supabase = await createClient();
  const [{ data: messages }, { data: waitlist }] = await Promise.all([
    supabase.from("contact_messages").select("id, full_name, phone, email, message, language, handled_at, created_at")
      .order("handled_at", { ascending: false, nullsFirst: true }).order("created_at", { ascending: false }).limit(100),
    supabase.from("waitlist_signups").select("id, side, full_name, phone, email, state, interest, created_at")
      .order("created_at", { ascending: false }).limit(200),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-extrabold text-leaf-800">Inbox</h1>
      <section className="flex flex-col gap-3" aria-labelledby="msg-h">
        <h2 id="msg-h" className="text-2xl font-bold">Contact messages</h2>
        {(messages ?? []).length === 0 && <p className="text-muted">No messages.</p>}
        {(messages ?? []).map((m) => (
          <Card key={m.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">{m.full_name}</p>
              <span className="flex items-center gap-2 text-sm text-muted">
                {when(m.created_at)} <Badge className={m.handled_at ? "bg-line text-muted" : ""}>{m.handled_at ? "handled" : "open"}</Badge>
              </span>
            </div>
            <p className="text-sm">
              {m.phone && <a className="font-semibold text-leaf-700 underline" href={`tel:+${m.phone}`}>{phoneLabel(m.phone)}</a>}
              {m.phone && m.email && " · "}
              {m.email && <a className="font-semibold text-leaf-700 underline" href={`mailto:${m.email}`}>{m.email}</a>}
              {" · "}{m.language}
            </p>
            <p className="whitespace-pre-line rounded-md bg-cream p-3">{m.message}</p>
            <AdminForm action={setContactHandled} hidden={{ id: m.id, handled: m.handled_at ? "false" : "true" }}
                       buttons={[{ label: m.handled_at ? "Reopen" : "Mark handled", variant: m.handled_at ? "ghost" : "secondary" }]} />
          </Card>
        ))}
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="wl-h">
        <h2 id="wl-h" className="text-2xl font-bold">Marketplace waitlist ({(waitlist ?? []).length})</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line bg-cream">
              <tr><th className="p-3">Name</th><th className="p-3">Side</th><th className="p-3">Contact</th><th className="p-3">State</th><th className="p-3">Interest</th><th className="p-3">Joined</th></tr>
            </thead>
            <tbody>
              {(waitlist ?? []).map((w) => (
                <tr key={w.id} className="border-b border-line last:border-0">
                  <td className="p-3 font-semibold">{w.full_name}</td>
                  <td className="p-3">{w.side}</td>
                  <td className="p-3">{[w.phone ? phoneLabel(w.phone) : null, w.email].filter(Boolean).join(" · ")}</td>
                  <td className="p-3">{w.state ?? "-"}</td>
                  <td className="p-3">{w.interest ?? "-"}</td>
                  <td className="p-3 whitespace-nowrap">{when(w.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
