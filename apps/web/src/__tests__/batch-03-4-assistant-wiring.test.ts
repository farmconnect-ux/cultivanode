import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";

vi.mock("server-only", () => ({}));

import type { VerifiedAiFarmCallerContext } from "@/lib/engines-api-helper";
import { getLiveFarmContextSnapshot } from "@/lib/farm-context/live-farm-context.service";

/**
 * Batch 03.4: wire Batch 03 into the farmer's screens.
 * - Live Farm Context reads `crop_cycle_operations` (past applications) for the active cycles.
 * - The web assistant uses the audited `POST /api/ai/assistant`; the legacy server action is gone.
 */

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

interface RecordedQuery {
  table: string;
  eqs: Array<[string, unknown]>;
  ins: Array<[string, unknown[]]>;
  orders: Array<[string, { ascending?: boolean } | undefined]>;
  limit?: number;
  range?: [number, number];
}

function buildMockUserClient(tableResponses: Record<string, { data: unknown; error: unknown }>) {
  const queries: RecordedQuery[] = [];

  const makeBuilder = (table: string) => {
    const rec: RecordedQuery = { table, eqs: [], ins: [], orders: [] };
    queries.push(rec);

    const resolveQuery = () => {
      const base = tableResponses[table] ?? { data: [], error: null };
      if (base.error || !Array.isArray(base.data)) return base;

      let rows = [...base.data] as Array<Record<string, unknown>>;

      // Apply .eq and .in filters when columns exist on mock rows
      for (const [col, val] of rec.eqs) {
        if (rows.length > 0 && col in rows[0]!) {
          rows = rows.filter((r) => r[col] === val);
        }
      }
      for (const [col, vals] of rec.ins) {
        if (rows.length > 0 && col in rows[0]!) {
          rows = rows.filter((r) => vals.includes(r[col]));
        }
      }

      // Apply first .order() realistically so ascending vs descending bugs are caught
      if (rec.orders.length > 0) {
        const [col, opts] = rec.orders[0]!;
        const asc = opts?.ascending !== false;
        rows.sort((a, b) => {
          const av = String(a[col] ?? "");
          const bv = String(b[col] ?? "");
          return asc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
      }

      if (rec.range) {
        rows = rows.slice(rec.range[0], rec.range[1] + 1);
      } else if (typeof rec.limit === "number") {
        rows = rows.slice(0, rec.limit);
      }

      return { data: rows, error: null };
    };

    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    builder.select = vi.fn(chain);
    builder.eq = vi.fn((col: string, val: unknown) => {
      rec.eqs.push([col, val]);
      return builder;
    });
    builder.in = vi.fn((col: string, vals: unknown[]) => {
      rec.ins.push([col, vals]);
      return builder;
    });
    builder.gt = vi.fn(chain);
    builder.order = vi.fn((col: string, opts?: { ascending?: boolean }) => {
      rec.orders.push([col, opts]);
      return builder;
    });
    builder.limit = vi.fn((n: number) => {
      rec.limit = n;
      return builder;
    });
    builder.range = vi.fn((from: number, to: number) => {
      rec.range = [from, to];
      return builder;
    });
    builder.maybeSingle = vi.fn(async () => tableResponses[table] ?? { data: null, error: null });
    builder.then = (resolve: (v: unknown) => void) => resolve(resolveQuery());
    return builder;
  };

  return {
    queries,
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } }, error: null })),
    },
    from: vi.fn((table: string) => makeBuilder(table)),
  };
}

function makeCaller(client: ReturnType<typeof buildMockUserClient>) {
  return {
    user: { id: USER_ID } as VerifiedAiFarmCallerContext["user"],
    farmId: FARM_ID,
    client: client as unknown as SupabaseClient<Database>,
    verifiedAt: "2026-11-21T04:00:00Z",
  };
}

const NOW = new Date("2026-11-23T06:00:00Z");
const farmRow = {
  id: FARM_ID,
  name: "Ops Farm",
  zone: null,
  state: "Oyo",
  lga: "Ibadan",
  location: null,
  soil_information: {},
  updated_at: "2026-11-20T00:00:00Z",
};
const cycleRow = (id: string) => ({
  id,
  farm_id: FARM_ID,
  plot_id: null,
  crop_id: "maize",
  current_stage: "vegetative",
  status: "maintenance",
  planting_date: "2026-09-01",
  expected_harvest_date: "2026-12-20",
  health_status: "healthy",
  health_score: 90,
  created_at: "2026-09-01T00:00:00Z",
});
const opRow = (id: string, cycleId: string, overrides: Record<string, unknown> = {}) => ({
  id,
  crop_cycle_id: cycleId,
  name: "Top-dress with urea",
  operation_type: "fertiliser_application",
  stage: "vegetative",
  status: "completed",
  scheduled_date: "2026-10-15",
  completed_date: "2026-10-16",
  created_at: "2026-10-10T00:00:00Z",
  ...overrides,
});

