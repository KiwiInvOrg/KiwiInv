# KiwiInv — Agent Handover Guide

## IMPORTANT: READ THIS FIRST

This file is the primary reference for any AI agent working on this project.
It describes what has been built, what conventions are in use, and what to build next.
Always read this before writing any code.

---

## 1. Project Overview

**Business:** Kiwi Cabins — manufactures and sells garden sheds, tiny homes, chicken coops, and cabins.

**Purpose:** Track jobs (customer orders) through a kanban workflow from quote to delivery. Track resources (materials, builders, time) per job.

**Status:** Phase 1 is complete. Core kanban board with job/customer/template management works end-to-end.

---

## 2. Architecture

```
Browser (Next.js 16, App Router)
    ↕ REST API (JSON)
Go HTTP Server (chi router, port 8080)
    ↕ SQL (parameterized queries via sqlc)
PostgreSQL (local, devbot user)
```

### Directory Layout

```
KiwiInv/
├── backend/                    # Go REST API
│   ├── cmd/server/main.go      # Entry point
│   ├── internal/
│   │   ├── config/config.go    # Env config (.env loader + env vars)
│   │   ├── db/                 # sqlc-generated code + DB connection + migrations
│   │   ├── handlers/           # HTTP request handlers
│   │   ├── middleware/cors.go  # CORS configuration
│   │   └── router/router.go    # All route definitions
│   ├── migrations/             # SQL migration files
│   ├── sql/queries/            # sqlc SQL query definitions
│   └── sqlc.yaml               # sqlc configuration
├── frontend/                   # Next.js 16 app
│   ├── app/                    # Pages (App Router)
│   ├── components/             # React components
│   ├── lib/                    # API client, React Query hooks
│   └── types/api.ts            # TypeScript types matching Go models
└── AGENTS.MD                   # This file
```

---

## 3. Backend — Go API

### Running the backend

```bash
export PATH="$PATH:/d/ProgramFiles/Go/bin"   # Windows: Go is at D:\ProgramFiles\Go\bin
cd backend
go run ./cmd/server/
```

The server:
1. Loads `backend/.env`
2. Connects to PostgreSQL
3. Runs any pending migrations automatically
4. Starts on port 8080

### Environment variables (`backend/.env`)

```
DATABASE_URL=postgres://devbot:<password>@localhost:5432/postgres?sslmode=disable
PORT=8080
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
JWT_SECRET=dev-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback
```

### API response format

