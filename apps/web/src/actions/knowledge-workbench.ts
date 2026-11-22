"use server";

import { createHash } from "node:crypto";
import { refresh } from "next/cache";
import {
  AgrochemicalSchema,
  NewStandardSchema,
  StandardDraftSchema,
  TranslationRequestSchema,
  readParameters,
  stableStringify,
  standardTranslationSources,
  type AgrochemicalInput,
  type HistoryEntry,
  type NewStandardInput,
  type StandardDraftInput,
  type StandardRow,
} from "@/lib/admin/knowledge";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// Content & Knowledge workbench actions (/admin/content). Every database function checks the caller's
// permission and the two-person rules itself (supabase/migrations/20261124000000_content_knowledge_workbench.sql);
// a forged call from someone without the permission fails there. Messages are shown to staff only.

export type WorkbenchResult<T = undefined> = { ok: boolean; message: string; data?: T };

type DbError = { code?: string; message?: string } | null;
type Rpc = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: DbError }>;
type Untyped = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, v: unknown) => Promise<{ data: unknown; error: DbError }>;
      in: (col: string, v: unknown[]) => Promise<{ data: unknown; error: DbError }>;
      order: (col: string, opts?: { ascending?: boolean }) => Promise<{ data: unknown; error: DbError }>;
    };
  };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function db(): Promise<{ rpc: Rpc; client: Untyped }> {
  const supabase = await createClient();
  return { rpc: supabase.rpc.bind(supabase) as unknown as Rpc, client: supabase as unknown as Untyped };
}

/** Our own database messages (22023, P0002, 42501 with a sentence) are written for staff; anything else stays generic. */
function fail<T>(error: DbError, context: string): WorkbenchResult<T> {
  const code = error?.code ?? "";
  if (code === "42501") {
    const msg = error?.message ?? "";
    return { ok: false, message: msg && !msg.startsWith("Permission denied") ? msg : "You do not have permission to do this." };
  }
  if (["22023", "P0001", "P0002"].includes(code)) return { ok: false, message: error?.message ?? "Not saved." };
  logger.error("knowledge_workbench_action_failed", { context, code });
  return { ok: false, message: "Something went wrong. Nothing was changed." };
}

function ok<T>(message: string, data?: T): WorkbenchResult<T> {
  refresh();
  return { ok: true, message, data };
}

function invalid<T>(issues: { message: string }[]): WorkbenchResult<T> {
  return { ok: false, message: issues[0]?.message ?? "Check the form and try again." };
}

const cleanId = (v: unknown): string | null => (typeof v === "string" && UUID.test(v) ? v : null);
const cleanText = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

// ---------------------------------------------------------------------------------------------- standards

export async function createStandard(input: NewStandardInput): Promise<WorkbenchResult<{ id: string }>> {
  const parsed = NewStandardSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);
  const d = parsed.data;
  const { rpc, client } = await db();

  // Copying an older or current version (new version / restore) carries its content into the new draft.
  let copy: Partial<StandardRow> = {};
  if (d.copy_from_id) {
    const { data, error } = await client.from("farm_agronomic_standards").select("*").eq("id", d.copy_from_id);
    if (error) return fail(error, "create_standard_copy");
    const row = (data as StandardRow[] | null)?.[0];
    if (!row) return { ok: false, message: "The version to copy was not found." };
    copy = row;
  }

  const { data, error } = await rpc("agronomy_create_standard_draft", {
    p_standard_code: d.standard_code,
    p_crop_or_livestock_id: d.crop_or_livestock_id,
    p_agro_zone: d.agro_zone,
    p_version: d.version,
    p_title: d.title,
    p_description: copy.description ?? null,
    p_parameters: copy.parameters ?? {},
    p_mandated_operations: copy.mandated_operations ?? [],
    p_restricted_chemicals: copy.restricted_chemicals ?? [],
    p_max_nitrogen_kg_ha: d.max_nitrogen_kg_ha,
    p_source_authority: d.source_authority,
    p_supersedes_id: d.supersedes_id,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, message: `Version ${d.version} of ${d.standard_code} already exists.` };
    return fail(error, "create_standard");
  }
  const id = (data as { id?: string } | null)?.id;
  return ok(`Draft ${d.standard_code} v${d.version} created.`, id ? { id } : undefined);
}

