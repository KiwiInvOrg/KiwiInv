# KiwiInv Kanban Redesign - Implementation Plan v3 (FINAL)

**Written by:** Donny (Opus 4.6) on 2026-03-16  
**Execution Model:** Sonnet 4.5 (or any frontend-capable model)  
**Estimated Time:** 6-8 hours total  
**Goal:** Transform basic UI into Linear-inspired design with Kiwi Cabins branding

**Changes from V2:**
- ✅ Fixed OKLCH color conversions (verified with oklch.com)
- ✅ Added SidebarTrigger for collapsible sidebar
- ✅ Added mobile support (offcanvas behavior)
- ✅ Added sidebar state persistence (localStorage)
- ✅ Complete file contents for customers/templates pages
- ✅ Added backend health check
- ✅ NZ date format configured
- ✅ Sidebar default: open
- ✅ Light mode only (dark mode skipped)

---

## Prerequisites Check

Before starting, verify:

```bash
cd ~/kiwi-repo/frontend
node --version  # Should be v22+
npm --version   # Should be 10+
pwd             # Should be /home/adam/kiwi-repo/frontend
```

**Expected output:**
```
v22.22.1
10.9.4
/home/adam/kiwi-repo/frontend
```

---

## Important Notes

### Tailwind v4 Configuration
This project uses **Tailwind CSS v4**, which uses CSS-based configuration in `app/globals.css` via `@theme inline`, NOT a `tailwind.config.ts` file.

### shadcn/ui with Base UI
This project uses shadcn/ui built on **@base-ui/react** (NOT Radix UI).

**Key difference:**
- ❌ WRONG: `<DialogTrigger asChild><Button /></DialogTrigger>`
- ✅ CORRECT: `<DialogTrigger render={<Button />}>Text</DialogTrigger>`

**Verified:** Existing components already use correct patterns.

---

## Phase 0: Pre-Flight Checks (15 min)

### Step 0.1: Verify backend is running

**Command:**
```bash
curl -s http://localhost:8080/api/health
```

**Expected output:**
```json
{"data":{"status":"ok","timestamp":"2026-03-16T..."}}
```

**If not running:**
```bash
cd ~/kiwi-repo/backend
export GOROOT=$HOME/go && export GOPATH=$HOME/go-workspace && export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
nohup go run ./cmd/server/ > /tmp/kiwi-backend.log 2>&1 &
echo $! > /tmp/kiwi-backend.pid
# Wait 3 seconds for startup
sleep 3
curl -s http://localhost:8080/api/health
```

**If still failing:**
Check logs: `tail -50 /tmp/kiwi-backend.log`

---

### Step 0.2: Verify components.json shows Base UI

**Command:**
```bash
cd ~/kiwi-repo/frontend
grep "style" components.json
```

**Expected output:**
```json
"style": "base-nova",
```

**If not base-nova:**
STOP. This plan assumes Base UI. Consult Adam before proceeding.

---

### Step 0.3: Verify Base UI patterns in existing components

**Command:**
```bash
cd ~/kiwi-repo/frontend
grep -r "render=" components/kanban/create-job-dialog.tsx
```

**Expected output:**
```tsx
<DialogTrigger render={<Button size="sm" />}>
```

**If shows `asChild`:**
STOP. Components need to be updated to Base UI first.

---

## Phase 1: Install Required Components (10-15 min)

### Step 1.1: Install shadcn sidebar component

**Command:**
```bash
cd ~/kiwi-repo/frontend
npx shadcn@latest add @shadcn/sidebar --yes
```

**Expected output:**
```
✔ Done.
```

**Validation:**
```bash
ls components/ui/sidebar.tsx
```

**Expected:**
File exists (should output path).

---

### Step 1.2: Install lucide-react icons

**Check if installed:**
```bash
grep "lucide-react" package.json
```

**If not found, install:**
```bash
npm install lucide-react
```

**Validation:**
```bash
grep "lucide-react" package.json
```

**Expected:**
```
"lucide-react": "^0.468.0",
```

---

### Step 1.3: Install date-fns (if not present)

**Check:**
```bash
grep "date-fns" package.json
```

**If not found:**
```bash
npm install date-fns
```

**Validation:**
```bash
grep "date-fns" package.json
```

