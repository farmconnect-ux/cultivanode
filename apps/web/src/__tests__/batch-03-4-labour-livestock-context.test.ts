import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";

vi.mock("server-only", () => ({}));

import type { VerifiedAiFarmCallerContext } from "@/lib/engines-api-helper";
import { getLiveFarmContextSnapshot } from "@/lib/farm-context/live-farm-context.service";

/** Batch 03.4 (LFC-AC-06): labour and livestock domains in the Live Farm Context. */

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-11-23T06:00:00Z");

type Response = { data: unknown; error: unknown };

function buildClient(responses: Record<string, Response>) {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = [];
  const from = vi.fn((table: string) => {
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "in", "not", "gte", "gt", "lte", "or", "order", "limit", "range"]) {
      builder[method] = vi.fn((...args: unknown[]) => {
        calls.push({ table, method, args });
        return builder;
      });
    }
    builder.maybeSingle = vi.fn(async () => responses[table] ?? { data: null, error: null });
    builder.then = (resolve: (v: unknown) => void) => resolve(responses[table] ?? { data: [], error: null });
    return builder;
  });
  return { calls, from, auth: { getUser: vi.fn() } };
}

function caller(client: ReturnType<typeof buildClient>) {
  return {
    user: { id: USER_ID } as VerifiedAiFarmCallerContext["user"],
    farmId: FARM_ID,
    client: client as unknown as SupabaseClient<Database>,
    verifiedAt: "2026-11-23T05:00:00Z",
  };
}

const base: Record<string, Response> = {
  farms: {
    data: { id: FARM_ID, name: "Mixed", zone: null, state: "Ogun", lga: null, location: null, soil_information: {}, updated_at: "2026-11-01T00:00:00Z" },
    error: null,
  },
  plots: { data: [], error: null },
};

const workers = [
  { id: "w1", role: "supervisor", status: "active", updated_at: "2026-11-01T00:00:00Z" },
  { id: "w2", role: "general_hand", status: "active", updated_at: "2026-11-01T00:00:00Z" },
  { id: "w3", role: "general_hand", status: "on_leave", updated_at: "2026-11-01T00:00:00Z" },
];
const attendance = [
  { id: "a1", worker_id: "w1", status: "present", clock_in_at: "2026-11-22T07:00:00Z" },
  { id: "a2", worker_id: "w2", status: "late", clock_in_at: "2026-11-22T08:00:00Z" },
  { id: "a3", worker_id: "w2", status: "absent", clock_in_at: "2026-11-21T07:00:00Z" },
];
const tasks = [
  {
    id: "t1", title: "Weed plot B", category: "weeding", priority: "high", status: "assigned", plot_id: null,
    crop_cycle_id: null, assigned_worker_id: "w2", start_date: "2026-11-20", due_date: "2026-11-21", updated_at: "2026-11-20T00:00:00Z",
  },
  {
    id: "t2", title: "Fix fence", category: "maintenance", priority: "low", status: "planned", plot_id: null,
    crop_cycle_id: null, assigned_worker_id: null, start_date: "2026-11-24", due_date: "2026-11-30", updated_at: "2026-11-20T00:00:00Z",
  },
];
const groups = [
  {
    id: "g1", group_name: "Layers house 1", animal_type: "poultry", breed: "Isa Brown", purpose: "eggs",
    population: 500, age_weeks: 30, health_status: "monitoring", updated_at: "2026-11-20T00:00:00Z",
  },
];
const healthEvents = [
  {
    id: "h1", group_id: "g1", event_type: "treatment", disease_or_condition: "coccidiosis", medication_name: "Amprolium",
    administered_on: "2026-11-20", head_affected: 40, withdrawal_end_date: "2026-11-27", created_at: "2026-11-20T09:00:00Z",
  },
  {
    id: "h2", group_id: "g1", event_type: "vaccination", disease_or_condition: null, medication_name: "Newcastle",
    administered_on: "2026-10-01", head_affected: 500, withdrawal_end_date: "2026-10-02", created_at: "2026-10-01T09:00:00Z",
  },
];
const production = [
  { id: "p1", group_id: "g1", product_type: "eggs", quantity: "420", unit: "pieces", log_date: "2026-11-22", created_at: "2026-11-22T18:00:00Z" },
];

