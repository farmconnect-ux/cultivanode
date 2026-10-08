import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { createInventoryItem, createInventoryLocation, recordStockMovement } from "@/actions/inventory";

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string }>;
}

export default async function InventoryPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang as Locale);
  const supabase = await createClient();

  // Fetch farmer's farms
  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name")
    .or(scope.join(","))
    .order("name");

  const farmIds = (farms || []).map((f) => f.id);

  // Fetch inventory locations
  const { data: locations } = await supabase
    .from("farm_inventory_locations")
    .select("*, farms(name)")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("name");

  // Fetch inventory items
  let itemQuery = supabase
    .from("farm_inventory")
    .select("*, farm_inventory_locations(name), farms(name)")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("item_name");

  if (sp.category) {
    itemQuery = itemQuery.eq("item_category", sp.category);
  }

  const { data: items } = await itemQuery;

  // Calculate stock valuations and low stock alerts
  const totalValuationMinor = (items || []).reduce(
    (acc, it) => acc + (Number(it.current_quantity) || 0) * (Number(it.average_cost_minor) || 0),
    0
  );
  const lowStockCount = (items || []).filter(
    (it) => it.reorder_level && Number(it.current_quantity) <= Number(it.reorder_level)
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-leaf-900 sm:text-3xl">Multi-Location Farm Inventory</h1>
          <p className="text-xs text-muted mt-1">
            Real-time stock controls, zero-negative-stock validation, lot & expiry tracking across warehouses.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Stock SKUs</p>
          <p className="text-xl font-black text-leaf-900 mt-1">{items?.length || 0} Items</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600">
          <p className="text-xs font-medium text-muted">Storage Locations</p>
          <p className="text-xl font-black text-sky-900 mt-1">{locations?.length || 0} Stores</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-harvest-600">
          <p className="text-xs font-medium text-muted">Total Stock Valuation</p>
          <p className="text-lg font-black text-harvest-900 mt-1">
            ₦{(totalValuationMinor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-600">
          <p className="text-xs font-medium text-muted">Low Stock Alerts</p>
          <p className="text-xl font-black text-amber-900 mt-1">{lowStockCount}</p>
        </Card>
      </div>

      {/* Main Grid: Stock List & Movement Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Inventory On-Hand</h2>
            <div className="flex items-center gap-1">
              <Link
                href={`/${lang}/account/inventory`}
                className={`rounded px-2.5 py-1 text-xs font-bold ${
                  !sp.category ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                }`}
              >
                All
              </Link>
              <Link
                href={`/${lang}/account/inventory?category=fertilizer`}
                className={`rounded px-2.5 py-1 text-xs font-bold ${
                  sp.category === "fertilizer" ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                }`}
              >
                Fertilizer
              </Link>
              <Link
                href={`/${lang}/account/inventory?category=seed`}
                className={`rounded px-2.5 py-1 text-xs font-bold ${
                  sp.category === "seed" ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                }`}
              >
                Seeds
              </Link>
              <Link
                href={`/${lang}/account/inventory?category=chemical`}
                className={`rounded px-2.5 py-1 text-xs font-bold ${
                  sp.category === "chemical" ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                }`}
              >
                Chemicals
              </Link>
            </div>
          </div>

          {(!items || items.length === 0) ? (
            <Card className="p-8 text-center border-dashed">
              <span className="text-3xl">📦</span>
              <p className="mt-2 text-sm font-bold text-ink">No inventory items recorded</p>
              <p className="text-xs text-muted mt-1">
                Add your warehouses and catalog seeds, fertilizers, or farm chemicals to enforce stock invariants.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((it) => {
                const isLow = it.reorder_level && Number(it.current_quantity) <= Number(it.reorder_level);
                return (
                  <Card key={it.id} className="p-4 border border-line flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-ink">{it.item_name}</span>
                        <Badge tone={isLow ? "warning" : "leaf"}>
                          {isLow ? "Low Stock" : "In Stock"}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-leaf-800 capitalize">
                        {it.item_category} &bull; Store: {it.farm_inventory_locations?.name || "Main Store"}
                      </p>
                      <div className="text-sm font-black text-ink mt-1">
                        {Number(it.current_quantity).toLocaleString()} {it.unit}
                      </div>
                      <div className="text-[11px] text-muted space-y-0.5">
                        <p>Cost: ₦{((it.average_cost_minor || 0) / 100).toLocaleString()} per {it.unit}</p>
                        {it.lot_number && <p>Lot: {it.lot_number}</p>}
                        {it.expiry_date && <p>Expiry: {it.expiry_date}</p>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Forms */}
        <div className="space-y-6">
          {/* Record Movement Form (Zero Negative Stock Protected) */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Record Stock Movement</h3>
            <p className="text-[11px] text-muted">
              Transactional movement with row-level locks and zero-negative-stock validation.
            </p>
            <form action={recordStockMovement} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Select Item *</label>
                <select
                  name="inventory_item_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Item...</option>
                  {(items || []).map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.item_name} (Avail: {it.current_quantity} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Action Type *</label>
                  <select
                    name="movement_type"
                    required
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="usage_out">Usage Out (Field)</option>
                    <option value="purchase_in">Purchase In</option>
                    <option value="harvest_in">Harvest Inflow</option>
                    <option value="transfer_out">Transfer Out</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="quantity"
                    required
                    placeholder="e.g. 10"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Notes / Reason</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g. Applied to maize Block A"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <Button type="submit" className="w-full bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs py-2">
                ⚡ Process Stock Movement
              </Button>
            </form>
          </Card>

          {/* Add Item Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Register New Inventory Item</h3>
            <form action={createInventoryItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Farm *</label>
                <select
                  name="farm_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Farm...</option>
                  {(farms || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Storage Location *</label>
                <select
                  name="location_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Store...</option>
                  {(locations || []).map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.location_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Category *</label>
                  <select
                    name="item_category"
                    required
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="fertilizer">Fertilizer</option>
                    <option value="seed">Seed</option>
                    <option value="chemical">Chemical / Pesticide</option>
                    <option value="feed">Feed</option>
                    <option value="fuel">Diesel / Fuel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    name="unit"
                    required
                    placeholder="e.g. 50kg bag, L, kg"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  name="item_name"
                  required
                  placeholder="e.g. NPK 15:15:15"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    name="initial_quantity"
                    placeholder="0"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Cost (Minor NGN)</label>
                  <input
                    type="number"
                    name="unit_cost_minor"
                    placeholder="e.g. 3500000"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-harvest-700 hover:bg-harvest-800 text-white font-bold text-xs py-2">
                📦 Save Item
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
