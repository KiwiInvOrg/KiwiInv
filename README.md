# KiwiInv

**Job management system for Kiwi Cabins**

---

## Overview

KiwiInv is a custom-built workflow management platform designed for Kiwi Cabins, a manufacturer of garden sheds, tiny homes, chicken coops, and custom cabins.

The system tracks customer orders (jobs) from initial quote through to delivery, providing real-time visibility into production status, resource allocation, and job costing.

---

## What It Does

- **Job Tracking** — Manage customer orders through a visual kanban workflow (Quote → In Progress → Completed → Delivered)
- **Customer Management** — Centralised customer records with contact details and order history
- **Structure Templates** — Pre-configured product catalog (standard shed sizes, cabin models, etc.)
- **Resource Planning** — Track materials, labour, and costs per job _(in development)_

---

## Current Status

**Phase 1 (Complete):**
- Core kanban board with drag-and-drop status updates
- Customer and job management
- Structure templates and per-job configurations
- REST API and web interface

**Phase 2 (In Progress):**
- Inventory management and material allocation
- Builder assignment and time tracking
- File uploads (plans, photos, invoices)

---

## Architecture

```
┌─────────────────────┐
│   Web Interface     │  Next.js 16 (React, TypeScript)
│   (Browser)         │  Modern responsive UI
└──────────┬──────────┘
           │ REST API (JSON)
┌──────────▼──────────┐
│   API Server        │  Go 1.26 + chi router
│   (Business Logic)  │  Type-safe database queries (sqlc)
└──────────┬──────────┘
           │ SQL
┌──────────▼──────────┐
│   Database          │  PostgreSQL
│   (Data Storage)    │  Automated migrations
└─────────────────────┘
```

### Key Technologies

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Go 1.26, chi router, sqlc |
| Database | PostgreSQL |
| API | REST (JSON) |

---

## Documentation

- **[AGENTS.MD](./AGENTS.MD)** — Detailed technical specification (for developers and AI agents)
- **[backend/README.md](./backend/README.md)** — API reference and backend setup guide

---

## Development

The system is designed for iterative development with AI assistance. All technical documentation follows a structured format optimised for both human developers and AI code generation tools.

For setup instructions, API endpoints, and database schema details, see the documentation links above.

---

**Kiwi Cabins** — Building quality outdoor structures since [year]
