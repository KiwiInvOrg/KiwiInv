package handlers

import (
	"database/sql"
	"time"

	"github.com/AdamW222/kiwiinv/internal/db"
	"github.com/google/uuid"
)

// API response types that serialize nullable fields as value-or-null instead of
// Go's default sql.NullString{String:"...",Valid:true} format.

// CustomerResponse is the API-friendly representation of a customer.
type CustomerResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     *string   `json:"email"`
	Phone     *string   `json:"phone"`
	Address   *string   `json:"address"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// JobResponse is the API-friendly representation of a job.
type JobResponse struct {
	ID                 uuid.UUID  `json:"id"`
	CustomerID         uuid.UUID  `json:"customer_id"`
	CustomerName       string     `json:"customer_name,omitempty"`
	JobNumber          string     `json:"job_number"`
	Status             string     `json:"status"`
	ExpectedCompletion *string    `json:"expected_completion"`
	ExpectedDelivery   *string    `json:"expected_delivery"`
	TotalPrice         *string    `json:"total_price"`
	Notes              *string    `json:"notes"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// KanbanJobResponse is a lighter job representation for the kanban board.
type KanbanJobResponse struct {
	ID                 uuid.UUID `json:"id"`
	JobNumber          string    `json:"job_number"`
	Status             string    `json:"status"`
	ExpectedCompletion *string   `json:"expected_completion"`
	ExpectedDelivery   *string   `json:"expected_delivery"`
	TotalPrice         *string   `json:"total_price"`
	Notes              *string   `json:"notes"`
	CreatedAt          time.Time `json:"created_at"`
	CustomerName       string    `json:"customer_name"`
}

