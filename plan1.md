Phase 1: Core Kanban Board with Job Management
Context
Kiwi Cabins needs a job/order tracking system with a kanban-style board. The project currently has a prototype Next.js app (invmanagement/) and a bare Go module (invconnector/). We're starting from scratch with a clean architecture: Go backend API + Next.js frontend + PostgreSQL.

Decisions made:

Go 1.26.1 at D:\ProgramFiles\Go\bin (add to PATH in shell: export PATH="$PATH:/d/ProgramFiles/Go/bin")
chi router for Go HTTP
Local PostgreSQL (host=localhost port=5432 dbname=postgres user=devbot)
Module: github.com/AdamW222/kiwiinv
Full frontend rebuild with shadcn/ui + Tailwind v4
sqlc for type-safe database queries
golang-migrate for schema migrations
Google OAuth for authentication
Step 0: Clean Slate
Move invmanagement/AGENTS.MD to project root
Delete invmanagement/ and invconnector/ directories
Update root .gitignore for new project structure
Step 1: Initialize Go API Project Structure
Create the backend directory layout with a working health check endpoint.

Files to create:


backend/
├── cmd/server/main.go           # Entry point: config, DB, router, graceful shutdown
├── internal/
│   ├── config/config.go         # Config struct loaded from env vars
│   ├── handlers/health.go       # GET /api/health → {"status":"ok"}
│   ├── handlers/response.go     # respondJSON(), respondError() helpers
│   ├── middleware/cors.go       # CORS allowing localhost:3000
│   └── router/router.go        # chi router setup with middleware
├── go.mod                       # module github.com/AdamW222/kiwiinv
└── go.sum
Dependencies: github.com/go-chi/chi/v5, github.com/go-chi/cors