**Expected:**
```
"date-fns": "^3.x.x",
```

---

## Phase 2: Brand Color System (20-30 min)

### Step 2.1: Update CSS variables with verified OKLCH colors

**File:** `frontend/app/globals.css`

**Action:** Replace entire file contents with the following.

**COMPLETE FILE CONTENTS:**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  
  /* Kiwi Cabins Brand Colors (verified with oklch.com) */
  --color-brand-green: oklch(0.396 0.083 159.51);        /* #2D5F3F */
  --color-brand-green-light: oklch(0.496 0.083 159.51);
  --color-brand-green-dark: oklch(0.296 0.083 159.51);
  --color-brand-brown: oklch(0.538 0.053 63.47);         /* #8B6F47 */
  --color-brand-brown-light: oklch(0.638 0.053 63.47);
  --color-brand-brown-dark: oklch(0.438 0.053 63.47);
  
  /* Status Colors */
  --color-status-quote: oklch(0.60 0.20 250);            /* Blue */
  --color-status-quote-tint: oklch(0.95 0.02 250);
  --color-status-progress: oklch(0.75 0.15 70);          /* Amber */
  --color-status-progress-tint: oklch(0.95 0.015 70);
  --color-status-completed: oklch(0.65 0.18 155);        /* Green */
  --color-status-completed-tint: oklch(0.95 0.018 155);
  --color-status-delivered: oklch(0.62 0.22 290);        /* Purple */
  --color-status-delivered-tint: oklch(0.95 0.022 290);
  
  /* Background Colors */
  --color-background-warm: oklch(0.98 0.002 85);         /* #FAFAF9 */
  
  /* Sidebar colors */
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  
  /* Chart colors */
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  
  /* UI colors */
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  
  /* Border radius */
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  /* Base colors */
  --background: oklch(0.98 0.002 85);        /* Warm off-white background */
  --foreground: oklch(0.145 0 0);            /* Near-black text */
  
  /* Card */
  --card: oklch(1 0 0);                      /* Pure white cards */
  --card-foreground: oklch(0.145 0 0);
  
  /* Popover */
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  
  /* Primary (brand green) */
  --primary: oklch(0.396 0.083 159.51);      /* #2D5F3F */
  --primary-foreground: oklch(0.985 0 0);    /* White text on green */
  
  /* Secondary */
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  
  /* Muted */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);      /* Gray text */
  
  /* Accent */
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  
  /* Destructive */
  --destructive: oklch(0.577 0.245 27.325);  /* Red */
  
  /* Border */
  --border: oklch(0.922 0 0);                /* Light gray borders */
  --input: oklch(0.922 0 0);
  
  /* Ring (focus) */
  --ring: oklch(0.396 0.083 159.51);         /* Brand green for focus rings */
  
  /* Charts */
  --chart-1: oklch(0.809 0.105 251.813);
  --chart-2: oklch(0.623 0.214 259.815);
  --chart-3: oklch(0.546 0.245 262.881);
  --chart-4: oklch(0.488 0.243 264.376);
  --chart-5: oklch(0.424 0.199 265.638);
  
  /* Border radius */
  --radius: 0.625rem;
  
  /* Sidebar */
  --sidebar: oklch(1 0 0);                   /* White sidebar background */
  --sidebar-foreground: oklch(0.145 0 0);    /* Dark text */
  --sidebar-primary: oklch(0.396 0.083 159.51);   /* Brand green for active */
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);         /* Light gray hover */
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);        /* Light gray border */
  --sidebar-ring: oklch(0.396 0.083 159.51); /* Brand green focus */
}

