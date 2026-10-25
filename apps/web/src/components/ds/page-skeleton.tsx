// A quiet placeholder shown while a page's data loads (route loading.tsx files), announced to screen readers.
export function PageSkeleton({ cards = 3, grid = false }: { cards?: number; grid?: boolean }) {
  return (
    <div role="status" aria-busy="true" className="flex w-full flex-col gap-4">
      <span className="sr-only">Loading… / Ó ń ṣí…</span>
      <div className="h-9 w-56 animate-pulse rounded-md bg-surface-container-high" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-surface-container" />
      <div className={grid ? "grid grid-cols-1 gap-6 md:grid-cols-2" : "flex flex-col gap-4"}>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className={`${grid ? "h-72" : "h-28"} animate-pulse rounded-xl bg-surface-container-low`} />
        ))}
      </div>
    </div>
  );
}
