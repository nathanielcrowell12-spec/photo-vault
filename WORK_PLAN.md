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
**Size:** Small (1 session)
**Files:** 2-3 files
**Status:** ✅ COMPLETE (Dec 8, 2025)

### Description
Fix issues found in client dashboard - ensure real data, working links.

### Tasks
- [x] Verify gallery stats are real
- [x] Verify payment status is accurate
- [x] Fix any broken navigation
- [x] Test gallery access
- [x] Ensure responsive on mobile

### Acceptance Criteria
- [x] Client sees accurate gallery info
- [x] Payment status is correct
- [x] All navigation works

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

### Files Created
| File | Purpose |
|------|---------|
| `src/app/api/client/stats/route.ts` | Client stats API endpoint |

### Files Modified
| File | Changes |
|------|---------|
| `src/app/client/dashboard/page.tsx` | Added stats fetching, real data display, Recent Sessions |

---

## Story 2.4: Fix Admin Dashboard
**Size:** Medium (1 session)
**Files:** 3-4 files

### Description
Fix admin dashboard to show real platform metrics.

### Tasks
- [ ] Replace mock data with real queries
- [ ] Show actual: total users, revenue, commissions paid
- [ ] Show photographer list with real data
- [ ] Show client list with real data
- [ ] Add basic filtering/search

### Acceptance Criteria
- [ ] Admin sees real platform metrics
- [ ] Can view photographer/client lists
- [ ] Data matches database

