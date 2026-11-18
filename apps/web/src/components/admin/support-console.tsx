"use client";

import { useState } from "react";
import { postSupportMessageAction, updateSupportTicketAction } from "@/actions/admin-support";
import { AdminForm } from "@/components/admin/admin-form";
import { EmptyState } from "@/components/ds/empty-state";
import { Badge } from "@/components/shadcn/badge";

export type SupportMessageItem = {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type SupportTicketItem = {
  id: string;
  ticket_number: string;
  requester_id: string;
  requester_name: string;
  requester_phone: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  channel: string;
  assigned_to: string | null;
  sla_due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  messages: SupportMessageItem[];
};

export type StaffOption = {
  id: string;
  name: string;
};

export function SupportConsole({
  tickets,
  staffOptions,
}: {
  tickets: SupportTicketItem[];
  staffOptions: StaffOption[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.id ?? null);
  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0] ?? null;

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon="support_agent"
        title="No support tickets found"
        description="Submitted support requests from web and mobile users will appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="space-y-2 lg:col-span-5">
        {tickets.map((t) => {
          const active = selected?.id === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className={`w-full rounded-xl border p-3.5 text-left transition ${
                active
                  ? "border-primary bg-surface-container-low"
                  : "border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-primary">{t.ticket_number}</span>
                <div className="flex items-center gap-1.5">
                  <Badge tone={t.priority === "urgent" || t.priority === "high" ? "danger" : "default"}>
                    {t.priority}
                  </Badge>
                  <Badge tone={t.status === "resolved" || t.status === "closed" ? "leaf" : "warning"}>
                    {t.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <p className="mt-1 font-medium text-on-surface">{t.subject}</p>
              <p className="mt-0.5 text-caption text-on-surface-variant">
                {t.requester_name} · {t.category} · {new Date(t.created_at).toLocaleDateString()}
              </p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 lg:col-span-7">
          <div className="border-b border-outline-variant/30 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-primary">{selected.ticket_number}</span>
              <span className="text-caption text-on-surface-variant">
                Channel: {selected.channel} · Opened {new Date(selected.created_at).toLocaleString()}
              </span>
            </div>
            <h2 className="mt-1 text-title-md font-semibold text-on-surface">{selected.subject}</h2>
            <p className="text-body-sm text-on-surface-variant">
              Requester: {selected.requester_name}
              {selected.requester_phone ? ` (${selected.requester_phone})` : ""}
              {selected.sla_due_at ? ` · SLA due: ${new Date(selected.sla_due_at).toLocaleString()}` : ""}
            </p>
          </div>

          <AdminForm
            key={`upd-${selected.id}-${selected.status}-${selected.priority}-${selected.assigned_to ?? ""}`}
            action={updateSupportTicketAction}
            buttons={[{ label: "Update ticket", variant: "primary" }]}
            hidden={{ ticket_id: selected.id }}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="text-label-sm">
                Status
                <select
                  name="status"
                  defaultValue={selected.status}
                  className="mt-1 w-full rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm"
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label className="text-label-sm">
                Priority
                <select
                  name="priority"
                  defaultValue={selected.priority}
                  className="mt-1 w-full rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label className="text-label-sm">
                Assignee
                <select
                  name="assigned_to"
                  defaultValue={selected.assigned_to ?? ""}
                  className="mt-1 w-full rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm"
                >
                  <option value="">Unassigned</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </AdminForm>

          <div className="space-y-2 border-t border-outline-variant/30 pt-3">
            <h3 className="text-label-md font-semibold text-on-surface">Case Activity ({selected.messages.length})</h3>
            {selected.messages.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No messages recorded on this ticket yet.</p>
            ) : (
              <div className="space-y-2">
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg border p-3 text-body-sm ${
                      m.is_internal
                        ? "border-amber-300 bg-amber-50/70"
                        : "border-outline-variant/40 bg-surface-container-low/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-caption text-on-surface-variant">
                      <span className="font-semibold text-on-surface">
                        {m.author_name} {m.is_internal ? "(Internal Note)" : "(Public)"}
                      </span>
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-on-surface">{m.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-outline-variant/30 pt-3 sm:grid-cols-2">
            <AdminForm
              key={`pub-${selected.id}-${selected.messages.length}`}
              action={postSupportMessageAction}
              buttons={[{ label: "Send public reply", variant: "primary" }]}
              hidden={{ ticket_id: selected.id, is_internal: "false" }}
            >
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Reply visible to the requester…"
                className="w-full rounded-lg border border-outline-variant/50 p-2 text-body-sm"
              />
            </AdminForm>
            <AdminForm
              key={`int-${selected.id}-${selected.messages.length}`}
              action={postSupportMessageAction}
              buttons={[{ label: "Save internal note", variant: "secondary" }]}
              hidden={{ ticket_id: selected.id, is_internal: "true" }}
            >
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Internal staff note (hidden from user)…"
                className="w-full rounded-lg border border-outline-variant/50 p-2 text-body-sm"
              />
            </AdminForm>
          </div>
        </div>
      )}
    </div>
  );
}
