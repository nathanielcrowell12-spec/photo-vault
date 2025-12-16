# Customer Intelligence System (CIS) - Implementation Plan

**Created:** December 13, 2025
**Domain:** Analytics / PostHog / Supabase / Next.js / UI
**Status:** REVISED - QA Critique Issues Addressed
**Estimated Effort:** 2-3 weeks (8-10 stories)
**Phase 1 Estimate:** 5-7 days (revised from 4 days per QA critique)

---

## Executive Summary

This plan structures the Customer Intelligence System specification into BMAD-compatible stories for the PhotoVault work plan. The CIS transforms PhotoVault from assumption-driven to data-driven development.

**Core Deliverables:**
1. PostHog analytics integration with event tracking
2. Survey and feedback collection system
3. Founder-facing intelligence dashboard
4. Advanced analytics (cohort analysis, churn prediction)

**User Requirement:** CIS Phase 1 (PostHog + Event Tracking) MUST be part of beta launch so beta tester behavior can be analyzed from day one to inform Phase 2+ development.

---

## Where This Fits in the Work Plan

### Recommended Approach: Insert Phase 1 Before Beta Launch

**Reasoning (from user):** "By analyzing beta testers' use, we can build Phase 2 more effectively."

This means:
- **CIS Phase 1 (Stories 6.1-6.3):** Must complete BEFORE inviting beta testers
- **CIS Phase 2-3 (Stories 6.4-6.8):** Can run parallel to beta stabilization
- **CIS Phase 4 (Stories 6.9-6.10):** After beta, when data volume exists

### Revised Work Plan Integration

**Current Phase 1 MVP Status:** 72.5% complete (14.5/20 stories)
- Epic 2: Story 2.4 at 50% (Admin Dashboard)
- Epic 4: Not started (Onboarding Polish)
- Epic 5: Not started (Beta Launch Prep)

**Proposed Insertion Point:**

```
Epic 2.4 (finish admin dashboard) - IN PROGRESS
    ↓
Epic 4: Onboarding Polish (3 stories) - OR SKIP FOR BETA
    ↓
★ NEW ★ Epic 6: Customer Intelligence System Phase 1 (3 stories) - BLOCKING BETA
    ↓
Epic 5: Beta Launch Prep (3 stories)
    ↓
🚀 BETA LAUNCH
    ↓
Epic 6 continued: CIS Phases 2-4 (5-7 stories) - POST-BETA
```

**Alternative (Faster to Beta):**

```
Epic 2.4 (finish admin dashboard) - IN PROGRESS
    ↓
★ NEW ★ Epic 6: CIS Phase 1 (3 stories) - BLOCKING BETA
    ↓
Epic 5: Beta Launch Prep (3 stories) - MINIMAL VERSION
    ↓
🚀 BETA LAUNCH
    ↓
Epic 4: Onboarding Polish - POST-BETA
Epic 6 continued: CIS Phases 2-4 - POST-BETA
```

---

## Proposed Epic Structure

```
EPIC 6: Customer Intelligence System
├── Story 6.1: PostHog Foundation (Phase 1a) - BLOCKING BETA
├── Story 6.2: Core Event Tracking (Phase 1b) - BLOCKING BETA
├── Story 6.3: Friction & Warning Events (Phase 1c) - BLOCKING BETA
├── Story 6.4: Feedback Database Schema (Phase 2a) - POST-BETA
├── Story 6.5: Survey Components & Collection (Phase 2b) - POST-BETA
├── Story 6.6: Micro-Feedback Widgets (Phase 2c) - POST-BETA
├── Story 6.7: Intelligence Dashboard Foundation (Phase 3a) - POST-BETA
├── Story 6.8: Alerts & Health Monitoring (Phase 3b) - POST-BETA
├── Story 6.9: Cohort Analysis & A/B Testing (Phase 4a) - FUTURE
├── Story 6.10: Predictive Churn Model (Phase 4b) - FUTURE
```

