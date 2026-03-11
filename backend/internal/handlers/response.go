// Package handlers contains HTTP request handlers for the API.
package handlers

import (
	"encoding/json"
	"log"
	"net/http"
)

// successResponse wraps successful API responses in a consistent format.
type successResponse struct {
	Data interface{} `json:"data"`
}

// errorResponse wraps error API responses in a consistent format.
type errorResponse struct {
	Error string `json:"error"`
}

// respondJSON writes a JSON response with the given status code and payload.
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(successResponse{Data: payload}); err != nil {
		log.Printf("error encoding response: %v", err)
	}
}

// respondError writes a JSON error response with the given status code and message.
func respondError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(errorResponse{Error: message}); err != nil {
		log.Printf("error encoding error response: %v", err)
	}
}

// parseBody decodes a JSON request body into the given destination struct.
// Returns false and writes a 400 error response if decoding fails.
func parseBody(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(dst); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return false
	}
	return true
}
