# Gallery Progressive Loading Plan - QA Critic Review (Revision 2)

**Reviewed:** 2026-01-25 (Revision 2)
**Plan Location:** `docs/claude/plans/gallery-progressive-loading-plan.md`
**Previous Verdict:** NEEDS REVISION
**Current Verdict:** APPROVE WITH CONCERNS

---

## Executive Summary

The revised plan has addressed all three blocking concerns from the previous review. It now properly extends the existing `ImageWithFallback` component, documents the rationale for using native `<img>` over `next/image`, and explicitly addresses both GalleryGrid components. The plan is ready for implementation with minor non-blocking concerns noted below.

---

## Previous Blocking Concerns - Resolution Status

### 1. Ignores Existing ImageWithFallback Component
**Status:** RESOLVED

The revised plan (Section "Proposed Solution: Enhance ImageWithFallback"):
- Explicitly proposes extending `ImageWithFallback` with `priority` and `onLoad` props
- Maintains existing error handling behavior
- Uses existing component as foundation rather than creating duplicate

**Evidence from plan:**
> "Extend `ImageWithFallback` with a `priority` prop"
> "Decision: Extend ImageWithFallback - Don't duplicate; maintain existing error handling"

### 2. Doesn't Use Next.js Image Component
**Status:** RESOLVED

The revised plan (Section "Why Native `<img>` Instead of `next/image`"):
- Documents the decision with clear rationale
- Explains Supabase dynamic URLs would require `remotePatterns` config
- Notes thumbnails are already pre-generated at optimal sizes
- Acknowledges Next.js image optimization would add server costs

**Evidence from plan:**
> "Decision: Native `<img>` over `next/image` - Dynamic Supabase URLs, pre-generated thumbnails, avoid optimization costs"

This is a reasonable architectural decision given the pre-generated thumbnails and dynamic storage URLs.

### 3. Scope Incomplete - Two GalleryGrid Components
**Status:** RESOLVED

The revised plan (Section "Phase 3: Apply to Both GalleryGrid Components"):
- Explicitly addresses both components by path
- Specifies priority images for each (first 4 for gallery view, first 6 for dashboard)
- Lists both files in the "Files to Create/Modify Summary"

**Evidence from plan:**
> "Gallery View Grid (`src/app/gallery/[galleryId]/components/GalleryGrid.tsx`): First 4 images: `priority={true}`"
> "Dashboard Grid (`src/components/GalleryGrid.tsx`): Add `priority={true}` to first 6 visible cards"

---

## Additional Concerns - Resolution Status

### Uses `bg-muted` not hardcoded colors?
**Status:** RESOLVED

Plan explicitly states in "Code Conventions" section:
> "Use `bg-muted` instead of `bg-slate-200` for placeholder backgrounds"

### Uses `cn()` utility?
**Status:** RESOLVED

Plan explicitly states:
> "Use `cn()` utility for class merging"

### Has TypeScript interfaces?
**Status:** RESOLVED

Plan provides explicit TypeScript interface:
```tsx
interface ImageWithFallbackProps {
  src?: string
  alt: string
  className?: string
  fallbackIcon?: React.ReactNode
  onError?: () => void
  priority?: boolean  // NEW
  onLoad?: () => void // NEW
}
```

### Has testing plan?
**Status:** RESOLVED

Plan includes comprehensive testing:
- Unit tests with specific test cases (`ImageWithFallback.test.tsx`)
- E2E tests for progressive loading (`e2e/gallery-loading.spec.ts`)
- Manual testing checklist
- Performance baseline capture instructions

### Has accessibility considerations?
**Status:** RESOLVED

Plan addresses accessibility:
> "Add `aria-hidden="true"` to loading placeholder"
> "Maintain alt text during all loading states"
> "Screen readers should announce image when loaded"

---

## Remaining Non-Blocking Concerns

### 1. Gallery View Grid Uses Hardcoded `bg-slate-100`
**Severity:** LOW

The existing `GalleryGrid.tsx` (gallery view) at line 41 uses `bg-slate-100`:
```tsx
<div className="aspect-square relative bg-slate-100"
```

The plan should note this existing hardcoded color should be updated to `bg-muted` when modifying this file for consistency.

**Recommendation:** Add to implementation notes: "Update existing `bg-slate-100` to `bg-muted` while modifying the component."

### 2. Single Observer Per Image in Conceptual Code
**Severity:** LOW

The conceptual code shows creating an observer per image:
```tsx
const observer = new IntersectionObserver(...)
observer.observe(imgRef.current)
```

While the plan mentions "Use a single shared Intersection Observer" in the solution description, the conceptual code contradicts this. The implementation should use a shared observer pattern for memory efficiency.

**Recommendation:** Implementer should follow the "single shared observer" guidance, not the conceptual code verbatim.

### 3. Dashboard GalleryGrid Uses Native img, Not ImageWithFallback
**Severity:** MEDIUM

Looking at `src/components/GalleryGrid.tsx`, the dashboard uses native `<img>` tags for cover images, not `ImageWithFallback`. The plan says to "Use enhanced ImageWithFallback for cover images" but this will be a larger refactor than just adding a `priority` prop.

**Recommendation:** Plan correctly identifies this change. Implementer should be aware this involves replacing `<img>` tags with `<ImageWithFallback>` components, not just adding props.

### 4. No Concurrent Load Limit
**Severity:** LOW

The plan doesn't specify a concurrent load limit for rapid scrolling scenarios. However, browser-native connection limits (6 connections per domain) provide implicit throttling.

**Recommendation:** Monitor in testing. If performance issues arise with rapid scrolling, add a load queue in Phase 2.

---

## Implementation Readiness Checklist

| Item | Status |
|------|--------|
| Extends existing component (not duplicate) | PASS |
| Both GalleryGrid components addressed | PASS |
| Native img decision documented | PASS |
| TypeScript interfaces defined | PASS |
| Uses semantic colors (`bg-muted`) | PASS |
| Uses `cn()` utility | PASS |
| Accessibility considered | PASS |
| Unit test plan | PASS |
| E2E test plan | PASS |
| Performance baseline capture | PASS |
| Edge cases documented | PASS |
| SSR handling noted | PASS |

---

## Verdict: APPROVE WITH CONCERNS

The revised plan addresses all blocking concerns from the previous review. The plan is ready for implementation.

**Non-blocking items to address during implementation:**
1. Update existing `bg-slate-100` to `bg-muted` in gallery view grid
2. Use shared observer pattern despite conceptual code showing individual observers
3. Be prepared for dashboard GalleryGrid needing component replacement, not just prop addition

**Proceed to implementation.**

---

## Comparison: Original vs Revised

| Concern | Original Plan | Revised Plan |
|---------|--------------|--------------|
| ImageWithFallback usage | Created new LazyImage | Extends existing component |
| next/image rationale | Not documented | Clear decision with rationale |
| Both GalleryGrid components | Only one addressed | Both explicitly listed |
| Semantic colors | `bg-slate-200` | `bg-muted` specified |
| cn() utility | Not mentioned | Explicitly required |
| TypeScript interfaces | Missing | Fully defined |
| Testing plan | Incomplete | Comprehensive |
| Accessibility | Not mentioned | Documented |

The revision represents a significant improvement in plan quality and codebase alignment.
