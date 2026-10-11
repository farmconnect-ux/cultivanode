import * as React from "react";
import { cn } from "@/lib/utils";

/** DESIGN.md → Data tables: sticky #F1F5F9 header, 11px uppercase labels, zebra rows, tabular numerals. */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn("w-full caption-bottom text-body-sm tnum", className)} {...props} />
    </div>
  );
}
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("sticky top-0 z-[1] bg-[#f1f5f9]", className)} {...props} />;
}
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:nth-child(even)]:bg-[#f8fafc]", className)} {...props} />;
}
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b border-[#f1f5f9] transition-colors last:border-0 hover:bg-surface-container-low/70", className)}
      {...props}
    />
  );
}
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn("h-10 whitespace-nowrap px-4 text-left align-middle font-label-sm text-label-sm uppercase text-[#64748b]", className)}
      {...props}
    />
  );
}
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td data-slot="table-cell" className={cn("px-4 py-3 align-middle text-on-surface", className)} {...props} />;
}
function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption className={cn("mt-3 text-body-sm text-on-surface-variant", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