export async function saveStandardDraft(input: StandardDraftInput): Promise<WorkbenchResult> {
  const parsed = StandardDraftSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);
  const d = parsed.data;
  const { rpc, client } = await db();

  // Keep any other parameter keys already stored (e.g. seed rates) alongside the edited sections.
  const { data: current, error: readError } = await client.from("farm_agronomic_standards").select("parameters").eq("id", d.id);
  if (readError) return fail(readError, "save_standard_read");
  const existing = readParameters((current as { parameters: unknown }[] | null)?.[0]?.parameters);

  const { error } = await rpc("agronomy_update_standard_draft", {
    p_standard_id: d.id,
    p_title: d.title,
    p_description: d.description,
    p_agro_zone: d.agro_zone,
    p_source_authority: d.source_authority,
    p_parameters: {
      ...existing.other,
      stages: d.stages,
      nutrient_plan: d.nutrient_plan,
      protection_notes: d.protection_notes,
    },
    p_mandated_operations: d.mandated_operations,
    p_restricted_chemicals: d.restricted_chemicals,
    p_max_nitrogen_kg_ha: d.max_nitrogen_kg_ha,
  });
  return error ? fail(error, "save_standard") : ok("Draft saved.");
}

export async function submitStandard(standardId: string, notes: string): Promise<WorkbenchResult> {
  const id = cleanId(standardId);
  if (!id) return { ok: false, message: "Invalid standard." };
  const { rpc } = await db();
  const { error } = await rpc("agronomy_submit_standard_for_review", { p_standard_id: id, p_notes: cleanText(notes, 1000) || null });
  return error ? fail(error, "submit_standard") : ok("Sent for review. A different reviewer must approve it.");
}

export async function approveStandard(standardId: string, notes: string): Promise<WorkbenchResult> {
  const id = cleanId(standardId);
  if (!id) return { ok: false, message: "Invalid standard." };
  const { rpc } = await db();
  const { error } = await rpc("agronomy_approve_standard", { p_standard_id: id, p_notes: cleanText(notes, 1000) || null });
  return error ? fail(error, "approve_standard") : ok("Approved. It goes live when approved revisions are published.");
}

export async function returnStandard(standardId: string, reason: string): Promise<WorkbenchResult> {
  const id = cleanId(standardId);
  if (!id) return { ok: false, message: "Invalid standard." };
  const { rpc } = await db();
  const { error } = await rpc("agronomy_return_standard", { p_standard_id: id, p_reason: cleanText(reason, 1000) });
  return error ? fail(error, "return_standard") : ok("Returned to the author for revision.");
}

/** Publishes every approved standard. Each is checked by agronomy_publish_standard; failures are reported per item. */
export async function publishApprovedStandards(): Promise<WorkbenchResult<{ published: string[]; failed: string[] }>> {
  const { rpc, client } = await db();
  const { data, error } = await client
    .from("farm_agronomic_standards")
    .select("id, standard_code, version")
    .eq("status", "approved");
  if (error) return fail(error, "publish_list");
  const rows = (data as { id: string; standard_code: string; version: string }[] | null) ?? [];
  if (rows.length === 0) return { ok: false, message: "There are no approved revisions to publish." };

  const published: string[] = [];
  const failed: string[] = [];
  for (const r of rows) {
    const { error: pubError } = await rpc("agronomy_publish_standard", {
      p_standard_id: r.id,
      p_approver_title: null,
      p_partner_reference: null,
      p_notes: null,
    });
    const label = `${r.standard_code} v${r.version}`;
    if (pubError) {
      const reason = fail(pubError, "publish_standard").message;
      failed.push(`${label}: ${reason}`);
    } else {
      published.push(label);
    }
  }
  refresh();
  const message =
    failed.length === 0
      ? `Published ${published.length} standard${published.length === 1 ? "" : "s"}: ${published.join(", ")}.`
      : `Published ${published.length}, not published ${failed.length}. ${failed.join(" ")}`;
  return { ok: failed.length === 0, message, data: { published, failed } };
}

