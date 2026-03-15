# Blog Infrastructure Plan — Critique

**Date:** 2026-03-14
**Reviewer:** QA Critic (Senior Software Architect)
**Plan:** `docs/claude/plans/blog-infrastructure-plan.md`

---

## Verdict: REVISE — 3 blocking issues, 4 non-blocking concerns

The plan is well-structured and makes sound architectural decisions (file-based MDX, `next-mdx-remote`, SSG with ISR). However, it has three issues that will cause real problems if not addressed before implementation.

---

## Blocking Issues

### B1. `next-mdx-remote` React 19 / RSC Compatibility

**Severity:** Blocking
**Category:** Correctness

The plan specifies `next-mdx-remote` without addressing the elephant in the room: this project runs **React 19** on **Next.js 15.5.9**. The original `next-mdx-remote` package (`hashicorp/next-mdx-remote`) has had compatibility issues with React Server Components and React 19. The actively maintained path forward is `next-mdx-remote/rsc` (the RSC-compatible export), which has a different API than the traditional `<MDXRemote>` component.

**What could go wrong:** Install the package, get peer dependency warnings or runtime crashes because `next-mdx-remote`'s hydration approach conflicts with React 19's streaming/RSC model. The plan shows `<MDXRemote>` usage which is the legacy client-side hydration API, not the RSC API.

**Fix:** The plan must specify:
1. Which exact version of `next-mdx-remote` to use (v5+ with `/rsc` export)
2. Use `import { MDXRemote } from 'next-mdx-remote/rsc'` (server-only, no hydration)
3. Verify this works with React 19 before committing to the approach — if it doesn't, the fallback is `@next/mdx` with a custom content layer, or compiling MDX to JSX at build time via a script

This is the single highest-risk item in the plan.

### B2. Middleware Public Route Pattern Mismatch

**Severity:** Blocking
**Category:** Correctness

The plan says "Add `/blog` to the public routes array" (Step 7). But the middleware uses **two different patterns** for public route matching:

1. **Exact match array** (`publicRoutes`): Uses `pathname === route` — only matches exact paths like `/about`, `/pricing`
2. **Prefix match** (`pathname.startsWith(...)`) — used for `/gallery/`, `/resources`, `/directory`

If `/blog` is added to the `publicRoutes` exact-match array, then `/blog` will be public but `/blog/madison-photographers-add-50-100` will **require authentication** and redirect to login. This is a silent, hard-to-debug failure — the index page works, individual posts don't.

**Fix:** The plan must specify adding a `startsWith` check, not an entry in the exact-match array:
```typescript
// Blog posts are public (SEO/GEO content)
if (pathname.startsWith('/blog')) {
  return res
}
```
Place it next to the existing `/resources` check on line 124-127.

### B3. CSP Will Block OG Images from Unknown Domains

**Severity:** Blocking
**Category:** Security / Correctness

The plan's frontmatter example specifies `ogImage: "/images/blog/madison-photographers-add-50-100.webp"` which is fine (self-hosted). But the `BlogPost` interface has `ogImage?: string` with no validation, and the `img-src` CSP directive only allows:

```
'self' https://images.unsplash.com https://*.supabase.co https://tile.openstreetmap.org https://via.placeholder.com data: blob:
```

If anyone later adds an OG image from an external domain, or if MDX content contains `<img>` tags pointing to external URLs, the CSP will block them silently. More critically, if the MDX content itself contains images (which blog posts typically do), those images must come from allowed CSP domains or be self-hosted.

**Fix:** The plan must:
1. Document that all blog images must be self-hosted in `/public/images/blog/` or come from allowed CSP domains (Unsplash, Supabase)
2. Add CSP domain guidance to the MDX frontmatter/content authoring notes
3. Consider whether the `next-mdx-remote` custom components map should override `<img>` with `<Image>` from `next/image` (which also requires `remotePatterns` in `next.config.ts`)

---

## Non-Blocking Concerns

### N1. Blog vs Resources: Architectural Fragmentation

**Category:** Consistency / Tech Debt

The codebase already has 9 resource pages at `/resources/*` that serve the same purpose as blog posts: long-form SEO/GEO content with Article schema, breadcrumbs, and CTAs. Now the plan adds a second content system at `/blog/` with MDX, a different data layer, and different rendering pipeline.

This creates two parallel systems for the same thing. Within 6 months, someone will ask "should this article be a resource page or a blog post?" and the answer will be arbitrary.

