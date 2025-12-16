# Sitewide Light/Dark Mode Theme Fix - Implementation Plan

**Date:** December 15, 2025
**Story:** UI Theme System Completion
**Status:** ✅ APPROVED - Ready for Implementation

---

## User Decisions (December 15, 2025)

| Question | Decision |
|----------|----------|
| **Automation** | YES - Build codemod/bash migration script |
| **Testing** | Hybrid - Playwright for 5 critical pages + manual spot-check |
| **Rollout** | Big Bang - All pages at once |
| **Risk Tolerance** | Do it right the first time |

---

## Executive Summary

PhotoVault has a working ThemeModeToggle component and ThemeProvider system, but **74 pages still use hardcoded dark colors** (like `bg-neutral-900`, `text-neutral-400`, `border-white/5`) instead of semantic theme tokens (`bg-background`, `text-muted-foreground`, `border-border`). This plan systematically converts all pages to use theme-aware tokens.

**Scope:** 74 page files + Button component visibility improvements
**Estimated Time:** 3-4 hours for complete implementation
**Risk Level:** Medium (many files, but low complexity per file)

---

## Current State Analysis

### Theme System (Already Working)

✅ **ThemeProvider** (`src/components/ThemeProvider.tsx`)
- Combines next-themes (light/dark mode) with custom color themes
- Applies CSS variables from `src/lib/themes.ts`
- Watches for mode changes and updates DOM

✅ **ThemeModeToggle** (`src/components/ThemeModeToggle.tsx`)
- Simple light/dark toggle (no color theme picker)
- Light Mode → Original Teal theme
- Dark Mode → Gallery Dark theme
- Includes PostHog tracking

✅ **Theme Definitions** (`src/lib/themes.ts`)
- 5 color themes defined (Warm Gallery, Cool Professional, Gallery Dark, Soft Sage, Original Teal)
- Each theme has light and dark variants
- Comprehensive token coverage (background, foreground, card, primary, secondary, muted, accent, destructive, border, input, ring, sidebar, charts)

✅ **CSS Variables** (`src/app/globals.css`)
- Theme tokens mapped to Tailwind utilities
- Works with Tailwind v4's `@theme inline` system

### Problem: Hardcoded Colors Still Everywhere

❌ **74 page files** use hardcoded neutral colors:
- `bg-neutral-900` → Should be `bg-background`
- `bg-neutral-800` → Should be `bg-card`
- `bg-white/[0.03]` → Should be `bg-card`
- `text-neutral-100` → Should be `text-foreground`
- `text-neutral-400` → Should be `text-muted-foreground`
- `border-white/5` → Should be `border-border`
- `border-white/10` → Should be `border-border`

**Result:** Pages are locked to dark mode appearance even when light mode is active.

---

## Token Mapping Reference

### Complete Hardcoded → Semantic Token Map

