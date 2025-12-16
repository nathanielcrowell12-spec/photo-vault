# Theme and UI Fixes - TODO List

**Created:** December 14, 2025
**Status:** In Progress

---

## Completed This Session

- [x] Created `ThemeModeToggle` component with light/dark mode toggle
- [x] Added toggle to photographer dashboard (header + mobile menu)
- [x] Added toggle to client dashboard (header)
- [x] Changed ThemeProvider default from "system" to "light"
- [x] Added analytics event for theme toggle
- [x] Updated photographer dashboard with semantic theme tokens
- [x] Updated client dashboard with semantic theme tokens

---

## Remaining Theme Work

### High Priority - Pages with hardcoded dark colors

These pages still use hardcoded `bg-neutral-900`, `bg-neutral-800`, `text-neutral-xxx` etc. instead of semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`).

**Need to update:**

1. [ ] `/photographer/clients/page.tsx`
2. [ ] `/photographer/galleries/page.tsx`
3. [ ] `/photographer/galleries/create/page.tsx`
4. [ ] `/photographer/galleries/[id]/page.tsx`
5. [ ] `/photographers/settings/page.tsx`
6. [ ] `/photographers/revenue/page.tsx`
7. [ ] `/photographers/reports/page.tsx`
8. [ ] `/client/settings/page.tsx`
9. [ ] `/client/billing/page.tsx`
10. [ ] `/client/favorites/page.tsx`
11. [ ] `/client/upload/page.tsx`
12. [ ] `/client/deleted/page.tsx`
13. [ ] `/gallery/[id]/page.tsx` (public gallery view)
14. [ ] `/login/page.tsx`
15. [ ] `/signup/page.tsx`
16. [ ] Any other pages with hardcoded dark colors

**Pattern to follow:**
- `bg-neutral-900` → `bg-background`
- `bg-neutral-800/50` → `bg-card`
- `bg-neutral-700/xx` → `bg-muted` or `bg-secondary`
- `text-neutral-100` → `text-foreground`
- `text-neutral-400` → `text-muted-foreground`
- `text-neutral-500` → `text-muted-foreground`
- `border-white/5` → `border-border`
- `border-white/10` → `border-border`
- `text-white` → `text-foreground`

### Medium Priority - Button visibility issues

Buttons are too dark to see unless hovering. Need to audit:

1. [ ] Check all Button component variants in `src/components/ui/button.tsx`
2. [ ] Ensure default/outline/ghost variants have proper contrast in both light and dark modes
3. [ ] May need to update the shadcn Button component to use theme tokens properly

---

## Client Dashboard Messaging Bug

**Location:** `/client/dashboard/page.tsx` - MessagesButton and MessagingPanel

**Issues:**
1. [ ] MessagesButton shows a question mark icon instead of proper "Message Photographer" button
2. [ ] MessagingPanel modal doesn't fit the screen properly
3. [ ] Cannot close the MessagingPanel modal (close button missing or not working)

**Files to investigate:**
- `src/components/MessagesButton.tsx`
- `src/components/MessagingPanel.tsx`

**Fix approach:**
1. Check MessagesButton - ensure it renders correctly with proper icon/label
2. Check MessagingPanel - fix modal sizing (max-width, max-height, overflow)
3. Ensure close button exists and works (onClose prop being passed and used)

---

## How to Continue This Work

1. Start dev server: `npm run dev -- -p 3002`
2. Pick a page from the list above
3. Replace all hardcoded neutral colors with semantic tokens
4. Test by toggling between light/dark mode
5. Check buttons are visible in both modes
6. Mark item complete in this file

---

## Notes

- The theme system in `src/lib/themes.ts` is working correctly
- The `ThemeModeToggle` component is working
- The issue was pages using hardcoded Tailwind colors instead of CSS variable-based semantic tokens
- Only photographer dashboard and client dashboard have been updated so far
