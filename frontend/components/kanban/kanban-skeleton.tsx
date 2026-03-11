import { Card, CardContent } from "@/components/ui/card";

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
          <div className="h-5 w-12 bg-zinc-200 rounded animate-pulse" />
        </div>
        <div className="h-4 w-28 bg-zinc-200 rounded animate-pulse" />
        <div className="h-3 w-full bg-zinc-100 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

function SkeletonColumn() {
  return (
    <div className="flex flex-col rounded-lg border bg-zinc-50/50 min-h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
        <div className="h-5 w-5 bg-zinc-200 rounded animate-pulse" />
      </div>
      <div className="flex-1 p-2 space-y-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 p-6">
      <SkeletonColumn />
      <SkeletonColumn />
      <SkeletonColumn />
      <SkeletonColumn />
    </div>
  );
}
