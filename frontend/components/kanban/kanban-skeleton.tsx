export function KanbanSkeleton() {
  return (
    <div className="grid h-full grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((col) => (
        <div
          key={col}
          className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
        >
          {/* Column Header Skeleton */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="ml-auto h-5 w-8 animate-pulse rounded-full bg-muted" />
          </div>

          {/* Cards Skeleton */}
          <div className="flex-1 space-y-2 bg-muted/30 p-3">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="space-y-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="space-y-1.5 pt-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
