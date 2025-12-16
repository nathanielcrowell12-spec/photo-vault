# Plan Critique: Customer Intelligence System

**Plan Reviewed:** cis-customer-intelligence-system-plan.md
**Skill References:** supabase-skill.md, nextjs-skill.md, shadcn-skill.md
**Date:** December 13, 2025

## Summary Verdict

**APPROVE WITH CONCERNS**

The plan demonstrates solid understanding of the CIS specification and breaks work into logical phases. Story structure is BMAD-compatible with clear acceptance criteria. However, there are several technical implementation gaps, missing error handling patterns, and incomplete RLS policy considerations that must be addressed during implementation. The plan also lacks specificity on server-side vs client-side tracking decisions which could lead to data loss from ad blockers.

## Critical Issues (Must Fix)

### 1. **Server-Side Tracking Not Specified for Critical Events**
   - **What's wrong:** Plan mentions "server-side tracking for critical events" but doesn't specify WHICH events require server-side tracking vs client-side. Only payment events are explicitly marked server-side in Story 6.2.
   - **Why it matters:** Ad blockers will block client-side PostHog events. Critical funnel events (signup, payment, churn) MUST use server-side tracking or data will be incomplete. This undermines the entire CIS purpose.
   - **Suggested fix:**
     - Story 6.1: Add explicit server-side analytics module using `posthog-node`
     - Story 6.2: Mark these as REQUIRED server-side: `photographer_signed_up`, `payment_completed`, `payment_failed`, `photographer_churned`, `client_churned`, `photographer_connected_stripe`
     - Create `src/lib/analytics-server.ts` alongside `src/lib/analytics.ts`

### 2. **RLS Policies Missing for Critical Tables**
   - **What's wrong:** Story 6.4 defines database schema but RLS policies are incomplete. The `daily_metrics` and `user_health_scores` tables allow system inserts via `WITH CHECK (TRUE)` but no policy restricts WHO can use service role.
   - **Why it matters:** This is a security vulnerability. Any API route with service role key could write fake metrics. Supabase-skill.md emphasizes "RLS is non-negotiable" and "security at database layer first."
   - **Suggested fix:**
     ```sql
     -- Daily metrics should ONLY be insertable by cron jobs
     CREATE POLICY "System can insert daily metrics" ON daily_metrics
       FOR INSERT WITH CHECK (
         auth.jwt() ->> 'role' = 'service_role' -- Only service role
       );

     -- Better: Use database functions with SECURITY DEFINER
     CREATE FUNCTION calculate_daily_metrics() RETURNS void
       LANGUAGE plpgsql SECURITY DEFINER
       AS $$ ... $$;
     ```

### 3. **Error Tracking Events Have No Fallback for PostHog Failures**
   - **What's wrong:** Story 6.3 tracks `error_encountered` events via PostHog, but what if PostHog itself fails? You'd lose all error tracking during an outage.
   - **Why it matters:** Error spikes are critical alerts (Story 6.8). If PostHog is down when errors spike, you won't know there's a problem until users complain.
   - **Suggested fix:**
     - Add `error_logs` table in Supabase as fallback
     - Track to BOTH PostHog and database
     - Dashboard reads from PostHog primarily, falls back to database if PostHog API fails

### 4. **Survey Trigger Logic Location Unclear**
   - **What's wrong:** Story 6.5 says "Add survey trigger logic" but doesn't specify WHERE this logic runs. Client-side? Server-side? API route? This affects reliability and testability.
   - **Why it matters:** If surveys trigger client-side, users can skip them by closing tabs. If server-side, you need webhook/cron infrastructure. The plan doesn't commit to either approach.
   - **Suggested fix:**
     - **Post-onboarding:** Server action in `photographer_completed_onboarding` event → writes to `pending_surveys` table → client polls and displays
     - **Post-payment:** Stripe webhook creates pending survey → client dashboard checks on load
     - **Churn:** Inline in cancellation flow (must be synchronous)
     - Add `pending_surveys` table with `user_id`, `survey_type`, `trigger_at`, `shown_at`, `completed_at`

## Concerns (Should Address)

### 1. **Phase 1 Must Be Completed Before Beta, But No Time Estimate Validation**
   - **What's wrong:** User requires Phase 1 (Stories 6.1-6.3) before beta launch. Plan estimates "~4 days" but this is Claude's guess, not validated against PhotoVault complexity.
   - **Why it matters:** If this takes 2 weeks instead of 4 days, beta launch is blocked longer than user expects.
   - **Suggested fix:** Break down actual implementation time:
     - Story 6.1: 4-6 hours (PostHog setup is straightforward)
     - Story 6.2: 2-3 days (20+ events to instrument across many files)
     - Story 6.3: 1 day (abandonment tracking requires page unload hooks)
     - **Realistic total: 5-7 days, not 4**

### 2. **Dashboard Performance Not Addressed**
   - **What's wrong:** Story 6.7 mentions "Dashboard loads in <3 seconds" as acceptance criteria, but no discussion of HOW to achieve this with potentially millions of events.
   - **Why it matters:** Calculating funnels from raw events is slow. PostHog API can timeout. This will break in production.
   - **Suggested fix:**
     - Use `daily_metrics` table for pre-aggregated stats (already in schema)
     - Add cron job (Story 6.8) to calculate daily: `activation_rate`, `avg_time_to_value`, `funnel_conversion_rates`
     - Dashboard reads from `daily_metrics` (instant), not raw events (slow)
     - Include this in Story 6.7 tasks

