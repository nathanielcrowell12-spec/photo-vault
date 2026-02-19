# Plan Critique: Email Drip Campaign

**Plan Reviewed:** email-drip-campaign-plan.md
**Date:** 2026-02-19

## Summary Verdict
**APPROVE WITH CONCERNS**

The plan is well-structured, the email copy is strong, and the technical approach (Supabase tables + Vercel cron) is consistent with the existing codebase. However, there are several correctness issues with URL paths, a security gap in the cron authorization pattern, a CAN-SPAM compliance hole in unsubscribe handling, and some edge cases around double-sends and race conditions that must be addressed before implementation.

---

## Critical Issues (Must Fix)

### 1. Inconsistent URL Paths in Email CTAs

The plan's URL reference table (line 406-416) claims "All paths exist. No new pages needed." This is partially wrong.

**Problem:** The codebase has TWO separate route prefixes for photographer pages:
- `/photographer/` -- for authenticated photographer tools (dashboard, upload, galleries, clients, support)
- `/photographers/` -- for public-facing or settings pages (signup, settings, subscription, onboarding, analytics, invite)

The plan's Email 2 (Day 3) uses `/photographer/upload` and Email 3 (Day 7) uses `/photographer/dashboard`. These happen to be correct based on the actual file structure at `src/app/photographer/upload/page.tsx` and `src/app/photographer/dashboard/page.tsx`. However, the plan claims `/photographers/settings` for the Stripe Connect link (Email 1). Verified: `src/app/photographers/settings/page.tsx` exists. So that is correct too.

**Actual issue:** The plan lists these URLs as "verified" but never explains the dual-prefix convention. During implementation, a developer could easily mix these up. The plan should explicitly document the routing convention:
- `/photographer/*` = authenticated workspace routes
- `/photographers/*` = public/settings routes

**Fix:** Add a note to the implementation section explaining this naming convention and confirming each path was verified against the `src/app/` directory structure.

### 2. Cron Job Authorization Is Inconsistent With Existing Pattern

The plan proposes the cron route at `/api/cron/drip-emails` but does not specify the authorization pattern. The existing cron jobs use TWO different auth patterns:

- `grace-period-notifications/route.ts` (line 33-40): Checks **both** `x-vercel-cron` header AND `Bearer ${CRON_SECRET}`, allowing either.
- `deactivate-clients/route.ts` (line 19): Only checks `Bearer ${CRON_SECRET}`, does NOT accept `x-vercel-cron`.

The middleware at `src/middleware.ts` line 82-83 already allows `/api/cron` routes through without auth. This means the cron endpoint is publicly accessible at the HTTP level -- only the route-level auth check prevents abuse.

**Risk:** If the drip email cron handler omits the auth check (or implements it inconsistently), anyone who discovers the URL can trigger mass email sends.

**Fix:** The plan must specify: "Use the `grace-period-notifications` auth pattern (accept both `x-vercel-cron` header and `Bearer CRON_SECRET`). Add `export const maxDuration = 60` for Vercel function timeout. Include `export const dynamic = 'force-dynamic'`."

### 3. No Retry Cap or Dead Letter Handling in Cron Job

The plan says (line 396): "If send fails: update status to 'failed', log error, retry on next run (max 3 retries)."

**Problem:** The schema does not include a `retry_count` column on `drip_emails`. Without it, there is no way to track retries or enforce the "max 3" limit. The cron job would either retry infinitely (if it queries all `status = 'failed'`) or never retry (if it only queries `status = 'pending'`).

**Fix:** Add `retry_count INT DEFAULT 0` to the `drip_emails` table. The cron query should be: `WHERE (status = 'pending' OR (status = 'failed' AND retry_count < 3)) AND scheduled_for <= now()`. After 3 failures, set status to `'dead'` so it stops being picked up.

### 4. CAN-SPAM Unsubscribe Compliance Is Incomplete

The plan mentions unsubscribe links (line 399-404) but the implementation is insufficient for CAN-SPAM/GDPR compliance:

**Missing requirements:**
- **One-click unsubscribe:** CAN-SPAM requires a mechanism that works without the user logging in. The plan does not specify how the unsubscribe link works. If it requires authentication, users who forgot their password cannot unsubscribe.
- **List-Unsubscribe header:** Modern email clients (Gmail, Apple Mail) show an "unsubscribe" button in the UI. This requires `List-Unsubscribe` and `List-Unsubscribe-Post` headers on the email. Resend supports these.
- **Unsubscribe page:** Need a simple `/unsubscribe?token=xxx` page that works without login.
- **Unsubscribe token:** Need a signed/hashed token so users cannot unsubscribe other people.

**Fix:** Add an `unsubscribe_token` column to `drip_sequences` (UUID, generated on enrollment). Create a `/api/email/unsubscribe?token=xxx` endpoint. Add `List-Unsubscribe` headers to all drip emails. Create a minimal `/unsubscribe` confirmation page.

### 5. From Address Contradiction on Day 14 Founder Email

The plan explicitly calls this out in Risks (line 448) but does not resolve it. The `FROM_EMAIL` in `resend.ts` is `PhotoVault <noreply@photovault.photo>`. The Day 14 email says "reply to this email. I read every one."

**This is a contradiction that will cause real user frustration.** People will reply, get a bounce, and feel lied to.

**Fix:** Either:
- (a) Use a different `from` address for the Day 14 email only: `Nate from PhotoVault <nate@photovault.photo>`. This requires the `nate@` address to be verified in Resend.
- (b) Add a `reply-to` header: keep `from` as `noreply@` but set `reply-to: nate@photovault.photo`. Resend supports the `replyTo` parameter.
- (c) Remove the "reply to this email" language and replace with a link to a feedback form.

Option (b) is cheapest and most correct. The `EmailService` method for the Day 14 email should pass `replyTo: 'nate@photovault.photo'` to the Resend `send()` call.

---

## Concerns (Should Address)

### 6. Race Condition: Double Enrollment

The enrollment trigger fires after `sendPhotographerWelcomeEmail` (line 379). If the signup flow is slow or the user refreshes, the welcome email route could be called twice. Nothing in the plan prevents creating duplicate `drip_sequences` records for the same user.

**Fix:** Add a unique constraint: `UNIQUE(user_id, sequence_name)` on `drip_sequences`. The enrollment function should use `INSERT ... ON CONFLICT DO NOTHING`.

### 7. Race Condition: Cron Job Overlapping Executions

If the cron job runs hourly and a previous execution takes longer than expected (Vercel cold start + slow Supabase queries + slow Resend API calls for many emails), two cron invocations could overlap and both pick up the same pending emails, causing double-sends.

**Fix:** Use a SELECT ... FOR UPDATE SKIP LOCKED pattern, or update status to `'sending'` before actually sending, then update to `'sent'` after. The query becomes: pick up `status = 'pending'`, immediately update to `'sending'`, then process. If the function crashes mid-execution, a separate cleanup query can reset `'sending'` records older than 10 minutes back to `'pending'`.

### 8. Missing Indexes on drip_emails Table

The cron job will query `drip_emails WHERE status = 'pending' AND scheduled_for <= now()` every hour. Without an index, this becomes a full table scan as the table grows.

**Fix:** Add a composite index: `CREATE INDEX idx_drip_emails_pending_scheduled ON drip_emails(status, scheduled_for) WHERE status = 'pending';` This is a partial index that only includes pending rows, keeping it small.

### 9. Vercel Cron Limitations

The plan proposes running the cron hourly (`0 * * * *`). Important constraints to document:

- **Vercel Hobby plan:** Only 2 cron jobs allowed, daily frequency max. The project currently has 2 crons in `vercel.json`. Adding a third requires the Pro plan.
- **Vercel Pro plan:** Up to 40 cron jobs, minimum 1-minute frequency. Hourly is fine.
- **Function timeout:** Pro plan allows up to 300 seconds (5 min). The plan should set `maxDuration = 300` for the drip cron since it could process many emails.
- **Cold starts:** Vercel serverless functions have cold start times of 1-3 seconds. Not an issue for hourly execution, but means emails scheduled for exactly the top of the hour may send 1-5 seconds late. This is acceptable for drip emails.

