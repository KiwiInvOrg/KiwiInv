// Centralized API client for communicating with the Go backend.

import type { ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ApiError is thrown when the backend returns a non-OK response.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// fetchApi makes a request to the backend and returns the unwrapped data.
// Automatically sets Content-Type and handles error responses.
async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body.error ?? "Request failed");
  }

  const json: ApiResponse<T> = await res.json();
  return json.data;
}

// -- Customers --

import type {
  Customer,
  CreateCustomerRequest,
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  KanbanBoard,
  JobDetail,
  JobStructure,
  CreateJobStructureRequest,
  StructureTemplate,
  CreateTemplateRequest,
} from "@/types/api";

export const customers = {
  list: () => fetchApi<Customer[]>("/api/customers"),

  get: (id: string) => fetchApi<Customer>(`/api/customers/${id}`),

  create: (data: CreateCustomerRequest) =>
    fetchApi<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CreateCustomerRequest) =>
    fetchApi<Customer>(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/api/customers/${id}`, {
      method: "DELETE",
    }),
};

// -- Jobs --

export const jobs = {
  list: (status?: string) =>
    fetchApi<Job[]>(`/api/jobs${status ? `?status=${status}` : ""}`),

  get: (id: string) => fetchApi<JobDetail>(`/api/jobs/${id}`),

  create: (data: CreateJobRequest) =>
    fetchApi<Job>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateJobRequest) =>
    fetchApi<Job>(`/api/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    fetchApi<Job>(`/api/jobs/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/api/jobs/${id}`, {
      method: "DELETE",
    }),
};

// -- Kanban --

export const kanban = {
  get: () => fetchApi<KanbanBoard>("/api/kanban"),
};

// -- Job Structures --

export const jobStructures = {
  list: (jobId: string) =>
    fetchApi<JobStructure[]>(`/api/jobs/${jobId}/structures`),

  create: (jobId: string, data: CreateJobStructureRequest) =>
    fetchApi<JobStructure>(`/api/jobs/${jobId}/structures`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi<JobStructure>(`/api/structures/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/api/structures/${id}`, {
      method: "DELETE",
    }),
};

// -- Templates --

export const templates = {
  list: () => fetchApi<StructureTemplate[]>("/api/templates"),

  get: (id: string) => fetchApi<StructureTemplate>(`/api/templates/${id}`),

  create: (data: CreateTemplateRequest) =>
    fetchApi<StructureTemplate>("/api/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CreateTemplateRequest) =>
    fetchApi<StructureTemplate>(`/api/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/api/templates/${id}`, {
      method: "DELETE",
    }),
};
