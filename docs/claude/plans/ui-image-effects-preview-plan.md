# UI Image Effects Preview Implementation Plan

**Date:** 2026-01-06
**Status:** Ready for QA Critic Review
**Target File:** `src/app/admin/image-effects/page.tsx`

---

## Executive Summary

This plan fixes the non-functional image effect previews on the admin image effects showcase page. Currently, all 12 effects display static images with a "Hover to preview" badge, but no actual effects occur on hover. The fix involves creating a render function for each effect type and removing the static overlay.

---

## Current State Analysis

### What Exists
- **Page Location:** `src/app/admin/image-effects/page.tsx`
- **Pre-built Components (unused):** `TiltCard` (lines 12-41) and `FlipCard` (lines 44-57) already exist in the file but are not used
- **Static Preview:** Lines 333-345 show all effects with identical static rendering - a static overlay that says "Hover to preview"
- **Global CSS Effects:** `globals.css` already has `.image-card` with hover zoom and slide-up text

### Problem
The preview section renders every effect identically with a static overlay. No effect-specific classes or behaviors are applied.

---

## Implementation Strategy

Replace the single static preview block with a render function that returns effect-specific JSX for each effect type. Use Tailwind classes where possible; use existing React components for complex effects (3D tilt, flip card).

---

## Detailed Implementation

### Step 1: Add CSS Keyframe Animations

Add to `src/app/globals.css` within the `@layer utilities` block:

```css
/* Ken Burns continuous animation */
@keyframes ken-burns {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.15) translate(-3%, -3%); }
}

.animate-ken-burns {
  animation: ken-burns 12s ease-in-out infinite alternate;
}

/* Zoom Pulse animation */
@keyframes zoom-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.animate-zoom-pulse {
  animation: zoom-pulse 2s ease-in-out infinite;
}

/* Border glow effect */
.border-glow-effect {
  @apply relative;
}

.border-glow-effect::before {
  content: '';
  @apply absolute -inset-1 rounded-lg opacity-0 transition-opacity duration-300;
  background: linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)));
  filter: blur(8px);
  z-index: -1;
}

.border-glow-effect:hover::before {
  @apply opacity-100;
}
```

### Step 2: Create the Preview Renderer Function

Add this function inside `ImageEffectsPage` component, then replace the static preview section:

```tsx
const renderEffectPreview = (effect: typeof effects[0], idx: number) => {
  const baseImageClasses = "object-cover w-full h-full"

  switch (effect.name) {
    case 'Hover Zoom':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden group">
          <Image
            src={effect.example}
            alt={effect.name}
            fill
            className={`${baseImageClasses} transition-transform duration-300 group-hover:scale-110`}
          />
        </div>
      )

    case 'Hover Slide-Up Text':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden group">
          <Image src={effect.example} alt={effect.name} fill className={baseImageClasses} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="font-semibold">Photo Title</p>
            <p className="text-sm text-white/80">Sample description text</p>
          </div>
        </div>
      )

    case 'Grayscale to Color':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden">
          <Image
            src={effect.example}
            alt={effect.name}
            fill
            className={`${baseImageClasses} grayscale hover:grayscale-0 transition-all duration-500`}
          />
        </div>
      )

    case 'Overlay Fade-In':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden group">
          <Image src={effect.example} alt={effect.name} fill className={baseImageClasses} />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white font-semibold">View Details</p>
          </div>
        </div>
      )

    case 'Parallax Scroll':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden bg-secondary/30 flex items-center justify-center">
          <Image src={effect.example} alt={effect.name} fill className={`${baseImageClasses} opacity-50`} />
          <Badge variant="secondary" className="z-10">Scroll-based effect - see code</Badge>
        </div>
      )

    case 'Ken Burns Effect':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden">
          <Image src={effect.example} alt={effect.name} fill className={`${baseImageClasses} animate-ken-burns`} />
        </div>
      )

    case 'Blur to Focus':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden">
          <Image
            src={effect.example}
            alt={effect.name}
            fill
            className={`${baseImageClasses} blur-sm hover:blur-0 transition-all duration-500`}
          />
        </div>
      )

    case '3D Tilt Effect':
      return (
        <TiltCard className="relative h-48 rounded-lg overflow-hidden cursor-pointer">
          <Image src={effect.example} alt={effect.name} fill className={baseImageClasses} />
        </TiltCard>
      )

    case 'Flip Card':
      return (
        <div className="group">
          <FlipCard
            front={<Image src={effect.example} alt={effect.name} fill className={`${baseImageClasses} rounded-lg`} />}
            back={<div className="text-center p-4"><p className="font-bold text-lg">Back Side</p><p className="text-sm opacity-80">Additional info here</p></div>}
          />
        </div>
      )

    case 'Border Glow':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden border-glow-effect">
          <Image src={effect.example} alt={effect.name} fill className={baseImageClasses} />
        </div>
      )

    case 'Image Reveal Animation':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden bg-secondary/30 flex items-center justify-center">
          <Image src={effect.example} alt={effect.name} fill className={`${baseImageClasses} opacity-50`} />
          <Badge variant="secondary" className="z-10">Scroll-triggered - see code</Badge>
        </div>
      )

    case 'Zoom Pulse':
      return (
        <div className="relative h-48 rounded-lg overflow-hidden">
          <Image src={effect.example} alt={effect.name} fill className={`${baseImageClasses} animate-zoom-pulse`} />
        </div>
      )

    default:
      return (
        <div className="relative h-48 rounded-lg overflow-hidden bg-secondary/30">
          <Image src={effect.example} alt={effect.name} fill className={baseImageClasses} />
        </div>
      )
  }
}
```

