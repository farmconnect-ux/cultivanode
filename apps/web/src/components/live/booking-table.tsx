import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Icon } from "@/components/ds/icon";
import { EmptyState } from "@/components/ds/empty-state";
import { Badge, type BadgeProps } from "@/components/shadcn/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BookingStatus, BookingSummary } from "@/lib/account/bookings";
import { formatDay } from "@/lib/text";

export const STATUS_TONE: Record<BookingStatus, NonNullable<BadgeProps["tone"]>> = {
  requested: "caution",
  accepted: "atmos",
  in_progress: "mint",
  awaiting_confirmation: "caution",
  confirmed: "positive",
  disputed: "critical",
  completed: "positive",
  declined: "neutral",
  cancelled: "neutral",
  expired: "neutral",
};

export const ACTIVE: BookingStatus[] = ["requested", "accepted", "in_progress", "awaiting_confirmation", "disputed"];

/** Bookings as an operations table (design: "Scheduled Farm Operations"). */
export function BookingTable({
  lang,
  t,
  bookings,
  title = "Scheduled farm operations",
  description,
  emptyAction,
  limit = 8,
}: {
  lang: Locale;
  t: Dictionary;
  bookings: BookingSummary[];
  title?: string;
  description?: string;
  emptyAction?: React.ReactNode;
  limit?: number;
}) {
  const rows = bookings.slice(0, limit);
  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="mb-space-md flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
          <p className="text-body-sm text-on-surface-variant">
            {description ?? "Machinery and service jobs booked through CultivaNode, soonest first."}
          </p>
        </div>
        <Link
          href={`/${lang}/account/bookings`}
          className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-3 py-1.5 font-label-md text-label-md text-primary-container transition-colors hover:bg-surface-container-high"
        >
          All bookings <Icon name="arrow_forward" className="text-base" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon="event_available"
          title="No operations booked yet"
          description="Book a tractor, sprayer or field crew and it will be tracked here from request to proof of work."
          action={emptyAction}
        />
      ) : (
        <div className="-mx-space-lg">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Operation</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => {
                const type =
                  b.kind === "equipment"
                    ? t.equipmentTypes[b.equipment_type as keyof typeof t.equipmentTypes]
                    : t.providerTypes[b.provider_type as keyof typeof t.providerTypes];
                return (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6">
                      <p className="font-semibold text-on-surface">{b.title}</p>
                      <p className="text-label-sm font-normal text-on-surface-variant">
                        {type ?? "Service"} · {b.other_name || "Provider"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{b.farm_name}</p>
                      <p className="text-label-sm font-normal text-on-surface-variant">
                        {[b.job_lga, b.job_state].filter(Boolean).join(", ")}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDay(b.job_date, lang)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">{formatNaira(b.total_kobo)}</TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[b.status]} dot>
                        {t.bookingStatus[b.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Link
                        href={`/${lang}/account/bookings/${b.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary-container px-3 py-1.5 font-label-sm text-label-sm text-white transition-colors hover:bg-primary"
                      >
                        Open <Icon name="chevron_right" className="text-sm" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