describe("Batch 03.4: labour domain", () => {
  it("summarises worker capacity without names, flags overdue tasks, and cites every record", async () => {
    const client = buildClient({
      ...base,
      farm_workers: { data: workers, error: null },
      farm_attendance_records: { data: attendance, error: null },
      farm_operational_tasks: { data: tasks, error: null },
    });
    const snapshot = await getLiveFarmContextSnapshot(caller(client), { now: NOW });
    const labour = snapshot.domains.labour_and_tasks!;
    expect(labour.status).toBe("ok");
    expect(labour.data?.workers).toEqual({ active: 2, onLeave: 1, inactive: 0, roles: ["supervisor", "general_hand"] });
    expect(labour.data?.attendanceLast7Days).toEqual({ presentOrLate: 2, absentOrOnLeave: 1, workersRecorded: 2 });
    expect(labour.data?.openTasks.map((t) => [t.taskId, t.overdue, t.assigned])).toEqual([
      ["t1", true, true],
      ["t2", false, false],
    ]);
    expect(JSON.stringify(labour.data)).not.toContain("full_name");

    const sources = new Set(snapshot.auditContextRefs.map((r) => r.source));
    for (const s of ["farm_workers", "farm_attendance_records", "farm_operational_tasks"]) expect(sources.has(s as never)).toBe(true);

    // Only this farm, and only open tasks.
    expect(client.calls).toContainEqual({ table: "farm_workers", method: "eq", args: ["farm_id", FARM_ID] });
    expect(client.calls).toContainEqual({ table: "farm_operational_tasks", method: "not", args: ["status", "in", "(completed,cancelled)"] });
  });

  it("marks the domain partial when one labour query fails, and error when all fail", async () => {
    const timeout = { data: null, error: { code: "57014", message: "statement timeout" } };
    const partial = await getLiveFarmContextSnapshot(
      caller(buildClient({ ...base, farm_workers: { data: workers, error: null }, farm_operational_tasks: timeout })),
      { now: NOW },
    );
    expect(partial.domains.labour_and_tasks?.status).toBe("partial");
    expect(partial.domains.labour_and_tasks?.data?.tasksQueryStatus).toBe("error");
    expect(partial.domains.labour_and_tasks?.validationIssues).toContainEqual(
      expect.objectContaining({ field: "openTasks", code: "domain_query_error", source: "farm_operational_tasks" }),
    );

    const failed = await getLiveFarmContextSnapshot(
      caller(buildClient({ ...base, farm_workers: timeout, farm_attendance_records: timeout, farm_operational_tasks: timeout })),
      { now: NOW },
    );
    expect(failed.domains.labour_and_tasks?.status).toBe("error");
  });
});

describe("Batch 03.4: livestock domain", () => {
  it("returns groups, recent health events, active withdrawals and production as unverified records", async () => {
    const client = buildClient({
      ...base,
      farm_livestock_groups: { data: groups, error: null },
      farm_livestock_health_events: { data: healthEvents, error: null },
      farm_livestock_production_logs: { data: production, error: null },
    });
    const snapshot = await getLiveFarmContextSnapshot(caller(client), { now: NOW });
    const livestock = snapshot.domains.livestock_and_animal_health!;
    expect(livestock.status).toBe("ok");
    expect(livestock.data?.groups[0]).toMatchObject({ groupId: "g1", population: 500, state: "unverified_provisional" });
    expect(livestock.data?.activeWithdrawals.map((e) => e.eventId)).toEqual(["h1"]);
    expect(livestock.data?.recentProduction[0]).toMatchObject({ productType: "eggs", quantity: 420 });

    const refs = snapshot.auditContextRefs.map((r) => `${r.source}:${r.record_id}`);
    expect(refs).toEqual(
      expect.arrayContaining([
        "farm_livestock_groups:g1",
        "farm_livestock_health_events:h1",
        "farm_livestock_production_logs:p1",
      ]),
    );
  });

  it("never reports failed health records as 'no withdrawals'", async () => {
    const snapshot = await getLiveFarmContextSnapshot(
      caller(
        buildClient({
          ...base,
          farm_livestock_groups: { data: groups, error: null },
          farm_livestock_health_events: { data: null, error: { code: "42501", message: "permission denied" } },
        }),
      ),
      { now: NOW },
    );
    const livestock = snapshot.domains.livestock_and_animal_health!;
    expect(livestock.status).toBe("partial");
    expect(livestock.data?.healthQueryStatus).toBe("error");
  });

  it("reports an empty domain when the farm keeps no animals", async () => {
    const snapshot = await getLiveFarmContextSnapshot(caller(buildClient(base)), { now: NOW });
    expect(snapshot.domains.livestock_and_animal_health?.status).toBe("empty");
  });
});
