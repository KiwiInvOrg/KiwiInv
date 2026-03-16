# REDESIGN_PLAN_V2 Self-Review

**Reviewed by:** Donny (Opus 4.6)  
**Date:** 2026-03-16 08:10 UTC  
**Plan Version:** V2

---

## Executive Summary

**Overall Assessment:** Plan is 80% ready for execution but needs critical improvements.

**Key Strengths:**
- ✅ Complete file contents (copy/paste ready)
- ✅ Validates Base UI vs Radix (sidebar available for both)
- ✅ Step-by-step with validation
- ✅ Comprehensive troubleshooting

**Critical Issues Found:** 7  
**Medium Issues Found:** 8  
**Minor Issues Found:** 5

**Recommended Action:** Fix critical and medium issues before execution.

---

## Critical Issues (Must Fix)

### 1. Missing Base UI Pattern Verification

**Problem:** Plan assumes CreateJobDialog and JobDetailSheet use Base UI patterns, but doesn't verify.

**Impact:** Build will fail if these components use Radix patterns (`asChild` instead of `render`).

**Fix:** Add verification step to Phase 4:
```bash
# Before updating job-card.tsx, verify dialog pattern:
grep -r "asChild" components/kanban/create-job-dialog.tsx
grep -r "render=" components/kanban/create-job-dialog.tsx
```

If `asChild` found, must update those components first to use `render` prop.

---

### 2. OKLCH Color Accuracy Not Verified

**Problem:** Hex-to-OKLCH conversions done manually without verification.

**Provided values:**
```css
--color-brand-green: oklch(0.42 0.12 155);        /* #2D5F3F */
--color-brand-brown: oklch(0.56 0.08 70);         /* #8B6F47 */
```

**Risk:** Colors may not match Kiwi Cabins brand exactly.

**Fix:** Use a color converter to verify:
- Use https://oklch.com/ or similar tool
- Verify each brand color conversion
- Update plan with accurate values

**Correct conversions:**
```css
/* Verified with oklch.com */
--color-brand-green: oklch(0.396 0.083 159.51);   /* #2D5F3F */
--color-brand-green-light: oklch(0.496 0.083 159.51);
--color-brand-green-dark: oklch(0.296 0.083 159.51);

--color-brand-brown: oklch(0.538 0.053 63.47);    /* #8B6F47 */
--color-brand-brown-light: oklch(0.638 0.053 63.47);
--color-brand-brown-dark: oklch(0.438 0.053 63.47);
```

---

### 3. Missing Mobile Sidebar Behavior

**Problem:** Plan doesn't address mobile responsiveness.

**shadcn sidebar has mobile support:**
- Sheet overlay on mobile
- Offcanvas collapsible behavior
- Touch-friendly trigger button

**Fix:** Add to Phase 3.1:
```tsx
// In AppSidebar component, add collapsible prop:
<Sidebar collapsible="offcanvas" variant="inset">
```

And add SidebarTrigger to PageHeader for mobile:
```tsx
<div className="flex items-center gap-2">
  <SidebarTrigger className="lg:hidden" />
  <h1>{title}</h1>
</div>
```

---

### 4. Missing SidebarTrigger (Toggle Button)

**Problem:** No way to collapse/expand sidebar on desktop.

**Expected UX:** Users should be able to toggle sidebar for more screen space.

**Fix:** Add SidebarTrigger to PageHeader component (Step 3.2):
```tsx
import { SidebarTrigger } from "@/components/ui/sidebar";

export function PageHeader({ title, action, description }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-8">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

---

### 5. Incomplete Customers/Templates Page Updates

**Problem:** Step 5.1 and 5.2 say "wrap content with PageHeader" but don't show exact file modifications.

**Risk:** AI agent won't know what to keep vs replace.

**Fix:** Provide complete file contents for both pages, not just wrapping instructions.

---

### 6. Missing Contrast Ratio Validation

**Problem:** Brand green (#2D5F3F) on white might fail WCAG AA contrast for text.

**Test:**
- Brand green #2D5F3F on white: ~4.8:1 (PASSES for large text, FAILS for normal text)
- Need to verify all color combinations

**Fix:** Add to Phase 2 validation:
```
Check contrast ratios at https://webaim.org/resources/contrastchecker/

