package handlers

import (
	"database/sql"
	"net/http"

	"github.com/AdamW222/kiwiinv/internal/db"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// createCustomerRequest is the expected JSON body for creating a customer.
type createCustomerRequest struct {
	Name    string  `json:"name"`
	Email   *string `json:"email"`
	Phone   *string `json:"phone"`
	Address *string `json:"address"`
}

// updateCustomerRequest is the expected JSON body for updating a customer.
type updateCustomerRequest struct {
	Name    string  `json:"name"`
	Email   *string `json:"email"`
	Phone   *string `json:"phone"`
	Address *string `json:"address"`
}

// ListCustomers returns all customers ordered by name.
// GET /api/customers
func (h *Handler) ListCustomers(w http.ResponseWriter, r *http.Request) {
	customers, err := h.Queries.ListCustomers(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list customers")
		return
	}
	respondJSON(w, http.StatusOK, toCustomerResponses(customers))
}

// GetCustomer returns a single customer by ID.
// GET /api/customers/{id}
func (h *Handler) GetCustomer(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid customer ID")
		return
	}

	customer, err := h.Queries.GetCustomer(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "customer not found")
		return
	}
	respondJSON(w, http.StatusOK, toCustomerResponse(customer))
}

// CreateCustomer creates a new customer.
// POST /api/customers
func (h *Handler) CreateCustomer(w http.ResponseWriter, r *http.Request) {
	var req createCustomerRequest
	if !parseBody(w, r, &req) {
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	customer, err := h.Queries.CreateCustomer(r.Context(), db.CreateCustomerParams{
		Name:    req.Name,
		Email:   toNullString(req.Email),
		Phone:   toNullString(req.Phone),
		Address: toNullString(req.Address),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create customer")
		return
	}
	respondJSON(w, http.StatusCreated, toCustomerResponse(customer))
}

// UpdateCustomer updates an existing customer.
// PUT /api/customers/{id}
func (h *Handler) UpdateCustomer(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid customer ID")
		return
	}

	var req updateCustomerRequest
	if !parseBody(w, r, &req) {
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	customer, err := h.Queries.UpdateCustomer(r.Context(), db.UpdateCustomerParams{
		ID:      id,
		Name:    req.Name,
		Email:   toNullString(req.Email),
		Phone:   toNullString(req.Phone),
		Address: toNullString(req.Address),
	})
	if err != nil {
		respondError(w, http.StatusNotFound, "customer not found")
		return
	}
	respondJSON(w, http.StatusOK, toCustomerResponse(customer))
}

// DeleteCustomer removes a customer by ID.
// DELETE /api/customers/{id}
func (h *Handler) DeleteCustomer(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid customer ID")
		return
	}

	if err := h.Queries.DeleteCustomer(r.Context(), id); err != nil {
		respondError(w, http.StatusConflict, "cannot delete customer with existing jobs")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "customer deleted"})
}

// toNullString converts a *string pointer to sql.NullString.
func toNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *s, Valid: true}
}