export async function getStandardHistory(standardCode: string): Promise<WorkbenchResult<HistoryEntry[]>> {
  const code = cleanText(standardCode, 80);
  if (!/^[A-Z0-9_]{3,80}$/i.test(code)) return { ok: false, message: "Invalid standard code." };
  const { rpc } = await db();
  const { data, error } = await rpc("agronomy_standard_history", { p_standard_code: code });
  if (error) return fail(error, "standard_history");
  return { ok: true, message: "", data: (data as HistoryEntry[] | null) ?? [] };
}

/** Builds a JSON package of published standards, approved products and approved translations with a SHA-256 checksum. */
export async function exportKnowledgePackage(): Promise<WorkbenchResult<{ filename: string; json: string }>> {
  const { client } = await db();
  const [std, chem, tr] = await Promise.all([
    client.from("farm_agronomic_standards").select("*").eq("status", "published"),
    client.from("agrochemical_products").select("*").eq("status", "approved"),
    client.from("content_translations").select("source_key, source_text, target_lang, translated_text, domain, updated_at").eq("status", "approved"),
  ]);
  const err = std.error ?? chem.error ?? tr.error;
  if (err) return fail(err, "export_package");

  const standards = ((std.data as StandardRow[] | null) ?? []).map((s) => ({
    standard_code: s.standard_code,
    version: s.version,
    crop_or_livestock_id: s.crop_or_livestock_id,
    agro_zone: s.agro_zone,
    title: s.title,
    description: s.description,
    source_authority: s.source_authority,
    parameters: s.parameters,
    mandated_operations: s.mandated_operations,
    restricted_chemicals: s.restricted_chemicals,
    max_nitrogen_kg_ha: s.max_nitrogen_kg_ha,
    approved_by_name: s.approved_by_name,
    published_at: s.published_at,
    effective_from: s.effective_from,
    effective_to: s.effective_to,
  }));
  const content = {
    standards,
    agrochemicals: (chem.data as unknown[] | null) ?? [],
    translations: (tr.data as unknown[] | null) ?? [],
  };
  const checksum = createHash("sha256").update(stableStringify(content)).digest("hex");
  const exportedAt = new Date().toISOString();
  const pkg = {
    manifest: "CultivaNode knowledge package",
    exported_at: exportedAt,
    sha256: checksum,
    counts: { standards: standards.length, agrochemicals: content.agrochemicals.length, translations: content.translations.length },
    ...content,
  };
  return {
    ok: true,
    message: `Exported ${standards.length} standards, ${content.agrochemicals.length} products and ${content.translations.length} translations.`,
    data: { filename: `cultivanode-knowledge-${exportedAt.slice(0, 10)}.json`, json: JSON.stringify(pkg, null, 2) },
  };
}

// ---------------------------------------------------------------------------------------------- agrochemicals

export async function saveAgrochemical(input: AgrochemicalInput): Promise<WorkbenchResult> {
  const parsed = AgrochemicalSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);
  const d = parsed.data;
  const { rpc } = await db();
  const { error } = await rpc("agrochemical_save_draft", {
    p_id: d.id,
    p_trade_name: d.trade_name,
    p_product_category: d.product_category,
    p_formulation: d.formulation ?? null,
    p_active_ingredients: d.active_ingredients,
    p_manufacturer: d.manufacturer ?? null,
    p_nafdac_reg_no: d.nafdac_reg_no || null,
    p_label_rate_value: d.label_rate_value,
    p_label_rate_unit: d.label_rate_unit,
    p_rei_hours: d.rei_hours,
    p_phi_days: d.phi_days,
    p_who_hazard_class: d.who_hazard_class,
    p_target_crops: d.target_crops,
    p_target_pests: d.target_pests,
    p_label_source: d.label_source,
  });
  return error ? fail(error, "save_agrochemical") : ok(d.id ? "Product draft updated." : "Product added as a draft.");
}