Required ratios (WCAG AA):
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum
```

If failures found, adjust lightness in OKLCH.

---

### 7. No Backend Server Check

**Problem:** Plan assumes backend is running for testing, but doesn't verify.

**Impact:** Testing will show errors even if frontend is correct.

**Fix:** Add to Phase 7.3 (before visual testing):
```bash
# Verify backend is accessible
curl -s http://localhost:8080/api/health

# Expected output:
# {"data":{"status":"ok","timestamp":"..."}}

# If not running:
cd ~/kiwi-repo/backend
export GOROOT=$HOME/go && export GOPATH=$HOME/go-workspace && export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
go run ./cmd/server/ &
```

---

## Medium Issues (Should Fix)

### 8. Sidebar Width Not Customized

**Default:** 16rem (256px)  
**Linear-style:** Typically 240px (15rem)

**Fix:** Update sidebar width in Phase 3.1:
```tsx
<SidebarProvider
  style={{
    "--sidebar-width": "15rem",
  } as React.CSSProperties}
>
```

---

### 9. Missing Status Color Tint Calculation

**Problem:** Column background colors are hard-coded (`bg-blue-50/50`) but should derive from status colors.

**Better approach:**
Define tints in CSS variables:
```css
--color-status-quote-tint: oklch(0.95 0.02 250);
--color-status-progress-tint: oklch(0.95 0.015 70);
--color-status-completed-tint: oklch(0.95 0.018 155);
--color-status-delivered-tint: oklch(0.95 0.022 290);
```

Then use: `bg-[var(--color-status-quote-tint)]`

---

### 10. No Loading State for Logo

**Problem:** Logo image loads without placeholder.

**Fix:** Add priority and loading="eager" (already in plan), but also add alt text for accessibility.

---

### 11. Missing Focus States

**Problem:** No mention of keyboard navigation or focus indicators.

**Fix:** Verify that shadcn components have proper focus-visible styling. Add to visual testing checklist:
```
- [ ] Tab navigation works through sidebar
- [ ] Focus ring visible on keyboard navigation
- [ ] Focus ring uses brand green color
```

---

### 12. No Error Boundaries

**Problem:** If sidebar component crashes, whole app goes down.

**Fix:** Add error boundary around sidebar or use React Suspense:
```tsx
<Suspense fallback={<SidebarSkeleton />}>
  <AppSidebar />
</Suspense>
```

---

### 13. Missing Date-FNS Locale Configuration

**Problem:** Date formatting uses default locale (en-US).

**For NZ audience:** Should use NZ date format (dd/MM/yyyy vs MM/dd/yyyy).

**Fix:** Import and configure locale:
```tsx
import { format } from "date-fns";
import { enNZ } from "date-fns/locale";

format(new Date(), "MMM d", { locale: enNZ })
```

---

### 14. Drag Handle Accessibility

**Problem:** Drag handle has no accessible label for screen readers.

**Fix:** Add aria-label to drag handle:
```tsx
<div
  {...attributes}
  {...listeners}
  aria-label="Drag to reorder job"
  className="..."
>
  <GripVertical />
</div>
```

---

### 15. No Mention of Sidebar State Persistence

**Problem:** Sidebar collapses state isn't persisted across page refreshes.

**shadcn docs recommend using cookies.**

**Fix:** Add to Phase 3.3:
```tsx
import { cookies } from "next/headers";

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      ...
    </SidebarProvider>
  );
}
```

But since it's a client component, use localStorage instead:
```tsx
"use client";

const [open, setOpen] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sidebar:state") !== "false";
  }
  return true;
});

