import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { clockAttendance, completeCropOperation, createTask, createWorker, setCropOperationStatus, setTaskStatus } from "@/actions/farm-ops";
import { Icon } from "@/components/ds/icon";
import { CalendarSync } from "@/components/live/calendar-sync";
import { FieldCalendar, type CalendarItem } from "@/components/live/field-calendar";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cycleLabel, farmOptions, loadFarmScope, plotOptions } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num, relDays, nowMs } from "@/lib/format";
import { googleCalendarUrl } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Field operations & calendar" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params, searchParams }: PageProps<"/[lang]/account/tasks">) {
  const { lang } = await params;
  const sp = await searchParams;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const week = new Date(nowMs() - 7 * 86_400_000).toISOString();
  const cycleIds = scope.cycles.map((c) => c.id).concat("00000000-0000-0000-0000-000000000000");
  const today = new Date().toISOString().slice(0, 10);
  const month = typeof sp.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month) ? sp.month : today.slice(0, 7);
  const [{ data: tasks }, { data: workers }, { data: attendance }, { data: ops }, { data: feed }] = await Promise.all([
    supabase.from("farm_operational_tasks").select("*").in("farm_id", ids).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("farm_workers").select("*").in("farm_id", ids).order("full_name"),
    supabase.from("farm_attendance_records").select("worker_id, status, hours_worked, daily_pay_kobo, clock_in_at").in("farm_id", ids).gte("clock_in_at", week),
    // Every operation from the crop plans: they are the calendar's backbone, no copying needed.
    supabase
      .from("crop_cycle_operations")
      .select("id, crop_cycle_id, name, stage, operation_type, scheduled_date, completed_date, status, required_machinery, notes")
      .in("crop_cycle_id", cycleIds)
      .not("scheduled_date", "is", null)
      .order("scheduled_date")
      .limit(2000),
    supabase.from("calendar_feeds").select("token").eq("profile_id", account.userId).maybeSingle(),
  ]);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const feedUrl = feed?.token && host ? `${proto}://${host}/api/calendar/${feed.token}.ics` : null;
  const t = tasks ?? [];
  const w = workers ?? [];
  const wName = new Map(w.map((x) => [x.id, x.full_name]));
  const farmName = new Map(scope.farms.map((f) => [f.id, f.name]));
  const cycles = new Map(scope.cycles.map((c) => [c.id, c]));
  const open = t.filter((x) => !["completed", "cancelled"].includes(x.status));
  const overdue = open.filter((x) => x.status === "overdue" || (x.due_date && x.due_date < new Date().toISOString().slice(0, 10)));
  // (crop operations are counted alongside tasks below)
  const wage = (attendance ?? []).reduce((s, a) => s + Number(a.daily_pay_kobo ?? 0), 0);
  const hours = (attendance ?? []).reduce((s, a) => s + Number(a.hours_worked ?? 0), 0);
  const clocked = new Set((attendance ?? []).filter((a) => (a.clock_in_at ?? "").startsWith(today)).map((a) => a.worker_id));
  const hidden = { lang };
  const cropOps = ops ?? [];
  const openOps = cropOps.filter((o) => o.status === "pending" || o.status === "in_progress");
  const overdueOps = openOps.filter((o) => (o.scheduled_date ?? "") < today);
  const nextOps = openOps.filter((o) => (o.scheduled_date ?? "") >= today).slice(0, 25);
  const opRows = [...overdueOps, ...nextOps];
  const cycleName = (cid: string) => {
    const c = cycles.get(cid);
    return c ? cycleLabel(c) : "Crop cycle";
  };
  const opPlace = (cid: string) => {
    const c = cycles.get(cid);
    const f = c ? scope.farms.find((x) => x.id === c.farm_id) : undefined;
    return f ? [f.name, f.lga, f.state].filter(Boolean).join(", ") : null;
  };
  const calItems: CalendarItem[] = [
    ...cropOps.map((o) => ({
      id: `op-${o.id}`,
      date: o.scheduled_date!,
      title: `${o.name} · ${cycleName(o.crop_cycle_id)}`,
      kind: "crop_operation" as const,
      status: o.status,
      href: `/${lang}/account/crops/${o.crop_cycle_id}`,
    })),
    ...t
      .filter((x) => x.due_date || x.start_date)
      .map((x) => ({ id: `task-${x.id}`, date: (x.due_date ?? x.start_date)!, title: x.title, kind: "task" as const, status: x.status })),
  ];
  const workerOpts = w.filter((x) => x.status === "active").map((x) => ({ value: x.id, label: `${x.full_name} · ${label(x.role)}` }));

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="task_alt">{open.length} open tasks</Chip>
            <Chip icon="agriculture">{openOps.length} crop operations planned</Chip>
            <Chip icon="badge">{w.filter((x) => x.status === "active").length} active workers</Chip>
          </>
        }
        title="Field Operations & Calendar"
        description="Your crop plans feed this calendar automatically: every operation you schedule on a crop cycle shows up here, next to field tasks, crew and attendance."
        actions={
          scope.farms.length > 0 && (
            <>
              <ActionDialog
                title="Add a worker"
                trigger="Add worker"
                icon="person_add"
                tone="secondary"
                action={createWorker}
                hidden={hidden}
                fields={[
                  { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                  { name: "full_name", label: "Full name", required: true },
                  { name: "phone", label: "Phone", type: "tel" },
                  { name: "role", label: "Role", type: "select", required: true, options: opt(["farm_manager", "tractor_operator", "field_worker", "scout", "harvester", "livestock_keeper", "security", "casual"]) },
                  { name: "employment_type", label: "Employment", type: "select", defaultValue: "seasonal", options: opt(["permanent", "seasonal", "daily_casual"]) },
                  { name: "daily_wage", label: "Daily wage (₦)", type: "number" },
                ]}
              />
              <ActionDialog
                title="Create a task"
                trigger="New task"
                action={createTask}
                hidden={hidden}
                fields={[
                  { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                  { name: "plot_id", label: "Plot", type: "select", options: plotOptions(scope) },
                  { name: "title", label: "Task", required: true, wide: true },
                  { name: "category", label: "Category", type: "select", options: opt(["scouting", "weed_control", "irrigation", "machinery", "maintenance", "livestock", "land_prep", "harvest", "storage", "admin"]) },
                  { name: "priority", label: "Priority", type: "select", defaultValue: "medium", options: opt(["low", "medium", "high", "urgent"]) },
                  { name: "assigned_worker_id", label: "Assign to", type: "select", options: workerOpts },
                  { name: "due_date", label: "Due", type: "date" },
                  { name: "estimated_duration_hours", label: "Hours (est.)", type: "number" },
                  { name: "description", label: "Details", type: "textarea" },
                ]}
              />
            </>
          )
        }
      />
      {!scope.farms.length && <StartHere title="Register a farm to plan field work" />}
      <KpiGrid>
        <MetricCard label="Open work" value={open.length + openOps.length} icon="pending_actions" foot={`${open.length} tasks · ${openOps.length} crop operations`} />
        <MetricCard label="Overdue" value={overdue.length + overdueOps.length} icon="alarm" iconTone={overdue.length + overdueOps.length ? "bg-critical-soft text-critical" : undefined} foot="Past due date and not done" />
        <MetricCard label="Labour hours, 7 days" value={num(hours)} unit="h" icon="schedule" foot={`${(attendance ?? []).length} attendance records`} />
        <MetricCard label="Wages, 7 days" value={naira(wage)} icon="payments" foot="From attendance" />
      </KpiGrid>
      <Section title="Calendar" icon="calendar_month" description="Crop operations from your crop plans and field tasks, by day. Tap a crop operation to open its crop cycle.">
        <FieldCalendar month={month} today={today} items={calItems} monthHref={(m) => `/${lang}/account/tasks?month=${m}`} />
      </Section>
      <Split
        wide={
          <Stack>
          <Section
            title="Crop operations"
            icon="agriculture"
            description="Overdue and upcoming work from your crop plans. Add an operation on a crop cycle and it appears here and in your phone calendar."
            action={
              <Link href={`/${lang}/account/crops`} className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
                Crop plans <Icon name="arrow_forward" className="text-base" />
              </Link>
            }
          >
            <DataTable
              rows={opRows}
              rowKey={(o) => o.id}
              empty="No crop operations planned. Plan a crop cycle and its operations land here."
              columns={[
                { label: "Operation", cell: (o) => <span className="font-medium">{o.name}</span> },
                {
                  label: "Crop",
                  cell: (o) => (
                    <Link href={`/${lang}/account/crops/${o.crop_cycle_id}`} className="text-primary hover:underline">
                      {cycleName(o.crop_cycle_id)}
                    </Link>
                  ),
                },
                { label: "Stage", cell: (o) => o.stage ?? "—" },
                { label: "Date", cell: (o) => (o.scheduled_date ? `${formatDay(o.scheduled_date, lang)} (${relDays(o.scheduled_date)})` : "—") },
                { label: "Status", cell: (o) => <Status value={(o.scheduled_date ?? "") < today ? "overdue" : o.status} /> },
                {
                  label: "",
                  cell: (o) => (
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {o.status === "pending" ? (
                        <ActionButton action={setCropOperationStatus} hidden={{ lang, id: o.id, status: "in_progress" }} label="Start" icon="play_arrow" />
                      ) : (
                        <ActionButton action={completeCropOperation} hidden={{ lang, id: o.id }} label="Done" />
                      )}
                      <a
                        href={googleCalendarUrl({
                          title: `${o.name} · ${cycleName(o.crop_cycle_id)}`,
                          details: [o.stage ? `Stage: ${o.stage}` : null, o.required_machinery, o.notes].filter(Boolean).join("\n"),
                          startsOn: o.scheduled_date!,
                          location: opPlace(o.crop_cycle_id),
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Add to Google Calendar"
                        aria-label="Add to Google Calendar"
                        className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                      >
                        <Icon name="calendar_add_on" className="text-base" />
                      </a>
                    </div>
                  ),
                },
              ]}
            />
          </Section>
          <Section title="Task board" icon="view_kanban">
            <DataTable
              rows={t}
              rowKey={(x) => x.id}
              empty="No tasks yet."
              columns={[
                { label: "Task", cell: (x) => <span className="font-medium">{x.title}</span> },
                { label: "Farm", cell: (x) => farmName.get(x.farm_id) },
                { label: "Assignee", cell: (x) => (x.assigned_worker_id ? wName.get(x.assigned_worker_id) : "—") },
                { label: "Due", cell: (x) => (x.due_date ? `${formatDay(x.due_date, lang)} (${relDays(x.due_date)})` : "—") },
                { label: "Priority", cell: (x) => <Status value={x.priority} /> },
                { label: "Status", cell: (x) => <Status value={x.status} /> },
                {
                  label: "",
                  cell: (x) =>
                    x.status === "completed" || x.status === "cancelled" ? null : x.status === "in_progress" ? (
                      <ActionButton action={setTaskStatus} hidden={{ lang, id: x.id, status: "completed" }} label="Done" />
                    ) : (
                      <ActionButton action={setTaskStatus} hidden={{ lang, id: x.id, status: "in_progress" }} label="Start" icon="play_arrow" />
                    ),
                },
              ]}
            />
          </Section>
          </Stack>
        }
        side={
          <>
            <Section title="Sync to your phone" icon="phone_iphone">
              <CalendarSync lang={lang} feedUrl={feedUrl} />
            </Section>
            <Section title="Crew today" icon="badge" description="Clock in workers as they arrive.">
              <ul className="flex flex-col divide-y divide-outline-variant/30">
                {w.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-label-lg text-label-lg text-on-surface">{x.full_name}</p>
                      <p className="text-body-sm text-on-surface-variant">
                        {label(x.role)} · {naira(x.daily_wage_kobo)}/day
                      </p>
                    </div>
                    {x.status !== "active" ? (
                      <Status value={x.status} />
                    ) : clocked.has(x.id) ? (
                      <Status value="present" />
                    ) : (
                      <ActionButton action={clockAttendance} hidden={{ lang, worker_id: x.id }} label="Clock in" icon="login" />
                    )}
                  </li>
                ))}
                {!w.length && <li className="py-4 text-center text-body-sm text-on-surface-variant">No workers yet.</li>}
              </ul>
            </Section>
          </>
        }
      />
    </Stack>
  );
}