| Hardcoded Class | Semantic Token | Usage Context |
|----------------|----------------|---------------|
| **Backgrounds** | | |
| `bg-neutral-900` | `bg-background` | Page background (main container) |
| `bg-neutral-800` | `bg-card` | Cards, panels, modals |
| `bg-neutral-800/50` | `bg-card/50` | Semi-transparent cards |
| `bg-white/[0.03]` | `bg-card` | Subtle card backgrounds |
| `bg-white/5` | `bg-muted` | Very subtle backgrounds |
| `bg-neutral-700` | `bg-secondary` | Button/input backgrounds |
| **Text Colors** | | |
| `text-white` | `text-foreground` | Primary text (headings, labels) |
| `text-neutral-100` | `text-foreground` | Primary text (alternative) |
| `text-neutral-200` | `text-foreground` | Primary text (softer) |
| `text-neutral-300` | `text-muted-foreground` | Secondary text |
| `text-neutral-400` | `text-muted-foreground` | Help text, placeholders |
| `text-neutral-500` | `text-muted-foreground` | Disabled text |
| `text-neutral-600` | `text-muted-foreground` | Very subtle text |
| `text-slate-300` | `text-foreground` | Primary text (alternative palette) |
| `text-slate-400` | `text-muted-foreground` | Secondary text (alternative) |
| `text-slate-500` | `text-muted-foreground` | Subtle text (alternative) |
| `text-slate-600` | `text-muted-foreground` | Very subtle (alternative) |
| **Borders** | | |
| `border-white/5` | `border-border` | Very subtle borders |
| `border-white/10` | `border-border` | Subtle borders |
| `border-white/20` | `border-border` | Medium borders |
| `border-neutral-700` | `border-border` | Standard borders |
| `border-slate-700` | `border-border` | Standard borders (alternative) |
| **Inputs** | | |
| `bg-neutral-900 border-white/10` | `bg-input border-input` | Input field backgrounds |
| `placeholder:text-neutral-500` | `placeholder:text-muted-foreground` | Input placeholders |
| **Hovers** | | |
| `hover:bg-white/5` | `hover:bg-accent/50` | Hover states for clickable items |
| `hover:bg-white/10` | `hover:bg-accent/50` | Stronger hover states |
| `hover:text-white` | `hover:text-foreground` | Text hover changes |
| **Accents (Keep These)** | | |
| `bg-amber-500` | ✅ KEEP | Primary accent (platform color) |
| `text-amber-400` | ✅ KEEP | Accent text |
| `bg-purple-500/20` | ✅ KEEP | Colored badges |
| `text-blue-400` | ✅ KEEP | Icon colors |
| `text-green-500` | ✅ KEEP | Success states |
| `text-red-500` | ✅ KEEP | Error states |

### Special Cases

**Loading States:**
```tsx
// BEFORE
<div className="min-h-screen bg-neutral-900 flex items-center justify-center">
  <p className="text-neutral-400">Loading...</p>
</div>

// AFTER
<div className="min-h-screen bg-background flex items-center justify-center">
  <p className="text-muted-foreground">Loading...</p>
</div>
```

**Card Patterns:**
```tsx
// BEFORE
<Card className="bg-neutral-800/50 border-white/10">
  <CardTitle className="text-neutral-100">Title</CardTitle>
  <CardDescription className="text-neutral-400">Description</CardDescription>
</Card>

// AFTER
<Card className="bg-card border-border">
  <CardTitle className="text-foreground">Title</CardTitle>
  <CardDescription className="text-muted-foreground">Description</CardDescription>
</Card>
```

**Modal/Dialog Patterns:**
```tsx
// BEFORE
<div className="bg-neutral-800 border border-white/10 rounded-lg">
  <h2 className="text-neutral-100">Modal Title</h2>
  <Input className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500" />
</div>

// AFTER
<div className="bg-card border border-border rounded-lg">
  <h2 className="text-foreground">Modal Title</h2>
  <Input className="bg-input border-input text-foreground placeholder:text-muted-foreground" />
</div>
```

**Header Patterns:**
```tsx
// BEFORE
<header className="border-b border-white/5 bg-neutral-800/50">
  <h1 className="text-neutral-100">Page Title</h1>
  <p className="text-neutral-400">Subtitle</p>
</header>

// AFTER
<header className="border-b border-border bg-card/50">
  <h1 className="text-foreground">Page Title</h1>
  <p className="text-muted-foreground">Subtitle</p>
</header>
```

**Sticky Headers (Special Attention):**
```tsx
// BEFORE
<header className="border-b border-border bg-neutral-900 sticky top-0 z-40">

// AFTER
<header className="border-b border-border bg-background sticky top-0 z-40 backdrop-blur-sm">
```
**Note:** Add `backdrop-blur-sm` for better visibility when content scrolls underneath.

---

## Files to Modify (74 pages)

### High Priority - User-Facing Pages (23 files)

**Authentication & Onboarding:**
1. `src/app/login/page.tsx` - Login page (59: bg-neutral-900)
2. `src/app/signup/page.tsx` - Signup page
3. `src/app/reset-password/page.tsx` - Password reset
4. `src/app/photographers/onboarding/page.tsx` - Photographer onboarding
5. `src/app/auth/signup/page.tsx` - Auth signup
6. `src/app/auth/desktop-callback/page.tsx` - Desktop auth

