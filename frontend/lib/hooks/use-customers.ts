"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customers } from "@/lib/api-client";
import type { CreateCustomerRequest } from "@/types/api";
import { toast } from "sonner";

// useCustomers fetches all customers.
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: customers.list,
  });
}

// useCreateCustomer creates a new customer and refreshes the list.
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
    },
    onError: () => {
      toast.error("Failed to create customer");
    },
  });
}

// useUpdateCustomer updates a customer and refreshes the list.
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCustomerRequest }) =>
      customers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
    },
    onError: () => {
      toast.error("Failed to update customer");
    },
  });
}

// useDeleteCustomer deletes a customer and refreshes the list.
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
    },
    onError: () => {
      toast.error("Failed to delete customer. Make sure they have no active jobs.");
    },
  });
}
