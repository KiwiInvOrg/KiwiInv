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
import { CreateJobDialog } from "./create-job-dialog";
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
    // Only open if not dragging
    setSelectedJob(job);
  }, []);

  if (isLoading) return <KanbanSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">
          Failed to load kanban board. Is the backend running?
        </p>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-semibold">Job Board</h1>
        <CreateJobDialog />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4 px-6 pb-6">
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
        onOpenChange={(open) => { if (!open) setSelectedJob(null); }}
      />
    </div>
  );
}