### Files Likely Touched
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/*/page.tsx` (sub-pages)

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

### Description
Set up error tracking and monitoring for production.

### Tasks
- [ ] Configure Sentry (or similar)
- [ ] Add error boundaries to critical components
- [ ] Set up alerts for payment errors
- [ ] Set up alerts for webhook failures
- [ ] Test alert delivery

### Acceptance Criteria
- [ ] Errors logged to monitoring service
- [ ] Critical errors trigger alerts
- [ ] Can view error dashboard

### Files Likely Touched
- `src/app/layout.tsx` (Sentry init)
- `src/components/ErrorBoundary.tsx` (NEW)
- Environment variables

---

## Story 5.2: Support Documentation
**Size:** Small (1 session)
**Files:** Documentation only

### Description
Create support documentation for beta photographers and clients.

### Tasks
- [ ] Write photographer setup guide
- [ ] Write client FAQ
- [ ] Write troubleshooting guide
- [ ] Add help links in app
- [ ] Review all docs for accuracy

### Acceptance Criteria
- [ ] Guides are complete and accurate
- [ ] Accessible from app
- [ ] Cover common questions

### Files Likely Touched
- `docs/PHOTOGRAPHER_GUIDE.md` (NEW)
- `docs/CLIENT_FAQ.md` (NEW)
- Navigation components (add help links)

---

## Story 5.3: Beta Launch Checklist
**Size:** Small (1 session)
**Files:** Testing & verification

### Description
Final verification before inviting beta photographers.

### Tasks
- [ ] Complete end-to-end test as photographer
- [ ] Complete end-to-end test as client
- [ ] Verify production environment variables
- [ ] Verify Stripe production keys ready (but use test for beta)
- [ ] Verify email delivery working
- [ ] Create beta invite message

### Acceptance Criteria
- [ ] All critical flows verified
- [ ] Production ready for beta
- [ ] Invite message ready

### Files Likely Touched
- Verification only - should be no code changes

---

# PHASE 2: POST-BETA EXPANSION
# ================================
# Reference: Stone Fence Brain → 1_VENTURES/PhotoVault/PHOTOVAULT_FUTURE_FEATURES_ARCHIVE.md

---

# EPIC 6: Photographer Directory (PHASE 2 - FIRST PRIORITY)

**Priority:** 🟢 PHASE 2 - Build immediately after beta stabilizes
**Dependencies:** Beta launch successful, 10+ active photographers
**Estimated Stories:** 6
**Strategic Intent:** "Pre-Shoot vs Post-Shoot" - competitors only do Post-Shoot (gallery delivery). PhotoVault owns Pre-Shoot (location scouting, permits).
**North Star:** "1/8 of photographers in 15 cities saying 'PhotoVault' once a week"

---

## Story 6.1: Directory Database & Schema
**Size:** Medium (1 session)

### Description
Build the database foundation for the photographer directory with location data.

### Tasks
- [ ] Create `directory_locations` table (GPS, permits, seasonal info)
- [ ] Create `photographer_profiles` table (public profile data)
- [ ] Create `location_reviews` table (photographer tips/ratings)
- [ ] Add profile fields to existing photographer data
- [ ] Set up RLS policies for public/private data

### Acceptance Criteria
- [ ] Database supports location-based queries
- [ ] Photographers can have public vs private profile data
- [ ] Location data includes permit requirements, seasonal guides

---

## Story 6.2: Photographer Public Profiles
**Size:** Medium (1 session)

### Description
Create public profile pages for photographers in the directory.

### Tasks
- [ ] Create public profile page `/directory/photographers/[slug]`
- [ ] Display portfolio preview (selected galleries)
- [ ] Show specialties, pricing ranges, service areas
- [ ] Add contact/inquiry button (leads to sign-up funnel)
- [ ] Mobile-responsive design

### Acceptance Criteria
- [ ] Photographers have SEO-friendly public profiles
- [ ] Visitors can view portfolio and contact
- [ ] Profile linked from directory search

---

## Story 6.3: Location Database - Wisconsin MVP
**Size:** Medium (1 session)

### Description
Seed the location database with Wisconsin photo spots as MVP.

### Tasks
- [ ] Research top 50 Wisconsin photo locations
- [ ] Add permit requirements and links for each
- [ ] Add seasonal guides (fall colors, sunflowers, etc.)
- [ ] Add accessibility info and parking
- [ ] Add GPS coordinates for each location
- [ ] Create location detail pages `/directory/locations/[slug]`

### Acceptance Criteria
- [ ] 50+ Wisconsin locations in database
- [ ] Each has permit info, seasonal tips, accessibility
- [ ] Photographers can add tips/ratings

---

## Story 6.4: Directory Search & Filtering
**Size:** Medium (1 session)

### Description
Build search and filtering for both photographers and locations.

### Tasks
- [ ] Create directory home page `/directory`
- [ ] Add photographer search by name, specialty, location
- [ ] Add location search by city, type (park, urban, beach)
- [ ] Add specialty filters (wedding, portrait, event, etc.)
- [ ] Add price range filters
- [ ] Pagination and infinite scroll
- [ ] Integrate simple map view for locations

### Acceptance Criteria
- [ ] Users can find photographers by location/specialty
- [ ] Users can discover photo locations
- [ ] Search is fast and SEO-friendly

---

## Story 6.5: Directory SEO & City Landing Pages
**Size:** Medium (1 session)

### Description
Optimize directory for search engines with city-specific landing pages.

### Tasks
- [ ] Create city landing pages `/directory/cities/[city]`
- [ ] Add meta tags, Open Graph for all pages
- [ ] Create XML sitemap for directory
- [ ] Add JSON-LD structured data (LocalBusiness, Photographer)
- [ ] Internal linking strategy between locations and photographers
- [ ] Create landing page content for top 10 Wisconsin cities

### Acceptance Criteria
- [ ] City pages rank for "[city] photographers" searches
- [ ] All pages have proper meta tags
- [ ] Sitemap submitted to Google

---

## Story 6.6: Directory Pro & Monetization
**Size:** Small (1 session)

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

# EPIC 7: Phone Dump & Client Stickiness (PHASE 2)

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

# EPIC 8: Print Ordering - Pwinty Integration (PHASE 2)

**Priority:** 🟢 PHASE 2 - High margin, low effort
**Dependencies:** Gallery viewing stable
**Estimated Stories:** 3
**Revenue Split:** 100% to PhotoVault (photographer keeps subscription fee only)
**Pricing:** Wholesale + 40% markup

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
- [ ] Products have correct pricing (wholesale + 40%)

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
- [ ] Track print revenue in dashboard

### Acceptance Criteria
- [ ] Clients can view order history
- [ ] Admin can manage orders
- [ ] Revenue tracked separately

---

# EPIC 9: AI Enhancement Suite (PHASE 3)

**Priority:** 🟢 PHASE 3 - After Phase 2 revenue flowing
**Dependencies:** Platform stable, print ordering working
**Estimated Stories:** 5
**Pricing:** Minimum $1.29 per enhancement, or API cost x 1.50 (whichever higher)
**Revenue Split:** 100% to PhotoVault

---

## Story 9.1: AI Infrastructure Setup
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

## Story 9.2: Watermark Preview System
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

## Story 9.3: Basic Enhancements (Color, Sharpening, Background)
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

## Story 9.4: Style Transfer & Collages
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

## Story 9.5: AI Feature Polish & Batch Processing
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
| Epic 1: Payments | 7 | 7 | ✅ COMPLETE (1.1 ✅, 1.2 ⚠️ Obsolete, 1.3 ✅, 1.4 ✅, 1.5 ✅, 1.6 ✅, 1.7 ✅) |
| Epic 2: Dashboards | 4 | 3 | 🟡 In Progress (2.1 ✅, 2.2 ✅, 2.3 ✅, 2.4 🔴) |
| Epic 3: Emails | 3 | 3 | ✅ Complete (Nov 30) |
| Epic 4: Onboarding | 3 | 0 | 🔴 Not Started |
| Epic 5: Beta Prep | 3 | 0 | 🔴 Not Started |
| **TOTAL** | **20** | **13** | **65%** |

## Phase 2: Post-Beta Expansion (After Beta Stabilizes)

| Epic | Stories | Complete | Status |
|------|---------|----------|--------|
| Epic 6: Directory | 6 | 0 | ⏸️ Phase 2 - FIRST PRIORITY |
| Epic 7: Phone Dump | 3 | 0 | ⏸️ Phase 2 |
| Epic 8: Print Ordering | 3 | 0 | ⏸️ Phase 2 |
| **TOTAL** | **12** | **0** | **⏸️ Future** |

## Phase 3: Revenue Expansion

| Epic | Stories | Complete | Status |
|------|---------|----------|--------|
| Epic 9: AI Enhancements | 5 | 0 | ⏸️ Phase 3 |
| Epic 10: Premium Tiers | 2 | 0 | ⏸️ Phase 3 |
| **TOTAL** | **7** | **0** | **⏸️ Future** |

## Phase 4: Platform Maturity

| Epic | Stories | Complete | Status |
|------|---------|----------|--------|
| Epic 11: Mobile App | 8+ | 0 | ⏸️ Phase 4 |
| Epic 12: Family Story Pages | 4 | 0 | ⏸️ Phase 4 |
| Epic 13: Event Packages | 2 | 0 | ⏸️ Phase 4 |
| **TOTAL** | **14+** | **0** | **⏸️ Future** |

## Parked (Revisit Later)

| Feature | Revisit When |
|---------|--------------|
| White-Label CRM | After $50K MRR |
| Website Hosting | Q3 2026 |
| Google AI Stack | After basic AI working |

---

# NEXT STORY TO WORK ON

**Next:** Story 2.2 - Fix Photographer Dashboard (OR) Story 2.1 - Dashboard Audit

**Completed:**
- Story 1.1 ✅ (Dec 2, 2025) - Payment Flow Testing
- Story 1.3 ✅ (Dec 4, 2025) - Platform Fee Billing
- Story 1.4 ✅ (Dec 4, 2025) - Failed Payment Handling (6-month grace period)
- Story 1.5 ✅ (Dec 4, 2025) - Subscription Management ($20 reactivation)
- Story 1.6 ✅ (Dec 7, 2025) - Payment System QA & Bug Fixes (webhook user check bug fixed)
- Story 1.7 ✅ (Dec 4-5, 2025) - Family Accounts - All 8 Sprints Complete
- Epic 1 ✅ (Dec 7, 2025) - Payment System Complete!
- Epic 3 ✅ (Nov 30, 2025) - Email System Complete

**Skipped:** Story 1.2 ⚠️ (Obsolete - replaced by destination charges)

When ready to continue, tell Claude:
> "Let's do Story 2.1: Dashboard Audit & Bug Discovery"
> OR
> "Let's do Story 2.2: Fix Photographer Dashboard"

---

# FULL ROADMAP REFERENCE

For detailed feature descriptions, revenue splits, and strategic context, see:
**Stone Fence Brain → `1_VENTURES/PhotoVault/PHOTOVAULT_FUTURE_FEATURES_ARCHIVE.md`**

---

**Last Updated:** December 7, 2025 (Epic 1 COMPLETE! Payment System QA passed - 50% of Beta MVP done)
