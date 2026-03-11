// API response types matching the Go backend models.

export type JobStatus = "quote" | "in_progress" | "completed" | "delivered";
export type JobStructureStatus = "pending" | "in_progress" | "completed";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  customer_name: string;
  job_number: string;
  status: JobStatus;
  expected_completion: string | null;
  expected_delivery: string | null;
  total_price: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanJob {
  id: string;
  job_number: string;
  status: JobStatus;
  expected_completion: string | null;
  expected_delivery: string | null;
  total_price: string | null;
  notes: string | null;
  created_at: string;
  customer_name: string;
}

export interface JobStructure {
  id: string;
  job_id: string;
  template_id: string | null;
  template_name: string | null;
  custom_name: string | null;
  quantity: number;
  unit_price: string | null;
  status: JobStructureStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StructureTemplate {
  id: string;
  name: string;
  description: string | null;
  base_price: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoard {
  quote: KanbanJob[];
  in_progress: KanbanJob[];
  completed: KanbanJob[];
  delivered: KanbanJob[];
}

// Request types for create/update operations

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CreateJobRequest {
  customer_id: string;
  status?: JobStatus;
  expected_completion?: string;
  expected_delivery?: string;
  total_price?: string;
  notes?: string;
}

export interface UpdateJobRequest {
  customer_id: string;
  expected_completion?: string;
  expected_delivery?: string;
  total_price?: string;
  notes?: string;
}

export interface CreateJobStructureRequest {
  template_id?: string;
  custom_name?: string;
  quantity: number;
  unit_price?: string;
  notes?: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  base_price?: string;
  category: string;
}

// Wrapper types for API responses
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

// Job detail response from GET /api/jobs/{id}
export interface JobDetail {
  job: Job;
  structures: JobStructure[];
}
