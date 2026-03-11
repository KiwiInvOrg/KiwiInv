"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kanban, jobs } from "@/lib/api-client";
import type { KanbanBoard, JobStatus } from "@/types/api";
import { toast } from "sonner";

// useKanbanBoard fetches the kanban board data (jobs grouped by status).
export function useKanbanBoard() {
  return useQuery({
    queryKey: ["kanban"],
    queryFn: kanban.get,
  });
}

// useUpdateJobStatus provides an optimistic mutation for drag-drop status changes.
// On drag: immediately moves the card in the UI. On error: reverts and shows a toast.
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      jobs.updateStatus(id, status),

    // Optimistic update: move the card before the server responds
    onMutate: async ({ id, status: newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["kanban"] });

      const previous = queryClient.getQueryData<KanbanBoard>(["kanban"]);

      if (previous) {
        const allJobs = [
          ...previous.quote,
          ...previous.in_progress,
          ...previous.completed,
          ...previous.delivered,
        ];

        const job = allJobs.find((j) => j.id === id);
        if (!job) return { previous };

        const updated: KanbanBoard = {
          quote: previous.quote.filter((j) => j.id !== id),
          in_progress: previous.in_progress.filter((j) => j.id !== id),
          completed: previous.completed.filter((j) => j.id !== id),
          delivered: previous.delivered.filter((j) => j.id !== id),
        };

        const movedJob = { ...job, status: newStatus };
        updated[newStatus].push(movedJob);

        queryClient.setQueryData(["kanban"], updated);
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["kanban"], context.previous);
      }
      toast.error("Failed to update job status");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
    },
  });
}