**Client Portal (Main Users):**
7. `src/app/client/dashboard/page.tsx` - ✅ Already fixed (Story 2.3)
8. `src/app/client/settings/page.tsx` - Settings page
9. `src/app/client/favorites/page.tsx` - Favorites page
10. `src/app/client/timeline/page.tsx` - Timeline page
11. `src/app/client/support/page.tsx` - Support page
12. `src/app/client/upload/page.tsx` - Upload page
13. `src/app/client/billing/page.tsx` - Billing settings
14. `src/app/client/settings/family/page.tsx` - Family settings

**Photographer Portal (Main Users):**
15. `src/app/photographer/dashboard/page.tsx` - ✅ Already fixed (Story 2.3)
16. `src/app/photographer/clients/page.tsx` - Clients list (175, 301: bg-neutral-900)
17. `src/app/photographer/galleries/page.tsx` - Galleries list
18. `src/app/photographer/galleries/create/page.tsx` - Create gallery
19. `src/app/photographer/galleries/[id]/upload/page.tsx` - Upload to gallery
20. `src/app/photographer/galleries/[id]/sneak-peek-select/page.tsx` - Sneak peek selection

**Gallery Viewer (Most Critical):**
21. `src/app/gallery/[galleryId]/page.tsx` - Public gallery page (543, 554, 575, 686, 852: bg-neutral-900)

**Family Accounts:**
22. `src/app/family/galleries/page.tsx` - Family galleries
23. `src/app/family/accept/[token]/page.tsx` - Family invite acceptance

### Medium Priority - Admin & Reports (15 files)

**Admin Dashboard:**
24. `src/app/admin/dashboard/page.tsx` - ✅ Already fixed (Story 2.3)
25. `src/app/admin/clients/page.tsx` - Admin clients list
26. `src/app/admin/photographers/page.tsx` - Admin photographers list
27. `src/app/admin/revenue/page.tsx` - Revenue dashboard
28. `src/app/admin/transactions/page.tsx` - Transactions list
29. `src/app/admin/leaderboard/page.tsx` - Leaderboard
30. `src/app/admin/users/page.tsx` - User management
31. `src/app/admin/analytics/page.tsx` - Analytics dashboard
32. `src/app/admin/settings/page.tsx` - Admin settings
33. `src/app/admin/database/page.tsx` - Database tools
34. `src/app/admin/security/page.tsx` - Security settings
35. `src/app/admin/business-analytics/page.tsx` - Business analytics

**Photographer Reports:**
36. `src/app/photographers/revenue/page.tsx` - Revenue reports
37. `src/app/photographers/analytics/page.tsx` - Analytics
38. `src/app/photographers/reports/page.tsx` - Reports

### Low Priority - Secondary Features (36 files)

**Photographer Features:**
39. `src/app/photographers/clients/page.tsx` - Clients management
40. `src/app/photographers/settings/page.tsx` - Settings
41. `src/app/photographers/subscription/page.tsx` - Subscription
42. `src/app/photographers/import/page.tsx` - Import galleries
43. `src/app/photographers/invite/page.tsx` - Invite clients
44. `src/app/photographers/commission-details/page.tsx` - Commission details
45. `src/app/photographers/analytics-demo/page.tsx` - Analytics demo
46. `src/app/photographer/upload/page.tsx` - Upload
47. `src/app/photographer/share/page.tsx` - Share
48. `src/app/photographer/feedback/page.tsx` - Feedback

**Client Features:**
49. `src/app/client/rate/[galleryId]/page.tsx` - Rate gallery
50. `src/app/client/payment/page.tsx` - Payment
51. `src/app/client/deleted/page.tsx` - Deleted items
52. `src/app/client/mobile-upload/page.tsx` - Mobile upload

