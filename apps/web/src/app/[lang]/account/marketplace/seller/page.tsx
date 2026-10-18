import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createListing, fulfilOrder, removeListing, setAvailable, setListingStatus, updateListing, updateShop } from "@/actions/seller";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog, type FieldSpec } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Pill, Section, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num } from "@/lib/format";
import { LISTING_TYPE_LABEL, LISTING_TYPES, NEXT_STEPS, PRICE_MODELS, SELLER_TYPES, UNITS } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "My shop" };

const opt = (vals: readonly string[]) => vals.map((v) => ({ value: v, label: label(v) }));
const OPEN = ["placed", "confirmed", "preparing", "ready_for_pickup", "dispatched", "in_transit"];

type Address = { line?: string; address?: string; state?: string; lga?: string; phone?: string } | null;

export default async function SellerShopPage({ params }: PageProps<"/[lang]/account/marketplace/seller">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("marketplace_sellers")
    .select("id, business_name, seller_type, description, verification_status, rating_avg, rating_count, is_suspended")
    .eq("profile_id", account.userId)
    .maybeSingle();
  const shopId = shop?.id ?? "00000000-0000-0000-0000-000000000000";

  const [{ data: listings }, { data: fulfilments }, { data: items }, { data: settlements }, { data: categories }, { data: farms }] = await Promise.all([
    supabase
      .from("marketplace_listings")
      .select("id, title, description, listing_type, category_id, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, status, location_state, location_lga, images, created_at")
      .eq("seller_id", shopId)
      .order("created_at", { ascending: false }),
    supabase
      .from("marketplace_fulfilments")
      .select("id, order_id, fulfilment_number, status, subtotal_kobo, delivery_fee_kobo, delivery_method, tracking_number, notes, created_at, marketplace_orders ( order_number, payment_status, delivery_address, buyer_notes )")
      .eq("seller_id", shopId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("marketplace_order_items").select("order_id, title, quantity, unit").eq("seller_id", shopId),
    supabase.from("marketplace_settlements").select("net_payout_kobo, status").eq("seller_id", shopId),
    supabase.from("marketplace_categories").select("id, name").order("sort_order"),
    supabase.from("farms").select("id, name").eq("owner_id", account.userId).order("created_at"),
  ]);

  const L = listings ?? [];
  const F = fulfilments ?? [];
  const lines = new Map<string, string[]>();
  for (const it of items ?? []) lines.set(it.order_id, [...(lines.get(it.order_id) ?? []), `${num(it.quantity)} ${it.unit} · ${it.title}`]);
  const open = F.filter((f) => OPEN.includes(f.status));
  const toConfirm = F.filter((f) => f.status === "placed").length;
  const earned = (settlements ?? []).reduce((s, x) => s + Number(x.net_payout_kobo ?? 0), 0);
  const hidden = { lang };
  const catOpts = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));

  const listingFields = (l?: (typeof L)[number]): FieldSpec[] => [
    { name: "listing_type", label: "What are you selling?", type: "select", required: true, defaultValue: l?.listing_type ?? "produce", options: LISTING_TYPES.map((t) => ({ value: t, label: LISTING_TYPE_LABEL[t] })), wide: true },
    { name: "title", label: "Title", required: true, wide: true, defaultValue: l?.title, placeholder: "e.g. Fresh white maize, dried · or · Farm consulting (soil & crop plan)" },
    { name: "category_id", label: "Category", type: "select", required: true, defaultValue: l?.category_id ?? catOpts[0]?.value ?? "", options: catOpts },
    { name: "unit", label: "Sold per", type: "select", required: true, defaultValue: l?.unit ?? "bag", options: opt(UNITS), hint: "Services: hour, day or job" },
    { name: "price", label: "Price (₦ per unit)", type: "number", required: true, min: 0, defaultValue: l ? Number(l.base_price_kobo) / 100 : undefined },
    { name: "price_model", label: "Pricing", type: "select", defaultValue: l?.price_model ?? "fixed", options: opt(PRICE_MODELS) },
    { name: "min_order_quantity", label: "Minimum order", type: "number", min: 0, defaultValue: l ? Number(l.min_order_quantity) : 1 },
    { name: "state", label: "State", defaultValue: l?.location_state ?? account.profile.state ?? "" },
    { name: "lga", label: "LGA / town", defaultValue: l?.location_lga ?? account.profile.lga ?? "" },
    { name: "description", label: "Description", type: "textarea", defaultValue: l?.description ?? "", placeholder: "Quality, grade, what's included, when and where you can deliver or work." },
    {
      name: "photos",
      label: l?.images?.length ? `Add photos (${l.images.length} of 8 used)` : "Photos of your produce or work",
      type: "photos",
      maxFiles: 4,
      hint: "Up to 4 at a time, 8 per listing. Clear, daylight photos sell faster. Large pictures are shrunk before upload.",
    },
    ...(l?.images?.length
      ? [
          {
            name: "photos_mode",
            label: "Current photos",
            type: "select" as const,
            required: true,
            defaultValue: "add",
            options: [
              { value: "add", label: "Keep them, add any new ones" },
              { value: "replace", label: "Replace them with the new ones" },
              { value: "clear", label: "Remove all photos" },
            ],
            wide: true,
          },
        ]
      : []),
  ];

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            {shop ? <Status value={shop.verification_status} /> : <Chip icon="storefront">No shop yet</Chip>}
            {shop && shop.rating_count > 0 && <Chip icon="star">{Number(shop.rating_avg).toFixed(1)} ({shop.rating_count})</Chip>}
            {shop?.is_suspended && <Pill tone="critical" icon="block">Suspended</Pill>}
          </>
        }
        title={shop?.business_name ?? "My shop"}
        description="Sell your produce, inputs and services — consulting, spraying, labour or machinery hire — on the CultivaNode marketplace. Manage your listings and fulfil orders here."
        actions={
          <>
            <ActionDialog
              title="Shop details"
              trigger={shop ? "Shop details" : "Open my shop"}
              icon="store"
              tone="secondary"
              action={updateShop}
              hidden={hidden}
              fields={[
                { name: "business_name", label: "Shop name", required: true, defaultValue: shop?.business_name ?? account.profile.full_name ?? "", wide: true },
                { name: "seller_type", label: "You are a", type: "select", defaultValue: shop?.seller_type ?? "farmer", options: opt(SELLER_TYPES) },
                { name: "description", label: "About your shop", type: "textarea", defaultValue: shop?.description ?? "" },
              ]}
            />
            <ActionDialog
              title="New listing"
              description="Goods: enter how much you have. Services: how many jobs, hours or days you can take on. New shops show as 'pending' until CultivaNode verifies them."
              trigger="New listing"
              icon="add_circle"
              action={createListing}
              hidden={hidden}
              fields={[
                ...listingFields(),
                { name: "quantity", label: "Quantity available", type: "number", required: true, min: 0 },
                ...((farms ?? []).length ? [{ name: "farm_id", label: "From my farm (shows provenance)", type: "select" as const, options: (farms ?? []).map((x) => ({ value: x.id, label: x.name })) }] : []),
                { name: "publish", label: "Publish", type: "select", required: true, defaultValue: "yes", options: [{ value: "yes", label: "Publish now" }, { value: "no", label: "Save as paused" }] },
              ]}
            />
          </>
        }
      />

      {shop?.verification_status === "pending" && (
        <p role="note" className="flex items-start gap-2 rounded-xl bg-caution-soft px-4 py-3 text-body-sm text-[#92400e]">
          <Icon name="pending" className="mt-0.5 text-base" />
          Your shop is pending verification. Your listings are live, but buyers see you as an unverified seller until CultivaNode checks your details. Complete your ID verification to speed this up.
        </p>
      )}

      <KpiGrid>
        <MetricCard label="Orders to confirm" value={toConfirm} icon="notifications_active" iconTone={toConfirm ? "bg-tertiary-fixed/50 text-tertiary-container" : undefined} foot="New orders waiting for you" />
        <MetricCard label="Open orders" value={open.length} icon="local_shipping" foot="Confirmed, preparing or on the way" />
        <MetricCard label="Live listings" value={L.filter((l) => l.status === "active").length} icon="storefront" foot={`${L.length} listings in your shop`} />
        <MetricCard label="Earnings released" value={naira(earned)} icon="payments" foot="After buyers confirm delivery" />
      </KpiGrid>

      <Section
        title="Orders"
        icon="receipt_long"
        description="Confirm new orders, then mark them ready for pickup or dispatched once the buyer has paid. The buyer confirms receipt, which releases your money."
      >
        <DataTable
          rows={F}
          rowKey={(f) => f.id}
          empty="No orders yet. When buyers order from your listings they appear here."
          columns={[
            {
              label: "Order",
              cell: (f) => (
                <div className="min-w-0">
                  <p className="font-medium">{f.marketplace_orders?.order_number ?? f.fulfilment_number}</p>
                  <p className="text-body-sm text-on-surface-variant">{formatDay(f.created_at.slice(0, 10), lang)}</p>
                </div>
              ),
            },
            { label: "Items", cell: (f) => <span className="text-body-sm">{(lines.get(f.order_id) ?? []).join("; ") || "—"}</span> },
            {
              label: "Deliver to",
              cell: (f) => {
                const a = f.marketplace_orders?.delivery_address as Address;
                return (
                  <span className="text-body-sm">
                    {[a?.line ?? a?.address, a?.lga, a?.state].filter(Boolean).join(", ") || "—"}
                    {a?.phone && (
                      <a href={`tel:${a.phone}`} className="ml-1 text-primary hover:underline">
                        {a.phone}
                      </a>
                    )}
                    {f.marketplace_orders?.buyer_notes && <span className="block text-on-surface-variant">“{f.marketplace_orders.buyer_notes}”</span>}
                  </span>
                );
              },
            },
            { label: "Value", cell: (f) => naira(Number(f.subtotal_kobo)) },
            { label: "Payment", cell: (f) => <Status value={f.marketplace_orders?.payment_status ?? "pending"} /> },
            { label: "Status", cell: (f) => <Status value={f.status} /> },
            {
              label: "",
              cell: (f) => (
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {(NEXT_STEPS[f.status] ?? []).map(([to, text]) =>
                    to === "rejected" || to === "dispatched" ? (
                      <ActionDialog
                        key={to}
                        title={to === "rejected" ? "Can't fulfil this order" : "Dispatch order"}
                        description={to === "rejected" ? "The buyer is told why, and the stock goes back on sale. If they already paid, CultivaNode refunds them." : "Add a note or a tracking/vehicle number for the buyer."}
                        trigger={text}
                        icon={to === "rejected" ? "cancel" : "local_shipping"}
                        tone={to === "rejected" ? "ghost" : "secondary"}
                        action={fulfilOrder}
                        hidden={{ lang, fulfilment_id: f.id, status: to }}
                        submit={to === "rejected" ? "Reject order" : "Mark dispatched"}
                        fields={
                          to === "rejected"
                            ? [{ name: "note", label: "Reason", type: "textarea", required: true, placeholder: "e.g. Out of stock until next harvest" }]
                            : [
                                { name: "tracking", label: "Tracking / vehicle number" },
                                { name: "note", label: "Note to buyer", type: "textarea", placeholder: "e.g. Arriving Thursday afternoon" },
                              ]
                        }
                      />
                    ) : (
                      <ActionButton key={to} action={fulfilOrder} hidden={{ lang, fulfilment_id: f.id, status: to }} label={text} icon={to === "confirmed" ? "check" : to === "delivered" ? "task_alt" : "play_arrow"} tone={to === "confirmed" ? "primary" : "ghost"} />
                    ),
                  )}
                  {f.tracking_number && <Chip icon="local_shipping">{f.tracking_number}</Chip>}
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section
        title="Listings"
        icon="storefront"
        description="Edit, pause, change what's available, or remove a listing. Listings with order history are paused instead of deleted."
        action={
          <Link href={`/${lang}/account/marketplace/new-listing`} className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
            List a harvest batch <Icon name="arrow_forward" className="text-base" />
          </Link>
        }
      >
        {!L.length ? (
          <StartHere icon="storefront" title="Start selling">
            Use <strong>New listing</strong> to sell produce or inputs, or to offer a service such as farm consulting, spraying, labour or machinery hire.
          </StartHere>
        ) : (
          <DataTable
            rows={L}
            rowKey={(l) => l.id}
            columns={[
              {
                label: "Listing",
                cell: (l) => (
                  <div className="flex min-w-0 items-center gap-3">
                    {l.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- seller photo from Supabase Storage
                      <img src={l.images[0]} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-outline-variant/60" />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant" title="No photo yet — add one from Edit">
                        <Icon name="add_a_photo" className="text-lg" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <Link href={`/${lang}/marketplace/${l.id}`} className="font-medium text-primary hover:underline">
                        {l.title}
                      </Link>
                      <p className="text-body-sm text-on-surface-variant">
                        {label(l.listing_type)}
                        {l.location_state ? ` · ${l.location_state}` : ""}
                        {l.images?.length ? ` · ${l.images.length} photo${l.images.length > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                  </div>
                ),
              },
              { label: "Price", cell: (l) => (l.price_model === "quotation" ? "On quotation" : `${naira(Number(l.base_price_kobo))} / ${l.unit}`) },
              { label: "Available", cell: (l) => `${num(l.available_quantity)} ${l.unit}` },
              { label: "Status", cell: (l) => <Status value={l.status} /> },
              {
                label: "",
                cell: (l) =>
                  l.status === "suspended" ? (
                    <span className="text-body-sm text-on-surface-variant">Suspended by CultivaNode</span>
                  ) : (
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <ActionDialog title="Edit listing" trigger="Edit" icon="edit" tone="ghost" action={updateListing} hidden={{ lang, listing_id: l.id }} fields={listingFields(l)} />
                      <ActionDialog
                        title="Available now"
                        description="How much can buyers order now? Amounts already reserved by orders aren't affected."
                        trigger="Stock"
                        icon="inventory_2"
                        tone="ghost"
                        action={setAvailable}
                        hidden={{ lang, listing_id: l.id }}
                        fields={[{ name: "available", label: `Available (${l.unit})`, type: "number", required: true, min: 0, defaultValue: Number(l.available_quantity) }]}
                      />
                      {l.status === "active" ? (
                        <ActionButton action={setListingStatus} hidden={{ lang, listing_id: l.id, status: "paused" }} label="Pause" icon="pause_circle" />
                      ) : (
                        <ActionButton action={setListingStatus} hidden={{ lang, listing_id: l.id, status: "active" }} label="Publish" icon="publish" />
                      )}
                      <ActionButton action={removeListing} hidden={{ lang, listing_id: l.id }} label="Delete" icon="delete" confirm={`Delete "${l.title}"? This can't be undone.`} />
                    </div>
                  ),
              },
            ]}
          />
        )}
      </Section>
    </Stack>
  );
}
