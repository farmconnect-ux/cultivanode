import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { CooperativeDashboard } from "@/components/screens/cooperative-dashboard";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  registerCooperativeMember,
  createCooperativeBulkOrder,
} from "@/actions/cooperative";

export const metadata: Metadata = { title: "Cooperative management & outgrower unions" };

export default async function Page({ params }: PageProps<"/[lang]/account/cooperative">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const { data: members } = await (supabase.from("farm_cooperative_members") as any)
    .select("*")
    .order("created_at", { ascending: false });

  const { data: orders } = await (supabase.from("farm_cooperative_orders") as any)
    .select("*")
    .order("created_at", { ascending: false });

  const memberList = (members ?? []) as any[];
  const orderList = (orders ?? []) as any[];
  const hasLiveOrders = orderList.length > 0;

  const enrolmentModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="person_add" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Enrol Cooperative Smallholder Member
          </h3>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={registerCooperativeMember} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Cooperative Apex Society <span className="text-error">*</span>
          </label>
          <input
            name="cooperative_name"
            defaultValue="Oke-Ogun Agricultural Producers & Smallholder Farmers Union"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Member Full Name <span className="text-error">*</span>
            </label>
            <input
              name="member_name"
              required
              placeholder="e.g. Babatunde Alabi"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Telephone Number <span className="text-error">*</span>
            </label>
            <input
              name="phone"
              required
              placeholder="0803 123 4567"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">National ID (NIN)</label>
            <input
              name="nin"
              placeholder="11-digit NIN"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Farm Size (Hectares)</label>
            <input
              name="farm_size_hectares"
              type="number"
              step="0.1"
              defaultValue="2.5"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Cooperative Shares Allocated</label>
          <input
            name="shares_count"
            type="number"
            defaultValue="5"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="p-3 rounded-lg bg-secondary-container/20 text-on-secondary-container text-xs flex items-center gap-2">
          <Icon name="verified" className="text-base shrink-0" />
          <span>Registered members gain access to syndicated fertilizer allocations, credit guarantees, and collective off-take contracts under Oyo State Co-op laws.</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </ScreenDialogClose>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Enrol Member
          </button>
        </div>
      </form>
    </div>
  );

  const bulkOrderModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Icon name="shopping_cart" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Create Cooperative Bulk Pooling Order
          </h3>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={createCooperativeBulkOrder} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Order Title / Input Description <span className="text-error">*</span>
          </label>
          <input
            name="title"
            required
            placeholder="e.g. NPK 15-15-15 & Urea Fertilizer Bulk Batch #04"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Target Pooling Quantity <span className="text-error">*</span>
            </label>
            <input
              name="target_quantity"
              required
              placeholder="e.g. 1,000 Bags (50kg)"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Estimated Discount (%)</label>
            <input
              name="estimated_discount_percentage"
              type="number"
              defaultValue="18"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Order Closing Date</label>
          <input
            name="target_closing_date"
            type="date"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </ScreenDialogClose>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm"
          >
            Launch Bulk Order
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <LiveStrip tone={hasLiveOrders ? "live" : "preview"}>
        {hasLiveOrders
          ? `Showing ${orderList.length} active cooperative bulk order${orderList.length === 1 ? "" : "s"} and ${memberList.length} registered union members.`
          : "Cooperative management shows sample union rosters and distribution schedules until you enrol members or initiate collective input pooling."}
      </LiveStrip>

      <CooperativeDashboard
        lang={lang}
        slots={{
          actions: (
            <div className="flex items-center gap-space-xs">
              <ScreenDialog title="New Member Enrolment" side="center" panel={enrolmentModal}>
                <button
                  type="button"
                  className="h-10 px-space-md rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Icon name="person_add" className="text-[18px]" />
                  <span>New Member Enrolment</span>
                </button>
              </ScreenDialog>
              <ScreenDialog title="Create Bulk Order" side="center" panel={bulkOrderModal}>
                <button
                  type="button"
                  className="h-10 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Icon name="shopping_cart" className="text-[18px]" />
                  <span>Pool Bulk Order</span>
                </button>
              </ScreenDialog>
            </div>
          ),
          orders: hasLiveOrders ? (
            <>
              {orderList.map((order) => (
                <tr key={order.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3 px-space-md font-semibold text-on-surface">
                    {order.title}
                  </td>
                  <td className="py-3 px-space-md text-on-surface-variant">
                    {order.target_quantity}
                  </td>
                  <td className="py-3 px-space-md font-medium text-on-surface">
                    {order.participating_members_count} Members Participating
                  </td>
                  <td className="py-3 px-space-md text-secondary font-semibold">
                    {order.estimated_discount_percentage}% Group Discount
                  </td>
                  <td className="py-3 px-space-md text-right">
                    <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold capitalize">
                      <Icon name="check_circle" className="text-[14px]" />
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </>
          ) : undefined,
        }}
      />
    </>
  );
}
