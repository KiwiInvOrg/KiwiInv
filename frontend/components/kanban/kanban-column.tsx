"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "./job-card";
import type { KanbanJob, JobStatus } from "@/types/api";
import { cn } from "@/lib/utils";

const columnConfig: Record<
  JobStatus,
  { label: string; color: string; bg: string }
> = {
  quote: { label: "Quote", color: "text-blue-700", bg: "bg-blue-50" },
  in_progress: {
    label: "In Progress",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  completed: {
    label: "Completed",
    color: "text-green-700",
    bg: "bg-green-50",
  },
  delivered: {
    label: "Delivered",
    color: "text-purple-700",
    bg: "bg-purple-50",
  },
};

interface KanbanColumnProps {
  status: JobStatus;
  jobs: KanbanJob[];
  onJobClick?: (job: KanbanJob) => void;
}

export function KanbanColumn({ status, jobs, onJobClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = columnConfig[status];

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-zinc-50/50 min-h-[calc(100vh-8rem)]",
        isOver && "ring-2 ring-zinc-300"
      )}
    >
      <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-t-lg", config.bg)}>
        <h3 className={cn("text-sm font-semibold", config.color)}>
          {config.label}
        </h3>
        <Badge variant="secondary" className="text-xs h-5 min-w-[20px] justify-center">
          {jobs.length}
        </Badge>
      </div>
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2">
        <SortableContext
          items={jobs.map((j) => j.id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={onJobClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
