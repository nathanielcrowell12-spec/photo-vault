# PhotoVault Master Work Plan

**Created:** November 27, 2025
**Purpose:** Organized stories for systematic development
**Methodology:** BMAD - Each story fits within one context window

---

## How To Use This Plan

1. **Each Epic** = A major milestone
2. **Each Story** = One focused session (fits in context window)
3. **Work sequentially** - Stories are ordered by dependency
4. **Mark complete** when done: Change `[ ]` to `[x]`
5. **Update CLAUDE.md** SESSION STATE after each story

---

## Expert Agents Available

**IMPORTANT:** For complex tasks, use the Expert Agent system documented in:
```
C:\Users\natha\.cursor\Photo Vault\EXPERT-AGENTS.md
```

### Quick Reference
| Task Type | Expert to Use |
|-----------|---------------|
| Stripe/Payments | `Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\stripe-expert.md` |
| Database/RLS | `Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\supabase-expert.md` |
| Next.js/API Routes | `Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\nextjs-expert.md` |
| UI Components | `Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\shadcn-expert.md` |
| Email Templates | `Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\resend-expert.md` |
| **ANY UI Design** | `Stone-Fence-Brain\DEPARTMENTS\Product\skills\ui-ux-design.md` |

Experts write plans to `docs/claude/plans/` - read the plan before implementing.

---

# EPIC 1: Payment System Completion (BLOCKER)

**Priority:** 🔴 CRITICAL - No beta launch without this
**Dependencies:** None (foundation work)
**Estimated Stories:** 6

---

## Story 1.1: Payment Flow Testing & Verification
**Size:** Medium (1 session)
**Files:** 4-6 files
**Status:** ✅ COMPLETE - All Testing Complete (Dec 2, 2025)

### Description
Test the existing Stripe payment flow end-to-end in test mode. **IMPORTANT:** System now uses Stripe destination charges - money routes directly to photographer via `transfer_data.destination`. No 14-day payout delay or cron jobs needed.

### Architecture Note
**Current System (Dec 1, 2025):**
- Uses Stripe destination charges (`application_fee_amount` + `transfer_data.destination`)
- Commissions recorded as `status: 'paid'` immediately
- Money routes to photographer automatically (2-day Stripe settlement)
- No cron jobs or manual transfers required

### Tasks
- [x] Start dev server (port 3002) and Stripe CLI for webhook forwarding
- [x] Test photographer Stripe Connect flow (verify test account is active)
- [x] Test client checkout flow (public-checkout or gallery-checkout)
- [x] Verify webhook receives `checkout.session.completed`
- [x] Verify commission record created with `status: 'paid'` and `stripe_transfer_id`
- [x] Verify money routes to photographer's Stripe Express account
- [x] Test `/api/photographer/commissions` endpoint
- [x] Verify payment blocked if photographer missing Stripe Connect
- [x] Document any bugs found (webhook profile creation bug fixed)

### Acceptance Criteria
- [x] Photographer can connect Stripe account (Stripe Connect flow works)
- [x] Client can complete checkout (public checkout works)
- [x] Webhook processes `checkout.session.completed` event
- [x] Commission recorded with `status: 'paid'` and `stripe_transfer_id` immediately
- [x] Money actually routes to photographer's Stripe account (verify in Stripe dashboard)
- [x] Commission appears in photographer dashboard API (`/api/photographer/commissions`)
- [x] Payment blocked gracefully if photographer missing Stripe Connect

### Test Photographer
- ID: `2135ab3a-6237-48b3-9d53-c38d0626b3e4`
- Stripe Account: `acct_1SYm5G9my0XhgOxd`
- Email: Notrealperson@gmail.com

### Files Likely Touched
- `src/app/api/stripe/public-checkout/route.ts` (destination charges)
- `src/app/api/stripe/gallery-checkout/route.ts` (destination charges)
- `src/app/api/webhooks/stripe/route.ts` (records commission as paid)
- `src/app/api/photographer/commissions/route.ts` (NEW - photographer earnings API)
- Testing only - may not need edits

---

## Story 1.2: Commission Payout Automation
**Size:** Medium (1 session)
**Files:** 3-5 files
**Status:** ⚠️ **OBSOLETE** - Replaced by Destination Charges (Dec 1, 2025)

### Description
~~Build the automated commission payout system that transfers funds to photographers after 14-day delay.~~

**UPDATE (Dec 1, 2025):** This story is **OBSOLETE**. The system now uses Stripe destination charges which route money directly to photographers automatically. No 14-day delay, no cron jobs, no manual transfers needed.

### Why This Is Obsolete
- **Old System:** Money → Platform → 14-day wait → Cron job → Transfer to photographer
- **New System:** Money → Stripe routes directly to photographer via `transfer_data.destination` (2-day Stripe settlement)
- **Benefits:** Faster payouts (2 days vs 14), no cron jobs, less code, better UX

### Migration Completed
- ✅ Destination charges implemented in `public-checkout` and `gallery-checkout` routes
- ✅ Webhook records commissions as `status: 'paid'` immediately
- ✅ `stripe_transfer_id` captured automatically
- ✅ Old cron job (`/api/cron/process-payouts`) deprecated

### Files That Were Replaced
- ~~`src/app/api/cron/process-commissions/route.ts`~~ - No longer needed
- ✅ `src/app/api/stripe/public-checkout/route.ts` - Now uses destination charges
- ✅ `src/app/api/stripe/gallery-checkout/route.ts` - Now uses destination charges
- ✅ `src/app/api/webhooks/stripe/route.ts` - Records commission as paid immediately

**Action:** Skip this story. Move to Story 1.3.

---

## Story 1.3: Platform Fee Billing
**Size:** Medium (1 session)
**Files:** 4-6 files
**Status:** ✅ COMPLETE - Tested & Working (Dec 4, 2025)

### Description
Implement $22/month platform fee billing for photographers using Stripe subscriptions.

### Architecture Decision
Store subscription data directly in `photographers` table (not `subscriptions` table) because:
- Simpler queries (no joins)
- One subscription per photographer
- Matches existing pattern (Stripe Connect account ID is in `photographers` table)
- Easier RLS policy checks

### Tasks
- [x] Create photographer subscription during signup/onboarding
- [x] Build `/api/stripe/platform-subscription` endpoint
- [x] Handle subscription creation (immediate billing, no trial)
- [x] Update webhook to handle `invoice.paid` for platform fees
- [x] Store subscription ID in `photographers` table (not `user_profiles`)
- [x] Display subscription status on photographer subscription page
- [x] Add database migration for subscription columns
- [x] Update PaymentGuard to enforce platform subscription status

### Acceptance Criteria
- [x] New photographers are billed $22/month immediately (no trial period)
- [x] Subscription charges automatically via Stripe
- [x] Photographer can view billing status on `/photographers/subscription`
- [x] Photographer can view/create subscription from `/photographers/settings`
- [x] Webhooks update subscription status correctly
- [ ] Failed payments trigger retry logic (deferred to Story 1.4)

### Bugs Fixed (Dec 4, 2025)
- Fixed database query looking for non-existent `email` column in `user_profiles`
- Added auto-set default payment method when first card added
- Fixed date conversion crashes (null checks for `current_period_start/end`)
- Consolidated subscription UI into settings page
- Removed erroneous "Sessions" feature from photographer dashboard

### Files Created/Modified
- `database/add-photographer-platform-subscription.sql` (NEW - migration)
- `src/app/api/stripe/platform-subscription/route.ts` (NEW)
- `src/lib/stripe.ts` (added `createPlatformSubscription` function)
- `src/app/api/stripe/webhook/route.ts` (updated handlers for platform subscriptions)
- `src/contexts/AuthContext.tsx` (integrated subscription creation on signup)
- `src/app/photographers/subscription/page.tsx` (connected to real API)
- `src/components/PaymentGuard.tsx` (added photographer subscription checks)

---

## Story 1.4: Failed Payment Handling
**Size:** Small (1 session)
**Files:** 3-4 files
**Status:** ✅ COMPLETE (Dec 4, 2025)

### Description
Implement graceful handling when payments fail - retry logic, user notifications, and access management.

### Tasks
- [x] Handle `invoice.payment_failed` webhook event
- [x] Track payment failures with `payment_failure_count`, `last_payment_failure_at`
- [x] Create payment failure email template (shows months, not days)
- [x] Suspend gallery access after **6 MONTHS** of failure (not 48 hours - per business model)
- [x] Restore access immediately on successful retry with email notification

### Acceptance Criteria
- [x] Failed payments tracked in database
- [x] User receives email about failed payment with 6-month grace period info
- [x] After 6 months, gallery access suspended (not deleted)
- [x] Successful payment restores access and sends confirmation email

### Files Modified
- `src/app/api/webhooks/stripe/route.ts` - 6-month grace period logic
- `src/lib/email/revenue-templates.ts` - Updated to show months
- `src/lib/subscription-access.ts` (NEW) - Server-side access checking

### Notes
**IMPORTANT:** Grace period is 6 MONTHS per `payment-models.ts`, not 48 hours as originally specified in work plan. Stripe handles retries automatically with Smart Retries.

---

## Story 1.5: Subscription Management
**Size:** Small (1 session)
**Files:** 3-4 files
**Status:** ✅ COMPLETE (Dec 4, 2025)

### Description
Allow clients to manage their subscription - view status, update payment method, cancel, and reactivate.

### Tasks
- [x] Build client billing page UI with grace period countdown
- [x] Show current subscription status and next billing date
- [x] Add "Update Payment Method" button (uses PaymentMethodManager)
- [x] Add "Cancel Subscription" with confirmation dialog
- [x] Create cancel subscription API endpoint
- [x] Create reactivation API endpoint ($20 fee for suspended accounts)
- [x] Handle reactivation webhook (30-day access window)

### Acceptance Criteria
- [x] Client can view subscription details with grace period countdown
- [x] Client can update payment method
- [x] Client can cancel (shows 6-month grace period info)
- [x] During grace period: Can resume without penalty
- [x] After 6 months (suspended): $20 reactivation required
- [x] Reactivation gives 30 days to choose: resume $8/month OR download and leave

### Files Created/Modified
- `src/app/client/billing/page.tsx` - Enhanced with grace countdown, cancel, reactivate
- `src/app/api/stripe/cancel-subscription/route.ts` (NEW)
- `src/app/api/stripe/reactivate/route.ts` (NEW)
- `src/app/api/webhooks/stripe/route.ts` - Reactivation payment handling

---

## Story 1.6: Payment System QA & Bug Fixes
**Size:** Medium (1 session)
**Files:** Variable
**Status:** ✅ COMPLETE (Dec 7, 2025)

### Description
Comprehensive testing of all payment flows and fix any bugs found.

### Tasks
- [x] Test complete photographer journey: Signup → Connect → Gallery → Client pays
- [x] Test complete client journey: Invite → Signup → Pay → View gallery
- [x] Test edge cases: Card decline, 3D Secure, expired card (Stripe handles gracefully)
- [x] Test commission flow: Payment → Immediate transfer to photographer (destination charges)
- [x] Fix any bugs discovered
- [x] Document test results

### Bugs Fixed (Dec 7, 2025)
**Bug: Webhook 500 error on checkout.session.completed**
- **Error:** `A user with this email address has already been registered`
- **Root Cause:** Code was checking `user_profiles.email` but that column doesn't exist in the table (email lives in `auth.users`)
- **Solution:** Added fallback logic when `createUser` fails with `email_exists` error - fetch existing user via `listUsers` and continue
- **File Modified:** `src/app/api/webhooks/stripe/route.ts` (lines 229-299)

### Test Results (Dec 7, 2025)
| Test | Result |
|------|--------|
| Public checkout creates Stripe session | ✅ PASS |
| Webhook processes checkout.session.completed | ✅ PASS |
| Gallery marked as paid after payment | ✅ PASS |
| Commission created with correct amounts | ✅ PASS |
| Stripe transfer to photographer completed | ✅ PASS |
| Existing user handled correctly on repeat checkout | ✅ PASS |

**Sample Commission Created:**
- Total paid: $300 ($200 shoot + $100 storage)
- Photographer receives: $275 (shoot fee + 50% storage)
- PhotoVault receives: $25 (50% storage)
- Stripe transfer ID: `tr_3SbmDl8jZm4oWQdn1c4u3OOZ`
- Status: `paid`

### Acceptance Criteria
- [x] All happy paths work
- [x] All error paths handled gracefully
- [x] Commission accuracy validated
- [x] Zero critical bugs

### Files Modified
- `src/app/api/webhooks/stripe/route.ts` - Fixed user existence check for public checkout

---

## Story 1.7: Family Accounts Feature
**Size:** Large (2-3 sessions)
**Files:** 10+ files
**Status:** ✅ COMPLETE - All 8 Sprints Implemented (Dec 4-5, 2025)

### Description
Allow primary account holders to invite family members who can view galleries, optionally add payment methods, and take over billing if the primary stops paying or passes away.

**The Problem:** If Grandma pays for family photos and passes away, her daughter has NO WAY to know the account exists, take over payments, or access the photos. The photos sit safely stored but inaccessible.

**The Solution:** Family Accounts create a "safety net" of people who CAN take over payments when needed.

