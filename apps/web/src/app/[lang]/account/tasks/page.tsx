import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { clockAttendance, createTask, createWorker, setTaskStatus } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cycleLabel, farmOptions, loadFarmScope, plotOptions } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num, relDays, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Field operations & calendar" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/tasks">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const week = new Date(nowMs() - 7 * 86_400_000).toISOString();
  const cycleIds = scope.cycles.map((c) => c.id).concat("00000000-0000-0000-0000-000000000000");
  const [{ data: tasks }, { data: workers }, { data: attendance }, { data: ops }] = await Promise.all([
    supabase.from("farm_operational_tasks").select("*").in("farm_id", ids).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("farm_workers").select("*").in("farm_id", ids).order("full_name"),
    supabase.from("farm_attendance_records").select("worker_id, status, hours_worked, daily_pay_kobo, clock_in_at").in("farm_id", ids).gte("clock_in_at", week),
    supabase.from("crop_cycle_operations").select("id, crop_cycle_id, name, scheduled_date, status").in("crop_cycle_id", cycleIds).neq("status", "completed").gte("scheduled_date", new Date().toISOString().slice(0, 10)).order("scheduled_date").limit(10),
  ]);
  const t = tasks ?? [];
  const w = workers ?? [];
  const wName = new Map(w.map((x) => [x.id, x.full_name]));
  const farmName = new Map(scope.farms.map((f) => [f.id, f.name]));
  const cycles = new Map(scope.cycles.map((c) => [c.id, c]));
  const open = t.filter((x) => !["completed", "cancelled"].includes(x.status));
  const overdue = open.filter((x) => x.status === "overdue" || (x.due_date && x.due_date < new Date().toISOString().slice(0, 10)));
  const wage = (attendance ?? []).reduce((s, a) => s + Number(a.daily_pay_kobo ?? 0), 0);
  const hours = (attendance ?? []).reduce((s, a) => s + Number(a.hours_worked ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const clocked = new Set((attendance ?? []).filter((a) => (a.clock_in_at ?? "").startsWith(today)).map((a) => a.worker_id));
  const hidden = { lang };
  const workerOpts = w.filter((x) => x.status === "active").map((x) => ({ value: x.id, label: `${x.full_name} · ${label(x.role)}` }));

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="task_alt">{open.length} open tasks</Chip>
            <Chip icon="badge">{w.filter((x) => x.status === "active").length} active workers</Chip>
          </>
        }
        title="Field Operations & Calendar"
        description="Tasks, crew and attendance across your farms, with crop operations due next."
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
        <MetricCard label="Open tasks" value={open.length} icon="pending_actions" foot={`${t.filter((x) => x.status === "in_progress").length} in progress`} />
        <MetricCard label="Overdue" value={overdue.length} icon="alarm" iconTone={overdue.length ? "bg-critical-soft text-critical" : undefined} foot="Past due date and not done" />
        <MetricCard label="Labour hours, 7 days" value={num(hours)} unit="h" icon="schedule" foot={`${(attendance ?? []).length} attendance records`} />
        <MetricCard label="Wages, 7 days" value={naira(wage)} icon="payments" foot="From attendance" />
      </KpiGrid>
      <Split
        wide={
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
        }
        side={
          <>
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
            <Section title="Crop operations due" icon="event_upcoming">
              <ul className="flex flex-col gap-2">
                {(ops ?? []).map((o) => {
                  const c = cycles.get(o.crop_cycle_id);
                  return (
                    <li key={o.id} className="text-body-sm">
                      <span className="font-medium text-on-surface">{o.name}</span>
                      <span className="text-on-surface-variant">
                        {" "}
                        · {c ? cycleLabel(c) : ""} · {relDays(o.scheduled_date)}
                      </span>
                    </li>
                  );
                })}
                {!ops?.length && <li className="text-body-sm text-on-surface-variant">Nothing due.</li>}
              </ul>
            </Section>
          </>
        }
      />
    </Stack>
  );
}