**Fix:** Confirm the project is on Pro plan, or document that this feature requires Pro. Update `vercel.json` to include the new cron entry.

### 10. Email Copy References Pricing That May Be Inaccurate

The Day 3 email (line 93-97) lists three pricing options:
- `$100 upfront (12 months) -- you keep $50`
- `$50 upfront (6 months) -- you keep $25`
- `$8/month -- you keep $4/month ongoing`

Verified against `src/lib/payment-models.ts`: there are actually FOUR payment options:
1. `year_package` -- $100 upfront
2. `six_month_package` -- $50 upfront
3. `six_month_trial` -- $20 one-time (6 months, no renewal)
4. `shoot_only` -- pricing varies

The email omits the $20 six-month trial and the shoot-only option. This is probably intentional (keep it simple), but the photographer will discover these options in the dashboard and wonder why the email was incomplete.

**Fix:** Either list all options or add a line like "See all pricing options in your dashboard" to acknowledge there are more choices.

### 11. No RLS Policies Mentioned

The plan creates two new tables (`drip_sequences`, `drip_emails`) but does not mention Row Level Security policies. The existing codebase uses Supabase with RLS. If RLS is enabled at the database level by default (which it typically is for Supabase projects), these tables will be inaccessible unless policies are created.

The cron job uses `createServiceRoleClient()` which bypasses RLS. So the cron will work. But if any other code (client-side, middleware, API routes using the anon client) needs to read these tables, it will fail silently.

**Fix:** Add RLS policies to the migration:
```sql
ALTER TABLE drip_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_emails ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by cron job)
-- No user-facing policies needed unless we build an unsubscribe UI that queries these tables
-- In that case, add: users can read/update their own drip_sequences
CREATE POLICY "Users can view own drip sequences" ON drip_sequences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own drip sequences" ON drip_sequences
  FOR UPDATE USING (auth.uid() = user_id);
```

### 12. Supabase Client Inconsistency

The existing cron jobs use different Supabase client creation patterns:
- `grace-period-notifications` uses `createServiceRoleClient()` from `@/lib/supabase-server`
- `deactivate-clients` uses `createServerSupabaseClient()` from `@/lib/supabase`

The drip cron must use `createServiceRoleClient()` because it needs to bypass RLS and query across all users. The plan does not specify which client to use.

**Fix:** Explicitly state: "Use `createServiceRoleClient()` from `@/lib/supabase-server`. Do NOT use the anon client."

---

## Minor Notes (Consider)

### 13. Template File Naming Convention

Existing templates follow the pattern: `templates.ts`, `critical-templates.ts`, `revenue-templates.ts`, `engagement-templates.ts`, `family-templates.ts`. The plan proposes `drip-templates.ts`. This is consistent with the naming convention. No issue.

### 14. Day 14 Email Includes Beta Code in Plain Text

The Day 14 email (line 173) includes: "use beta code PHOTOVAULT_BETA_2026 for 12 months free." Once the platform exits beta, every photographer who received this email still has the code in their inbox and can share it. The plan acknowledges this in Risks (line 446) but does not propose a solution.

**Suggestion:** Make the beta code a template variable (`{{betaCode}}`) pulled from an environment variable. When beta ends, set the env var to empty and the template should conditionally omit that paragraph.

### 15. Photographer Day 3 Send Condition Queries Wrong Column

The plan says (line 352): "Query `photo_galleries` table for count where `photographer_id = user.id`. Skip if count > 0."

Verified: `photo_galleries` has a `photographer_id` column. However, the drip sequence stores `user_id` (from `auth.users`). Is the photographer's `user_id` the same as their `photographer_id` in the galleries table? This depends on the data model. If `photographer_id` in `photo_galleries` refers to the `photographers` table (not `auth.users`), then the query needs a join through the `photographers` table to get from `user_id` to `photographer_id`.

**Fix:** Verify the join path. If `photo_galleries.photographer_id` maps to `auth.users.id`, the query is correct. If it maps to a `photographers.id` column, the cron needs to join through `photographers WHERE user_id = drip_sequences.user_id`.

### 16. No Batch Size Limit on Cron Job