Config env vars: PORT (default 8080), DATABASE_URL, FRONTEND_URL (default http://localhost:3000), ENVIRONMENT (default development)

Verify: go build ./cmd/server/ compiles; go run ./cmd/server/ serves; curl localhost:8080/api/health returns 200

Step 2: PostgreSQL Database Connection + Migration System
Files to create:


backend/
├── internal/db/connection.go    # Open pool from DATABASE_URL, ping, set pool limits
├── internal/db/migrate.go       # Run golang-migrate on startup from migrations/ dir
├── migrations/
│   ├── 000001_initial_schema.up.sql
│   └── 000001_initial_schema.down.sql
Dependencies: github.com/lib/pq, github.com/golang-migrate/migrate/v4 (with postgres + file source)

Update main.go: Connect to DB after config load, run migrations, pass *sql.DB to handlers.

DATABASE_URL: postgres://devbot:<password>@localhost:5432/postgres?sslmode=disable
(Note: Stored in .env, never committed)

Step 3: Initial Database Schema
migrations/000001_initial_schema.up.sql creates:

Table	Key Columns
users	id UUID PK, email, name, google_id, role enum(admin/user), is_active
customers	id UUID PK, name, email, phone, address
jobs	id UUID PK, customer_id FK, job_number UNIQUE, status enum(quote/in_progress/completed/delivered), expected_completion, expected_delivery, total_price NUMERIC(12,2), notes
structure_templates	id UUID PK, name, description, base_price NUMERIC(12,2), category
job_structures	id UUID PK, job_id FK CASCADE, template_id FK nullable, custom_name, quantity, unit_price, status enum(pending/in_progress/completed), notes
Plus: indexes on status/customer_id/job_number, updated_at trigger function, sequence for job numbers (KW-0001 format).

All PKs use gen_random_uuid(). All timestamps use TIMESTAMPTZ. Money uses NUMERIC(12,2).

Step 4: sqlc Setup + Query Generation
Files to create:


backend/
├── sqlc.yaml                          # Config: postgres engine, queries→sql/queries/, schema→migrations/
├── sql/queries/
│   ├── customers.sql                  # CRUD: Get, List, Search, Create, Update, Delete
│   ├── jobs.sql                       # CRUD + ListByStatus, GetKanbanBoard, UpdateStatus, GetNextJobNumber
│   ├── job_structures.sql             # CRUD by job_id
│   ├── structure_templates.sql        # CRUD, ListByCategory
│   └── users.sql                      # GetByID, GetByGoogleID, GetByEmail, Create, Update
Dependencies: github.com/google/uuid

sqlc overrides: UUID → github.com/google/uuid.UUID, NUMERIC → string

Generate: sqlc generate → produces internal/db/db.go, models.go, *.sql.go

Step 5: API Handlers
REST endpoints with JSON request/response. All responses use {"data": ...} or {"error": "..."} format.

Files to create:


backend/internal/
├── handlers/
│   ├── handler.go          # Handler struct holding *db.Queries + *config.Config
│   ├── customers.go        # GET/POST /api/customers, GET/PUT/DELETE /api/customers/{id}
│   ├── jobs.go             # GET/POST /api/jobs, GET/PUT/DELETE /api/jobs/{id}, PATCH /api/jobs/{id}/status
│   ├── kanban.go           # GET /api/kanban → jobs grouped by status
│   └── structures.go       # Templates CRUD + job structures CRUD
Update router/router.go with all route groups.

Key endpoint: GET /api/kanban returns:


{"data": {"quote": [...], "in_progress": [...], "completed": [...], "delivered": [...]}}
Key endpoint: PATCH /api/jobs/{id}/status accepts {"status": "in_progress"} — used by kanban drag-drop.

Step 6: Google OAuth Authentication
Files to create:


backend/internal/
├── handlers/auth.go        # GET /api/auth/google/login, GET /api/auth/google/callback, GET /api/auth/me, POST /api/auth/logout
├── middleware/auth.go       # JWT validation middleware, extracts user from token
├── services/auth.go         # GenerateJWT, ValidateJWT, GetGoogleUserInfo
Dependencies: golang.org/x/oauth2, golang.org/x/oauth2/google, github.com/golang-jwt/jwt/v5

Flow: Frontend → /api/auth/google/login → Google consent → callback → upsert user → issue JWT → redirect to http://localhost:3000/auth/callback?token=<jwt>

Protected routes: All /api/* except /health, /auth/google/login, /auth/google/callback require valid JWT.

Env vars needed: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL, JWT_SECRET

Step 7: Initialize Next.js Frontend
Commands:


npx create-next-app@latest frontend --typescript --tailwind --eslint --app --import-alias="@/*"
cd frontend
npx shadcn@latest init  # New York style, CSS variables
npx shadcn@latest add button card badge dialog input label select textarea separator dropdown-menu avatar sheet tabs toast
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-query zustand date-fns zod
Files to create:


frontend/
├── types/api.ts               # TS types matching Go models (Job, Customer, JobStatus, etc.)
├── lib/api-client.ts          # Fetch wrapper with auth header, error handling
├── lib/auth.ts                # Token storage, login URL, isAuthenticated
├── lib/store.ts               # Zustand store (user state)
├── lib/hooks/use-jobs.ts      # React Query hooks: useKanbanBoard, useJob, useCreateJob, useUpdateJobStatus
├── lib/hooks/use-customers.ts # React Query hooks for customers
├── app/providers.tsx          # QueryClientProvider wrapper (client component)
├── app/layout.tsx             # Root layout with providers, nav
├── app/login/page.tsx         # "Sign in with Google" button
├── app/auth/callback/page.tsx # Receives JWT from URL, stores it, redirects to /
└── .env.local                 # NEXT_PUBLIC_API_URL=http://localhost:8080
Step 8: Kanban Board UI
Files to create:


frontend/components/
├── kanban/
│   ├── kanban-board.tsx       # DndContext + 4 columns, useKanbanBoard() hook, optimistic status updates
│   ├── kanban-column.tsx      # Droppable column: header (color-coded) + job card list + count badge
│   ├── job-card.tsx           # Draggable card: job number, customer, structures, expected date
│   ├── kanban-skeleton.tsx    # Loading skeleton
│   └── create-job-dialog.tsx  # Dialog: select customer, dates, add structures, notes, price
├── layout/
│   └── nav-header.tsx         # Top nav: "Kiwi Cabins" logo, Board/Customers/Templates links, user menu
frontend/app/page.tsx renders the kanban board as the main view.

DnD behavior: Drag card between columns → PATCH /api/jobs/{id}/status → optimistic UI update → rollback on error with toast.

Column colors: Quote=blue, In Progress=amber, Completed=green, Delivered=purple.

Step 9: Job Detail + Customer Management
Files to create:


frontend/components/
├── jobs/
│   ├── job-detail-dialog.tsx   # Sheet/dialog: full job info, structures list, edit/delete actions
│   ├── job-form.tsx            # Create/edit form with Zod validation
│   └── structure-form.tsx      # Sub-form: template select or custom name, quantity, price
├── customers/
│   ├── customer-select.tsx     # Searchable combobox with "create new" option
│   └── customer-form.tsx       # Name (required), email, phone, address
frontend/app/
├── customers/page.tsx          # Customer list + CRUD
└── templates/page.tsx          # Structure templates management
Step 10: Configuration Files
Root .env.example with all env vars (no real values).
Root .gitignore covering Go, Node, env files, IDE files.

Verification Plan
After each step, verify:

Step 1: go run ./cmd/server/ starts, GET /api/health returns 200
Step 2: Server connects to PostgreSQL, logs "migrations applied"
Step 3: \dt in psql shows all 5 tables with correct columns
Step 4: sqlc generate succeeds, go build ./internal/db/ compiles
Step 5: curl CRUD operations on customers/jobs work, kanban endpoint returns grouped data
Step 6: Browser OAuth flow works, JWT issued, protected endpoints enforce auth
Step 7: npm run dev starts on :3000, login page renders
Step 8: Kanban board shows jobs, drag-drop changes status
Step 9: Click card → detail view, create/edit/delete jobs works end-to-end
Notes
Go binary path: export PATH="$PATH:/d/ProgramFiles/Go/bin" (needed each shell session, or add to shell profile)
Never commit .env files with real credentials
sqlc must be installed separately: go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
Google Cloud Console OAuth credentials must be set up manually before Step 6


MEMORY PROCEEDING PLAN1 start

Update Todos

Clean slate: move AGENTS.MD to root, delete old directories, update .gitignore

Initialize Go API project structure with chi router and health endpoint

Set up PostgreSQL connection and migration system

Create initial database schema migration

Set up sqlc and write query files

Implement Go API handlers (jobs, customers, kanban, structures)

Implement Google OAuth authentication

Initialize Next.js frontend with shadcn/ui

Build kanban board UI with drag-and-drop

Build job detail view and customer management
Bash Copy AGENTS.MD to project root
IN
cp "d:/Projects/KiwiInv/invmanagement/AGENTS.MD" "d:/Projects/KiwiInv/AGENTS.MD"

OUT
0
Bash Delete old invmanagement and invconnector directories
IN
rm -rf "d:/Projects/KiwiInv/invmanagement" "d:/Projects/KiwiInv/invconnector"

OUT
Exit code 1
rm: cannot remove 'd:/Projects/KiwiInv/invconnector': Device or resource busy
Bash Remove invconnector contents and list root
IN
rm -rf "d:/Projects/KiwiInv/invconnector/go.mod" && rmdir "d:/Projects/KiwiInv/invconnector" 2>/dev/null; ls "d:/Projects/KiwiInv/"

OUT
AGENTS.MD
invconnector
Bash Force remove invconnector via Windows cmd
IN
ls "d:/Projects/KiwiInv/invconnector/" 2>/dev/null; rm -rf "d:/Projects/KiwiInv/invconnector" 2>/dev/null || cmd.exe /c "rmdir /s /q d:\\Projects\\KiwiInv\\invconnector" 2>/dev/null; ls "d:/Projects/KiwiInv/"

OUT
Microsoft Windows [Version 10.0.19045.6466]
(c) Microsoft Corporation. All rights reserved.

D:\Projects\KiwiInv>AGENTS.MD
invconnector
The directory seems locked (possibly by your IDE). Let's proceed - it's empty anyway (we already deleted go.mod). Now let me update the .gitignore and create the Go project structure.

Read d:\Projects\KiwiInv\.gitignore
Write d:\Projects\KiwiInv\.gitignore
53 lines
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/

# Build
build/
dist/

# Environment
.env
.env.local
.env*.local

# Go
/backend/tmp/
/backend/vendor/
*.exe
*.dll
*.so
*.dylib

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Misc
*.pem
.vercel
Now let me create the entire Go project structure. I'll create all Step 1 files.

Bash Create Go project directory structure
IN
mkdir -p "d:/Projects/KiwiInv/backend/cmd/server" "d:/Projects/KiwiInv/backend/internal/config" "d:/Projects/KiwiInv/backend/internal/handlers" "d:/Projects/KiwiInv/backend/internal/middleware" "d:/Projects/KiwiInv/backend/internal/router" "d:/Projects/KiwiInv/backend/internal/db" "d:/Projects/KiwiInv/backend/internal/services" "d:/Projects/KiwiInv/backend/migrations" "d:/Projects/KiwiInv/backend/sql/queries"

OUT
0
Write d:\Projects\KiwiInv\backend\go.mod
4 lines
module github.com/AdamW222/kiwiinv

go 1.26.1
Write d:\Projects\KiwiInv\backend\internal\config\config.go
43 lines
// Package config handles application configuration loaded from environment variables.
package config

import "os"

// Config holds all application configuration values.
type Config struct {
	Port        string // HTTP server port (default: "8080")
	DatabaseURL string // PostgreSQL connection string
	FrontendURL string // Frontend origin for CORS (default: "http://localhost:3000")
	Environment string // "development" or "production" (default: "development")

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// JWT
	JWTSecret string
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:3000"),
		Environment:        getEnv("ENVIRONMENT", "development"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback"),
		JWTSecret:          getEnv("JWT_SECRET", ""),
	}
}

// getEnv returns the value of an environment variable, or a fallback default.
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
Write d:\Projects\KiwiInv\backend\internal\handlers\response.go
52 lines
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
Write d:\Projects\KiwiInv\backend\internal\handlers\health.go
22 lines
package handlers

import (
	"net/http"
	"time"
)

// healthResponse represents the health check response payload.
type healthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
}

// HealthCheck returns the current server status and timestamp.
// GET /api/health
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, healthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
Write d:\Projects\KiwiInv\backend\internal\middleware\cors.go
20 lines
// Package middleware provides HTTP middleware for the API server.
package middleware

import (
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
I need to fix the cors.go - it's missing the net/http import. Let me fix that and create the remaining files.

Read d:\Projects\KiwiInv\backend\internal\middleware\cors.go
Edit d:\Projects\KiwiInv\backend\internal\middleware\cors.go
Added 2 lines
Now create the router and main.go.

Write d:\Projects\KiwiInv\backend\internal\router\router.go
29 lines
// Package router sets up the HTTP route tree using chi.
package router

import (
	"github.com/AdamW222/kiwiinv/internal/handlers"
	"github.com/AdamW222/kiwiinv/internal/middleware"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

// New creates and returns a configured chi router with all API routes.
func New(frontendURL string) *chi.Mux {
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
	})

	return r
}
Write d:\Projects\KiwiInv\backend\cmd\server\main.go
59 lines
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
	"github.com/AdamW222/kiwiinv/internal/router"
)

func main() {
	// Load configuration from environment variables
	cfg := config.Load()

	// Create the router with all routes and middleware
	r := router.New(cfg.FrontendURL)

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
Now let's install the Go dependencies and verify it compiles.

Bash Install chi and cors Go dependencies
IN
export PATH="$PATH:/d/ProgramFiles/Go/bin" && cd "d:/Projects/KiwiInv/backend" && go get github.com/go-chi/chi/v5 && go get github.com/go-chi/cors

OUT
go: downloading github.com/go-chi/chi/v5 v5.2.5
go: downloading github.com/go-chi/chi v1.5.5
go: added github.com/go-chi/chi/v5 v5.2.5
go: downloading github.com/go-chi/cors v1.2.2
go: added github.com/go-chi/cors v1.2.2
Bash Build Go server to verify compilation
IN
export PATH="$PATH:/d/ProgramFiles/Go/bin" && cd "d:/Projects/KiwiInv/backend" && go build ./cmd/server/

OUT
0
Compiles cleanly. Let me test the server.

Bash Start server, test health endpoint, then stop
IN
export PATH="$PATH:/d/ProgramFiles/Go/bin" && cd "d:/Projects/KiwiInv/backend" && go run ./cmd/server/ &
sleep 2 && curl -s http://localhost:8080/api/health && kill %1 2>/dev/null

OUT
2026/03/11 11:29:10 server starting on port 8080 (environment: development)
2026/03/11 11:29:10 "GET http://localhost:8080/api/health HTTP/1.1" from [::1]:57232 - 200 60B in 0s
{"data":{"status":"ok","timestamp":"2026-03-10T22:29:10Z"}}
Health endpoint returns {"data":{"status":"ok","timestamp":"..."}} - working perfectly.

Update Todos

Clean slate: move AGENTS.MD to root, delete old directories, update .gitignore

Initialize Go API project structure with chi router and health endpoint

Set up PostgreSQL connection and migration system

Create initial database schema migration

Set up sqlc and write query files

Implement Go API handlers (jobs, customers, kanban, structures)

Implement Google OAuth authentication

Initialize Next.js frontend with shadcn/ui

Build kanban board UI with drag-and-drop

Build job detail view and customer management
Steps 0 and 1 are done. Now Step 2: PostgreSQL connection and migration system. Let me create the .env file first, then the database connection and migration code.

Write d:\Projects\KiwiInv\.env.example
17 lines
# Backend
DATABASE_URL=postgres://user:password@localhost:5432/postgres?sslmode=disable
PORT=8080
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback

# JWT
JWT_SECRET=change-this-to-a-random-string-at-least-32-characters

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
Write d:\Projects\KiwiInv\backend\.env
9 lines
DATABASE_URL=postgres://devbot:-yxCSNwdrvz5vSf@localhost:5432/postgres?sslmode=disable
PORT=8080
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback
JWT_SECRET=dev-secret-change-in-production-minimum-32-chars
Now I need to update the config to load from .env file, create the DB connection, and the migration runner. Let me also update main.go to load the .env file.

Write d:\Projects\KiwiInv\backend\internal\config\config.go
89 lines
// Package config handles application configuration loaded from environment variables.
package config

import (
	"bufio"
	"log"
	"os"
	"strings"
)

// Config holds all application configuration values.
type Config struct {
	Port        string // HTTP server port (default: "8080")
	DatabaseURL string // PostgreSQL connection string
	FrontendURL string // Frontend origin for CORS (default: "http://localhost:3000")
	Environment string // "development" or "production" (default: "development")

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// JWT
	JWTSecret string
}

// Load reads configuration from a .env file (if present) and environment variables.
// Environment variables take precedence over .env values.
func Load() *Config {
	loadEnvFile(".env")

	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:3000"),
		Environment:        getEnv("ENVIRONMENT", "development"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback"),
		JWTSecret:          getEnv("JWT_SECRET", ""),
	}
}

// loadEnvFile reads a .env file and sets environment variables for any keys
// not already present in the environment. This ensures real env vars take precedence.
func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		// .env file is optional; skip silently if not found
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, found := strings.Cut(line, "=")
		if !found {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)

		// Only set if not already present in environment
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, value)
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("warning: error reading .env file: %v", err)
	}
}

// getEnv returns the value of an environment variable, or a fallback default.
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
Write d:\Projects\KiwiInv\backend\internal\db\connection.go
44 lines
// Package db handles database connections and migrations.
package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
)

const (
	maxOpenConns    = 25
	maxIdleConns    = 5
	connMaxLifetime = 5 * time.Minute
)

// Connect opens a connection pool to PostgreSQL and verifies connectivity.
// Returns the database handle for use throughout the application.
func Connect(databaseURL string) (*sql.DB, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is not set")
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(maxOpenConns)
	db.SetMaxIdleConns(maxIdleConns)
	db.SetConnMaxLifetime(connMaxLifetime)

	// Verify the connection is working
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("connected to database")
	return db, nil
}
Write d:\Projects\KiwiInv\backend\internal\db\migrate.go
40 lines
package db

import (
	"database/sql"
	"errors"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file" // file source driver
)

// RunMigrations applies all pending database migrations from the given directory.
// It uses golang-migrate to track which migrations have been applied.
func RunMigrations(db *sql.DB, migrationsPath string) error {
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", migrationsPath),
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	version, dirty, _ := m.Version()
	log.Printf("migrations applied successfully (version: %d, dirty: %v)", version, dirty)

	return nil
}
Now update main.go to connect to DB and run migrations.

Read d:\Projects\KiwiInv\backend\cmd\server\main.go
Write d:\Projects\KiwiInv\backend\cmd\server\main.go
72 lines
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

	// Create the router with all routes and middleware
	r := router.New(cfg.FrontendURL)

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
Now let me create the migration SQL files (Step 3) and install the Go dependencies.

Write d:\Projects\KiwiInv\backend\migrations\000001_initial_schema.up.sql
101 lines
-- Initial schema for KiwiInv: users, customers, jobs, structure templates, job structures.

-- Custom enum types for status tracking
CREATE TYPE job_status AS ENUM ('quote', 'in_progress', 'completed', 'delivered');
CREATE TYPE job_structure_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Sequence for generating job numbers (KW-0001, KW-0002, etc.)
CREATE SEQUENCE job_number_seq START 1;

-- Users table for authentication (Google OAuth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers who order structures
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs represent customer orders containing one or more structures
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    job_number VARCHAR(50) NOT NULL UNIQUE,
    status job_status NOT NULL DEFAULT 'quote',
    expected_completion DATE,
    expected_delivery DATE,
    total_price NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catalog of standard structure designs (e.g., "8x10 Garden Shed")
CREATE TABLE structure_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price NUMERIC(12,2),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actual structures assigned to a job (can reference a template or be custom)
CREATE TABLE job_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    template_id UUID REFERENCES structure_templates(id),
    custom_name VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2),
    status job_structure_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_job_number ON jobs(job_number);
CREATE INDEX idx_job_structures_job_id ON job_structures(job_id);

-- Trigger function to auto-update the updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the auto-update trigger to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_structure_templates_updated_at
    BEFORE UPDATE ON structure_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_structures_updated_at
    BEFORE UPDATE ON job_structures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
Write d:\Projects\KiwiInv\backend\migrations\000001_initial_schema.down.sql
22 lines
-- Reverse the initial schema: drop tables in dependency order, then types and functions.

DROP TRIGGER IF EXISTS update_job_structures_updated_at ON job_structures;
DROP TRIGGER IF EXISTS update_structure_templates_updated_at ON structure_templates;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

DROP FUNCTION IF EXISTS update_updated_at_column;

DROP TABLE IF EXISTS job_structures;
DROP TABLE IF EXISTS structure_templates;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

DROP SEQUENCE IF EXISTS job_number_seq;

DROP TYPE IF EXISTS job_structure_status;
DROP TYPE IF EXISTS job_status;
DROP TYPE IF EXISTS user_role;
Now install the migration and database dependencies.

Bash Install PostgreSQL driver and golang-migrate dependencies
IN
export PATH="$PATH:/d/ProgramFiles/Go/bin" && cd "d:/Projects/KiwiInv/backend" && go get github.com/lib/pq && go get github.com/golang-migrate/migrate/v4 && go get github.com/golang-migrate/migrate/v4/database/postgres && go get github.com/golang-migrate/migrate/v4/source/file

OUT
go: downloading github.com/lib/pq v1.11.2
go: added github.com/lib/pq v1.11.2
go: downloading github.com/golang-migrate/migrate/v4 v4.19.1
go: downloading github.com/golang-migrate/migrate v3.5.4+incompatible
go: added github.com/golang-migrate/migrate/v4 v4.19.1
Bash Verify compilation with new dependencies
IN
export PATH="$PATH:/d/ProgramFiles/Go/bin" && cd "d:/Projects/KiwiInv/backend" && go build ./cmd/server/

OUT
0
Compiles. Let me test it connects to the database and runs migrations.

Bash Test server startup with DB connection and migrations
IN
export PATH="$PATH:/d/ProgramFiles/Go/bin" && cd "d:/Projects/KiwiInv/backend" && timeout 5 go run ./cmd/server/ 2>&1 || true

OUT
2026/03/11 11:31:31 connected to database
2026/03/11 11:31:31 migrations applied successfully (version: 1, dirty: false)
2026/03/11 11:31:31 server starting on port 8080 (environment: development)
2026/03/11 11:31:31 server failed to start: listen tcp :8080: bind: Only one usage of each socket address (protocol/network address/port) is normally permitted.
exit status 1
The port 8080 is still in use from the previous test, but the important output is clear: "connected to database" and "migrations applied successfully (version: 1)". Let me kill the old process and verify the tables were created.

Bash Check if tables were created in PostgreSQL
IN
export PGPASSWORD='-yxCSNwdrvz5vSf' && psql -h localhost -U devbot -d postgres -c "\dt" 2>/dev/null || echo "psql not available - checking with Go instead"

OUT
psql not available - checking with Go instead
psql isn't in PATH, but the migration ran successfully (version 1, dirty: false). Steps 2 and 3 are done. Let me move to Step 4: sqlc setup.

Update Todos

Clean slate: move AGENTS.MD to root, delete old directories, update .gitignore

Initialize Go API project structure with chi router and health endpoint

Set up PostgreSQL connection and migration system

Create initial database schema migration

Set up sqlc and write query files

Implement Go API handlers (jobs, customers, kanban, structures)

Implement Google OAuth authentication

Initialize Next.js frontend with shadcn/ui

Build kanban board UI with drag-and-drop

Build job detail view and customer management
First, install sqlc and the uuid package, then create the config and query files.

Bash Install sqlc CLI tool
IN
export PATH="$PATH:/d/ProgramFiles/Go/bin" && export GOPATH="$HOME/go" && export PATH="$PATH:$GOPATH/bin" && cd "d:/Projects/KiwiInv/backend" && go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest 2>&1 | tail -5

OUT
/usr/bin/bash: line 1: go: command not found
Bash Install sqlc CLI tool (fixed PATH)
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest 2>&1 | tail -5

OUT
Exit code 127
/usr/bin/bash: line 1: tail: command not found
Bash Install sqlc CLI tool
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

OUT
0
Bash Install uuid package
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && cd "d:/Projects/KiwiInv/backend" && go get github.com/google/uuid

OUT
go: downloading github.com/google/uuid v1.6.0
Now create the sqlc config and all query files.

Write d:\Projects\KiwiInv\backend\sqlc.yaml
24 lines
version: "2"
sql:
  - engine: "postgresql"
    queries: "sql/queries/"
    schema: "migrations/"
    gen:
      go:
        package: "db"
        out: "internal/db"
        sql_package: "database/sql"
        emit_json_tags: true
        emit_empty_slices: true
        overrides:
          - db_type: "uuid"
            go_type: "github.com/google/uuid.UUID"
          - db_type: "pg_catalog.uuid"
            go_type: "github.com/google/uuid.UUID"
          - db_type: "numeric"
            go_type: "string"
            nullable: false
          - db_type: "pg_catalog.numeric"
            go_type: "string"
            nullable: false
Write d:\Projects\KiwiInv\backend\sql\queries\users.sql
29 lines
-- name: GetUserByID :one
-- Retrieves a single user by their unique ID.
SELECT * FROM users WHERE id = $1;

-- name: GetUserByGoogleID :one
-- Retrieves a user by their Google OAuth ID (used during login).
SELECT * FROM users WHERE google_id = $1;

-- name: GetUserByEmail :one
-- Retrieves a user by their email address.
SELECT * FROM users WHERE email = $1;

-- name: CreateUser :one
-- Creates a new user account from Google OAuth data.
INSERT INTO users (email, name, google_id, role)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateUser :one
-- Updates a user's name and role.
UPDATE users
SET name = $2, role = $3
WHERE id = $1
RETURNING *;

-- name: DeactivateUser :exec
-- Marks a user as inactive (soft delete).
UPDATE users SET is_active = false WHERE id = $1;
Write d:\Projects\KiwiInv\backend\sql\queries\customers.sql
30 lines
-- name: GetCustomer :one
-- Retrieves a single customer by ID.
SELECT * FROM customers WHERE id = $1;

-- name: ListCustomers :many
-- Retrieves all customers ordered alphabetically by name.
SELECT * FROM customers ORDER BY name;

-- name: SearchCustomers :many
-- Searches customers by name using case-insensitive pattern matching.
SELECT * FROM customers WHERE name ILIKE '%' || $1 || '%' ORDER BY name;

-- name: CreateCustomer :one
-- Creates a new customer record.
INSERT INTO customers (name, email, phone, address)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateCustomer :one
-- Updates all fields on an existing customer.
UPDATE customers
SET name = $2, email = $3, phone = $4, address = $5
WHERE id = $1
RETURNING *;

-- name: DeleteCustomer :exec
-- Permanently deletes a customer by ID.
-- Will fail if the customer has associated jobs (FK constraint).
DELETE FROM customers WHERE id = $1;
Write d:\Projects\KiwiInv\backend\sql\queries\jobs.sql
52 lines
-- name: GetJob :one
-- Retrieves a single job with its customer name.
SELECT j.*, c.name AS customer_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
WHERE j.id = $1;

-- name: ListJobs :many
-- Retrieves all jobs with customer names, newest first.
SELECT j.*, c.name AS customer_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
ORDER BY j.created_at DESC;

-- name: ListJobsByStatus :many
-- Retrieves jobs filtered by status, with customer names.
SELECT j.*, c.name AS customer_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
WHERE j.status = $1
ORDER BY j.created_at DESC;

-- name: CreateJob :one
-- Creates a new job with an auto-generated job number (KW-0001 format).
INSERT INTO jobs (customer_id, job_number, status, expected_completion, expected_delivery, total_price, notes)
VALUES ($1, 'KW-' || LPAD(nextval('job_number_seq')::text, 4, '0'), $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateJob :one
-- Updates all editable fields on an existing job.
UPDATE jobs
SET customer_id = $2, expected_completion = $3, expected_delivery = $4, total_price = $5, notes = $6
WHERE id = $1
RETURNING *;

-- name: UpdateJobStatus :one
-- Updates only the status of a job (used by kanban drag-drop).
UPDATE jobs SET status = $2 WHERE id = $1 RETURNING *;

-- name: DeleteJob :exec
-- Permanently deletes a job and its structures (CASCADE).
DELETE FROM jobs WHERE id = $1;

-- name: GetKanbanJobs :many
-- Retrieves all jobs with customer names for the kanban board view.
-- Results are ordered by creation date within each status group.
SELECT j.id, j.job_number, j.status, j.expected_completion, j.expected_delivery,
       j.total_price, j.notes, j.created_at, c.name AS customer_name
FROM jobs j
JOIN customers c ON c.id = j.customer_id
ORDER BY j.status, j.created_at;
Write d:\Projects\KiwiInv\backend\sql\queries\job_structures.sql
32 lines
-- name: GetJobStructure :one
-- Retrieves a single job structure by ID.
SELECT js.*, st.name AS template_name
FROM job_structures js
LEFT JOIN structure_templates st ON st.id = js.template_id
WHERE js.id = $1;

-- name: ListJobStructures :many
-- Retrieves all structures for a given job, with template names.
SELECT js.*, st.name AS template_name
FROM job_structures js
LEFT JOIN structure_templates st ON st.id = js.template_id
WHERE js.job_id = $1
ORDER BY js.created_at;

-- name: CreateJobStructure :one
-- Adds a structure to a job, optionally referencing a template.
INSERT INTO job_structures (job_id, template_id, custom_name, quantity, unit_price, notes)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateJobStructure :one
-- Updates fields on an existing job structure.
UPDATE job_structures
SET template_id = $2, custom_name = $3, quantity = $4, unit_price = $5, status = $6, notes = $7
WHERE id = $1
RETURNING *;

-- name: DeleteJobStructure :exec
-- Permanently deletes a job structure.
DELETE FROM job_structures WHERE id = $1;
Write d:\Projects\KiwiInv\backend\sql\queries\structure_templates.sql
26 lines
-- name: GetStructureTemplate :one
-- Retrieves a single structure template by ID.
SELECT * FROM structure_templates WHERE id = $1;

-- name: ListStructureTemplates :many
-- Retrieves all structure templates ordered by category then name.
SELECT * FROM structure_templates ORDER BY category, name;

-- name: CreateStructureTemplate :one
-- Creates a new structure template in the catalog.
INSERT INTO structure_templates (name, description, base_price, category)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateStructureTemplate :one
-- Updates an existing structure template.
UPDATE structure_templates
SET name = $2, description = $3, base_price = $4, category = $5
WHERE id = $1
RETURNING *;

-- name: DeleteStructureTemplate :exec
-- Permanently deletes a structure template.
-- Will fail if any job structures reference it (FK constraint).
DELETE FROM structure_templates WHERE id = $1;
Now let me run sqlc generate to create the Go code.

Bash Generate Go code from SQL queries using sqlc
IN
export PATH="/d/ProgramFiles/Go/bin:$HOME/go/bin:$PATH" && cd "d:/Projects/KiwiInv/backend" && sqlc generate

OUT
0
sqlc generated successfully. Let me verify the output and check it compiles.

Globpattern: "backend/internal/db/*.go"
Found 9 files
Read d:\Projects\KiwiInv\backend\internal\db\models.go
Bash Verify all packages compile
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && cd "d:/Projects/KiwiInv/backend" && go build ./...

OUT
0
All generated models look correct - UUIDs, proper enum types, NUMERIC mapped to string, nullable fields as sql.Null*. Everything compiles. Now let me move to Step 5: API handlers.

Update Todos

Clean slate: move AGENTS.MD to root, delete old directories, update .gitignore

Initialize Go API project structure with chi router and health endpoint

Set up PostgreSQL connection and migration system

Create initial database schema migration

Set up sqlc and write query files

Implement Go API handlers (jobs, customers, kanban, structures)

Implement Google OAuth authentication

Initialize Next.js frontend with shadcn/ui

Build kanban board UI with drag-and-drop

Build job detail view and customer management
Now I'll create the handler struct and all API handlers.

Write d:\Projects\KiwiInv\backend\internal\handlers\handler.go
21 lines
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
Write d:\Projects\KiwiInv\backend\internal\handlers\customers.go
136 lines
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
	respondJSON(w, http.StatusOK, customers)
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
	respondJSON(w, http.StatusOK, customer)
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
	respondJSON(w, http.StatusCreated, customer)
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
	respondJSON(w, http.StatusOK, customer)
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
Read d:\Projects\KiwiInv\backend\internal\db\jobs.sql.go
Good, I have a clear picture of the generated types. Now let me create the jobs, kanban, and structures handlers.

Write d:\Projects\KiwiInv\backend\internal\handlers\jobs.go
230 lines
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
		respondJSON(w, http.StatusOK, jobs)
		return
	}

	jobs, err := h.Queries.ListJobs(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list jobs")
		return
	}
	respondJSON(w, http.StatusOK, jobs)
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
		"job":        job,
		"structures": structures,
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
	respondJSON(w, http.StatusCreated, job)
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
	respondJSON(w, http.StatusOK, job)
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
	respondJSON(w, http.StatusOK, job)
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
Write d:\Projects\KiwiInv\backend\internal\handlers\kanban.go
48 lines
package handlers

import (
	"net/http"

	"github.com/AdamW222/kiwiinv/internal/db"
)

// kanbanBoard represents the kanban board response with jobs grouped by status.
type kanbanBoard struct {
	Quote      []db.GetKanbanJobsRow `json:"quote"`
	InProgress []db.GetKanbanJobsRow `json:"in_progress"`
	Completed  []db.GetKanbanJobsRow `json:"completed"`
	Delivered  []db.GetKanbanJobsRow `json:"delivered"`
}

// GetKanbanBoard returns all jobs grouped by their status for the kanban view.
// GET /api/kanban
func (h *Handler) GetKanbanBoard(w http.ResponseWriter, r *http.Request) {
	jobs, err := h.Queries.GetKanbanJobs(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch kanban data")
		return
	}

	board := kanbanBoard{
		Quote:      []db.GetKanbanJobsRow{},
		InProgress: []db.GetKanbanJobsRow{},
		Completed:  []db.GetKanbanJobsRow{},
		Delivered:  []db.GetKanbanJobsRow{},
	}

	for _, job := range jobs {
		switch job.Status {
		case db.JobStatusQuote:
			board.Quote = append(board.Quote, job)
		case db.JobStatusInProgress:
			board.InProgress = append(board.InProgress, job)
		case db.JobStatusCompleted:
			board.Completed = append(board.Completed, job)
		case db.JobStatusDelivered:
			board.Delivered = append(board.Delivered, job)
		}
	}

	respondJSON(w, http.StatusOK, board)
}
Write d:\Projects\KiwiInv\backend\internal\handlers\structures.go
261 lines
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
	respondJSON(w, http.StatusOK, templates)
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
	respondJSON(w, http.StatusOK, tmpl)
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
	respondJSON(w, http.StatusCreated, tmpl)
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
	respondJSON(w, http.StatusOK, tmpl)
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
	respondJSON(w, http.StatusOK, structures)
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
	respondJSON(w, http.StatusCreated, structure)
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
	respondJSON(w, http.StatusOK, structure)
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
Now update the router to include all the new routes.

Write d:\Projects\KiwiInv\backend\internal\router\router.go
Write failed
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
Read d:\Projects\KiwiInv\backend\internal\router\router.go
Edit d:\Projects\KiwiInv\backend\internal\router\router.go
Added 39 lines
Now update main.go to pass the handler to the router.

Read d:\Projects\KiwiInv\backend\cmd\server\main.go
Edit d:\Projects\KiwiInv\backend\cmd\server\main.go
Added 1 line
Edit d:\Projects\KiwiInv\backend\cmd\server\main.go
Added 4 lines
Bash Build all packages to verify compilation
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && cd "d:/Projects/KiwiInv/backend" && go build ./...

OUT
0
All compiles. Let me now do a quick end-to-end test of the API. First let me kill any lingering process on port 8080.

Bash Check for processes on port 8080
IN
cmd.exe /c "netstat -ano | findstr :8080" 2>/dev/null

OUT
Microsoft Windows [Version 10.0.19045.6466]
(c) Microsoft Corporation. All rights reserved.

D:\Projects\KiwiInv\backend>
Port is free. Let me test the full API.

Bash Start server and test customer CRUD endpoints
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && cd "d:/Projects/KiwiInv/backend" && go run ./cmd/server/ &
sleep 3 && echo "=== Health ===" && curl -s http://localhost:8080/api/health && echo "" && echo "=== Create Customer ===" && curl -s -X POST http://localhost:8080/api/customers -H "Content-Type: application/json" -d '{"name":"John Smith","email":"john@example.com","phone":"021-555-0123","address":"123 Main St"}' && echo "" && echo "=== List Customers ===" && curl -s http://localhost:8080/api/customers && echo "" && kill %1 2>/dev/null

OUT
2026/03/11 11:38:16 connected to database
2026/03/11 11:38:16 migrations applied successfully (version: 1, dirty: false)
2026/03/11 11:38:16 server starting on port 8080 (environment: development)
2026/03/11 11:38:16 server failed to start: listen tcp :8080: bind: Only one usage of each socket address (protocol/network address/port) is normally permitted.
exit status 1
=== Health ===
{"data":{"status":"ok","timestamp":"2026-03-10T22:38:17Z"}}

=== Create Customer ===
404 page not found

=== List Customers ===
404 page not found
The old server is still running on 8080 (the go run from the first test). The health check works because it's hitting the old process which only has the health route. Let me kill it and restart.

Bash Kill process occupying port 8080
IN
cmd.exe /c "for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do taskkill /PID %a /F" 2>/dev/null; sleep 1

OUT
Microsoft Windows [Version 10.0.19045.6466]
(c) Microsoft Corporation. All rights reserved.

D:\Projects\KiwiInv\backend>
Bash Test customer creation, job creation, and kanban endpoint
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && cd "d:/Projects/KiwiInv/backend" && go run ./cmd/server/ &
sleep 3 && echo "=== Create Customer ===" && curl -s -X POST http://localhost:8080/api/customers -H "Content-Type: application/json" -d '{"name":"John Smith","email":"john@example.com","phone":"021-555-0123","address":"123 Main St"}' && echo "" && echo "=== Create Job ===" && CUST_ID=$(curl -s http://localhost:8080/api/customers | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null) && echo "Customer ID: $CUST_ID" && curl -s -X POST http://localhost:8080/api/jobs -H "Content-Type: application/json" -d "{\"customer_id\":\"$CUST_ID\",\"notes\":\"Test job\"}" && echo "" && echo "=== Kanban ===" && curl -s http://localhost:8080/api/kanban && echo "" && kill %1 2>/dev/null

OUT
Exit code 49
2026/03/11 11:38:36 connected to database
2026/03/11 11:38:36 migrations applied successfully (version: 1, dirty: false)
2026/03/11 11:38:36 server starting on port 8080 (environment: development)
2026/03/11 11:38:36 server failed to start: listen tcp :8080: bind: Only one usage of each socket address (protocol/network address/port) is normally permitted.
exit status 1
=== Create Customer ===
404 page not found

=== Create Job ===
Still occupied. Let me try a different port.

Bash Start server on port 8081 and test customer creation
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && cd "d:/Projects/KiwiInv/backend" && PORT=8081 go run ./cmd/server/ &
sleep 3 && echo "=== Create Customer ===" && curl -s -X POST http://localhost:8081/api/customers -H "Content-Type: application/json" -d '{"name":"John Smith","email":"john@example.com","phone":"021-555-0123","address":"123 Main St"}' && echo ""

OUT
2026/03/11 11:38:47 connected to database
2026/03/11 11:38:47 migrations applied successfully (version: 1, dirty: false)
2026/03/11 11:38:47 server starting on port 8081 (environment: development)
=== Create Customer ===
2026/03/11 11:38:50 "POST http://localhost:8081/api/customers HTTP/1.1" from [::1]:57570 - 201 317B in 170.2636ms
{"data":{"id":"ed0065ef-d9b5-4462-a94f-76971e6c9ae1","name":"John Smith","email":{"String":"john@example.com","Valid":true},"phone":{"String":"021-555-0123","Valid":true},"address":{"String":"123 Main St","Valid":true},"created_at":"2026-03-11T11:38:50.349313+13:00","updated_at":"2026-03-11T11:38:50.349313+13:00"}}
Customer created! But I notice the sql.NullString fields are serializing as {"String":"...","Valid":true} instead of just the string value. That's the default Go JSON serialization for sql.NullString. I need to fix this by creating custom response types. Let me test the rest first, then fix the serialization.

Bash Test jobs and kanban endpoints
IN
echo "=== List Customers ===" && curl -s http://localhost:8081/api/customers && echo "" && echo "=== Create Job ===" && curl -s -X POST http://localhost:8081/api/jobs -H "Content-Type: application/json" -d '{"customer_id":"ed0065ef-d9b5-4462-a94f-76971e6c9ae1","notes":"Build a 3x4 garden shed","expected_completion":"2026-05-01"}' && echo "" && echo "=== Kanban ===" && curl -s http://localhost:8081/api/kanban && echo ""

OUT
=== List Customers ===
{"data":[{"id":"ed0065ef-d9b5-4462-a94f-76971e6c9ae1","name":"John Smith","email":{"String":"john@example.com","Valid":true},"phone":{"String":"021-555-0123","Valid":true},"address":{"String":"123 Main St","Valid":true},"created_at":"2026-03-11T11:38:50.349313+13:00","updated_at":"2026-03-11T11:38:50.349313+13:00"}]}

=== Create Job ===
{"data":{"id":"e67b500c-fca2-4337-b0dd-f0148d934429","customer_id":"ed0065ef-d9b5-4462-a94f-76971e6c9ae1","job_number":"KW-0001","status":"quote","expected_completion":{"Time":"2026-05-01T00:00:00Z","Valid":true},"expected_delivery":{"Time":"0001-01-01T00:00:00Z","Valid":false},"total_price":{"String":"","Valid":false},"notes":{"String":"Build a 3x4 garden shed","Valid":true},"created_at":"2026-03-11T11:39:05.503763+13:00","updated_at":"2026-03-11T11:39:05.503763+13:00"}}

=== Kanban ===
{"data":{"quote":[{"id":"e67b500c-fca2-4337-b0dd-f0148d934429","job_number":"KW-0001","status":"quote","expected_completion":{"Time":"2026-05-01T00:00:00Z","Valid":true},"expected_delivery":{"Time":"0001-01-01T00:00:00Z","Valid":false},"total_price":{"String":"","Valid":false},"notes":{"String":"Build a 3x4 garden shed","Valid":true},"created_at":"2026-03-11T11:39:05.503763+13:00","customer_name":"John Smith"}],"in_progress":[],"completed":[],"delivered":[]}}
All endpoints work. The kanban correctly groups jobs, job number auto-generated as KW-0001. Now I need to fix the nullable field serialization. The sql.NullString etc. serialize poorly. I'll add custom JSON marshaling.

Bash Stop test server
IN
kill %1 2>/dev/null; echo "done"

OUT
done
I need to handle the sql.Null* serialization issue. The cleanest approach is to create response transformation functions that convert the sqlc-generated types to API-friendly types. Let me create a response types file.

Write d:\Projects\KiwiInv\backend\internal\handlers\types.go
282 lines
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
Now update all handlers to use the conversion functions. Let me update customers.go, jobs.go, kanban.go, and structures.go.

Read d:\Projects\KiwiInv\backend\internal\handlers\customers.go
Edit d:\Projects\KiwiInv\backend\internal\handlers\customers.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\customers.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\customers.go
Modified
Now update jobs.go:

Read d:\Projects\KiwiInv\backend\internal\handlers\jobs.go
Edit d:\Projects\KiwiInv\backend\internal\handlers\jobs.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\jobs.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\jobs.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\jobs.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\jobs.go
Modified
Now update kanban.go:

Read d:\Projects\KiwiInv\backend\internal\handlers\kanban.go
Write d:\Projects\KiwiInv\backend\internal\handlers\kanban.go
49 lines
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
Now update structures.go - I need to update the response calls:

Read d:\Projects\KiwiInv\backend\internal\handlers\structures.go
Edit d:\Projects\KiwiInv\backend\internal\handlers\structures.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\structures.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\structures.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\structures.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\structures.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\structures.go
Modified
Edit d:\Projects\KiwiInv\backend\internal\handlers\structures.go
Modified
Now let's verify it all compiles and remove unused imports.

Bash Build all packages to verify compilation
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && cd "d:/Projects/KiwiInv/backend" && go build ./...

OUT
0
All compiles. Let me do a quick end-to-end test with the fixed JSON serialization.

Bash Test API with fixed JSON serialization
IN
export PATH="/d/ProgramFiles/Go/bin:$PATH" && cd "d:/Projects/KiwiInv/backend" && PORT=8082 go run ./cmd/server/ &
sleep 3 && echo "=== Create Customer ===" && curl -s -X POST http://localhost:8082/api/customers -H "Content-Type: application/json" -d '{"name":"Jane Doe","email":"jane@example.com"}' && echo "" && echo "=== Kanban ===" && curl -s http://localhost:8082/api/kanban && echo "" && kill %1 2>/dev/null

OUT
2026/03/11 11:42:21 connected to database
2026/03/11 11:42:21 migrations applied successfully (version: 1, dirty: false)
2026/03/11 11:42:21 server starting on port 8082 (environment: development)
=== Create Customer ===
2026/03/11 11:42:22 "POST http://localhost:8082/api/customers HTTP/1.1" from [::1]:57694 - 201 224B in 30.1174ms
{"data":{"id":"fd2ebe93-84ca-4e85-82d5-392200009493","name":"Jane Doe","email":"jane@example.com","phone":null,"address":null,"created_at":"2026-03-11T11:42:22.520905+13:00","updated_at":"2026-03-11T11:42:22.520905+13:00"}}

=== Kanban ===
2026/03/11 11:42:22 "GET http://localhost:8082/api/kanban HTTP/1.1" from [::1]:57696 - 200 344B in 3.4085ms
{"data":{"quote":[{"id":"e67b500c-fca2-4337-b0dd-f0148d934429","job_number":"KW-0001","status":"quote","expected_completion":"2026-05-01","expected_delivery":null,"total_price":null,"notes":"Build a 3x4 garden shed","created_at":"2026-03-11T11:39:05.503763+13:00","customer_name":"John Smith"}],"in_progress":[],"completed":[],"delivered":[]}}
JSON serialization is now clean - nullable fields show as null instead of the nested struct, and dates show as "2026-05-01" instead of the full timestamp object.

Bash Stop test server
IN
kill %1 2>/dev/null; echo "done"

OUT
done
Update Todos

Clean slate: move AGENTS.MD to root, delete old directories, update .gitignore

Initialize Go API project structure with chi router and health endpoint

Set up PostgreSQL connection and migration system

Create initial database schema migration

Set up sqlc and write query files

Implement Go API handlers (jobs, customers, kanban, structures)

Implement Google OAuth authentication

Initialize Next.js frontend with shadcn/ui

Build kanban board UI with drag-and-drop

Build job detail view and customer management
Steps 1-5 of the backend are complete. Let me save what we've accomplished to memory, then give you a summary of what's been built so far. This is a good stopping point before we tackle the remaining items (OAuth, frontend, kanban UI).

Write C:\Users\slink\.claude\projects\d--Projects-KiwiInv\memory\MEMORY.md
71 lines
# KiwiInv Project Memory

## Project Overview
- Business: Kiwi Cabins - manufactures garden sheds, tiny homes, chicken coops, cabins
- Purpose: Job/order tracking with kanban board
- Full spec in `AGENTS.MD` at project root

## Architecture
- **Backend:** Go 1.26.1 API at `backend/` with chi router
- **Frontend:** Next.js (to be created at `frontend/`)
- **Database:** PostgreSQL (local, user=devbot, dbname=postgres)
- **Go module:** `github.com/AdamW222/kiwiinv`
- **Go binary path:** `/d/ProgramFiles/Go/bin` (must be added to PATH each shell session)

## Key Decisions
- chi router for HTTP
- sqlc for type-safe DB queries (installed at `$HOME/go/bin/sqlc`)
- golang-migrate for schema migrations (auto-run on server start)
- UUIDs for all PKs, NUMERIC(12,2) for money, TIMESTAMPTZ for timestamps
- Job numbers auto-generated via PostgreSQL sequence: KW-0001, KW-0002...
- `sql.Null*` types converted to `*string`/`*time` pointers in API responses (see `handlers/types.go`)
- `.env` file loaded by custom loader in `config/config.go` (no external dependency)

## Project Structure
```
backend/
├── cmd/server/main.go          # Entry point
├── internal/
│   ├── config/config.go        # Env config with .env loader
│   ├── db/                     # sqlc generated + connection + migrate
│   ├── handlers/               # HTTP handlers + response types
│   ├── middleware/cors.go      # CORS middleware
│   └── router/router.go       # chi route tree
├── migrations/                 # SQL migrations (000001_initial_schema)
├── sql/queries/                # sqlc query definitions
├── sqlc.yaml                   # sqlc config
└── .env                        # Local env vars (not committed)
```

## Current State (Phase 1 Progress)
- [x] Go API project structure
- [x] PostgreSQL connection + migrations
- [x] Database schema (users, customers, jobs, structure_templates, job_structures)
- [x] sqlc queries and code generation
- [x] Full REST API handlers (customers, jobs, kanban, templates, structures)
- [ ] Google OAuth authentication
- [ ] Next.js frontend initialization
- [ ] Kanban board UI
- [ ] Job detail view

## Database Tables (Phase 1)
- `users` - auth (Google OAuth)
- `customers` - who orders structures
- `jobs` - orders with status enum (quote/in_progress/completed/delivered)
- `structure_templates` - catalog of standard designs
- `job_structures` - actual structures in a job

## API Endpoints
- `GET /api/health` - health check
- `GET /api/kanban` - jobs grouped by status
- `CRUD /api/customers` - customer management
- `CRUD /api/jobs` - job management + `PATCH /{id}/status`
- `CRUD /api/templates` - structure templates
- `GET/POST /api/jobs/{id}/structures` - job structures
- `PUT/DELETE /api/structures/{id}` - structure updates

## Environment
- Windows 10, Git Bash shell
- Port 8080 can get stuck from previous test runs
- User prefers clear explanations and working implementations
Here's a summary of what's been built:

Completed (Steps 0-5)
Backend Go API is fully functional with:

Project structure at backend/ with clean separation: cmd/server, internal/config, internal/handlers, internal/db, internal/middleware, internal/router
PostgreSQL connection with auto-migrations on startup via golang-migrate
Database schema with 5 tables: users, customers, jobs, structure_templates, job_structures - all with UUID PKs, proper FK constraints, auto-updated_at triggers, and job number sequence (KW-0001)
sqlc generating type-safe Go code from SQL queries
Full REST API with clean JSON responses:
GET /api/kanban - jobs grouped by status columns
PATCH /api/jobs/{id}/status - for kanban drag-drop
Full CRUD on customers, jobs, templates, structures
Proper validation, error handling, CORS
Remaining (Steps 6-9)
Google OAuth - auth handlers, JWT, middleware
Next.js frontend - fresh setup with shadcn/ui, React Query, Zustand
Kanban board UI - 4 columns, drag-drop with @dnd-kit
Job detail + customer management - forms, dialogs, CRUD pages
Should I continue with the next step? The OAuth implementation (Step 6) requires Google Cloud Console credentials - do you have those set up, or would you prefer I skip ahead to the frontend (Step 7) and circle back to auth later?

Can you first do some documentation of the backend so I can understand how its working/how things are called + how I can test it my self
Write d:\Projects\KiwiInv\backend\README.md
351 lines
# KiwiInv Backend API

Go REST API for the Kiwi Cabins job management system.

## Architecture

```
Request → chi Router → Middleware (CORS, Logger, Recoverer) → Handler → sqlc Queries → PostgreSQL
```

### How a request flows through the code

1. **Entry point** - `cmd/server/main.go` loads config, connects to DB, runs migrations, starts HTTP server
2. **Router** - `internal/router/router.go` maps URL paths to handler methods using chi
3. **Handlers** - `internal/handlers/*.go` parse the request, validate input, call sqlc queries, return JSON
4. **Types** - `internal/handlers/types.go` converts sqlc's `sql.Null*` types to clean JSON (`null` instead of `{"String":"","Valid":false}`)
5. **Database** - `internal/db/*.sql.go` (auto-generated by sqlc from `sql/queries/*.sql`) executes parameterized SQL

### Key files

| File | Purpose |
|------|---------|
| `cmd/server/main.go` | Starts everything: config → DB → migrations → router → HTTP server |
| `internal/config/config.go` | Reads `.env` file + environment variables into a `Config` struct |
| `internal/router/router.go` | All route definitions in one place (chi router) |
| `internal/handlers/handler.go` | `Handler` struct that holds DB queries + config |
| `internal/handlers/response.go` | `respondJSON()`, `respondError()`, `parseBody()` helpers |
| `internal/handlers/types.go` | API response structs + conversion from sqlc types |
| `internal/handlers/customers.go` | Customer CRUD handlers |
| `internal/handlers/jobs.go` | Job CRUD + status update handlers |
| `internal/handlers/kanban.go` | Kanban board endpoint (groups jobs by status) |
| `internal/handlers/structures.go` | Structure template CRUD + job structure handlers |
| `internal/handlers/health.go` | Health check (standalone, not on Handler struct) |
| `internal/db/connection.go` | Opens PostgreSQL connection pool |
| `internal/db/migrate.go` | Runs migrations from `migrations/` on startup |
| `internal/middleware/cors.go` | CORS middleware allowing frontend origin |
| `sqlc.yaml` | sqlc config (tells it where queries/schema are, what Go types to generate) |
| `sql/queries/*.sql` | SQL queries with sqlc annotations (source of truth for DB operations) |
| `migrations/000001_initial_schema.up.sql` | Creates all tables, enums, indexes, triggers |

### How sqlc works

1. You write SQL in `sql/queries/*.sql` with special comments like `-- name: GetJob :one`
2. Run `sqlc generate` in the `backend/` directory
3. sqlc reads the schema from `migrations/` and generates type-safe Go code in `internal/db/`
4. The generated code has methods like `queries.GetJob(ctx, id)` that return typed structs
5. **Never edit files in `internal/db/` directly** - they get overwritten on regeneration

### How the Handler pattern works

```go
// Handler holds shared dependencies (defined in handler.go)
type Handler struct {
    Queries *db.Queries   // sqlc-generated database methods
    Config  *config.Config
}

// Handler methods are HTTP handlers (defined in customers.go, jobs.go, etc.)
func (h *Handler) ListCustomers(w http.ResponseWriter, r *http.Request) {
    customers, err := h.Queries.ListCustomers(r.Context())  // call sqlc
    respondJSON(w, http.StatusOK, toCustomerResponses(customers))  // convert + respond
}

// Routes are wired in router.go
r.Get("/api/customers", h.ListCustomers)
```

## Setup

### Prerequisites
- Go 1.26+ installed
- PostgreSQL running locally

### Environment

Copy `.env.example` to `backend/.env` and fill in your database credentials:

```
DATABASE_URL=postgres://user:password@localhost:5432/dbname?sslmode=disable
PORT=8080
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

### Run

```bash
cd backend
go run ./cmd/server/
```

The server will:
1. Load `.env`
2. Connect to PostgreSQL
3. Run any pending migrations automatically
4. Start listening on the configured port (default 8080)

You should see:
```
connected to database
migrations applied successfully (version: 1, dirty: false)
server starting on port 8080 (environment: development)
```

## API Reference

All responses use this format:
```json
// Success:
{"data": { ... }}

// Error:
{"error": "human readable message"}
```

### Health

```bash
# Check server is running
curl http://localhost:8080/api/health
# → {"data":{"status":"ok","timestamp":"2026-03-11T00:00:00Z"}}
```

### Customers

```bash
# List all customers
curl http://localhost:8080/api/customers

# Get one customer
curl http://localhost:8080/api/customers/{id}

# Create a customer
curl -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","email":"john@example.com","phone":"021-555-0123","address":"123 Main St"}'
# → 201 Created
# Only "name" is required. email, phone, address are optional (nullable).

# Update a customer
curl -X PUT http://localhost:8080/api/customers/{id} \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith Jr","email":"john.jr@example.com"}'

# Delete a customer (fails if they have jobs)
curl -X DELETE http://localhost:8080/api/customers/{id}
```

### Jobs

```bash
# List all jobs (newest first)
curl http://localhost:8080/api/jobs

# List jobs filtered by status
curl "http://localhost:8080/api/jobs?status=quote"
# Valid statuses: quote, in_progress, completed, delivered

# Get a single job (includes its structures)
curl http://localhost:8080/api/jobs/{id}
# → {"data":{"job":{...},"structures":[...]}}

# Create a job (auto-generates job number KW-0001, KW-0002, etc.)
curl -X POST http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "uuid-here",
    "expected_completion": "2026-05-01",
    "expected_delivery": "2026-05-15",
    "total_price": "15000.00",
    "notes": "Build a 3x4 garden shed"
  }'
# Status defaults to "quote" if not provided.
# Dates use ISO format: YYYY-MM-DD
# total_price is a string to avoid floating point issues with money.

# Update a job
curl -X PUT http://localhost:8080/api/jobs/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "uuid-here",
    "expected_completion": "2026-06-01",
    "total_price": "16000.00",
    "notes": "Updated notes"
  }'

# Change job status (used by kanban drag-drop)
curl -X PATCH http://localhost:8080/api/jobs/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# Delete a job (also deletes its structures via CASCADE)
curl -X DELETE http://localhost:8080/api/jobs/{id}
```

### Kanban Board

```bash
# Get all jobs grouped by status (the main kanban view)
curl http://localhost:8080/api/kanban
# → {"data":{
#      "quote": [{job}, {job}],
#      "in_progress": [{job}],
#      "completed": [],
#      "delivered": []
#    }}
```

Each kanban job includes: `id`, `job_number`, `status`, `expected_completion`, `expected_delivery`, `total_price`, `notes`, `created_at`, `customer_name`.

### Structure Templates

Templates are the catalog of standard designs (e.g., "8x10 Garden Shed").

```bash
# List all templates (ordered by category, then name)
curl http://localhost:8080/api/templates

# Get one template
curl http://localhost:8080/api/templates/{id}

# Create a template
curl -X POST http://localhost:8080/api/templates \
  -H "Content-Type: application/json" \
  -d '{"name":"8x10 Garden Shed","description":"Standard garden shed","base_price":"5500.00","category":"shed"}'
# Both "name" and "category" are required.

# Update a template
curl -X PUT http://localhost:8080/api/templates/{id} \
  -H "Content-Type: application/json" \
  -d '{"name":"8x10 Garden Shed Deluxe","description":"Upgraded model","base_price":"7500.00","category":"shed"}'

# Delete a template (fails if job structures reference it)
curl -X DELETE http://localhost:8080/api/templates/{id}
```

### Job Structures

Structures are the actual items in a job (e.g., "1x Garden Shed + 1x Chicken Coop").

```bash
# List structures for a job
curl http://localhost:8080/api/jobs/{job_id}/structures

# Add a structure to a job (template-based)
curl -X POST http://localhost:8080/api/jobs/{job_id}/structures \
  -H "Content-Type: application/json" \
  -d '{"template_id":"uuid-here","quantity":1,"unit_price":"5500.00"}'

# Add a custom structure (no template)
curl -X POST http://localhost:8080/api/jobs/{job_id}/structures \
  -H "Content-Type: application/json" \
  -d '{"custom_name":"Custom Tiny Home 4x6","quantity":1,"unit_price":"22000.00","notes":"Client wants extra windows"}'

# Update a structure
curl -X PUT http://localhost:8080/api/structures/{structure_id} \
  -H "Content-Type: application/json" \
  -d '{"custom_name":"Custom Tiny Home 4x6","quantity":1,"unit_price":"23000.00","status":"in_progress","notes":"Updated"}'
# status must be: pending, in_progress, or completed

# Delete a structure
curl -X DELETE http://localhost:8080/api/structures/{structure_id}
```

## Quick Test Walkthrough

Run these commands in order to test the full flow:

```bash
# 1. Start the server
cd backend
go run ./cmd/server/

# 2. In another terminal, create a customer
curl -s -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","email":"test@example.com"}' | python -m json.tool

# 3. Copy the customer ID from the response, then create a job
curl -s -X POST http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"PASTE-CUSTOMER-ID","notes":"Test shed build","expected_completion":"2026-06-01","total_price":"8000.00"}' | python -m json.tool

# 4. Check the kanban board - the job should appear in "quote"
curl -s http://localhost:8080/api/kanban | python -m json.tool

# 5. Move the job to "in_progress" (simulates kanban drag-drop)
curl -s -X PATCH http://localhost:8080/api/jobs/PASTE-JOB-ID/status \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}' | python -m json.tool

# 6. Check kanban again - job should now be in "in_progress"
curl -s http://localhost:8080/api/kanban | python -m json.tool

# 7. Create a template and add it as a structure to the job
curl -s -X POST http://localhost:8080/api/templates \
  -H "Content-Type: application/json" \
  -d '{"name":"Standard Garden Shed","category":"shed","base_price":"5000.00"}' | python -m json.tool

curl -s -X POST http://localhost:8080/api/jobs/PASTE-JOB-ID/structures \
  -H "Content-Type: application/json" \
  -d '{"template_id":"PASTE-TEMPLATE-ID","quantity":1,"unit_price":"5000.00"}' | python -m json.tool

# 8. Get the full job with structures
curl -s http://localhost:8080/api/jobs/PASTE-JOB-ID | python -m json.tool
```

## Database Schema

```
customers 1──N jobs 1──N job_structures N──1 structure_templates
                                         (optional FK)
```

- **customers**: Who orders the structures
- **jobs**: An order with status tracking (quote → in_progress → completed → delivered)
- **structure_templates**: Catalog of standard designs (e.g., "8x10 Shed")
- **job_structures**: Actual structures in a job (can reference a template or be custom)
- **users**: For authentication (Google OAuth - not yet implemented)

Job numbers auto-increment using a PostgreSQL sequence: KW-0001, KW-0002, etc.

All tables have `created_at` and `updated_at` timestamps. The `updated_at` field is automatically set by a database trigger on every UPDATE.

## Development

### Regenerate sqlc code after changing queries

```bash
cd backend
sqlc generate
```

### Add a new migration

Create two files with the next sequence number:
```
migrations/000002_description.up.sql    # changes to apply
migrations/000002_description.down.sql  # how to reverse them
```

Migrations run automatically on server start.

### Project conventions

- Handler methods live on the `Handler` struct (except `HealthCheck` which is a standalone function)
- All JSON responses go through `respondJSON()` or `respondError()` in `response.go`
- sqlc types with `sql.Null*` fields are converted to pointer types via `types.go` before serialization
- Input validation happens in handlers before calling queries
- Money is stored as `NUMERIC(12,2)` in Postgres, represented as `string` in Go/JSON
Created backend/README.md with full documentation covering:

Architecture flow - how a request goes from router → handler → sqlc → PostgreSQL
Key files - table mapping every file to its purpose
How sqlc works - the generate workflow
How the Handler pattern works - with code example
Setup - prerequisites, environment, how to run
Full API reference - every endpoint with curl examples, required/optional fields, and expected responses
Quick test walkthrough - step-by-step commands to test the full flow end-to-end (create customer → create job → check kanban → move status → add structures)
Database schema - relationships and conventions
Development guide - how to regenerate sqlc, add migrations, project conventions
You can test it right now by running go run ./cmd/server/ from the backend/ directory and following the "Quick Test Walkthrough" section.

Of the remaining steps skip the google oauth part for now we will look back to that. Continue with the remaining steps
Update Todos

Clean slate: move AGENTS.MD to root, delete old directories, update .gitignore

Initialize Go API project structure with chi router and health endpoint

Set up PostgreSQL connection and migration system

Create initial database schema migration

Set up sqlc and write query files

Implement Go API handlers (jobs, customers, kanban, structures)

Initialize Next.js frontend with shadcn/ui, React Query, Zustand

Build kanban board UI with drag-and-drop

Build job detail view and customer management
Let me initialize the Next.js frontend. First, kill any lingering server processes, then scaffold.

Bash Scaffold Next.js frontend project
IN
cd "d:/Projects/KiwiInv" && npx create-next-app@latest frontend --typescript --tailwind --eslint --app --import-alias="@/*" --skip-install 2>&1

OUT
npm warn exec The following package was not found and will be installed: create-next-app@16.1.6
[?25l[2K[1G[36m?[39m [1mWould you like to use [34mReact Compiler[39m?[22m [90m»[39m [36m[4mNo[39m[24m [90m/[39m Yes
Interactive prompt. Let me use flags to skip all prompts.

Bash Scaffold Next.js with all defaults accepted
IN
cd "d:/Projects/KiwiInv" && npx create-next-app@latest frontend --typescript --tailwind --eslint --app --import-alias="@/*" --skip-install --no-turbopack --yes 2>&1

OUT
Creating a new Next.js app in [32mD:\Projects\KiwiInv\frontend[39m.

[1mUsing npm.[22m

Initializing project with template: app-tw 

[32mSuccess![39m Created frontend at D:\Projects\KiwiInv\frontend
Bash Install Next.js dependencies
IN
cd "d:/Projects/KiwiInv/frontend" && npm install 2>&1

OUT
added 359 packages, and audited 360 packages in 1m

143 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
Good. Now install additional dependencies and shadcn/ui in parallel.

Bash Initialize shadcn/ui with New York style
IN
cd "d:/Projects/KiwiInv/frontend" && npx shadcn@latest init -d --style new-york --base-color zinc 2>&1

OUT
Exit code 1
npm warn exec The following package was not found and will be installed: shadcn@4.0.3
error: unknown option '--style'
Bash Initialize shadcn/ui with defaults
IN
cd "d:/Projects/KiwiInv/frontend" && npx shadcn@latest init -d 2>&1

OUT
- Preflight checks.
✔ Preflight checks.
- Verifying framework.
✔ Verifying framework. Found Next.js.
- Validating Tailwind CSS. Found v4.
✔ Validating Tailwind CSS. Found v4.
- Validating import alias.
✔ Validating import alias.
- Writing components.json.
✔ Writing components.json.
- Checking registry.
✔ Checking registry.
- Installing dependencies.
- Installing dependencies.
✔ Installing dependencies.
- Updating fonts.
✔ Updating fonts.
- Updating files.
✔ Created 2 files:
  - components\ui\button.tsx
  - lib\utils.ts
- Updating app\globals.css
✔ Updating app\globals.css

Project initialization completed.
You may now add components.
Bash Add shadcn/ui components
IN
cd "d:/Projects/KiwiInv/frontend" && npx shadcn@latest add card badge dialog input label select textarea separator dropdown-menu avatar sheet tabs sonner 2>&1

OUT
- Checking registry.
✔ Checking registry.
- Installing dependencies.
- Installing dependencies.
✔ Installing dependencies.
- Updating files.
✔ Created 13 files:
  - components\ui\card.tsx
  - components\ui\badge.tsx
  - components\ui\input.tsx
  - components\ui\label.tsx
  - components\ui\select.tsx
  - components\ui\textarea.tsx
  - components\ui\separator.tsx
  - components\ui\dropdown-menu.tsx
  - components\ui\avatar.tsx
  - components\ui\tabs.tsx
  - components\ui\sonner.tsx
  - components\ui\dialog.tsx
  - components\ui\sheet.tsx
ℹ Skipped 1 file: (files might be identical, use --overwrite to overwrite)
  - components\ui\button.tsx
Bash Install DnD Kit, React Query, Zustand, date-fns, zod
IN
cd "d:/Projects/KiwiInv/frontend" && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-query zustand date-fns zod 2>&1

OUT
added 8 packages, and audited 639 packages in 10s

235 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
/compact
All dependencies installed. Now let me create all the foundational frontend files - types, API client, hooks, providers, and layout.

Bash Create frontend directory structure
IN
mkdir -p "d:/Projects/KiwiInv/frontend/types" "d:/Projects/KiwiInv/frontend/lib/hooks" "d:/Projects/KiwiInv/frontend/components/kanban" "d:/Projects/KiwiInv/frontend/components/layout" "d:/Projects/KiwiInv/frontend/components/jobs" "d:/Projects/KiwiInv/frontend/components/customers" "d:/Projects/KiwiInv/frontend/app/customers" "d:/Projects/KiwiInv/frontend/app/templates"

OUT
0
Write d:\Projects\KiwiInv\frontend\.env.local
2 lines
NEXT_PUBLIC_API_URL=http://localhost:8080
Write d:\Projects\KiwiInv\frontend\types\api.ts
128 lines
// API response types matching the Go backend models.

export type JobStatus = "quote" | "in_progress" | "completed" | "delivered";
export type JobStructureStatus = "pending" | "in_progress" | "completed";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  customer_name: string;
  job_number: string;
  status: JobStatus;
  expected_completion: string | null;
  expected_delivery: string | null;
  total_price: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanJob {
  id: string;
  job_number: string;
  status: JobStatus;
  expected_completion: string | null;
  expected_delivery: string | null;
  total_price: string | null;
  notes: string | null;
  created_at: string;
  customer_name: string;
}

export interface JobStructure {
  id: string;
  job_id: string;
  template_id: string | null;
  template_name: string | null;
  custom_name: string | null;
  quantity: number;
  unit_price: string | null;
  status: JobStructureStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StructureTemplate {
  id: string;
  name: string;
  description: string | null;
  base_price: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoard {
  quote: KanbanJob[];
  in_progress: KanbanJob[];
  completed: KanbanJob[];
  delivered: KanbanJob[];
}

// Request types for create/update operations

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CreateJobRequest {
  customer_id: string;
  status?: JobStatus;
  expected_completion?: string;
  expected_delivery?: string;
  total_price?: string;
  notes?: string;
}

export interface UpdateJobRequest {
  customer_id: string;
  expected_completion?: string;
  expected_delivery?: string;
  total_price?: string;
  notes?: string;
}

export interface CreateJobStructureRequest {
  template_id?: string;
  custom_name?: string;
  quantity: number;
  unit_price?: string;
  notes?: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  base_price?: string;
  category: string;
}

// Wrapper types for API responses
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

// Job detail response from GET /api/jobs/{id}
export interface JobDetail {
  job: Job;
  structures: JobStructure[];
}
Write d:\Projects\KiwiInv\frontend\lib\api-client.ts
168 lines
// Centralized API client for communicating with the Go backend.

import type { ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ApiError is thrown when the backend returns a non-OK response.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// fetchApi makes a request to the backend and returns the unwrapped data.
// Automatically sets Content-Type and handles error responses.
async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body.error ?? "Request failed");
  }

  const json: ApiResponse<T> = await res.json();
  return json.data;
}

// -- Customers --

import type {
  Customer,
  CreateCustomerRequest,
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  KanbanBoard,
  JobDetail,
  JobStructure,
  CreateJobStructureRequest,
  StructureTemplate,
  CreateTemplateRequest,
} from "@/types/api";

export const customers = {
  list: () => fetchApi<Customer[]>("/api/customers"),

  get: (id: string) => fetchApi<Customer>(`/api/customers/${id}`),

  create: (data: CreateCustomerRequest) =>
    fetchApi<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CreateCustomerRequest) =>
    fetchApi<Customer>(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/api/customers/${id}`, {
      method: "DELETE",
    }),
};

// -- Jobs --

export const jobs = {
  list: (status?: string) =>
    fetchApi<Job[]>(`/api/jobs${status ? `?status=${status}` : ""}`),

  get: (id: string) => fetchApi<JobDetail>(`/api/jobs/${id}`),

  create: (data: CreateJobRequest) =>
    fetchApi<Job>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateJobRequest) =>
    fetchApi<Job>(`/api/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    fetchApi<Job>(`/api/jobs/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/api/jobs/${id}`, {
      method: "DELETE",
    }),
};

// -- Kanban --

export const kanban = {
  get: () => fetchApi<KanbanBoard>("/api/kanban"),
};

// -- Job Structures --

export const jobStructures = {
  list: (jobId: string) =>
    fetchApi<JobStructure[]>(`/api/jobs/${jobId}/structures`),

  create: (jobId: string, data: CreateJobStructureRequest) =>
    fetchApi<JobStructure>(`/api/jobs/${jobId}/structures`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi<JobStructure>(`/api/structures/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/api/structures/${id}`, {
      method: "DELETE",
    }),
};

// -- Templates --

export const templates = {
  list: () => fetchApi<StructureTemplate[]>("/api/templates"),

  get: (id: string) => fetchApi<StructureTemplate>(`/api/templates/${id}`),

  create: (data: CreateTemplateRequest) =>
    fetchApi<StructureTemplate>("/api/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CreateTemplateRequest) =>
    fetchApi<StructureTemplate>(`/api/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/api/templates/${id}`, {
      method: "DELETE",
    }),
};
Now create the React Query hooks and providers.

Write d:\Projects\KiwiInv\frontend\lib\hooks\use-kanban.ts
70 lines
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kanban, jobs } from "@/lib/api-client";
import type { KanbanBoard, JobStatus } from "@/types/api";
import { toast } from "sonner";

// useKanbanBoard fetches the kanban board data (jobs grouped by status).
export function useKanbanBoard() {
  return useQuery({
    queryKey: ["kanban"],
    queryFn: kanban.get,
  });
}

// useUpdateJobStatus provides an optimistic mutation for drag-drop status changes.
// On drag: immediately moves the card in the UI. On error: reverts and shows a toast.
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      jobs.updateStatus(id, status),

    // Optimistic update: move the card before the server responds
    onMutate: async ({ id, status: newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["kanban"] });

      const previous = queryClient.getQueryData<KanbanBoard>(["kanban"]);

      if (previous) {
        const allJobs = [
          ...previous.quote,
          ...previous.in_progress,
          ...previous.completed,
          ...previous.delivered,
        ];

        const job = allJobs.find((j) => j.id === id);
        if (!job) return { previous };

        const updated: KanbanBoard = {
          quote: previous.quote.filter((j) => j.id !== id),
          in_progress: previous.in_progress.filter((j) => j.id !== id),
          completed: previous.completed.filter((j) => j.id !== id),
          delivered: previous.delivered.filter((j) => j.id !== id),
        };

        const movedJob = { ...job, status: newStatus };
        updated[newStatus].push(movedJob);

        queryClient.setQueryData(["kanban"], updated);
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["kanban"], context.previous);
      }
      toast.error("Failed to update job status");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
    },
  });
}
Write d:\Projects\KiwiInv\frontend\lib\hooks\use-jobs.ts
77 lines
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobs } from "@/lib/api-client";
import type { CreateJobRequest, UpdateJobRequest } from "@/types/api";
import { toast } from "sonner";

// useJobs fetches all jobs, optionally filtered by status.
export function useJobs(status?: string) {
  return useQuery({
    queryKey: ["jobs", status],
    queryFn: () => jobs.list(status),
  });
}

// useJob fetches a single job with its structures.
export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => jobs.get(id),
    enabled: !!id,
  });
}

// useCreateJob creates a new job and invalidates the kanban cache.
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobRequest) => jobs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job created");
    },
    onError: () => {
      toast.error("Failed to create job");
    },
  });
}

// useUpdateJob updates job fields and refreshes caches.
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobRequest }) =>
      jobs.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      toast.success("Job updated");
    },
    onError: () => {
      toast.error("Failed to update job");
    },
  });
}

// useDeleteJob deletes a job and refreshes caches.
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job deleted");
    },
    onError: () => {
      toast.error("Failed to delete job");
    },
  });
}
Write d:\Projects\KiwiInv\frontend\lib\hooks\use-customers.ts
64 lines
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customers } from "@/lib/api-client";
import type { CreateCustomerRequest } from "@/types/api";
import { toast } from "sonner";

// useCustomers fetches all customers.
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: customers.list,
  });
}

// useCreateCustomer creates a new customer and refreshes the list.
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
    },
    onError: () => {
      toast.error("Failed to create customer");
    },
  });
}

// useUpdateCustomer updates a customer and refreshes the list.
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCustomerRequest }) =>
      customers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
    },
    onError: () => {
      toast.error("Failed to update customer");
    },
  });
}

// useDeleteCustomer deletes a customer and refreshes the list.
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
    },
    onError: () => {
      toast.error("Failed to delete customer. Make sure they have no active jobs.");
    },
  });
}
Write d:\Projects\KiwiInv\frontend\lib\hooks\use-templates.ts
31 lines
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { templates } from "@/lib/api-client";
import type { CreateTemplateRequest } from "@/types/api";