**Phase 1 (6.1-6.3):** MUST complete before beta - enables data collection
**Phase 2-3 (6.4-6.8):** Build while beta runs - uses collected data
**Phase 4 (6.9-6.10):** After 30-60 days of beta data

---

## Detailed Story Breakdown

---

### Story 6.1: PostHog Foundation
**Size:** Small-Medium (4-6 hours)
**Phase:** 1a - BLOCKING BETA
**Dependencies:** None
**Trigger Words:** `analytics`, `PostHog`, `tracking`

#### Description
Install and configure PostHog analytics infrastructure with BOTH client-side and server-side tracking. Server-side is critical because ad blockers will kill 30%+ of client-side events.

#### Tasks
- [ ] Install `posthog-js` (client) and `posthog-node` (server) packages
- [ ] Create `src/lib/analytics.ts` - CLIENT-SIDE initialization, identify, track, reset
- [ ] Create `src/lib/analytics-server.ts` - SERVER-SIDE tracking for critical events
- [ ] Create `src/types/analytics.ts` - Strict TypeScript types for all events (prevent naming inconsistencies)
- [ ] Add PostHog environment variables to `.env.local` and `.env.example`
- [ ] Wrap app with PostHog provider in root layout
- [ ] Add `identifyUser()` call after authentication in AuthContext
- [ ] Add `resetAnalytics()` call on logout
- [ ] Configure PostHog settings:
  - autocapture: true
  - session recording: **OFF** (privacy default - can enable later)
  - respect_dnt: true
- [ ] Verify events appearing in PostHog Live Events dashboard

#### Critical: Server-Side vs Client-Side Events

