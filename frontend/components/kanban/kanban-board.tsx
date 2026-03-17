"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useKanbanBoard, useUpdateJobStatus } from "@/lib/hooks/use-kanban";
import { KanbanColumn } from "./kanban-column";
import { KanbanSkeleton } from "./kanban-skeleton";
import { JobCard } from "./job-card";
import { JobDetailSheet } from "@/components/jobs/job-detail-sheet";
import type { KanbanJob, JobStatus } from "@/types/api";

const COLUMNS: JobStatus[] = ["quote", "in_progress", "completed", "delivered"];

export function KanbanBoard() {
  const { data: board, isLoading, error } = useKanbanBoard();
  const updateStatus = useUpdateJobStatus();
  const [activeJob, setActiveJob] = useState<KanbanJob | null>(null);
  const [selectedJob, setSelectedJob] = useState<KanbanJob | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const job = event.active.data.current?.job as KanbanJob | undefined;
      if (job) setActiveJob(job);
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveJob(null);
      const { active, over } = event;
      if (!over) return;

      const jobId = active.id as string;
      const newStatus = over.id as JobStatus;

      // Find which column the job currently belongs to
      if (!board) return;
      const currentStatus = COLUMNS.find((s) =>
        board[s].some((j) => j.id === jobId)
      );

      if (currentStatus && currentStatus !== newStatus) {
        updateStatus.mutate({ id: jobId, status: newStatus });
      }
    },
    [board, updateStatus]
  );

  const handleJobClick = useCallback((job: KanbanJob) => {
    setSelectedJob(job);
  }, []);

  if (isLoading) return <KanbanSkeleton />;

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10">
        <div className="text-center">
          <p className="font-semibold text-destructive">
            Failed to load kanban board
          </p>
          <p className="text-sm text-muted-foreground">
            Is the backend running on port 8080?
          </p>
        </div>
      </div>
    );
  }

  if (!board) return null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid h-full grid-cols-4 gap-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              jobs={board[status]}
              onJobClick={handleJobClick}
            />
          ))}
        </div>
        <DragOverlay>
          {activeJob ? <JobCard job={activeJob} /> : null}
        </DragOverlay>
      </DndContext>
      <JobDetailSheet
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => {
          if (!open) setSelectedJob(null);
        }}
      />
    </>
  );
}
