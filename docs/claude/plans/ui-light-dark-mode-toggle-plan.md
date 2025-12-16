# Implementation Plan: Light/Dark Mode Toggle for Photographer & Client Dashboards

**Date:** December 14, 2025
**Story:** User-Requested Feature
**Domain:** UI/UX - Theme Management
**Priority:** High (fixes visibility issues on live site)

---

## Problem Statement

The current PhotoVault live site has visibility issues - "black on black" making buttons invisible. Users need a simple, prominent way to switch between light and dark modes. Currently, the theme system is only accessible to admins and offers 5 color themes, which is too complex for end users.

---

## User Requirements

1. **Location:** Big, easy-to-see toggle button on the dashboard (NOT hidden in settings)
2. **Options:** Just 2 modes:
   - **Light Mode** = "Original Teal" theme (DEFAULT for new users)
   - **Dark Mode** = "Gallery Dark" theme
3. **Storage:** localStorage for now (database later)
4. **Goal:** Fix visibility issues and provide instant theme switching

---

## Current System Analysis

### Existing Theme Architecture

**File: `src/lib/themes.ts`**
- Defines 5 color themes: `warm-gallery`, `cool-professional`, `gallery-dark`, `soft-sage`, `original-teal`
- Each theme has BOTH `light` and `dark` mode variants with full color palettes
- Exports `DEFAULT_THEME = 'original-teal'`
- Contains `themeToCssVariables()` function to convert theme colors to CSS custom properties

**File: `src/components/ThemeProvider.tsx`**
- Wraps `next-themes` (handles light/dark mode switching)
- Provides `ColorThemeContext` for color theme selection (warm-gallery, cool-professional, etc.)
- Watches for `.dark` class changes via MutationObserver
- Applies CSS variables dynamically based on:
  - Current color theme (e.g., "gallery-dark")
  - Current mode (light or dark)
- Stores color theme in `localStorage` as `photovault-color-theme`

**File: `src/components/ThemePicker.tsx`**
- Admin-focused component with dropdown for all 5 color themes
- Separate light/dark/system mode buttons
- Shows theme preview swatches
- Includes dashboard preview toggle

**How It Currently Works:**
```
1. User selects COLOR THEME (e.g., "Gallery Dark") → saved to localStorage
2. User selects MODE (light/dark/system) → handled by next-themes
3. ThemeProvider watches both and applies the correct CSS variables
   - If mode = light → applies theme.light colors
   - If mode = dark → applies theme.dark colors
```

### Key Insight

The existing system ALREADY supports what we need! The challenge is:
- **Admin ThemePicker** = 5 color themes × 2 modes = 10 combinations (too complex)
- **User Needs** = 2 simple options:
  - "Light" = Original Teal light mode
  - "Dark" = Gallery Dark dark mode

We don't need to build a new theme system - we need to create a SIMPLIFIED interface that:
1. Locks the color theme based on mode choice
2. Presents it as a single light/dark toggle

---

## Solution Design

### Approach: Mode Toggle with Locked Color Themes

Instead of exposing all 5 color themes, we create a toggle that:
- **Light Mode** → Sets `colorTheme = 'original-teal'` + `mode = 'light'`
- **Dark Mode** → Sets `colorTheme = 'gallery-dark'` + `mode = 'dark'`

This gives users a simple binary choice while leveraging the existing theme infrastructure.

### Why This Works

1. **Leverages Existing System:** No new theme provider logic needed
2. **Fixes Visibility Issues:** "Original Teal" light mode has excellent contrast
3. **Optimal Dark Mode:** "Gallery Dark" is specifically designed for photo viewing
4. **Future-Proof:** If we later want to add more options, the infrastructure is already there

---

## Implementation Plan

### 1. Create ThemeModeToggle Component

**File:** `src/components/ThemeModeToggle.tsx`

