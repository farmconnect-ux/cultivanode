import type { Metadata } from "next";
import { deleteHeroSlide, moveHeroSlide, saveHeroSlide, setHeroSlidePublished } from "@/actions/site-content";
import { AdminForm } from "@/components/admin/admin-form";
import { Alert, Badge, Button, Card, Field, Input } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";
import { siteMediaUrl } from "@/lib/site-content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Website" };

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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">Website: home-page pictures</h1>
        <p className="mt-1 max-w-3xl text-muted">
          Pictures shown in the carousel at the top of the home page, in this order. While none are published, the
          home page shows the built-in illustrations. Changes appear on the website within a minute.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Add a picture</h2>
        <p className="text-sm text-muted">
          JPG, PNG or WebP, up to 5 MB. Landscape pictures work best (3:2, at least 1200 × 800 pixels). Only use photos
          you own or have permission to use, and ask people shown in them for consent.
        </p>
        <AdminForm action={saveHeroSlide} buttons={[{ label: "Upload picture" }]}>
          <Field id="new-image" label="Picture">
            <Input id="new-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
          </Field>
          <SlideFields prefix="new" />
        </AdminForm>
      </Card>

      <section aria-labelledby="slides-h" className="flex flex-col gap-4">
        <h2 id="slides-h" className="text-2xl font-bold">
          Carousel ({slides.length} of 12, {live} published)
        </h2>
        {slides.length === 0 && <p className="text-muted">No pictures yet.</p>}
        <ol className="flex flex-col gap-4">
          {slides.map((s, i) => (
            <li key={s.id}>
              <Card className="grid gap-5 md:grid-cols-[280px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={siteMediaUrl(s.image_path)} alt={s.alt_en} className="aspect-[3/2] w-full rounded-md border border-line object-cover" />
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">#{i + 1}</span>
                    <Badge className={s.published ? "bg-leaf-50 text-leaf-800" : "bg-line text-muted"}>
                      {s.published ? "Published" : "Hidden"}
                    </Badge>
                    {s.link_url && <span className="text-sm text-muted">Links to {s.link_url}</span>}
                  </div>
                  <p className="font-semibold">{s.title_en ?? <span className="text-muted">(no title)</span>}</p>
                  {s.caption_en && <p className="text-muted">{s.caption_en}</p>}
                  <div className="flex flex-wrap gap-2">
                    <form action={moveHeroSlide}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="direction" value="up" />
                      <Button type="submit" variant="secondary" disabled={i === 0} aria-label={`Move picture ${i + 1} earlier`}>
                        ↑ Earlier
                      </Button>
                    </form>
                    <form action={moveHeroSlide}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="direction" value="down" />
                      <Button type="submit" variant="secondary" disabled={i === slides.length - 1} aria-label={`Move picture ${i + 1} later`}>
                        ↓ Later
                      </Button>
                    </form>
                    <form action={setHeroSlidePublished}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="published" value={s.published ? "false" : "true"} />
                      <Button type="submit" variant={s.published ? "secondary" : "primary"}>
                        {s.published ? "Hide" : "Publish"}
                      </Button>
                    </form>
                  </div>
                  <details className="rounded-md border border-line p-3">
                    <summary className="cursor-pointer font-semibold text-leaf-700">Edit text or replace picture</summary>
                    <AdminForm action={saveHeroSlide} hidden={{ id: s.id }} buttons={[{ label: "Save changes" }]} className="mt-3">
                      <Field id={`img-${s.id}`} label="Replace picture" optional="leave empty to keep it">
                        <Input id={`img-${s.id}`} name="image" type="file" accept="image/jpeg,image/png,image/webp" />
                      </Field>
                      <SlideFields prefix={s.id} slide={s} />
                    </AdminForm>
                  </details>
                  <details className="rounded-md border border-line p-3">
                    <summary className="cursor-pointer font-semibold text-danger">Delete</summary>
                    <AdminForm action={deleteHeroSlide} hidden={{ id: s.id }} buttons={[{ label: "Delete picture", variant: "secondary" }]} className="mt-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="confirm" className="size-5" /> Yes, delete this picture from the website
                      </label>
                    </AdminForm>
                  </details>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>
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
      <label className="flex items-center gap-2 self-end pb-3 font-semibold">
        <input type="checkbox" name="published" className="size-5" defaultChecked={slide ? slide.published : true} /> Show on the website
      </label>
    </div>
  );
}