### 3. **Event Property Standards Not Enforced**
   - **What's wrong:** Plan defines property standards (ISO timestamps, UUIDs, etc.) but doesn't specify HOW to enforce them. No validation, no TypeScript types.
   - **Why it matters:** Inconsistent event properties break analytics. If one event sends `gallery_id` and another sends `galleryId`, PostHog won't group them.
   - **Suggested fix:**
     - Create `src/types/analytics.ts` with strict event schemas:
       ```typescript
       export type PhotographerSignedUpEvent = {
         event: 'photographer_signed_up'
         properties: {
           signup_method: 'email' | 'google' | 'apple'
           referral_source?: string
           timestamp: string // ISO 8601
         }
       }
       ```
     - Wrapper function validates schema before sending

### 4. **Survey Fatigue Not Quantified**
   - **What's wrong:** Plan says "strict frequency limits, allow skip" but doesn't define what "strict" means.
   - **Why it matters:** Too many surveys → users ignore them. Too few → not enough data. Need concrete rules.
   - **Suggested fix:**
     - Max 1 survey per user per 30 days (except churn)
     - Max 2 skips before survey never shows again
     - NPS survey: once every 90 days, not within 14 days of another survey
     - Store `last_survey_shown_at` in `user_profiles`

### 5. **PostHog Free Tier Limits Not Evaluated**
   - **What's wrong:** Open question "Free tier (1M events/month) or paid?" but no analysis of expected volume.
   - **Why it matters:** If PhotoVault gets 100 beta photographers × 50 events/day × 30 days = 150K events/month. Plus clients. Could hit limit fast.
   - **Suggested fix:**
     - Calculate: (photographers × avg_events_per_day + clients × avg_events_per_day) × 30
     - With 100 photographers, 300 clients, ~30 events/day each → 360K events/month
     - Free tier sufficient for beta, but grows 10x at scale
     - Recommendation: Start free, set alert at 800K events/month

## Minor Notes (Consider)

- Story 6.2 lists 20+ events to implement but doesn't prioritize. Recommend starting with funnel events (signup → payment) before engagement events (photo_favorited).
- Micro-feedback sampling (25%) in Story 6.6 is good, but no discussion of A/B testing different sample rates.
- Alert thresholds in Story 6.8 are somewhat arbitrary. May need tuning after first month of data.
- No discussion of GDPR/privacy compliance. Should users be able to opt out? Delete their analytics data?
- Dashboard layout in Story 6.7 uses emoji status indicators (🟢🟡🔴) - will these be actual emojis or colored badges? Accessibility concern for colorblind users.

## Questions for the User

1. **Server-side tracking infrastructure:** Do you already have `posthog-node` set up, or is this new? If new, where should server-side tracking live (API routes? Server actions? Webhook handlers?)?

2. **Email alerts for critical events:** Story 6.8 makes email alerts optional. Do you want to be emailed when activation rate drops below 40%, or only check dashboard manually?

3. **PostHog session recording:** The plan enables session recording in Story 6.1. Are you comfortable recording user sessions (privacy implications)? This is valuable for debugging but some users find it invasive.

4. **Timeline pressure:** Phase 1 must complete before beta. If it takes 7 days instead of 4, does that change beta launch timing?

5. **Survey response incentives:** Original spec doesn't mention incentives. Should users get anything for completing surveys (e.g., "Thanks, here's a free month")?

## What the Plan Gets Right

- **Phased approach is smart:** Blocking beta on Phase 1 only (event tracking) means you can iterate on surveys/dashboard post-launch.
- **BMAD story structure is excellent:** Each story is one context window with clear tasks and acceptance criteria. Easy to execute.
- **Event taxonomy is comprehensive:** Covers full funnel from signup to churn. The friction/warning events are especially valuable.
- **Feedback collection is well-designed:** Post-onboarding, post-payment, and churn surveys hit key moments. Micro-feedback is unobtrusive.
- **Dashboard mockup is clear:** ASCII layout communicates what the final dashboard should look like.
- **Risk assessment is realistic:** Acknowledges ad blockers, survey fatigue, and data actionability concerns.
- **Integration with existing admin dashboard:** Leverages existing `admin-revenue-service` rather than rebuilding revenue metrics from scratch.

## Recommendation

**PROCEED with implementation AFTER addressing Critical Issues 1-4.**

### Before Story 6.1:
- [ ] Decide: client-side only, server-side only, or hybrid tracking?
- [ ] If hybrid: Create `src/lib/analytics-server.ts` module in Story 6.1
- [ ] Add `error_logs` table to Story 6.4 schema (fallback for error tracking)

### Before Story 6.2:
- [ ] Create `src/types/analytics.ts` with strict event schemas
- [ ] Prioritize event list: Core funnel events first (8 events), engagement events second (12 events)

### Before Story 6.4:
- [ ] Fix RLS policies: Remove `WITH CHECK (TRUE)`, use `SECURITY DEFINER` functions
- [ ] Add `pending_surveys` table to schema

### Before Story 6.5:
- [ ] Specify survey trigger architecture (server action → table → client poll)

### Before Story 6.7:
- [ ] Add task: "Implement daily metrics cron job for dashboard performance"
- [ ] Change acceptance criteria: "Dashboard loads in <3s using pre-aggregated daily_metrics"

### Implementation Priority:
1. Fix RLS policies (30 minutes)
2. Add server-side tracking module (2 hours)
3. Create event type definitions (1 hour)
4. Then proceed with Story 6.1 as planned

**The plan is fundamentally sound but needs these technical details locked down before writing code.** With these fixes, this will be a production-ready Customer Intelligence System that actually delivers on the "data-driven development" goal.
