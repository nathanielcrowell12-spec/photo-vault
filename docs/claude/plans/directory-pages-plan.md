# Directory Pages Implementation Plan

**Created:** December 5, 2025
**Status:** Ready for Implementation

---

## Build Order

### Phase 1: Foundation (Types + Shared Components)
1. `src/types/directory.ts` - Type definitions
2. `src/components/directory/PermitBadge.tsx` - Permit status badge
3. `src/components/directory/AttributeBadges.tsx` - Location type/vibe tags
4. `src/components/directory/LocationSkeleton.tsx` - Loading skeleton
5. `src/components/directory/LocationCard.tsx` - Enhanced card with dark theme

### Phase 2: Layout + Main Page
6. `src/components/directory/DirectoryLayout.tsx` - Shared header
7. `src/app/directory/layout.tsx` - Route layout
8. `src/components/directory/LocationSearch.tsx` - Search component
9. `src/app/directory/page.tsx` - Main directory (featured cities)

### Phase 3: City Page + Filters
10. `src/components/directory/LocationFilters.tsx` - Full filter UI
11. `src/components/directory/LocationGrid.tsx` - Grid with filtering
12. `src/app/directory/[city]/page.tsx` - City locations listing

### Phase 4: Location Detail Page
13. `src/app/directory/[city]/[location_slug]/page.tsx` - Full location detail

---

## Design System

- **Dark theme:** `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`
- **Cards:** `bg-slate-800/50 border-slate-700 hover:border-slate-600`
- **Accent:** `amber-400/500`
- **Text:** White headings, `text-slate-400` secondary
- **Rounded:** `rounded-2xl` cards, `rounded-lg` smaller elements

---

## Data Fetching

- **Server Components** for pages (use `createServerSupabaseClient`)
- **Client Components** for filters (URL state with `useSearchParams`)
- **Static generation** with `generateStaticParams` for location detail pages

---

## Key Patterns

### Server Component Data Fetch
```tsx
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function Page() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('locations').select('*')
  return <Component data={data} />
}
```

### Client Filter with URL State
```tsx
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export function Filters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    value ? params.set(key, value) : params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }
}
```