**Recommendation:** Acknowledge this in the plan. Either:
- (a) State that `/resources` will eventually migrate to the MDX system (making `/blog` the canonical content system), or
- (b) Draw a clear line: `/resources` = product comparison/evergreen, `/blog` = timely/niche/opinion content

This doesn't block implementation, but the decision should be documented.

### N2. `fs.readdirSync` in Blog Loader — Vercel Deployment Concern

**Category:** Correctness / Deployment

The plan says `blog.ts` uses `fs.readdirSync` to read from `content/blog/`. This works in development and during `next build`, but there's a subtlety: on Vercel, only files included in the build output are available at runtime. The `content/` directory is at the project root, outside `src/` and `public/`.

With `generateStaticParams()` + ISR (`revalidate: 3600`), the pages are built at deploy time — so the files ARE available during the build. But if ISR triggers a revalidation on the edge/serverless function, the `content/` directory may not be available in the serverless function's filesystem.

**Recommendation:** Either:
- (a) Set `export const dynamicParams = false` to prevent runtime generation of new slugs (only build-time slugs work), or
- (b) Move content into `src/content/blog/` so it's bundled with the app, or
- (c) Add `content/` to Vercel's `includeFiles` in `vercel.json`

This may work fine in practice (Next.js typically bundles files referenced in `getStaticProps`-equivalent code), but the plan should address it explicitly.

### N3. No Error Boundary / Not-Found Handling for Invalid Slugs

**Category:** Completeness

The plan mentions `getPostBySlug(slug: string): BlogPost | null` but doesn't specify what happens when a slug doesn't match any post. The `[slug]/page.tsx` needs to call `notFound()` from `next/navigation` when the post is null, and there should be a `not-found.tsx` in the blog directory (or rely on the root one).

Similarly, no `error.tsx` is specified for the blog routes, and the Next.js skill explicitly requires `loading.tsx` and `error.tsx` for every async page.

**Recommendation:** Add to the plan:
- `src/app/blog/[slug]/not-found.tsx` or explicit `notFound()` call
- `src/app/blog/error.tsx`
- (Optional) `src/app/blog/loading.tsx` — though for SSG this is less critical

### N4. Missing `dateModified` in Frontmatter

**Category:** SEO Completeness

The Article schema in the plan includes `dateModified` but the frontmatter only has `date`. For SEO, `dateModified` matters — Google uses it to assess content freshness. If a post is updated, there's no way to signal that without a separate `dateModified` field.

**Recommendation:** Add optional `updatedDate?: string` to the frontmatter schema and `BlogPost` interface. Default to `date` if not present.

---

## Checklist Review

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Completeness** | 7/10 | Missing error/not-found handling, no `dateModified`, no image authoring guidance |
| **Correctness** | 5/10 | React 19 compatibility unverified, middleware pattern wrong, CSP gap |
| **Consistency** | 7/10 | Follows existing patterns (schema, metadata) but creates parallel content system |
| **Simplicity** | 9/10 | Clean, minimal architecture — good scope control |
| **Edge Cases** | 6/10 | Invalid slugs, Vercel fs access, external images in MDX content |
| **Tech Debt** | 7/10 | Blog vs Resources fragmentation acknowledged but not addressed |
| **Security** | 7/10 | CSP gap for blog images; otherwise fine (no user input, no auth) |
| **Performance** | 8/10 | SSG + ISR is correct; missing image optimization guidance for MDX content |
| **Testing** | 4/10 | No testing strategy at all — Iron Law 1 violation |
| **User Philosophy** | 9/10 | Right approach, right scope, right tool choices |

---

## Testing Gap (Iron Law 1)

The plan has zero mention of tests. Per the Three Iron Laws: "NO CODE WITHOUT A FAILING TEST FIRST." At minimum, the plan should specify:

1. **Unit test for `blog.ts`**: `getAllPosts()` returns sorted posts, `getPostBySlug()` returns correct post or null, frontmatter validation catches missing required fields
2. **Integration test**: Blog index page renders without errors, individual post page renders MDX content
3. **SEO test**: Structured data output matches expected schema (can use snapshot testing)

---

## Summary: Top 3 Concerns

1. **`next-mdx-remote` + React 19 compatibility is unverified.** This could derail the entire approach. Verify before implementation.
2. **Middleware will block individual blog posts.** The `publicRoutes` array uses exact matching; `/blog` needs `startsWith` prefix matching like `/resources` has.
3. **No testing strategy.** Violates Iron Law 1. Add unit tests for the blog loader and integration tests for page rendering.
