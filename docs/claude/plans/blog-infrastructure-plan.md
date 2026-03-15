# Blog Infrastructure Plan

**Date:** 2026-03-14
**Task:** Build MDX blog system at `/blog` for SEO/GEO/AEO content
**Niche:** Madison, WI photography business finances and logistics

---

## Decision: MDX via `next-mdx-remote` + File-Based Content

**Why `next-mdx-remote` over `@next/mdx`:**
- `@next/mdx` compiles MDX at build time as part of the module graph — every post becomes a page route automatically, but you lose control over layout, metadata, and listing pages
- `next-mdx-remote` loads MDX content as data — you control the rendering pipeline, metadata, and can build index/listing pages easily
- Better for SEO: we generate metadata dynamically from frontmatter, not from the MDX file itself

**Why file-based over database:**
- Posts version-controlled in git (Nate can review diffs)
- No database dependency for content
- Easy to write in any editor
- Can migrate to CMS later without changing the rendering pipeline

---

## Architecture

```
photovault-hub/
├── content/
│   └── blog/
│       └── madison-photographers-add-50-100.mdx    ← Blog posts
├── src/
│   ├── app/
│   │   └── blog/
│   │       ├── page.tsx                             ← Blog index (list all posts)
│   │       └── [slug]/
│   │           └── page.tsx                         ← Individual post (SSG)
│   └── lib/
│       └── blog.ts                                  ← Post loader + types
```

---

## Files to Create

### 1. `src/lib/blog.ts` — Post Loader

**Purpose:** Read MDX files from `content/blog/`, parse frontmatter, return typed post data.

**Dependencies:** `next-mdx-remote`, `gray-matter` (frontmatter parsing), `reading-time`

**Exports:**
```typescript
interface BlogPost {
  slug: string
  title: string
  description: string
  date: string           // ISO date string
  author: string
  tags: string[]
  canonical: string
  ogImage?: string
  readingTime: string    // e.g., "8 min read"
  content: string        // Raw MDX content (for next-mdx-remote)
}

getAllPosts(): BlogPost[]           // Sorted by date desc
getPostBySlug(slug: string): BlogPost | null
getAllTags(): string[]
```

**Implementation:** Uses `fs.readdirSync` + `gray-matter` to parse frontmatter. Cached with `unstable_cache` or module-level cache since this runs at build/ISR time.

### 2. `src/app/blog/page.tsx` — Blog Index

**Purpose:** List all blog posts, SEO metadata, structured data.

**Metadata:**
```typescript
export const metadata: Metadata = {
  title: 'Madison Photography Business Blog | PhotoVault',
  description: 'Practical advice on photography business finances, pricing, permits, and logistics in Madison, Wisconsin.',
  alternates: {
    canonical: 'https://www.photovault.photo/blog',
  },
  openGraph: { type: 'website', ... },
}
```

**Structured Data:** `Blog` schema + `BreadcrumbList` (Home → Blog)

**UI:** Card grid with title, description, date, reading time, tags. Server Component — no client JS needed.

### 3. `src/app/blog/[slug]/page.tsx` — Post Page

**Purpose:** Render individual blog post with full SEO.

**Key patterns:**
- `generateStaticParams()` — pre-generate all post slugs at build time
- `generateMetadata()` — dynamic metadata from frontmatter
- Article + BreadcrumbList + FAQ schema (when post has FAQ section)
- `<MDXRemote>` renders the MDX content
- Author bio section at bottom with CTA to PhotoVault

**Static generation with ISR:**
```typescript
export const revalidate = 3600  // Revalidate every hour
```

### 4. `content/blog/madison-photographers-add-50-100.mdx` — First Post

**Source:** Convert the existing article from `Stone-Fence-Brain/VENTURES/PhotoVault/strategy/blog articles/`

**Frontmatter:**
```yaml
---
title: "How Madison Photographers Can Add $50–$100 to Every Shoot Without Clients Feeling Upsold"
description: "Learn how photographers in Madison, WI can add $50–$100 to every wedding and family session by upgrading their gallery delivery experience."
date: "2026-03-14"
author: "Nate Crowell"
tags: ["madison-photography", "pricing", "recurring-revenue", "wedding-photography"]
ogImage: "/images/blog/madison-photographers-add-50-100.webp"
---
```