**Public/Marketing:**
53. `src/app/page.tsx` - Homepage redirect
54. `src/app/about/page.tsx` - About page
55. `src/app/contact/page.tsx` - Contact page
56. `src/app/privacy/page.tsx` - Privacy policy
57. `src/app/terms/page.tsx` - Terms of service
58. `src/app/photographers/page.tsx` - Photographers landing
59. `src/app/photographers/signup/page.tsx` - Photographer signup
60. `src/app/download-desktop-app/page.tsx` - Desktop app download

**Directory:**
61. `src/app/directory/page.tsx` - Directory home
62. `src/app/directory/photographers/page.tsx` - Photographer directory
63. `src/app/directory/photographers/[username]/page.tsx` - Photographer profile
64. `src/app/directory/[city]/page.tsx` - City listings
65. `src/app/directory/[city]/[location_slug]/page.tsx` - Location listings

**Invites & Payment:**
66. `src/app/invite/accept/[token]/page.tsx` - Accept invite
67. `src/app/invite/photographer/[photographerId]/[paymentOption]/page.tsx` - Photographer invite
68. `src/app/payment/[clientId]/[galleryId]/page.tsx` - Payment flow
69. `src/app/signup/payment/page.tsx` - Signup payment

**Dev/Test Pages:**
70. `src/app/dev-dashboard/page.tsx` - Dev dashboard
71. `src/app/test-dashboard/page.tsx` - Test dashboard
72. `src/app/test-images/page.tsx` - Test images
73. `src/app/financial-model/page.tsx` - Financial model
74. `src/app/application/page.tsx` - Application page

**Other:**
75. `src/app/connect/page.tsx` - Stripe Connect
76. `src/app/logout/page.tsx` - Logout
77. `src/app/signout/page.tsx` - Sign out
78. `src/app/family/takeover/page.tsx` - Family takeover

---

## Button Component Visibility Fix

### Current Issue
The Button component uses theme-aware tokens, but some variants may have low contrast in light mode:

**File:** `src/components/ui/button.tsx`

**Current Variants:**
```tsx
variant: {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-white hover:bg-destructive/90 ...",
  outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
  link: "text-primary underline-offset-4 hover:underline",
}
```

### Potential Improvements

**1. Outline Variant (Most Used for Navigation)**
```tsx
// BEFORE
outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",

// AFTER (Better light mode visibility)
outline: "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
```
**Change:** Explicitly use `border-border` for better visibility in light mode.

**2. Ghost Variant (Used for Icon Buttons)**
```tsx
// BEFORE
ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",

// AFTER (More visible in both modes)
ghost: "hover:bg-accent/50 hover:text-accent-foreground",
```
**Change:** Unified opacity for consistency across light/dark.

**3. Secondary Variant (Rarely Used)**
```tsx
// NO CHANGE NEEDED
secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
```
Already theme-aware and working correctly.

### Testing Strategy
After changes, test buttons in both modes:
- ✅ Default (amber/teal) - should be vibrant in both modes
- ✅ Outline - should have visible border in light mode
- ✅ Ghost - should show subtle hover in both modes
- ✅ Secondary - should be subtle but readable
- ✅ Destructive - should be clearly red/dangerous

---

## Implementation Steps (APPROVED)

### Phase 0: Setup (1 hour)

**0.1 Create Migration Script**
```bash
# scripts/migrate-theme-tokens.sh
#!/bin/bash

echo "🎨 Migrating hardcoded colors to semantic tokens..."

# Order matters - longest patterns first to avoid partial matches
REPLACEMENTS=(
  # Backgrounds (with opacity first)
  "bg-neutral-800/50:bg-card/50"
  "bg-neutral-900/80:bg-background/80"
  "bg-white/\[0.03\]:bg-card"
  "bg-white/5:bg-muted"
  "bg-neutral-900:bg-background"
  "bg-neutral-800:bg-card"
  "bg-neutral-700:bg-secondary"

  # Text colors
  "text-neutral-100:text-foreground"
  "text-neutral-200:text-foreground"
  "text-neutral-300:text-muted-foreground"
  "text-neutral-400:text-muted-foreground"
  "text-neutral-500:text-muted-foreground"
  "text-neutral-600:text-muted-foreground"
  "text-slate-300:text-foreground"
  "text-slate-400:text-muted-foreground"
  "text-slate-500:text-muted-foreground"
  "text-white:text-foreground"

  # Borders
  "border-white/5:border-border"
  "border-white/10:border-border"
  "border-white/20:border-border"
  "border-neutral-700:border-border"
  "border-slate-700:border-border"

  # Inputs
  "placeholder:text-neutral-500:placeholder:text-muted-foreground"

  # Hovers
  "hover:bg-white/5:hover:bg-accent/50"
  "hover:bg-white/10:hover:bg-accent/50"
  "hover:text-white:hover:text-foreground"
)

for pair in "${REPLACEMENTS[@]}"; do
  OLD="${pair%%:*}"
  NEW="${pair##*:}"
  echo "  Replacing $OLD → $NEW"
  find src/app -name "*.tsx" -exec sed -i "s/$OLD/$NEW/g" {} +
done

echo "✅ Migration complete! Run 'git diff' to review changes."
```

