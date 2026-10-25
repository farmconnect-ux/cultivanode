import "server-only";
import { getCropById } from "@cultivanode/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { diagnoseCropPhotos, type CropImage } from "@/lib/ai-vision";
import { isOn } from "@/lib/flags";

// Scouting photos live in the private "scouting-photos" bucket under {user id}/{observation id}/…
// Everything here runs with the farmer's own session, so storage and row policies still apply.
// The new columns and bucket are newer than the generated types, hence the untyped client.

export const SCOUT_BUCKET = "scouting-photos";
const MAX_PHOTOS = 4;
const MAX_BYTES = 8 * 1024 * 1024;

function sniff(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

export function checkScoutPhotos(files: File[]): string | null {
  if (files.length > MAX_PHOTOS) return `Add up to ${MAX_PHOTOS} photos.`;
  if (files.some((f) => f.size > MAX_BYTES)) return "Each photo must be under 8 MB.";
  return null;
}

/** Uploads the photos and returns their storage paths plus the images for the AI (no second download). */
export async function uploadScoutPhotos(
  db: SupabaseClient,
  uid: string,
  observationId: string,
  files: File[],
): Promise<{ paths: string[]; images: CropImage[] } | { error: string }> {
  const paths: string[] = [];
  const images: CropImage[] = [];
  for (const file of files.slice(0, MAX_PHOTOS)) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniff(bytes);
    if (!kind) return { error: "Photos must be JPEG, PNG or WebP pictures." };
    const path = `${uid}/${observationId}/${crypto.randomUUID()}.${kind.ext}`;
    const { error } = await db.storage.from(SCOUT_BUCKET).upload(path, bytes, { contentType: kind.mime, upsert: false });
    if (error) return { error: "A photo couldn't be uploaded. Please try again." };
    paths.push(path);
    images.push({ mime: kind.mime, base64: Buffer.from(bytes).toString("base64") });
  }
  return { paths, images };
}

/** Short-lived links for showing the photos on a page (only the owner's photos resolve). */
export async function signedPhotoUrls(db: SupabaseClient, paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const own = paths.filter((p) => p && !p.startsWith("http"));
  if (!own.length) return out;
  const { data } = await db.storage.from(SCOUT_BUCKET).createSignedUrls(own, 60 * 60);
  for (const row of data ?? []) if (row.path && row.signedUrl) out.set(row.path, row.signedUrl);
  return out;
}

async function downloadImages(db: SupabaseClient, paths: string[]): Promise<CropImage[]> {
  const images: CropImage[] = [];
  for (const path of paths.slice(0, MAX_PHOTOS)) {
    const { data } = await db.storage.from(SCOUT_BUCKET).download(path);
    if (!data) continue;
    const bytes = new Uint8Array(await data.arrayBuffer());
    const kind = sniff(bytes);
    if (kind) images.push({ mime: kind.mime, base64: Buffer.from(bytes).toString("base64") });
  }
  return images;
}

export type AnalyseOutcome = "done" | "off" | "not_configured" | "no_photos" | "not_found" | "failed";

/**
 * Sends an observation's photos to the AI and stores its suggestion on the observation.
 * Pass `images` when they are already in memory (just uploaded); otherwise they are downloaded.
 */
export async function analyseObservation(db: SupabaseClient, observationId: string, language: "en" | "yo", images?: CropImage[]): Promise<AnalyseOutcome> {
  if (!(await isOn("ai_photo_diagnosis"))) return "off";
  const { data: obs } = await db
    .from("crop_observations")
    .select("id, category, title, description, photo_urls, crop_cycles ( crop_id, farms ( state ) )")
    .eq("id", observationId)
    .maybeSingle();
  if (!obs) return "not_found";
  const o = obs as unknown as {
    id: string;
    category: string;
    title: string;
    description: string;
    photo_urls: string[] | null;
    crop_cycles: { crop_id: string; farms: { state: string | null } | null } | null;
  };
  const pics = images ?? (await downloadImages(db, o.photo_urls ?? []));
  if (!pics.length) return "no_photos";
  const cropId = o.crop_cycles?.crop_id ?? "";
  const res = await diagnoseCropPhotos(pics, {
    crop: getCropById(cropId)?.commonName ?? (cropId.replace(/_/g, " ") || "unknown crop"),
    category: o.category.replace(/_/g, " "),
    title: o.title,
    description: o.description,
    state: o.crop_cycles?.farms?.state ?? null,
    language,
  });
  if (!res.ok) return res.error;
  const { error } = await db
    .from("crop_observations")
    .update({ ai_diagnosis: res.diagnosis, ai_model: res.model, ai_analysed_at: new Date().toISOString() })
    .eq("id", observationId);
  return error ? "failed" : "done";
}

export const ANALYSE_MESSAGE: Record<AnalyseOutcome, string> = {
  done: "The AI has looked at your photos. Check its suggestion below.",
  off: "",
  not_configured: "Photo analysis isn't set up yet.",
  no_photos: "Add a photo so the AI can look at it.",
  not_found: "Observation not found.",
  failed: "The AI couldn't look at the photos just now. Try “Analyse photos” again in a moment.",
};
