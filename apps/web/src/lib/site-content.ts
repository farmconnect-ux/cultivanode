import type { Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createAnonClient } from "@/lib/supabase/anon";
import { supabaseEnv } from "@/lib/supabase/env";

export const SITE_MEDIA_BUCKET = "site-media";

export type HeroImageSlide = {
  id: string;
  src: string;
  alt: string;
  title: string | null;
  body: string | null;
  href: string | null;
};

/** Public URL of a picture in the site-media bucket (the bucket is public; no signing needed). */
export function siteMediaUrl(path: string): string {
  const base = supabaseEnv().url.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${SITE_MEDIA_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Published carousel pictures in display order, in the visitor's language (English when a Yorùbá
 * text is missing). Returns [] on any error so the home page falls back to the built-in slides.
 */
export async function loadHeroSlides(lang: Locale): Promise<HeroImageSlide[]> {
  try {
    const { data, error } = await createAnonClient()
      .from("hero_slides")
      .select("id, image_path, title_en, title_yo, caption_en, caption_yo, alt_en, alt_yo, link_url")
      .eq("published", true)
      .order("position")
      .order("id")
      .limit(12);
    if (error) throw error;
    return (data ?? []).map((s) => {
      const yo = lang === "yo";
      const href = s.link_url?.startsWith("/") && !/^\/(en|yo)(\/|$)/.test(s.link_url) ? `/${lang}${s.link_url}` : s.link_url;
      return {
        id: s.id,
        src: siteMediaUrl(s.image_path),
        alt: (yo && s.alt_yo) || s.alt_en,
        title: (yo && s.title_yo) || s.title_en,
        body: (yo && s.caption_yo) || s.caption_en,
        href: href ?? null,
      };
    });
  } catch (error) {
    logger.warn("hero_slides_load_failed", { reason: (error as { code?: string }).code ?? "unknown" });
    return [];
  }
}
