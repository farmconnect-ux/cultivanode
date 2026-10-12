import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { Button } from "@/components/ui";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog } from "@/components/ds/screen-dialog";
import { FieldOperationsCalendar } from "@/components/screens/field-operations-calendar";
import {
  ScheduleTaskModal,
  WorkerRegisterModal,
  AssignStaffModal,
  type CycleOpOption,
} from "@/components/screens/task-dialogs";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import { getLivePilotWeather } from "@/lib/weather";
import { updateTaskStatus, syncCropCycleOperationsToTasks } from "@/actions/farm-tasks";

export const metadata: Metadata = { title: "Field operations & calendar" };

export default async function Page({ params }: PageProps<"/[lang]/account/tasks">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  const weatherData = await getLivePilotWeather();

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

  // Active crop cycles
  const { data: rawCycles } = farmIds.length
    ? await supabase
        .from("crop_cycles")
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const cycleList = (rawCycles ?? []) as any[];
  const cycleIds = cycleList.map((c) => c.id);
  const cycleMap = new Map(cycleList.map((c) => [c.id, c]));

  // Operations defined on user's active crop cycles
  const { data: rawCycleOps } = cycleIds.length
    ? await supabase
        .from("crop_cycle_operations")
        .select("*")
        .in("crop_cycle_id", cycleIds)
        .order("scheduled_date", { ascending: true })
    : { data: [] };

  const cycleOpsList = (rawCycleOps ?? []) as any[];

  // Operational tasks in farm_operational_tasks
  const { data: tasks } = farmIds.length
    ? await supabase
        .from("farm_operational_tasks")
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const taskList = tasks ?? [];

  // Prepare CycleOpOptions for auto-populating modal
  const cycleOpOptions: CycleOpOption[] = cycleOpsList.map((op: any) => {
    const cycle = cycleMap.get(op.crop_cycle_id);
    const plot = cycle?.plot_id ? plotMap.get(cycle.plot_id) : undefined;
    return {
      id: op.id,
      crop_cycle_id: op.crop_cycle_id,
      name: op.name,
      operation_type: op.operation_type,
      stage: op.stage,
      scheduled_date: op.scheduled_date,
      required_inputs: op.required_inputs,
      crop_name: cycle?.crop_name || cycle?.crop_id || "Crop",
      variety: cycle?.variety || cycle?.variety_id || "",
      farm_id: cycle?.farm_id,
      plot_id: cycle?.plot_id,
      plot_name: plot?.name || "General Plot",
    };
  });

  // Calculate un-synced cycle operations for ledger display
  const existingTaskKeySet = new Set(taskList.map((t) => `${t.crop_cycle_id}::${String(t.title || "").toLowerCase()}`));
  const pendingCycleOps = cycleOpsList.filter(
    (cop) => !existingTaskKeySet.has(`${cop.crop_cycle_id}::${String(cop.name || "").toLowerCase()}`)
  );

  const totalOperationsCount = taskList.length + pendingCycleOps.length;
  const hasLiveOperations = totalOperationsCount > 0;
  const urgentCount = taskList.filter((t) => t.priority === "urgent" || t.priority === "high").length;
  const completedCount = taskList.filter((t) => t.status === "completed").length;

  return (
    <>
      <LiveStrip tone={hasLiveOperations ? "live" : "preview"}>
        {hasLiveOperations
          ? `Showing ${totalOperationsCount} field operation${totalOperationsCount === 1 ? "" : "s"} (${taskList.length} scheduled tasks + ${pendingCycleOps.length} planting cycle operations) across ${workerList.length} registered farm worker${workerList.length === 1 ? "" : "s"}.`
          : "The calendar shows sample operations; your booked machinery jobs are listed under My Bookings."}
      </LiveStrip>

      <FieldOperationsCalendar
        lang={lang}
        weatherData={weatherData}
        liveTasks={taskList}
        livePlots={plotList}
        liveWorkers={workerList}
        liveFarms={farmList}
        cropCycles={cycleList}
        cycleOperations={cycleOpsList}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog
                title="Register Farm Worker"
                side="center"
                panel={<WorkerRegisterModal farms={farmList} />}
              >
                <Button
                  className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-colors font-medium"
                  type="button"
                >
                  <Icon name="person_add" className="text-base text-secondary" />
                  <span>Register Worker</span>
                </Button>
              </ScreenDialog>

              <ScreenDialog
                title="Schedule Field Operation"
                side="center"
                panel={
                  <ScheduleTaskModal
                    farms={farmList}
                    plots={plotList}
                    workers={workerList}
                    cycleOperations={cycleOpOptions}
                  />
                }
              >
                <Button
                  className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-colors font-semibold"
                  type="button"
                >
                  <Icon name="add_circle" className="text-base" />
                  <span>Schedule New Operation</span>
                </Button>
              </ScreenDialog>
            </div>
          ),
          kpis: hasLiveOperations ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
              <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      Total Operations
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">
                        {totalOperationsCount}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">Ops</span>
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
                  <span className="text-secondary font-semibold">Multi-Crew Enabled</span>
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
                      Planting Cycles
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-bold">
                        {cycleList.length}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">Cycles</span>
                    </div>
                  </div>
                  <span className="p-2 rounded-lg bg-surface-container-low text-primary">
                    <Icon name="psychology" />
                  </span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">{plotList.length} Active Plots</span>
                  <span className="text-secondary font-semibold">Auto-Synced</span>
                </div>
              </div>
            </div>
          ) : undefined,

          operations: hasLiveOperations ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-space-lg py-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest border-b border-outline-variant/30">
                <div className="space-y-0.5">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Scheduled Operations Ledger ({totalOperationsCount})
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Live farm operational tasks dispatched across your workers, plots, and active crop cycles
                  </p>
                </div>

                {pendingCycleOps.length > 0 && (
                  <form action={syncCropCycleOperationsToTasks} className="inline">
                    <Button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <Icon name="sync" className="text-sm" />
                      <span>Sync All Planting Operations ({pendingCycleOps.length})</span>
                    </Button>
                  </form>
                )}
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead className="bg-surface-container-high text-on-surface-variant uppercase tracking-wider font-label-sm text-label-sm">
                    <tr>
                      <th className="py-space-sm px-space-md">Task &amp; Plot</th>
                      <th className="py-space-sm px-space-md">Assigned Staff</th>
                      <th className="py-space-sm px-space-md">Priority</th>
                      <th className="py-space-sm px-space-md">Due Date</th>
                      <th className="py-space-sm px-space-md">Status</th>
                      <th className="py-space-sm px-space-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {/* 1. Farm Operational Tasks */}
                    {taskList.map((task) => {
                      const plot = task.plot_id ? plotMap.get(task.plot_id) : undefined;
                      const cycle = task.crop_cycle_id ? cycleMap.get(task.crop_cycle_id) : undefined;
                      const isComplete = task.status === "completed";

                      // Extract multiple assigned worker IDs if present
                      const workerNames: string[] = [];
                      const workerIds: string[] = [];
                      if (task.description && typeof task.description === "string" && task.description.includes("[assigned_workers:")) {
                        const match = task.description.match(/\[assigned_workers:\s*([^\]]+)\]/);
                        if (match && match[1]) {
                          const ids = match[1].split(",").map((s: string) => s.trim());
                          for (const wid of ids) {
                            workerIds.push(wid);
                            const w = workerMap.get(wid);
                            if (w) workerNames.push(w.full_name);
                          }
                        }
                      }
                      if (workerNames.length === 0 && task.assigned_worker_id) {
                        workerIds.push(task.assigned_worker_id);
                        const w = workerMap.get(task.assigned_worker_id);
                        if (w) workerNames.push(w.full_name);
                      }

                      return (
                        <tr key={task.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-space-md px-space-md">
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-body-lg font-bold text-on-surface">
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5">
                                <span>{plot ? plot.name : "Whole Farm"}</span>
                                {cycle && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-[10px]">
                                    {cycle.crop_name || cycle.crop_id} ({cycle.variety || cycle.season || "Active"})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-space-md px-space-md">
                            <div className="flex items-center gap-1.5 text-on-surface font-medium">
                              <Icon name="group" className="text-sm text-secondary" />
                              <span className="truncate max-w-[200px]">
                                {workerNames.length > 0
                                  ? workerNames.length > 1
                                    ? `${workerNames.join(", ")} (${workerNames.length} Crew)`
                                    : workerNames[0]
                                  : "Unassigned"}
                              </span>
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
                            <div className="flex items-center justify-end gap-2">
                              <ScreenDialog
                                title="Assign Staff"
                                side="center"
                                panel={
                                  <AssignStaffModal
                                    taskId={task.id}
                                    taskTitle={task.title}
                                    currentWorkerIds={workerIds}
                                    workers={workerList}
                                  />
                                }
                              >
                                <Button
                                  type="button"
                                  className="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-all"
                                >
                                  <Icon name="person_add" className="text-xs text-secondary" />
                                  <span>Assign Staff</span>
                                </Button>
                              </ScreenDialog>

                              {!isComplete && (
                                <form action={updateTaskStatus} className="inline">
                                  <input type="hidden" name="task_id" value={task.id} />
                                  <input type="hidden" name="status" value="completed" />
                                  <Button
                                    type="submit"
                                    className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-all shadow-sm"
                                  >
                                    Complete
                                  </Button>
                                </form>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* 2. Un-synced Planting Cycle Operations */}
                    {pendingCycleOps.map((op) => {
                      const cycle = cycleMap.get(op.crop_cycle_id);
                      const plot = cycle?.plot_id ? plotMap.get(cycle.plot_id) : undefined;
                      const cropName = cycle?.crop_name || cycle?.crop_id || "Crop";

                      return (
                        <tr key={`cycle-op-${op.id}`} className="hover:bg-primary/5 transition-colors bg-primary/[0.02]">
                          <td className="py-space-md px-space-md">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-headline-sm text-body-lg font-bold text-on-surface">
                                  {op.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                                  Plant Cycle Operation
                                </span>
                              </div>
                              <span className="text-xs text-on-surface-variant mt-0.5">
                                {plot ? plot.name : "Planting Plot"} • {cropName} ({cycle?.variety || op.stage || "Active"})
                              </span>
                            </div>
                          </td>

                          <td className="py-space-md px-space-md">
                            <span className="text-xs text-on-surface-variant italic">Unassigned (Plant Cycle)</span>
                          </td>

                          <td className="py-space-md px-space-md">
                            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold bg-surface-container text-on-surface">
                              Standard
                            </span>
                          </td>

                          <td className="py-space-md px-space-md">
                            <span className="text-on-surface">
                              {op.scheduled_date ? formatDate(op.scheduled_date, lang) : "Planned"}
                            </span>
                          </td>

                          <td className="py-space-md px-space-md">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold bg-primary-container/60 text-on-primary-container capitalize">
                              Cycle Plan
                            </span>
                          </td>

                          <td className="py-space-md px-space-md text-right">
                            <ScreenDialog
                              title="Schedule & Assign Operation"
                              side="center"
                              panel={
                                <ScheduleTaskModal
                                  farms={farmList}
                                  plots={plotList}
                                  workers={workerList}
                                  cycleOperations={cycleOpOptions}
                                />
                              }
                            >
                              <Button
                                type="button"
                                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-all shadow-sm"
                              >
                                <Icon name="person_add" className="text-xs" />
                                <span>Assign Staff</span>
                              </Button>
                            </ScreenDialog>
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
