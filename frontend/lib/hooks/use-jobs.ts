"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobs } from "@/lib/api-client";
import type { CreateJobRequest, UpdateJobRequest } from "@/types/api";
import { toast } from "sonner";

// useJobs fetches all jobs, optionally filtered by status.
export function useJobs(status?: string) {
  return useQuery({
    queryKey: ["jobs", status],
    queryFn: () => jobs.list(status),
  });
}

// useJob fetches a single job with its structures.
export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => jobs.get(id),
    enabled: !!id,
  });
}

// useCreateJob creates a new job and invalidates the kanban cache.
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobRequest) => jobs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job created");
    },
    onError: () => {
      toast.error("Failed to create job");
    },
  });
}

// useUpdateJob updates job fields and refreshes caches.
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobRequest }) =>
      jobs.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      toast.success("Job updated");
    },
    onError: () => {
      toast.error("Failed to update job");
    },
  });
}

// useDeleteJob deletes a job and refreshes caches.
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job deleted");
    },
    onError: () => {
      toast.error("Failed to delete job");
    },
  });
}
