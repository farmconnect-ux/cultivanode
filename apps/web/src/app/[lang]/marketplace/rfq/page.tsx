import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card, Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { createBuyerRequestAction } from "@/actions/marketplace";
import { serverPhrasebook, setPageLocale } from "@/i18n/marketing-server";
import YO from "@/i18n/yo-marketing/marketplace-rfq-page";

const tYo = serverPhrasebook(YO);
export const dynamic = "force-dynamic";

export default async function RfqProcurementPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  setPageLocale(lang);

  const supabase = await createClient();

  const [{ data: requests }, { data: categories }] = await Promise.all([
    supabase
      .from("buyer_requests")
      .select(`
        id,
        request_number,
        title,
        target_crop_or_commodity,
        required_quantity,
        unit,
        target_grade,
        delivery_location,
        deadline_date,
        status,
        notes,
        created_at,
        profiles ( full_name )
      `)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("marketplace_categories").select("id, name, slug").order("sort_order"),
  ]);

  return (
    <Container className="py-10 sm:py-14 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/${lang}/marketplace`} className="text-xs text-muted hover:text-leaf-800">{tYo("← Marketplace")}</Link>
            <Badge className="bg-node-100 text-node-800 font-bold text-xs">{tYo("Bulk Sourcing")}</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{tYo("Procurement & Request For Quotes (RFQ)")}</h1>
          <p className="mt-1 text-muted text-sm sm:text-base">{tYo("Processors, institutional buyers, aggregators and offtakers sourcing bulk commodities directly from farming clusters.")}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: Open RFQ Requests List */}
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-ink">{tYo("Active Buyer Demands (")}{tYo(requests?.length ?? 0)})</h2>

          {!requests || requests.length === 0 ? (
            <Card className="p-8 text-center text-muted">
              <span className="text-3xl block mb-2">📦</span>{tYo("No active bulk requests right now. Create the first buyer demand using the form.")}</Card>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((r) => (
                <Card key={r.id} className="flex flex-col gap-3 hover:border-leaf-400 transition">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-semibold text-leaf-800">{tYo(r.request_number)}</span>
                      <h3 className="text-lg font-bold text-ink">{tYo(r.title)}</h3>
                    </div>
                    <Badge className="bg-leaf-100 text-leaf-800 font-bold uppercase text-[11px]">
                      {tYo(r.status)}
                    </Badge>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 rounded-lg bg-earth-50/70 p-3 text-xs">
                    <div>
                      <span className="text-muted block">{tYo("Required Volume")}</span>
                      <span className="font-extrabold text-leaf-900 text-sm">
                        {tYo(r.required_quantity)} {tYo(r.unit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">{tYo("Target Grade")}</span>
                      <span className="font-semibold text-ink">{tYo(r.target_grade || "Standard / Commercial")}</span>
                    </div>
                    <div>
                      <span className="text-muted block">{tYo("Delivery Deadline")}</span>
                      <span className="font-semibold text-ink">{tYo(r.deadline_date)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted">{tYo("📍 Destination: ")}<span className="font-semibold text-ink">{tYo(r.delivery_location)}</span>
                    {r.notes && ` · Notes: ${r.notes}`}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <span className="text-xs text-muted">{tYo("Buyer: ")}{tYo(r.profiles?.full_name || "Verified Offtaker")}
                    </span>
                    <button
                      type="button"
                      className="rounded-md bg-leaf-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-leaf-800 transition"
                    >{tYo("Submit Quote")}</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right: Submit New RFQ Form */}
        <div>
          <Card className="sticky top-20 flex flex-col gap-4 border-2 border-leaf-700 bg-white p-6 shadow-md">
            <h2 className="text-xl font-bold text-ink">{tYo("Publish Bulk Request")}</h2>
            <p className="text-xs text-muted">{tYo("Tell agricultural clusters and commercial growers what volume and grade you require.")}</p>

            <form action={async (formData: FormData) => { "use server"; await createBuyerRequestAction(formData); }} className="flex flex-col gap-3">
              <input type="hidden" name="lang" value={lang} />

              <div>
                <label className="text-xs font-semibold text-muted">{tYo("Request Title")}</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder={tYo("e.g. Sourcing 50 tonnes Yellow Maize")}
                  className="mt-1 w-full rounded-md border border-line p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">{tYo("Category")}</label>
                <select
                  name="category_id"
                  required
                  className="mt-1 w-full rounded-md border border-line p-2 text-sm bg-white"
                >
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{tYo(c.name)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted">{tYo("Target Commodity")}</label>
                  <input
                    type="text"
                    name="commodity"
                    required
                    placeholder={tYo("e.g. Maize")}
                    className="mt-1 w-full rounded-md border border-line p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted">{tYo("Quantity")}</label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    placeholder="e.g. 50"
                    className="mt-1 w-full rounded-md border border-line p-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted">{tYo("Unit")}</label>
                  <select name="unit" className="mt-1 w-full rounded-md border border-line p-2 text-sm bg-white">
                    <option value="tonne">{tYo("Tonne")}</option>
                    <option value="bag">{tYo("Bag (50kg / 100kg)")}</option>
                    <option value="kg">{tYo("Kg")}</option>
                    <option value="crate">{tYo("Crate")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted">{tYo("Deadline Date")}</label>
                  <input
                    type="date"
                    name="deadline_date"
                    required
                    className="mt-1 w-full rounded-md border border-line p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">{tYo("Delivery Destination")}</label>
                <input
                  type="text"
                  name="delivery_location"
                  required
                  placeholder={tYo("e.g. Processing Mill, Oyo, Nigeria")}
                  className="mt-1 w-full rounded-md border border-line p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">{tYo("Quality Specifications / Notes")}</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder={tYo("Moisture below 13%, maximum 2% broken kernels, fumigated.")}
                  className="mt-1 w-full rounded-md border border-line p-2 text-sm"
                />
              </div>

              <Button variant="primary" type="submit" className="w-full mt-2 font-bold">{tYo("Broadcast Bulk Demand")}</Button>
            </form>
          </Card>
        </div>
      </div>
    </Container>
  );
}
