import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";
import { ANALYSE_MESSAGE, analyseObservation } from "@/lib/scouting-photos";

// The mobile app asks for photo analysis here after uploading a scouting observation's photos.
// It sends the farmer's own access token, so every read and write below runs as that farmer
// (row and storage policies apply). The AI keys never leave the server.
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { observation_id?: string; language?: string };
  if (!UUID.test(String(body.observation_id))) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { url, key } = supabaseEnv();
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  }) as SupabaseClient;
  const { data: user } = await db.auth.getUser(token);
  if (!user.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const outcome = await analyseObservation(db, String(body.observation_id), body.language === "yo" ? "yo" : "en");
  if (outcome === "done") {
    const { data } = await db.from("crop_observations").select("ai_diagnosis, ai_model, ai_analysed_at").eq("id", body.observation_id!).maybeSingle();
    return NextResponse.json({ outcome, ...(data ?? {}) });
  }
  const status = outcome === "not_found" ? 404 : outcome === "failed" ? 502 : 200;
  return NextResponse.json({ outcome, message: ANALYSE_MESSAGE[outcome] }, { status });
}