describe("Batch 03.4: Live Farm Context reads crop operations history", () => {
  it("returns operations for the active cycles only, newest first, as unverified farmer records with audit refs", async () => {
    const client = buildMockUserClient({
      farms: { data: farmRow, error: null },
      plots: { data: [], error: null },
      crop_cycles: { data: [cycleRow("cycle-1")], error: null },
      crop_cycle_operations: {
        data: [
          opRow("op-old", "cycle-1", { name: "Basal NPK", scheduled_date: "2026-09-05", completed_date: "2026-09-05" }),
          opRow("op-new", "cycle-1"),
          opRow("op-foreign", "cycle-other"),
        ],
        error: null,
      },
    });

    const snapshot = await getLiveFarmContextSnapshot(makeCaller(client), { now: NOW });
    const crop = snapshot.domains.crop_identity_variety_and_stage;
    expect(crop.status).toBe("ok");
    expect(crop.data?.operationsQueryStatus).toBe("ok");
    expect(crop.data?.recentOperations?.map((o) => o.operationId)).toEqual(["op-new", "op-old"]);
    expect(crop.data?.recentOperations?.every((o) => o.state === "unverified_provisional")).toBe(true);
    expect(crop.data?.recentOperations?.[0]).toMatchObject({
      name: "Top-dress with urea",
      operationType: "fertiliser_application",
      status: "completed",
      completedDate: "2026-10-16",
    });

    const opsQuery = client.queries.find((q) => q.table === "crop_cycle_operations");
    expect(opsQuery?.ins).toContainEqual(["crop_cycle_id", ["cycle-1"]]);
    expect(opsQuery?.orders[0]).toEqual(["scheduled_date", { ascending: false }]);

    const refs = snapshot.auditContextRefs.filter((r) => r.source === "crop_cycle_operations").map((r) => r.record_id);
    expect(refs.sort()).toEqual(["op-new", "op-old"]);
  });

  it("does not query operations when there is no active cycle", async () => {
    const client = buildMockUserClient({
      farms: { data: farmRow, error: null },
      plots: { data: [], error: null },
      crop_cycles: { data: [], error: null },
    });
    const snapshot = await getLiveFarmContextSnapshot(makeCaller(client), { now: NOW });
    expect(client.queries.some((q) => q.table === "crop_cycle_operations")).toBe(false);
    expect(snapshot.domains.crop_identity_variety_and_stage.data?.operationsQueryStatus).toBe("skipped");
  });

  it("reports a failed operations query as an error (history unknown), never as an empty history", async () => {
    const client = buildMockUserClient({
      farms: { data: farmRow, error: null },
      plots: { data: [], error: null },
      crop_cycles: { data: [cycleRow("cycle-1")], error: null },
      crop_cycle_operations: { data: null, error: { code: "57014", message: "statement timeout" } },
    });
    const snapshot = await getLiveFarmContextSnapshot(makeCaller(client), { now: NOW });
    const crop = snapshot.domains.crop_identity_variety_and_stage;
    expect(crop.status).toBe("partial");
    expect(crop.data?.operationsQueryStatus).toBe("error");
    expect(crop.data?.recentOperations).toEqual([]);
    expect(crop.validationIssues).toContainEqual(
      expect.objectContaining({ field: "recentOperations", code: "domain_query_error", source: "crop_cycle_operations" }),
    );
    // Active cycles are still returned.
    expect(crop.data?.activeCycles.map((c) => c.cycleId)).toEqual(["cycle-1"]);
  });
});

describe("Batch 03.4: web assistant uses the single audited entry point", () => {
  const webSrc = resolve(__dirname, "..");
  const component = readFileSync(resolve(webSrc, "components/account/ai-farm-assistant.tsx"), "utf8");
  const page = readFileSync(resolve(webSrc, "app/[lang]/account/assistant/page.tsx"), "utf8");

  it("removes the unaudited askFarmAssistantAction server action", () => {
    expect(existsSync(resolve(webSrc, "actions/ai-assistant.ts"))).toBe(false);
    expect(component).not.toMatch(/from\s+["']@\/actions\/ai-assistant["']/);
  });

  it("posts to /api/ai/assistant with a Bearer token", () => {
    expect(component).toContain('fetch("/api/ai/assistant"');
    expect(component).toContain("Authorization: `Bearer ${token}`");
  });

  it("never sends a zone or growth stage and has no default crop", () => {
    const requestBlock = component.slice(component.indexOf("await askAuditedAssistant({"));
    const contextBlock = requestBlock.slice(0, requestBlock.indexOf("language:"));
    expect(contextBlock).not.toMatch(/\bzone\b/);
    expect(contextBlock).not.toMatch(/stageName/);
    expect(component).not.toMatch(/useState<string>\("maize"\)/);
    expect(component).not.toContain('"farmer-1"');
    expect(component).not.toContain('?? "Rainforest"');
  });

  it("asks for ai_intelligence consent before the assistant can be used", () => {
    expect(page).toContain('.eq("consent_type", "ai_intelligence")');
    expect(component).toContain('name="consent_type" value="ai_intelligence"');
  });
});

describe("Batch 03.4: answer feedback (UI-AC-04)", () => {
  const component = readFileSync(resolve(__dirname, "../components/account/ai-farm-assistant.tsx"), "utf8");

  it("records feedback on audited answers through record_ai_feedback with the answer's trace id", () => {
    expect(component).toContain('rpc("record_ai_feedback"');
    expect(component).toContain("p_trace_id: traceId");
    expect(component).toMatch(/m\.role === "assistant" && m\.traceId && <AnswerFeedback traceId=\{m\.traceId\} \/>/);
    for (const outcome of ['"accepted"', '"rejected"', '"modified"']) expect(component).toContain(outcome);
  });

  it("treats a repeat rating (unique violation) as already saved rather than an error", () => {
    expect(component).toContain('error.code === "23505"');
  });
});
