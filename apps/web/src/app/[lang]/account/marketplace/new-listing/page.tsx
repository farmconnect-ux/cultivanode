import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card, Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { createMarketplaceListingAction } from "@/actions/marketplace";

export default async function NewMarketplaceListingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const account = await requireAccount(lang);
  const supabase = (await createClient()) as any;

  // Fetch categories, and any farms/harvests the user owns if they are a CultivaNode farmer
  const [{ data: categories }, { data: farms }, { data: harvests }] = await Promise.all([
    supabase.from("marketplace_categories").select("id, name, slug").order("sort_order"),
    supabase.from("farms").select("id, name, state, lga").eq("owner_id", account.userId),
    supabase
      .from("crop_harvests")
      .select(`
        id,
        batch_code,
        harvest_date,
        quantity_kg,
        quality_grade,
        crop_cycles ( id, crop_id, variety_id, plot_id )
      `)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const hasFarms = (farms?.length ?? 0) > 0;

  return (
    <Container className="py-10 sm:py-14 max-w-3xl">
      <div className="flex items-center gap-2 mb-4 text-xs text-muted">
        <Link href={`/${lang}/marketplace`} className="hover:text-leaf-800">
          ← Marketplace
        </Link>
        <span>/</span>
        <span className="text-ink font-semibold">New Listing</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Create Marketplace Listing</h1>
        <p className="mt-1 text-sm text-muted">
          List your agricultural produce, certified inputs, machinery hire, or farm services.
        </p>
      </div>

      <Card className="p-6 sm:p-8 bg-white border border-line shadow-sm">
        <form action={async (formData: FormData) => { "use server"; await createMarketplaceListingAction(formData); }} className="flex flex-col gap-5">
          <input type="hidden" name="lang" value={lang} />

          {/* Seller Profile Name */}
          <div>
            <label className="text-xs font-semibold text-muted">Trading / Business Name</label>
            <input
              type="text"
              name="business_name"
              defaultValue={account.profile.full_name ?? "Agro Seller"}
              required
              className="mt-1 w-full rounded-md border border-line p-2 text-sm font-semibold"
            />
          </div>

          {/* Listing Type & Category */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted">Listing Type</label>
              <select name="listing_type" required className="mt-1 w-full rounded-md border border-line p-2 text-sm bg-white">
                <option value="produce">Farm Produce (Crops, Grains, Tubers)</option>
                <option value="input">Farm Inputs (Fertilisers, Seeds, Chemicals)</option>
                <option value="machinery">Machinery Hire (Tractor, Planter, Harvester)</option>
                <option value="labour">Farm Labour (Hands, Crews, Scouts)</option>
                <option value="service">Agricultural Services (Agronomy, Spraying)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted">Market Category</label>
              <select name="category_id" required className="mt-1 w-full rounded-md border border-line p-2 text-sm bg-white">
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted">Listing Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Clean Dry Yellow Maize (50kg Bags)"
              required
              className="mt-1 w-full rounded-md border border-line p-2 text-sm font-bold"
            />
          </div>

          {/* Pricing & Units */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-muted">Price per Unit (₦)</label>
              <input
                type="number"
                name="price_naira"
                placeholder="25000"
                required
                className="mt-1 w-full rounded-md border border-line p-2 text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted">Unit of Measure</label>
              <select name="unit" required className="mt-1 w-full rounded-md border border-line p-2 text-sm bg-white">
                <option value="bag">Bag</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="tonne">Tonne</option>
                <option value="crate">Crate</option>
                <option value="piece">Piece / Tuber</option>
                <option value="hectare">Hectare (Service/Machinery)</option>
                <option value="day">Day (Labour/Machinery)</option>
                <option value="hour">Hour (Machinery)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted">Pricing Model</label>
              <select name="price_model" className="mt-1 w-full rounded-md border border-line p-2 text-sm bg-white">
                <option value="fixed">Fixed Price</option>
                <option value="negotiable">Negotiable</option>
                <option value="per_unit">Per Unit</option>
                <option value="quotation">Custom Quotation</option>
              </select>
            </div>
          </div>

          {/* Available Quantity & Minimum Order */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted">Available Quantity in Stock</label>
              <input
                type="number"
                name="available_quantity"
                placeholder="100"
                required
                className="mt-1 w-full rounded-md border border-line p-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted">Minimum Order Quantity (MOQ)</label>
              <input
                type="number"
                name="min_order_quantity"
                defaultValue={1}
                required
                className="mt-1 w-full rounded-md border border-line p-2 text-sm"
              />
            </div>
          </div>

          {/* Produce Provenance Section (If Farmer) */}
          {hasFarms && (
            <div className="rounded-xl border-2 border-leaf-300 bg-leaf-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-leaf-800 uppercase tracking-wide">
                  Optional: Link to Farm Harvest Batch (Provenance)
                </span>
                <Badge className="bg-leaf-200 text-leaf-900 text-[10px]">CultivaNode Farm</Badge>
              </div>
              <p className="text-xs text-muted mb-3">
                Connecting this listing to an existing harvest batch displays verified farm provenance badges to buyers.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted">Select Origin Farm</label>
                  <select name="farm_id" className="mt-1 w-full rounded-md border border-line p-2 text-sm bg-white">
                    <option value="">-- None (Independent Listing) --</option>
                    {farms?.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.state})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted">Select Harvest Batch</label>
                  <select name="harvest_id" className="mt-1 w-full rounded-md border border-line p-2 text-sm bg-white">
                    <option value="">-- None --</option>
                    {harvests?.map((h: any) => (
                      <option key={h.id} value={h.id}>
                        {h.batch_code} ({h.quantity_kg} kg - {h.quality_grade})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted">State</label>
              <input
                type="text"
                name="state"
                defaultValue={account.profile.state ?? "Oyo"}
                required
                className="mt-1 w-full rounded-md border border-line p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted">LGA / Community</label>
              <input
                type="text"
                name="lga"
                defaultValue={account.profile.lga ?? "Ibadan"}
                required
                className="mt-1 w-full rounded-md border border-line p-2 text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted">Description &amp; Terms</label>
            <textarea
              name="description"
              rows={4}
              placeholder="State any specific qualities, storage conditions, packaging details, and pickup/delivery options."
              className="mt-1 w-full rounded-md border border-line p-2 text-sm"
            />
          </div>

          <Button variant="primary" type="submit" className="w-full py-3 text-base font-bold shadow-md">
            Publish Marketplace Listing
          </Button>
        </form>
      </Card>
    </Container>
  );
}
