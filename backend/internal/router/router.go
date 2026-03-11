// Package router sets up the HTTP route tree using chi.
package router

import (
	"github.com/AdamW222/kiwiinv/internal/handlers"
	"github.com/AdamW222/kiwiinv/internal/middleware"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

// New creates and returns a configured chi router with all API routes.
func New(h *handlers.Handler, frontendURL string) *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(middleware.CORSHandler(frontendURL))

	// API routes
	r.Route("/api", func(r chi.Router) {
		r.Get("/health", handlers.HealthCheck)

		// Kanban board
		r.Get("/kanban", h.GetKanbanBoard)

		// Customer management
		r.Route("/customers", func(r chi.Router) {
			r.Get("/", h.ListCustomers)
			r.Post("/", h.CreateCustomer)
			r.Get("/{id}", h.GetCustomer)
			r.Put("/{id}", h.UpdateCustomer)
			r.Delete("/{id}", h.DeleteCustomer)
		})

		// Job management
		r.Route("/jobs", func(r chi.Router) {
			r.Get("/", h.ListJobs)
			r.Post("/", h.CreateJob)
			r.Get("/{id}", h.GetJob)
			r.Put("/{id}", h.UpdateJob)
			r.Delete("/{id}", h.DeleteJob)
			r.Patch("/{id}/status", h.UpdateJobStatus)
			r.Get("/{id}/structures", h.ListJobStructures)
			r.Post("/{id}/structures", h.CreateJobStructure)
		})

		// Structure templates
		r.Route("/templates", func(r chi.Router) {
			r.Get("/", h.ListTemplates)
			r.Post("/", h.CreateTemplate)
			r.Get("/{id}", h.GetTemplate)
			r.Put("/{id}", h.UpdateTemplate)
			r.Delete("/{id}", h.DeleteTemplate)
		})

		// Standalone structure operations (update/delete by structure ID)
		r.Route("/structures", func(r chi.Router) {
			r.Put("/{id}", h.UpdateJobStructure)
			r.Delete("/{id}", h.DeleteJobStructure)
		})
	})

	return r
}
