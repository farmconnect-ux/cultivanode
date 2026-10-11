import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { FieldOperationsCalendar } from "@/components/screens/field-operations-calendar";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  createFarmTask,
  updateTaskStatus,
  createFarmWorker,
  recordWorkerAttendance,
} from "@/actions/farm-tasks";

export const metadata: Metadata = { title: "Field operations & calendar" };

export default async function Page({ params }: PageProps<"/[lang]/account/tasks">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, state, lga")
    .or(scope.join(","))
    .order("created_at");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: plots } = farmIds.length
    ? await supabase.from("plots").select("id, farm_id, name, area_ha").in("farm_id", farmIds)
    : { data: [] };
  const plotList = plots ?? [];
  const plotMap = new Map(plotList.map((p) => [p.id, p]));

  const { data: workers } = farmIds.length
    ? await supabase
        .from("farm_workers")
        .select("id, farm_id, full_name, role, status, daily_rate_minor")
        .in("farm_id", farmIds)
    : { data: [] };
  const workerList = workers ?? [];
  const workerMap = new Map(workerList.map((w) => [w.id, w]));

  const { data: tasks } = farmIds.length
    ? await supabase
        .from("farm_operational_tasks")
        .select("id, farm_id, plot_id, crop_cycle_id, assigned_worker_id, title, description, priority, status, due_date, direct_cost_minor, created_at")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const taskList = tasks ?? [];
  const hasLiveTasks = taskList.length > 0;

  const urgentCount = taskList.filter((t) => t.priority === "urgent" || t.priority === "high").length;
  const completedCount = taskList.filter((t) => t.status === "completed").length;

  const taskModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="add_task" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Schedule Field Operation / Task
          </h3>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={createFarmTask} className="space-y-4 text-left">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Target Farm <span className="text-error">*</span>
            </label>
            <select
              name="farm_id"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              {farmList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Plot Location</label>
            <select
              name="plot_id"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="">Whole Farm (No specific plot)</option>
              {plotList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Operation Title <span className="text-error">*</span>
          </label>
          <input
            name="title"
            type="text"
            placeholder="e.g. Split-N Urea top-dressing, Ridge weed clearance, Irrigation check"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Assigned Worker</label>
            <select
              name="assigned_worker_id"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="">Unassigned (Open Roster)</option>
              {workerList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name} ({w.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Priority</label>
            <select
              name="priority"
              defaultValue="medium"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="low">Low (Routine)</option>
              <option value="medium">Medium (Standard)</option>
              <option value="high">High (Time-Sensitive)</option>
              <option value="urgent">Urgent (Immediate Hold)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Target Execution Date</label>
            <input
              name="due_date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Direct Budget / Cost (Minor)</label>
            <input
              name="direct_cost_minor"
              type="number"
              placeholder="e.g. 500000 (₦5,000)"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Instructions / Description</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Equipment needed, safety guardrails, PPE required..."
            className="w-full p-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <ScreenDialogClose>
            <button
              className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md"
              type="button"
            >
              Cancel
            </button>
          </ScreenDialogClose>
          <button
            className="px-5 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary font-semibold shadow-sm"
            type="submit"
            disabled={farmList.length === 0}
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  );

  const workerModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="person_add" className="text-secondary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Add Farm Worker / Labourer
          </h3>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={createFarmWorker} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Farm Enterprise <span className="text-error">*</span>
          </label>
          <select
            name="farm_id"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          >
            {farmList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Worker Full Name <span className="text-error">*</span>
          </label>
          <input
            name="full_name"
            type="text"
            placeholder="e.g. Babatunde Gbadamosi"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Role / Job Title</label>
            <select
              name="role"
              defaultValue="labourer"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="labourer">Field Labourer</option>
              <option value="operator">Tractor / Machinery Operator</option>
              <option value="agronomist">Field Agronomist</option>
              <option value="storekeeper">Inventory Storekeeper</option>
              <option value="farm_manager">Farm Supervisor</option>
              <option value="other">Other Worker</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Employment Type</label>
            <select
              name="employment_type"
              defaultValue="permanent"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            >
              <option value="permanent">Permanent / Full-Time</option>
              <option value="seasonal">Seasonal</option>
              <option value="casual">Casual Daily Worker</option>
              <option value="contractor">Contractor</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Phone Number</label>
            <input
              name="phone"
              type="tel"
              placeholder="e.g. +234 803 123 4567"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Daily Wage / Rate (Minor)</label>
            <input
              name="daily_rate_minor"
              type="number"
              placeholder="e.g. 350000 (₦3,500/day)"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <ScreenDialogClose>
            <button
              className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md"
              type="button"
            >
              Cancel
            </button>
          </ScreenDialogClose>
          <button
            className="px-5 py-2 bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:bg-primary font-semibold shadow-sm"
            type="submit"
            disabled={farmList.length === 0}
          >
            Add Worker
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveTasks ? "live" : "preview"}>
        {hasLiveTasks
          ? `Showing ${taskList.length} operational task${taskList.length === 1 ? "" : "s"} across ${workerList.length} registered farm worker${workerList.length === 1 ? "" : "s"}.`
          : "The calendar shows sample operations; your booked machinery jobs are listed under My Bookings."}
      </LiveStrip>
      <FieldOperationsCalendar
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog title="Add Farm Worker" side="center" panel={workerModal}>
                <button
                  className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-colors font-medium"
                  type="button"
                >
                  <Icon name="person_add" className="text-base text-secondary" />
                  <span>Register Worker</span>
                </button>
              </ScreenDialog>
              <ScreenDialog title="Schedule Operation" side="center" panel={taskModal}>
                <button
                  className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-colors font-semibold"
                  type="button"
                >
                  <Icon name="add_circle" className="text-base" />
                  <span>Schedule New Operation</span>
                </button>
              </ScreenDialog>
            </div>
          ),
          kpis: hasLiveTasks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
              <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      Total Tasks
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">
                        {taskList.length}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">Operations</span>
                    </div>
                  </div>
                  <span className="p-2 rounded-lg bg-surface-container-low text-primary">
                    <Icon name="assignment" />
                  </span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">Completed: {completedCount}</span>
                  <span className="text-secondary font-semibold">Live Ledger</span>
                </div>
              </div>
              <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      Farm Workers
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-secondary font-bold">
                        {workerList.length}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">Crew</span>
                    </div>
                  </div>
                  <span className="p-2 rounded-lg bg-surface-container-low text-secondary">
                    <Icon name="group" />
                  </span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">Active workforce</span>
                  <span className="text-secondary font-semibold">Roster Synced</span>
                </div>
              </div>
              <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      High Priority Tasks
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-error font-bold">
                        {urgentCount}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">Urgent</span>
                    </div>
                  </div>
                  <span className="p-2 rounded-lg bg-error-container text-on-error-container">
                    <Icon name="warning" />
                  </span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">Time-sensitive execution</span>
                  <span className="text-error font-semibold">{urgentCount > 0 ? "Attention" : "On schedule"}</span>
                </div>
              </div>
              <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      Active Plots
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-bold">
                        {plotList.length}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">Plots</span>
                    </div>
                  </div>
                  <span className="p-2 rounded-lg bg-surface-container-low text-primary">
                    <Icon name="terrain" />
                  </span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">{farmList.length} Farms</span>
                  <span className="text-secondary font-semibold">Cadastral Grid</span>
                </div>
              </div>
            </div>
          ) : undefined,
          operations: hasLiveTasks ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-space-lg py-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest">
                <div className="space-y-0.5">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Scheduled Operations Ledger ({taskList.length})
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Live farm operational tasks dispatched across your workers and plots
                  </p>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead className="bg-surface-container-high text-on-surface-variant uppercase tracking-wider font-label-sm text-label-sm">
                    <tr>
                      <th className="py-space-sm px-space-md">Task &amp; Plot</th>
                      <th className="py-space-sm px-space-md">Assigned Worker</th>
                      <th className="py-space-sm px-space-md">Priority</th>
                      <th className="py-space-sm px-space-md">Due Date</th>
                      <th className="py-space-sm px-space-md">Status</th>
                      <th className="py-space-sm px-space-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {taskList.map((task) => {
                      const plot = task.plot_id ? plotMap.get(task.plot_id) : undefined;
                      const worker = task.assigned_worker_id ? workerMap.get(task.assigned_worker_id) : undefined;
                      const isComplete = task.status === "completed";
                      return (
                        <tr key={task.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-space-md px-space-md">
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-body-lg font-bold text-on-surface">
                                {task.title}
                              </span>
                              <span className="text-xs text-on-surface-variant">
                                {plot ? plot.name : "Whole Farm"}
                              </span>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md">
                            <div className="flex items-center gap-1.5 text-on-surface font-medium">
                              <Icon name="person" className="text-sm text-secondary" />
                              <span>{worker ? worker.full_name : "Unassigned"}</span>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md">
                            <span
                              className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold uppercase ${
                                task.priority === "urgent" || task.priority === "high"
                                  ? "bg-error-container text-on-error-container"
                                  : "bg-surface-container text-on-surface"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-space-md px-space-md">
                            <span className="text-on-surface">
                              {task.due_date ? formatDate(task.due_date, lang) : "—"}
                            </span>
                          </td>
                          <td className="py-space-md px-space-md">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold capitalize ${
                                isComplete
                                  ? "bg-secondary-container text-on-secondary-container"
                                  : "bg-primary-container text-on-primary-container"
                              }`}
                            >
                              {task.status}
                            </span>
                          </td>
                          <td className="py-space-md px-space-md text-right">
                            {!isComplete && (
                              <form action={updateTaskStatus} className="inline">
                                <input type="hidden" name="task_id" value={task.id} />
                                <input type="hidden" name="status" value="completed" />
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-all shadow-sm"
                                >
                                  Complete
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : undefined,
        }}
      />
    </>
  );
}