export async function submitAgrochemical(id: string): Promise<WorkbenchResult> {
  const pid = cleanId(id);
  if (!pid) return { ok: false, message: "Invalid product." };
  const { rpc } = await db();
  const { error } = await rpc("agrochemical_submit_for_review", { p_id: pid });
  return error ? fail(error, "submit_agrochemical") : ok("Sent for review. A different reviewer must check it.");
}

export async function reviewAgrochemical(id: string, approve: boolean, notes: string): Promise<WorkbenchResult> {
  const pid = cleanId(id);
  if (!pid) return { ok: false, message: "Invalid product." };
  const { rpc } = await db();
  const { error } = await rpc("agrochemical_review", { p_id: pid, p_approve: approve, p_notes: cleanText(notes, 1000) || null });
  return error ? fail(error, "review_agrochemical") : ok(approve ? "Product approved." : "Returned to the author with your notes.");
}

export async function withdrawAgrochemical(id: string, reason: string): Promise<WorkbenchResult> {
  const pid = cleanId(id);
  if (!pid) return { ok: false, message: "Invalid product." };
  const { rpc } = await db();
  const { error } = await rpc("agrochemical_withdraw", { p_id: pid, p_reason: cleanText(reason, 1000) });
  return error ? fail(error, "withdraw_agrochemical") : ok("Product withdrawn.");
}

// ---------------------------------------------------------------------------------------------- translations

export async function requestTranslation(input: {
  source_key: string;
  source_text: string;
  domain: string;
  target_lang: string;
}): Promise<WorkbenchResult> {
  const parsed = TranslationRequestSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);
  const d = parsed.data;
  const { rpc } = await db();
  const { error } = await rpc("content_translation_request", {
    p_source_key: d.source_key,
    p_source_text: d.source_text,
    p_domain: d.domain,
    p_target_lang: d.target_lang,
  });
  return error ? fail(error, "request_translation") : ok("Added to the translation queue.");
}

/** Queues every stage name, stage description and protection note of a standard for one language. */
export async function queueStandardTranslations(standardId: string, targetLang: string): Promise<WorkbenchResult> {
  const id = cleanId(standardId);
  if (!id || !["yo", "ha", "ig", "pcm"].includes(targetLang)) return { ok: false, message: "Invalid request." };
  const { rpc, client } = await db();
  const { data, error } = await client.from("farm_agronomic_standards").select("standard_code, version, parameters").eq("id", id);
  if (error) return fail(error, "queue_translations_read");
  const std = (data as Pick<StandardRow, "standard_code" | "version" | "parameters">[] | null)?.[0];
  if (!std) return { ok: false, message: "Standard not found." };
  const sources = standardTranslationSources(std);
  if (sources.length === 0) return { ok: false, message: "This standard has no stages or protection notes to translate yet." };
  for (const s of sources) {
    const { error: reqError } = await rpc("content_translation_request", {
      p_source_key: s.source_key,
      p_source_text: s.source_text,
      p_domain: s.domain,
      p_target_lang: targetLang,
    });
    if (reqError) return fail(reqError, "queue_translations");
  }
  return ok(`Queued ${sources.length} text${sources.length === 1 ? "" : "s"} for translation.`);
}

export async function submitTranslation(id: string, text: string): Promise<WorkbenchResult> {
  const tid = cleanId(id);
  if (!tid) return { ok: false, message: "Invalid translation." };
  const { rpc } = await db();
  const { error } = await rpc("content_translation_submit", { p_id: tid, p_text: cleanText(text, 2000) });
  return error ? fail(error, "submit_translation") : ok("Translation sent for review.");
}

export async function reviewTranslation(id: string, approve: boolean, notes: string): Promise<WorkbenchResult> {
  const tid = cleanId(id);
  if (!tid) return { ok: false, message: "Invalid translation." };
  const { rpc } = await db();
  const { error } = await rpc("content_translation_review", { p_id: tid, p_approve: approve, p_notes: cleanText(notes, 1000) || null });
  return error ? fail(error, "review_translation") : ok(approve ? "Translation approved." : "Translation returned with your notes.");
}
