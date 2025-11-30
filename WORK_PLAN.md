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

# EPIC 1: Payment System Completion (BLOCKER)

**Priority:** 🔴 CRITICAL - No beta launch without this
**Dependencies:** None (foundation work)
**Estimated Stories:** 6

---

## Story 1.1: Payment Flow Testing & Verification
**Size:** Medium (1 session)
**Files:** 4-6 files

### Description
Test the existing Stripe payment flow end-to-end in test mode. Verify checkout works, webhooks fire, and records are created.

### Tasks
- [ ] Start dev server and Stripe CLI for webhook forwarding
- [ ] Test photographer Stripe Connect flow (create test connected account)
- [ ] Test client checkout flow ($100 Year Package)
- [ ] Verify webhook receives `payment_intent.succeeded`
- [ ] Verify commission record created in database
- [ ] Document any bugs found

### Acceptance Criteria
- [ ] Photographer can connect Stripe account
- [ ] Client can complete checkout
- [ ] Webhook processes payment event
- [ ] Commission appears in photographer dashboard

### Files Likely Touched
- `src/app/api/stripe/connect/route.ts`
- `src/app/api/stripe/create-checkout/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- Testing only - may not need edits

---

## Story 1.2: Commission Payout Automation
**Size:** Medium (1 session)
**Files:** 3-5 files

### Description
Build the automated commission payout system that transfers funds to photographers after 14-day delay.

### Tasks
- [ ] Create `/api/cron/process-commissions` endpoint
- [ ] Query commissions where `status = 'pending'` AND `created_at < NOW() - 14 days`
- [ ] Call Stripe Transfer API for each payable commission
- [ ] Update commission status to 'paid' with transfer ID
- [ ] Add error handling and logging
- [ ] Test with Stripe test mode

### Acceptance Criteria
- [ ] Commissions older than 14 days get paid out
- [ ] Transfer appears in photographer's Stripe account
- [ ] Commission record updated with transfer ID
- [ ] Failed transfers logged and retryable

### Files Likely Touched
- `src/app/api/cron/process-commissions/route.ts` (NEW)
- `src/lib/stripe.ts` (use existing `transferCommissionToPhotographer`)
- Database: `commission_payments` table

---

## Story 1.3: Platform Fee Billing
**Size:** Medium (1 session)
**Files:** 4-6 files

### Description
Implement $22/month platform fee billing for photographers using Stripe subscriptions.

### Tasks
- [ ] Create photographer subscription during signup/onboarding
- [ ] Build `/api/stripe/platform-subscription` endpoint
- [ ] Handle subscription creation with 14-day free trial
- [ ] Update webhook to handle `invoice.paid` for platform fees
- [ ] Store subscription ID in `user_profiles`
- [ ] Display subscription status on photographer settings

### Acceptance Criteria
- [ ] New photographers get 14-day free trial
- [ ] After trial, $22/month charges automatically
- [ ] Photographer can view billing status
- [ ] Failed payments trigger retry logic

### Files Likely Touched
- `src/app/api/stripe/platform-subscription/route.ts` (NEW)
- `src/app/api/stripe/webhook/route.ts`
- `src/app/photographer/settings/page.tsx`
- Database: `user_profiles` table

---

## Story 1.4: Failed Payment Handling
**Size:** Small (1 session)
**Files:** 3-4 files

### Description
Implement graceful handling when payments fail - retry logic, user notifications, and access management.

### Tasks
- [ ] Handle `invoice.payment_failed` webhook event
- [ ] Implement 3-attempt retry with exponential backoff
- [ ] Create payment failure email template
- [ ] Suspend gallery access after 48 hours of failure
- [ ] Restore access immediately on successful retry

### Acceptance Criteria
- [ ] Failed payments retry automatically
- [ ] User receives email about failed payment
- [ ] After 48 hours, gallery access suspended
- [ ] Successful payment restores access

### Files Likely Touched
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/email/templates/payment-failed.tsx` (NEW)
- `src/lib/access-control.ts`

---

## Story 1.5: Subscription Management
**Size:** Small (1 session)
**Files:** 3-4 files

### Description
Allow clients to manage their subscription - view status, update payment method, cancel.

### Tasks
- [ ] Build client billing page UI
- [ ] Show current subscription status and next billing date
- [ ] Add "Update Payment Method" button (use existing PaymentMethodManager)
- [ ] Add "Cancel Subscription" with confirmation
- [ ] Handle `customer.subscription.deleted` webhook

