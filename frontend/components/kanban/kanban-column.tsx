"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { JobCard } from "./job-card";
import { Badge } from "@/components/ui/badge";
import type { KanbanJob, JobStatus } from "@/types/api";

interface KanbanColumnProps {
  status: JobStatus;
  jobs: KanbanJob[];
  onJobClick: (job: KanbanJob) => void;
}

const columnConfig = {
  quote: {
    title: "Quote",
    dotColor: "bg-status-quote",
    bgColor: "bg-[var(--color-status-quote-tint)]",
  },
  in_progress: {
    title: "In Progress",
    dotColor: "bg-status-progress",
    bgColor: "bg-[var(--color-status-progress-tint)]",
  },
  completed: {
    title: "Completed",
    dotColor: "bg-status-completed",
    bgColor: "bg-[var(--color-status-completed-tint)]",
  },
  delivered: {
    title: "Delivered",
    dotColor: "bg-status-delivered",
    bgColor: "bg-[var(--color-status-delivered-tint)]",
  },
};

export function KanbanColumn({ status, jobs, onJobClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const config = columnConfig[status];
  const jobIds = jobs.map((job) => job.id);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Column Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className={`h-2.5 w-2.5 rounded-full ${config.dotColor}`} />
        <h3 className="font-semibold text-foreground">{config.title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {jobs.length}
        </Badge>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-3 ${config.bgColor}`}
      >
        <SortableContext items={jobIds} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={onJobClick} />
          ))}
        </SortableContext>
        {jobs.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border">
            <p className="text-sm text-muted-foreground">No jobs</p>
          </div>
        )}
      </div>
    </div>
  );
}
