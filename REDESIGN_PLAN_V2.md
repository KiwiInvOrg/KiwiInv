# KiwiInv Kanban Redesign - Detailed Implementation Plan v2

**Written by:** Donny (Opus 4.6) on 2026-03-16  
**Execution Model:** Sonnet 4.5 (or any frontend-capable model)  
**Estimated Time:** 6-8 hours total  
**Goal:** Transform basic UI into Linear-inspired design with Kiwi Cabins branding

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

**If not in frontend directory:**
```bash
cd ~/kiwi-repo/frontend
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

Always use `render` prop for component composition.

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
File exists.

**If fails:** Run command again. If still fails, check internet connection and npm registry access.

---

### Step 1.2: Install lucide-react icons (if not already installed)

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

**Expected output:**
```
"lucide-react": "^0.468.0",
```

---

## Phase 2: Brand Color System (20-30 min)

### Step 2.1: Update CSS variables with Kiwi Cabins brand colors

**File:** `frontend/app/globals.css`

**Action:** Replace the entire `:root` block (starting at line ~50) with the following:

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
  
  /* Kiwi Cabins Brand Colors */
  --color-brand-green: oklch(0.42 0.12 155);        /* #2D5F3F - Primary green */
  --color-brand-green-light: oklch(0.52 0.12 155);  /* Lighter green */
  --color-brand-green-dark: oklch(0.32 0.12 155);   /* Darker green */
  --color-brand-brown: oklch(0.56 0.08 70);         /* #8B6F47 - Accent brown */
  --color-brand-brown-light: oklch(0.66 0.08 70);   /* Lighter brown */
  --color-brand-brown-dark: oklch(0.46 0.08 70);    /* Darker brown */
  
  /* Status Colors */
  --color-status-quote: oklch(0.60 0.20 250);       /* Blue */
  --color-status-progress: oklch(0.75 0.15 70);     /* Amber */
  --color-status-completed: oklch(0.65 0.18 155);   /* Green */
  --color-status-delivered: oklch(0.62 0.22 290);   /* Purple */
  
  /* Background Colors */
  --color-background-warm: oklch(0.98 0.002 85);    /* #FAFAF9 */
  
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
  
  /* Primary (use brand green) */
  --primary: oklch(0.42 0.12 155);           /* Brand green #2D5F3F */
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
  --ring: oklch(0.42 0.12 155);              /* Brand green for focus rings */
  
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
  --sidebar-primary: oklch(0.42 0.12 155);   /* Brand green for active */
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);         /* Light gray hover */
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);        /* Light gray border */
  --sidebar-ring: oklch(0.42 0.12 155);      /* Brand green focus */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.52 0.12 155);           /* Lighter green for dark mode */
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.809 0.105 251.813);
  --chart-2: oklch(0.623 0.214 259.815);
  --chart-3: oklch(0.546 0.245 262.881);
  --chart-4: oklch(0.488 0.243 264.376);
  --chart-5: oklch(0.424 0.199 265.638);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
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

**Expected:** Dev server starts with no CSS errors. Background should be warm off-white (#FAFAF9).

**If errors:** Check for syntax errors in CSS. Ensure all closing braces are present.

---

## Phase 3: Create Sidebar Layout (45-60 min)

### Step 3.1: Create new sidebar component with Kiwi Cabins branding

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
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <Link href="/" className="flex items-center">
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

### Step 3.2: Create page header component

**File:** `frontend/components/layout/page-header.tsx` (NEW FILE)

**COMPLETE FILE CONTENTS:**

```tsx
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
  description?: string;
}