### Step 3: Update the Card Rendering

Replace the preview section in the map function with:

```tsx
{/* Preview */}
{renderEffectPreview(effect, idx)}
```

---

## Effect Implementation Summary

| Effect | Implementation | Complexity |
|--------|---------------|------------|
| Hover Zoom | Tailwind `group-hover:scale-110` | Simple |
| Hover Slide-Up Text | Tailwind `translate-y-full` + `group-hover:translate-y-0` | Simple |
| Grayscale to Color | Tailwind `grayscale hover:grayscale-0` | Simple |
| Overlay Fade-In | Tailwind `opacity-0 group-hover:opacity-100` | Simple |
| Parallax Scroll | Skip (badge explaining scroll-based) | N/A |
| Ken Burns Effect | CSS keyframe animation (continuous) | Medium |
| Blur to Focus | Tailwind `blur-sm hover:blur-0` | Simple |
| 3D Tilt Effect | Existing `TiltCard` component | Already exists |
| Flip Card | Existing `FlipCard` component | Already exists |
| Border Glow | CSS pseudo-element with blur | Medium |
| Image Reveal Animation | Skip (badge explaining scroll-based) | N/A |
| Zoom Pulse | CSS keyframe animation (continuous) | Medium |

---

## Files to Modify

1. **`src/app/admin/image-effects/page.tsx`**
   - Add `renderEffectPreview` function
   - Replace static preview with function call

2. **`src/app/globals.css`**
   - Add `@keyframes ken-burns` animation
   - Add `@keyframes zoom-pulse` animation
   - Add `.border-glow-effect` class

---

## Testing Checklist

- [ ] Hover Zoom: Image scales up on hover
- [ ] Hover Slide-Up Text: Text slides up from bottom on hover
- [ ] Grayscale to Color: Image starts grayscale, becomes color on hover
- [ ] Overlay Fade-In: Dark overlay with text appears on hover
- [ ] Ken Burns Effect: Image continuously pans/zooms slowly
- [ ] Blur to Focus: Image starts blurry, becomes clear on hover
- [ ] 3D Tilt Effect: Card tilts based on mouse position
- [ ] Flip Card: Card flips on hover to show back
- [ ] Border Glow: Glowing border appears on hover
- [ ] Zoom Pulse: Subtle continuous pulsing animation

---

## Risk Assessment

**Low Risk:**
- All changes are isolated to one page file and CSS utilities
- No database or API changes required
- Existing TiltCard and FlipCard components are already in the file

---

*Plan generated by UI Expert subagent. Awaiting QA Critic review.*
