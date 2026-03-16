# KiwiInv Kanban Redesign - Implementation Plan

**Goal:** Transform current basic UI into a modern, Linear-inspired design with Kiwi Cabins branding
**Scope:** Kanban board page (home page) - sidebar nav, color system, card redesign
**Execution Model:** Sonnet 4.5 (this plan written by Opus for clear execution)

---

## Phase 1: Design System Foundation (60-90 min)

### Step 1.1: Tailwind Theme Configuration
**File:** `frontend/tailwind.config.ts`

**Actions:**
1. Add custom colors to theme.extend.colors:
```typescript
colors: {
  brand: {
    green: {
      DEFAULT: '#2D5F3F',
      light: '#3D7F5F',
      dark: '#1D4F2F',
    },
    brown: {
      DEFAULT: '#8B6F47',
      light: '#AB8F67',
      dark: '#6B4F27',
    },
  },
  status: {
    quote: '#3B82F6',
    progress: '#F59E0B',
    completed: '#10B981',
    delivered: '#8B5CF6',
  },
  background: {
    warm: '#FAFAF9',
  },
}
```

2. Add spacing scale for consistent layouts:
```typescript
spacing: {
  'sidebar': '240px',
  'sidebar-collapsed': '60px',
}
```

3. Update boxShadow for cards:
```typescript
boxShadow: {
  'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
  'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
}
```

**Test:** Run `npm run dev` - should compile with no errors

---

### Step 1.2: Global CSS Updates
**File:** `frontend/app/globals.css`

**Actions:**
1. Update body background:
```css
body {
  background-color: #FAFAF9;
}
```

2. Add smooth transitions for interactive elements:
```css
* {
  @apply transition-colors duration-150;
}
```

**Test:** Check browser - background should be warm off-white

---

## Phase 2: Layout Architecture (90-120 min)

### Step 2.1: Create Sidebar Component
**File:** `frontend/components/layout/sidebar.tsx`

**Structure:**
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutGrid, Users, FileText } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', label: 'Board', icon: LayoutGrid },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/templates', label: 'Templates', icon: FileText },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Image 
          src="/kiwi-logo-dark.png" 
          alt="Kiwi Cabins" 
          width={160} 
          height={40}
          className="h-10 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Dependencies:** 
- Install lucide-react if not present: `npm install lucide-react`
- Logo files already in `/public`

**Test:** Import and render in layout - sidebar should appear fixed left

---

### Step 2.2: Update Root Layout
**File:** `frontend/app/layout.tsx`

**Actions:**
1. Import Sidebar component
2. Replace NavHeader with Sidebar
3. Add margin-left to main content area

**Before:**
```tsx
<body>
  <Providers>
    <NavHeader />
    {children}
    <Toaster />
  </Providers>
</body>
```

**After:**
```tsx
<body>
  <Providers>
    <Sidebar />
    <main className="ml-sidebar">
      {children}
    </main>
    <Toaster />
  </Providers>
</body>
```

**Note:** Keep NavHeader component file for now (may reuse parts), just don't render it

**Test:** All pages should have sidebar on left, content shifted right

---

### Step 2.3: Create Page Header Component
**File:** `frontend/components/layout/page-header.tsx`

**Purpose:** Consistent top bar for each page (title left, action right)

```tsx
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="h-16 px-8 border-b border-gray-200 bg-white flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}
```

**Test:** Import in a page, should render clean top bar

---

## Phase 3: Kanban Board Redesign (120-180 min)

### Step 3.1: Update Kanban Board Page
**File:** `frontend/app/page.tsx`

**Actions:**
1. Add PageHeader with "Jobs Board" title and "+ New Job" button
2. Update container styling for new layout
3. Adjust background colors

