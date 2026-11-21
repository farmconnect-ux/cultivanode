import { NextResponse } from "next/server";
import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";
import {
  authorizeAiFarmRequest,
  parseJsonBody,
  verifyActiveAccount,
  verifyAiIntelligenceConsent,
  type VerifiedAiFarmCallerContext,
} from "@/lib/engines-api-helper";
import {
  CreateMemoryInputSchema,
  RetrieveMemoryQuerySchema,
  TransitionMemoryInputSchema,
  createFarmMemory,
  retrieveFarmMemories,
  transitionFarmMemory,
} from "@/lib/memory/farm-memory.service";
import { supabaseEnv } from "@/lib/supabase/env";

async function authenticateBearerUser(
  req: Request,
): Promise<
  | { ok: true; user: User; client: SupabaseClient<Database> }
  | { ok: false; response: NextResponse }
> {
  const token = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  try {
    const { url, key } = supabaseEnv();
    const client = createSupabaseClient<Database>(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    const active = await verifyActiveAccount(client, data.user.id);
    if (!active.ok) return { ok: false, response: active.response };

    const consent = await verifyAiIntelligenceConsent(client, data.user.id);
    if (!consent.ok) return { ok: false, response: consent.response };

    return { ok: true, user: data.user, client };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 }) };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const farmId = url.searchParams.get("farmId");
  const includeProfile = url.searchParams.get("includeProfile") !== "false";
  const includeProvisional = url.searchParams.get("includeProvisional") !== "false";
  const queryText = url.searchParams.get("query") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 20;

  const parsedQuery = RetrieveMemoryQuerySchema.safeParse({
    farmId: farmId || null,
    includeProfile,
    includeProvisional,
    queryText,
    limit,
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: parsedQuery.error.issues[0]?.message || "Invalid query parameters." }, { status: 400 });
  }

  let client: SupabaseClient<Database>;
  if (parsedQuery.data.farmId) {
    const auth = await authorizeAiFarmRequest(req, parsedQuery.data.farmId);
    if (!auth.authorized) return auth.response;
    client = auth.caller.client;
  } else {
    const auth = await authenticateBearerUser(req);
    if (!auth.ok) return auth.response;
    client = auth.client;
  }

  const res = await retrieveFarmMemories(client, parsedQuery.data);
  if (!res.ok) return NextResponse.json({ error: res.error, code: res.code }, { status: res.status });
  return NextResponse.json(res.result);
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, CreateMemoryInputSchema);
  if (!parsed.ok) return parsed.response;

  let client: SupabaseClient<Database>;
  let farmCaller: VerifiedAiFarmCallerContext | null = null;

  if (parsed.data.memoryScope === "farm" && parsed.data.farmId) {
    const auth = await authorizeAiFarmRequest(req, parsed.data.farmId);
    if (!auth.authorized) return auth.response;
    client = auth.caller.client;
    farmCaller = auth.caller;
  } else {
    const auth = await authenticateBearerUser(req);
    if (!auth.ok) return auth.response;
    client = auth.client;
  }

  const res = await createFarmMemory({ client, farmCaller }, parsed.data);
  if (!res.ok) return NextResponse.json({ error: res.error, code: res.code }, { status: res.status });
  return NextResponse.json({ memory: res.memory, traceId: res.traceId }, { status: 201 });
}

export async function PATCH(req: Request) {
  const parsed = await parseJsonBody(req, TransitionMemoryInputSchema);
  if (!parsed.ok) return parsed.response;

  const auth = await authenticateBearerUser(req);
  if (!auth.ok) return auth.response;

  // Determine whether target memory is farm-scoped so we can mint a VerifiedAiFarmCallerContext for audit recording.
  const { data: existing, error } = await auth.client
    .from("farm_memory_items")
    .select("id, memory_scope, farm_id")
    .eq("id", parsed.data.memoryId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to verify memory item." }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Memory item not found or access denied." }, { status: 404 });
  }

  let farmCaller: VerifiedAiFarmCallerContext | null = null;
  if (existing.memory_scope === "farm" && existing.farm_id) {
    const farmAuth = await authorizeAiFarmRequest(req, existing.farm_id);
    if (!farmAuth.authorized) return farmAuth.response;
    farmCaller = farmAuth.caller;
  }

  const res = await transitionFarmMemory({ client: auth.client, farmCaller }, parsed.data);
  if (!res.ok) return NextResponse.json({ error: res.error, code: res.code }, { status: res.status });
  return NextResponse.json({ memory: res.memory, traceId: res.traceId });
}