**MUST BE SERVER-SIDE** (ad blockers can't block these):
| Event | Reason |
|-------|--------|
| `photographer_signed_up` | Critical funnel event |
| `photographer_connected_stripe` | Critical funnel event |
| `payment_completed` | Revenue tracking |
| `payment_failed` | Churn prevention |
| `photographer_churned` | Churn tracking |
| `client_churned` | Churn tracking |

**CAN BE CLIENT-SIDE** (engagement, not critical):
| Event | Reason |
|-------|--------|
| `gallery_viewed` | Engagement metric |
| `photo_favorited` | Engagement metric |
| `page_viewed` / `page_left` | Timing data |

#### Acceptance Criteria
- [ ] PostHog receiving `$pageview` events automatically (client-side)
- [ ] Server-side events firing from API routes (test with signup)
- [ ] Users identified (not anonymous) after login
- [ ] User properties include: user_type, signup_date, stripe_connected
- [ ] `trackEvent()` (client) and `trackServerEvent()` (server) both working
- [ ] No console errors related to PostHog
- [ ] Environment variables documented
- [ ] Works in production (Vercel)

#### Files to Create/Modify
| File | Action |
|------|--------|
| `package.json` | Add posthog-js, posthog-node |
| `src/lib/analytics.ts` | CREATE - Client-side PostHog |
| `src/lib/analytics-server.ts` | CREATE - Server-side PostHog (posthog-node) |
| `src/types/analytics.ts` | CREATE - Event type definitions |
| `src/app/layout.tsx` | Add PostHog provider |
| `src/contexts/AuthContext.tsx` | Add identify/reset calls |
| `.env.local` | Add NEXT_PUBLIC_POSTHOG_KEY, POSTHOG_API_KEY (server) |
| `.env.example` | Document PostHog vars |
| `VERCEL-ENV-SETUP.md` | Document production vars needed |

#### Code Reference - Client Side
```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js'

export const initAnalytics = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageviews: true,
      capture_pageleave: true,
      autocapture: true,
      persistence: 'localStorage',
      respect_dnt: true,
      disable_session_recording: true, // Privacy default
    })
  }
}

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, properties)
  }
}

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    })
  }
}

export const resetAnalytics = () => {
  if (typeof window !== 'undefined') {
    posthog.reset()
  }
}
```

#### Code Reference - Server Side (CRITICAL FOR AD BLOCKER BYPASS)
```typescript
// src/lib/analytics-server.ts
import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

function getPostHogClient(): PostHog {
  if (!posthogClient && process.env.POSTHOG_API_KEY) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    })
  }
  return posthogClient!
}

export async function trackServerEvent(
  userId: string,
  eventName: string,
  properties?: Record<string, any>
) {
  const client = getPostHogClient()
  if (!client) return

  client.capture({
    distinctId: userId,
    event: eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      $source: 'server', // Mark as server-side
    },
  })
}

export async function identifyServerUser(
  userId: string,
  properties: Record<string, any>
) {
  const client = getPostHogClient()
  if (!client) return

  client.identify({
    distinctId: userId,
    properties,
  })
}

// Call this on serverless function shutdown (Vercel)
export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown()
  }
}
```

#### Verification
```bash
# After implementation:
1. npm run dev -- -p 3002
2. Open http://localhost:3002
3. Login as any user
4. Check PostHog dashboard → Live Events
5. Confirm $pageview and $identify events appear (client)
6. Test signup flow - confirm photographer_signed_up appears (server)
7. Verify server events have $source: 'server' property
```

---

### Story 6.2: Core Event Tracking
**Size:** Medium (1-2 sessions)
**Phase:** 1b - BLOCKING BETA
**Dependencies:** Story 6.1
**Trigger Words:** `events`, `tracking`, `funnel`

#### Description
Implement core journey event tracking for photographers and clients. These events form the conversion funnel that will be analyzed.

#### Tasks
- [ ] Create `src/hooks/useAnalytics.ts` with tracking hooks
- [ ] Implement photographer journey events:
  - `photographer_signed_up` - on account creation
  - `photographer_started_onboarding` - first onboarding step viewed
  - `photographer_completed_onboarding` - all steps done
  - `photographer_skipped_onboarding` - user skips
  - `photographer_connected_stripe` - Stripe Connect complete
  - `photographer_uploaded_first_photo` - first photo upload
  - `photographer_created_gallery` - gallery created
  - `photographer_invited_client` - invitation sent
  - `photographer_received_first_payment` - first client payment
- [ ] Implement client journey events:
  - `client_clicked_invite_link` - clicked gallery link
  - `client_viewed_gallery` - gallery page loaded (with duration tracking)
  - `client_created_account` - registration complete
  - `client_started_payment` - payment flow initiated
  - `client_payment_failed` - payment error
  - `client_payment_completed` - successful payment
  - `client_downloaded_photo` - photo download
  - `client_shared_gallery` - share link created
- [ ] Implement engagement events:
  - `gallery_viewed` - any gallery view
  - `photo_favorited` - photo marked favorite
  - `family_member_invited` - family invite sent
  - `family_member_accepted` - invite accepted
- [ ] Add events to relevant pages/components
- [ ] Add events to relevant API routes (server-side tracking for payments)
- [ ] Verify funnel visible in PostHog

#### Acceptance Criteria
- [ ] All photographer journey events firing correctly with properties
- [ ] All client journey events firing correctly with properties
- [ ] Events have required properties (user_id, gallery_id, amounts, etc.)
- [ ] Server-side events for payment flows (can't be blocked by ad blockers)
- [ ] Funnel visible in PostHog: Signup → Onboarding → Stripe → Gallery → Client → Payment

#### Event Properties Standard
```typescript
// All events should include:
{
  timestamp: ISO 8601,
  user_id: UUID (when authenticated),
  session_id: string (for anonymous),
}

// Photographer events also include:
{
  is_first_X: boolean, // is_first_gallery, is_first_client, etc.
  time_from_signup_seconds: number,
}

// Client events also include:
{
  photographer_id: UUID,
  gallery_id: UUID,
  plan_type: 'annual' | 'monthly' | '6month',
}
```

#### Files to Create/Modify
| File | Action |
|------|--------|
| `src/hooks/useAnalytics.ts` | CREATE - React tracking hooks |
| `src/lib/analytics-server.ts` | CREATE - Server-side tracking (posthog-node) |
| `src/app/auth/signup/page.tsx` | Add signup event |
| `src/app/photographer/onboarding/*` | Add onboarding events |
| `src/app/api/stripe/connect/callback/route.ts` | Add Stripe connected event (server-side) |
| `src/app/api/galleries/route.ts` | Add gallery created event (server-side) |
| `src/app/api/invitations/route.ts` | Add client invited event (server-side) |
| `src/app/api/webhooks/stripe/route.ts` | Add payment events (server-side) |
| `src/app/gallery/[galleryId]/page.tsx` | Add gallery viewed event |
| `src/app/client/dashboard/page.tsx` | Add client events |
| `src/components/PhotoDownload.tsx` or similar | Add download event |

---

### Story 6.3: Friction & Warning Events
**Size:** Small (1 session)
**Phase:** 1c - BLOCKING BETA
**Dependencies:** Story 6.2
**Trigger Words:** `churn`, `abandonment`, `errors`

#### Description
Track friction points and warning signals that indicate potential churn or UX problems. These are critical for understanding why users drop off.

#### Tasks
- [ ] Implement abandonment events:
  - `upload_abandoned` - user leaves during upload (photos_uploaded, photos_remaining, time_spent)
  - `payment_abandoned` - user leaves payment flow (step_abandoned_at, gallery_id)
  - `onboarding_abandoned` - user leaves onboarding (step_abandoned_at, time_spent)
- [ ] Implement warning events:
  - `error_encountered` - any error shown to user (error_type, error_message, page)
  - `support_request_submitted` - help request sent (category, page)
- [ ] Implement churn events:
  - `photographer_churned` - subscription canceled (tenure_days, total_revenue, client_count)
  - `client_churned` - client storage canceled (tenure_days, photographer_id, gallery_count)
- [ ] Add `usePageView` hook for page leave detection with timing
- [ ] Test abandonment detection on upload page
- [ ] Test abandonment detection on checkout flow

#### Acceptance Criteria
- [ ] Abandonment events fire when user leaves mid-flow
- [ ] Page view duration tracked accurately
- [ ] Error events capture error type and context
- [ ] Churn events include tenure and lifetime value data
- [ ] Events useful for identifying UX friction points

#### Implementation Pattern
```typescript
// src/hooks/useAnalytics.ts
export const usePageView = (pageName: string, properties?: Record<string, any>) => {
  useEffect(() => {
    const startTime = Date.now()

    trackEvent(`${pageName}_viewed`, properties)

    return () => {
      const duration = Math.round((Date.now() - startTime) / 1000)
      trackEvent(`${pageName}_left`, {
        ...properties,
        duration_seconds: duration
      })
    }
  }, [pageName])
}
```

#### Files to Create/Modify
| File | Action |
|------|--------|
| `src/hooks/useAnalytics.ts` | Add usePageView, useTrackFunnelStep hooks |
| `src/app/photographer/upload/*` | Add abandonment tracking |
| `src/app/checkout/*` or payment flows | Add payment abandonment |
| `src/app/photographer/onboarding/*` | Add onboarding abandonment |
| `src/components/ErrorBoundary.tsx` | CREATE or modify - Add error tracking |
| `src/app/api/stripe/cancel-subscription/route.ts` | Add churn events |
| `src/app/client/billing/page.tsx` | Add client churn event on cancel |

---

### Story 6.4: Feedback Database Schema
**Size:** Small (1 session)
**Phase:** 2a - POST-BETA START
**Dependencies:** None (can run parallel to Phase 1)
**Trigger Words:** `database`, `schema`, `feedback`, `survey`

#### Description
Create database tables for storing survey responses, micro-feedback, and churn exit interviews.

#### Tasks
- [ ] Create `survey_responses` table
- [ ] Create `micro_feedback` table
- [ ] Create `churn_feedback` table
- [ ] Create `daily_metrics` table (for dashboard caching)
- [ ] Add RLS policies for feedback tables
- [ ] Run migration in Supabase
- [ ] Verify tables created successfully

#### Acceptance Criteria
- [ ] All four tables created in Supabase
- [ ] RLS policies allow users to insert their own feedback
- [ ] RLS policies allow admin to read all feedback
- [ ] Migration documented in database/ folder

#### Database Schema
```sql
-- Survey responses (structured)
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  survey_type TEXT NOT NULL, -- 'post_onboarding', 'post_first_payment', 'churn_exit', 'nps'
  responses JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for survey_responses
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own survey responses" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own survey responses" ON survey_responses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all survey responses" ON survey_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Micro feedback (quick reactions)
CREATE TABLE micro_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  context TEXT NOT NULL, -- 'upload_complete', 'gallery_view', 'invite_sent', etc.
  response TEXT NOT NULL, -- 'positive', 'negative'
  comment TEXT,
  page_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for micro_feedback
ALTER TABLE micro_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own micro feedback" ON micro_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can view all micro feedback" ON micro_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Churn feedback (detailed exit interviews)
CREATE TABLE churn_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_type TEXT NOT NULL, -- 'photographer', 'client'
  primary_reason TEXT NOT NULL,
  additional_comments TEXT,
  tenure_days INTEGER,
  total_revenue DECIMAL,
  would_reconsider BOOLEAN,
  retention_offer_shown BOOLEAN DEFAULT FALSE,
  retention_offer_accepted BOOLEAN,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for churn_feedback
ALTER TABLE churn_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own churn feedback" ON churn_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can view all churn feedback" ON churn_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Daily metrics (cached aggregations for dashboard performance)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  metadata JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_date, metric_name)
);

-- RLS for daily_metrics (admin only)
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view daily metrics" ON daily_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );
CREATE POLICY "System can insert daily metrics" ON daily_metrics
  FOR INSERT WITH CHECK (TRUE); -- Service role only
```

#### Files to Create
| File | Action |
|------|--------|
| `database/migrations/cis-feedback-schema.sql` | CREATE |

---

### Story 6.5: Survey Components & Collection
**Size:** Medium (1-2 sessions)
**Phase:** 2b - POST-BETA
**Dependencies:** Story 6.4
**Trigger Words:** `survey`, `NPS`, `feedback`, `modal`

#### Description
Build survey components for post-onboarding, post-first-payment, and churn exit surveys.

#### Tasks
- [ ] Create `SurveyModal` component (reusable base)
- [ ] Create `PostOnboardingSurvey` component (3 questions)
  - Main goal with PhotoVault (multiple choice + other)
  - How did you hear about us (multiple choice)
  - NPS score (0-10)
- [ ] Create `PostFirstPaymentSurvey` component (2 questions)
  - Easier or harder than expected (5-point scale)
  - What almost stopped you (open text, optional)
- [ ] Create `ChurnExitSurvey` component (3 questions)
  - Main reason for leaving (required, multiple choice)
  - Anything we could have done differently (open text)
  - Would reconsider if offered X (optional)
- [ ] Create `/api/surveys/submit` endpoint
- [ ] Add survey trigger logic:
  - Post-onboarding: 24h after completion OR on second login
  - Post-first-payment: Within 1h of payment
  - Churn exit: Before final cancel confirmation
- [ ] Track survey events in PostHog (survey_shown, survey_submitted, survey_skipped)
- [ ] Implement skip tracking (don't show after 2 skips)

#### Acceptance Criteria
- [ ] Post-onboarding survey appears correctly with trigger logic
- [ ] Post-first-payment survey triggers within 1h of payment
- [ ] Churn exit survey appears before cancel confirmation
- [ ] Surveys can be skipped (tracked)
- [ ] Responses stored in `survey_responses` table
- [ ] Survey events tracked in PostHog
- [ ] Don't show surveys to users who completed or skipped 2x

#### Files to Create/Modify
| File | Action |
|------|--------|
| `src/components/surveys/SurveyModal.tsx` | CREATE |
| `src/components/surveys/PostOnboardingSurvey.tsx` | CREATE |
| `src/components/surveys/PostFirstPaymentSurvey.tsx` | CREATE |
| `src/components/surveys/ChurnExitSurvey.tsx` | CREATE |
| `src/app/api/surveys/submit/route.ts` | CREATE |
| `src/hooks/useSurveyTrigger.ts` | CREATE - Logic for when to show surveys |
| `src/app/photographer/dashboard/page.tsx` | Add survey trigger check |
| `src/app/api/stripe/cancel-subscription/route.ts` | Integrate churn survey |

---

### Story 6.6: Micro-Feedback Widgets
**Size:** Small (1 session)
**Phase:** 2c - POST-BETA
**Dependencies:** Story 6.4
**Trigger Words:** `feedback`, `widget`, `thumbs`

#### Description
Create lightweight micro-feedback widgets for in-context feedback collection at key moments.

#### Tasks
- [ ] Create `MicroFeedback` component (thumbs up/down + optional comment)
- [ ] Create `/api/feedback/micro` endpoint
- [ ] Add micro-feedback to:
  - After photo upload complete ("How was that upload?")
  - On gallery first view ("Finding everything?")
  - After client invite sent ("Was that easy?")
- [ ] Implement sampling (show to 25% of users on some triggers)
- [ ] Track feedback events in PostHog
- [ ] Style to be unobtrusive but visible

#### Acceptance Criteria
- [ ] Micro-feedback widget displays correctly
- [ ] Negative feedback expands to show comment field
- [ ] Feedback stored in `micro_feedback` table
- [ ] Sampling works correctly (not shown to everyone every time)
- [ ] Feedback tracked in PostHog
- [ ] Widget dismissible and doesn't block user flow

#### Files to Create/Modify
| File | Action |
|------|--------|
| `src/components/feedback/MicroFeedback.tsx` | CREATE |
| `src/app/api/feedback/micro/route.ts` | CREATE |
| `src/hooks/useMicroFeedback.ts` | CREATE - Sampling and display logic |
| `src/app/photographer/upload/page.tsx` | Add feedback widget |
| `src/app/gallery/[galleryId]/page.tsx` | Add feedback widget |
| `src/app/photographer/clients/page.tsx` or invite flow | Add feedback widget |

---

### Story 6.7: Intelligence Dashboard Foundation
**Size:** Medium (1-2 sessions)
**Phase:** 3a - POST-BETA (requires event data)
**Dependencies:** Stories 6.1-6.3 (event data), 6.4-6.6 (feedback data)
**Trigger Words:** `dashboard`, `metrics`, `intelligence`

#### Description
Build the founder-facing intelligence dashboard with health metrics, funnels, and feedback aggregation.

#### Tasks
- [ ] Create `/admin/intelligence` page (founder access only)
- [ ] Create `CustomerIntelligenceService` in `src/lib/server/`
- [ ] Implement health metrics with red/yellow/green indicators:
  - Activation Rate (>60% green, 40-60% yellow, <40% red)
  - Time to First Value (<14d green, 14-30d yellow, >30d red)
  - Gallery Delivery Rate (>80% green, 60-80% yellow, <60% red)
  - Client Conversion Rate (>50% green, 30-50% yellow, <30% red)
  - Photographer Churn (<5% green, 5-10% yellow, >10% red)
  - Client Churn (<3% green, 3-7% yellow, >7% red)
- [ ] Implement funnel visualization:
  - Photographer: Signup → Onboarding → Stripe → Gallery → Client → Payment
  - Client: Invite → View → Account → Payment Start → Payment Complete
- [ ] Implement recent feedback section (latest surveys, micro-feedback)
- [ ] Add revenue summary (from existing admin-revenue-service)
- [ ] Create `/api/admin/intelligence` endpoint

#### Acceptance Criteria
- [ ] Dashboard accessible at `/admin/intelligence`
- [ ] Health metrics show with color-coded indicators
- [ ] Funnel shows conversion rates at each step with percentages
- [ ] Recent feedback displays from surveys and micro-feedback
- [ ] Dashboard loads in <3 seconds
- [ ] Only accessible to admin/founder role

#### Dashboard Layout
```
┌──────────────────────────────────────────────────────┐
│  PhotoVault Intelligence Dashboard       [Refresh]   │
├──────────────────────────────────────────────────────┤
│  💰 REVENUE              │  📊 HEALTH                │
│  ─────────────           │  ───────────              │
│  MRR: $X,XXX (+X% MoM)   │  Activation: 🟢 XX%       │
│  Photographers: XX       │  Time to Value: 🟡 XXd    │
│  Clients: XXX            │  Delivery: 🟢 XX%         │
│  Avg Rev/Photog: $XX     │  Conversion: 🟢 XX%       │
│                          │  Churn: 🟢 X.X%           │
├──────────────────────────────────────────────────────┤
│  📈 PHOTOGRAPHER FUNNEL (Last 30 Days)               │
│  ─────────────────────────────────────               │
│  Signups: XX                                         │
│  ├─→ Onboarding Complete: XX (XX%)                  │
│  ├─→ Stripe Connected: XX (XX%)                     │
│  ├─→ First Gallery: XX (XX%)                        │
│  ├─→ First Client Invited: XX (XX%)                 │
│  └─→ First Payment: XX (XX%) ← [Focus indicator]    │
├──────────────────────────────────────────────────────┤
│  👥 CLIENT FUNNEL (Last 30 Days)                     │
│  ──────────────────────────────                      │
│  Invites Sent: XX                                    │
│  ├─→ Gallery Viewed: XX (XX%)                       │
│  ├─→ Account Created: XX (XX%)                      │
│  ├─→ Payment Started: XX (XX%)                      │
│  └─→ Payment Complete: XX (XX%)                     │
├──────────────────────────────────────────────────────┤
│  📝 RECENT FEEDBACK                                  │
│  ─────────────────                                   │
│  [Latest 5-10 feedback items with sentiment]        │
│  NPS This Week: XX (Target: 50)                     │
└──────────────────────────────────────────────────────┘
```

#### Files to Create/Modify
| File | Action |
|------|--------|
| `src/app/admin/intelligence/page.tsx` | CREATE |
| `src/lib/server/customer-intelligence-service.ts` | CREATE |
| `src/app/api/admin/intelligence/route.ts` | CREATE |
| `src/app/admin/layout.tsx` | Add navigation link |

---

### Story 6.8: Alerts & Health Monitoring
**Size:** Small (1 session)
**Phase:** 3b - POST-BETA
**Dependencies:** Story 6.7
**Trigger Words:** `alerts`, `notifications`, `monitoring`

#### Description
Implement automated alerts for critical events and health metric threshold breaches.

#### Tasks
- [ ] Create alert system for:
  - Photographer inactive 7+ days
  - Payment failure
  - High-value churn (>6 months tenure, >3 clients)
  - Negative feedback spike (3+ in 24h)
  - Funnel conversion drop below threshold
  - Error rate spike (50%+ increase)
- [ ] Add alerts section to intelligence dashboard
- [ ] Create `/api/cron/health-check` for scheduled monitoring
- [ ] Create email notification for critical alerts (optional - founder preference)
- [ ] Store alerts in database for history

#### Acceptance Criteria
- [ ] Alerts appear on intelligence dashboard
- [ ] Thresholds configurable (or sensible defaults)
- [ ] Critical alerts trigger email notification if enabled
- [ ] Alert history viewable
- [ ] Cron job runs reliably

#### Files to Create/Modify
| File | Action |
|------|--------|
| `src/lib/server/alert-service.ts` | CREATE |
| `src/app/api/cron/health-check/route.ts` | CREATE |
| `src/app/admin/intelligence/page.tsx` | Add alerts section |
| `vercel.json` | Add cron schedule |
| `database/migrations/cis-alerts-table.sql` | CREATE (optional) |

---

### Story 6.9: Cohort Analysis & A/B Testing (PHASE 4 - FUTURE)
**Size:** Medium (1 session)
**Phase:** 4a - 30+ days after beta
**Dependencies:** 30+ days of event data
**Trigger Words:** `cohort`, `A/B test`, `experiment`

#### Description
Implement cohort analysis and A/B testing framework using PostHog feature flags.

*Details deferred until Phase 4 planning*

---

### Story 6.10: Predictive Churn Model (PHASE 4 - FUTURE)
**Size:** Medium (1 session)
**Phase:** 4b - 60+ days after beta
**Dependencies:** 60+ days of event data, sufficient churn samples
**Trigger Words:** `churn prediction`, `risk score`

#### Description
Build a simple churn risk scoring system based on behavioral signals.

*Details deferred until Phase 4 planning*

---

## Implementation Timeline

### Pre-Beta (BLOCKING)

| Story | Est. Time | Deliverable |
|-------|-----------|-------------|
| 6.1 PostHog Foundation | 1 day | Analytics infrastructure live |
| 6.2 Core Event Tracking | 2 days | Full funnel tracking |
| 6.3 Friction Events | 1 day | Abandonment + churn tracking |

**Total Pre-Beta CIS Work: ~4 days**

### Post-Beta Launch

| Week | Stories | Deliverable |
|------|---------|-------------|
| Week 1-2 post-beta | 6.4, 6.5, 6.6 | Feedback collection active |
| Week 3-4 post-beta | 6.7, 6.8 | Intelligence dashboard + alerts |
| Month 2+ | 6.9, 6.10 | Advanced analytics |

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PostHog blocks page load | Low | High | Async loading, error handling |
| Events lost/incomplete | Medium | Medium | Server-side tracking for critical events |
| Ad blockers block PostHog | Medium | Low | Server-side tracking fallback |
| Dashboard slow with data | Medium | Medium | Pre-aggregate in daily_metrics table |
| Survey fatigue | Medium | Medium | Strict frequency limits, allow skip |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Delays beta launch | Medium | High | Stories 6.1-6.3 are small (~4 days) |
| Survey response rate low | Medium | Medium | Keep surveys short, good timing |
| Data not actionable | Low | Medium | Follow spec's event taxonomy |

---

## Open Questions for User

1. **PostHog Plan:** Free tier (1M events/month) or paid? This affects event volume planning.

2. **Email Alerts:** Do you want critical alerts emailed to you, or dashboard-only?

3. **Survey Timing:** The spec says 24h after onboarding - is that good, or prefer sooner?

4. **Feedback on Layout:** The dashboard layout above - does that capture what you want to see?

5. **Epic 4 (Onboarding Polish):** Skip before beta, or still include?

---

## Dependencies & Prerequisites

### External Dependencies
- [ ] PostHog account created
- [ ] PostHog API key obtained
- [ ] Vercel cron jobs enabled (for health check)

### Internal Dependencies
- Story 6.1 blocks 6.2, 6.3
- Story 6.4 blocks 6.5, 6.6
- Stories 6.1-6.6 provide data for 6.7
- 30+ days of data needed for 6.9
- 60+ days of data + churn samples needed for 6.10

---

**Plan Status:** DRAFT - Awaiting QA Critique
**Next Step:** QA Critic review
**Author:** Claude Code
**Date:** December 13, 2025