**0.2 Create Playwright Visual Tests**
```typescript
// tests/visual-regression/theme.spec.ts
import { test, expect } from '@playwright/test';

const CRITICAL_PAGES = [
  { path: '/login', name: 'login' },
  { path: '/client/dashboard', name: 'client-dashboard' },
  { path: '/photographer/clients', name: 'photographer-clients' },
  { path: '/admin/dashboard', name: 'admin-dashboard' },
  // Note: Gallery page needs a real gallery ID
];

for (const page of CRITICAL_PAGES) {
  test(`${page.name} renders correctly in light mode`, async ({ page: p }) => {
    await p.goto(page.path);
    await p.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await p.waitForTimeout(500); // Allow theme to settle
    await expect(p).toHaveScreenshot(`${page.name}-light.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05
    });
  });

  test(`${page.name} renders correctly in dark mode`, async ({ page: p }) => {
    await p.goto(page.path);
    await p.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await p.waitForTimeout(500);
    await expect(p).toHaveScreenshot(`${page.name}-dark.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05
    });
  });
}
```

### Phase 1: Run Migration Script (30 minutes)

1. **Backup first:** `git stash` or create branch
2. **Run script:** `bash scripts/migrate-theme-tokens.sh`
3. **Review diff:** `git diff src/app`
4. **Manual fixes:** Handle edge cases the script missed

### Phase 2: Manual Edge Cases (1 hour)

**Check for patterns the script can't handle:**
- Gradients: `from-neutral-900 to-neutral-800`
- Composite classes: `bg-neutral-900 dark:bg-neutral-800`
- Inline styles: `style={{ backgroundColor: ... }}`

**Add backdrop-blur to sticky headers:**
```bash
grep -r "sticky.*bg-background" src/app --include="*.tsx" -l
# Manually add backdrop-blur-sm to each
```

### Phase 3: Button Component Fix (15 minutes)

Update `src/components/ui/button.tsx` outline and ghost variants.

### Phase 4: Component Audit (30 minutes)

```bash
# Check for hardcoded colors in components
grep -r "bg-neutral-\|text-neutral-\|border-white/" src/components --include="*.tsx"
```

### Phase 5: Testing (1.5 hours)

1. **Run Playwright tests:** `npx playwright test tests/visual-regression/`
2. **Review screenshots** in `test-results/`
3. **Manual spot-check:** Login, gallery viewer, modals
4. **Fix any failures**

### Phase 6: Final Review & Deploy

1. **TypeScript check:** `npm run build`
2. **Commit:** `git add . && git commit -m "fix: Convert hardcoded colors to semantic theme tokens"`
3. **Deploy to staging**
4. **Quick smoke test in staging**
5. **Deploy to production**

---

## Edge Cases & Special Considerations

### 1. Sticky Headers Need Backdrop Blur
**Problem:** Sticky headers with `bg-background` may be too transparent when content scrolls underneath.

**Solution:** Add `backdrop-blur-sm` to all sticky headers:
```tsx
<header className="border-b border-border bg-background sticky top-0 z-40 backdrop-blur-sm">
```

**Files to Check:**
- `src/app/gallery/[galleryId]/page.tsx` (line 864)
- Any other pages with sticky navigation

### 2. Loading States Need Consistent Styling
**Pattern:**
```tsx
<div className="min-h-screen bg-background flex items-center justify-center">
  <div className="text-center">
    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
    <p className="text-muted-foreground">Loading...</p>
  </div>
</div>
```

### 3. Modal Overlays
**Pattern:**
```tsx
// Overlay background
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  {/* Modal content */}
  <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
    <h2 className="text-foreground">Modal Title</h2>
  </div>
</div>
```
**Note:** `bg-black/50` for overlay is correct (intentionally dark regardless of theme).

### 4. Hardcoded Accent Colors (DO NOT CHANGE)
Keep these hardcoded colors - they're intentional platform branding:
- `bg-amber-500` / `hover:bg-amber-600` - Primary CTA buttons
- `text-amber-400` / `text-amber-500` - Accent text
- `bg-purple-500/20` - Badge backgrounds
- `text-blue-400` - Icon colors
- `text-green-500` - Success states
- `text-red-500` - Error states
- `border-red-900/50` - Error borders

### 5. Slate vs Neutral Colors
Some pages use `text-slate-300` instead of `text-neutral-300`. Both should map to the same semantic token:
- `text-slate-300` → `text-foreground`
- `text-slate-400` → `text-muted-foreground`
- `text-slate-500` → `text-muted-foreground`
- `text-slate-600` → `text-muted-foreground`

### 6. Input Field Backgrounds
Inputs have a special token:
```tsx
// BEFORE
<Input className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500" />

// AFTER
<Input className="bg-input border-input text-foreground placeholder:text-muted-foreground" />
```

**BUT** check `globals.css` - the Input component may already handle this via default styles. If so, you can simplify to:
```tsx
<Input className="text-foreground" />
```

---

## Accessibility Considerations

### Contrast Ratios
After conversion, verify WCAG AA compliance:
- **Text on background:** foreground vs background
- **Muted text on background:** muted-foreground vs background
- **Primary buttons:** primary-foreground vs primary
- **Borders:** border must be visible against card backgrounds

**Tools:**
- Chrome DevTools Lighthouse (Accessibility audit)
- WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)

### Focus States
All interactive elements should have visible focus rings:
```tsx
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```
This is already present in Button component. Verify it works in both light and dark modes.

### Screen Reader Impact
Theme changes should NOT affect screen readers. All `aria-label` and semantic HTML remains unchanged.

---

## Testing Plan

### Manual Testing Checklist

**Pre-Deployment:**
1. ✅ Create test user accounts (client, photographer, admin)
2. ✅ Test in Chrome (primary browser)
3. ✅ Test in Firefox (secondary)
4. ✅ Test in Safari (macOS/iOS)
5. ✅ Test mobile responsiveness

**Per-Page Testing:**
1. Load page in light mode
   - [ ] Background is light (white/cream)
   - [ ] Text is dark and readable
   - [ ] Borders are visible
   - [ ] Buttons are visible and have good contrast
   - [ ] Hover states work
2. Toggle to dark mode
   - [ ] Background is dark
   - [ ] Text is light and readable
   - [ ] Borders are visible
   - [ ] Buttons are visible and have good contrast
   - [ ] Hover states work
3. Refresh page
   - [ ] Theme preference persists
4. Navigate to different page
   - [ ] Theme carries over

### Automated Testing (Optional)

**Playwright Test (Recommended):**
```typescript
// test/theme-toggle.spec.ts
test('theme toggle works across pages', async ({ page }) => {
  // Start in light mode
  await page.goto('/login');
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  // Toggle to dark mode
  await page.click('[aria-label*="dark mode"]');
  await expect(page.locator('html')).toHaveClass(/dark/);

  // Navigate to different page
  await page.goto('/client/dashboard');
  await expect(page.locator('html')).toHaveClass(/dark/);

  // Refresh page
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});
```

---

## Rollout Strategy

### Option A: Big Bang (Recommended)
**Pros:**
- Consistent experience immediately
- Easier to QA all at once
- Single PR to review

**Cons:**
- Larger surface area for bugs
- More testing required upfront

**Steps:**
1. Create feature branch `fix/sitewide-theme-tokens`
2. Implement all changes in phases 1-4
3. Test thoroughly locally
4. Deploy to staging
5. QA all critical pages
6. Deploy to production
7. Monitor for issues

### Option B: Gradual Rollout
**Pros:**
- Lower risk per deployment
- Easier to isolate issues

**Cons:**
- Inconsistent experience during rollout
- Multiple PRs to review
- More coordination overhead

**Steps:**
1. Week 1: High priority pages (23 files)
2. Week 2: Admin & reports (15 files)
3. Week 3: Secondary features (36 files)
4. Week 4: Button component + final QA

**Recommendation:** Use **Option A (Big Bang)** - the changes are low-risk and repetitive, so a single coordinated deployment is cleaner.

---

## Known Risks & Mitigation

### Risk 1: Breaking Existing Custom Styles
**Likelihood:** Medium
**Impact:** Low
**Mitigation:** Some components may have inline styles or specific color overrides. Search for:
```bash
grep -r "style={{" src/app/**/*.tsx
```
Review any inline `backgroundColor`, `color`, `borderColor` properties.

### Risk 2: Third-Party Component Conflicts
**Likelihood:** Low
**Impact:** Medium
**Mitigation:** Shadcn components should already be theme-aware. Check:
- `src/components/ui/card.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/badge.tsx`

If they have hardcoded colors, update them too.

### Risk 3: Theme Toggle Not Visible in Light Mode
**Likelihood:** Medium
**Impact:** Medium
**Mitigation:** The ThemeModeToggle component itself needs to be visible in light mode. Check:
```tsx
// src/components/ThemeModeToggle.tsx line 112-114
className={cn(
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  className
)}
```
May need to add explicit colors:
```tsx
className={cn(
  'text-foreground border-border',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  className
)}
```

### Risk 4: Photograher/Client Already Customized Their Theme
**Likelihood:** Low (feature is new)
**Impact:** Low
**Mitigation:** Check if any users have saved theme preferences in localStorage:
```javascript
localStorage.getItem('photovault-color-theme')
localStorage.getItem('theme')
```
If so, ensure migration preserves their choice.

---

## Post-Implementation Validation

### Checklist
- [ ] All 74 pages load without errors in light mode
- [ ] All 74 pages load without errors in dark mode
- [ ] Theme toggle works on every page
- [ ] Theme preference persists after refresh
- [ ] Buttons are visible in both modes
- [ ] Text is readable in both modes (WCAG AA)
- [ ] Borders are visible in both modes
- [ ] No console errors related to missing CSS variables
- [ ] PostHog tracking still works (theme_toggle_clicked event)
- [ ] Mobile responsive design intact in both modes

### Smoke Test (5 minutes)
1. Log in as client → toggle theme → navigate to 3 different pages → verify theme persists
2. Log in as photographer → toggle theme → navigate to 3 different pages → verify theme persists
3. Log in as admin → toggle theme → navigate to 3 different pages → verify theme persists
4. View public gallery (not logged in) → toggle theme → verify it works

---

## Success Criteria

### Functional Requirements
✅ All pages use semantic theme tokens instead of hardcoded neutral colors
✅ Theme toggle works on all pages
✅ Theme preference persists across page navigation
✅ Theme preference persists after browser refresh
✅ Light mode has white/cream backgrounds with dark text
✅ Dark mode has dark backgrounds with light text

### Visual Requirements
✅ Text is readable in both modes (WCAG AA contrast)
✅ Buttons are visible in both modes
✅ Borders are visible in both modes
✅ Accent colors (amber, purple, blue, green, red) remain vibrant
✅ No layout shifts when toggling theme
✅ Loading states show correct colors

### Technical Requirements
✅ No hardcoded `bg-neutral-*` classes remain (except in comments/examples)
✅ No hardcoded `text-neutral-*` classes remain (except in comments/examples)
✅ No hardcoded `border-white/*` classes remain (except overlays)
✅ Button component uses semantic tokens
✅ All Shadcn components use semantic tokens
✅ PostHog tracking still works

---

## Timeline Estimate (REVISED - Automated Approach)

**Total Time:** 5-6 hours

| Phase | Time | Tasks |
|-------|------|-------|
| Phase 0: Setup | 1 hour | Create migration script + Playwright tests |
| Phase 1: Run Migration | 30 min | Execute script, review diff |
| Phase 2: Edge Cases | 1 hour | Gradients, composites, sticky headers |
| Phase 3: Button Component | 15 min | Update outline/ghost variants |
| Phase 4: Component Audit | 30 min | Check shared components |
| Phase 5: Testing | 1.5 hours | Playwright + manual spot-check |
| Phase 6: Deploy | 30 min | Build, staging, production |
| **Buffer for Issues** | 30-45 min | Unexpected edge cases |

**Why this is better than manual:**
- Script handles 74 files consistently
- Playwright catches visual regressions
- Repeatable - can re-run if needed

---

## Next Steps

1. **Review this plan** with QA Critic
2. **Get user approval** before implementation
3. **Create feature branch** `fix/sitewide-theme-tokens`
4. **Implement in phases** (1-4)
5. **Test locally** using checklist
6. **Deploy to staging** for full QA
7. **Production deployment** after approval
8. **Monitor PostHog** for theme_toggle_clicked events

---

## Appendix: Example Before/After

### Login Page (src/app/login/page.tsx)

**BEFORE:**
```tsx
<div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
  <div className="w-full max-w-md">
    <div className="text-center mb-10">
      <h1 className="text-3xl font-semibold text-foreground mb-2">Welcome Back</h1>
      <p className="text-muted-foreground">Sign in to access your photos</p>
    </div>

    <Card className="border border-border card-shadow">
      <CardHeader>
        <CardTitle className="text-foreground">Sign In</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email and password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          type="email"
          placeholder="your@email.com"
          className="border-input"
        />
      </CardContent>
    </Card>
  </div>
</div>
```

**AFTER:**
```tsx
<div className="min-h-screen bg-background flex items-center justify-center p-4">
  <div className="w-full max-w-md">
    <div className="text-center mb-10">
      <h1 className="text-3xl font-semibold text-foreground mb-2">Welcome Back</h1>
      <p className="text-muted-foreground">Sign in to access your photos</p>
    </div>

    <Card className="border border-border card-shadow">
      <CardHeader>
        <CardTitle className="text-foreground">Sign In</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email and password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          type="email"
          placeholder="your@email.com"
          className="border-input"
        />
      </CardContent>
    </Card>
  </div>
</div>
```

**CHANGES:** Only `bg-neutral-900` → `bg-background` (rest was already theme-aware).

---

### Gallery Viewer Header (src/app/gallery/[galleryId]/page.tsx)

**BEFORE:**
```tsx
<header className="border-b border-border bg-neutral-900 sticky top-0 z-40">
  <div className="container-pixieset py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{gallery.gallery_name}</h1>
          <p className="text-sm text-muted-foreground">
            {gallery.photographer_name && `${gallery.photographer_name} • `}
            <Badge variant="outline" className="ml-1">{gallery.platform}</Badge>
          </p>
        </div>
      </div>
    </div>
  </div>
</header>
```

**AFTER:**
```tsx
<header className="border-b border-border bg-background sticky top-0 z-40 backdrop-blur-sm">
  <div className="container-pixieset py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{gallery.gallery_name}</h1>
          <p className="text-sm text-muted-foreground">
            {gallery.photographer_name && `${gallery.photographer_name} • `}
            <Badge variant="outline" className="ml-1">{gallery.platform}</Badge>
          </p>
        </div>
      </div>
    </div>
  </div>
</header>
```

**CHANGES:**
- `bg-neutral-900` → `bg-background`
- Added `backdrop-blur-sm` for sticky header visibility
- Added explicit `text-foreground` to h1 for clarity

---

*End of Implementation Plan*
