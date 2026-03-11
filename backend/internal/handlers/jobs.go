package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/AdamW222/kiwiinv/internal/db"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// createJobRequest is the expected JSON body for creating a job.
type createJobRequest struct {
	CustomerID         string  `json:"customer_id"`
	Status             string  `json:"status"`
	ExpectedCompletion *string `json:"expected_completion"` // ISO date: "2026-04-15"
	ExpectedDelivery   *string `json:"expected_delivery"`
	TotalPrice         *string `json:"total_price"`
	Notes              *string `json:"notes"`
}

// updateJobRequest is the expected JSON body for updating a job.
type updateJobRequest struct {
	CustomerID         string  `json:"customer_id"`
	ExpectedCompletion *string `json:"expected_completion"`
	ExpectedDelivery   *string `json:"expected_delivery"`
	TotalPrice         *string `json:"total_price"`
	Notes              *string `json:"notes"`
}

// updateJobStatusRequest is the expected JSON body for the kanban drag-drop status change.
type updateJobStatusRequest struct {
	Status string `json:"status"`
}

// ListJobs returns all jobs with customer names.
// GET /api/jobs
// Supports optional ?status= query parameter to filter by status.
func (h *Handler) ListJobs(w http.ResponseWriter, r *http.Request) {
	statusFilter := r.URL.Query().Get("status")

	if statusFilter != "" {
		if !isValidJobStatus(statusFilter) {
			respondError(w, http.StatusBadRequest, "invalid status value")
			return
		}
		jobs, err := h.Queries.ListJobsByStatus(r.Context(), db.JobStatus(statusFilter))
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list jobs")
			return
		}
		respondJSON(w, http.StatusOK, toJobResponsesFromStatusList(jobs))
		return
	}

	jobs, err := h.Queries.ListJobs(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list jobs")
		return
	}
	respondJSON(w, http.StatusOK, toJobResponsesFromList(jobs))
}

// GetJob returns a single job by ID with customer name.
// GET /api/jobs/{id}
func (h *Handler) GetJob(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid job ID")
		return
	}

	job, err := h.Queries.GetJob(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "job not found")
		return
	}

	// Also fetch structures for this job
	structures, err := h.Queries.ListJobStructures(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch job structures")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"job":        toJobResponseFromRow(job),
		"structures": toJobStructureResponses(structures),
	})
}

// CreateJob creates a new job with an auto-generated job number.
// POST /api/jobs
func (h *Handler) CreateJob(w http.ResponseWriter, r *http.Request) {
	var req createJobRequest
	if !parseBody(w, r, &req) {
		return
	}

	customerID, err := uuid.Parse(req.CustomerID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid customer_id")
		return
	}

	status := db.JobStatus(req.Status)
	if req.Status == "" {
		status = db.JobStatusQuote
	} else if !isValidJobStatus(req.Status) {
		respondError(w, http.StatusBadRequest, "invalid status value")
		return
	}

	job, err := h.Queries.CreateJob(r.Context(), db.CreateJobParams{
		CustomerID:         customerID,
		Status:             status,
		ExpectedCompletion: parseNullDate(req.ExpectedCompletion),
		ExpectedDelivery:   parseNullDate(req.ExpectedDelivery),
		TotalPrice:         toNullString(req.TotalPrice),
		Notes:              toNullString(req.Notes),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create job")
		return
	}
	respondJSON(w, http.StatusCreated, toJobResponse(job, ""))
}

// UpdateJob updates an existing job's editable fields.
// PUT /api/jobs/{id}
func (h *Handler) UpdateJob(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid job ID")
		return
	}

	var req updateJobRequest
	if !parseBody(w, r, &req) {
		return
	}

	customerID, err := uuid.Parse(req.CustomerID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid customer_id")
		return
	}

	job, err := h.Queries.UpdateJob(r.Context(), db.UpdateJobParams{
		ID:                 id,
		CustomerID:         customerID,
		ExpectedCompletion: parseNullDate(req.ExpectedCompletion),
		ExpectedDelivery:   parseNullDate(req.ExpectedDelivery),
		TotalPrice:         toNullString(req.TotalPrice),
		Notes:              toNullString(req.Notes),
	})
	if err != nil {
		respondError(w, http.StatusNotFound, "job not found")
		return
	}
	respondJSON(w, http.StatusOK, toJobResponse(job, ""))
}

// UpdateJobStatus changes a job's status (used by kanban drag-drop).
// PATCH /api/jobs/{id}/status
func (h *Handler) UpdateJobStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid job ID")
		return
	}

	var req updateJobStatusRequest
	if !parseBody(w, r, &req) {
		return
	}
	if !isValidJobStatus(req.Status) {
		respondError(w, http.StatusBadRequest, "invalid status value; must be one of: quote, in_progress, completed, delivered")
		return
	}

	job, err := h.Queries.UpdateJobStatus(r.Context(), db.UpdateJobStatusParams{
		ID:     id,
		Status: db.JobStatus(req.Status),
	})
	if err != nil {
		respondError(w, http.StatusNotFound, "job not found")
		return
	}
	respondJSON(w, http.StatusOK, toJobResponse(job, ""))
}

// DeleteJob removes a job and its structures (CASCADE).
// DELETE /api/jobs/{id}
func (h *Handler) DeleteJob(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid job ID")
		return
	}

	if err := h.Queries.DeleteJob(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete job")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "job deleted"})
}

// isValidJobStatus checks if a string is a valid job_status enum value.
func isValidJobStatus(s string) bool {
	switch db.JobStatus(s) {
	case db.JobStatusQuote, db.JobStatusInProgress, db.JobStatusCompleted, db.JobStatusDelivered:
		return true
	}
	return false
}

// parseNullDate converts an optional ISO date string to sql.NullTime.
func parseNullDate(s *string) sql.NullTime {
	if s == nil || *s == "" {
		return sql.NullTime{}
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: t, Valid: true}
}