```tsx
'use client';

import { useColorTheme } from '@/components/ThemeProvider';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ThemeModeToggle - Simple Light/Dark Mode Toggle
 *
 * This component provides a user-friendly toggle between:
 * - Light Mode = Original Teal theme in light mode
 * - Dark Mode = Gallery Dark theme in dark mode
 *
 * Unlike the admin ThemePicker (which offers 5 color themes),
 * this gives users a simple binary choice optimized for visibility.
 */
export function ThemeModeToggle() {
  const { setColorTheme } = useColorTheme();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // When component mounts, ensure theme is set to default if not already set
  useEffect(() => {
    if (!mounted) return;

    const savedColorTheme = localStorage.getItem('photovault-color-theme');
    const savedMode = localStorage.getItem('theme'); // next-themes uses 'theme' key

    // If no saved preferences, set defaults
    if (!savedColorTheme || !savedMode) {
      setColorTheme('original-teal');
      setTheme('light');
    }
  }, [mounted, setColorTheme, setTheme]);

  if (!mounted) {
    return (
      <Button variant="outline" size="lg" disabled>
        <Sun className="h-5 w-5 mr-2" />
        Loading...
      </Button>
    );
  }

  const isLightMode = resolvedTheme === 'light';

  const toggleMode = () => {
    if (isLightMode) {
      // Switch to Dark Mode
      setColorTheme('gallery-dark');
      setTheme('dark');
    } else {
      // Switch to Light Mode
      setColorTheme('original-teal');
      setTheme('light');
    }
  };

  return (
    <Button
      onClick={toggleMode}
      variant="outline"
      size="lg"
      className="flex items-center gap-2 font-medium"
    >
      {isLightMode ? (
        <>
          <Moon className="h-5 w-5" />
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="h-5 w-5" />
          <span>Light Mode</span>
        </>
      )}
    </Button>
  );
}

/**
 * ThemeModeToggleCompact - Icon-only version for tight spaces
 */
export function ThemeModeToggleCompact() {
  const { setColorTheme } = useColorTheme();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const savedColorTheme = localStorage.getItem('photovault-color-theme');
    const savedMode = localStorage.getItem('theme');

    if (!savedColorTheme || !savedMode) {
      setColorTheme('original-teal');
      setTheme('light');
    }
  }, [mounted, setColorTheme, setTheme]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isLightMode = resolvedTheme === 'light';

  const toggleMode = () => {
    if (isLightMode) {
      setColorTheme('gallery-dark');
      setTheme('dark');
    } else {
      setColorTheme('original-teal');
      setTheme('light');
    }
  };

  return (
    <Button
      onClick={toggleMode}
      variant="ghost"
      size="icon"
      title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {isLightMode ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
```

**Key Features:**
- **Default to Light Mode:** Sets `original-teal` + `light` for new users
- **Locked Color Themes:** Light always uses "Original Teal", Dark always uses "Gallery Dark"
- **Persistent:** Stores both color theme and mode in localStorage
- **No Hydration Mismatch:** Uses mounted state to prevent SSR issues
- **Two Variants:** Full button with label + compact icon-only version

---

### 2. Modify Photographer Dashboard

**File:** `src/app/photographer/dashboard/page.tsx`

**Location 1: Desktop Header (Right Side Actions)**

Insert AFTER the notifications bell (line 182), BEFORE the user profile button:

```tsx
<div className="hidden lg:flex items-center gap-3">
  <ThemeModeToggleCompact />  {/* ADD THIS */}
  <button className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all relative">
    <Bell size={20} />
    <span className="absolute top-1 right-1 w-2 h-2 bg-[#f59e0b] rounded-full"></span>
  </button>
  {/* ... rest of header ... */}
</div>
```

**Location 2: Mobile Menu (Settings Section)**

Insert BEFORE the Settings link (around line 243):

```tsx
<div className="h-px bg-white/10 my-4" />

{/* ADD THIS SECTION */}
<div className="px-4 py-3">
  <p className="text-xs text-slate-400 mb-2">Appearance</p>
  <ThemeModeToggle />
</div>

<Link href="/photographers/settings" className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5">
  Settings
</Link>
```

**Import Statement:**

Add to top of file:

```tsx
import { ThemeModeToggle, ThemeModeToggleCompact } from '@/components/ThemeModeToggle'
```

---

### 3. Modify Client Dashboard

**File:** `src/app/client/dashboard/page.tsx`

**Location 1: Desktop Header (Right Side Actions)**

Insert AFTER the "Family Account" badge (line 117), BEFORE the messages button:

```tsx
<div className="flex items-center space-x-4">
  <Badge variant="outline" className="bg-white/[0.03] text-neutral-300 border-white/10">
    Family Account
  </Badge>
  <ThemeModeToggleCompact />  {/* ADD THIS */}
  <MessagesButton variant="icon" />
  {/* ... rest of header ... */}
</div>
```

**Location 2: Settings Card (Optional - More Prominent)**

If we want to make it VERY visible, add a dedicated card in the Quick Actions grid:

```tsx
<Card className="bg-neutral-800/50 border-white/10 hover:bg-neutral-700/50 transition-colors">
  <CardHeader>
    <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
      <Sun className="w-6 h-6 text-indigo-400" />
    </div>
    <CardTitle className="text-neutral-100">Theme</CardTitle>
    <CardDescription className="text-neutral-400">
      Switch between light and dark mode
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ThemeModeToggle />
  </CardContent>
</Card>
```

**Import Statement:**

Add to top of file:

```tsx
import { ThemeModeToggle, ThemeModeToggleCompact } from '@/components/ThemeModeToggle'
import { Sun } from 'lucide-react' // If adding the card version
```

---

### 4. Update ThemeProvider Default