**Structure:**
```tsx
import { PageHeader } from '@/components/layout/page-header';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { CreateJobDialog } from '@/components/kanban/create-job-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col bg-background-warm">
      <PageHeader 
        title="Jobs Board"
        action={
          <CreateJobDialog>
            <Button className="bg-brand-green hover:bg-brand-green-dark text-white">
              <Plus className="w-4 h-4 mr-2" />
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

**Test:** Page should have header bar + kanban below

---

### Step 3.2: Redesign Kanban Column Component
**File:** `frontend/components/kanban/kanban-column.tsx`

**Key Changes:**
1. Add colored status dot to header
2. Update header styling (cleaner, minimal)
3. Adjust card spacing and background
4. Update drop zone styling

**Column Header with Status Dot:**
```tsx
const statusColors = {
  quote: 'bg-status-quote',
  in_progress: 'bg-status-progress',
  completed: 'bg-status-completed',
  delivered: 'bg-status-delivered',
};

// In header:
<div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
  <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
  <h3 className="font-semibold text-gray-900">{title}</h3>
  <span className="ml-auto text-sm text-gray-500">{jobs.length}</span>
</div>
```

**Column Body:**
```tsx
<div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
  {/* Cards go here */}
</div>
```

**Test:** Columns should have colored dots, clean headers, gray backgrounds

---

### Step 3.3: Redesign Job Card Component
**File:** `frontend/components/kanban/job-card.tsx`

**Complete Redesign:**

```tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanJob } from '@/types/api';
import { JobDetailSheet } from '@/components/jobs/job-detail-sheet';
import { Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface JobCardProps {
  job: KanbanJob;
}

export function JobCard({ job }: JobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <JobDetailSheet jobId={job.id}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`
          bg-white rounded-lg p-3 border border-gray-200
          shadow-card hover:shadow-card-hover
          cursor-pointer group
          ${isDragging ? 'opacity-50 rotate-2' : ''}
        `}
      >
        {/* Header: Job number */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-gray-500">{job.job_number}</span>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {job.notes || 'Untitled Job'}
        </h4>

        {/* Customer */}
        <p className="text-sm text-gray-600 mb-3">{job.customer_name}</p>

        {/* Metadata */}
        <div className="space-y-1.5 text-sm text-gray-500">
          {job.expected_completion && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Due {format(new Date(job.expected_completion), 'MMM d')}</span>
            </div>
          )}
          {job.total_price && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium text-brand-green">
                ${parseFloat(job.total_price).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </JobDetailSheet>
  );
}
```

**Dependencies:**
- `date-fns` likely already installed (check package.json)
- If not: `npm install date-fns`

**Visual Goals:**
- Clean white card with subtle shadow
- Hover effect (shadow increases)
- Icons for metadata (calendar, dollar sign)
- Price in brand green
- Compact but readable

**Test:** Cards should look modern, minimal, with clear hierarchy

---

### Step 3.4: Update Kanban Board Container
**File:** `frontend/components/kanban/kanban-board.tsx`

**Actions:**
1. Update grid layout for better column spacing
2. Adjust overall container styling
3. Ensure columns stretch to full height

**Grid Layout:**
```tsx
<div className="grid grid-cols-4 gap-4 h-full">
  {columns.map((column) => (
    <KanbanColumn key={column.status} {...column} />
  ))}
</div>
```

**Test:** 4 columns, equal width, proper spacing, fills available height

---

## Phase 4: Polish & Refinement (60-90 min)

### Step 4.1: Update Other Pages (Customers, Templates)
**Files:** 
- `frontend/app/customers/page.tsx`
- `frontend/app/templates/page.tsx`

**Actions:**
1. Add PageHeader to each page
2. Update container backgrounds to match (bg-background-warm)
3. Ensure consistent padding/spacing

**Template:**
```tsx
import { PageHeader } from '@/components/layout/page-header';

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-background-warm">
      <PageHeader title="Customers" action={/* CTA button */} />
      <div className="p-8">
        {/* Existing content */}
      </div>
    </div>
  );
}
```

**Test:** All pages should have consistent header + background

---

### Step 4.2: Button Styling Consistency
**File:** `frontend/components/ui/button.tsx`

**Action:** Add brand-green variant if not exists

Check if shadcn button component supports custom variants. If needed, update:

```tsx
// Add to variant definitions
brandGreen: "bg-brand-green text-white hover:bg-brand-green-dark",
```

Or use className override in usage (simpler):
```tsx
<Button className="bg-brand-green hover:bg-brand-green-dark text-white">
```

**Test:** Green buttons should match brand color

---

### Step 4.3: Loading States
**File:** `frontend/components/kanban/kanban-skeleton.tsx`

**Actions:**
1. Update skeleton to match new card design
2. Use warm background colors
3. Match new spacing/layout

**Updated Skeleton:**
```tsx
export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-3 space-y-2 bg-gray-50">
            {[1, 2, 3].map((card) => (
              <div key={card} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
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

**Test:** Loading state should match redesigned layout

---

## Phase 5: Testing & Validation (30-45 min)

### Step 5.1: Visual Testing Checklist

**Desktop (1920x1080):**
- [ ] Sidebar fixed at 240px width
- [ ] Logo renders clearly
- [ ] Nav items highlight on active page
- [ ] Columns are equal width
- [ ] Cards have consistent spacing
- [ ] Hover states work (card shadow, nav items)
- [ ] Colors match design spec

**Smaller Desktop (1366x768):**
- [ ] Layout doesn't break
- [ ] Horizontal scroll doesn't appear
- [ ] Cards remain readable

**Interactions:**
- [ ] Drag and drop still works
- [ ] Card click opens detail sheet
- [ ] New Job dialog opens
- [ ] Navigation changes pages correctly

---

### Step 5.2: Build Test
**Commands:**
```bash
cd frontend
npm run build
```

**Expected:** No TypeScript errors, build completes successfully

**Common Issues to Watch:**
- Missing imports (lucide-react, date-fns)
- Type errors from updated props
- Image path issues

---

### Step 5.3: Browser Testing
**Actions:**
1. Run dev server: `npm run dev`
2. Open http://localhost:3000
3. Check all 3 pages (board, customers, templates)
4. Test drag-and-drop
5. Test responsive behavior (resize window)

---

## Phase 6: Git Workflow (15-30 min)

### Step 6.1: Create Feature Branch
```bash
cd ~/kiwi-repo
git checkout main
git pull origin main
git checkout -b feature/kanban-redesign-linear-style
```

---

### Step 6.2: Commit Strategy

**Commit 1: Design system foundation**
```bash
git add frontend/tailwind.config.ts frontend/app/globals.css
git commit -m "feat(ui): add design system foundation

- Add brand colors (green, brown)
- Add status colors (quote, progress, completed, delivered)
- Add warm background color
- Configure custom spacing and shadows
- Update global CSS for consistent transitions"
```

**Commit 2: Layout architecture**
```bash
git add frontend/components/layout/sidebar.tsx
git add frontend/components/layout/page-header.tsx
git add frontend/app/layout.tsx
git add frontend/public/kiwi-logo-*.png
git commit -m "feat(layout): implement sidebar navigation

- Create Sidebar component with logo and nav items
- Add PageHeader component for consistent page structure
- Update root layout to use sidebar instead of top nav
- Add Kiwi Cabins logo assets
- Implement active state highlighting"
```

**Commit 3: Kanban redesign**
```bash
git add frontend/app/page.tsx
git add frontend/components/kanban/*.tsx
git commit -m "feat(kanban): redesign board with Linear-inspired UI

- Add colored status dots to column headers
- Redesign job cards with icons and metadata
- Update card styling (shadows, hover states, spacing)
- Improve visual hierarchy and readability
- Add Calendar and DollarSign icons for metadata
- Update loading skeleton to match new design"
```

**Commit 4: Polish**
```bash
git add frontend/app/customers/page.tsx frontend/app/templates/page.tsx
git commit -m "feat(ui): apply consistent styling to all pages

- Add PageHeader to Customers and Templates pages
- Apply warm background across all pages
- Ensure consistent spacing and layout"
```

---

### Step 6.3: Push and Create PR
```bash
git push -u origin feature/kanban-redesign-linear-style
```

**PR Description Template:**
```markdown
## Kanban Redesign - Linear-Inspired UI

### Overview
Complete redesign of the KiwiInv interface with a modern, Linear-inspired aesthetic and Kiwi Cabins branding.

### Key Changes
- ✅ Sidebar navigation (replaces top nav)
- ✅ Brand color system (green/brown palette from kiwicabins.co.nz)
- ✅ Redesigned kanban cards with icons and improved hierarchy
- ✅ Status-colored dots in column headers
- ✅ Consistent page headers across all routes
- ✅ Warm background (#FAFAF9) with white cards

### Design Goals
- Office staff friendly (clean, approachable)
- Fast scanning (clear hierarchy, icons)
- Modern but not intimidating
- Kiwi Cabins brand integration

### Screenshots
[Add screenshots here before submitting]

### Testing
- ✅ All pages render correctly
- ✅ Drag-and-drop still functional
- ✅ Build passes (`npm run build`)
- ✅ No TypeScript errors
- ✅ Responsive at 1366x768 and 1920x1080

### Next Steps
After this PR:
- Job detail sheet redesign
- Structure cards within jobs
- Mobile responsiveness (if needed)
```

---

## Troubleshooting Guide

### Issue: Lucide icons not found
**Solution:**
```bash
cd frontend
npm install lucide-react
```

### Issue: date-fns not found
**Solution:**
```bash
cd frontend
npm install date-fns
```

### Issue: Tailwind colors not applying
**Check:**
1. `tailwind.config.ts` saved and syntax valid
2. Dev server restarted after config change
3. Class names correct (e.g., `bg-brand-green` not `bg-brandGreen`)

### Issue: Logo not displaying
**Check:**
1. Files exist in `frontend/public/`
2. Image paths correct (`/kiwi-logo-dark.png` not `./kiwi-logo-dark.png`)
3. Next.js Image component imported

### Issue: Sidebar overlaps content
**Check:**
1. Main element has `ml-sidebar` class
2. Tailwind config has sidebar spacing defined
3. Sidebar has `fixed` positioning

---

## Execution Notes for AI Agents

**When executing this plan:**

1. **Work sequentially** - Don't skip phases, each builds on previous
2. **Test after each step** - Don't accumulate errors
3. **Commit frequently** - Small commits are better than one giant commit
4. **Check dependencies** - Install packages before using them
5. **Read existing code first** - Match patterns, don't reinvent
6. **Ask before deviating** - If something doesn't make sense, ask Adam

**Red flags to watch:**
- Build errors (stop and fix immediately)
- TypeScript errors (fix before moving forward)
- Breaking existing functionality (drag-drop must keep working)
- Inconsistent styling (all pages should feel cohesive)

**Success criteria:**
- Kanban board looks modern and professional
- Colors match Kiwi Cabins brand
- Layout feels like Linear (clean, minimal, fast)
- Office staff can use it without confusion
- All existing functionality still works

---

## Estimated Time: 6-8 hours total

**Phase breakdown:**
- Phase 1 (Design System): 1-1.5 hours
- Phase 2 (Layout): 1.5-2 hours
- Phase 3 (Kanban): 2-3 hours
- Phase 4 (Polish): 1-1.5 hours
- Phase 5 (Testing): 0.5-0.75 hours
- Phase 6 (Git): 0.25-0.5 hours

**If running into blockers:**
- Try for max 30 minutes
- Document what you tried
- Ask Adam for help

---

**Plan created:** 2026-03-16 by Donny (Opus 4.6)
**Ready for execution by:** Sonnet 4.5 or any model with frontend experience
**Last updated:** 2026-03-16 07:51 UTC
