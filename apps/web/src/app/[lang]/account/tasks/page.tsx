import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import {
  createFarmTask,
  updateTaskStatus,
  createFarmWorker,
  recordWorkerAttendance,
} from "@/actions/farm-tasks";

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function TasksPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang as Locale);
  const supabase = await createClient();

  // Fetch farmer's farms
  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name")
    .or(scope.join(","))
    .order("name");

  const farmIds = (farms || []).map((f) => f.id);

  // Fetch farm workers
  const { data: workers } = await supabase
    .from("farm_workers")
    .select("*")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("full_name");

  // Fetch tasks
  let taskQuery = supabase
    .from("farm_operational_tasks")
    .select("*, farm_workers(full_name), farms(name)")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  if (sp.status) {
    taskQuery = taskQuery.eq("status", sp.status);
  }

  const { data: tasks } = await taskQuery;

  // Fetch recent attendance
  const workerIds = (workers || []).map((w) => w.id);
  const { data: attendance } = await supabase
    .from("farm_attendance_records")
    .select("*, farm_workers(full_name, role)")
    .in("worker_id", workerIds.length > 0 ? workerIds : ["00000000-0000-0000-0000-000000000000"])
    .order("work_date", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-leaf-900 sm:text-3xl">Field Tasks & Farm Labour</h1>
          <p className="text-xs text-muted mt-1">
            Dispatch operational duties to field staff, track daily worker attendance, and monitor direct labor costs.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Total Tasks</p>
          <p className="text-xl font-black text-leaf-900 mt-1">{tasks?.length || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-600">
          <p className="text-xs font-medium text-muted">Pending / To Do</p>
          <p className="text-xl font-black text-amber-900 mt-1">
            {tasks?.filter((t) => t.status === "todo").length || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-medium text-muted">Completed Tasks</p>
          <p className="text-xl font-black text-emerald-900 mt-1">
            {tasks?.filter((t) => t.status === "completed").length || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600">
          <p className="text-xs font-medium text-muted">Active Farm Workers</p>
          <p className="text-xl font-black text-sky-900 mt-1">{workers?.length || 0}</p>
        </Card>
      </div>

      {/* Main Grid: Tasks List & Action Forms */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Tasks List & Attendance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Workstation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Operational Task Board</h2>
              <div className="flex items-center gap-1">
                <Link
                  href={`/${lang}/account/tasks`}
                  className={`rounded px-2.5 py-1 text-xs font-bold ${
                    !sp.status ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                  }`}
                >
                  All
                </Link>
                <Link
                  href={`/${lang}/account/tasks?status=todo`}
                  className={`rounded px-2.5 py-1 text-xs font-bold ${
                    sp.status === "todo" ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                  }`}
                >
                  To Do
                </Link>
                <Link
                  href={`/${lang}/account/tasks?status=completed`}
                  className={`rounded px-2.5 py-1 text-xs font-bold ${
                    sp.status === "completed" ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                  }`}
                >
                  Completed
                </Link>
              </div>
            </div>

            {(!tasks || tasks.length === 0) ? (
              <Card className="p-8 text-center border-dashed">
                <span className="text-3xl">✅</span>
                <p className="mt-2 text-sm font-bold text-ink">No operational tasks found</p>
                <p className="text-xs text-muted mt-1">
                  Create field tasks to coordinate weeding, fertilizing, spraying, or harvesting.
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Card key={task.id} className="p-3.5 border border-line flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">{task.title}</span>
                        <Badge
                          tone={
                            task.priority === "critical"
                              ? "danger"
                              : task.priority === "high"
                              ? "warning"
                              : "default"
                          }
                        >
                          {task.priority}
                        </Badge>
                        <Badge tone={task.status === "completed" ? "leaf" : "warning"}>{task.status}</Badge>
                      </div>
                      {task.description && <p className="text-xs text-neutral-600">{task.description}</p>}
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted">
                        <span>Assigned: {task.farm_workers?.full_name || "Unassigned"}</span>
                        {task.due_date && <span>&bull; Due: {task.due_date}</span>}
                        {task.direct_cost_minor > 0 && (
                          <span>&bull; Cost: ₦{((task.direct_cost_minor || 0) / 100).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {task.status !== "completed" && (
                      <form action={updateTaskStatus}>
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="status" value="completed" />
                        <button
                          type="submit"
                          className="rounded bg-leaf-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-leaf-700 whitespace-nowrap"
                        >
                          ✓ Mark Done
                        </button>
                      </form>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Attendance Records */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Recent Attendance & Daily Labor Wages</h2>
            {(!attendance || attendance.length === 0) ? (
              <Card className="p-4 text-center border-dashed">
                <p className="text-xs text-muted">No attendance logged yet.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-line text-neutral-600 font-bold">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Worker</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Hours</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {attendance.map((att) => (
                      <tr key={att.id}>
                        <td className="p-2.5">{att.work_date}</td>
                        <td className="p-2.5 font-bold">{att.farm_workers?.full_name}</td>
                        <td className="p-2.5 capitalize">{att.farm_workers?.role}</td>
                        <td className="p-2.5">{att.hours_worked} hrs</td>
                        <td className="p-2.5">
                          <Badge tone={att.status === "present" ? "leaf" : "warning"}>{att.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="space-y-6">
          {/* Create Task Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Create Operational Task</h3>
            <form action={createFarmTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Target Farm *</label>
                <select
                  name="farm_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Farm...</option>
                  {(farms || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Apply top-dressing urea on Block A"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Assign Worker</label>
                <select
                  name="assigned_worker_id"
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Unassigned</option>
                  {(workers || []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Description / Instructions</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Specific field instructions..."
                  className="w-full rounded-md border border-line px-3 py-1.5 text-xs focus:outline-leaf-600"
                />
              </div>

              <Button type="submit" className="w-full bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs py-2">
                ➕ Dispatch Task
              </Button>
            </form>
          </Card>

          {/* Add Worker Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Register Farm Worker</h3>
            <form action={createFarmWorker} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Farm *</label>
                <select
                  name="farm_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Farm...</option>
                  {(farms || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Worker Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="e.g. Babatunde Alabi"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Role</label>
                  <select
                    name="role"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="field_worker">Field Worker</option>
                    <option value="tractor_operator">Tractor Operator</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="herdsman">Herdsman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Daily Wage (NGN Minor)</label>
                  <input
                    type="number"
                    name="daily_rate_minor"
                    placeholder="e.g. 500000 (5,000 NGN)"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-harvest-700 hover:bg-harvest-800 text-white font-bold text-xs py-2">
                👥 Add Worker to Roster
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