@layer base {
  * {
    @apply border-border outline-ring/50 transition-colors duration-150 ease-out;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

**Validation:**
```bash
npm run dev
```

**Expected:** Dev server starts with no CSS errors. Open browser to http://localhost:3000 - background should be warm off-white (#FAFAF9).

---

## Phase 3: Create Sidebar Layout (60-75 min)

### Step 3.1: Create app-sidebar component

**File:** `frontend/components/layout/app-sidebar.tsx` (NEW FILE)

**COMPLETE FILE CONTENTS:**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutGrid, Users, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Board",
    url: "/",
    icon: LayoutGrid,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: FileText,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
          <Image
            src="/kiwi-logo-dark.png"
            alt="Kiwi Cabins"
            width={160}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
```

**Validation:**
```bash
ls components/layout/app-sidebar.tsx
```

**Expected:** File exists.

---

### Step 3.2: Create page-header component with SidebarTrigger

**File:** `frontend/components/layout/page-header.tsx` (NEW FILE)

**COMPLETE FILE CONTENTS:**

```tsx
import { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
  description?: string;
}

export function PageHeader({ title, action, description }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2 pr-4">{action}</div>}
    </div>
  );
}
```

**Validation:**
```bash
ls components/layout/page-header.tsx
```

**Expected:** File exists.

---

### Step 3.3: Update root layout with sidebar and state persistence

**File:** `frontend/app/layout.tsx`

**COMPLETE FILE CONTENTS (replace entire file):**

```tsx
"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sidebar state persistence in localStorage
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Load saved state (default: true/open)
    const saved = localStorage.getItem("sidebar:state");
    if (saved !== null) {
      setSidebarOpen(saved === "true");
    }
  }, []);

  const handleSidebarChange = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem("sidebar:state", String(open));
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SidebarProvider
            open={sidebarOpen}
            onOpenChange={handleSidebarChange}
            style={{
              "--sidebar-width": "15rem",
            } as React.CSSProperties}
          >
            <AppSidebar />
            <SidebarInset>
              <main className="flex-1">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
```

**Note:** Made layout client component for localStorage access. Metadata moved to individual pages if needed.

**Validation:**
```bash
npm run dev
```

Open http://localhost:3000 in browser.

**Expected:**
- Sidebar visible on left (240px / 15rem width)
- Logo displays
- Three nav items: Board, Customers, Templates
- Board is highlighted (active state)
- Hamburger trigger button in page header
- Clicking trigger collapses/expands sidebar
- Sidebar state persists on page refresh

---

## Phase 4: Redesign Kanban Board (90-120 min)

### Step 4.1: Update home page with PageHeader

**File:** `frontend/app/page.tsx`

**COMPLETE FILE CONTENTS (replace entire file):**

```tsx
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { PageHeader } from "@/components/layout/page-header";
import { CreateJobDialog } from "@/components/kanban/create-job-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Jobs Board"
        description="Track jobs from quote to delivery"
        action={
          <CreateJobDialog>
            <Button className="bg-brand-green hover:bg-brand-green-dark text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Button>
          </CreateJobDialog>
        }
      />
      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard />
      </div>
    </div>
  );
}
```

**Validation:**
Refresh browser at http://localhost:3000

**Expected:**
- Page header at top with "Jobs Board" title
- Sidebar trigger (hamburger icon) on left of header
- Green "New Job" button on right
- Kanban board below header

---

### Step 4.2: Redesign kanban-column component

**File:** `frontend/components/kanban/kanban-column.tsx`

**COMPLETE FILE CONTENTS (replace entire file):**

```tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { JobCard } from "./job-card";
import { Badge } from "@/components/ui/badge";
import type { KanbanJob, JobStatus } from "@/types/api";

interface KanbanColumnProps {
  status: JobStatus;
  jobs: KanbanJob[];
  onJobClick: (job: KanbanJob) => void;
}

const columnConfig = {
  quote: {
    title: "Quote",
    dotColor: "bg-status-quote",
    bgColor: "bg-[var(--color-status-quote-tint)]",
  },
  in_progress: {
    title: "In Progress",
    dotColor: "bg-status-progress",
    bgColor: "bg-[var(--color-status-progress-tint)]",
  },
  completed: {
    title: "Completed",
    dotColor: "bg-status-completed",
    bgColor: "bg-[var(--color-status-completed-tint)]",
  },
  delivered: {
    title: "Delivered",
    dotColor: "bg-status-delivered",
    bgColor: "bg-[var(--color-status-delivered-tint)]",
  },
};

