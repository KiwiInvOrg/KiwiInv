"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { templates } from "@/lib/api-client";
import type { CreateTemplateRequest } from "@/types/api";
import { toast } from "sonner";

// useTemplates fetches all structure templates.
export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: templates.list,
  });
}

// useCreateTemplate creates a new template and refreshes the list.
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTemplateRequest) => templates.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template created");
    },
    onError: () => {
      toast.error("Failed to create template");
    },
  });
}
