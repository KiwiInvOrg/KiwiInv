"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KanbanJob } from "@/types/api";

interface JobCardProps {
  job: KanbanJob;
  onClick?: (job: KanbanJob) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id, data: { job } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      onClick={() => onClick?.(job)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-zinc-500">
            {job.job_number}
          </span>
          {job.total_price && (
            <Badge variant="secondary" className="text-xs">
              ${job.total_price}
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium leading-tight">{job.customer_name}</p>
        {job.notes && (
          <p className="text-xs text-zinc-500 line-clamp-2">{job.notes}</p>
        )}
        {job.expected_completion && (
          <p className="text-xs text-zinc-400">
            Due: {new Date(job.expected_completion).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
