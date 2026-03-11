package handlers

import (
	"net/http"

	"github.com/AdamW222/kiwiinv/internal/db"
)

// kanbanBoardResponse represents the kanban board with jobs grouped by status.
type kanbanBoardResponse struct {
	Quote      []KanbanJobResponse `json:"quote"`
	InProgress []KanbanJobResponse `json:"in_progress"`
	Completed  []KanbanJobResponse `json:"completed"`
	Delivered  []KanbanJobResponse `json:"delivered"`
}

// GetKanbanBoard returns all jobs grouped by their status for the kanban view.
// GET /api/kanban
func (h *Handler) GetKanbanBoard(w http.ResponseWriter, r *http.Request) {
	jobs, err := h.Queries.GetKanbanJobs(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch kanban data")
		return
	}

	board := kanbanBoardResponse{
		Quote:      []KanbanJobResponse{},
		InProgress: []KanbanJobResponse{},
		Completed:  []KanbanJobResponse{},
		Delivered:  []KanbanJobResponse{},
	}

	for _, job := range jobs {
		resp := toKanbanJobResponse(job)
		switch job.Status {
		case db.JobStatusQuote:
			board.Quote = append(board.Quote, resp)
		case db.JobStatusInProgress:
			board.InProgress = append(board.InProgress, resp)
		case db.JobStatusCompleted:
			board.Completed = append(board.Completed, resp)
		case db.JobStatusDelivered:
			board.Delivered = append(board.Delivered, resp)
		}
	}

	respondJSON(w, http.StatusOK, board)
}