Body: The existing markdown article content (already well-structured with headings, tables, etc.)

---

## Files to Modify

### 5. `src/app/sitemap.ts` — Add Blog Posts

Add blog posts to the existing sitemap generation:
```typescript
// Blog posts
const posts = getAllPosts()
const blogPages = posts.map(post => ({
  url: `${baseUrl}/blog/${post.slug}`,
  lastModified: new Date(post.date),
  changeFrequency: 'monthly' as const,
  priority: 0.7,
}))

// Blog index
{ url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 }
```

### 6. `public/robots.txt` — Already Allows `/blog`

No changes needed — `/blog` is not in the disallow list.

### 7. `src/middleware.ts` — Add `/blog` to Public Routes

Add `/blog` to the public routes array so it's accessible without auth.

### 8. `src/components/navigation.tsx` — Add Blog Link to Footer

Add "Blog" link to the footer's Resources section (both photographer and customer footers).

### 9. `src/app/layout.tsx` — Add `/blog` to Navigation Show List

Ensure Navigation and Footer are visible on `/blog` pages (not in the `hideOnPaths` array — they shouldn't be, but verify).

---

## Dependencies to Install

```bash
npm install next-mdx-remote gray-matter reading-time
```

- `next-mdx-remote` — MDX rendering without build-time compilation
- `gray-matter` — Parse YAML frontmatter from MDX files
- `reading-time` — Calculate "X min read" from content

**No `@next/mdx` needed** — we're using the remote/data approach.

---

## SEO Implementation Details

### Structured Data per Post (Article Schema)
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How Madison Photographers Can Add $50–$100...",
  "description": "...",
  "author": { "@type": "Person", "name": "Nate Crowell" },
  "publisher": { "@type": "Organization", "name": "PhotoVault LLC" },
  "datePublished": "2026-03-14",
  "dateModified": "2026-03-14",
  "mainEntityOfPage": "https://www.photovault.photo/blog/madison-photographers-add-50-100",
  "image": "...",
  "keywords": ["madison photography", "pricing", "recurring revenue"]
}
```

### Breadcrumb Schema
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "https://www.photovault.photo" },
    { "position": 2, "name": "Blog", "item": "https://www.photovault.photo/blog" },
    { "position": 3, "name": "How Madison Photographers Can Add $50–$100..." }
  ]
}
```

### RSS Feed (Optional — Phase 2)
Can add later via `src/app/blog/rss.xml/route.ts` API route. Not critical for launch.

---

## Implementation Order

1. Install dependencies
2. Create `src/lib/blog.ts` (post loader + types)
3. Create `content/blog/` directory + first post MDX file
4. Create `src/app/blog/[slug]/page.tsx` (post page with SSG + schema)
5. Create `src/app/blog/page.tsx` (index page)
6. Update `src/middleware.ts` (add `/blog` to public routes)
7. Update `src/app/sitemap.ts` (add blog posts)
8. Update `src/components/navigation.tsx` (footer links)
9. Verify: dev server renders blog index + post correctly
10. Verify: structured data validates in Google Rich Results Test format

---

## What This Does NOT Include (Out of Scope)

- RSS feed (Phase 2)
- Blog search (not needed with <10 posts)
- Comments system
- Newsletter signup (exists elsewhere)
- Social sharing buttons
- Related posts / tag pages (Phase 2)
- OG image generation (use static images for now)
- Database storage (file-based is sufficient)

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| MDX compilation errors at build time | `next-mdx-remote` compiles at request time, not build time — errors surface per-page |
| Large MDX files slow down SSG | `revalidate: 3600` means recompilation happens at most once per hour |
| Frontmatter schema drift | TypeScript types + validation in `blog.ts` loader |
| CSP blocks inline scripts | JSON-LD uses `dangerouslySetInnerHTML` which is already used in resource pages |
