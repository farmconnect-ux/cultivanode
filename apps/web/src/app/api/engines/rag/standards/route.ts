import { NextResponse } from "next/server";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";
import { parseJsonBody, verifyActiveAccount } from "@/lib/engines-api-helper";
import {
  IngestAgronomicDocumentSchema,
  SearchPublishedStandardsSchema,
  ingestAgronomicStandardDocument,
  retrievePublishedAgronomicStandards,
} from "@/lib/rag/agronomic-standards-rag.service";
import { supabaseEnv } from "@/lib/supabase/env";

async function authenticateActiveCaller(
  req: Request,
): Promise<{ ok: true; client: SupabaseClient<Database>; userId: string } | { ok: false; response: NextResponse }> {
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
    return { ok: true, client, userId: data.user.id };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 }) };
  }
}

export async function POST(req: Request) {
  const auth = await authenticateActiveCaller(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(req, SearchPublishedStandardsSchema);
  if (!parsed.ok) return parsed.response;

  const res = await retrievePublishedAgronomicStandards(auth.client, parsed.data);
  if (!res.ok) return NextResponse.json({ error: res.error, code: res.code }, { status: res.status });
  return NextResponse.json({
    passages: res.passages,
    usedSemanticSearch: res.usedSemanticSearch,
    auditContextRefs: res.auditContextRefs,
  });
}

export async function PUT(req: Request) {
  const auth = await authenticateActiveCaller(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(req, IngestAgronomicDocumentSchema);
  if (!parsed.ok) return parsed.response;

  const res = await ingestAgronomicStandardDocument(auth.client, parsed.data, {
    actorUserId: auth.userId,
  });
  if (!res.ok) return NextResponse.json({ error: res.error, code: res.code }, { status: res.status });
  return NextResponse.json(res, { status: 201 });
}
