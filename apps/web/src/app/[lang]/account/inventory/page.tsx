import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { InventoryHub } from "@/components/screens/inventory-hub";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  createInventoryItem,
  createInventoryLocation,
  recordStockMovement,
} from "@/actions/inventory";

export const metadata: Metadata = { title: "Inventory & supplies" };

export default async function Page({ params }: PageProps<"/[lang]/account/inventory">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, state, lga")
    .or(scope.join(","))
    .order("created_at");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: locations } = farmIds.length
    ? await supabase
        .from("farm_inventory_locations")
        .select("id, farm_id, name, location_type, created_at")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const locationList = locations ?? [];
  const locationMap = new Map(locationList.map((l) => [l.id, l]));

  const { data: items } = farmIds.length
    ? await supabase
        .from("farm_inventory")
        .select("id, farm_id, location_id, item_category, item_name, sku, unit, current_quantity, reserved_quantity, reorder_level, average_cost_minor, lot_number, expiry_date, created_at, updated_at")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const itemList = items ?? [];
  const hasLiveItems = itemList.length > 0;

  // KPI calculations
  const totalValuationMinor = itemList.reduce((sum, item) => sum + (item.average_cost_minor * item.current_quantity), 0);
  const totalValuationNaira = Math.round(totalValuationMinor / 100);
  const lowStockItems = itemList.filter((item) => item.current_quantity <= (item.reorder_level || 0));
  const distinctCategories = new Set(itemList.map((i) => i.item_category)).size;

  const now = new Date();
  const expiringSoonCount = itemList.filter((item) => {
    if (!item.expiry_date) return false;
    const expiry = new Date(item.expiry_date);
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 45;
  }).length;

  const modalReceiveStock = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="add_shopping_cart" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Register SKU / Stock In</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Add new item with storehouse allocation &amp; unit valuation</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={createInventoryItem} className="p-space-lg space-y-space-md max-h-[720px] overflow-y-auto text-left">
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">
              Farm Enterprise <span className="text-error">*</span>
            </label>
            <select
              name="farm_id"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            >
              {farmList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Store Location</label>
            <select
              name="location_id"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            >
              {locationList.length === 0 ? (
                <option value="">Main Storage (Auto-created)</option>
              ) : (
                locationList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.location_type})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">
            SKU / Item Name <span className="text-error">*</span>
          </label>
          <input
            name="item_name"
            required
            placeholder="e.g. Urea 46% N (Granular Indorama)"
            type="text"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Item Category</label>
            <select
              name="item_category"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            >
              <option value="fertilizer">Fertilizer &amp; Nutrition</option>
              <option value="chemical">Crop Protection / Agrochemical</option>
              <option value="seed">Seeds &amp; Seedlings</option>
              <option value="feed">Animal Feed &amp; Nutrition</option>
              <option value="produce">Harvested Produce</option>
              <option value="tool">Equipment &amp; Tools</option>
              <option value="spare_part">Spare Parts &amp; Fuel</option>
              <option value="packaging">Packaging Materials</option>
              <option value="other">Other Supplies</option>
            </select>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Unit of Measure</label>
            <select
              name="unit"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            >
              <option value="bags">Bags (50kg)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="litres">Litres (L)</option>
              <option value="tonnes">Tonnes (MT)</option>
              <option value="units">Units / Pieces</option>
              <option value="vials">Vials / Doses</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Initial Quantity</label>
            <input
              name="current_quantity"
              defaultValue="50"
              step="0.1"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Reorder Buffer / Min</label>
            <input
              name="reorder_level"
              defaultValue="10"
              step="0.1"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Batch / Lot Number</label>
            <input
              name="lot_number"
              placeholder="e.g. IND-2026-99"
              type="text"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Unit Cost (Minor/Kobo)</label>
            <input
              name="average_cost_minor"
              placeholder="e.g. 2800000 (= ₦28,000)"
              defaultValue="2800000"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Expiry Date</label>
          <input
            name="expiry_date"
            type="date"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          />
        </div>

        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="submit">
            Confirm Stock Reception
          </button>
        </div>
      </form>
    </div>
  );

  const modalIssueStock = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="output" className="text-secondary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Record Stock Movement</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Issue to operations, log depletion, or record restock</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={recordStockMovement} className="p-space-lg space-y-space-md max-h-[720px] overflow-y-auto text-left">
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">
            Target Inventory Item <span className="text-error">*</span>
          </label>
          <select
            name="inventory_item_id"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          >
            {itemList.length === 0 ? (
              <option value="">No items registered yet</option>
            ) : (
              itemList.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.item_name} ({i.current_quantity} {i.unit} available)
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Movement Action</label>
            <select
              name="movement_type"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            >
              <option value="issue">Issue Stock (Field / Livestock)</option>
              <option value="receipt">Stock In / Restock</option>
              <option value="waste">Quarantine / Spoilage</option>
              <option value="return">Return to Supplier</option>
            </select>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">
              Quantity <span className="text-error">*</span>
            </label>
            <input
              name="quantity"
              required
              step="0.1"
              placeholder="e.g. 5"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Lot / Batch Reference</label>
            <input
              name="lot_number"
              placeholder="e.g. BATCH-01"
              type="text"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Unit Cost (Minor/Kobo, Optional)</label>
            <input
              name="unit_cost_minor"
              placeholder="e.g. 2800000"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Operation / Notes</label>
          <input
            name="notes"
            placeholder="e.g. Issued to Plot B Maize Top-Dressing"
            type="text"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          />
        </div>

        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <button className="px-space-md py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold" type="submit">
            Authorize &amp; Update Stock
          </button>
        </div>
      </form>
    </div>
  );

  const modalAddLocation = (
    <div className="bg-surface-container-lowest max-w-md w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="warehouse" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">New Storage Location</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Register silo, warehouse, cold room or shed</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={createInventoryLocation} className="p-space-lg space-y-space-md text-left">
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">
            Farm Enterprise <span className="text-error">*</span>
          </label>
          <select
            name="farm_id"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          >
            {farmList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">
            Location Name <span className="text-error">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="e.g. Hub Central Silo (Iseyin)"
            type="text"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          />
        </div>

        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Storage Type</label>
          <select
            name="location_type"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          >
            <option value="warehouse">Warehouse &amp; Depot</option>
            <option value="silo">Silo / Grain Storage</option>
            <option value="cold_room">Cold-Chain Bio-Cabinet</option>
            <option value="farm_store">Farm Storehouse</option>
            <option value="field_shed">Field Shed / Staging Unit</option>
            <option value="processing_unit">Processing &amp; Packaging Unit</option>
            <option value="other">Other Facility</option>
          </select>
        </div>

        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="submit">
            Create Location
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      {!hasLiveItems && (
        <LiveStrip tone="preview">
          Viewing sample storehouse inventory. Register your first item or storage location below to link live stock ledgering.
        </LiveStrip>
      )}

      <InventoryHub
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-xs">
              <ScreenDialog title="Register SKU / Stock In" side="center" panel={modalReceiveStock}>
                <button
                  className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all"
                  type="button"
                >
                  <Icon name="add_shopping_cart" className="text-lg" />
                  <span>Receive Goods / Stock In</span>
                </button>
              </ScreenDialog>

              <ScreenDialog title="Record Stock Movement" side="center" panel={modalIssueStock}>
                <button
                  className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors"
                  type="button"
                >
                  <Icon name="output" className="text-lg" />
                  <span>Issue Stock to Operation</span>
                </button>
              </ScreenDialog>

              <ScreenDialog title="New Storage Location" side="center" panel={modalAddLocation}>
                <button
                  className="flex items-center gap-space-xs px-space-sm py-2.5 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm"
                  type="button"
                >
                  <Icon name="warehouse" className="text-lg" />
                  <span>Add Storehouse</span>
                </button>
              </ScreenDialog>
            </div>
          ),
          kpis: hasLiveItems ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase">
                      Total Inventory Valuation
                    </span>
                    <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-background font-bold">
                      ₦{totalValuationNaira.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-space-xs rounded-lg bg-primary/10 text-primary">
                    <Icon name="account_balance_wallet" className="text-2xl" />
                  </div>
                </div>
                <div className="mt-space-md pt-space-sm border-t border-surface-container-high/60 flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">{distinctCategories} Categories · {itemList.length} SKUs</span>
                  <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-0.5">
                    <Icon name="verified" className="text-xs" /> Live Ledger
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-error font-semibold tracking-wider uppercase flex items-center gap-1">
                      {lowStockItems.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />}
                      Stock Out Alert
                    </span>
                    <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-error font-bold">
                      {lowStockItems.length} {lowStockItems.length === 1 ? "Item" : "Items"} Critical
                    </div>
                  </div>
                  <div className="p-space-xs rounded-lg bg-error-container text-on-error-container">
                    <Icon name="warning" className="text-2xl" />
                  </div>
                </div>
                <div className="mt-space-md pt-space-sm border-t border-surface-container-high/60">
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {lowStockItems.length > 0 ? (
                      <>Replenish needed: <span className="font-semibold text-on-surface">{lowStockItems.map((i) => i.item_name).slice(0, 2).join(", ")}</span></>
                    ) : (
                      <span className="text-secondary font-medium">All stock above safety buffer</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase">
                      Managed Storehouses
                    </span>
                    <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">
                      {locationList.length} Facilities
                    </div>
                  </div>
                  <div className="p-space-xs rounded-lg bg-secondary-container text-on-secondary-container">
                    <Icon name="warehouse" className="text-2xl" />
                  </div>
                </div>
                <div className="mt-space-md pt-space-sm border-t border-surface-container-high/60 flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant truncate">Across {farmList.length} Farm Enterprise(s)</span>
                  <span className="text-secondary font-semibold font-label-sm text-label-sm">Active</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase">
                      Expiry &amp; Quarantine
                    </span>
                    <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-secondary font-bold">
                      {expiringSoonCount > 0 ? `${expiringSoonCount} Expiring Soon` : "100% Batches Safe"}
                    </div>
                  </div>
                  <div className="p-space-xs rounded-lg bg-surface-container-high text-on-surface">
                    <Icon name="verified" className="text-2xl" />
                  </div>
                </div>
                <div className="mt-space-md pt-space-sm border-t border-surface-container-high/60">
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    NAFDAC / Agrochemical Shelf-Life Monitored
                  </p>
                </div>
              </div>
            </div>
          ) : undefined,

          locations: (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mr-1">
                  Locations:
                </span>
                <span className="px-space-md py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm whitespace-nowrap">
                  All Locations ({itemList.length} SKUs)
                </span>
                {locationList.map((loc) => (
                  <span
                    key={loc.id}
                    className="px-space-md py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md shadow-sm whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Icon name="warehouse" className="text-xs text-secondary" />
                    <span>{loc.name}</span>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm w-fit">
                <Icon name="cloud_done" className="text-secondary text-base" />
                <span>{itemList.length} SKU(s) Live Synced</span>
              </div>
            </div>
          ),

          items: hasLiveItems ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-surface-container-high/60">
                <div className="flex items-center gap-space-sm">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Managed SKU Master Ledger</h2>
                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-semibold">
                    FIFO Tracked · {itemList.length} Registered
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-3 px-space-md font-semibold">SKU Name &amp; Spec</th>
                      <th className="py-3 px-space-md font-semibold">Store Location</th>
                      <th className="py-3 px-space-md font-semibold">Batch / Lot #</th>
                      <th className="py-3 px-space-md font-semibold">Current Stock vs Buffer</th>
                      <th className="py-3 px-space-md font-semibold">Unit Cost</th>
                      <th className="py-3 px-space-md font-semibold">Total Value</th>
                      <th className="py-3 px-space-md font-semibold">Expiry Date</th>
                      <th className="py-3 px-space-md font-semibold text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/40 font-body-sm text-body-sm">
                    {itemList.map((item) => {
                      const isLowStock = item.current_quantity <= (item.reorder_level || 0);
                      const loc = locationMap.get(item.location_id);
                      const unitCostNaira = Math.round(item.average_cost_minor / 100);
                      const totalValNaira = Math.round((item.average_cost_minor * item.current_quantity) / 100);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-surface-container-low/40 transition-colors ${
                            isLowStock ? "bg-error-container/10" : ""
                          }`}
                        >
                          <td className="py-3.5 px-space-md">
                            <div className="font-label-md text-label-md font-bold text-on-surface">{item.item_name}</div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant capitalize">
                              {item.item_category} · {item.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-space-md text-on-surface">
                            {loc ? loc.name : "Main Storage"}
                          </td>
                          <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">
                            {item.lot_number ? `#${item.lot_number}` : "—"}
                          </td>
                          <td className="py-3.5 px-space-md">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${isLowStock ? "text-error" : "text-primary"}`}>
                                {item.current_quantity} {item.unit}
                              </span>
                              <span className="text-on-surface-variant font-label-sm text-label-sm">
                                / Min: {item.reorder_level || 0}
                              </span>
                            </div>
                            <div className="w-28 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isLowStock ? "bg-error" : "bg-primary"}`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    item.reorder_level && item.reorder_level > 0
                                      ? (item.current_quantity / (item.reorder_level * 2)) * 100
                                      : 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-space-md text-on-surface font-semibold">
                            ₦{unitCostNaira.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-space-md font-bold text-on-background">
                            ₦{totalValNaira.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-space-md text-on-surface-variant">
                            {item.expiry_date ? formatDate(item.expiry_date, lang) : "N/A"}
                          </td>
                          <td className="py-3.5 px-space-md text-right">
                            <ScreenDialog title="Record Stock Movement" side="center" panel={modalIssueStock}>
                              <button
                                className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-sm text-label-sm font-semibold transition-colors"
                                type="button"
                              >
                                Movement
                              </button>
                            </ScreenDialog>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : undefined,
        }}
      />
    </>
  );
}
