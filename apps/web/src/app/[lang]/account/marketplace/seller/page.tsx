import { notFound } from "next/navigation";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card, Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export default async function SellerHubPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const account = await requireAccount(lang);
  const supabase = (await createClient()) as any;

  // Fetch or find seller profile
  const { data: seller } = await supabase
    .from("marketplace_sellers")
    .select("*")
    .eq("profile_id", account.userId)
    .maybeSingle();

  const sellerId = seller?.id;

  const [{ data: listings }, { data: fulfilments }, { data: settlements }] = await Promise.all([
    sellerId
      ? supabase
          .from("marketplace_listings")
          .select("id, title, listing_type, base_price_kobo, unit, available_quantity, status")
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    sellerId
      ? supabase
          .from("marketplace_fulfilments")
          .select(`
            id,
            fulfilment_number,
            status,
            subtotal_kobo,
            created_at,
            marketplace_orders ( order_number, buyer_id, delivery_address )
          `)
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    sellerId
      ? supabase
          .from("marketplace_settlements")
          .select("id, gross_amount_kobo, commission_kobo, net_payout_kobo, status, created_at")
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const totalEarningsKobo = (settlements ?? []).reduce((acc: number, s: any) => acc + Number(s.net_payout_kobo || 0), 0);
  const pendingFulfilmentsCount = (fulfilments ?? []).filter((f: any) => f.status === "placed" || f.status === "confirmed").length;

  return (
    <Container className="py-10 sm:py-14 flex flex-col gap-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/${lang}/marketplace`} className="text-xs text-muted hover:text-leaf-800">
              ← Marketplace
            </Link>
            <Badge className="bg-leaf-100 text-leaf-800 font-bold text-xs uppercase">
              Seller Dashboard
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
            {seller?.business_name || account.profile.full_name || "Marketplace Seller"}
          </h1>
          <p className="mt-1 text-xs text-muted">
            Manage your agricultural listings, customer orders, dispatch logistics, and bank payouts.
          </p>
        </div>

        <Link
          href={`/${lang}/account/marketplace/new-listing`}
          className="rounded-lg bg-leaf-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-leaf-800 transition shadow-sm text-center"
        >
          ➕ Create New Listing
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 bg-white border border-line">
          <span className="text-xs font-semibold text-muted">Total Net Earnings</span>
          <div className="text-2xl font-extrabold text-leaf-900 mt-1">{formatNaira(totalEarningsKobo)}</div>
          <span className="text-[11px] text-muted">Processed via escrow</span>
        </Card>

        <Card className="p-5 bg-white border border-line">
          <span className="text-xs font-semibold text-muted">Active Listings</span>
          <div className="text-2xl font-extrabold text-ink mt-1">
            {(listings ?? []).filter((l: any) => l.status === "active").length}
          </div>
          <span className="text-[11px] text-muted">In public catalogue</span>
        </Card>

        <Card className="p-5 bg-white border border-line">
          <span className="text-xs font-semibold text-muted">Orders Awaiting Dispatch</span>
          <div className="text-2xl font-extrabold text-harvest-700 mt-1">{pendingFulfilmentsCount}</div>
          <span className="text-[11px] text-muted">Needs preparation</span>
        </Card>

        <Card className="p-5 bg-white border border-line">
          <span className="text-xs font-semibold text-muted">Seller Trust Rating</span>
          <div className="text-2xl font-extrabold text-ink mt-1">
            ★ {Number(seller?.rating_avg ?? 5.0).toFixed(1)}
          </div>
          <span className="text-[11px] text-muted">{seller?.rating_count ?? 0} verified customer reviews</span>
        </Card>
      </div>

      {/* Orders to Fulfil */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-ink">Recent Customer Fulfilments ({fulfilments?.length ?? 0})</h2>

        {!fulfilments || fulfilments.length === 0 ? (
          <Card className="p-8 text-center text-muted">
            <span className="text-3xl block mb-2">📋</span>
            No customer orders placed yet. As buyers purchase your listings, orders will appear here for dispatch.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {fulfilments.map((f: any) => (
              <Card key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-line bg-white">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-leaf-800">{f.fulfilment_number}</span>
                    <Badge className="bg-leaf-100 text-leaf-800 uppercase text-[10px] font-bold">{f.status}</Badge>
                  </div>
                  <h3 className="font-bold text-ink mt-0.5">Order ref: {f.marketplace_orders?.order_number}</h3>
                  <p className="text-xs text-muted">
                    Destination: {f.marketplace_orders?.delivery_address?.address || "Delivery requested"} · Net: {formatNaira(f.subtotal_kobo)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">
                    {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Your Listings */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-ink">Your Active Listings ({listings?.length ?? 0})</h2>

        {!listings || listings.length === 0 ? (
          <Card className="p-6 text-center text-muted">
            You have no listings published. Click &ldquo;Create New Listing&rdquo; above to start selling.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l: any) => (
              <Card key={l.id} className="p-4 flex flex-col justify-between gap-3 border border-line bg-white">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-earth-100 text-ink text-[10px] uppercase font-bold">{l.listing_type}</Badge>
                    <Badge className={l.status === 'active' ? 'bg-leaf-100 text-leaf-800' : 'bg-red-50 text-danger'}>
                      {l.status}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-ink mt-2 text-sm">{l.title}</h3>
                  <div className="text-xs text-muted mt-1">Available: {l.available_quantity} {l.unit}</div>
                </div>
                <div className="pt-2 border-t border-line flex items-center justify-between text-sm font-bold text-leaf-800">
                  <span>{formatNaira(l.base_price_kobo)}/{l.unit}</span>
                  <Link href={`/${lang}/marketplace/${l.id}`} className="text-xs underline text-muted hover:text-ink">
                    View
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