All responses:
- Success: `{"data": <payload>}`
- Error: `{"error": "human readable message"}`

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/kanban` | All jobs grouped by status |
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/{id}` | Get customer |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer (fails if has jobs) |
| GET | `/api/jobs` | List jobs (optional `?status=` filter) |
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs/{id}` | Get job with structures |
| PUT | `/api/jobs/{id}` | Update job |
| PATCH | `/api/jobs/{id}/status` | Update job status (kanban drag-drop) |
| DELETE | `/api/jobs/{id}` | Delete job (cascades to structures) |
| GET | `/api/jobs/{id}/structures` | List job structures |
| POST | `/api/jobs/{id}/structures` | Add structure to job |
| PUT | `/api/structures/{id}` | Update structure |
| DELETE | `/api/structures/{id}` | Delete structure |
| GET | `/api/templates` | List structure templates |
| POST | `/api/templates` | Create template |
| GET | `/api/templates/{id}` | Get template |
| PUT | `/api/templates/{id}` | Update template |
| DELETE | `/api/templates/{id}` | Delete template |

### Key backend files

| File | Purpose |
|------|---------|
| `cmd/server/main.go` | Wires config → DB → migrations → router → server |
| `internal/config/config.go` | Reads `.env` + env vars into `Config` struct |
| `internal/db/connection.go` | PostgreSQL pool (25 max open, 5 idle, 5min lifetime) |
| `internal/db/migrate.go` | Runs golang-migrate from `migrations/` on startup |
| `internal/handlers/handler.go` | `Handler` struct holding `*db.Queries` + `*config.Config` |
| `internal/handlers/response.go` | `respondJSON()`, `respondError()`, `parseBody()` helpers |
| `internal/handlers/types.go` | API response structs; converts `sql.Null*` → pointer types |
| `internal/handlers/customers.go` | Customer CRUD |
| `internal/handlers/jobs.go` | Job CRUD + status patch |
| `internal/handlers/kanban.go` | Kanban board aggregation |
| `internal/handlers/structures.go` | Template CRUD + job structure CRUD |
| `internal/router/router.go` | All chi route definitions |
| `internal/middleware/cors.go` | CORS allowing `FRONTEND_URL` origin |

### sqlc workflow

1. Write SQL in `sql/queries/*.sql` with `-- name: QueryName :one/:many/:exec`
2. Run `sqlc generate` from `backend/` directory
3. Generated code appears in `internal/db/` — **never edit these files directly**
4. Use generated methods like `h.Queries.ListCustomers(ctx)` in handlers

Config: `sqlc.yaml` — postgres engine, schema from `migrations/`, overrides: UUID → `github.com/google/uuid.UUID`, NUMERIC → `string`

### Data model (implemented tables)

- `customers` — id (UUID), name, email?, phone?, address?, created_at, updated_at
- `jobs` — id, customer_id (FK), job_number (KW-0001), status enum, expected_completion?, expected_delivery?, total_price?, notes?, created_at, updated_at
- `structure_templates` — id, name, description?, base_price?, category, created_at, updated_at
- `job_structures` — id, job_id (FK CASCADE), template_id? (FK), custom_name?, quantity, unit_price?, status enum, notes?, created_at, updated_at
- `users` — id, email, name, google_id?, role enum, is_active, created_at, updated_at

Job numbers use a PostgreSQL sequence: `KW-` prefix + zero-padded 4-digit number.
All `updated_at` fields are auto-managed by a database trigger.

### Handler pattern

```go
// Handler struct holds shared dependencies
type Handler struct {
    Queries *db.Queries
    Config  *config.Config
}

// Handler methods implement http.HandlerFunc
func (h *Handler) ListCustomers(w http.ResponseWriter, r *http.Request) {
    customers, err := h.Queries.ListCustomers(r.Context())
    if err != nil {
        respondError(w, http.StatusInternalServerError, "failed to list customers")
        return
    }
    respondJSON(w, http.StatusOK, toCustomerResponses(customers))
}
```

### Type conversion pattern (important!)

sqlc generates `sql.NullString` fields which serialize as `{"String":"value","Valid":true}`.
We convert these to clean pointer types before returning JSON.
See `internal/handlers/types.go` for the full type definitions and converters.

```go
// Bad: sql.NullString serializes ugly
// Good: *string pointer serializes as "value" or null
func fromNullString(ns sql.NullString) *string {
    if !ns.Valid { return nil }
    return &ns.String
}
```

---

## 4. Frontend — Next.js

### Running the frontend

```bash
cd frontend
npm run dev   # starts on port 3000
```

### Environment (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### CRITICAL: shadcn/ui uses Base UI, not Radix

This project uses the newer shadcn/ui that is built on `@base-ui/react`, NOT Radix UI.
The component API is different in important ways:

**Component composition:** Use `render` prop, NOT `asChild`
```tsx
// WRONG (Radix pattern):
<DialogTrigger asChild><Button>Open</Button></DialogTrigger>

// CORRECT (Base UI pattern):
<DialogTrigger render={<Button />}>Open</DialogTrigger>
```

**Select onChange:** Callback includes eventDetails
```tsx
// WRONG:
<Select onValueChange={setValue}>

// CORRECT:
<Select onValueChange={(v) => setValue(v ?? "")}>
// v is `string | null`, not just `string`
```

**Sheet/Dialog close:** Uses `render` prop on close button
```tsx
<DialogClose render={<Button variant="ghost" />}>
  <XIcon />
</DialogClose>
```

### Frontend file structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with Providers + NavHeader
│   ├── providers.tsx           # QueryClientProvider + Sonner toaster
│   ├── page.tsx                # Home = KanbanBoard
│   ├── customers/page.tsx      # Customer list + CRUD
│   └── templates/page.tsx      # Template list + create
├── components/
│   ├── layout/
│   │   └── nav-header.tsx      # Top nav: Kiwi Cabins logo + Board/Customers/Templates links
│   ├── kanban/
│   │   ├── kanban-board.tsx    # Main board: DndContext, 4 columns, drag state
│   │   ├── kanban-column.tsx   # Droppable column with color-coded header
│   │   ├── job-card.tsx        # Draggable job card (useSortable)
│   │   ├── kanban-skeleton.tsx # Loading skeleton
│   │   └── create-job-dialog.tsx # New job dialog
│   ├── jobs/
│   │   └── job-detail-sheet.tsx # Slide-out sheet: job details + structures + delete
│   ├── customers/
│   │   └── customer-form-dialog.tsx # Create/edit customer dialog
│   └── ui/                     # shadcn/ui components (Base UI)
├── lib/
│   ├── api-client.ts           # fetch wrapper + domain API functions
│   └── hooks/
│       ├── use-kanban.ts       # useKanbanBoard, useUpdateJobStatus (with optimistic update)
│       ├── use-jobs.ts         # useJobs, useJob, useCreateJob, useUpdateJob, useDeleteJob
│       ├── use-customers.ts    # useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer
│       └── use-templates.ts    # useTemplates, useCreateTemplate
└── types/api.ts                # TypeScript types matching Go API responses
```

### React Query caching

Query keys used:
- `["kanban"]` — kanban board data
- `["jobs"]` — job list
- `["job", id]` — single job detail
- `["customers"]` — customer list
- `["templates"]` — template list

Mutations invalidate relevant keys after success.

### Kanban drag-and-drop

Uses `@dnd-kit/core` + `@dnd-kit/sortable`. Drag activation distance is 5px to prevent accidental drags on click.

**Optimistic updates:** When a card is dragged, the UI updates immediately (before API call). On error, rolls back to previous state and shows a toast.

Column IDs match `JobStatus` type: `"quote"`, `"in_progress"`, `"completed"`, `"delivered"`.

### Column colors

| Status | Header color |
|--------|-------------|
| quote | Blue |
| in_progress | Amber |
| completed | Green |
| delivered | Purple |

---

## 5. Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Next.js (App Router) | 16.x |
| UI components | shadcn/ui (Base UI) | latest |
| CSS | Tailwind CSS | v4 |
| Drag-and-drop | @dnd-kit | latest |
| Server state | @tanstack/react-query | latest |
| Toasts | sonner | latest |
| Language | TypeScript (strict) | latest |
| Backend language | Go | 1.26.1 |
| HTTP router | chi | v5 |
| Database | PostgreSQL | local |
| DB queries | sqlc | latest |
| DB migrations | golang-migrate | v4 |
| UUIDs | google/uuid | latest |

---

## 6. Development Environment

- **OS:** Windows 10, Git Bash shell (use Unix paths, forward slashes)
- **Go binary:** `/d/ProgramFiles/Go/bin` — must prepend to PATH each session:
  ```bash
  export PATH="$PATH:/d/ProgramFiles/Go/bin"
  ```
- **sqlc binary:** `$HOME/go/bin/sqlc`
- **PostgreSQL:** Local install, user `devbot`, database `postgres`
- **Note:** Port 8080 can get stuck if a previous server process wasn't killed. Use `tasklist | grep main` to find and kill it.

---

## 7. Code Conventions

### Backend (Go)

- All handlers on `Handler` struct, except standalone `HealthCheck`
- JSON responses via `respondJSON()` and `respondError()` only
- Parse request body with `parseBody()` helper
- Validate inputs in handlers before calling queries
- Money: `NUMERIC(12,2)` in DB, `string` in Go/JSON (never `float`)
- Dates: `TIMESTAMPTZ` in DB, parsed as `"2006-01-02"` layout in Go
- No `sql.Null*` types in API responses — always convert via `types.go`

### Frontend (TypeScript/React)

- All pages are client components (`"use client"`) since they need React Query hooks
- Data fetching only via React Query hooks in `lib/hooks/`
- Never call `fetch` directly from components — always via `lib/api-client.ts`
- Base UI component API: `render` prop for composition, not `asChild`
- Toast notifications via `sonner` (`toast.success()`, `toast.error()`)

---

## 8. Phase 1 — COMPLETE

Everything below is done and working:

- [x] Go API with chi router
- [x] PostgreSQL connection pool + auto-migrations on startup
- [x] Database schema: customers, jobs, structure_templates, job_structures, users
- [x] sqlc type-safe queries for all tables
- [x] Full REST API: customers, jobs, kanban, templates, structures
- [x] Next.js 16 frontend with shadcn/ui (Base UI)
- [x] React Query hooks for all API calls
- [x] Kanban board UI with 4 columns and drag-and-drop
- [x] Optimistic status updates on drag
- [x] Job detail slide-out sheet with structures list
- [x] Create job dialog (select customer, dates, price, notes)
- [x] Customer list page with create/edit/delete
- [x] Structure templates page with create

---

## 9. Phase 2 — Resource Tracking (NEXT)

Per the AGENTS.MD spec and database design, Phase 2 adds:

### Inventory Management
New tables needed (database migration required):
- `inventory_items` — material catalog (name, sku, unit, current_stock, allocated_stock, reorder_level, unit_price)
- `template_materials` — bill of materials per template (template_id FK, inventory_item_id FK, quantity_required)
- `structure_materials` — allocated/used materials per job structure (job_structure_id FK, inventory_item_id FK, quantity_allocated, quantity_used)

Key logic:
- When job moves to "in_progress": copy template_materials → structure_materials, update allocated_stock
- When structure completes: finalize quantity_used, return unused to stock
- `available_stock = current_stock - allocated_stock` (computed)

### Builder/Labor Tracking
New tables needed:
- `builders` — builder catalog (name, email, phone, hourly_rate, role, is_active)
- `job_builders` — job-builder assignment junction (job_id FK, builder_id FK, assigned_date, status)
- `time_entries` — daily time logs (job_id FK, builder_id FK, date, hours_worked, description)

### File Uploads
New table needed:
- `job_files` — file metadata (job_id FK, filename, file_path, file_size, mime_type, category, uploaded_by)

Storage strategy TBD (local filesystem for now, S3-ready interface).

### API Endpoints to Add
- `CRUD /api/inventory` — inventory items
- `CRUD /api/builders` — builder catalog
- `POST /api/jobs/{id}/builders` — assign builder to job
- `POST /api/jobs/{id}/time` — log time entry
- `GET /api/jobs/{id}/time` — get time entries for job
- `POST /api/jobs/{id}/files` — upload file
- `GET /api/jobs/{id}/files` — list job files

---

## 10. Future Phases

- **Phase 3:** Reporting and analytics (hours per job, materials cost, etc.)
- **Phase 4:** Google OAuth authentication (handlers stubbed in `users.sql` already)
- **Phase 5:** Xero accounting integration

---

## 11. Adding a New API Feature (Checklist)

1. **Write migration** — create `migrations/00000N_description.up.sql` and `.down.sql`
2. **Write SQL queries** — add to `sql/queries/*.sql` with sqlc annotations
3. **Generate code** — run `sqlc generate` from `backend/`
4. **Add response types** — update `internal/handlers/types.go`
5. **Write handler** — add methods to `Handler` struct in appropriate file
6. **Register routes** — add to `internal/router/router.go`
7. **Add TS types** — update `frontend/types/api.ts`
8. **Add API client functions** — update `frontend/lib/api-client.ts`
9. **Add React Query hooks** — create/update `frontend/lib/hooks/use-*.ts`
10. **Build UI** — create components in `frontend/components/`

---

## 12. UI Design Standards

The target aesthetic is a clean, modern SaaS dashboard. The design reference (uploaded kanban screenshot) shows the general layout and component style to aim for — not a pixel-perfect spec.

### Brand Colors (Kiwi Cabins)
| Role | Color |
|------|-------|
| Primary accent | Green (earthy, e.g. `#4A7C59` or similar) |
| Secondary / warm | Brown / tan (e.g. `#8B5E3C`) |
| Backgrounds | White + light warm gray |
| Text | Near-black for headings, gray for muted |

These are subject to refinement — pick specific Tailwind values that look good together.

### Layout Principles (inspired by reference design)
- **Sidebar navigation** — fixed left sidebar with icon + label nav items, active item highlighted with accent color
- **Light gray page background** — white cards on a slightly warm gray canvas
- **Top bar per page** — page title left, primary CTA (green button) top right
- **Kanban columns** — colored status dot + title + count in column header; clean white cards below

### Card Design
- White background, rounded corners, subtle shadow
- Bold title, short muted description
- Status/tag chips (small pill-shaped, colored)
- Metadata row: due date with icon, assignee avatars, file/comment counts

### General Rules
- Use green as the primary action color (buttons, active highlights), brown as a warm accent
- Generous whitespace — don't crowd elements
- Icons on nav items and metadata rows
- Dialogs/sheets for create/edit actions (no inline forms)
- Toasts for success/error feedback (sonner is already installed)

> **Note:** Design is subject to change. Agents should apply these principles as sensible defaults, not rigid rules. When in doubt, prioritise clean and readable over exact adherence.

---

## 12. AI Agent Behavior Standards

- Read existing code before writing new code
- Match existing patterns (handler style, response format, React Query conventions)
- Never edit `internal/db/*.sql.go` — these are auto-generated by sqlc
- Run `go build ./...` from `backend/` after backend changes to verify compilation
- Run `npx next build` from `frontend/` after frontend changes to verify TypeScript
- Test API endpoints with curl against `http://localhost:8080`
- Money values are always strings — never use float
- Ask before creating new patterns that differ from existing conventions
