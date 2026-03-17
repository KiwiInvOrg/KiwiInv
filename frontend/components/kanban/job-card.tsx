"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, GripVertical } from "lucide-react";
import { format } from "date-fns";
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
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group cursor-pointer transition-all hover:shadow-lg ${
        isDragging ? "rotate-2 opacity-50" : ""
      }`}
      onClick={() => onClick?.(job)}
    >
      <CardContent className="p-3">
        {/* Drag Handle + Job Number */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs font-medium text-muted-foreground">
            {job.job_number}
          </span>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Title (from notes or "Untitled") */}
        <h4 className="mb-2 line-clamp-2 font-semibold text-foreground">
          {job.notes || "Untitled Job"}
        </h4>

        {/* Customer */}
        <p className="mb-3 text-sm text-muted-foreground">{job.customer_name}</p>

        {/* Metadata */}
        <div className="space-y-1.5">
          {job.expected_completion && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Due {format(new Date(job.expected_completion), "d/MM/yyyy")}
              </span>
            </div>
          )}
          {job.total_price && (
            <div className="flex items-center gap-2 text-sm font-medium text-brand-green">
              <DollarSign className="h-4 w-4" />
              <span>${parseFloat(job.total_price).toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
