import { PageSkeleton } from "@/components/ds/page-skeleton";

export default function MarketplaceLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
      <PageSkeleton cards={4} grid />
    </div>
  );
}
