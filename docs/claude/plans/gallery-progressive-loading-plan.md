# Gallery Progressive Loading Plan (Revised)

**Problem:** Galleries load all photos at once, causing slow perceived performance on slower connections. Users want photos at the top to load first while later photos load in the background.

**Revision Note:** This plan addresses all concerns from QA Critic review dated 2026-01-25.

---

## Pre-Implementation Investigation

### Existing Infrastructure Documented

| Component | Location | Current State |
|-----------|----------|---------------|
| `ImageWithFallback` | `src/components/ui/ImageWithFallback.tsx` | Has `loading="lazy"`, error handling with camera icon fallback |
| Gallery View Grid | `src/app/gallery/[galleryId]/components/GalleryGrid.tsx` | 80 lines, uses native `<img loading="lazy">` for thumbnails |
| Dashboard Grid | `src/components/GalleryGrid.tsx` | 713 lines, uses native `<img loading="lazy">` for cover images |
| `next/image` usage | 13 files (landing pages, directory) | Uses `priority` prop in HeroSection |

### Why Native `<img>` Instead of `next/image`

Gallery images come from Supabase Storage with dynamic URLs. Using `next/image` would require:
- Adding Supabase domain to `next.config.js` remotePatterns
- Dealing with Next.js image optimization caching (additional server costs)
- Thumbnails are already pre-generated at optimal sizes

**Decision:** Continue with native `<img>` for gallery images, but enhance `ImageWithFallback` with priority loading and Intersection Observer.

---

## Proposed Solution: Enhance ImageWithFallback

### Phase 1: Add Priority Loading Support

Extend `ImageWithFallback` with a `priority` prop:

```tsx
interface ImageWithFallbackProps {
  src?: string
  alt: string
  className?: string
  fallbackIcon?: React.ReactNode
  onError?: () => void
  priority?: boolean  // NEW: load immediately with high priority
  onLoad?: () => void // NEW: callback when image loads
}
```

When `priority={true}`:
- Set `fetchPriority="high"` (Chrome 101+, Safari 17+, Firefox 102+)
- Set `loading="eager"` instead of `loading="lazy"`

### Phase 2: Add Intersection Observer for Non-Priority Images

For images without `priority`:
- Use a single shared Intersection Observer (not one per image)
- Only start loading when image is ~200px from viewport
- Show placeholder until image loads
- Fade in when loaded

```tsx
// Conceptual structure (not final code)
export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon,
  onError,
  priority = false,
  onLoad
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(priority) // Priority images load immediately
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority || !imgRef.current) return

    // Use shared observer pattern
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [priority])

  // ... rest of component
}
```

### Phase 3: Apply to Both GalleryGrid Components

**Gallery View Grid** (`src/app/gallery/[galleryId]/components/GalleryGrid.tsx`):
- First 4 images: `priority={true}`
- Remaining images: default lazy behavior

**Dashboard Grid** (`src/components/GalleryGrid.tsx`):
- Cover images are already above fold
- Add `priority={true}` to first 6 visible cards

---

## Implementation Details

### File Changes

1. **`src/components/ui/ImageWithFallback.tsx`** - Enhance with priority + Intersection Observer
2. **`src/app/gallery/[galleryId]/components/GalleryGrid.tsx`** - Use enhanced ImageWithFallback with priority
3. **`src/components/GalleryGrid.tsx`** - Use enhanced ImageWithFallback for cover images

### Code Conventions (per QA Critic)

- Use `bg-muted` instead of `bg-slate-200` for placeholder backgrounds
- Use `cn()` utility for class merging
- Add TypeScript interfaces for all new props
- Handle SSR: Check `typeof window !== 'undefined'` for IntersectionObserver

### Accessibility

- Add `aria-hidden="true"` to loading placeholder
- Maintain alt text during all loading states
- Screen readers should announce image when loaded (via live region if needed)

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Image load failure | Show fallback camera icon (existing behavior) |
| No src provided | Show fallback immediately (existing behavior) |
| Very slow connection | Placeholder persists until load; no timeout needed |
| Single photo gallery | Still use ImageWithFallback, no special case |
| Empty gallery | Handled by parent component's empty state |
| React StrictMode double-mount | Observer cleanup in useEffect handles this |

---

## Testing Plan

### Unit Tests (`src/components/ui/__tests__/ImageWithFallback.test.tsx`)

```typescript
describe('ImageWithFallback', () => {
  it('loads immediately when priority={true}', async () => {
    // Verify fetchPriority="high" and loading="eager" are set
  })

  it('defers loading for non-priority images', async () => {
    // Verify image src is not set until intersection
  })

  it('shows placeholder while loading', () => {
    // Verify bg-muted placeholder is visible
  })

  it('fades in when loaded', async () => {
    // Verify opacity transition after onLoad
  })

  it('shows fallback on error', async () => {
    // Verify camera icon appears on error
  })

  it('handles missing src', () => {
    // Verify fallback shown immediately
  })
})
```

### E2E Tests (`e2e/gallery-loading.spec.ts`)

```typescript
describe('Gallery Progressive Loading', () => {
  test('first 4 images load immediately', async ({ page }) => {
    // Navigate to gallery, verify first 4 images have src set
  })

  test('remaining images load on scroll', async ({ page }) => {
    // Navigate, scroll down, verify images load as they enter viewport
  })

  test('works on slow 3G', async ({ page }) => {
    // Throttle network, verify progressive loading behavior
  })
})
```

### Manual Testing Checklist

- [ ] Chrome DevTools Network: Verify first 4 requests have `fetchPriority: high`
- [ ] Slow 3G throttle: First 4 images appear before scroll
- [ ] Scroll test: Images below fold load as they approach viewport
- [ ] Error test: Replace image URL with invalid, verify fallback appears
- [ ] Safari/Firefox: Verify graceful degradation of fetchPriority

### Performance Baseline (Capture Before Implementation)

Use Chrome DevTools Lighthouse on a gallery with 20+ photos:
- LCP (Largest Contentful Paint)
- FCP (First Contentful Paint)
- Speed Index
- Total image bytes transferred on initial load

---

## Rollout Plan

1. **Phase 1** (Quick Win): Add `priority` prop to ImageWithFallback, apply to gallery view
2. **Phase 2** (Full Enhancement): Add Intersection Observer, placeholder, fade-in
3. **Phase 3** (If Needed): Virtualization for galleries with 100+ photos

---

## Files to Create/Modify Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/ImageWithFallback.tsx` | Modify | Add priority, intersection observer, fade-in |
| `src/app/gallery/[galleryId]/components/GalleryGrid.tsx` | Modify | Use ImageWithFallback with priority for first 4 |
| `src/components/GalleryGrid.tsx` | Modify | Use ImageWithFallback for cover images |
| `src/components/ui/__tests__/ImageWithFallback.test.tsx` | Create | Unit tests |
| `e2e/gallery-loading.spec.ts` | Create | E2E tests |

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Native `<img>` over `next/image` | Dynamic Supabase URLs, pre-generated thumbnails, avoid optimization costs |
| Extend ImageWithFallback | Don't duplicate; maintain existing error handling |
| Single shared observer | Memory efficient vs. one observer per image |
| 200px rootMargin | Balance between early loading and bandwidth savings |
| First 4 priority | Conservative; visible on most viewports without overfetching |

---

## References

- [MDN Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [web.dev lazy loading best practices](https://web.dev/lazy-loading-images/)
- [fetchPriority browser support](https://caniuse.com/mdn-html_elements_img_fetchpriority)
- PhotoVault shadcn conventions: `bg-muted`, `cn()` utility