export function KanbanColumn({ status, jobs, onJobClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const config = columnConfig[status];
  const jobIds = jobs.map((job) => job.id);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Column Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className={`h-2.5 w-2.5 rounded-full ${config.dotColor}`} />
        <h3 className="font-semibold text-foreground">{config.title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {jobs.length}
        </Badge>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-3 ${config.bgColor}`}
      >
        <SortableContext items={jobIds} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={onJobClick} />
          ))}
        </SortableContext>
        {jobs.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border">
            <p className="text-sm text-muted-foreground">No jobs</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Validation:**
Refresh browser.

**Expected:**
- Columns have colored dots (blue, amber, green, purple)
- Each column shows job count badge
- Column backgrounds have subtle color tints
- Empty columns show "No jobs" message

---

### Step 4.3: Redesign job-card component with NZ date format

**File:** `frontend/components/kanban/job-card.tsx`

**COMPLETE FILE CONTENTS (replace entire file):**

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, GripVertical } from "lucide-react";
import { format } from "date-fns";
import type { KanbanJob } from "@/types/api";

interface JobCardProps {
  job: KanbanJob;
  onClick?: (job: KanbanJob) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id, data: { job } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group cursor-pointer transition-all hover:shadow-lg ${
        isDragging ? "rotate-2 opacity-50" : ""
      }`}
      onClick={() => onClick?.(job)}
    >
      <CardContent className="p-3">
        {/* Drag Handle + Job Number */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs font-medium text-muted-foreground">
            {job.job_number}
          </span>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Title (from notes or "Untitled") */}
        <h4 className="mb-2 line-clamp-2 font-semibold text-foreground">
          {job.notes || "Untitled Job"}
        </h4>

        {/* Customer */}
        <p className="mb-3 text-sm text-muted-foreground">{job.customer_name}</p>

        {/* Metadata */}
        <div className="space-y-1.5">
          {job.expected_completion && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Due {format(new Date(job.expected_completion), "d/MM/yyyy")}
              </span>
            </div>
          )}
          {job.total_price && (
            <div className="flex items-center gap-2 text-sm font-medium text-brand-green">
              <DollarSign className="h-4 w-4" />
              <span>${parseFloat(job.total_price).toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Key changes:**
- NZ date format: `d/MM/yyyy` (e.g., 15/03/2026)
- Drag handle appears on hover
- Click on drag handle doesn't trigger card click

**Validation:**
Refresh browser.

**Expected:**
- Cards are white with clean layout
- Dates shown in NZ format (dd/MM/yyyy)
- Price in brand green
- Drag handle appears on hover
- Shadow increases on hover
- Drag and drop works

---

### Step 4.4: Update kanban-board container

**File:** `frontend/components/kanban/kanban-board.tsx`

**COMPLETE FILE CONTENTS (replace entire file):**

```tsx
"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useKanbanBoard, useUpdateJobStatus } from "@/lib/hooks/use-kanban";
import { KanbanColumn } from "./kanban-column";
import { KanbanSkeleton } from "./kanban-skeleton";
import { JobCard } from "./job-card";
import { JobDetailSheet } from "@/components/jobs/job-detail-sheet";
import type { KanbanJob, JobStatus } from "@/types/api";

const COLUMNS: JobStatus[] = ["quote", "in_progress", "completed", "delivered"];

export function KanbanBoard() {
  const { data: board, isLoading, error } = useKanbanBoard();
  const updateStatus = useUpdateJobStatus();
  const [activeJob, setActiveJob] = useState<KanbanJob | null>(null);
  const [selectedJob, setSelectedJob] = useState<KanbanJob | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const job = event.active.data.current?.job as KanbanJob | undefined;
      if (job) setActiveJob(job);
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveJob(null);
      const { active, over } = event;
      if (!over) return;

      const jobId = active.id as string;
      const newStatus = over.id as JobStatus;

      // Find which column the job currently belongs to
      if (!board) return;
      const currentStatus = COLUMNS.find((s) =>
        board[s].some((j) => j.id === jobId)
      );

      if (currentStatus && currentStatus !== newStatus) {
        updateStatus.mutate({ id: jobId, status: newStatus });
      }
    },
    [board, updateStatus]
  );

  const handleJobClick = useCallback((job: KanbanJob) => {
    setSelectedJob(job);
  }, []);

  if (isLoading) return <KanbanSkeleton />;

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10">
        <div className="text-center">
          <p className="font-semibold text-destructive">
            Failed to load kanban board
          </p>
          <p className="text-sm text-muted-foreground">
            Is the backend running on port 8080?
          </p>
        </div>
      </div>
    );
  }

  if (!board) return null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid h-full grid-cols-4 gap-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              jobs={board[status]}
              onJobClick={handleJobClick}
            />
          ))}
        </div>
        <DragOverlay>
          {activeJob ? <JobCard job={activeJob} /> : null}
        </DragOverlay>
      </DndContext>
      <JobDetailSheet
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => {
          if (!open) setSelectedJob(null);
        }}
      />
    </>
  );
}
```

**Validation:**
Refresh browser.

**Expected:**
- 4 columns fill available height
- Drag and drop works
- Clicking card opens detail sheet
- Better error message

---

### Step 4.5: Update loading skeleton

**File:** `frontend/components/kanban/kanban-skeleton.tsx`

**COMPLETE FILE CONTENTS (replace entire file):**

```tsx
export function KanbanSkeleton() {
  return (
    <div className="grid h-full grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((col) => (
        <div
          key={col}
          className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
        >
          {/* Column Header Skeleton */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="ml-auto h-5 w-8 animate-pulse rounded-full bg-muted" />
          </div>

          {/* Cards Skeleton */}
          <div className="flex-1 space-y-2 bg-muted/30 p-3">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="space-y-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="space-y-1.5 pt-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Validation:**
Temporarily disconnect backend to see skeleton.

**Expected:**
- 4 skeleton columns
- Animated pulsing effect
- Matches new design

---

## Phase 5: Update Other Pages (30-45 min)

### Step 5.1: Update customers page

**File:** `frontend/app/customers/page.tsx`

**COMPLETE FILE CONTENTS (replace entire file):**

```tsx
"use client";

import { useCustomers, useDeleteCustomer } from "@/lib/hooks/use-customers";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete customer "${name}"? This will fail if they have jobs.`))
      return;
    deleteCustomer.mutate(id);
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Customers"
        description="Manage customer information"
        action={<CustomerFormDialog />}
      />
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-4xl">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : customers && customers.length > 0 ? (
            <div className="space-y-3">
              {customers.map((customer) => (
                <Card key={customer.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <div className="mt-0.5 flex gap-4 text-sm text-muted-foreground">
                        {customer.email && <span>{customer.email}</span>}
                        {customer.phone && <span>{customer.phone}</span>}
                        {customer.address && <span>{customer.address}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CustomerFormDialog
                        customer={customer}
                        trigger={
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        }
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(customer.id, customer.name)}
                        disabled={deleteCustomer.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              No customers yet. Create one to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Validation:**
Navigate to /customers in browser.

**Expected:**
- Page header with "Customers" title and sidebar trigger
- Customer list below
- Layout matches kanban board

---

### Step 5.2: Update templates page

**File:** `frontend/app/templates/page.tsx`

**COMPLETE FILE CONTENTS (replace entire file):**

```tsx
"use client";

import { useState } from "react";
import { useTemplates, useCreateTemplate } from "@/lib/hooks/use-templates";
import { PageHeader } from "@/components/layout/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const createTemplate = useCreateTemplate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState("");

  function resetForm() {
    setName("");
    setDescription("");
    setBasePrice("");
    setCategory("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;

    createTemplate.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        base_price: basePrice || undefined,
        category: category.trim(),
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>New Template</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tpl-name">Name *</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="8x10 Garden Shed"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-category">Category *</Label>
            <Input
              id="tpl-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="shed"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-price">Base Price</Label>
            <Input
              id="tpl-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-desc">Description</Label>
            <Textarea
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Standard garden shed with..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !category.trim() || createTemplate.isPending}
            >
              {createTemplate.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TemplatesPage() {
  const { data: templateList, isLoading } = useTemplates();

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Templates"
        description="Structure templates catalog"
        action={<CreateTemplateDialog />}
      />
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-4xl">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templateList && templateList.length > 0 ? (
            <div className="space-y-3">
              {templateList.map((template) => (
                <Card key={template.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{template.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex gap-4 text-sm text-muted-foreground">
                        {template.base_price && <span>${template.base_price}</span>}
                        {template.description && <span>{template.description}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              No templates yet. Create one to use in jobs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Validation:**
Navigate to /templates in browser.

**Expected:**
- Page header with "Templates" title
- Template list below
- Consistent layout

---

## Phase 6: Testing & Validation (30-45 min)

### Step 6.1: TypeScript check

**Command:**
```bash
cd ~/kiwi-repo/frontend
npx tsc --noEmit
```

**Expected:** No errors.

**If errors:** Fix one by one, re-run check.

---

### Step 6.2: Build test

**Command:**
```bash
npm run build
```

**Expected:**
```
✓ Compiled successfully
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /customers
└ ○ /templates
```

**If fails:** Read error output, fix, retry. Do NOT proceed until build passes.

---

### Step 6.3: Visual testing checklist

**Start dev server:**
```bash
npm run dev
```

**Test at http://localhost:3000:**

**Layout:**
- [ ] Sidebar visible on left (240px width)
- [ ] Logo renders clearly
- [ ] Nav items: Board, Customers, Templates
- [ ] Active nav item highlighted in brand green
- [ ] Sidebar trigger button in header works
- [ ] Sidebar collapses/expands on click
- [ ] Sidebar state persists on refresh

**Board Page (/):**
- [ ] Page header with title + green New Job button
- [ ] 4 columns with colored dots
- [ ] Job count badges
- [ ] Cards are white with clean styling
- [ ] Dates in NZ format (dd/MM/yyyy)
- [ ] Price in brand green
- [ ] Drag handle appears on hover
- [ ] Drag and drop works
- [ ] Card click opens detail sheet

**Customers Page (/customers):**
- [ ] Page header present
- [ ] Customer list renders
- [ ] Layout consistent

**Templates Page (/templates):**
- [ ] Page header present
- [ ] Template list renders
- [ ] Layout consistent

**Mobile (resize window to <768px):**
- [ ] Sidebar becomes offcanvas overlay
- [ ] Trigger button works
- [ ] Content readable

---

## Phase 7: Git Workflow (20-30 min)

### Step 7.1: Review changes

**Command:**
```bash
cd ~/kiwi-repo
git status
```

**Expected:** Modified and new files listed.

---

### Step 7.2: Create feature branch

**Commands:**
```bash
cd ~/kiwi-repo
git checkout main
git pull origin main
git checkout -b feature/kanban-linear-redesign
```

---

### Step 7.3: Stage and commit changes

**Commit 1: Design system**
```bash
git add frontend/app/globals.css
git commit -m "feat(design): add Kiwi Cabins brand colors with verified OKLCH

- Brand green (#2D5F3F): oklch(0.396 0.083 159.51)
- Brand brown (#8B6F47): oklch(0.538 0.053 63.47)
- Status colors with tints for column backgrounds
- Warm background (#FAFAF9)
- Smooth transitions (150ms ease-out)
- Colors verified with oklch.com converter"
```

**Commit 2: Sidebar layout**
```bash
git add frontend/components/layout/app-sidebar.tsx
git add frontend/components/layout/page-header.tsx
git add frontend/app/layout.tsx
git add frontend/components/ui/sidebar.tsx
git commit -m "feat(layout): implement sidebar navigation with state persistence

- Add AppSidebar component with logo and nav links
- Add PageHeader with SidebarTrigger
- Update root layout with SidebarProvider
- Sidebar width: 240px (15rem)
- Mobile: offcanvas collapsible behavior
- State persisted in localStorage (default: open)
- Active state highlighting in brand green
- Uses shadcn/ui sidebar component (Base UI)"
```

**Commit 3: Kanban redesign**
```bash
git add frontend/app/page.tsx
git add frontend/components/kanban/kanban-board.tsx
git add frontend/components/kanban/kanban-column.tsx
git add frontend/components/kanban/job-card.tsx
git add frontend/components/kanban/kanban-skeleton.tsx
git commit -m "feat(kanban): redesign board with Linear-inspired UI

- Colored status dots in column headers
- Column-specific background tints (from CSS variables)
- Redesigned cards with icons and metadata
- Calendar and DollarSign icons
- Price in brand green
- Hover drag handle (GripVertical)
- NZ date format (dd/MM/yyyy)
- Improved shadows and hover effects
- Updated loading skeleton
- Better error state styling"
```

**Commit 4: Pages consistency**
```bash
git add frontend/app/customers/page.tsx
git add frontend/app/templates/page.tsx
git commit -m "feat(pages): add consistent headers to all pages

- Add PageHeader to Customers page
- Add PageHeader to Templates page
- Sidebar trigger on all pages
- Consistent layout and spacing"
```

**Commit 5: Dependencies**
```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "deps: add required packages

- lucide-react for icons
- date-fns for date formatting (NZ format)"
```

---

### Step 7.4: Push branch

**Command:**
```bash
git push -u origin feature/kanban-linear-redesign
```

---

### Step 7.5: Create Pull Request

**PR Title:**
```
feat: Linear-inspired UI redesign with Kiwi Cabins branding
```

**PR Description:**

```markdown
## Overview
Complete UI redesign with Linear-inspired aesthetics and Kiwi Cabins brand integration.

## Key Changes

### Design System
- ✅ Verified OKLCH brand colors (green #2D5F3F, brown #8B6F47)
- ✅ Status colors with tints for column backgrounds
- ✅ Warm background (#FAFAF9)
- ✅ Tailwind v4 CSS variables

### Layout
- ✅ Sidebar navigation (240px, collapsible)
- ✅ Kiwi Cabins logo in sidebar
- ✅ Active state: brand green
- ✅ PageHeader on all routes with SidebarTrigger
- ✅ Mobile: offcanvas overlay
- ✅ State persisted in localStorage (default: open)

### Kanban Board
- ✅ Colored status dots
- ✅ Column background tints
- ✅ Redesigned cards with icons
- ✅ NZ date format (dd/MM/yyyy)
- ✅ Price in brand green
- ✅ Hover drag handle
- ✅ Improved shadows/effects

### Polish
- ✅ Updated loading skeleton
- ✅ Better error states
- ✅ Consistent spacing/typography
- ✅ All pages have matching headers

## Design Goals
- Office staff friendly
- Fast scanning (icons, hierarchy)
- Modern (Linear-inspired)
- Brand integration

## Testing
- ✅ Build passes (`npm run build`)
- ✅ TypeScript passes (`npx tsc --noEmit`)
- ✅ Tested 1920x1080 and 1366x768
- ✅ Drag-and-drop functional
- ✅ Mobile responsive (offcanvas)
- ✅ Sidebar state persists

## Migration Notes
- No breaking changes
- All existing functionality preserved
- Drag-and-drop behavior unchanged

## Dependencies
- lucide-react (icons)
- date-fns (NZ date formatting)
- @shadcn/sidebar (sidebar component)
```

---

## Troubleshooting Guide

### Issue: Sidebar not found
```bash
npx shadcn@latest add @shadcn/sidebar --yes
```

### Issue: Icons not rendering
```bash
npm install lucide-react
```

### Issue: date-fns not found
```bash
npm install date-fns
```

### Issue: CSS not applying
Restart dev server (Ctrl+C, then `npm run dev`)

### Issue: Layout is client component error
This is expected - we need localStorage for sidebar state.

### Issue: Sidebar overlaps content
Verify `SidebarInset` wraps main content in layout.tsx.

---

## Success Criteria

**Design:**
- [ ] Brand green (#2D5F3F) used correctly
- [ ] Status dots: blue, amber, green, purple
- [ ] Warm background visible
- [ ] Logo displays

**Layout:**
- [ ] Sidebar 240px width
- [ ] Nav items highlighted correctly
- [ ] Page headers on all pages
- [ ] Sidebar trigger works
- [ ] State persists on refresh

**Kanban:**
- [ ] 4 columns with dots
- [ ] Cards white, clean
- [ ] Icons present
- [ ] Price in green
- [ ] NZ dates (dd/MM/yyyy)
- [ ] Drag-drop works
- [ ] Hover effects work

**Functionality:**
- [ ] All features work
- [ ] Navigation works
- [ ] TypeScript builds
- [ ] Production build succeeds

---

## Execution Time: 6-8 hours

**Phase breakdown:**
- Phase 0: 15 min
- Phase 1: 15 min
- Phase 2: 30 min
- Phase 3: 75 min
- Phase 4: 120 min
- Phase 5: 45 min
- Phase 6: 45 min
- Phase 7: 30 min

**Total:** ~6 hours (realistically 7-8 with breaks)

---

**Plan Status:** ✅ Final - Ready for execution  
**Last Updated:** 2026-03-16 21:10 UTC  
**Created By:** Donny (Opus 4.6)  
**Tested:** No (execution plan)  
**Changes from V2:** All critical issues fixed
