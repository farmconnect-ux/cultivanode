// Listing photos in Supabase Storage (public bucket "listing-photos"). Uploads use the seller's own session:
// storage policies only allow writes inside a folder named after their user id, and the listing trigger only
// accepts photo URLs from that folder.
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

const PHOTO_BUCKET = "listing-photos";
export const MAX_PHOTOS = 8; // per listing (the database enforces this too)
const MAX_PER_SUBMIT = 4;
const MAX_BYTES = 5 * 1024 * 1024;

/** The real image type from the file's first bytes; the browser-supplied type isn't trusted. */
function sniffImage(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

/** The photo files on a form (empty file inputs send a nameless 0-byte part, which is ignored). */
export function photoFiles(form: FormData): File[] {
  return form.getAll("photos").filter((v): v is File => typeof v === "object" && v !== null && "arrayBuffer" in v && v.size > 0);
}

export function checkPhotos(files: File[], already = 0): string | null {
  if (files.length > MAX_PER_SUBMIT) return `Add up to ${MAX_PER_SUBMIT} photos at a time.`;
  if (already + files.length > MAX_PHOTOS) return `A listing can have at most ${MAX_PHOTOS} photos — choose "Replace" or remove some first.`;
  if (files.some((f) => f.size > MAX_BYTES)) return "Each photo must be under 5 MB.";
  return null;
}

/**
 * Uploads photos with the seller's own session into listing-photos/{their id}/{listing}/… (storage policies
 * only allow their own folder) and returns the public URLs.
 */
export async function uploadPhotos(supabase: Client, uid: string, listingId: string, files: File[]): Promise<{ urls: string[] } | { error: string }> {
  const urls: string[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) return { error: "Photos must be JPEG, PNG or WebP pictures." };
    const path = `${uid}/${listingId}/${crypto.randomUUID()}.${kind.ext}`;
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, bytes, { contentType: kind.mime, cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("[listing_photo_upload]", error.message);
      return { error: "A photo couldn't be uploaded. Please try again." };
    }
    urls.push(supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return { urls };
}

/** Deletes the seller's own stored files for photos no longer on a listing (others' URLs are skipped). */
export async function deletePhotos(supabase: Client, uid: string, urls: string[]) {
  const marker = `/storage/v1/object/public/${PHOTO_BUCKET}/`;
  const paths = urls.map((u) => (u.includes(marker) ? decodeURIComponent(u.split(marker)[1]) : "")).filter((p) => p.startsWith(`${uid}/`));
  if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
}