**File:** `src/components/ThemeProvider.tsx`

**Current Default:** Line 109 sets `defaultTheme="system"`

**Change to:**

```tsx
<NextThemesProvider
  attribute="class"
  defaultTheme="light"  // CHANGED: Default to light instead of system
  enableSystem
  disableTransitionOnChange
>
  {children}
</NextThemesProvider>
```

**Also Update Color Theme Default:**

Change line 36 to match:

```tsx
const [colorTheme, setColorThemeState] = useState<string>('original-teal'); // Already correct!
```

This ensures:
- New users get Light Mode by default
- System preference detection is still available if they manually select it later

---

### 5. Update themes.ts Constants

**File:** `src/lib/themes.ts`

No changes needed! The file already has:
```tsx
export const DEFAULT_THEME = 'original-teal';
```

This is perfect for our light mode default.

---

## Differences from Admin ThemePicker

| Feature | Admin ThemePicker | ThemeModeToggle (Users) |
|---------|-------------------|-------------------------|
| **Color Themes** | All 5 themes available | Locked (Original Teal for light, Gallery Dark for dark) |
| **Mode Options** | Light / Dark / System | Light / Dark only (system can still be selected but not default) |
| **UI** | Dropdown + 3 buttons + preview cards | Single toggle button with icon |
| **Location** | Admin settings page | Prominent on dashboard header |
| **Complexity** | 15+ interactive elements | 1 button |
| **Target Users** | Admin only | All photographers and clients |
| **Preview** | Shows all theme swatches + dashboard preview | No preview needed (instant feedback) |

The ThemeModeToggle is intentionally simpler - it's not a "lite version" of ThemePicker, it's a completely different UX pattern optimized for quick switching.

---

## Storage Strategy

### Current Storage (No Changes Needed)

**next-themes** already stores mode preference:
- **Key:** `theme`
- **Values:** `'light'` | `'dark'` | `'system'`
- **Location:** localStorage

**ColorThemeContext** already stores color theme:
- **Key:** `photovault-color-theme`
- **Values:** `'original-teal'` | `'gallery-dark'` | etc.
- **Location:** localStorage

### How Our Toggle Uses This

```tsx
// User clicks "Dark Mode"
setColorTheme('gallery-dark')     // Updates photovault-color-theme
setTheme('dark')                  // Updates theme (next-themes)

// User clicks "Light Mode"
setColorTheme('original-teal')    // Updates photovault-color-theme
setTheme('light')                 // Updates theme (next-themes)
```

Both changes persist automatically via existing localStorage logic in ThemeProvider.

### Future: Database Storage

When we later want to store preferences in the database:

1. Create `user_preferences` table:
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  color_theme TEXT DEFAULT 'original-teal',
  theme_mode TEXT DEFAULT 'light',
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

2. Modify ThemeModeToggle to:
   - Read from database on mount
   - Update database on toggle (with debouncing)
   - Fall back to localStorage if database fails

3. Keep localStorage as cache for instant loading

---

## Default Behavior for New Users

### Current Problem
New users land on the site with:
- `theme = 'system'` (follows OS preference)
- `colorTheme = 'original-teal'`

If their OS is in dark mode, they get "Original Teal DARK mode" which may not have optimal contrast.

### Solution

After implementing this plan, new users will get:
- `theme = 'light'` (explicit light mode)
- `colorTheme = 'original-teal'`

**Result:** Clean, high-contrast interface with teal accents on white background.

If they want dark mode, they click the toggle and get "Gallery Dark" which is specifically designed for photo viewing with warm dark tones.

---

## Visual Design Specifications

### Button Styling

**Full Button (ThemeModeToggle):**
```
┌─────────────────────┐
│  ☀️  Light Mode     │  ← When in Dark Mode (shows what clicking does)
└─────────────────────┘

┌─────────────────────┐
│  🌙  Dark Mode      │  ← When in Light Mode (shows what clicking does)
└─────────────────────┘
```

- Size: `lg` (larger button for visibility)
- Variant: `outline` (stands out but not too aggressive)
- Icon: 5x5 size (prominent)
- Label: Shows the mode it will SWITCH TO (not current mode)

**Icon Button (ThemeModeToggleCompact):**
```
┌───┐
│ ☀️ │  ← Shows opposite of current mode
└───┘
```

- Size: `icon` (square button)
- Variant: `ghost` (subtle in header)
- Tooltip: "Switch to [Mode]"

### Placement Guidelines

**Photographer Dashboard:**
- Desktop: Right side of navy header, between notifications and profile
- Mobile: In mobile menu under divider, above Settings link

**Client Dashboard:**
- Desktop: Header actions area, after "Family Account" badge
- Optional: Dedicated card in Quick Actions grid (more discoverable)