export function PageHeader({ title, action, description }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
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

### Step 3.3: Update root layout to use sidebar

**File:** `frontend/app/layout.tsx`

**COMPLETE FILE CONTENTS (replace entire file):**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kiwi Cabins",
  description: "Job management system for Kiwi Cabins",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SidebarProvider>
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

**Key changes:**
- Import `AppSidebar`, `SidebarProvider`, `SidebarInset`
- Remove `NavHeader` import
- Wrap content in `SidebarProvider` with `AppSidebar` and `SidebarInset`

**Validation:**
```bash
npm run dev
```

Open http://localhost:3000 in browser.

**Expected:**
- Sidebar visible on left with logo
- Three nav items: Board, Customers, Templates
- Board is highlighted (active state)
- Main content shifted right of sidebar

**If sidebar not showing:**
- Check console for errors
- Verify `components/ui/sidebar.tsx` exists
- Check imports are correct

---

## Phase 4: Redesign Kanban Board (90-120 min)

### Step 4.1: Update home page with page header

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

**Key changes:**
- Added `PageHeader` with title and New Job button
- Styled button with brand green
- Added description prop
- Used `Plus` icon from lucide-react

**Validation:**
```bash
# Server should already be running from previous step
# Refresh browser at http://localhost:3000
```

**Expected:**
- Page header at top with "Jobs Board" title
- Green "New Job" button on right
- Kanban board below header

**If CreateJobDialog error:**
Check that `CreateJobDialog` is a client component and uses Base UI patterns.

---

### Step 4.2: Redesign kanban column component

**File:** `frontend/components/kanban/kanban-column.tsx`

**Read current file first:**
```bash
cat components/kanban/kanban-column.tsx
```

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
    bgColor: "bg-blue-50/50",
  },
  in_progress: {
    title: "In Progress",
    dotColor: "bg-status-progress",
    bgColor: "bg-amber-50/50",
  },
  completed: {
    title: "Completed",
    dotColor: "bg-status-completed",
    bgColor: "bg-green-50/50",
  },
  delivered: {
    title: "Delivered",
    dotColor: "bg-status-delivered",
    bgColor: "bg-purple-50/50",
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

**Key changes:**
- Colored status dots in header
- Column-specific background colors (light tints)
- Badge for job count
- Empty state placeholder
- Better spacing and typography

**Validation:**
Refresh browser.

**Expected:**
- Columns have colored dots (blue, amber, green, purple)
- Each column shows job count badge
- Column backgrounds have subtle color tints
- Empty columns show "No jobs" message

---

### Step 4.3: Redesign job card component

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
                Due {format(new Date(job.expected_completion), "MMM d")}
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

**Dependencies check:**
```bash
grep "date-fns" package.json
```

**If not found:**
```bash
npm install date-fns
```

**Key changes:**
- Drag handle with grip icon (appears on hover)
- Icons for metadata (Calendar, DollarSign)
- Price in brand green color
- Better visual hierarchy
- Hover shadow effect
- Line-clamped title (max 2 lines)

**Validation:**
Refresh browser.

**Expected:**
- Cards are white with clean layout
- Job number in mono font at top
- Customer name and notes visible
- Due date with calendar icon
- Price in green with dollar icon
- Drag handle appears on hover (six dots icon)
- Shadow increases on hover

---

### Step 4.4: Update kanban board container

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

**Key changes:**
- Removed duplicate header (now in page.tsx)
- Better error state with destructive styling
- Grid layout fills full height
- Cleaner structure

**Validation:**
Refresh browser.

**Expected:**
- 4 columns fill available height
- Equal width columns with proper spacing
- Drag and drop still works
- Clicking card opens detail sheet

---

## Phase 5: Update Other Pages (30-45 min)

### Step 5.1: Update customers page

**File:** `frontend/app/customers/page.tsx`

**Read current file:**
```bash
cat app/customers/page.tsx | head -20
```

**Add PageHeader import at top:**
```tsx
import { PageHeader } from "@/components/layout/page-header";
```

**Wrap content with PageHeader:**

Find the return statement and update to:

```tsx
export default function CustomersPage() {
  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="Customers" description="Manage customer information" />
      <div className="flex-1 overflow-auto p-8">
        {/* Existing content stays here */}
      </div>
    </div>
  );
}
```

**Note:** Keep all existing customer list/dialog logic. Just wrap it.

**Validation:**
Navigate to /customers in browser.

**Expected:**
- Page header with "Customers" title
- Customer list below
- Layout matches kanban board

---

### Step 5.2: Update templates page

**File:** `frontend/app/templates/page.tsx`

**Same pattern as customers:**

Add import:
```tsx
import { PageHeader } from "@/components/layout/page-header";
```

Update return:
```tsx
export default function TemplatesPage() {
  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="Templates" description="Structure templates catalog" />
      <div className="flex-1 overflow-auto p-8">
        {/* Existing content stays here */}
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

## Phase 6: Polish & Fix Issues (45-60 min)

### Step 6.1: Update loading skeleton

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
To test, temporarily add a delay in the kanban hook or disconnect backend.

**Expected:**
- 4 skeleton columns
- Animated pulsing effect
- Matches new card/column design

---

### Step 6.2: Verify brand green button styling

**Check if Button component supports custom classes:**

The buttons should already work with `className="bg-brand-green..."` but if not working:

**File:** `frontend/components/ui/button.tsx`

Check if it has a `cn()` utility that merges class names.

**If buttons aren't green:**
Ensure the className in page.tsx New Job button is:
```tsx
className="bg-brand-green hover:bg-brand-green-dark text-primary-foreground"
```

---

## Phase 7: Build Test & Validation (20-30 min)

### Step 7.1: TypeScript check

**Command:**
```bash
cd ~/kiwi-repo/frontend
npx tsc --noEmit
```

**Expected output:**
No errors.

**If errors:**
- Read error messages carefully
- Common issues: missing imports, wrong prop types
- Fix errors one by one
- Re-run check

---

### Step 7.2: Build test

**Command:**
```bash
npm run build
```

**Expected output:**
```
✓ Compiled successfully
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /customers
└ ○ /templates
```

**If build fails:**
- Read error output
- Fix issues
- Re-run build
- Do NOT proceed until build passes

---

### Step 7.3: Visual testing checklist

**Start dev server:**
```bash
npm run dev
```

**Test at http://localhost:3000:**

**Layout:**
- [ ] Sidebar visible on left (240px width)
- [ ] Logo renders clearly
- [ ] Nav items: Board, Customers, Templates
- [ ] Active nav item highlighted in green
- [ ] Main content shifted right

**Board Page (/):**
- [ ] Page header: "Jobs Board" title + green New Job button
- [ ] 4 columns: Quote (blue), In Progress (amber), Completed (green), Delivered (purple)
- [ ] Colored dots in column headers
- [ ] Job count badges
- [ ] Cards are white with clean styling
- [ ] Icons show: calendar, dollar sign
- [ ] Price in brand green
- [ ] Drag handle appears on hover
- [ ] Drag and drop works
- [ ] Card click opens detail sheet

**Customers Page (/customers):**
- [ ] Page header present
- [ ] Customer list renders
- [ ] Layout consistent with Board

**Templates Page (/templates):**
- [ ] Page header present
- [ ] Template list renders
- [ ] Layout consistent

**Interactions:**
- [ ] Navigation changes pages
- [ ] Clicking logo returns to home
- [ ] New Job dialog opens
- [ ] Job detail sheet opens/closes
- [ ] Drag and drop updates status

---

## Phase 8: Git Workflow (20-30 min)

### Step 8.1: Review changes

**Command:**
```bash
cd ~/kiwi-repo
git status
git diff frontend/app/globals.css | head -50
```

**Expected:**
Modified files listed. CSS changes visible.

---

### Step 8.2: Create feature branch

**Commands:**
```bash
cd ~/kiwi-repo
git checkout main
git pull origin main
git checkout -b feature/kanban-linear-redesign
```

**Expected output:**
```
Switched to a new branch 'feature/kanban-linear-redesign'
```

---

### Step 8.3: Stage and commit changes

**Atomic commits for better review:**

**Commit 1: Design system**
```bash
git add frontend/app/globals.css
git add frontend/public/kiwi-logo-dark.png
git add frontend/public/kiwi-logo-light.png
git commit -m "feat(design): add Kiwi Cabins brand colors and assets

- Add brand colors (green #2D5F3F, brown #8B6F47)
- Add status colors (blue, amber, green, purple)
- Add warm background (#FAFAF9)
- Configure CSS variables in Tailwind v4 theme
- Add Kiwi Cabins logo assets (dark + light versions)"
```

**Commit 2: Sidebar layout**
```bash
git add frontend/components/layout/app-sidebar.tsx
git add frontend/components/layout/page-header.tsx
git add frontend/app/layout.tsx
git add frontend/components/ui/sidebar.tsx 2>/dev/null || echo "Already added"
git commit -m "feat(layout): implement sidebar navigation

- Add AppSidebar component with logo and nav links
- Add PageHeader component for consistent page structure
- Update root layout to use SidebarProvider
- Replace top nav with fixed sidebar
- Add active state highlighting in brand green
- Use shadcn/ui sidebar component"
```

**Commit 3: Kanban redesign**
```bash
git add frontend/app/page.tsx
git add frontend/components/kanban/kanban-board.tsx
git add frontend/components/kanban/kanban-column.tsx
git add frontend/components/kanban/job-card.tsx
git add frontend/components/kanban/kanban-skeleton.tsx
git commit -m "feat(kanban): redesign board with Linear-inspired UI

- Add colored status dots to column headers
- Add column-specific background tints
- Redesign job cards with icons and metadata
- Add Calendar and DollarSign icons
- Show price in brand green
- Add hover drag handle (GripVertical icon)
- Improve card shadows and hover effects
- Update loading skeleton to match new design
- Better error state styling"
```

**Commit 4: Page consistency**
```bash
git add frontend/app/customers/page.tsx
git add frontend/app/templates/page.tsx
git commit -m "feat(pages): add consistent headers to all pages

- Add PageHeader to Customers page
- Add PageHeader to Templates page
- Ensure consistent layout across all routes"
```

**Commit 5: Dependencies (if installed)**
```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "deps: add lucide-react and date-fns

- Add lucide-react for icons
- Add date-fns for date formatting"
```

---

### Step 8.4: Push branch

**Command:**
```bash
git push -u origin feature/kanban-linear-redesign
```

**Expected output:**
```
remote: Create a pull request for 'feature/kanban-linear-redesign' on GitHub by visiting:
remote:      https://github.com/KiwiInvOrg/KiwiInv/pull/new/feature/kanban-linear-redesign
```

---

### Step 8.5: Create Pull Request

**Use the GitHub link from push output, or create manually.**

**PR Title:**
```
feat: Linear-inspired UI redesign with Kiwi Cabins branding
```

**PR Description:**

```markdown
## Overview
Complete UI redesign of the KiwiInv kanban board with Linear-inspired aesthetics and Kiwi Cabins brand integration.

## Key Changes

### Design System
- ✅ Kiwi Cabins brand colors (green #2D5F3F, brown #8B6F47)
- ✅ Status colors for job stages (blue, amber, green, purple)
- ✅ Warm background (#FAFAF9) for reduced eye strain
- ✅ Configured using Tailwind v4 CSS variables

### Layout
- ✅ Sidebar navigation (replaces top nav)
- ✅ Kiwi Cabins logo in sidebar header
- ✅ Active state highlighting in brand green
- ✅ Consistent PageHeader across all routes
- ✅ Uses shadcn/ui sidebar component

### Kanban Board
- ✅ Colored status dots in column headers
- ✅ Column-specific background tints
- ✅ Redesigned job cards with better hierarchy
- ✅ Icons for metadata (calendar, dollar)
- ✅ Price displayed in brand green
- ✅ Hover drag handle for better UX
- ✅ Improved shadows and hover effects

### Polish
- ✅ Updated loading skeleton
- ✅ Better error states
- ✅ Consistent spacing and typography
- ✅ All pages have matching headers

## Design Goals
- Office staff friendly (clean, approachable, not intimidating)
- Fast scanning (clear visual hierarchy, icons)
- Modern but timeless (inspired by Linear's design)
- Brand integration (Kiwi Cabins colors and logo)

## Testing

### Build
```bash
npm run build
```
✅ Passes with no errors

### TypeScript
```bash
npx tsc --noEmit
```
✅ No type errors

### Visual Testing
- ✅ Tested on 1920x1080
- ✅ Tested on 1366x768
- ✅ Drag and drop works correctly
- ✅ All interactions functional
- ✅ Sidebar navigation working
- ✅ Job detail sheet opens/closes

## Screenshots
[Add before/after screenshots here]

## Migration Notes
- No breaking changes to existing functionality
- All existing hooks and API calls unchanged
- Data structure unchanged
- Drag-and-drop behavior preserved

## Dependencies Added
- `lucide-react` - Icons (Calendar, DollarSign, GripVertical, etc.)
- `date-fns` - Date formatting
- `@shadcn/sidebar` - Sidebar component from shadcn/ui

## Next Steps
After this PR, future work could include:
- Job detail sheet redesign
- Structure cards within jobs
- Mobile responsiveness (if needed)
- Dark mode refinements
```

---

## Troubleshooting Guide

### Issue: Sidebar component not found

**Error:**
```
Module not found: Can't resolve '@/components/ui/sidebar'
```

**Solution:**
```bash
cd ~/kiwi-repo/frontend
npx shadcn@latest add @shadcn/sidebar --yes
```

---

### Issue: lucide-react icons not rendering

**Error:**
```
Module not found: Can't resolve 'lucide-react'
```

**Solution:**
```bash
npm install lucide-react
```

---

### Issue: date-fns not found

**Error:**
```
Module not found: Can't resolve 'date-fns'
```

**Solution:**
```bash
npm install date-fns
```

---

### Issue: CSS variables not working

**Symptoms:**
- Colors not showing
- Green not appearing

**Check:**
1. `app/globals.css` saved correctly
2. Dev server restarted after CSS changes
3. No syntax errors in CSS (missing braces, semicolons)

**Solution:**
```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

---

### Issue: Sidebar overlaps content

**Symptoms:**
- Main content hidden behind sidebar
- No space for sidebar

**Check:**
1. `SidebarProvider` wraps everything in layout.tsx
2. `SidebarInset` contains main content
3. No conflicting layout CSS

**Solution:**
Verify layout.tsx structure matches Step 3.3 exactly.

---

### Issue: Brand colors not showing

**Symptoms:**
- Buttons not green
- Status dots wrong colors

**Check:**
1. CSS variables defined in `:root` block
2. Class names correct: `bg-brand-green` not `bg-brandGreen`
3. Using `color-` prefix in @theme inline

**Solution:**
Copy globals.css from Step 2.1 exactly.

---

### Issue: TypeScript errors

**Common errors:**

**"Cannot find module 'lucide-react'"**
→ Install: `npm install lucide-react`

**"Property 'render' does not exist"**
→ You're using Radix pattern. Use Base UI pattern (render prop).

**"Type 'string | undefined' is not assignable"**
→ Add null check or use optional chaining: `job.total_price ?? "0"`

---

### Issue: Build fails

**Read the error output carefully.**

**Common causes:**
- Missing imports
- Syntax errors
- Type mismatches
- Missing dependencies

**Solution:**
1. Fix one error at a time
2. Re-run build after each fix
3. Check file paths are correct
4. Verify all imports exist

---

## Success Criteria Checklist

Before marking this task complete, verify ALL of these:

**Design System:**
- [ ] Brand green (#2D5F3F) used for primary actions
- [ ] Status colors: blue (quote), amber (progress), green (completed), purple (delivered)
- [ ] Warm background (#FAFAF9) visible
- [ ] Logo displays correctly

**Layout:**
- [ ] Sidebar fixed on left (240px width)
- [ ] Navigation items: Board, Customers, Templates
- [ ] Active nav item highlighted in brand green
- [ ] Page headers on all pages
- [ ] Main content properly positioned

**Kanban Board:**
- [ ] 4 columns with colored dots
- [ ] Column backgrounds have subtle tints
- [ ] Job cards are white with clean styling
- [ ] Icons present: calendar, dollar, drag handle
- [ ] Price in brand green
- [ ] Hover effects work (shadow, drag handle visibility)
- [ ] Drag and drop functional
- [ ] Card click opens detail sheet

**Functionality:**
- [ ] All existing features still work
- [ ] No broken interactions
- [ ] Navigation between pages works
- [ ] New Job dialog opens
- [ ] Job detail sheet opens/closes
- [ ] Loading states render correctly
- [ ] Error states render correctly

**Code Quality:**
- [ ] TypeScript build passes (`npx tsc --noEmit`)
- [ ] Production build succeeds (`npm run build`)
- [ ] No console errors
- [ ] Git commits are atomic and well-messaged
- [ ] Branch pushed to GitHub
- [ ] PR created with detailed description

**Visual Quality:**
- [ ] Spacing is consistent
- [ ] Typography hierarchy is clear
- [ ] Colors are harmonious
- [ ] Layout doesn't break at 1366x768
- [ ] No visual glitches or overlaps

---

## Execution Time Estimate

**Phase 1:** Install Components → 10-15 min  
**Phase 2:** Brand Colors → 20-30 min  
**Phase 3:** Sidebar Layout → 45-60 min  
**Phase 4:** Kanban Redesign → 90-120 min  
**Phase 5:** Other Pages → 30-45 min  
**Phase 6:** Polish → 45-60 min  
**Phase 7:** Testing → 20-30 min  
**Phase 8:** Git Workflow → 20-30 min  

**Total:** 5-7 hours (realistically 6-8 with breaks and debugging)

---

## Final Notes

### For AI Agents Executing This Plan

**Work sequentially.** Do not skip phases.

**Test after each step.** Don't accumulate errors.

**Ask if stuck.** Don't spin for more than 30 minutes.

**Copy code exactly.** Don't modify unless you understand why.

**Check validation criteria.** Ensure each step completes before moving on.

**Commit frequently.** Small commits are easier to debug.

### Red Flags to Watch For

🚩 Build errors (stop and fix immediately)  
🚩 TypeScript errors (fix before continuing)  
🚩 Console errors in browser (investigate immediately)  
🚩 Drag-and-drop stops working (you broke something, revert)  
🚩 Sidebar not showing (missing component or wrong imports)  
🚩 Colors not appearing (CSS syntax error or wrong class names)  

---

**Plan Status:** ✅ Complete and ready for execution  
**Last Updated:** 2026-03-16 08:00 UTC  
**Created By:** Donny (Opus 4.6)  
**Tested:** No (execution plan only)
