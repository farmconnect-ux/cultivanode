"use server";

import { refresh, revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { SITE_MEDIA_BUCKET } from "@/lib/site-content";
import { createClient } from "@/lib/supabase/server";
import type { AdminResult } from "./admin-console";

// Home-page carousel. The database functions check `site_content.manage` on every call and record
// each change; storage policies allow uploads to hero/ only for the same permission.

const MAX_BYTES = 5 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const field = (form: FormData, name: string, max: number) => String(form.get(name) ?? "").trim().slice(0, max);
const done = (message: string): AdminResult => ({ ok: true, message, at: Date.now() });
const failed = (message: string): AdminResult => ({ ok: false, message, at: Date.now() });

/** Checks the file's first bytes, not just its declared type. */
async function pictureType(file: File): Promise<"jpg" | "png" | "webp" | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

const CONTENT_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

/** The home page in every language picks up the change on the next visit. */
function refreshHomePages() {
  for (const lang of locales) revalidatePath(`/${lang}`);
  refresh();
}

function explain(error: { code?: string; message?: string }, fallback: string): AdminResult {
  if (error.code === "42501") return failed("You do not have permission to change the website.");
  if (["22023", "P0002"].includes(error.code ?? "")) return failed(error.message ?? fallback);
  if (error.code === "23514") return failed("Check the fields: a picture description (3+ characters) is required, and links must start with / or https://.");
  logger.error("hero_slide_action_failed", { code: error.code });
  return failed(fallback);
}

export async function saveHeroSlide(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const idRaw = field(form, "id", 36);
  const id = UUID.test(idRaw) ? idRaw : null;
  const file = form.get("image");
  const hasFile = file instanceof File && file.size > 0;
  if (!id && !hasFile) return failed("Choose a picture to upload.");
  const altEn = field(form, "alt_en", 200);
  if (altEn.length < 3) return failed("Describe the picture in English (at least 3 characters). Screen readers read this aloud.");
  const link = field(form, "link_url", 300);
  if (link && !/^(\/[A-Za-z0-9/_-]*|https:\/\/\S+)$/.test(link)) return failed("Links must start with / (a page on this site) or https://.");

  const supabase = await createClient();
  let newPath: string | null = null;
  if (hasFile) {
    if (file.size > MAX_BYTES) return failed("The picture is larger than 5 MB. Please use a smaller one.");
    const ext = await pictureType(file);
    if (!ext) return failed("Use a JPG, PNG or WebP picture.");
    newPath = `hero/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from(SITE_MEDIA_BUCKET).upload(newPath, file, {
      contentType: CONTENT_TYPES[ext],
      cacheControl: "31536000", // file names are never reused, so pictures can be cached for a year
      upsert: false,
    });
    if (up.error) {
      logger.warn("hero_upload_failed", { reason: up.error.name });
      return failed("The picture could not be uploaded. Check you have permission and try again.");
    }
  }

  const { data, error } = await supabase.rpc("admin_save_hero_slide", {
    // null = new slide / keep the current picture (the generated types do not model SQL nulls here).
    p_id: id as string,
    p_image_path: newPath as string,
    p_title_en: field(form, "title_en", 80),
    p_title_yo: field(form, "title_yo", 80),
    p_caption_en: field(form, "caption_en", 200),
    p_caption_yo: field(form, "caption_yo", 200),
    p_alt_en: altEn,
    p_alt_yo: field(form, "alt_yo", 200),
    p_link_url: link,
    p_published: form.get("published") === "on",
  });
  if (error) {
    if (newPath) await supabase.storage.from(SITE_MEDIA_BUCKET).remove([newPath]);
    return explain(error, "The slide was not saved.");
  }
  const old = (data as { old_image_path?: string | null } | null)?.old_image_path;
  if (old) await supabase.storage.from(SITE_MEDIA_BUCKET).remove([old]);
  refreshHomePages();
  return done(id ? "Slide saved." : "Slide added.");
}

export async function moveHeroSlide(form: FormData): Promise<void> {
  const id = field(form, "id", 36);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_move_hero_slide", { p_id: id, p_up: form.get("direction") === "up" });
  if (error) logger.warn("hero_move_failed", { code: error.code });
  refreshHomePages();
}

export async function setHeroSlidePublished(form: FormData): Promise<void> {
  const id = field(form, "id", 36);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_hero_slide_published", {
    p_id: id,
    p_published: form.get("published") === "true",
  });
  if (error) logger.warn("hero_publish_failed", { code: error.code });
  refreshHomePages();
}

export async function deleteHeroSlide(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const id = field(form, "id", 36);
  if (!UUID.test(id)) return failed("Invalid request.");
  if (form.get("confirm") !== "on") return failed("Tick the box to confirm you want to delete this picture.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_hero_slide", { p_id: id });
  if (error) return explain(error, "The slide was not deleted.");
  if (typeof data === "string") await supabase.storage.from(SITE_MEDIA_BUCKET).remove([data]);
  refreshHomePages();
  return done("Slide deleted.");
}