### Business Rules (Confirmed)
- **Access scope:** ALL galleries of primary account
- **Account type:** Either magic link OR create account later
- **Payment takeover:** Family member chooses: become primary OR just pay
- **Family limit:** Configurable per subscription tier (default 5)
- **Own account:** Family member can KEEP family access AND have own galleries too
- **Grace period emails:** At 3, 4, 5, 5.5 months to family members
- **Pricing:** Included FREE in $8/month subscription
- **Commission:** Same 50/50 continues after takeover
- **Takeover reasons:** Death / Financial hardship / Health issues / Other
- **Photographer notification:** Email + in-dashboard notification when takeover happens

### Tasks

**Sprint 1-2: Database & Core Logic** ✅ COMPLETE (Dec 4, 2025)
- [x] Create `secondaries` table (replaces `family_members`)
- [x] Create `gallery_sharing` table (per-gallery opt-in)
- [x] Create `account_takeovers` table (audit log)
- [x] Create `gallery_incorporations` table
- [x] Add columns to `user_profiles` and `photo_galleries`
- [x] Set up RLS policies for family access
- [x] **DATABASE MIGRATED TO SUPABASE**
- [x] Create `/api/family/enable` endpoint
- [x] Create `/api/family/secondaries` endpoint (invite, list, remove)
- [x] Create `/api/family/secondaries/accept` endpoint
- [x] Create family invitation email template
- [x] Create grace period alert emails (4 urgency levels)
- [x] Create takeover confirmation email
- [x] Create photographer notification email
- [x] Create `/family/accept/[token]` page
- [x] Wire up email sending in invite flow

**Sprint 3: Settings UI** ✅ COMPLETE (Dec 4, 2025)
- [x] Add "Family Sharing" section to client settings
- [x] Toggle to enable family mode
- [x] Invite family member form (email, name, relationship)
- [x] Manage family members list
- [x] Gallery sharing toggles

**Sprint 4: Gallery Sharing Controls** ✅ COMPLETE (Dec 4, 2025)
- [x] Per-gallery family sharing toggle in GalleryEditModal
- [x] `/api/galleries/[id]/sharing` endpoint

**Sprint 5: Account Takeover Flow** ✅ COMPLETE (Dec 4, 2025)
- [x] Create `/api/family/takeover` endpoint
- [x] Create `/family/takeover` page (multi-step wizard)
- [x] Ask for takeover reason (death/financial/health/other)
- [x] Choice: become primary OR just pay bills
- [x] Send photographer notification (email + dashboard)

**Sprint 6: Webhook Integration** ✅ COMPLETE (Dec 5, 2025)
- [x] Handle `family_takeover` checkout in webhook
- [x] Update subscription ownership on takeover

**Sprint 7: Grace Period Email Cron** ✅ COMPLETE (Dec 5, 2025)
- [x] Create `/api/cron/grace-period-notifications` endpoint
- [x] Scheduled check at 3, 4, 5, 5.5 months
- [x] Added cron to vercel.json

**Sprint 8: Gallery Incorporation** ✅ COMPLETE (Dec 5, 2025)
- [x] Create `/api/family/incorporate` endpoint
- [x] Add incorporation modal in `/family/galleries` page
- [x] Copy galleries to secondary's own account

### Acceptance Criteria
- [x] Primary can invite up to 5 family members
- [x] Family members can view all primary's galleries
- [x] Family members can optionally add payment method
- [x] At 3 months into grace period, family members get email
- [x] Family member can take over billing (with reason)
- [x] Photographer notified of takeover with reason
- [x] Commission continues after family takeover
- [x] Family member can start own subscription while keeping family access

### Database Schema (Summary)

```sql
-- family_members table
CREATE TABLE family_members (
  id UUID PRIMARY KEY,
  primary_user_id UUID REFERENCES user_profiles(id),
  member_email VARCHAR NOT NULL,
  member_user_id UUID REFERENCES user_profiles(id), -- NULL until account created
  member_name VARCHAR,
  relationship VARCHAR,
  invitation_token VARCHAR UNIQUE,
  status VARCHAR DEFAULT 'pending', -- pending, active, removed
  has_payment_method BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR,
  is_billing_payer BOOLEAN DEFAULT FALSE,
  takeover_reason VARCHAR,
  ...
);

-- family_settings table
CREATE TABLE family_settings (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES user_profiles(id),
  family_mode_enabled BOOLEAN DEFAULT FALSE,
  max_family_members INTEGER DEFAULT 5,
  ...
);
```

### Files Created (All Sprints Complete)
| File | Status |
|------|--------|
| `database/family-accounts-schema.sql` | ✅ CREATED & MIGRATED |
| `database/migrations/add-grace-notifications-column.sql` | ✅ CREATED |
| `src/app/api/family/enable/route.ts` | ✅ CREATED |
| `src/app/api/family/secondaries/route.ts` | ✅ CREATED |
| `src/app/api/family/secondaries/accept/route.ts` | ✅ CREATED |
| `src/app/api/family/shared-galleries/route.ts` | ✅ CREATED |
| `src/app/api/family/takeover/route.ts` | ✅ CREATED |
| `src/app/api/family/incorporate/route.ts` | ✅ CREATED |
| `src/app/api/galleries/[id]/sharing/route.ts` | ✅ CREATED |
| `src/app/api/cron/grace-period-notifications/route.ts` | ✅ CREATED |
| `src/lib/email/family-templates.ts` | ✅ CREATED |
| `src/lib/email/email-service.ts` | ✅ UPDATED (family methods) |
| `src/app/family/accept/[token]/page.tsx` | ✅ CREATED |
| `src/app/family/galleries/page.tsx` | ✅ CREATED |
| `src/app/family/takeover/page.tsx` | ✅ CREATED |
| `src/app/client/settings/family/page.tsx` | ✅ CREATED |
| `src/components/GalleryEditModal.tsx` | ✅ UPDATED (sharing toggle) |
| `src/app/api/webhooks/stripe/route.ts` | ✅ UPDATED (family_takeover) |
| `src/middleware.ts` | ✅ UPDATED (family routes) |
| `vercel.json` | ✅ UPDATED (cron schedule) |
| `src/components/ui/checkbox.tsx` | ✅ CREATED (shadcn)

### Full Design Document
See: `docs/FAMILY-ACCOUNTS-SPEC-V2.md`

---

## Story 1.8: Prepaid Time Accumulation & Stacking
**Size:** Medium (1-2 sessions)
**Files:** 5-8 files
**Status:** 🔴 NOT STARTED

### Description
When a client purchases multiple packages (or books sessions with multiple photographers), prepaid time must **stack sequentially** — not reset or overlap. This ensures clients receive the full value of every package purchased.

### Business Rules
1. **Sequential stacking:** If a client has 12 months prepaid and buys a 6-month package at month 3, the 6 months are held in reserve. Client receives 18 months total prepaid time (12 original + 6 reserved).
2. **Multi-photographer sessions:** If a client has active coverage and books with a different photographer, the new photographer still gets paid their commission, PhotoVault still gets paid, but the new prepaid time accumulates onto the existing coverage period.
3. **Reserve queue:** New packages enter a queue and activate only when the current prepaid period expires.
4. **No double-billing:** Monthly $8/month billing only starts after ALL prepaid time (including reserves) is exhausted.

### Edge Cases
- Client buys 12-month, then buys another 12-month at month 1 → 24 months total prepaid
- Client has 6-month package from Photographer A, books with Photographer B (12-month) at month 2 → 4 months remaining from A + 12 months from B = 16 months total
- Client buys package while in grace period → new prepaid time starts immediately (resets grace)
- Multiple reserves queued → FIFO order (first purchased activates first)

### Tasks
- [ ] Design `prepaid_reserves` table (or extend `client_subscriptions`) to track queued packages
- [ ] Update checkout webhook to detect existing active coverage and queue new packages
- [ ] Update subscription expiry logic to check for and activate reserves
- [ ] Update client billing UI to show current coverage + queued reserves
- [ ] Update photographer dashboard to show multi-session client status
- [ ] Add cron job or webhook trigger to activate reserved packages on expiry
- [ ] Handle commission correctly for multi-photographer scenarios

### Acceptance Criteria
- [ ] Buying a new package during active coverage queues it, doesn't reset
- [ ] Total prepaid time equals sum of all purchased periods
- [ ] Monthly billing starts only after all prepaid time exhausted
- [ ] Client billing page shows remaining prepaid time including reserves
- [ ] Multi-photographer commissions paid correctly at point of sale

### Notes
- This is a billing infrastructure change — get it right before scaling
- Current `payment-models.ts` assumes one active package per client; needs extension
- Consider impact on grace period logic (6-month grace starts after ALL prepaid expires)

---

# EPIC 2: Dashboard Fixes & Data Cleanup

**Priority:** 🟠 HIGH - User experience critical
**Dependencies:** Epic 1 (needs real payment data)
**Estimated Stories:** 4

---

## Story 2.1: Dashboard Audit & Bug Discovery
**Size:** Small (1 session)
**Files:** Read-only
**Status:** ✅ COMPLETE (Dec 7, 2025)

### Description
Systematically test all dashboards to find issues - broken links, mock data, 404 errors.

### Tasks
- [x] Test photographer dashboard - click every button
- [x] Test client dashboard - click every button
- [x] Test admin dashboard - click every button
- [x] Document all 404 errors (none found)
- [x] Document all pages with mock data
- [x] Document any UI bugs
- [x] Create prioritized fix list

### Acceptance Criteria
- [x] Complete list of issues documented
- [x] Issues prioritized by severity
- [x] Ready for fix stories

### Findings (Dec 7, 2025)
- **404 Errors:** None found - all navigation works
- **Mock Data Issues Found:**
  - Analytics page monthly breakdown was zeros (fixed in Story 2.2)
  - `clientRating: 5.0` placeholder (low priority)
  - `systemUptime: '99.9%'` placeholder in admin (low priority)
  - Client dashboard stats show "-" (low priority)
- **Revenue Page:** Fixed - now uses real API data

### Files Likely Touched
- None - testing only
- Output: Bug list in this file or CLAUDE.md

---

## Story 2.2: Fix Photographer Dashboard
**Size:** Medium (1 session)
**Files:** 3-5 files
**Status:** ✅ COMPLETE (Dec 7, 2025)

### Description
Fix issues found in photographer dashboard - replace mock data, fix broken links.

### Tasks
- [x] Replace mock data in analytics with real queries
- [x] Fix any broken navigation links (verified - all work)
- [x] Ensure commission display shows real data
- [x] Fix any 404 errors (none found)
- [x] Test all functionality (build passes)

### Acceptance Criteria
- [x] All data is real (no mock data)
- [x] All links work
- [x] Analytics shows actual earnings

### What Was Fixed (Dec 7, 2025)
1. **Analytics Service** (`src/lib/server/photographer-analytics-service.ts`):
   - Was returning zeros for monthly breakdown
   - Now queries `commissions` table for real monthly data
   - Calculates real growth metrics, totals, projections from commission records

