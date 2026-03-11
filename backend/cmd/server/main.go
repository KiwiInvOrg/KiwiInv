// Package main is the entry point for the KiwiInv API server.
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AdamW222/kiwiinv/internal/config"
	"github.com/AdamW222/kiwiinv/internal/db"
	"github.com/AdamW222/kiwiinv/internal/handlers"
	"github.com/AdamW222/kiwiinv/internal/router"
)

func main() {
	// Load configuration from environment variables and .env file
	cfg := config.Load()

	// Connect to PostgreSQL
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer database.Close()

	// Run database migrations
	if err := db.RunMigrations(database, "migrations"); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	// Create handlers with database queries
	queries := db.New(database)
	h := handlers.NewHandler(queries, cfg) 

	// Create the router with all routes and middleware
	r := router.New(h, cfg.FrontendURL)

	// Configure the HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine so we can handle graceful shutdown
	go func() {
		log.Printf("server starting on port %s (environment: %s)", cfg.Port, cfg.Environment)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("server shutting down...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}

	log.Println("server stopped")
}
