# Plan Critique: Blog CMS — Supabase-Backed Blog with Admin Upload

**Plan Reviewed:** `docs/claude/plans/blog-cms-plan.md`
**Skill Reference:** QA Critic Expert (`Stone-Fence-Brain/INFRASTRUCTURE/claude-skills/qa-critic-expert.md`)
**Date:** 2026-03-15

## Summary Verdict

**APPROVE WITH CONCERNS**

The plan is thorough, well-structured, and covers all stated requirements. The database schema is sound, the API routes follow existing patterns, and the migration path is clear. However, there are a few concerns around RLS policy design, the auth verification pattern in API routes, and a missing revalidation strategy for the blog index page that should be addressed during implementation.

## Critical Issues (Must Fix)

1. **RLS admin policy uses `user_id` but `user_profiles` table uses `id` as the user column**
   - What's wrong: The RLS policy references `WHERE user_id = (SELECT auth.uid())`, but looking at the existing admin API route (`src/app/api/admin/users/route.ts`), it queries `user_profiles` with `.eq('id', user.id)` — suggesting the column is `id`, not `user_id`. The plan's RLS policy may reference a non-existent column.
   - Why it matters: The RLS policy will silently fail (return no rows), effectively locking out even admins from the table. This would make the entire feature broken.
   - Suggested fix: Verify the actual column name in `user_profiles` before applying the migration. The task prompt says the admin check pattern uses `user_id`, but the actual code uses `id`. Check the DB schema and use whichever is correct. If the table has both, clarify which is the FK to `auth.users`.

