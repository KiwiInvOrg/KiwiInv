package handlers

import (
	"github.com/AdamW222/kiwiinv/internal/config"
	"github.com/AdamW222/kiwiinv/internal/db"
)

// Handler holds shared dependencies for all HTTP handlers.
type Handler struct {
	Queries *db.Queries
	Config  *config.Config
}

// NewHandler creates a Handler with the given dependencies.
func NewHandler(queries *db.Queries, cfg *config.Config) *Handler {
	return &Handler{
		Queries: queries,
		Config:  cfg,
	}
}