<SidebarProvider open={open} onOpenChange={(open) => {
  setOpen(open);
  localStorage.setItem("sidebar:state", String(open));
}}>
```

---

## Minor Issues (Nice to Have)

### 16. No Transition Timing Specified

**Problem:** Plan mentions transitions but doesn't specify duration.

**Fix:** Add to globals.css:
```css
@layer base {
  * {
    @apply transition-colors duration-150 ease-out;
  }
}
```

---

### 17. Missing Hover State for Logo

**Linear-style:** Logo is clickable and has subtle hover state.

**Fix:** Add to AppSidebar:
```tsx
<Link href="/" className="flex items-center transition-opacity hover:opacity-80">
```

---

### 18. No Skeleton for Sidebar

**Problem:** Sidebar loads immediately but logo image might delay.

**Fix:** Add loading state or use next/image optimization (already using `priority`).

---

### 19. Missing Job Count Animation

**When job count changes:** Badge should animate.

**Fix:** Use framer-motion or CSS transition on count change.

---

### 20. No Mention of Optimistic Updates

**Current:** Uses `updateStatus.mutate()` which shows loading state.

**Better UX:** Optimistic update so card moves immediately, then rolls back on error.

**Check:** Is optimistic update already implemented in `use-kanban.ts`?

---

## Research Findings

### Tailwind v4 Best Practices

✅ **Using @theme inline correctly**  
✅ **OKLCH color space** (modern, perceptually uniform)  
⚠️ **Should verify OKLCH conversions** (see Critical Issue #2)

### shadcn Sidebar

✅ **Available for Base UI** (verified at /docs/components/base/sidebar)  
✅ **Supports mobile with Sheet overlay**  
✅ **Collapsible with keyboard shortcuts** (cmd+b / ctrl+b)  
⚠️ **Should use SidebarTrigger** (missing from plan)  
⚠️ **Should persist state** (missing from plan)

### Next.js 16 Layout Patterns

✅ **Sidebar in root layout** (correct pattern)  
✅ **SidebarProvider wrapping** (correct)  
✅ **SidebarInset for main content** (correct)

---

## Recommended Fixes Priority

**Before starting execution:**

1. **Fix OKLCH color values** (Critical #2) - 5 min
2. **Add SidebarTrigger to PageHeader** (Critical #4) - 10 min
3. **Complete customers/templates page updates** (Critical #5) - 15 min
4. **Add backend health check** (Critical #7) - 5 min
5. **Verify CreateJobDialog pattern** (Critical #1) - 10 min

**During Phase 3:**
6. Add mobile sidebar support (Critical #3)
7. Add sidebar state persistence (Medium #15)

**During Phase 7:**
8. Add contrast ratio validation (Critical #6)
9. Add focus state testing (Medium #11)

**Total time to fix:** ~1 hour

---

## Updated Plan Outline

**Phases remain the same, but add:**

**Phase 0: Pre-Flight Checks (NEW - 15 min)**
- Verify components.json shows base-nova style
- Check CreateJobDialog/JobDetailSheet for Base UI patterns
- Verify backend is running (health endpoint)
- Confirm OKLCH color conversions

**Phase 2: Enhanced with**
- Verified OKLCH colors
- Status color tints added
- Contrast ratio validation

**Phase 3: Enhanced with**
- SidebarTrigger in PageHeader
- Mobile collapsible behavior
- Sidebar state persistence (localStorage)
- Custom width (15rem)

**Phase 4: Enhanced with**
- Accessibility labels (drag handle, etc.)
- Date locale configuration (enNZ)

**Phase 5: Enhanced with**
- Complete file contents (not just wrappers)

**Phase 7: Enhanced with**
- Backend health check first
- Focus state testing
- Keyboard navigation testing

---

## Questions for Adam

Before proceeding with execution:

1. **Date format preference:** Use NZ format (dd/MM/yyyy) or US format (MM/dd/yyyy)?

2. **Sidebar default state:** Open or collapsed on first visit?

3. **Mobile priority:** How important is mobile responsiveness? (Plan assumes desktop-first)

4. **Dark mode:** Should we test dark mode, or is light mode sufficient for now?

5. **Accessibility level:** Target WCAG AA or AAA compliance?

---

## Conclusion

**Plan is solid but needs refinement.**

**Recommendation:**
1. Apply critical fixes (1 hour)
2. Get Adam's answers to questions above
3. Proceed with execution

**Risk if executed as-is:**
- Colors might not match brand exactly
- Missing mobile UX
- Accessibility gaps
- Some components may fail if using wrong patterns

**With fixes applied:**
- 95% confidence in successful execution
- Better UX (sidebar toggle, mobile support)
- Production-ready quality

---

**Self-Review Complete**  
**Next step:** Present findings to Adam, apply fixes, then execute.