2. **Upload API route uses `createServerSupabaseClient` for insert, but admin RLS policy may not work with cookie-based client**
   - What's wrong: The upload route authenticates with the cookie-based client, then relies on the RLS `admin_all` policy for the INSERT. But the list route explicitly switches to `createServiceRoleClient` because "RLS public read policy only shows published posts." This inconsistency suggests the plan author isn't confident about whether RLS will work correctly for admin operations. If the admin check in RLS fails (see issue #1), the insert will fail silently.
   - Why it matters: Silent insert failures are the worst kind of bug — the API might return a 500 with a confusing Postgres error, and debugging RLS issues is notoriously painful.
   - Suggested fix: Be consistent. Either (a) use `createServiceRoleClient` for all admin mutations after verifying admin status in application code, or (b) verify the RLS policy works with the cookie-based client and use it everywhere. Option (a) is safer and matches the existing codebase pattern where admin routes use `createServerSupabaseClient()` from the deprecated `@/lib/supabase.ts` which is actually the service role client.

## Concerns (Should Address)

1. **No `revalidate` export on the blog index page (`/blog`)**
   - What's wrong: The plan mentions `revalidate = 60` for the blog post page but the blog index page changes section (4.5) only shows making `getAllPosts()` async. There's no `export const revalidate = 60` added to `blog/page.tsx`.
   - Why it matters: Without an explicit revalidate, Next.js 15 defaults to no caching for dynamic pages. The blog index would be re-rendered on every request, which is fine for correctness but means no edge caching for the most-visited blog page.
   - Suggested fix: Add `export const revalidate = 60` to `blog/page.tsx` as well.

2. **No admin navigation link to the new blog page**
   - What's wrong: The plan creates `src/app/admin/blog/page.tsx` but doesn't mention adding a link to it in the admin navigation/sidebar. Admins won't know it exists unless they manually type `/admin/blog`.
   - Why it matters: Discoverability. The admin will ask "where is it?" and then we'll need another change.
   - Suggested fix: Identify where the admin navigation lives (likely a layout or sidebar component) and add a "Blog" link. This is a small change but should be in the plan.

3. **The `parseMarkdownUpload` slug generation is lossy**
   - What's wrong: The slug generation strips everything except `[a-z0-9-]`. A filename like `How Madison Photographers Can Add $50.md` would become `how-madison-photographers-can-add--50` (with double hyphens after stripping `$`). The regex does handle consecutive hyphens, but the example filename `madison-photographers-add-50-100.mdx` contains a character (`–` em dash in the title) that might not survive.
   - Why it matters: Slug mismatches break URLs and SEO. The existing article's slug is `madison-photographers-add-50-100` and the filename matches, so it'll work. But future uploads could produce unexpected slugs.
   - Suggested fix: Log or return the generated slug in the API response so the admin can see what URL will be generated. Consider adding a slug override field in Phase 2.

4. **No `updated_at` trigger on the table means the `update_blog_posts_updated_at` function could conflict**
   - What's wrong: The plan creates the trigger function `update_blog_posts_updated_at` which is fine, but doesn't check if a similar function already exists. In Supabase projects, there's sometimes a shared `moddatetime` extension or a generic trigger.
   - Why it matters: Low risk, but worth noting — if the function name collides with something existing, the migration fails.
   - Suggested fix: Use `CREATE OR REPLACE FUNCTION` (already done, good) and name it specifically to this table (already done). This concern is minor.

5. **No file size validation on the client side**
   - What's wrong: The server validates 500KB max, but the client-side upload has no size check. A large file will be fully uploaded before being rejected.
   - Why it matters: Poor UX — the admin uploads a 10MB file, waits for it to transfer, then gets an error.
   - Suggested fix: Add a client-side file size check before submitting. Simple `if (file.size > 512_000)` check with a toast error.

## Minor Notes (Consider)

- The `blog_posts` table has no `word_count` column. Reading time is stored but word count could be useful for analytics. Low priority — can add later.
- The admin page doesn't have a "preview" feature for draft posts. For Phase 1 this is acceptable since the admin can publish, check, and unpublish. But it's a natural Phase 2 addition.
- The plan deletes `src/content/blog/` after migration. Consider keeping it for one deploy cycle as a fallback, then removing in a follow-up commit.
- The `og_image` field has no validation. A malformed URL could break Open Graph tags. Acceptable for Phase 1 since only the admin uploads.
- Tags are stored as `TEXT[]` which is good for PostgreSQL but means the Supabase client returns them as a JavaScript array automatically. Worth a quick verification that the Supabase JS client handles Postgres arrays correctly (it does, but good to confirm).

## Questions for the User

1. **Slug source:** Should the slug come from the filename (current plan) or from a frontmatter field like `slug:`? Using the filename is simpler but gives the admin less control. The existing MDX article uses the filename as the slug.

2. **Image hosting:** The plan explicitly defers image uploads. For the existing article, are there any images that need to be served? If so, where are they currently hosted?

3. **Admin navigation:** Where is the admin sidebar/nav defined? The plan needs to know so it can add the Blog link.

4. **On-demand revalidation:** Would you prefer adding `revalidatePath` calls now (2 extra lines per route) for instant cache invalidation, or is the 60-second ISR acceptable for Phase 1?

## What the Plan Gets Right

- **Comprehensive database schema** with proper RLS, indexes (including GIN for tags), and an `updated_at` trigger. This is production-grade.
- **Preserves the existing BlogPost interface** — the `rowToPost` mapping function means no changes needed to the blog frontend rendering logic.
- **Status field with draft/published** — good foresight. Many blog implementations skip this and regret it.
- **Phase 2 sketch is well-scoped** — the `submitted_by`, `reviewed_by`, and `review_notes` columns are the right additions. The photographer RLS policy correctly restricts inserts to drafts only.
- **Follows existing admin page patterns** — `'use client'`, `AccessGuard`, shadcn/ui components, API route fetching. This will feel consistent with the rest of the admin dashboard.
- **Gotchas section is genuinely useful** — calling out `dynamicParams = false` removal, MDXRemote compatibility, and the auth pattern inconsistency shows real awareness of what breaks during migration.
- **Testing checklist is thorough** — 16 manual test cases covering the happy path, error cases, auth, SEO, and the migration itself.

## Recommendation

Proceed with implementation after addressing:

1. **Verify the `user_profiles` column name** used in the RLS policy (`id` vs `user_id`) — this is a deployment-breaking issue if wrong
2. **Standardize on `createServiceRoleClient` for admin API mutations** after verifying admin status in application code — simpler and more predictable than relying on RLS for admin operations
3. **Add `revalidate = 60` to `blog/page.tsx`** — one-line addition, don't forget it
4. **Add admin nav link** — identify the sidebar component and add "Blog" entry

Everything else can be addressed during implementation or deferred to Phase 2.
