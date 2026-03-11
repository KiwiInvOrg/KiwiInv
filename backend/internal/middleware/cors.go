// Package middleware provides HTTP middleware for the API server.
package middleware

import (
	"net/http"

	"github.com/go-chi/cors"
)

// CORSHandler returns a configured CORS middleware that allows
// requests from the frontend origin with credentials support.
func CORSHandler(frontendURL string) func(next http.Handler) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}