// JobStructureResponse is the API-friendly representation of a job structure.
type JobStructureResponse struct {
	ID           uuid.UUID `json:"id"`
	JobID        uuid.UUID `json:"job_id"`
	TemplateID   *string   `json:"template_id"`
	TemplateName *string   `json:"template_name,omitempty"`
	CustomName   *string   `json:"custom_name"`
	Quantity     int32     `json:"quantity"`
	UnitPrice    *string   `json:"unit_price"`
	Status       string    `json:"status"`
	Notes        *string   `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// TemplateResponse is the API-friendly representation of a structure template.
type TemplateResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	BasePrice   *string   `json:"base_price"`
	Category    string    `json:"category"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// -- Conversion functions --

func toCustomerResponse(c db.Customer) CustomerResponse {
	return CustomerResponse{
		ID:        c.ID,
		Name:      c.Name,
		Email:     fromNullString(c.Email),
		Phone:     fromNullString(c.Phone),
		Address:   fromNullString(c.Address),
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
}

func toCustomerResponses(cs []db.Customer) []CustomerResponse {
	out := make([]CustomerResponse, len(cs))
	for i, c := range cs {
		out[i] = toCustomerResponse(c)
	}
	return out
}

func toJobResponse(j db.Job, customerName string) JobResponse {
	return JobResponse{
		ID:                 j.ID,
		CustomerID:         j.CustomerID,
		CustomerName:       customerName,
		JobNumber:          j.JobNumber,
		Status:             string(j.Status),
		ExpectedCompletion: fromNullDate(j.ExpectedCompletion),
		ExpectedDelivery:   fromNullDate(j.ExpectedDelivery),
		TotalPrice:         fromNullString(j.TotalPrice),
		Notes:              fromNullString(j.Notes),
		CreatedAt:          j.CreatedAt,
		UpdatedAt:          j.UpdatedAt,
	}
}

func toJobResponseFromRow(j db.GetJobRow) JobResponse {
	return JobResponse{
		ID:                 j.ID,
		CustomerID:         j.CustomerID,
		CustomerName:       j.CustomerName,
		JobNumber:          j.JobNumber,
		Status:             string(j.Status),
		ExpectedCompletion: fromNullDate(j.ExpectedCompletion),
		ExpectedDelivery:   fromNullDate(j.ExpectedDelivery),
		TotalPrice:         fromNullString(j.TotalPrice),
		Notes:              fromNullString(j.Notes),
		CreatedAt:          j.CreatedAt,
		UpdatedAt:          j.UpdatedAt,
	}
}

func toJobResponsesFromList(js []db.ListJobsRow) []JobResponse {
	out := make([]JobResponse, len(js))
	for i, j := range js {
		out[i] = JobResponse{
			ID:                 j.ID,
			CustomerID:         j.CustomerID,
			CustomerName:       j.CustomerName,
			JobNumber:          j.JobNumber,
			Status:             string(j.Status),
			ExpectedCompletion: fromNullDate(j.ExpectedCompletion),
			ExpectedDelivery:   fromNullDate(j.ExpectedDelivery),
			TotalPrice:         fromNullString(j.TotalPrice),
			Notes:              fromNullString(j.Notes),
			CreatedAt:          j.CreatedAt,
			UpdatedAt:          j.UpdatedAt,
		}
	}
	return out
}

func toJobResponsesFromStatusList(js []db.ListJobsByStatusRow) []JobResponse {
	out := make([]JobResponse, len(js))
	for i, j := range js {
		out[i] = JobResponse{
			ID:                 j.ID,
			CustomerID:         j.CustomerID,
			CustomerName:       j.CustomerName,
			JobNumber:          j.JobNumber,
			Status:             string(j.Status),
			ExpectedCompletion: fromNullDate(j.ExpectedCompletion),
			ExpectedDelivery:   fromNullDate(j.ExpectedDelivery),
			TotalPrice:         fromNullString(j.TotalPrice),
			Notes:              fromNullString(j.Notes),
			CreatedAt:          j.CreatedAt,
			UpdatedAt:          j.UpdatedAt,
		}
	}
	return out
}

func toKanbanJobResponse(j db.GetKanbanJobsRow) KanbanJobResponse {
	return KanbanJobResponse{
		ID:                 j.ID,
		JobNumber:          j.JobNumber,
		Status:             string(j.Status),
		ExpectedCompletion: fromNullDate(j.ExpectedCompletion),
		ExpectedDelivery:   fromNullDate(j.ExpectedDelivery),
		TotalPrice:         fromNullString(j.TotalPrice),
		Notes:              fromNullString(j.Notes),
		CreatedAt:          j.CreatedAt,
		CustomerName:       j.CustomerName,
	}
}

func toJobStructureResponse(s db.JobStructure) JobStructureResponse {
	return JobStructureResponse{
		ID:         s.ID,
		JobID:      s.JobID,
		TemplateID: fromNullUUID(s.TemplateID),
		CustomName: fromNullString(s.CustomName),
		Quantity:   s.Quantity,
		UnitPrice:  fromNullString(s.UnitPrice),
		Status:     string(s.Status),
		Notes:      fromNullString(s.Notes),
		CreatedAt:  s.CreatedAt,
		UpdatedAt:  s.UpdatedAt,
	}
}

func toJobStructureResponseFromRow(s db.GetJobStructureRow) JobStructureResponse {
	return JobStructureResponse{
		ID:           s.ID,
		JobID:        s.JobID,
		TemplateID:   fromNullUUID(s.TemplateID),
		TemplateName: fromNullString(s.TemplateName),
		CustomName:   fromNullString(s.CustomName),
		Quantity:     s.Quantity,
		UnitPrice:    fromNullString(s.UnitPrice),
		Status:       string(s.Status),
		Notes:        fromNullString(s.Notes),
		CreatedAt:    s.CreatedAt,
		UpdatedAt:    s.UpdatedAt,
	}
}

func toJobStructureResponses(ss []db.ListJobStructuresRow) []JobStructureResponse {
	out := make([]JobStructureResponse, len(ss))
	for i, s := range ss {
		out[i] = JobStructureResponse{
			ID:           s.ID,
			JobID:        s.JobID,
			TemplateID:   fromNullUUID(s.TemplateID),
			TemplateName: fromNullString(s.TemplateName),
			CustomName:   fromNullString(s.CustomName),
			Quantity:     s.Quantity,
			UnitPrice:    fromNullString(s.UnitPrice),
			Status:       string(s.Status),
			Notes:        fromNullString(s.Notes),
			CreatedAt:    s.CreatedAt,
			UpdatedAt:    s.UpdatedAt,
		}
	}
	return out
}

func toTemplateResponse(t db.StructureTemplate) TemplateResponse {
	return TemplateResponse{
		ID:          t.ID,
		Name:        t.Name,
		Description: fromNullString(t.Description),
		BasePrice:   fromNullString(t.BasePrice),
		Category:    t.Category,
		CreatedAt:   t.CreatedAt,
		UpdatedAt:   t.UpdatedAt,
	}
}

func toTemplateResponses(ts []db.StructureTemplate) []TemplateResponse {
	out := make([]TemplateResponse, len(ts))
	for i, t := range ts {
		out[i] = toTemplateResponse(t)
	}
	return out
}

// -- Null type helpers --

func fromNullString(ns sql.NullString) *string {
	if !ns.Valid {
		return nil
	}
	return &ns.String
}

func fromNullDate(nt sql.NullTime) *string {
	if !nt.Valid {
		return nil
	}
	s := nt.Time.Format("2006-01-02")
	return &s
}

func fromNullUUID(nu uuid.NullUUID) *string {
	if !nu.Valid {
		return nil
	}
	s := nu.UUID.String()
	return &s
}