If 500 photographers sign up in one day (launch day, ProductHunt feature, etc.), the next cron run could try to send 500 emails in a single function invocation. Resend has rate limits (varies by plan). The cron should process emails in batches with a configurable limit (e.g., 100 per run) and use sequential sending with small delays between calls.

### 17. Missing `updated_at` Trigger on drip_sequences

The `drip_sequences` table has `updated_at TIMESTAMPTZ DEFAULT now()` but no trigger to auto-update it. The application code would need to manually set `updated_at` on every update, which is error-prone.

**Suggestion:** Add a Postgres trigger: `CREATE TRIGGER update_drip_sequences_updated_at BEFORE UPDATE ON drip_sequences FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);` (assuming the `moddatetime` extension is enabled, which is standard in Supabase).

---

## Questions for the User

1. **Vercel Plan:** Is the project on Vercel Pro? The current `vercel.json` has 2 cron jobs. Hobby plans only allow 2. Adding the drip cron requires Pro.

2. **Reply handling:** For the Day 14 founder email, do you actually want to receive replies? If yes, what email address should receive them? Do you have `nate@photovault.photo` set up?

3. **Beta code lifecycle:** When do you plan to end the beta? Should we build the conditional beta code logic now, or is it acceptable to hard-code `PHOTOVAULT_BETA_2026` and update templates manually later?

4. **Photographer ID mapping:** Does `photo_galleries.photographer_id` reference `auth.users.id` directly, or does it reference a separate `photographers` table? This affects the Day 3 send condition query.

5. **Metrics tracking:** The plan lists target open rates and CTR. How do you want to track these? Resend provides webhook events for opens/clicks. Do you want a `drip_email_events` table, or is checking the Resend dashboard sufficient for now?

6. **Email frequency preference:** The Sequence 2 (client) overview says "No suppression -- all emails are informational and should always send." But what if a client buys access to a second gallery before the first drip sequence finishes? Should they get a second parallel sequence, or should the first one be cancelled/restarted?

---

## What the Plan Gets Right

1. **Email copy quality is high.** The tone is direct, not salesy. The subject lines are specific and create genuine curiosity (especially "Your clients can't pay you yet" and "The hard drive question nobody asks"). No cringe detected.

2. **Smart suppression logic.** Skipping emails when the action is already completed is the right call. It prevents the annoying "reminder for something I already did" experience.

3. **Progress-based dynamic content.** The Day 7 and Day 14 emails customize the opening based on what the photographer has/hasn't done. This is significantly more work to build but dramatically more effective.

4. **Correct technical choice.** Supabase table + Vercel cron is the right approach for this stage. It avoids adding a third-party dependency (Customer.io, Loops) and keeps the infrastructure simple. The existing cron pattern is proven.

5. **Accurate commission math in the Day 7 email.** The compound growth example is correct and compelling. It matches the pricing in `src/lib/stripe.ts` and `src/lib/payment-models.ts`.

6. **Good priority ordering.** Starting with the Stripe Connect nudge (Day 1) is correct -- it is the highest-friction, highest-impact step in the photographer funnel.

7. **Template file structure follows existing conventions.** Putting drip templates in a separate file (`drip-templates.ts`) with paired HTML/Text functions matches the established pattern.

---

## Recommendation

**Approve with the following required changes before implementation:**

1. Add `retry_count` column to `drip_emails` schema
2. Add `unsubscribe_token` column to `drip_sequences` schema
3. Add unique constraint `UNIQUE(user_id, sequence_name)` on `drip_sequences`
4. Add composite partial index on `drip_emails(status, scheduled_for)`
5. Add RLS policies for both tables
6. Specify the cron auth pattern (match `grace-period-notifications`)
7. Specify `createServiceRoleClient()` for Supabase access
8. Resolve the `noreply@` / "reply to this email" contradiction (use `replyTo` header)
9. Add a `status = 'sending'` intermediate state to prevent double-sends
10. Confirm Vercel plan supports a third cron job

These are all schema/design changes, not rewrites. The core plan is sound. Estimated additional effort for these fixes: 2-3 hours on top of the existing estimate.
