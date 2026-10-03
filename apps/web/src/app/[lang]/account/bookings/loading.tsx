// Shown while a bookings page (list, request form or job page) loads: a quiet skeleton, announced to screen readers.
export default function BookingsLoading() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Loading… / Ó ń ṣí…</span>
      <div className="h-9 w-56 animate-pulse rounded-md bg-line/60" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg border border-line bg-white" />
      ))}
    </div>
  );
}