### Acceptance Criteria
- [ ] Client can view subscription details
- [ ] Client can update payment method
- [ ] Client can cancel (with confirmation)
- [ ] Cancellation processed correctly

### Files Likely Touched
- `src/app/client/billing/page.tsx`
- `src/app/api/stripe/subscription/route.ts`
- `src/app/api/stripe/webhook/route.ts`

---

## Story 1.6: Payment System QA & Bug Fixes
**Size:** Medium (1 session)
**Files:** Variable

### Description
Comprehensive testing of all payment flows and fix any bugs found.

### Tasks
- [ ] Test complete photographer journey: Signup → Connect → Gallery → Client pays
- [ ] Test complete client journey: Invite → Signup → Pay → View gallery
- [ ] Test edge cases: Card decline, 3D Secure, expired card
- [ ] Test commission flow: Payment → 14-day wait → Payout
- [ ] Fix any bugs discovered
- [ ] Document test results

### Acceptance Criteria
- [ ] All happy paths work
- [ ] All error paths handled gracefully
- [ ] Commission accuracy validated
- [ ] Zero critical bugs

### Files Likely Touched
- Various - depends on bugs found

---

# EPIC 2: Dashboard Fixes & Data Cleanup

**Priority:** 🟠 HIGH - User experience critical
**Dependencies:** Epic 1 (needs real payment data)
**Estimated Stories:** 4

---

## Story 2.1: Dashboard Audit & Bug Discovery
**Size:** Small (1 session)
**Files:** Read-only

### Description
Systematically test all dashboards to find issues - broken links, mock data, 404 errors.

### Tasks
- [ ] Test photographer dashboard - click every button
- [ ] Test client dashboard - click every button
- [ ] Test admin dashboard - click every button
- [ ] Document all 404 errors
- [ ] Document all pages with mock data
- [ ] Document any UI bugs
- [ ] Create prioritized fix list

### Acceptance Criteria
- [ ] Complete list of issues documented
- [ ] Issues prioritized by severity
- [ ] Ready for fix stories

### Files Likely Touched
- None - testing only
- Output: Bug list in this file or CLAUDE.md

---

## Story 2.2: Fix Photographer Dashboard
**Size:** Medium (1 session)
**Files:** 3-5 files

### Description
Fix issues found in photographer dashboard - replace mock data, fix broken links.

### Tasks
- [ ] Replace mock data in analytics with real queries
- [ ] Fix any broken navigation links
- [ ] Ensure commission display shows real data
- [ ] Fix any 404 errors
- [ ] Test all functionality

### Acceptance Criteria
- [ ] All data is real (no mock data)
- [ ] All links work
- [ ] Analytics shows actual earnings

### Files Likely Touched
- `src/app/photographer/dashboard/page.tsx`
- `src/app/photographer/analytics/page.tsx` (if exists)
- Related components

---

## Story 2.3: Fix Client Dashboard
**Size:** Small (1 session)
**Files:** 2-3 files

### Description
Fix issues found in client dashboard - ensure real data, working links.

### Tasks
- [ ] Verify gallery stats are real
- [ ] Verify payment status is accurate
- [ ] Fix any broken navigation
- [ ] Test gallery access
- [ ] Ensure responsive on mobile

### Acceptance Criteria
- [ ] Client sees accurate gallery info
- [ ] Payment status is correct
- [ ] All navigation works

### Files Likely Touched
- `src/app/client/dashboard/page.tsx`
- Related components

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
| Epic 1: Payments | 6 | 0 | 🔴 Not Started |
| Epic 2: Dashboards | 4 | 0 | 🔴 Not Started |
| Epic 3: Emails | 3 | 0 | 🔴 Not Started |
| Epic 4: Onboarding | 3 | 0 | 🔴 Not Started |
| Epic 5: Beta Prep | 3 | 0 | 🔴 Not Started |
| **TOTAL** | **19** | **0** | **0%** |

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

**Current:** Story 1.1 - Payment Flow Testing & Verification

When ready to start, tell Claude:
> "Let's work on Story 1.1: Payment Flow Testing & Verification"

---

# FULL ROADMAP REFERENCE

For detailed feature descriptions, revenue splits, and strategic context, see:
**Stone Fence Brain → `1_VENTURES/PhotoVault/PHOTOVAULT_FUTURE_FEATURES_ARCHIVE.md`**

---

**Last Updated:** November 28, 2025
