import type { Metadata } from "next";
import type { ReactNode } from "react";
import { deleteHeroSlide, moveHeroSlide, saveHeroSlide, setHeroSlidePublished } from "@/actions/site-content";
import { AdminForm } from "@/components/admin/admin-form";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ContentAdmin } from "@/components/screens/content-admin";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Alert, Field, Input } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";
import { siteMediaUrl } from "@/lib/site-content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Content & knowledge" };

type Slide = {
  id: string;
  image_path: string;
  title_en: string | null;
  title_yo: string | null;
  caption_en: string | null;
  caption_yo: string | null;
  alt_en: string;
  alt_yo: string | null;
  link_url: string | null;
  published: boolean;
  updated_at: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp";

export default async function ContentPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "site_content.manage")) return <Alert tone="danger">You need the site_content.manage permission.</Alert>;

  const supabase = await createClient();
  const { data } = await supabase
    .from("hero_slides")
    .select("id, image_path, title_en, title_yo, caption_en, caption_yo, alt_en, alt_yo, link_url, published, updated_at")
    .order("position")
    .order("id");
  const slides = (data ?? []) as Slide[];
  const live = slides.filter((s) => s.published).length;

  const manager = (
    <section aria-labelledby="slides-h" className="mb-space-xl flex flex-col gap-space-lg">
      <div className="relative overflow-hidden rounded-xl bg-primary p-space-lg text-on-primary shadow-card">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-secondary/30 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed-dim">Website · live</p>
            <h1 id="slides-h" className="mt-1 font-headline-xl-mobile text-headline-xl-mobile tracking-tight sm:text-headline-xl">
              Home-page pictures
            </h1>
            <p className="mt-2 font-body-md text-body-md text-on-primary/80">
              Pictures in the carousel at the top of the home page, in this order. While none are published, the home page
              shows the built-in illustrations. Changes appear on the website within a minute.
            </p>
          </div>
          <div className="flex gap-space-sm">
            <Stat label="In carousel" value={`${slides.length}/12`} />
            <Stat label="Published" value={live} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-container-lowest p-space-lg shadow-card">
        <div className="mb-space-md flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-fixed/60 text-on-primary-fixed-variant">
            <Icon name="add_photo_alternate" className="text-xl" />
          </span>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Add a picture</h2>
            <p className="text-body-sm text-on-surface-variant">
              JPG, PNG or WebP, up to 5 MB. Landscape pictures work best (3:2, at least 1200 × 800 pixels). Only use photos
              you own or have permission to use, and ask people shown in them for consent.
            </p>
          </div>
        </div>
        <AdminForm action={saveHeroSlide} buttons={[{ label: "Upload picture" }]}>
          <Field id="new-image" label="Picture">
            <Input id="new-image" name="image" type="file" accept={ACCEPT} required />
          </Field>
          <SlideFields prefix="new" />
        </AdminForm>
      </div>

      {slides.length === 0 ? (
        <EmptyState icon="photo_library" title="No pictures yet" description="Uploaded pictures appear here in carousel order." />
      ) : (
        <ol className="flex flex-col gap-space-md">
          {slides.map((s, i) => (
            <li key={s.id}>
              <article className="grid gap-space-md rounded-xl border border-border bg-surface-container-lowest p-space-md shadow-card md:grid-cols-[280px_1fr]">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={siteMediaUrl(s.image_path)}
                    alt={s.alt_en}
                    className={`aspect-[3/2] w-full rounded-lg object-cover ${s.published ? "" : "opacity-60 grayscale"}`}
                  />
                  <span className="tnum absolute left-2 top-2 rounded-md bg-inverse-surface/80 px-2 py-0.5 font-label-sm text-label-sm text-inverse-on-surface">
                    #{i + 1}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={s.published ? "positive" : "neutral"} dot>{s.published ? "Published" : "Hidden"}</Badge>
                    {s.link_url && (
                      <span className="inline-flex min-w-0 items-center gap-1 truncate text-body-sm text-on-surface-variant">
                        <Icon name="link" className="text-base" /> {s.link_url}
                      </span>
                    )}
                  </div>
                  <p className="font-headline-sm text-headline-sm text-on-surface">
                    {s.title_en ?? <span className="text-on-surface-variant">(no title)</span>}
                  </p>
                  {s.caption_en && <p className="text-body-md text-on-surface-variant">{s.caption_en}</p>}
                  <div className="flex flex-wrap gap-2">
                    <form action={moveHeroSlide}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="direction" value="up" />
                      <Button type="submit" variant="secondary" size="sm" disabled={i === 0} aria-label={`Move picture ${i + 1} earlier`}>
                        <Icon name="arrow_upward" /> Earlier
                      </Button>
                    </form>
                    <form action={moveHeroSlide}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="direction" value="down" />
                      <Button type="submit" variant="secondary" size="sm" disabled={i === slides.length - 1} aria-label={`Move picture ${i + 1} later`}>
                        <Icon name="arrow_downward" /> Later
                      </Button>
                    </form>
                    <form action={setHeroSlidePublished}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="published" value={s.published ? "false" : "true"} />
                      <Button type="submit" variant={s.published ? "soft" : "primary"} size="sm">
                        <Icon name={s.published ? "visibility_off" : "visibility"} /> {s.published ? "Hide" : "Publish"}
                      </Button>
                    </form>
                  </div>
                  <details className="group rounded-lg border border-border p-3 open:bg-surface-container-low">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 font-label-md text-label-md text-secondary">
                      <Icon name="edit" className="text-base" /> Edit text or replace picture
                      <Icon name="expand_more" className="ml-auto text-base transition-transform group-open:rotate-180" />
                    </summary>
                    <AdminForm action={saveHeroSlide} hidden={{ id: s.id }} buttons={[{ label: "Save changes" }]} className="mt-3">
                      <Field id={`img-${s.id}`} label="Replace picture" optional="leave empty to keep it">
                        <Input id={`img-${s.id}`} name="image" type="file" accept={ACCEPT} />
                      </Field>
                      <SlideFields prefix={s.id} slide={s} />
                    </AdminForm>
                  </details>
                  <details className="group rounded-lg border border-critical/20 p-3 open:bg-critical/5">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 font-label-md text-label-md text-critical">
                      <Icon name="delete" className="text-base" /> Delete
                      <Icon name="expand_more" className="ml-auto text-base transition-transform group-open:rotate-180" />
                    </summary>
                    <AdminForm action={deleteHeroSlide} hidden={{ id: s.id }} buttons={[{ label: "Delete picture", variant: "secondary" }]} className="mt-3">
                      <label className="flex items-center gap-2 text-body-md">
                        <input type="checkbox" name="confirm" className="size-5 accent-critical" /> Yes, delete this picture from the website
                      </label>
                    </AdminForm>
                  </details>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );

  return (
    <>
      {manager}
      <LiveStrip tone="preview">
        <span className="text-on-surface-variant">
          The knowledge base, advisories and translation queue below show sample data until the content module is connected.
        </span>
      </LiveStrip>
      <ContentAdmin lang="en" />
    </>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-28 rounded-lg bg-on-primary/10 px-4 py-3 ring-1 ring-on-primary/15">
      <p className="font-label-sm text-label-sm uppercase text-on-primary/70">{label}</p>
      <p className="tnum mt-0.5 font-headline-md text-headline-md">{value}</p>
    </div>
  );
}

function SlideFields({ prefix, slide }: { prefix: string; slide?: Slide }) {
  const f = (name: string) => `${prefix}-${name}`;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field id={f("alt_en")} label="Picture description (English)" hint="What the picture shows, for blind visitors. Required.">
        <Input id={f("alt_en")} name="alt_en" required minLength={3} maxLength={200} defaultValue={slide?.alt_en ?? ""} />
      </Field>
      <Field id={f("alt_yo")} label="Picture description (Yorùbá)" optional="optional">
        <Input id={f("alt_yo")} name="alt_yo" maxLength={200} defaultValue={slide?.alt_yo ?? ""} lang="yo" />
      </Field>
      <Field id={f("title_en")} label="Title (English)" optional="optional">
        <Input id={f("title_en")} name="title_en" maxLength={80} defaultValue={slide?.title_en ?? ""} />
      </Field>
      <Field id={f("title_yo")} label="Title (Yorùbá)" optional="optional">
        <Input id={f("title_yo")} name="title_yo" maxLength={80} defaultValue={slide?.title_yo ?? ""} lang="yo" />
      </Field>
      <Field id={f("caption_en")} label="Caption (English)" optional="optional">
        <Input id={f("caption_en")} name="caption_en" maxLength={200} defaultValue={slide?.caption_en ?? ""} />
      </Field>
      <Field id={f("caption_yo")} label="Caption (Yorùbá)" optional="optional">
        <Input id={f("caption_yo")} name="caption_yo" maxLength={200} defaultValue={slide?.caption_yo ?? ""} lang="yo" />
      </Field>
      <Field id={f("link_url")} label="Link" optional="optional" hint="A page on this site such as /farmers, or a full https:// address.">
        <Input id={f("link_url")} name="link_url" maxLength={300} defaultValue={slide?.link_url ?? ""} />
      </Field>
      <label className="flex items-center gap-2 self-end pb-3 font-label-md text-label-md">
        <input type="checkbox" name="published" className="size-5 accent-primary" defaultChecked={slide ? slide.published : true} /> Show on the website
      </label>
    </div>
  );
}