**Color Contrast:**
Both button variants should be clearly visible in BOTH modes:
- Light mode: Dark text/icons on light background
- Dark mode: Light text/icons on dark background

The shadcn/ui `outline` and `ghost` variants already handle this automatically via CSS variables.

---

## Testing Checklist

### Functional Tests

- [ ] Toggle works on photographer dashboard (desktop)
- [ ] Toggle works on photographer dashboard (mobile)
- [ ] Toggle works on client dashboard (desktop)
- [ ] Toggle appears in mobile menu on photographer dashboard
- [ ] Light mode applies "Original Teal" theme correctly
- [ ] Dark mode applies "Gallery Dark" theme correctly
- [ ] Preference persists after page refresh
- [ ] Preference persists across browser sessions
- [ ] Default is Light Mode for new users (no localStorage keys)
- [ ] Toggle updates immediately (no page refresh needed)

### Visual Tests

- [ ] Light mode has good contrast (no "black on black")
- [ ] Dark mode has good contrast
- [ ] Button is prominent and easy to find
- [ ] Button state clearly shows which mode you'll switch TO
- [ ] Icons render correctly (Sun/Moon)
- [ ] Button styling matches dashboard design
- [ ] No layout shift when toggling
- [ ] No hydration mismatch errors in console

### Edge Cases

- [ ] Works when localStorage is disabled
- [ ] Works when localStorage is full (fallback gracefully)
- [ ] Doesn't interfere with admin ThemePicker on admin pages
- [ ] Multiple rapid toggles don't break state
- [ ] Opening multiple tabs syncs correctly
- [ ] Incognito mode works (uses defaults)

---

## Migration Notes

### Existing Users

Users who already have theme preferences stored:
- If they have `theme = 'dark'` but `colorTheme = 'original-teal'`, they'll see Original Teal dark mode (not ideal)
- **Solution:** On first load of the new component, detect mismatches and fix them

Add to ThemeModeToggle's mount effect:

```tsx
useEffect(() => {
  if (!mounted) return;

  const savedColorTheme = localStorage.getItem('photovault-color-theme');
  const savedMode = localStorage.getItem('theme');

  // Migration: Fix mismatched theme/mode combinations
  if (savedMode === 'dark' && savedColorTheme !== 'gallery-dark') {
    setColorTheme('gallery-dark');
  } else if (savedMode === 'light' && savedColorTheme !== 'original-teal') {
    setColorTheme('original-teal');
  }
}, [mounted, setColorTheme]);
```

### Admin Users

Admins should still have access to the full ThemePicker on their settings page. The ThemeModeToggle is for quick switching only - admins who want to try different color schemes can still do so.

---

## Future Enhancements

### Phase 2: Database Storage

- Store preferences in `user_preferences` table
- Sync across devices for logged-in users
- Fall back to localStorage for guests

### Phase 3: Additional Modes (Optional)

If users request it, we could add:
- **Auto Mode:** Switch based on time of day (light during day, dark at night)
- **System Mode:** Follow OS preference (already supported by next-themes)

This would require adding a third option to the toggle (convert to dropdown or segmented control).

### Phase 4: Per-Gallery Themes (Optional)

Allow photographers to set a preferred theme for specific galleries (e.g., always show wedding galleries in light mode, concert galleries in dark mode).

---

## Code Summary

### Files to Create

1. `src/components/ThemeModeToggle.tsx` (new component)

### Files to Modify

2. `src/app/photographer/dashboard/page.tsx` (add toggle)
3. `src/app/client/dashboard/page.tsx` (add toggle)
4. `src/components/ThemeProvider.tsx` (change default to light)

### Files NOT Modified

- `src/lib/themes.ts` (already has correct defaults)
- `src/components/ThemePicker.tsx` (admin component stays unchanged)
- Any API routes or backend logic (localStorage only for now)

---

## Total Effort Estimate

- **Component Creation:** 30 minutes
- **Dashboard Integration:** 20 minutes (photographer + client)
- **Testing:** 30 minutes
- **Documentation:** This plan (already done!)

**Total:** ~1.5 hours of development work

---

## Success Criteria

This implementation is successful when:

1. ✅ New users land on a high-contrast Light Mode by default
2. ✅ Users can easily find and click the theme toggle
3. ✅ Toggle switches between exactly 2 modes (no confusion)
4. ✅ Preference persists across sessions
5. ✅ No more "black on black" visibility issues
6. ✅ Admin ThemePicker still works for power users
7. ✅ No console errors or hydration warnings

---

## Conclusion

This implementation leverages the existing theme infrastructure while providing a simple, user-friendly interface. By locking color themes to modes (Original Teal = Light, Gallery Dark = Dark), we give users a binary choice that's easy to understand while maintaining the flexibility to expand options later.

The key insight is that we're not building a new theme system - we're creating a simplified VIEW of the existing system optimized for non-admin users.

