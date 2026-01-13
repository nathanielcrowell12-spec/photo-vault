# QA Critic Review: UI Image Effects Preview Plan

**Reviewer:** QA Critic
**Date:** 2026-01-06
**Plan Reviewed:** `docs/claude/plans/ui-image-effects-preview-plan.md`
**Target File:** `src/app/admin/image-effects/page.tsx`

---

## Summary Verdict: APPROVE WITH CONCERNS

The plan is fundamentally sound and addresses the correct problem. The existing `TiltCard` and `FlipCard` components are indeed present and unused. However, there are several technical issues and missing details that should be addressed before implementation.

---

## Critical Issues (Must Fix Before Implementation)

### 1. CSS Syntax Incorrect for Modern Tailwind v4

The plan proposes adding CSS to `globals.css` using `@apply` inside pseudo-elements:

```css
.border-glow-effect::before {
  @apply absolute -inset-1 rounded-lg opacity-0 transition-opacity duration-300;
}
```

**Problem:** In Tailwind v4 (which this project uses based on `@import "tailwindcss"`), the `@apply` directive behavior inside pseudo-elements can be inconsistent. The `@layer utilities` block in the current `globals.css` (lines 162-268) shows existing patterns that work, but mixing `@apply` with `content: ''` pseudo-elements is fragile.

**Fix:** Use explicit CSS properties instead:
```css
.border-glow-effect::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s;
  background: linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)));
  filter: blur(8px);
  z-index: -1;
}
```

### 2. FlipCard Requires Parent `group` Class on Wrong Element

The plan shows:
```tsx
case 'Flip Card':
  return (
    <div className="group">
      <FlipCard
        front={...}
        back={...}
      />
    </div>
  )
```

**Problem:** Looking at `FlipCard` component (lines 44-57), it uses `group-hover:[transform:rotateY(180deg)]`. The `group` class is on the wrapper div, but the transform is applied to an inner div. This should work, but the wrapper div needs height to be visible.

**Fix:** Either:
- Add `h-48` to the wrapper: `<div className="group h-48">`
- Or restructure FlipCard to be self-contained with hover state

### 3. Missing Image File

The effect `capitol-painting.jpg` is referenced in the effects array (line 193) and exists, but verify all image paths:

**Verified existing:**
- `/images/cards/elegant-accessories-bejeweled-sandals.jpg` - EXISTS
- `/images/cards/hands-close-up.jpg` - EXISTS
- `/images/galleries/elegant-statue-botanical.jpg` - EXISTS
- `/images/hero/city-dawn-aerial.jpg` - EXISTS
- `/images/hero/landscape-cloudy-sky.jpg` - EXISTS
- `/images/hero/waterfront-city-sunset.jpg` - EXISTS
- `/images/galleries/lighthouse-boats.jpg` - EXISTS
- `/images/cards/chess-piece.jpg` - EXISTS
- `/images/galleries/capitol-painting.jpg` - EXISTS
- `/images/cards/yellow-soccer-ball.jpg` - EXISTS
- `/images/galleries/stone-lion-statues.jpg` - EXISTS
- `/images/testimonials/mother-baby.jpg` - EXISTS

**All images verified. No missing files.**

---

## Concerns (Should Address)

### 1. Ken Burns Animation May Cause Layout Shift

The Ken Burns animation scales and translates the image:
```css
transform: scale(1.15) translate(-3%, -3%);
```

**Concern:** With `overflow-hidden` on the container, this should be fine, but the animation runs continuously (`infinite alternate`). On lower-powered devices, this could impact performance.

**Recommendation:** Consider adding `will-change: transform` to the animated element for GPU acceleration, or use `transform: scale(1.15) translateZ(0)` to force GPU compositing.

### 2. Accessibility: Continuous Animations

Ken Burns and Zoom Pulse animations run infinitely. Users with vestibular disorders may find this uncomfortable.

**Recommendation:** Wrap continuous animations in a `prefers-reduced-motion` media query:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-ken-burns,
  .animate-zoom-pulse {
    animation: none;
  }
}
```

### 3. No idx Parameter Used

The render function signature is:
```tsx
const renderEffectPreview = (effect: typeof effects[0], idx: number) => {
```

But `idx` is never used in the function body.

**Recommendation:** Remove unused parameter or use it for unique keys if needed.

### 4. TiltCard Height May Be Inconsistent

The TiltCard case returns:
```tsx
<TiltCard className="relative h-48 rounded-lg overflow-hidden cursor-pointer">
```

The `TiltCard` component (lines 12-41) spreads `className` to its wrapper div. This should work, but verify the height is correctly applied.

### 5. Type Safety for Switch Statement

The plan uses string matching:
```tsx
switch (effect.name) {
  case 'Hover Zoom':
```

**Concern:** If effect names change in the `effects` array, the switch cases will silently fall through to default.

**Recommendation:** Consider extracting effect names as a union type or enum for type safety.

---

## What the Plan Gets Right

1. **Correct Problem Identification:** The plan accurately identifies that lines 333-345 show static previews that need to be replaced with effect-specific rendering.

2. **Reuse of Existing Components:** Correctly identifies that `TiltCard` (lines 12-41) and `FlipCard` (lines 44-57) already exist and are unused.

3. **Appropriate Use of Tailwind:** Most effects use simple Tailwind classes (`group-hover:scale-110`, `grayscale hover:grayscale-0`, `blur-sm hover:blur-0`) which is the right approach.

4. **Graceful Degradation for Scroll-Based Effects:** Correctly identifies that Parallax Scroll and Image Reveal Animation cannot be demonstrated in a hover context and proposes badges explaining they require scrolling.

5. **Low Risk Assessment:** Correctly identifies that changes are isolated to one page and CSS utilities with no database or API changes.

6. **Correct File Paths:** All file paths mentioned are accurate.

7. **Existing CSS Patterns Leveraged:** The plan correctly notes that `globals.css` already has `.image-card` with hover effects (lines 236-267).

---

## Recommendation

**PROCEED WITH IMPLEMENTATION** after addressing:

1. **Must Do:**
   - Rewrite the `.border-glow-effect` CSS to use explicit properties instead of `@apply` in pseudo-elements
   - Add height to FlipCard wrapper div

2. **Should Do:**
   - Add `prefers-reduced-motion` support for accessibility
   - Add `will-change: transform` for animation performance
   - Remove unused `idx` parameter

3. **Nice to Have:**
   - Add type safety for effect names

The plan is well-structured and addresses the core issue correctly. The concerns are minor and the critical issues have straightforward fixes.

---

*Critique completed by QA Critic. Plan is approved for implementation with noted modifications.*
