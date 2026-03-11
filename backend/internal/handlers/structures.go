package handlers

import (
	"net/http"

	"github.com/AdamW222/kiwiinv/internal/db"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// createTemplateRequest is the expected JSON body for creating a structure template.
type createTemplateRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	BasePrice   *string `json:"base_price"`
	Category    string  `json:"category"`
}

// createJobStructureRequest is the expected JSON body for adding a structure to a job.
type createJobStructureRequest struct {
	TemplateID *string `json:"template_id"`
	CustomName *string `json:"custom_name"`
	Quantity   int32   `json:"quantity"`
	UnitPrice  *string `json:"unit_price"`
	Notes      *string `json:"notes"`
}

// updateJobStructureRequest is the expected JSON body for updating a job structure.
type updateJobStructureRequest struct {
	TemplateID *string `json:"template_id"`
	CustomName *string `json:"custom_name"`
	Quantity   int32   `json:"quantity"`
	UnitPrice  *string `json:"unit_price"`
	Status     string  `json:"status"`
	Notes      *string `json:"notes"`
}

// ListTemplates returns all structure templates ordered by category.
// GET /api/templates
func (h *Handler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.Queries.ListStructureTemplates(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list templates")
		return
	}
	respondJSON(w, http.StatusOK, toTemplateResponses(templates))
}

// GetTemplate returns a single structure template.
// GET /api/templates/{id}
func (h *Handler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid template ID")
		return
	}

	tmpl, err := h.Queries.GetStructureTemplate(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "template not found")
		return
	}
	respondJSON(w, http.StatusOK, toTemplateResponse(tmpl))
}

// CreateTemplate creates a new structure template.
// POST /api/templates
func (h *Handler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	var req createTemplateRequest
	if !parseBody(w, r, &req) {
		return
	}
	if req.Name == "" || req.Category == "" {
		respondError(w, http.StatusBadRequest, "name and category are required")
		return
	}

	tmpl, err := h.Queries.CreateStructureTemplate(r.Context(), db.CreateStructureTemplateParams{
		Name:        req.Name,
		Description: toNullString(req.Description),
		BasePrice:   toNullString(req.BasePrice),
		Category:    req.Category,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create template")
		return
	}
	respondJSON(w, http.StatusCreated, toTemplateResponse(tmpl))
}

// UpdateTemplate updates an existing structure template.
// PUT /api/templates/{id}
func (h *Handler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid template ID")
		return
	}

	var req createTemplateRequest
	if !parseBody(w, r, &req) {
		return
	}
	if req.Name == "" || req.Category == "" {
		respondError(w, http.StatusBadRequest, "name and category are required")
		return
	}

	tmpl, err := h.Queries.UpdateStructureTemplate(r.Context(), db.UpdateStructureTemplateParams{
		ID:          id,
		Name:        req.Name,
		Description: toNullString(req.Description),
		BasePrice:   toNullString(req.BasePrice),
		Category:    req.Category,
	})
	if err != nil {
		respondError(w, http.StatusNotFound, "template not found")
		return
	}
	respondJSON(w, http.StatusOK, toTemplateResponse(tmpl))
}

// DeleteTemplate removes a structure template.
// DELETE /api/templates/{id}
func (h *Handler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid template ID")
		return
	}

	if err := h.Queries.DeleteStructureTemplate(r.Context(), id); err != nil {
		respondError(w, http.StatusConflict, "cannot delete template that is referenced by job structures")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "template deleted"})
}

// ListJobStructures returns all structures for a given job.
// GET /api/jobs/{id}/structures
func (h *Handler) ListJobStructures(w http.ResponseWriter, r *http.Request) {
	jobID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid job ID")
		return
	}

	structures, err := h.Queries.ListJobStructures(r.Context(), jobID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list job structures")
		return
	}
	respondJSON(w, http.StatusOK, toJobStructureResponses(structures))
}

// CreateJobStructure adds a structure to a job.
// POST /api/jobs/{id}/structures
func (h *Handler) CreateJobStructure(w http.ResponseWriter, r *http.Request) {
	jobID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid job ID")
		return
	}

	var req createJobStructureRequest
	if !parseBody(w, r, &req) {
		return
	}
	if req.Quantity < 1 {
		req.Quantity = 1
	}

	structure, err := h.Queries.CreateJobStructure(r.Context(), db.CreateJobStructureParams{
		JobID:      jobID,
		TemplateID: parseNullUUID(req.TemplateID),
		CustomName: toNullString(req.CustomName),
		Quantity:   req.Quantity,
		UnitPrice:  toNullString(req.UnitPrice),
		Notes:      toNullString(req.Notes),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create job structure")
		return
	}
	respondJSON(w, http.StatusCreated, toJobStructureResponse(structure))
}

// UpdateJobStructure updates a job structure.
// PUT /api/structures/{id}
func (h *Handler) UpdateJobStructure(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid structure ID")
		return
	}

	var req updateJobStructureRequest
	if !parseBody(w, r, &req) {
		return
	}
	if req.Quantity < 1 {
		req.Quantity = 1
	}
	if !isValidStructureStatus(req.Status) {
		respondError(w, http.StatusBadRequest, "invalid status; must be one of: pending, in_progress, completed")
		return
	}

	structure, err := h.Queries.UpdateJobStructure(r.Context(), db.UpdateJobStructureParams{
		ID:         id,
		TemplateID: parseNullUUID(req.TemplateID),
		CustomName: toNullString(req.CustomName),
		Quantity:   req.Quantity,
		UnitPrice:  toNullString(req.UnitPrice),
		Status:     db.JobStructureStatus(req.Status),
		Notes:      toNullString(req.Notes),
	})
	if err != nil {
		respondError(w, http.StatusNotFound, "structure not found")
		return
	}
	respondJSON(w, http.StatusOK, toJobStructureResponse(structure))
}

// DeleteJobStructure removes a structure from a job.
// DELETE /api/structures/{id}
func (h *Handler) DeleteJobStructure(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid structure ID")
		return
	}

	if err := h.Queries.DeleteJobStructure(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete structure")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "structure deleted"})
}

// parseNullUUID converts an optional string to uuid.NullUUID.
func parseNullUUID(s *string) uuid.NullUUID {
	if s == nil || *s == "" {
		return uuid.NullUUID{}
	}
	id, err := uuid.Parse(*s)
	if err != nil {
		return uuid.NullUUID{}
	}
	return uuid.NullUUID{UUID: id, Valid: true}
}

// isValidStructureStatus checks if a string is a valid job_structure_status enum value.
func isValidStructureStatus(s string) bool {
	switch db.JobStructureStatus(s) {
	case db.JobStructureStatusPending, db.JobStructureStatusInProgress, db.JobStructureStatusCompleted:
		return true
	}
	return false
}