2. **Reports API** (`src/app/api/reports/generate/route.ts`):
   - Was using old `commission_payments` table (doesn't exist)
   - Now uses `commissions` table for real data
   - Fixed to use `createServiceRoleClient()` instead of old import

3. **Webhook Route** (`src/app/api/webhooks/stripe/route.ts`):
   - Fixed TypeScript error with implicit 'any' type

### Files Likely Touched
- `src/app/photographer/dashboard/page.tsx`
- `src/app/photographer/analytics/page.tsx` (if exists)
- Related components

---

## Story 2.3: Fix Client Dashboard
**Size:** Medium (2-3 sessions)
**Files:** 5-8 files
**Status:** 🟢 MESSAGING COMPLETE - Minor Tests Pending (Dec 10, 2025)

### Description
Fix issues found in client dashboard - ensure real data, working links, functional messaging and upload.

### Tasks
- [x] Verify gallery stats are real
- [x] Verify payment status is accurate
- [x] Fix any broken navigation
- [x] Test gallery access
- [x] Ensure responsive on mobile
- [x] Fix MessagingPanel modal sizing (h-[600px] → responsive)
- [x] Add "Start New Chat" button to MessagingPanel
- [x] Fix client upload page - add web upload form with metadata
- [x] Fix upload page button handlers (Desktop + Web)

### Acceptance Criteria
- [x] Client sees accurate gallery info
- [x] Payment status is correct
- [x] All navigation works
- [?] Messaging modal fits screen without zooming - **NEEDS VISUAL TEST**
- [x] Users can start new chats even with existing conversations - **TESTED WORKING (Dec 10)**
- [x] Bi-directional messaging works (client↔photographer) - **TESTED WORKING (Dec 10)**
- [?] Client upload page has working web upload form - **NEEDS TESTING**
- [?] Upload page supports gallery metadata (Event Date, Location, People, Event Type, Photographer Name, Notes) - **NEEDS TESTING**

### What Was Fixed (Dec 8, 2025)
1. **Created Client Stats API** (`/api/client/stats`):
   - Returns `totalPhotos`, `photoSessions`, `downloaded`, `favorites`
   - Queries `photo_galleries` and `gallery_photos` tables
   - Returns `recentGalleries` for Recent Sessions section

2. **Updated Client Dashboard**:
   - Added state management for stats and loading states
   - Stats cards now show real data with loading indicators ("...")
   - "Downloaded" and "Favorites" show "Coming soon" hint (not tracked yet)
   - Recent Photo Sessions section populated from real gallery data
   - Shows gallery cover image, name, photo count, and date
   - "View all galleries" button when more than 3 galleries

### Issues Discovered (Dec 9, 2025)
1. **MessagingPanel** - Fixed height doesn't fit small screens, no way to start new chat
2. **Client Upload Page** - Missing entire web upload form section, buttons broken

### Implementation Plan
See: `docs/claude/plans/ui-client-dashboard-fixes-plan.md`

### Client Upload Requirements
- Mirror photographer upload page structure
- Gallery name (required), Description (optional)
- ALL metadata fields OPTIONAL (some clients upload professional photographer work)
- Database: `photographer_id` = NULL for client-uploaded galleries

### Files Created
| File | Purpose |
|------|---------|
| `src/app/api/client/stats/route.ts` | Client stats API endpoint |

### Files Modified (Dec 8, 2025)
| File | Changes |
|------|---------|
| `src/app/client/dashboard/page.tsx` | Added stats fetching, real data display, Recent Sessions |

### Files Modified (Dec 9, 2025) - UNTESTED
| File | Changes |
|------|---------|
| `src/components/MessagingPanel.tsx` | Responsive height (`h-[85vh] max-h-[800px] min-h-[500px]`), "Start New Chat" button with `showPhotographerList` state, improved conversation selection after starting chat |
| `src/app/client/upload/page.tsx` | Complete rebuild: Added web upload form with metadata fields (Event Date, Location, People, Event Type, Photographer Name, Notes), fixed Desktop App button (shows modal if not installed), fixed Online Upload button (scrolls to form instead of redirect loop) |

### Database Fixes (Dec 10, 2025) - APPLIED & TESTED
| Fix | Description |
|-----|-------------|
| `can_user_message` RPC | Multi-pattern checks for BOTH directions (client↔photographer). Checks: direct auth ID, FK join through clients table, and legacy tables |
| `update_conversation_on_message` trigger | Fixed UUID→boolean assignment bug. Was assigning `user2_id` (UUID) to `v_is_user1` (BOOLEAN) |

### Code Changes (Dec 10, 2025)
| File | Changes |
|------|---------|
| `src/app/photographer/dashboard/page.tsx` | Switched from `Messages` component to `MessagesButton` - unified on `conversations` table |

### Testing Results (Dec 10, 2025)
| Test | Result |
|------|--------|
| MessagingPanel fits screen | ✅ PASS |
| Bi-directional messaging | ✅ PASS |
| Start New Chat button | ✅ PASS |
| Desktop App protocol launch | ✅ PASS (fixed `photovault://` protocol) |
| Desktop auth handoff | ✅ PASS (token sent via protocol) |
| Client Upload web form | 🔴 BLOCKED - RLS policy issue |

### Current Blocker: Client Upload RLS

**Error:** `new row violates row-level security policy for table "photo_galleries"`

**Investigation:**
- RLS policy "Clients can insert own galleries" exists and looks correct
- `gallery_status` fixed from 'active' to 'draft' (check constraint)
- Required columns `platform` and `gallery_name` are being set

**Next Step:** Test INSERT directly in Supabase SQL Editor as authenticated client user to isolate issue:
```sql
SELECT id, email FROM auth.users WHERE email LIKE '%anotherdude%';
-- Get UUID, then:
SELECT set_config('request.jwt.claims', '{"sub": "UUID_HERE"}', true);
SET ROLE authenticated;
INSERT INTO photo_galleries (photographer_id, client_id, gallery_name, platform, gallery_status)
VALUES (NULL, NULL, 'Test', 'photovault', 'draft');
RESET ROLE;
```

**Bandaid Created (TO BE DELETED):**
- `/api/client/galleries/route.ts` - Uses service role to bypass RLS
- Upload page calls this API instead of direct Supabase
- **This is wrong** - delete and fix RLS properly

---

## Story 2.3b: Client Dashboard Cleanup & Favorites Feature
**Size:** Small (1 session)
**Files:** 2-3 files
**Status:** ✅ COMPLETE (Dec 12, 2025)

### Description
Fix remaining client dashboard issues discovered during testing. Remove placeholder content, fix support page, implement favorites feature.

### COMPLETED (Dec 11-12, 2025)

**Client Support Page (`/client/support`):** ✅ ALL DONE
- [x] Change phone number from `(555) 123-4567` to `(608) 571-7532` ✅
- [x] Remove "Live Chat" card entirely ✅
- [x] Remove "Support Hours" card entirely ✅
- [x] Email address correct: `support@photovault.com` ✅

**Timeline Page (`/client/timeline`):** ✅ ALL DONE
- [x] Fetches from real API `/api/client/timeline` ✅
- [x] Photos come from user's actual galleries ✅
- [x] Empty state when user has no galleries/photos ✅
- [x] Has filters for photographer, event_type, search ✅

**Client Dashboard (`/client/dashboard`):** ✅ ALL DONE
- [x] "Downloaded" stat removed (only 3 stats now) ✅
- [x] Stats from real API `/api/client/stats` ✅
- [x] Favorites stat shows real count from `is_favorite` ✅
- [x] Clicking Favorites stat → navigates to `/client/favorites` ✅

**Favorites Infrastructure:** ✅ ALL DONE
- [x] `/api/client/stats` counts favorites from database ✅ (line 77)
- [x] `/api/client/favorites` returns favorited photos ✅
- [x] `/client/favorites` page displays favorites with lightbox ✅
- [x] Dashboard Favorites card links to `/client/favorites` ✅
- [x] Lightbox component exists with heart icon ✅ (`src/app/gallery/[galleryId]/components/Lightbox.tsx`)

### COMPLETED (Dec 12, 2025)

**Favorites Toggle Implementation:**
- [x] Added heart icon to gallery slideshow (lines 971-985)
- [x] Created `POST /api/photos/[id]/favorite` endpoint to toggle `is_favorite`
- [x] Wired heart icon click to API call with optimistic UI updates
- [x] Heart fills red when favorited, white outline when not

### Files Created/Modified
- `src/app/gallery/[galleryId]/page.tsx` - Added Heart import, toggleFavorite function, heart button in slideshow
- `src/app/api/photos/[id]/favorite/route.ts` (NEW) - Toggle favorite endpoint with access control

### Existing Files (Already Complete)
| File | Status |
|------|--------|
| `src/app/client/support/page.tsx` | ✅ Phone fixed, cards removed |
| `src/app/client/timeline/page.tsx` | ✅ Real API, filters, empty state |
| `src/app/client/dashboard/page.tsx` | ✅ Real stats, clickable Favorites |
| `src/app/api/client/stats/route.ts` | ✅ Counts favorites |
| `src/app/api/client/favorites/route.ts` | ✅ Returns favorited photos |
| `src/app/client/favorites/page.tsx` | ✅ Displays favorites |
| `src/app/gallery/[galleryId]/components/Lightbox.tsx` | ✅ Has heart icon (not used) |

---

## Story 2.4: Fix Admin Dashboard
**Size:** Medium (1 session)
**Files:** 3-4 files
**Status:** ✅ COMPLETE (Jan 4, 2026)

### Description
Fix admin dashboard to show real platform metrics.

### COMPLETED (Dec 12, 2025)

**Admin Revenue Page:**
- [x] Payment Activity shows THIS MONTH's transactions (matching header stat)
- [x] Clickable stats → navigate to transactions page with period filter
- [x] Working Sync button
- [x] Removed fake "Payment Integrations" card
- [x] Leaderboard link enabled and working

**Files Created:**
| File | Purpose |
|------|---------|
| `src/app/api/admin/transactions/route.ts` | Full transactions API with period filtering, pagination, search |
| `src/app/admin/transactions/page.tsx` | Full transactions page with filters, pagination, search |
| `src/app/api/admin/leaderboard/route.ts` | Leaderboard API showing PhotoVault rev AND photographer earnings |
| `src/app/admin/leaderboard/page.tsx` | Photographer rankings with gold/silver/bronze styling |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/lib/server/admin-revenue-service.ts` | Payment Activity now shows THIS MONTH's transactions |
| `src/app/admin/revenue/page.tsx` | Clickable stats, working Sync button, removed fake card |

### REMAINING
- [ ] Show photographer list with real data
- [ ] Show client list with real data
- [ ] Add basic filtering/search to main admin dashboard

### Acceptance Criteria
- [x] Admin sees real platform metrics (revenue page complete)
- [ ] Can view photographer/client lists
- [ ] Data matches database

### Files Likely Touched (Remaining)
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/photographers/page.tsx`
- `src/app/admin/clients/page.tsx`

---

# EPIC 3: Email System Completion

**Priority:** 🟠 HIGH - Critical for user communication
**Dependencies:** Epic 1 (payment events trigger emails)
**Estimated Stories:** 3

---

## Story 3.1: Commission & Billing Emails
**Size:** Small (1 session)
**Files:** 3-4 files

### Description
Build email templates for commission earned and monthly billing receipts.

### Tasks
- [ ] Create commission earned email template
- [ ] Create monthly billing receipt template
- [ ] Trigger commission email when payment succeeds
- [ ] Trigger billing receipt on platform fee charge
- [ ] Test email delivery

### Acceptance Criteria
- [ ] Photographer receives email when they earn commission
- [ ] Photographer receives monthly billing receipt
- [ ] Emails are mobile-responsive

### Files Likely Touched
- `src/lib/email/templates/commission-earned.tsx` (NEW)
- `src/lib/email/templates/billing-receipt.tsx` (NEW)
- `src/app/api/stripe/webhook/route.ts`

---

## Story 3.2: Warning & Alert Emails
**Size:** Small (1 session)
**Files:** 3-4 files

### Description
Build email templates for payment failures, suspension warnings, and account alerts.

### Tasks
- [ ] Create payment failure warning template
- [ ] Create account suspension warning template
- [ ] Create gallery access suspended template
- [ ] Wire up to webhook events
- [ ] Test delivery

### Acceptance Criteria
- [ ] Users warned about failed payments
- [ ] Users warned before suspension
- [ ] All alerts delivered reliably

### Files Likely Touched
- `src/lib/email/templates/payment-warning.tsx` (NEW)
- `src/lib/email/templates/suspension-warning.tsx` (NEW)
- `src/app/api/stripe/webhook/route.ts`

---

## Story 3.3: Email System Testing
**Size:** Small (1 session)
**Files:** 1-2 files

### Description
Test all email templates and verify delivery rates.

### Tasks
- [ ] Send test of each email template
- [ ] Verify mobile rendering
- [ ] Check spam score
- [ ] Verify all links work
- [ ] Document delivery rate (target >95%)

### Acceptance Criteria
- [ ] All templates render correctly
- [ ] All links functional
- [ ] Delivery rate >95%

### Files Likely Touched
- Testing only - possibly minor template fixes

---

## Story 3.4: Milestone Reminder Photos & Automated Re-booking Emails
**Size:** Medium (1-2 sessions)
**Files:** 6-10 files
**Status:** 🔴 NOT STARTED

### Description
During gallery creation (directly after the sneak peek selection step), photographers select 1-4 **standout photos** from the gallery. These photos are used in automated reminder emails sent to the client at months 3, 6, 9, and 12. Each email features one of the selected photos and encourages the client to book another session with their photographer.

### Business Rules
1. **Photo selection:** Photographer picks 1-4 photos during gallery creation, immediately after sneak peek selection. Same UI pattern as sneak peeks.
2. **Email schedule:** Automated emails at months 3, 6, 9, 12 after gallery creation date.
3. **Photo rotation:** Each email uses a different photo (photo 1 at month 3, photo 2 at month 6, etc.). If fewer than 4 photos selected, cycle through them.
4. **Email tone:** Nostalgic/emotional. Example: "6 months ago, so beautiful! Time to schedule another session with {photographerName}."
5. **Photographer attribution:** Each email names the photographer and links to their booking (when booking page exists, per Epic 9C).
6. **Opt-out:** Client can unsubscribe from reminder emails without affecting billing emails.

### Tasks
- [ ] Add `is_milestone_photo` column to `gallery_photos` table (or `milestone_photos` array on `photo_galleries`)
- [ ] Create milestone photo selection UI step in gallery creation flow (after sneak peek step)
- [ ] Create `/api/gallery/[galleryId]/milestone-photos` endpoint
- [ ] Design 4 milestone email templates (months 3, 6, 9, 12) with photo embed
- [ ] Create `/api/cron/milestone-reminders` cron job to check and send emails on schedule
- [ ] Add milestone email tracking (sent dates, opened) to prevent duplicates
- [ ] Add email preference toggle for clients (opt-out of reminders)
- [ ] Update gallery creation flow to include milestone step after sneak peek

### Acceptance Criteria
- [ ] Photographer can select 1-4 milestone photos during gallery creation
- [ ] UI matches sneak peek selection pattern (same component, different label)
- [ ] Emails sent automatically at correct intervals (3, 6, 9, 12 months)
- [ ] Each email contains one milestone photo and photographer name
- [ ] Client can opt out of reminder emails
- [ ] No duplicate emails sent

### Email Copy Direction
- Month 3: "It's been 3 months since your session with {photographer}. Remember this moment? 📸"
- Month 6: "6 months ago, so beautiful! Time to schedule another session with {photographer}."
- Month 9: "Almost a year since {photographer} captured this. How much has changed?"
- Month 12: "One year ago today. Time for an anniversary session with {photographer}? 🎉"

### Files Likely Touched
- `src/app/photographer/galleries/create/page.tsx` or new step page
- `src/app/photographer/galleries/[id]/milestone-select/page.tsx` (NEW - similar to sneak-peek-select)
- `src/lib/email/milestone-templates.ts` (NEW)
- `src/app/api/cron/milestone-reminders/route.ts` (NEW)
- `src/app/api/gallery/[galleryId]/milestone-photos/route.ts` (NEW)
- `vercel.json` (add cron schedule)
- Database migration for milestone photo tracking

---

# EPIC 4: Onboarding Polish

**Priority:** 🟡 MEDIUM - Important for beta success
**Dependencies:** Epics 1-3 complete
**Estimated Stories:** 3

---

## Story 4.1: Photographer Onboarding Wizard
**Size:** Medium (1 session)
**Files:** 3-5 files

### Description
Create step-by-step onboarding for new photographers.

### Tasks
- [ ] Build onboarding wizard component
- [ ] Step 1: Welcome + Stripe Connect
- [ ] Step 2: Create first gallery
- [ ] Step 3: Invite first client
- [ ] Track completion progress
- [ ] Show wizard on first login

### Acceptance Criteria
- [ ] New photographers see wizard
- [ ] Steps guide through setup
- [ ] Progress persists across sessions
- [ ] Can skip but shows incomplete

### Files Likely Touched
- `src/components/onboarding/PhotographerWizard.tsx` (NEW)
- `src/app/photographer/dashboard/page.tsx`
- Database: `user_profiles.onboarding_complete`

---

## Story 4.2: Client Onboarding Flow
**Size:** Small (1 session)
**Files:** 2-3 files

### Description
Polish the client invitation acceptance and first-time experience.

### Tasks
- [ ] Improve invitation landing page
- [ ] Add welcome modal after signup
- [ ] Guide to payment setup (non-blocking)
- [ ] Show gallery preview before payment
- [ ] Clear next steps after payment

### Acceptance Criteria
- [ ] Client journey is smooth
- [ ] Can preview before paying
- [ ] Clear what to do at each step

### Files Likely Touched
- `src/app/invite/[token]/page.tsx`
- `src/components/client/WelcomeModal.tsx` (NEW)

---

## Story 4.3: Empty States & Help
**Size:** Small (1 session)
**Files:** 3-4 files

### Description
Add helpful empty states and contextual help throughout the app.

### Tasks
- [ ] Add empty state for "No galleries"
- [ ] Add empty state for "No clients"
- [ ] Add empty state for "No photos"
- [ ] Add tooltips for complex features
- [ ] Ensure all CTAs are clear

### Acceptance Criteria
- [ ] Empty states guide to next action
- [ ] Tooltips explain features
- [ ] No dead ends in UI

### Files Likely Touched
- `src/components/EmptyState.tsx` (NEW)
- Various dashboard pages

---

# EPIC 5: Beta Launch Preparation

**Priority:** 🟡 MEDIUM - Required for launch
**Dependencies:** Epics 1-4 complete
**Estimated Stories:** 3

---

## Story 5.1: Monitoring & Error Tracking
**Size:** Small (1 session)
**Files:** 2-3 files
**Status:** ✅ COMPLETE (Dec 17, 2025)

### Description
Set up error tracking and monitoring for production.

### Tasks
- [x] Create webhook monitoring cron job
- [x] Set up alerts for webhook failures (email to admin)
- [x] Add error boundaries to critical components (Story 6.3)
- [x] Configure ADMIN_EMAIL and CRON_SECRET env vars
- [x] Test alert delivery

### Acceptance Criteria
- [x] Webhook health monitored via cron
- [x] Critical errors trigger email alerts
- [x] Error boundaries catch UI crashes (via ErrorBoundary components)

### Files Created/Modified
- `src/app/api/cron/monitor-webhooks/route.ts` (NEW)
- `vercel.json` (added cron schedule - daily at 8 AM UTC)
- Env vars: ADMIN_EMAIL, CRON_SECRET added to Vercel

### Notes
Original plan called for Sentry; implemented webhook monitoring + email alerts instead.
Error boundaries were added in Story 6.3 (ErrorBoundary + RouteErrorBoundary components).

---

## Story 5.2: Support Documentation
**Size:** Small (1 session)
**Files:** Documentation only
**Status:** ✅ COMPLETE (Dec 17, 2025)

### Description
Create support documentation for beta photographers and clients.

### Tasks
- [x] Write photographer setup guide
- [x] Write client FAQ
- [x] Write troubleshooting guide
- [x] Add help links in app
- [x] Review all docs for accuracy

### Acceptance Criteria
- [x] Guides are complete and accurate
- [x] Accessible from app
- [x] Cover common questions

### Files Created/Modified
- `docs/support/PHOTOGRAPHER_GUIDE.md` (NEW)
- `docs/support/CLIENT_FAQ.md` (NEW)
- `docs/support/TROUBLESHOOTING.md` (NEW)
- `src/app/photographer/support/page.tsx` (NEW - photographer support page)
- `src/app/client/support/page.tsx` (fixed email address)
- `src/components/navigation.tsx` (added Support link to photographer nav)

---

## Story 5.3: Beta Launch Checklist
**Size:** Small (1 session)
**Files:** Testing & verification
**Status:** ✅ COMPLETE (Jan 4, 2026)

### Description
Final verification before inviting beta photographers.

### Tasks
- [x] Complete end-to-end test as photographer ✅ (System verified working in production)
- [x] Complete end-to-end test as client ✅ (System verified working in production)
- [x] Verify production environment variables ✅ (All env vars correct - app running)
- [x] Verify Stripe keys ready ✅ (Using TEST keys for beta - switch to LIVE for real payments later)
- [x] Verify email delivery working ✅ (Beta welcome email sent successfully)
- [x] Beta Tester System implemented ✅ (Jan 4, 2026 - coupon, webhook, welcome email)
- [x] Create beta outreach message ✅ (saved to `docs/BETA-OUTREACH-MESSAGE.md`)

### What Was Completed (Jan 4, 2026)
**Beta Tester System:**
- Stripe coupon `PHOTOVAULT_BETA_2026` created (100% off, 12 months)
- Webhook handler for `customer.discount.created` working
- Marks photographer as `is_beta_tester`, locks price at $22/month
- Beta welcome email template created and tested
- Production deployment verified

**Bugs Fixed:**
- Removed non-existent `email` column from `user_profiles` query
- Changed webhook to use `createServiceRoleClient` (bypasses RLS)

**Outreach Message:**
- Full version (email/LinkedIn) and short version (DMs) created
- Saved to `docs/BETA-OUTREACH-MESSAGE.md`

### Acceptance Criteria
- [x] All critical flows verified
- [x] Production ready for beta
- [x] Outreach message ready

### 🚀 READY FOR BETA LAUNCH

---

# EPIC 6: Customer Intelligence System (CIS)

**Priority:** 🔴 **PHASE 1 BLOCKS BETA** (6.1-6.3) → 🟢 Phase 2-4 POST-BETA
**Dependencies:** None for Phase 1; Phase 2+ requires beta event data
**Estimated Stories:** 10 (3 pre-beta, 5 during-beta, 2 future)
**Strategic Intent:** Transform PhotoVault from assumption-driven to data-driven. Track beta behavior from day one.
**Detailed Plan:** `docs/claude/plans/cis-customer-intelligence-system-plan.md`

**Execution Order:**
```
Epic 2.4 (finish) → CIS Phase 1 (6.1-6.3) → Epic 5 (Beta Prep) → 🚀 BETA → CIS Phase 2-4
```

---

## Story 6.1: PostHog Foundation
**Size:** Small-Medium (4-6 hours)
**Files:** 6-8 files
**Status:** ✅ COMPLETE (Dec 14, 2025)
**Phase:** 1a - **BLOCKING BETA**
**Commit:** `0ca798c feat(analytics): Add PostHog analytics foundation (Story 6.1)`

### Description
Install and configure PostHog analytics with BOTH client-side and server-side tracking. Server-side is critical because ad blockers kill 30%+ of client-side events.

### Tasks
- [ ] Install `posthog-js` (client) and `posthog-node` (server) packages
- [ ] Create `src/lib/analytics.ts` - client-side initialization, identify, track, reset
- [ ] Create `src/lib/analytics-server.ts` - server-side tracking for critical events
- [ ] Create `src/types/analytics.ts` - strict TypeScript types for all events
- [ ] Add PostHog environment variables (NEXT_PUBLIC_POSTHOG_KEY, POSTHOG_API_KEY)
- [ ] Wrap app with PostHog provider in root layout
- [ ] Add `identifyUser()` call after authentication in AuthContext
- [ ] Add `resetAnalytics()` call on logout
- [ ] Configure: autocapture ON, session recording OFF (privacy), respect_dnt ON
- [ ] Verify events in PostHog Live Events dashboard

### Critical: Server-Side Events (ad blockers can't block)
- `photographer_signed_up`, `photographer_connected_stripe`
- `payment_completed`, `payment_failed`
- `photographer_churned`, `client_churned`

### Acceptance Criteria
- [ ] PostHog receiving `$pageview` events (client-side)
- [ ] Server-side events firing from API routes
- [ ] Users identified after login with properties (user_type, signup_date, stripe_connected)
- [ ] `trackEvent()` (client) and `trackServerEvent()` (server) both working
- [ ] Works in production (Vercel)

### Files Likely Touched
- `package.json`, `src/lib/analytics.ts` (NEW), `src/lib/analytics-server.ts` (NEW)
- `src/types/analytics.ts` (NEW), `src/app/layout.tsx`, `src/contexts/AuthContext.tsx`
- `.env.local`, `.env.example`, `VERCEL-ENV-SETUP.md`

---

## Story 6.2: Core Event Tracking
**Size:** Medium (1-2 sessions)
**Files:** 14 files modified
**Status:** ✅ COMPLETE (Dec 14, 2025)
**Phase:** 1b - **BLOCKING BETA**

### Description
Implement core journey event tracking for photographers and clients. These events form the conversion funnel.

### What Was Implemented (Dec 14, 2025)

**New Files Created (3):**
- `src/lib/analytics/helpers.ts` - Server-side helper functions (isFirstTime, calculateTimeFromSignup)
- `src/lib/analytics/client-helpers.ts` - Client-side helper functions
- `src/app/api/analytics/track/route.ts` - Server-side tracking API for client components

**Files Modified (11):**
- `src/contexts/AuthContext.tsx` - photographer_signed_up (via API)
- `src/app/photographers/onboarding/page.tsx` - started/completed_onboarding
- `src/app/api/stripe/connect/callback/route.ts` - photographer_connected_stripe
- `src/app/photographer/galleries/create/page.tsx` - photographer_created_gallery
- `src/app/api/v1/upload/process/route.ts` - photographer_uploaded_first_photo
- `src/app/api/webhooks/stripe/route.ts` - 4 events: client_created_account, client_payment_completed, photographer_received_first_payment, client_payment_failed
- `src/app/api/stripe/gallery-checkout/route.ts` - client_started_payment
- `src/app/gallery/[galleryId]/page.tsx` - gallery_viewed, client_viewed_gallery, photo_favorited
- `src/app/api/gallery/download/route.ts` - client_downloaded_photo

**Events Implemented (15 of 18):**
| Event | Type | Location |
|-------|------|----------|
| photographer_signed_up | Server | AuthContext → /api/analytics/track |
| photographer_started_onboarding | Client | onboarding/page.tsx |
| photographer_completed_onboarding | Client | onboarding/page.tsx |
| photographer_connected_stripe | Server | connect/callback/route.ts |
| photographer_created_gallery | Client | galleries/create/page.tsx |
| photographer_uploaded_first_photo | Server | upload/process/route.ts |
| photographer_received_first_payment | Server | webhooks/stripe/route.ts |
| client_created_account | Server | webhooks/stripe/route.ts |
| client_viewed_gallery | Client | gallery/[id]/page.tsx |
| client_started_payment | Server | gallery-checkout/route.ts |
| client_payment_completed | Server | webhooks/stripe/route.ts |
| client_payment_failed | Server | webhooks/stripe/route.ts |
| client_downloaded_photo | Server | gallery/download/route.ts |
| gallery_viewed | Client | gallery/[id]/page.tsx |
| photo_favorited | Client | gallery/[id]/page.tsx |

**Deferred (features don't exist yet):**
- photographer_invited_client (no invite UI)
- photographer_skipped_onboarding (no skip button)
- client_shared_gallery (share feature not built)

### QA Critic Fixes Applied
- ✅ Fixed first-time flag logic (count BEFORE, not AFTER)
- ✅ Added helper functions for DRY code
- ✅ Server-side tracking for all critical funnel events (ad-blocker proof)

### Acceptance Criteria
- [x] All photographer journey events firing with properties (7/9 - 2 deferred)
- [x] All client journey events firing with properties (6/8 - 2 deferred)
- [x] Server-side events for payment flows (bypass ad blockers)
- [x] Funnel visible: Signup → Onboarding → Stripe → Gallery → Client → Payment

### Files Touched
- `src/lib/analytics/helpers.ts` (NEW)
- `src/lib/analytics/client-helpers.ts` (NEW)
- `src/app/api/analytics/track/route.ts` (NEW)
- `src/contexts/AuthContext.tsx`
- `src/app/photographers/onboarding/page.tsx`
- `src/app/api/stripe/connect/callback/route.ts`
- `src/app/photographer/galleries/create/page.tsx`
- `src/app/api/v1/upload/process/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/api/stripe/gallery-checkout/route.ts`
- `src/app/gallery/[galleryId]/page.tsx`
- `src/app/api/gallery/download/route.ts`

---

## Story 6.3: Friction & Warning Events
**Size:** Small (1 session)
**Files:** 12 files
**Status:** ✅ COMPLETE (Dec 16, 2025)
**Phase:** 1c - **BLOCKING BETA**
**Commit:** `8599905 feat(analytics): Add friction & warning events (Story 6.3)`

### Description
Track friction points and warning signals for churn prevention and UX improvement.

### Tasks
- [x] Implement abandonment events:
  - `upload_abandoned`, `payment_abandoned`, `onboarding_abandoned`
- [x] Implement warning events:
  - `error_encountered` via ErrorBoundary + error logging API
- [x] Implement churn events:
  - `photographer_churned` (with tenure, revenue, client_count)
  - `client_churned` (with tenure, photographer_id, gallery_count)
- [x] Multi-level ErrorBoundary (root + route) preserves navigation
- [x] Error logging API with rate limiting (10/min per IP)
- [x] Supabase `error_logs` fallback table for ad-blocker cases
- [x] DB functions: `get_photographer_churn_stats()`, `get_client_churn_stats()`

### Acceptance Criteria
- [x] Abandonment events fire when user leaves mid-flow
- [x] Error events capture error type and context
- [x] Churn events include tenure and lifetime value data

### Files Created
- `database/error-logs-table.sql`
- `database/analytics-churn-functions.sql`
- `src/components/ErrorBoundary.tsx`
- `src/components/RouteErrorBoundary.tsx`
- `src/app/api/analytics/error/route.ts`
- `src/hooks/usePaymentAbandonmentTracking.ts`

### Files Modified
- `src/app/layout.tsx` - Added multi-level ErrorBoundaries
- `src/app/api/webhooks/stripe/route.ts` - Added async churn tracking
- `src/app/photographer/upload/page.tsx` - Upload abandonment tracking
- `src/app/photographers/onboarding/page.tsx` - Onboarding abandonment tracking

---

## Story 6.4: Feedback Database Schema
**Size:** Small (1 session)
**Files:** 1-2 files
**Status:** 🔴 NOT STARTED
**Phase:** 2a - POST-BETA

### Description
Create database tables for survey responses, micro-feedback, and churn exit interviews.

### Tasks
- [ ] Create `survey_responses` table
- [ ] Create `micro_feedback` table
- [ ] Create `churn_feedback` table
- [ ] Create `daily_metrics` table (dashboard caching)
- [ ] Add RLS policies (users insert own, admin reads all)
- [ ] Run migration in Supabase

### Acceptance Criteria
- [ ] All four tables created with proper RLS
- [ ] Migration documented in database/ folder

### Files Likely Touched
- `database/migrations/cis-feedback-schema.sql` (NEW)

---

## Story 6.5: Survey Components & Collection
**Size:** Medium (1-2 sessions)
**Files:** 6-8 files
**Status:** 🔴 NOT STARTED
**Phase:** 2b - POST-BETA

### Description
Build survey components for post-onboarding, post-first-payment, and churn exit surveys.

### Tasks
- [ ] Create `SurveyModal`, `PostOnboardingSurvey`, `PostFirstPaymentSurvey`, `ChurnExitSurvey`
- [ ] Create `/api/surveys/submit` endpoint
- [ ] Add trigger logic (24h after onboarding, 1h after payment, before cancel)
- [ ] Track survey events, implement skip tracking

### Acceptance Criteria
- [ ] Surveys trigger at correct times
- [ ] Responses stored in database
- [ ] Don't show after completion or 2 skips

### Files Likely Touched
- `src/components/surveys/*` (NEW), `src/app/api/surveys/submit/route.ts` (NEW)
- `src/hooks/useSurveyTrigger.ts` (NEW)

---

## Story 6.6: Micro-Feedback Widgets
**Size:** Small (1 session)
**Files:** 4-5 files
**Status:** 🔴 NOT STARTED
**Phase:** 2c - POST-BETA

### Description
Create lightweight micro-feedback widgets (thumbs up/down) at key moments.

### Tasks
- [ ] Create `MicroFeedback` component
- [ ] Create `/api/feedback/micro` endpoint
- [ ] Add to: upload complete, gallery first view, client invite sent
- [ ] Implement 25% sampling

### Acceptance Criteria
- [ ] Widget displays, negative expands for comment
- [ ] Feedback stored and tracked

### Files Likely Touched
- `src/components/feedback/MicroFeedback.tsx` (NEW)
- `src/app/api/feedback/micro/route.ts` (NEW)

---

## Story 6.7: Intelligence Dashboard Foundation
**Size:** Medium (1-2 sessions)
**Files:** 4-6 files
**Status:** 🔴 NOT STARTED
**Phase:** 3a - POST-BETA (requires event data)

### Description
Build founder-facing intelligence dashboard with health metrics, funnels, and feedback.

### Tasks
- [ ] Create `/admin/intelligence` page
- [ ] Create `CustomerIntelligenceService`
- [ ] Implement health metrics (activation, time-to-value, conversion, churn) with RAG colors
- [ ] Implement funnel visualization
- [ ] Add recent feedback section

### Acceptance Criteria
- [ ] Dashboard at `/admin/intelligence`
- [ ] Health metrics with color indicators
- [ ] Funnel with conversion rates
- [ ] Loads in <3 seconds

### Files Likely Touched
- `src/app/admin/intelligence/page.tsx` (NEW)
- `src/lib/server/customer-intelligence-service.ts` (NEW)
- `src/app/api/admin/intelligence/route.ts` (NEW)

---

## Story 6.8: Alerts & Health Monitoring
**Size:** Small (1 session)
**Files:** 3-4 files
**Status:** 🔴 NOT STARTED
**Phase:** 3b - POST-BETA

### Description
Implement automated alerts for critical events (inactive users, payment failures, churn, feedback spikes).

### Tasks
- [ ] Create alert system with thresholds
- [ ] Add alerts section to dashboard
- [ ] Create `/api/cron/health-check`
- [ ] Email notifications for critical alerts

### Acceptance Criteria
- [ ] Alerts on dashboard and via email
- [ ] Cron job runs reliably

### Files Likely Touched
- `src/lib/server/alert-service.ts` (NEW)
- `src/app/api/cron/health-check/route.ts` (NEW)
- `vercel.json`

---

## Story 6.9: Cohort Analysis & A/B Testing
**Size:** Medium (1 session)
**Status:** ⏸️ FUTURE
**Phase:** 4a - 30+ days after beta

### Description
Cohort analysis and A/B testing via PostHog feature flags.

*Details deferred until 30+ days of event data collected.*

---

## Story 6.10: Predictive Churn Model
**Size:** Medium (1 session)
**Status:** ⏸️ FUTURE
**Phase:** 4b - 60+ days after beta

### Description
Churn risk scoring based on behavioral signals.

*Details deferred until 60+ days of data and sufficient churn samples.*

---

# PHASE 2: POST-BETA EXPANSION
# ================================
# Reference: Stone Fence Brain → 1_VENTURES/PhotoVault/PHOTOVAULT_FUTURE_FEATURES_ARCHIVE.md

---

# EPIC 7: Photographer Directory (PHASE 2 - FIRST PRIORITY)

**Priority:** 🟢 PHASE 2 - Build immediately after beta stabilizes
**Dependencies:** Beta launch successful, 10+ active photographers
**Estimated Stories:** 6 (3 complete, 3 remaining)
**Strategic Intent:** "Pre-Shoot vs Post-Shoot" - competitors only do Post-Shoot (gallery delivery). PhotoVault owns Pre-Shoot (location scouting, permits).
**North Star:** "1/8 of photographers in 15 cities saying 'PhotoVault' once a week"

### What's Already Built (as of Feb 2026)

**Database (COMPLETE):**
- 5 tables: `locations`, `location_attributes`, `location_business_intelligence`, `photographer_profiles`, `reviews`
- RLS policies (public read, system write)
- Performance indexes on city/state, attribute_type, username
- Schema file: `database/directory-schema.sql`

**Routes & Pages (COMPLETE):**
- `/directory` — Homepage with featured locations, city browsing, hero section
- `/directory/[city]` — City-specific location listing with search + permit filters
- `/directory/[city]/[location_slug]` — Full location detail with permits, tips, business intelligence
- `/directory/photographers` — Photographer listing page (stub, needs UI)
- `/directory/photographers/[username]` — Individual photographer profile page

**Components (11 BUILT):**
DirectoryHeader, LocationGrid, LocationCard, LocationFilters, LocationSearch, LocationSkeleton, PermitBadge, PermitInfoBox, AttributeBadges, PhotographerCard, ProfileHeader

**SEO (COMPLETE - Feb 2026):**
- Metadata + OG + canonical on all directory pages
- JSON-LD (Place + BreadcrumbList) on location pages
- Dynamic generateMetadata on photographer profiles
- All directory pages in sitemap with proper priorities

**Types:** `src/types/directory.ts` — Location, LocationAttribute, LocationBusinessIntelligence, LocationWithDetails, FilterState, PermitStatus

---

## Story 7.1: Directory Database & Schema
**Size:** Medium (1 session)
**Status:** ✅ COMPLETE

### What Was Built
- [x] Created `locations` table (name, slug, city, state, cover image)
- [x] Created `location_attributes` table (type/value pairs for filtering)
- [x] Created `location_business_intelligence` table (permits, costs, rules, seasonal info, insider tips)
- [x] Created `photographer_profiles` table (username, business_name, bio, website, profile_image, founding/featured flags)
- [x] Created `reviews` table (ratings 1-5, review text)
- [x] Set up RLS policies (public read, system write)
- [x] Added performance indexes

### Files Created
- `database/directory-schema.sql`
- `src/types/directory.ts`

---

## Story 7.2: Directory Pages & Components
**Size:** Medium (1 session)
**Status:** ✅ COMPLETE

### What Was Built
- [x] Directory homepage `/directory` with featured locations + city browsing
- [x] City pages `/directory/[city]` with search + permit filter
- [x] Location detail pages `/directory/[city]/[location_slug]` with permit info, business intelligence, insider tips
- [x] Photographer listing page `/directory/photographers` (stub)
- [x] Photographer profile page `/directory/photographers/[username]`
- [x] 11 reusable components (LocationGrid, LocationCard, PermitBadge, etc.)
- [x] Mobile-responsive design

### Files Created
- `src/app/directory/page.tsx`
- `src/app/directory/[city]/page.tsx`
- `src/app/directory/[city]/[location_slug]/page.tsx`
- `src/app/directory/photographers/page.tsx`
- `src/app/directory/photographers/[username]/page.tsx`
- `src/components/directory/*.tsx` (11 components)

---

## Story 7.3: Directory SEO & Structured Data
**Size:** Medium (1 session)
**Status:** ✅ COMPLETE (Feb 15, 2026)

### What Was Built
- [x] Metadata (title, description, OG) on all directory pages
- [x] Canonical tags on city + location pages
- [x] JSON-LD structured data: Place + BreadcrumbList on location pages
- [x] Dynamic generateMetadata on photographer profiles (pulls from DB)
- [x] All directory pages in sitemap.xml with proper priorities
- [x] Fixed domain from photovault.com → photovault.photo in photographers layout
- [x] Fixed schema type from LocalBusiness → SoftwareApplication on /photographers

### Files Modified
- `src/app/directory/[city]/page.tsx`
- `src/app/directory/[city]/[location_slug]/page.tsx`
- `src/app/directory/photographers/page.tsx`
- `src/app/directory/photographers/[username]/page.tsx`
- `src/app/photographers/layout.tsx`
- `src/app/sitemap.ts`

---

## Story 7.4: Location Data Seeding - Wisconsin MVP
**Size:** Large (2-3 sessions — expanded with data accuracy fixes + page redesign)
**Status:** ✅ COMPLETE (2026-02-23)
**Blocking:** None — directory pages now render with real data

### Description
Seed the location database with Wisconsin photo spots + fix data accuracy + redesign location detail pages. Extended from original scope to include data corrections from Claude Desktop review and full page template redesign.

### Tasks
- [x] Create seed data module with 30 Madison-area locations (scripts/seed-madison-locations-data.ts)
- [x] Fix critical data inaccuracies (Arboretum, Olbrich, Pope Farm, Picnic Point, Memorial Union Terrace, James Madison Park)
- [x] Add 11 new intelligence fields (crowd_level, accessibility, parking, drone_policy, amenities, permit_personal, permit_pro, admission_notes, booking_info, last_verified_at, nearby_location_slugs)
- [x] Apply Supabase migration for new columns
- [x] Update TypeScript types + add Prohibited permit status
- [x] Build 4 new components (QuickStatsBar, IntelCards, NearbyLocations, PhotoVaultCTA)
- [x] Redesign location detail page template with semantic tokens
- [x] Write 28 tests (TDD — all passing)
- [x] Run seed against Supabase production (30/30 success)
- [x] Add safety guards to seed script (--dry-run, --confirm-production)
- [x] Add Directory link to landing page header, public nav, and footers
- [ ] Add cover images for featured locations (deferred — no images yet)

### Acceptance Criteria
- [x] 30 Madison-area locations visible in directory with accurate data
- [x] Each has permit info, seasonal tips, quick stats, nearby locations
- [x] Location detail pages fully redesigned with new layout
- [ ] 50+ Wisconsin locations (Milwaukee, Door County pending — Story 7.7)

### Files Touched
- `scripts/seed-madison-locations-data.ts` (NEW — pure data module)
- `scripts/seed-madison-locations.ts` (MODIFIED — imports data, safety guards)
- `src/types/directory.ts` (MODIFIED — new fields, Prohibited status)
- `src/app/directory/[city]/[location_slug]/page.tsx` (REWRITTEN — full redesign)
- `src/components/directory/QuickStatsBar.tsx` (NEW)
- `src/components/directory/IntelCards.tsx` (NEW)
- `src/components/directory/NearbyLocations.tsx` (NEW)
- `src/components/directory/PhotoVaultCTA.tsx` (NEW)
- `src/components/directory/PermitBadge.tsx` (MODIFIED — Prohibited status)
- `src/components/directory/AttributeBadges.tsx` (MODIFIED — highlight variant)
- `src/components/landing/LandingHeader.tsx` (MODIFIED — Directory nav link)
- `src/components/navigation.tsx` (MODIFIED — Directory links)
- `vitest.config.ts` (MODIFIED — react plugin)
- 5 test files (NEW)

---

## Story 7.5: Photographer Directory Listing & Search
**Size:** Medium (1 session)
**Status:** 🔴 NOT STARTED

### Description
The photographer listing page (`/directory/photographers`) is currently a stub. Build out the full listing with search, filtering, and cards. The PhotographerCard component already exists.

### Tasks
- [ ] Build photographer listing UI on `/directory/photographers`
- [ ] Add search by name, specialty, location
- [ ] Add filters (specialty: wedding/portrait/event, city, featured)
- [ ] Display PhotographerCard grid with pagination
- [ ] Auto-populate `photographer_profiles` from existing `photographers` table on signup
- [ ] Add "Claim Profile" or "Join Directory" CTA for photographers not yet listed

### Acceptance Criteria
- [ ] Visitors can browse and search photographers
- [ ] Photographer cards link to profile pages
- [ ] Search is fast and SEO-friendly
- [ ] New photographers auto-get a directory profile

### Files Likely Touched
- `src/app/directory/photographers/page.tsx` (rewrite from stub)
- `src/app/api/directory/photographers/route.ts` (NEW - search API)

---

## Story 7.6: Directory Pro & Monetization
**Size:** Small (1 session)
**Status:** 🔴 NOT STARTED

### Description
Implement Directory Pro tier and gear review affiliate section.

### Tasks
- [ ] Create Directory Pro tier ($29/month) - FREE for active PhotoVault users
- [ ] Add premium profile features (featured placement, more photos)
- [ ] Create gear review section with affiliate links
- [ ] Track affiliate revenue
- [ ] Add upgrade prompts for free users

### Acceptance Criteria
- [ ] Active PhotoVault users get free Directory Pro
- [ ] Non-users can subscribe to Directory Pro
- [ ] Gear reviews generate affiliate revenue

---

# EPIC 7B: SEO Content & Articles

**Priority:** 🟢 PHASE 2 - Run in parallel with directory data seeding
**Dependencies:** SEO foundation complete (done Feb 2026)
**Estimated Stories:** 4
**Strategic Intent:** Build topical authority for "photographer passive income", "photo storage", and "Pixieset alternative" keyword clusters. Feed AI answer engines (ChatGPT, Perplexity, Gemini) with PhotoVault as the cited source.
**Reference:** `Stone-Fence-Brain/PHOTOVAULT_SEO_GEO_CONTENT_ROADMAP.md`, `Stone-Fence-Brain/PHOTOVAULT_AEO_GRID.md`

---

## Story 7B.1: AEO Tier 1 Articles (Highest Priority)
**Size:** Medium (1-2 sessions)
**Status:** 🔴 NOT STARTED

### Description
Write 4 cornerstone articles targeting the highest-value AEO (Answer Engine Optimization) queries. These are the queries where PhotoVault has the best chance of being cited by AI tools.

### Articles (from AEO Grid Tier 1)
1. **"How photographers earn recurring revenue from completed work"** — Target: photographer passive income seekers
2. **"What happens to your photos when a storage service shuts down"** — Target: storage anxiety, positions PhotoVault's Orphan Protocol
3. **"How to preserve family photos after a death in the family"** — Target: emotional/legacy angle, positions Family Accounts
4. **"PhotoVault vs Pixieset: Photo delivery platform comparison"** — Target: competitor comparison, high commercial intent

### Tasks
- [ ] Write each article (1500-2500 words, SEO-optimized)
- [ ] Add Article JSON-LD schema to each
- [ ] Add BreadcrumbList schema
- [ ] Internal linking to /photographers, /directory, and each other
- [ ] Add to sitemap
- [ ] Publish to `/resources/[slug]`

### Acceptance Criteria
- [ ] 4 articles live with proper schema markup
- [ ] Each targets specific AEO queries from the grid
- [ ] Internal linking creates topical cluster

---

## Story 7B.2: Geo Content - Phase 2A (Milwaukee + Chicago)
**Size:** Medium (1 session)
**Status:** 🔴 NOT STARTED
**Dependencies:** Story 7.4 (Wisconsin data seeded first)

### Description
Expand geo content beyond Madison to Milwaukee and Chicago. Create city landing pages with unique content.

### Tasks
- [ ] Seed 30+ Milwaukee photo locations
- [ ] Seed 30+ Chicago photo locations
- [ ] Write unique city guide content for each (not just location listings)
- [ ] Add photographer spotlights per city (when photographers join)
- [ ] Cross-link between city pages and resource articles

### Acceptance Criteria
- [ ] 3 cities live with 30+ locations each
- [ ] City pages have unique, useful content beyond location lists
- [ ] Cross-linking between cities and articles

---

## Story 7B.3: Phase 2B Resource Articles
**Size:** Medium (1-2 sessions)
**Status:** 🔴 NOT STARTED

### Description
Write 3 resource articles targeting the "photo storage" and "photo delivery" keyword clusters.

### Articles (from SEO Geo Content Roadmap Phase 2B)
1. **"The Complete Guide to Wedding Photo Storage and Preservation"** — Target: wedding photo storage keywords
2. **"How Professional Photo Delivery Works: A Client's Guide"** — Target: photo delivery platform keywords
3. **"Why Permanent Photo Storage Matters: Beyond the Cloud"** — Target: permanent storage, Google Photos alternatives

### Tasks
- [ ] Write each article (1500-2500 words)
- [ ] Add Article + FAQPage JSON-LD schema
- [ ] Internal linking to existing resources and /photographers
- [ ] Add to sitemap

### Acceptance Criteria
- [ ] 3 articles live (total 6 resource articles on site)
- [ ] Schema markup on all articles
- [ ] Internal linking forms content cluster with existing 3 articles

---

## Story 7B.4: Internal Linking Audit & Content Cluster
**Size:** Small (1 session)
**Status:** 🔴 NOT STARTED

### Description
Audit and strengthen internal linking between all content pages, directory pages, and landing pages. Create topical clusters that reinforce each other.

### Tasks
- [ ] Map all content pages and their current internal links
- [ ] Add cross-links: articles ↔ directory ↔ /photographers ↔ homepage
- [ ] Add "Related Articles" section to each resource page
- [ ] Add "Nearby Locations" section to city pages
- [ ] Submit updated sitemap to Google Search Console
- [ ] Verify no orphan pages (pages with zero internal links)

### Acceptance Criteria
- [ ] Every content page has 3+ internal links to other pages
- [ ] No orphan pages
- [ ] Sitemap submitted to GSC

---

# EPIC 8: Phone Dump & Client Stickiness (PHASE 2)

**Priority:** 🟢 PHASE 2 - After Directory
**Dependencies:** Directory launched, storage infrastructure solid
**Estimated Stories:** 3
**Strategic Intent:** "Let people put every damn photo they ever had in there. They'll never wanna stop paying $8 a month."

---

## Story 7.1: Personal Photo Upload UI
**Size:** Medium (1 session)

### Tasks
- [ ] Add "My Photos" section to client dashboard
- [ ] Build bulk upload UI (drag & drop, folder upload)
- [ ] Show upload progress and completion status
- [ ] Organize by date/album
- [ ] Distinguish from photographer-delivered galleries

### Acceptance Criteria
- [ ] Clients can upload personal phone photos
- [ ] Uploads organized separately from photographer galleries
- [ ] No additional charge (included in $8/month)

---

## Story 7.2: Phone Dump Mobile Integration
**Size:** Medium (1 session)

### Tasks
- [ ] Auto-backup integration design (for future mobile app)
- [ ] Desktop uploader tool (Electron or web-based)
- [ ] Handle duplicate detection
- [ ] Background upload queue

### Acceptance Criteria
- [ ] Clients can bulk upload from desktop
- [ ] Duplicates detected and skipped
- [ ] Foundation ready for mobile auto-backup

---

## Story 7.3: Storage Analytics & Limits
**Size:** Small (1 session)

### Tasks
- [ ] Show storage usage on client dashboard
- [ ] Monitor total platform storage costs
- [ ] Set up cost alerts for Nate
- [ ] Plan storage optimization (compression, tiering)

### Acceptance Criteria
- [ ] Clients see their storage usage
- [ ] Platform can monitor storage costs
- [ ] No hard limits (strategic decision)

---

# EPIC 9: Print Ordering - Pwinty Integration (PHASE 2)

**Priority:** 🟢 PHASE 2 - High margin, low effort
**Dependencies:** Gallery viewing stable
**Estimated Stories:** 5
**Revenue Split:** Photographer sets their own markup on top of lab costs. PhotoVault takes a platform cut (percentage TBD — research Pic-Time's model and industry norms before deciding). Photographer keeps the rest. This makes prints a photographer revenue stream, not just a client convenience.
**Pricing:** Lab wholesale cost + photographer markup + PhotoVault platform cut

---

## Story 8.1: Pwinty API Integration
**Size:** Medium (1 session)

### Tasks
- [ ] Set up Pwinty account and API keys
- [ ] Create print order service
- [ ] Build product catalog (sizes, prices)
- [ ] Implement order creation and tracking
- [ ] Handle shipping address collection

### Acceptance Criteria
- [ ] Can create print orders via Pwinty API
- [ ] Order tracking works
- [ ] Products have correct pricing (lab cost + photographer markup + platform cut)
- [ ] Photographer can set their own markup per product

---

## Story 8.2: Print Ordering UI
**Size:** Medium (1 session)

### Tasks
- [ ] Add "Order Print" button on photos
- [ ] Build size/quantity selector
- [ ] Create cart and checkout flow
- [ ] Integrate with Stripe for payment
- [ ] Show order confirmation and tracking

### Acceptance Criteria
- [ ] Clients can order prints from any photo
- [ ] Checkout flow is smooth
- [ ] Order confirmation sent via email

---

## Story 8.3: Print Order Management
**Size:** Small (1 session)

### Tasks
- [ ] Build order history view for clients
- [ ] Create admin view for all orders
- [ ] Handle refunds/issues
- [ ] Track print revenue in dashboard (photographer markup + PhotoVault cut)
- [ ] Photographer print earnings visible in commission dashboard
- [ ] Stripe Connect payout for photographer's share of print markup

### Acceptance Criteria
- [ ] Clients can view order history
- [ ] Admin can manage orders
- [ ] Revenue tracked separately

---

## Story 8.4: Album Design Tool
**Size:** Medium (1-2 sessions)
**Status:** 🔴 NOT STARTED
**Dependencies:** Print store working (Story 8.1-8.3)

### Description
Built-in album design tool where photographers create album layouts and send to clients for approval. Albums are fulfilled through print store labs. Pixieset has this and photographers use it to drive print revenue with minimal effort.

### Tasks
- [ ] Build album layout editor (5-8 preset templates: spread, collage, single-image)
- [ ] Photo drag-and-drop into album slots
- [ ] Client album approval flow (share link, client approves/requests changes)
- [ ] Integrate with print fulfillment (Pwinty or lab partner)
- [ ] Album pricing (photographer sets markup)

### Acceptance Criteria
- [ ] Photographer can design album from gallery photos
- [ ] Client can review and approve album
- [ ] Approved album can be ordered through print store
- [ ] Revenue tracked in photographer dashboard

---

## Story 8.5: Discount Codes for Print Store
**Size:** Small (1 session)
**Status:** 🔴 NOT STARTED
**Dependencies:** Print store working (Story 8.1-8.3)

### Description
Allow photographers to create promo codes for their print store — percentage or dollar discounts, expiration dates, usage limits. Standard e-commerce feature.

### Tasks
- [ ] Create `discount_codes` table (code, type, value, expiry, max_uses, photographer_id)
- [ ] Build discount code management UI for photographers
- [ ] Add promo code input to print checkout flow
- [ ] Validate and apply discounts at checkout
- [ ] Track discount usage

### Acceptance Criteria
- [ ] Photographers can create/manage discount codes
- [ ] Clients can enter codes at print checkout
- [ ] Discounts applied correctly to order total

---

# EPIC 9B: Gallery Experience Enhancement (PHASE 2-3)

**Priority:** 🟢 PHASE 2-3 — Client proofing is the #1 feature gap vs Pixieset
**Dependencies:** Gallery viewing stable
**Estimated Stories:** 2
**Strategic Intent:** Close the gallery experience gap with Pixieset. Client proofing and video hosting are the two most-asked-about missing features.

---

## Story 9B.1: Client Proofing & Photo Comments
**Size:** Large (2-3 sessions)
**Status:** 🔴 NOT STARTED

### Description
Add a proofing workflow to galleries. Clients can leave comments on individual photos, create selection lists, and approve final selections. This is table stakes for delivery platforms — Pixieset, Pic-Time, and ShootProof all have it.

### Tasks
- [ ] Create `photo_comments` table (photo_id, user_id, comment_text, created_at)
- [ ] Create `selection_lists` table (gallery_id, user_id, name, status)
- [ ] Create `selection_list_photos` table (list_id, photo_id)
- [ ] Add comment bubble icon on gallery photos (click to add/view comments)
- [ ] Build selection list creation UI ("Create Favorites List" / "Create Selection")
- [ ] Add photographer view: see all client comments + selections per gallery
- [ ] Email notification when client submits a selection or comments
- [ ] Download selected photos as ZIP
- [ ] RLS policies: clients comment on their galleries, photographers see all comments on their galleries

### Acceptance Criteria
- [ ] Client can comment on individual photos
- [ ] Client can create named selection lists and add photos
- [ ] Photographer sees comments and selections in dashboard
- [ ] Photographer notified when client submits selections
- [ ] Selected photos downloadable as ZIP

---

## Story 9B.2: Basic Video Hosting
**Size:** Medium (1-2 sessions)
**Status:** 🔴 NOT STARTED

### Description
Support video files in galleries. Wedding and portrait photographers increasingly deliver highlight reels and behind-the-scenes clips alongside photos. Pixieset offers 30 min to 5 hours of video by tier.

### Tasks
- [ ] Add video file support to upload pipeline (MP4, MOV — max 2GB per file)
- [ ] Create video player component for gallery view (HTML5 video with controls)
- [ ] Generate video thumbnails for gallery grid view
- [ ] Update storage tracking to include video size
- [ ] Set reasonable video limits (e.g., 1 hour per gallery, 5 hours per photographer account)
- [ ] Update desktop app to handle video uploads

### Acceptance Criteria
- [ ] Photographers can upload video files alongside photos
- [ ] Videos play inline in gallery view
- [ ] Video thumbnails appear in gallery grid
- [ ] Storage usage accounts for video size
- [ ] Desktop app handles video upload

---

# EPIC 9C: Photographer Workflow Tools (PHASE 2)

**Priority:** 🟢 PHASE 2 — Lightroom plugin is the #1 workflow gap vs competitors
**Dependencies:** Upload API stable
**Estimated Stories:** 3
**Strategic Intent:** Reduce friction in the photographer's delivery workflow. Every competitor has a Lightroom plugin. Questionnaires and booking are lighter CRM features that don't require the full White-Label CRM investment.

---

## Story 9C.1: Lightroom Publish Service Plugin
**Size:** Medium (2 sessions)
**Status:** 🔴 NOT STARTED

### Description
Build an Adobe Lightroom Classic plugin that lets photographers publish photos directly from Lightroom to PhotoVault galleries. Uses the Adobe Lightroom SDK (Lua). Every competitor (Pixieset, Pic-Time, ShootProof, CloudSpot) has one.

### Tasks
- [ ] Set up Lightroom SDK development environment (Lua)
- [ ] Implement OAuth authentication flow (LR plugin → PhotoVault API)
- [ ] Build Publish Service provider (list galleries, create gallery, upload photos)
- [ ] Extend `/api/v1/upload/` endpoints for single-photo uploads (currently ZIP-only for desktop)
- [ ] Handle metadata sync (title, caption, keywords from LR → PhotoVault)
- [ ] Build plugin settings dialog (API key, account info, default gallery)
- [ ] Package as .lrplugin for distribution
- [ ] Test with Lightroom Classic (latest version)
- [ ] Create download page on photovault.photo/resources/lightroom-plugin

### Acceptance Criteria
- [ ] Photographer installs plugin in Lightroom Classic
- [ ] Can authenticate with PhotoVault account
- [ ] Can select photos in LR and publish to existing or new gallery
- [ ] Metadata (title, caption) syncs to PhotoVault
- [ ] Plugin available for download from PhotoVault website

### Technical Notes
- Lightroom SDK uses Lua scripting language
- Plugin type: Publish Service (appears in Library module)
- API: Extend existing `/api/v1/upload/` or create `/api/v1/lightroom/` endpoints
- Auth: API key or OAuth token stored in plugin preferences
- Distribution: Direct download (.lrplugin) + potentially Adobe Exchange marketplace

---

## Story 9C.2: Pre-Shoot Client Questionnaires
**Size:** Small-Medium (1 session)
**Status:** 🔴 NOT STARTED

### Description
Let photographers create and send pre-shoot questionnaires to clients. Lighter than full CRM — just forms that collect info before a session. Common questions: location preferences, outfit plans, must-have shots, family member names, timeline.

### Tasks
- [ ] Create `questionnaire_templates` table (photographer_id, name, questions JSON)
- [ ] Create `questionnaire_responses` table (template_id, client_id, responses JSON, submitted_at)
- [ ] Build template builder UI (add/remove questions, question types: text, select, multi-select, date)
- [ ] Build client-facing questionnaire page (public link, no login required)
- [ ] Email notification when client submits response
- [ ] Photographer can view responses in dashboard
- [ ] 3-5 pre-built templates (Wedding, Portrait, Newborn, Family, Senior)

### Acceptance Criteria
- [ ] Photographer can create questionnaire templates
- [ ] Client receives link and fills out questionnaire (no login needed)
- [ ] Photographer sees responses in dashboard
- [ ] Pre-built templates available as starting points

---

## Story 9C.3: Booking Page & Lead Capture
**Size:** Medium (1-2 sessions)
**Status:** 🔴 NOT STARTED

### Description
Give each photographer a simple public booking page where potential clients can see services, check availability, and submit inquiries. Lighter than full CRM — a lead capture form with optional calendar integration. Pixieset has this in their Studio Manager.

### Tasks
- [ ] Create `/photographer/[username]/book` public page
- [ ] Build service listing (photographer defines packages: name, description, price, duration)
- [ ] Create `booking_inquiries` table (photographer_id, client_name, email, phone, service, preferred_date, message)
- [ ] Build inquiry form (name, email, service interest, preferred date, message)
- [ ] Email notification to photographer on new inquiry
- [ ] Inquiry management UI in photographer dashboard (new, responded, booked, archived)
- [ ] Optional: Embed inquiry form on external website via iframe or script tag

### Acceptance Criteria
- [ ] Photographer has a public booking page
- [ ] Potential clients can submit booking inquiries
- [ ] Photographer receives email + dashboard notification
- [ ] Can manage inquiry status (respond, book, archive)

---

# EPIC 10: AI Enhancement Suite + Gallery Search (PHASE 3)

**Priority:** 🟢 PHASE 3 - After Phase 2 revenue flowing
**Dependencies:** Platform stable, print ordering working
**Estimated Stories:** 6
**Pricing:** Enhancements: minimum $1.29 per enhancement, or API cost x 1.50 (whichever higher). Gallery search: included in subscription (value-add).
**Revenue Split:** Enhancement revenue 100% to PhotoVault. Gallery search included in client subscription.

---

## Story 10.1: AI Infrastructure Setup
**Size:** Medium (1 session)

### Tasks
- [ ] Choose AI provider (Replicate, RunPod, Google Vertex)
- [ ] Create API wrapper for AI calls
- [ ] Build job queue for async processing
- [ ] Implement result storage (before/after)
- [ ] Create billing tracking system

### Acceptance Criteria
- [ ] AI calls work reliably
- [ ] Jobs processed asynchronously
- [ ] Results stored and retrievable

---

## Story 10.2: Watermark Preview System
**Size:** Medium (1 session)

### Tasks
- [ ] Run full AI enhancement on request
- [ ] Apply watermark overlay to result
- [ ] Show watermarked before/after preview
- [ ] Payment unlocks clean version
- [ ] Auto-delete unpaid previews after 24 hours

### Acceptance Criteria
- [ ] Customers see preview before paying
- [ ] Payment removes watermark instantly
- [ ] No revenue leakage from unpaid previews

---

## Story 10.3: Basic Enhancements (Color, Sharpening, Background)
**Size:** Medium (1 session)

### Tasks
- [ ] Integrate color correction model
- [ ] Integrate sharpening model
- [ ] Integrate background removal model
- [ ] Build enhancement selection UI
- [ ] Implement pay-per-use billing ($1.29 each)

### Acceptance Criteria
- [ ] Three enhancement types available
- [ ] Billing works correctly
- [ ] Results are high quality

---

## Story 10.4: Style Transfer & Collages
**Size:** Medium (1 session)

### Tasks
- [ ] Integrate style transfer (5 preset styles)
- [ ] Build collage generator (simple layouts)
- [ ] Create style preview gallery
- [ ] Implement pricing ($2.50 for style, $1.29 for collage)

### Acceptance Criteria
- [ ] Style transfer produces good results
- [ ] Collage generator works with multiple photos
- [ ] Pricing applied correctly

---

## Story 10.5: AI Gallery Search (Face Recognition + Semantic Search)
**Size:** Large (2-3 sessions)
**Status:** 🔴 NOT STARTED
**Dependencies:** AI Infrastructure (Story 10.1)

### Description
AI-powered search within galleries so clients can find specific photos without scrolling through hundreds of images. Two capabilities:

1. **Face recognition:** Clients/guests find photos of themselves or specific people. Group photos by person. Critical for weddings where guests want their own photos.
2. **Semantic/free-text search:** Clients search by description ("first dance", "cake cutting", "group photo", "outdoor portraits"). Uses CLIP or similar vision-language model to match text queries to photo content.

This is a major competitive feature — Pic-Time has it, Pixieset does not. Adds significant client-facing value and differentiates PhotoVault from basic gallery platforms.

### Tasks
- [ ] Choose face recognition provider (AWS Rekognition, Google Vision, or open-source like InsightFace)
- [ ] Choose vision-language model for semantic search (CLIP, OpenCLIP, or managed API)
- [ ] Build face indexing pipeline (run on gallery upload, store face embeddings)
- [ ] Build semantic embedding pipeline (generate CLIP embeddings per photo on upload)
- [ ] Create search UI in gallery view (search bar + face filter chips)
- [ ] Face clustering: auto-group photos by detected person
- [ ] "Find my photos" flow for wedding guests (upload selfie → find matching photos)
- [ ] Handle privacy: opt-out for face recognition, data retention policies
- [ ] Performance: index large galleries (500+ photos) without blocking upload

### Acceptance Criteria
- [ ] Clients can search gallery by text description and get relevant results
- [ ] Clients can filter gallery by person (face recognition)
- [ ] Wedding guests can find their own photos via selfie match
- [ ] Search works on galleries with 500+ photos
- [ ] Face data can be deleted on request (privacy compliance)
- [ ] Indexing runs asynchronously and doesn't slow down gallery delivery

### Revenue Impact
- Included in base client subscription (increases perceived value, reduces churn)
- Could be gated to premium tiers if we implement Epic 10 Premium Client Tiers
- Key competitive differentiator in "PhotoVault vs Pic-Time" and "PhotoVault vs Pixieset" positioning

---

## Story 10.6: AI Feature Polish & Batch Processing
**Size:** Small (1 session)

### Tasks
- [ ] Add batch enhancement selection
- [ ] Improve processing feedback (progress, ETA)
- [ ] Add before/after comparison slider
- [ ] Optimize API costs
- [ ] Add enhancement history

### Acceptance Criteria
- [ ] Batch processing reduces friction
- [ ] Users see clear progress
- [ ] Costs optimized

---

# EPIC 10: Premium Client Tiers (PHASE 3)

**Priority:** 🟢 PHASE 3 - After AI working
**Dependencies:** AI Enhancement Suite complete
**Estimated Stories:** 2
**Pricing Tiers:**
- Basic: $8/month (current)
- Plus: $15/month (3 AI enhancements included)
- Premium: $25/month (10 enhancements, face recognition, family sharing)
- Pro: $40/month (unlimited enhancements, 1 highlight video/month)

---

## Story 10.1: Tier System Implementation
**Size:** Medium (1 session)

### Tasks
- [ ] Create subscription tiers in Stripe
- [ ] Build tier selection UI for clients
- [ ] Implement tier-based feature gating
- [ ] Track included enhancements per month
- [ ] Handle tier upgrades/downgrades

### Acceptance Criteria
- [ ] Clients can choose tier
- [ ] Features gated by tier
- [ ] Included enhancements tracked correctly

---

## Story 10.2: Tier Marketing & Upgrade Prompts
**Size:** Small (1 session)

### Tasks
- [ ] Create tier comparison page
- [ ] Add upgrade prompts when hitting limits
- [ ] Show savings for higher tiers
- [ ] Track upgrade conversion

### Acceptance Criteria
- [ ] Clear value proposition for each tier
- [ ] Upgrade prompts not annoying
- [ ] Conversion tracked

---

# EPIC 11: Mobile App (PHASE 4)

**Priority:** 🟢 PHASE 4 - After web platform mature
**Dependencies:** All web features stable
**Estimated Stories:** 8+
**Timeline:** 12-16 weeks development
**Stack:** React Native 0.74+, iOS 14.0+, Android 9.0+

---

## Story 11.1: Mobile App Setup & Auth
**Size:** Medium

### Tasks
- [ ] Initialize React Native project
- [ ] Set up Supabase auth integration
- [ ] Build login/signup screens
- [ ] Implement biometric authentication
- [ ] Deep linking setup

---

## Story 11.2: Client Mobile Experience
**Size:** Large (split if needed)

### Tasks
- [ ] Gallery browsing and viewing
- [ ] Photo download and sharing
- [ ] Push notifications for new photos
- [ ] Personal photo upload (phone dump)
- [ ] Purchase AI enhancements

---

## Story 11.3: Photographer Mobile Experience
**Size:** Large (split if needed)

### Tasks
- [ ] Quick gallery creation on-site
- [ ] Upload photos from phone
- [ ] Voice-to-text gallery notes
- [ ] Commission dashboard
- [ ] Client management

---

## (Additional mobile stories TBD based on Phase 3 learnings)

---

# EPIC 12: Family Story Pages (PHASE 4)

**Priority:** 🟢 PHASE 4 - Viral growth feature
**Dependencies:** Mobile app launched
**Estimated Stories:** 4
**Strategic Intent:** Create viral loop through family FOMO

---

## Story 12.1: Family Gallery Creation
**Size:** Medium

### Tasks
- [ ] Create family gallery type
- [ ] Invite family members (full vs guest access)
- [ ] Build contribution UI
- [ ] Implement FOMO teaser for guests

---

## Story 12.2: Voice Narration
**Size:** Medium

### Tasks
- [ ] Record voice notes on photos
- [ ] Store and playback audio
- [ ] Transcription for search
- [ ] Mobile integration

---

## (Additional family stories TBD)

---

# EPIC 13: Event Packages (PHASE 4)

**Priority:** 🟢 PHASE 4 - High margin bundles
**Dependencies:** AI and Print both working
**Estimated Stories:** 2

---

## Story 13.1: Package Builder
**Size:** Medium

### Tasks
- [ ] Define package templates (Wedding $149, Birthday $79, etc.)
- [ ] Bundle AI enhancements + prints
- [ ] Calculate package pricing (target 80% margin)
- [ ] Build package selection UI

---

## Story 13.2: Package Fulfillment
**Size:** Medium

### Tasks
- [ ] Track package component completion
- [ ] Coordinate AI + print timing
- [ ] Delivery confirmation
- [ ] Package-specific emails

---

# PARKED FEATURES (FUTURE CONSIDERATION)

## White-Label CRM
**Status:** PARKED - Focus on core first
**When to revisit:** After $50K MRR
**Concept:** White-label HighLevel as optional upgrade

## Website Hosting for Photographers
**Status:** PARKED FOR Q3 2026
**Concept:** Three-pillar ecosystem: Directory → Storage → Websites
**Dependencies:** Validate storage model first

## Google AI Stack (Vertex AI, AutoML)
**Status:** PARKED - Evaluate after basic AI working
**Features:** Churn prediction, natural language search, AI storytelling

---

# PROGRESS TRACKING

## Phase 1: Beta MVP (Current Focus)

| Epic | Stories | Complete | Status |
|------|---------|----------|--------|
| Epic 1: Payments | 8 | 7 | 🟡 7/8 (1.1 ✅, 1.2 ⚠️ Obsolete, 1.3 ✅, 1.4 ✅, 1.5 ✅, 1.6 ✅, 1.7 ✅, 1.8 🔴 Prepaid Stacking) |
| Epic 2: Dashboards | 5 | 5 | ✅ COMPLETE (2.1 ✅, 2.2 ✅, 2.3 ✅, 2.3b ✅, 2.4 ✅) |
| Epic 3: Emails | 4 | 3 | 🟡 3/4 (3.1 ✅, 3.2 ✅, 3.3 ⏸️, 3.4 🔴 Milestone Reminder Emails) |
| Epic 4: Onboarding | 3 | 0 | ⏸️ NEEDS REVIEW (onboarding changes + beta PDF offer) |
| Epic 5: Beta Prep | 3 | 3 | ✅ COMPLETE (5.1 ✅, 5.2 ✅, 5.3 ✅) |
| Epic 6: CIS Phase 1 | 3 | 3 | ✅ COMPLETE (Dec 14-16, 2025) |
| **TOTAL** | **26** | **21** | **81%** |

## Phase 2: Post-Beta Expansion (After Beta Stabilizes)

| Epic | Stories | Complete | Status |
|------|---------|----------|--------|
| Epic 6: CIS Phase 2-4 | 7 | 0 | ⏸️ During/After Beta |
| Epic 7: Directory | 6 | 3 | 🟡 IN PROGRESS (7.1 ✅, 7.2 ✅, 7.3 ✅, 7.4 🔴, 7.5 🔴, 7.6 🔴) |
| Epic 7B: SEO Content | 4 | 0 | 🔴 NOT STARTED (7B.1-7B.4) |
| Epic 8: Phone Dump | 3 | 0 | ⏸️ Phase 2 |
| Epic 9: Print Ordering | 5 | 0 | ⏸️ Phase 2 (added album design + discount codes) |
| Epic 9B: Gallery Experience | 2 | 0 | ⏸️ Phase 2-3 (client proofing + video hosting) |
| Epic 9C: Photographer Workflow | 3 | 0 | ⏸️ Phase 2 (LR plugin + questionnaires + booking) |
| **TOTAL** | **33** | **3** | **9% - Directory foundation complete, feature parity gaps mapped** |

## Phase 3: Revenue Expansion

| Epic | Stories | Complete | Status |
|------|---------|----------|--------|
| Epic 10: AI Enhancements + Gallery Search | 6 | 0 | ⏸️ Phase 3 (added Story 9.5: AI Gallery Search) |
| Epic 11: Premium Tiers | 2 | 0 | ⏸️ Phase 3 |
| **TOTAL** | **7** | **0** | **⏸️ Future** |

## Phase 4: Platform Maturity

| Epic | Stories | Complete | Status |
|------|---------|----------|--------|
| Epic 12: Mobile App | 8+ | 0 | ⏸️ Phase 4 |
| Epic 13: Family Story Pages | 4 | 0 | ⏸️ Phase 4 |
| Epic 14: Event Packages | 2 | 0 | ⏸️ Phase 4 |
| **TOTAL** | **14+** | **0** | **⏸️ Future** |

## Technical Debt (Post-Beta)

| Task | Priority | Files Affected | Notes |
|------|----------|----------------|-------|
| Migrate deprecated Supabase imports | Low | 40 files | `@/lib/supabase` uses service role key (bypasses RLS). Should migrate to `@/lib/supabase-server` (respects RLS) or `@/lib/supabase-browser` (client-side). Not blocking - app works, but security hardening for proper RLS enforcement. |
| Support ticket database storage | Medium | 2-3 files | Currently tickets sent via email only (`/api/support`). Add `support_tickets` table to track tickets, status, responses. Enables ticket history, admin dashboard, response tracking. |

## Future Admin Tools (Post-Helm Integration)

| Task | Priority | Plan Document | Notes |
|------|----------|---------------|-------|
| Tax Reports Export Page | Low | `docs/claude/plans/admin-tax-reports-plan.md` | CSV exports for TurboTax Schedule C: income transactions, photographer payouts, 1099 threshold report. Needed for 2026 tax filing. Approved with concerns (Jan 11, 2026). |

## Parked (Revisit Later)

| Feature | Revisit When |
|---------|--------------|
| 9-Month & 18-Month Package Tiers | When photographers request more flexibility for repeat clients. Add to `payment-models.ts` alongside existing 6-month and 12-month packages. Pricing TBD ($75 for 9-month? $150 for 18-month?). |
| White-Label CRM | After $50K MRR |
| Website Hosting | Q3 2026 |
| Google AI Stack | After basic AI working |

---

# NEXT STORY TO WORK ON

**Current:** 🏗️ Gallery Creation Wizard & Proofing System
**Plan:** `docs/claude/plans/gallery-wizard-proofing-epics.md`
**QA Critique:** `docs/claude/plans/gallery-wizard-proofing-epics-critique.md`

**Implementation Order:**
```
1. [x] Story 0 — DB migration (CHECK constraints + wizard columns)
2. [x] Story 2.1 — Proofing data model & API
3. [x] Story 1.1 — Wizard shell & presets
4. [x] Story 2.2 — Client proofing UI
5. [x] Story 1.2 — External payment bypass (Deliver and Done)
6. [x] Story 2.3 — Photographer proofing review dashboard
7. [x] Story 1.3 — Proof First Pay Later flow
8. [x] Story E.1 — Email templates for proofing lifecycle
9. [ ] Story A.1 — Admin stuck-gallery override tool ← NEXT (after proofing review UX fix)
10. [ ] Story 3.1 — AI edits (Phase 2, deferred)
```

**Integration Test Findings (2026-03-22):**
- Proofing review page needs UX fix: add "Manage Photos" for photo replacement before "Mark Revisions Complete"
- Desktop app galleryId passthrough fixed but needs production deploy
- Multiple access control bugs found and fixed during testing
- Both DB migrations applied to Supabase

---

# PREVIOUS MILESTONE

**Completed:** 🚀 BETA LAUNCH
**Status:** Live and recruiting photographers!

**Execution Order to Beta:**
```
1. ✅ Story 2.4 (Admin Dashboard) - COMPLETE
2. ✅ Story 6.1 (PostHog Foundation) - COMPLETE (Dec 14, 2025)
3. ✅ Story 6.2 (Core Event Tracking) - COMPLETE (Dec 14, 2025)
4. ✅ Story 6.3 (Friction Events) - COMPLETE (Dec 16, 2025)
5. ✅ Story 5.1 (Monitoring) - COMPLETE (Dec 17, 2025)
6. ✅ Story 5.2 (Support Docs) - COMPLETE (Dec 17, 2025)
7. ✅ Story 5.3 (Beta Launch Checklist) - COMPLETE (Jan 4, 2026)
8. 🚀 BETA LAUNCH ← YOU ARE HERE!
```

**Outreach message saved to:** `docs/BETA-OUTREACH-MESSAGE.md`

**Completed:**
- Story 1.1 ✅ (Dec 2, 2025) - Payment Flow Testing
- Story 1.3 ✅ (Dec 4, 2025) - Platform Fee Billing
- Story 1.4 ✅ (Dec 4, 2025) - Failed Payment Handling (6-month grace period)
- Story 1.5 ✅ (Dec 4, 2025) - Subscription Management ($20 reactivation)
- Story 1.6 ✅ (Dec 7, 2025) - Payment System QA & Bug Fixes (webhook user check bug fixed)
- Story 1.7 ✅ (Dec 4-5, 2025) - Family Accounts - All 8 Sprints Complete
- Epic 1 ✅ (Dec 7, 2025) - Payment System Complete!
- Epic 3 ✅ (Nov 30, 2025) - Email System Complete
- Story 2.1-2.3b ✅ (Dec 12, 2025) - Dashboard fixes + Favorites toggle
- Story 6.1 ✅ (Dec 14, 2025) - PostHog Foundation
- Story 6.2 ✅ (Dec 14, 2025) - Core Event Tracking (15 events implemented)
- Story 6.3 ✅ (Dec 16, 2025) - Friction & Warning Events (12 files, churn tracking)
- Theme Fix ✅ (Dec 16, 2025) - Sitewide Light/Dark Mode (200 files, semantic tokens)
- Bug Fixes ✅ (Dec 16, 2025) - Messaging 403 & Timeline column fixed
- Story 5.1 ✅ (Dec 17, 2025) - Webhook Monitoring & Alerting (cron job)
- Story 5.2 ✅ (Dec 17, 2025) - Support Documentation (3 guides + help pages)
- Story 5.3 ✅ (Jan 4, 2026) - Beta Launch Checklist COMPLETE (Beta Tester System + outreach message)
- Signup Bug Fixes ✅ (Feb 15, 2026) - Welcome email wired up (PHOTOVAULT_BETA_2026 coupon), removed false marketing copy, removed dead platform filter from client dashboard, cleaned Stripe key from git history

---

**Skipped:** Story 1.2 ⚠️ (Obsolete - replaced by destination charges)
**Needs Review:** Epic 4 (Onboarding) - requires discussion on onboarding changes + beta PDF offer

When ready to continue, tell Claude:
> "Let's start Story 5.3: Beta Launch Checklist"

---

# FULL ROADMAP REFERENCE

For detailed feature descriptions, revenue splits, and strategic context, see:
**Stone Fence Brain → `1_VENTURES/PhotoVault/PHOTOVAULT_FUTURE_FEATURES_ARCHIVE.md`**

---

**Last Updated:** February 27, 2026 (Epic 9 Print Ordering: changed revenue model from "100% to PhotoVault" to photographer-sets-markup with platform cut — photographers earn from print sales like Pic-Time. Fixed story count to 5. Epic 10: Added Story 10.5 AI Gallery Search — face recognition + semantic free-text search, competitive parity with Pic-Time. Renumbered all Epic 10 stories from 9.x → 10.x to match epic number. Updated summary table.)
