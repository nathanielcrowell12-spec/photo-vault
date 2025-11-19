# PhotoVault Beta Launch Completion PRD

**Document Version:** v1.0
**Date:** November 13, 2025
**Status:** Draft - Awaiting Testing Validation
**Author:** Product Team (BMAD Methodology)

---

## Document Purpose

This PRD defines the remaining work required to complete PhotoVault's MVP and launch beta testing with 5-10 initial photographers. This is a **brownfield enhancement PRD** for an existing project currently at **35-40% completion**.

---

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Draft | 2025-11-13 | v1.0 | Brownfield PRD created after ground truth analysis | PM Agent |

---

# Section 1: Project Analysis and Context

## Existing Project Overview

### Analysis Source
- **Method:** Direct codebase analysis + verified user testing
- **Location:** `C:\Users\natha\.cursor\Photo Vault`
- **Date:** November 13, 2025

### Current Project State

PhotoVault is a **dual-application photography platform** enabling photographers to create recurring revenue through long-term photo storage for clients. The platform operates on a **50/50 revenue share model** between photographers and PhotoVault.

**Architecture:**
- **photovault-hub**: Next.js 15 web application (main platform)
- **photovault-desktop**: Electron desktop uploader
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe (not yet integrated)

**Business Model:**
- Client pays $8/month for lifetime photo storage
- Photographer earns $4/month (50% commission)
- PhotoVault earns $4/month (50% platform fee)
- Upfront packages: $100 (12 months) or $50 (6 months) - split 50/50
- Photographers pay $22/month platform subscription

---

## Available Documentation Analysis

### Existing Documentation
- ✅ Project structure documentation (`PROJECT_STRUCTURE.md`)
- ✅ Current status tracking (`CURRENT_STATUS.md`)
- ✅ Beta Launch Strategy document (strategic plan)
- ✅ Database schemas (2,863 lines across 21 migration files)
- ✅ Stripe setup documentation (requirements defined)
- ⚠️ **Missing:** API documentation, setup guides, testing documentation

### Documentation Quality Assessment
**Status:** Adequate for development, needs expansion for beta support

---

## Enhancement Scope Definition

### Enhancement Type
- ☑️ **New Feature Addition** (payment processing, email system)
- ☑️ **Integration with New Systems** (Stripe Connect OAuth)
- ☑️ **Bug Fix and Stability Improvements** (dashboard fixes, 404 errors)
- ☑️ **UI/UX Polish** (onboarding flows, error handling)

### Enhancement Description

**Complete the remaining ~60-65% of PhotoVault to achieve beta launch readiness.** This includes:

1. Building the complete payment infrastructure (Stripe Connect integration, checkout, subscriptions)
2. Testing and fixing all existing dashboards (client, photographer, admin)
3. Implementing email notification system
4. Polishing user onboarding experiences
5. Comprehensive error handling across all workflows
6. Beta launch infrastructure (monitoring, support, feedback collection)

### Impact Assessment
- ☑️ **Significant Impact** - Adding major new systems (payments) while fixing existing code (dashboards)
- Most work is **new feature development** (payments, emails)
- Secondary work is **testing and fixing** (dashboards, broken buttons)
- All changes must maintain stability of working features (desktop upload, gallery creation)

---

## Goals and Background Context

### Goals

1. **Complete Stripe Connect integration** - Enable photographer payouts via OAuth flow
2. **Build end-to-end payment processing** - Client subscriptions and upfront packages
3. **Implement automated commission distribution** - 50/50 split with 2-week delay
4. **Create platform fee billing** - $22/month photographer subscription
5. **Test and fix all dashboards** - Eliminate 404 errors, verify functionality
6. **Build email notification system** - Transactional emails for key user actions
7. **Polish onboarding flows** - Reduce friction for photographers and clients
8. **Establish beta infrastructure** - Monitoring, feedback, support documentation
9. **Achieve zero critical bugs** - In core photographer → client → payment → commission workflow
10. **Successfully recruit 5-10 beta photographers** - Initial cohort for validation

### Background Context

PhotoVault has successfully built its foundational infrastructure: photographers can create galleries, upload photos via desktop app (individual files and .zips), and add clients to their account. The database schema is comprehensive (2,863 lines), authentication is functional, and the desktop uploader is production-quality.

**However**, the **critical monetization layer is 0% complete**. Without payment processing, the core value proposition (recurring revenue for photographers) cannot be validated. Additionally, testing has revealed multiple dashboard issues (broken buttons, 404 errors) that must be resolved before beta launch.

**Key Reality Check (November 13, 2025):**
- ✅ Desktop upload: Verified working (individual photos + .zips)
- ✅ Gallery creation: Verified working
- ✅ Client management: Verified working (but no payment interface)
- ❌ **Payments: 0% functional** (Stripe not integrated)
- ❌ **Dashboards: Untested** (many broken buttons expected)
- ❌ **Email system: Not functional** (TODO comments in code)
- 🗑️ **Platform imports: DELETED FROM SCOPE** (Pixieset/SmugMug abandoned)

**Honest Completion Estimate:** 35-40% (down from initial 50-55% estimate after ground truth analysis)

---

# Section 2: Requirements

## Functional Requirements

### Payment System
**FR1:** System shall integrate Stripe Connect OAuth flow to enable photographer payout accounts
**FR2:** System shall create checkout page for client upfront package purchases ($50 or $100)
**FR3:** System shall create checkout page for client monthly subscriptions ($8/month)
**FR4:** System shall process Stripe webhooks for payment events (7 event types)
**FR5:** System shall calculate 50/50 commission split on all client payments
**FR6:** System shall delay commission payouts to photographers by 2 weeks
**FR7:** System shall automatically distribute commissions to photographer Stripe accounts
**FR8:** System shall charge photographers $22/month platform fee
**FR9:** System shall handle failed payments with retry logic (3 attempts)
**FR10:** System shall suspend client gallery access after 48 hours of payment failure
**FR11:** System shall suspend photographer accounts after 3 failed platform fee payments

### Dashboard Functionality
**FR12:** Client dashboard shall display accurate gallery statistics (not mock data)
**FR13:** Photographer dashboard shall display real commission earnings (not mock data)
**FR14:** Admin dashboard shall display actual platform revenue (not mock data)
**FR15:** All dashboard buttons shall navigate to functional pages (no 404 errors)
**FR16:** Photographer analytics page shall query real database data (remove hardcoded mockData)

### Email Notifications
**FR17:** System shall send client invitation emails when photographer invites new client
**FR18:** System shall send payment confirmation emails when client pays
**FR19:** System shall send commission earned notifications to photographers
**FR20:** System shall send monthly billing receipts for platform fees
**FR21:** System shall send payment failure warnings to clients and photographers
**FR22:** System shall send welcome emails on photographer and client signup

### User Onboarding
**FR23:** Photographer onboarding shall guide Stripe Connect setup immediately after signup
**FR24:** Photographer onboarding shall provide first gallery creation tutorial
**FR25:** Client onboarding shall guide payment method setup after invitation acceptance
**FR26:** System shall display helpful empty states (no galleries, no clients, no photos)

### Gallery Management
**FR27:** System shall maintain existing desktop upload functionality (individual + .zip)
**FR28:** Web upload page shall function correctly (currently untested)
**FR29:** Bulk upload testing shall validate performance with 100+ photos

### Commission Tracking
**FR30:** System shall display pending commissions (awaiting 2-week delay)
**FR31:** System shall display paid commission history
**FR32:** System shall provide commission reports for tax purposes

---

## Non-Functional Requirements

### Performance
**NFR1:** Payment checkout page shall load in <2 seconds
**NFR2:** Dashboard queries shall return in <1 second
**NFR3:** Webhook processing shall complete in <5 seconds
**NFR4:** Email delivery shall occur within 2 minutes of triggering event
**NFR5:** System shall support 100 concurrent users during beta

### Reliability
**NFR6:** Payment processing success rate shall exceed 98%
**NFR7:** Webhook idempotency shall prevent duplicate payment processing
**NFR8:** Commission calculation accuracy shall be 100% (zero tolerance for errors)
**NFR9:** System uptime shall exceed 99% during beta period
**NFR10:** Database backups shall occur daily with point-in-time recovery enabled

### Security
**NFR11:** Stripe webhook signature verification shall be enforced on all events
**NFR12:** Payment data shall never be stored on PhotoVault servers (Stripe tokenization)
**NFR13:** Commission payouts shall require photographer Stripe account verification
**NFR14:** All payment-related API routes shall require authentication
**NFR15:** RLS policies shall prevent photographers from accessing other photographers' data

### Testing
**NFR16:** All payment flows shall have integration tests before beta launch
**NFR17:** Commission calculation shall have 100% unit test coverage
**NFR18:** Critical user flows shall have end-to-end test documentation
**NFR19:** Stripe integration shall be tested in Stripe test mode before production

### Monitoring
**NFR20:** Payment failures shall trigger alerts within 5 minutes
**NFR21:** Webhook processing errors shall be logged to monitoring system
**NFR22:** Commission distribution errors shall alert immediately
**NFR23:** Dashboard shall display key metrics: signups, revenue, commissions paid

---

## Compatibility Requirements

**CR1:** Enhancement shall maintain existing desktop upload functionality without regression
**CR2:** Database schema changes shall be backward compatible (no data loss)
**CR3:** New payment UI shall match existing shadcn/ui design system
**CR4:** Email templates shall match PhotoVault branding and be mobile-responsive
**CR5:** Stripe integration shall not disrupt existing gallery/client management workflows

---

# Section 3: Technical Constraints and Integration Requirements

## Existing Technology Stack

**Languages:** TypeScript, JavaScript
**Frontend Framework:** Next.js 15 (App Router), React 19
**Styling:** Tailwind CSS 4, shadcn/ui (21 components)
**Database:** Supabase (PostgreSQL) with Row Level Security
**Storage:** Supabase Storage (photos, thumbnails, gallery-imports buckets)
**Authentication:** Supabase Auth (email/password, role-based)
**Desktop App:** Electron with TUS protocol (chunked uploads)
**Payment Infrastructure:** Stripe Connect (not yet configured)
**Email Provider:** TBD (Resend recommended, needs setup)

**External Dependencies:**
- Stripe API (payment processing, Connect OAuth)
- Supabase API (database, auth, storage)
- TUS protocol (resumable uploads)
- Radix UI (component primitives)

---

## Integration Approach

### Database Integration Strategy
- **Existing tables:** Leverage `subscriptions`, `token_transactions`, `payment_history`, `payouts`, `commission_payments`
- **New tables:** None required (schema already comprehensive)
- **Migrations:** Verify all tables exist in production Supabase instance
- **RLS Policies:** Audit and test all payment-related policies

### API Integration Strategy
- **Stripe Webhook:** `/api/webhooks/stripe` (handler exists, needs testing)
- **Payment Intent:** Create new route `/api/payment/create-intent`
- **Checkout Session:** Create new route `/api/payment/create-checkout`
- **Commission Payout:** Create new route `/api/commission/process-payout`
- **Platform Billing:** Create new route `/api/billing/charge-photographer`

### Frontend Integration Strategy
- **Checkout Page:** Create `/client/checkout/[packageId]`
- **Payment Settings:** Create `/client/settings/payment`
- **Stripe Connect Flow:** Create `/photographer/connect-stripe`
- **Commission Dashboard:** Fix `/photographers/analytics` (remove mockData)

### Testing Integration Strategy
- **Unit Tests:** Add tests for commission calculation logic
- **Integration Tests:** Test Stripe webhook handling end-to-end
- **Manual Testing:** Documented test plan for all payment flows
- **Stripe Test Mode:** All development/beta testing uses test API keys

---

## Code Organization and Standards

### File Structure Approach
- **Maintain existing structure:** `src/app/` for routes, `src/components/` for UI
- **Payment components:** Create `src/components/payments/` subdirectory
- **Email templates:** Create `src/lib/email/templates/` subdirectory
- **Stripe utilities:** Create `src/lib/stripe/` with helper functions

### Naming Conventions
- **Components:** PascalCase (e.g., `PaymentCheckout.tsx`)
- **API routes:** kebab-case (e.g., `create-checkout/route.ts`)
- **Database tables:** snake_case (existing convention)
- **Functions:** camelCase (e.g., `calculateCommission()`)

### Coding Standards
- **TypeScript strict mode:** All code must be fully typed
- **Error handling:** Try-catch blocks in all async operations
- **Logging:** Console.log for development, structured logging for production
- **Comments:** Document complex logic, especially commission calculations

### Documentation Standards
- **API routes:** Add JSDoc comments with request/response examples
- **Complex functions:** Explain business logic (e.g., "2-week commission delay")
- **Environment variables:** Document all required keys in README
- **Setup guide:** Create step-by-step Stripe Connect configuration instructions

---

## Deployment and Operations

### Build Process Integration
- **Next.js build:** `npm run build` must complete without errors
- **Type checking:** `npm run type-check` must pass
- **Environment validation:** Check all required env vars before deployment

### Deployment Strategy
- **Web app:** Deploy to Vercel (or existing host)
- **Database migrations:** Run via Supabase CLI or dashboard
- **Environment variables:** Configure Stripe keys in production
- **Rollback plan:** Database backup before major schema changes

### Monitoring and Logging
- **Error tracking:** Configure Sentry or similar (TBD)
- **Payment monitoring:** Stripe Dashboard for transaction visibility
- **Webhook logs:** Store in `webhook_logs` table for debugging
- **Performance monitoring:** Vercel Analytics or similar

### Configuration Management
- **Stripe keys:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Email provider:** `RESEND_API_KEY` or SMTP credentials
- **Feature flags:** Environment variable for beta mode (e.g., `BETA_MODE=true`)

---

## Risk Assessment and Mitigation

### Technical Risks

**RISK T1: Stripe Connect Integration Failure**
- **Probability:** Medium
- **Impact:** Critical (blocks all revenue)
- **Mitigation:**
  - Follow Stripe documentation exactly
  - Test OAuth flow with multiple test accounts
  - Implement comprehensive error logging
  - Have Stripe support contact ready
  - Build manual payout fallback for emergencies
- **Contingency:** Delay beta launch until 100% stable

**RISK T2: Commission Calculation Errors**
- **Probability:** Low (logic is straightforward)
- **Impact:** Catastrophic (trust destroyed, legal liability)
- **Mitigation:**
  - Write unit tests covering all edge cases
  - Manual validation of first 100 transactions
  - Double-entry accounting checks
  - Clear audit trail for every commission
- **Contingency:** Immediate rollback, manual recalculation, photographer notification

**RISK T3: Dashboard Issues Worse Than Expected**
- **Probability:** High (many untested pages)
- **Impact:** Medium (user experience suffers)
- **Mitigation:**
  - Comprehensive testing session today (Nov 13)
  - Document all broken features
  - Prioritize fixes based on beta-critical paths
- **Contingency:** Disable broken features, show "Coming Soon" placeholders

**RISK T4: Email Delivery Failures**
- **Probability:** Medium (new provider setup)
- **Impact:** High (users miss critical notifications)
- **Mitigation:**
  - Test email delivery in development
  - Monitor delivery rates (target >95%)
  - Implement retry logic for failed sends
  - Backup notification method (in-app notifications)
- **Contingency:** Manual email sends for beta users if automation fails

**RISK T5: Testing Reveals 30%+ More Work**
- **Probability:** High (35-40% estimate may be optimistic)
- **Impact:** High (timeline slips significantly)
- **Mitigation:**
  - Conduct thorough testing TODAY
  - Update PRD with actual findings
  - Re-scope beta launch requirements if needed
  - Consider phased beta (limited features first)
- **Contingency:** Extend timeline or reduce beta scope

---

# Section 4: Epic and Story Structure

## Epic Approach

**Epic Structure Decision:** **5 sequential epics** with clear dependencies

**Rationale:**
- Epic 1 (Payments) is the critical blocker - must complete first
- Epic 2 (Dashboard fixes) can run partially parallel but needs Epic 1 data
- Epic 3 (Emails) depends on payment triggers from Epic 1
- Epic 4 (Onboarding) polishes user flows after core features work
- Epic 5 (Beta launch) is final preparation after all features validated

**Why 5 Epics vs. Single Epic:**
- Payment system alone is 3-4 weeks of work
- Dashboard testing/fixes is separate workstream
- Email system has different dependencies
- Each epic delivers testable value independently

---

# Section 5: Epic Details

## Epic 1: Payment Infrastructure & Stripe Connect Integration

**Epic Goal:** Enable full revenue flow from client payment → commission calculation → photographer payout. This is THE critical blocker for beta launch.

**Integration Requirements:**
- Connect to Stripe Connect API
- Store connected account IDs in `user_profiles` table
- Link payment events to commission records
- Maintain existing gallery/client workflows without disruption

**Epic Priority:** 🔴 **BLOCKER** - No beta launch without this

**Estimated Duration:** 3-4 weeks

---

### Story 1.1: Stripe Connect Account Linking

**As a** photographer
**I want** to connect my Stripe account during onboarding
**So that** I can receive commission payments automatically

**Acceptance Criteria:**
1. "Connect Stripe" button appears on photographer dashboard
2. Clicking button initiates Stripe Connect OAuth flow
3. OAuth flow completes and returns connected account ID
4. Connected account ID stored in `user_profiles.stripe_connect_id`
5. Dashboard displays "Connected" status with account details
6. Re-connection flow works for expired/disconnected accounts
7. Error handling shows clear messages for OAuth failures

**Integration Verification:**
- IV1: Existing photographer profile data remains intact after connection
- IV2: Photographers without Stripe accounts can still access dashboard
- IV3: Gallery/client management unaffected by Stripe connection

---

### Story 1.2: Client Checkout Page - Upfront Packages

**As a** client
**I want** to purchase an upfront storage package ($50 or $100)
**So that** I can access my gallery immediately and get free months

**Acceptance Criteria:**
1. Checkout page accessible via invite link or dashboard
2. Two package options displayed: $50 (6 months) or $100 (12 months)
3. Stripe Checkout Session created via API
4. Payment form renders with Stripe Elements
5. Successful payment redirects to gallery with confirmation
6. Failed payment shows clear error message
7. Payment record created in `client_payments` table
8. Client gains immediate gallery access after payment

**Integration Verification:**
- IV1: Client invitation flow leads to checkout page
- IV2: Gallery access granted immediately upon successful payment
- IV3: Failed payments do not create orphan records

---

### Story 1.3: Monthly Subscription Setup

**As a** client
**I want** to set up automatic monthly payments ($8/month)
**So that** my gallery access continues after my free period expires

**Acceptance Criteria:**
1. Subscription activates automatically after free period
2. Stripe Subscription created via API
3. First charge processes correctly
4. Recurring charges occur monthly
5. Subscription record created in `subscriptions` table
6. Failed subscription payments trigger retry logic
7. Client notified before first subscription charge

**Integration Verification:**
- IV1: Upfront package free period calculated correctly
- IV2: Gallery access maintained during subscription
- IV3: Subscription cancellation leaves data intact

---

### Story 1.4: Stripe Webhook Event Processing

**As a** system
**I want** to process Stripe webhook events reliably
**So that** payments, subscriptions, and payouts are tracked accurately

**Acceptance Criteria:**
1. Webhook signature verification passes for all events
2. Idempotency check prevents duplicate processing
3. 7 event types handled: `payment_intent.succeeded`, `charge.succeeded`, `invoice.paid`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `transfer.created`
4. Payment records created/updated in database
5. Commission records created on successful payments
6. Failed events logged to `webhook_logs` table
7. Webhook endpoint responds within 5 seconds

**Integration Verification:**
- IV1: Webhook processing does not block user requests
- IV2: Database transactions rolled back on processing errors
- IV3: Retry mechanism handles transient failures

---

### Story 1.5: Commission Calculation Engine

**As a** system
**I want** to automatically calculate 50/50 commissions on all payments
**So that** photographers receive accurate earnings

**Acceptance Criteria:**
1. Commission calculated immediately when client pays
2. 50% of payment amount allocated to photographer
3. 50% of payment amount allocated to platform
4. Commission record created with status "pending"
5. 2-week delay applied before status changes to "payable"
6. Edge cases handled: refunds, partial payments, prorated subscriptions
7. Audit trail created for every calculation

**Integration Verification:**
- IV1: Existing commission tracking UI displays new records
- IV2: Commission calculations verified against manual calculations
- IV3: Database constraints prevent negative commissions

---

### Story 1.6: Automated Commission Payout

**As a** system
**I want** to automatically transfer commissions to photographers' Stripe accounts
**So that** photographers receive earnings without manual intervention

**Acceptance Criteria:**
1. Daily cron job checks for "payable" commissions
2. Payable commissions (status = "pending" AND created > 2 weeks ago)
3. Stripe Transfer API called for each payout
4. Transfer ID stored in `commission_payments.stripe_transfer_id`
5. Commission status updated to "paid" on success
6. Failed transfers retry 3 times with exponential backoff
7. Photographer notified of payout via email

**Integration Verification:**
- IV1: Failed transfers do not mark commission as "paid"
- IV2: Photographer Stripe account balance increases correctly
- IV3: Multiple payouts to same photographer processed independently

---

### Story 1.7: Platform Fee Billing

**As a** system
**I want** to charge photographers $22/month automatically
**So that** platform subscription revenue is collected reliably

**Acceptance Criteria:**
1. Platform fee charged on photographer signup anniversary
2. Stripe Subscription created for platform fee
3. Payment processed via photographer's payment method
4. Invoice/receipt sent via email
5. Failed payment triggers retry logic (3 attempts)
6. After 3 failures: Account suspension warning sent
7. After 7 days of failure: Account suspended (no new galleries)

**Integration Verification:**
- IV1: Platform fee separate from client payment flow
- IV2: Suspended photographers can still view existing galleries
- IV3: Account reactivates immediately upon successful payment

---

### Story 1.8: Payment Failure Handling

**As a** system
**I want** to handle failed payments gracefully
**So that** users can resolve issues without losing access permanently

**Acceptance Criteria:**
1. Card declined → Clear error message to user
2. Insufficient funds → Clear error message with retry option
3. Expired card → Email notification to update payment method
4. 3D Secure required → Modal opens for authentication
5. Failed payments stored in `payment_history` with error codes
6. Client given 48 hours to resolve before access suspension
7. Photographer notified when client payment fails

**Integration Verification:**
- IV1: Gallery access suspended but not deleted after 48 hours
- IV2: Successful retry restores access immediately
- IV3: Multiple failed attempts do not create duplicate records

---

## Epic 2: Dashboard Testing & Fixes

**Epic Goal:** Ensure all three dashboards (client, photographer, admin) function correctly with zero 404 errors and accurate data display.

**Integration Requirements:**
- Replace all mock data with real database queries
- Fix broken navigation buttons
- Ensure responsive design on mobile
- Maintain existing layout/styling

**Epic Priority:** 🟠 **HIGH** - Critical for user experience

**Estimated Duration:** 1-2 weeks

---

### Story 2.1: Comprehensive Dashboard Testing

**As a** QA tester
**I want** to systematically test all dashboard pages
**So that** broken features are documented before fixing

**Acceptance Criteria:**
1. Client dashboard: Click every button, record 404s
2. Photographer dashboard: Click every button, record 404s
3. Admin dashboard: Click every button, record 404s
4. Document which features display mock data
5. Test mobile responsiveness for all pages
6. Create prioritized fix list (critical → nice-to-have)
7. Screenshot all broken pages for reference

**Integration Verification:**
- IV1: Testing does not modify production data
- IV2: Test accounts created for each user role
- IV3: Testing results documented in markdown

---

### Story 2.2: Fix Photographer Analytics Dashboard

**As a** photographer
**I want** to see real commission earnings on my analytics page
**So that** I can track my revenue accurately

**Acceptance Criteria:**
1. Remove hardcoded `mockData` from `/photographers/analytics`
2. Query `commission_payments` table for real earnings
3. Display total earned, pending commissions, paid commissions
4. Charts render with actual data (not fake numbers)
5. Handle empty state (no commissions yet)
6. Revenue trends calculated from actual payment history
7. Page loads in <1 second

**Integration Verification:**
- IV1: Charts still render correctly with varying data volumes
- IV2: Commission data filtered by photographer ID (RLS enforced)
- IV3: Date range filters work correctly

---

### Story 2.3: Fix Client Dashboard

**As a** client
**I want** to see accurate statistics on my dashboard
**So that** I know my gallery status and payment info

**Acceptance Criteria:**
1. Stats cards display real data (not dashes)
2. Total galleries count from database
3. Total photos count aggregated correctly
4. Payment status shows actual subscription state
5. Next payment date calculated correctly
6. All navigation buttons work (no 404s)
7. Gallery grid displays client's galleries only

**Integration Verification:**
- IV1: Client sees only their own galleries (RLS enforced)
- IV2: Shared galleries display correctly
- IV3: Dashboard updates immediately after payment

---

### Story 2.4: Fix Admin Dashboard

**As an** admin
**I want** to see real platform metrics
**So that** I can monitor business health

**Acceptance Criteria:**
1. Total users: Real count from `auth.users`
2. Total revenue: Sum from `payment_history`
3. Active subscriptions: Count from `subscriptions` WHERE active
4. Commission payouts: Sum from `commission_payments` WHERE status = "paid"
5. Charts render with actual data
6. Photographer list shows real accounts
7. Client list shows real clients

**Integration Verification:**
- IV1: Admin can access all data without RLS blocking
- IV2: Data updates reflect recent activity
- IV3: Performance remains acceptable with 100+ users

---

### Story 2.5: Fix All 404 Errors

**As a** user
**I want** all buttons to navigate to working pages
**So that** I'm not frustrated by broken links

**Acceptance Criteria:**
1. All broken links documented in Story 2.1 fixed
2. Missing pages created or buttons disabled with "Coming Soon"
3. Navigation menu items all functional
4. Breadcrumbs work correctly
5. Back buttons return to previous page
6. External links open in new tabs
7. Error pages styled consistently

**Integration Verification:**
- IV1: Fixed navigation does not break existing routes
- IV2: Disabled features clearly marked (not just hidden)
- IV3: 404 page exists for truly missing routes

---

## Epic 3: Email Notification System

**Epic Goal:** Implement transactional email system for client invitations, payment confirmations, and commission notifications.

**Integration Requirements:**
- Configure Resend or SendGrid API
- Create email templates matching PhotoVault branding
- Trigger emails from payment events (Epic 1 dependency)
- Store email logs for debugging

**Epic Priority:** 🟠 **HIGH** - Critical for user communication

**Estimated Duration:** 1 week

---

### Story 3.1: Email Infrastructure Setup

**As a** system
**I want** email sending infrastructure configured
**So that** transactional emails can be delivered reliably

**Acceptance Criteria:**
1. Resend API key configured in environment
2. Sending domain verified (e.g., noreply@photovault.com)
3. Email service wrapper created (`src/lib/email/send.ts`)
4. Test email sends successfully in development
5. Error handling catches delivery failures
6. Email logs stored in database (optional table)
7. Rate limiting configured (if applicable)

**Integration Verification:**
- IV1: Email sending does not block API responses
- IV2: Failed sends logged for debugging
- IV3: Email service swappable (Resend → SendGrid)

---

### Story 3.2: Client Invitation Email

**As a** photographer
**I want** to send invitation emails automatically when I add clients
**So that** clients receive gallery access instructions

**Acceptance Criteria:**
1. Email triggers when photographer adds client (Story 2.3 TODO)
2. Email contains: Photographer name, gallery link, signup instructions
3. Email template mobile-responsive
4. Email matches PhotoVault branding
5. Invitation link includes unique token
6. Email delivery confirmed via webhook (if supported)
7. Retry logic for failed sends (3 attempts)

**Integration Verification:**
- IV1: Client creation succeeds even if email fails
- IV2: Invitation token stored in `client_invitations` table
- IV3: Duplicate invitations prevented

---

### Story 3.3: Payment Confirmation Emails

**As a** client
**I want** to receive email confirmation when I make a payment
**So that** I have a receipt for my records

**Acceptance Criteria:**
1. Email triggers on `payment_intent.succeeded` webhook
2. Email contains: Payment amount, package details, receipt number
3. Email includes link to view invoice
4. Email sent within 2 minutes of payment
5. Email stored in `payment_history` table reference
6. PDF invoice generation (optional, can be post-beta)

**Integration Verification:**
- IV1: Email triggers after database record created
- IV2: Failed email does not rollback payment
- IV3: Email contains accurate payment details

---

### Story 3.4: Commission Notification Emails

**As a** photographer
**I want** to receive email when I earn a commission
**So that** I'm aware of my earnings immediately

**Acceptance Criteria:**
1. Email triggers when client payment creates commission
2. Email contains: Commission amount, client name, payout date (2 weeks)
3. Email links to commission dashboard
4. Email sent immediately after commission calculation
5. Email sent again when commission is paid out

**Integration Verification:**
- IV1: Email sent after commission record created
- IV2: Payout date calculated correctly in email
- IV3: Email does not reveal client payment method details

---

### Story 3.5: Monthly Billing Receipts

**As a** photographer
**I want** to receive monthly receipts for my $22 platform fee
**So that** I can track my business expenses

**Acceptance Criteria:**
1. Email triggers when platform fee charged
2. Email contains: Charge amount, billing period, receipt number
3. Email matches Stripe invoice details
4. Email sent within 24 hours of charge
5. Failed payment receipt includes retry information

**Integration Verification:**
- IV1: Receipt matches Stripe invoice data exactly
- IV2: Email sent even if charge fails
- IV3: Receipt stored for tax purposes

---

## Epic 4: Onboarding Experience Polish

**Epic Goal:** Create smooth, frictionless onboarding flows for photographers and clients to maximize activation and reduce support burden.

**Integration Requirements:**
- Guide users through critical setup steps
- Provide contextual help and tooltips
- Display helpful empty states
- Minimize steps to first value (first gallery for photographers, first view for clients)

**Epic Priority:** 🟡 **MEDIUM** - Important for beta success

**Estimated Duration:** 1 week

---

### Story 4.1: Photographer Onboarding Wizard

**As a** photographer signing up
**I want** step-by-step guidance through initial setup
**So that** I can start using PhotoVault quickly

**Acceptance Criteria:**
1. After signup: Welcome modal with 3-step overview
2. Step 1: "Connect Stripe Account" with CTA button
3. Step 2: "Create Your First Gallery" tutorial
4. Step 3: "Invite Your First Client" walkthrough
5. Progress indicator shows completion (0/3, 1/3, etc.)
6. Steps can be skipped but marked incomplete
7. Dashboard highlights next incomplete step

**Integration Verification:**
- IV1: Onboarding wizard does not block dashboard access
- IV2: Completed steps remain completed across sessions
- IV3: Wizard dismissible but accessible from help menu

---

### Story 4.2: Client Onboarding Flow

**As a** client accepting an invitation
**I want** clear guidance on setting up my account
**So that** I can view my gallery and pay easily

**Acceptance Criteria:**
1. Invitation email links to signup page
2. Signup form pre-fills photographer and gallery info
3. After signup: Welcome modal explaining gallery access
4. Payment setup modal appears (non-blocking)
5. Client can view gallery before paying (free preview)
6. Payment prompt appears with package options
7. After payment: Confirmation modal with download instructions

**Integration Verification:**
- IV1: Client signup works without payment
- IV2: Gallery access granted immediately after payment
- IV3: Invitation token validated before signup

---

### Story 4.3: Empty State Improvements

**As a** user with no data
**I want** helpful prompts to get started
**So that** I know what to do next

**Acceptance Criteria:**
1. Photographer - No galleries: "Create your first gallery" CTA
2. Photographer - No clients: "Invite your first client" CTA
3. Client - No galleries: "Contact your photographer" message
4. Admin - No users: "Invite beta photographers" CTA
5. Empty states include illustrations or icons
6. Empty states explain why page is empty
7. Empty states provide one clear next action

**Integration Verification:**
- IV1: Empty states disappear after first item added
- IV2: Empty states maintain layout consistency
- IV3: CTAs navigate to correct pages

---

### Story 4.4: Contextual Help & Tooltips

**As a** user
**I want** help text explaining unfamiliar features
**So that** I don't need to contact support

**Acceptance Criteria:**
1. Stripe Connect button has tooltip: "Link your account to receive payments"
2. Commission dashboard has info icon: "Commissions paid 2 weeks after client payment"
3. Platform fee shown with explanation: "Covers storage, hosting, and support"
4. Gallery sharing has help text: "Clients can view without account"
5. Tooltips appear on hover (desktop) and tap (mobile)
6. Help text uses simple, jargon-free language

**Integration Verification:**
- IV1: Tooltips do not obstruct clickable elements
- IV2: Help text accessible to screen readers
- IV3: Tooltips dismiss correctly

---

## Epic 5: Beta Launch Readiness

**Epic Goal:** Establish infrastructure for successful beta launch with 5-10 photographers, including monitoring, feedback collection, and support documentation.

**Integration Requirements:**
- Set up error monitoring and alerting
- Create beta feedback mechanisms
- Write support documentation
- Define success metrics dashboard

**Epic Priority:** 🟡 **MEDIUM** - Essential for beta management

**Estimated Duration:** 1 week

---

### Story 5.1: Error Monitoring & Alerting

**As a** development team
**I want** real-time error tracking
**So that** critical bugs are caught immediately

**Acceptance Criteria:**
1. Sentry (or similar) configured in production
2. Payment errors trigger Slack/email alerts
3. Webhook failures logged and alerted
4. Commission calculation errors alert immediately
5. Error dashboard shows recent issues
6. Source maps uploaded for debugging
7. PII excluded from error logs

**Integration Verification:**
- IV1: Error tracking does not impact performance
- IV2: Alerts sent within 5 minutes of error
- IV3: False positive alerts minimized

---

### Story 5.2: Beta Feedback Collection

**As a** beta user
**I want** easy ways to provide feedback
**So that** I can help improve the product

**Acceptance Criteria:**
1. Feedback widget accessible from all pages
2. Widget captures: Description, screenshot, page URL
3. Bug report form includes repro steps
4. Feature request form captures use case
5. Feedback submissions stored in database or external tool
6. Team reviews submissions weekly
7. Users notified when feedback addressed

**Integration Verification:**
- IV1: Feedback widget does not obstruct page content
- IV2: Submissions successful even if user navigates away
- IV3: Duplicate submissions prevented

---

### Story 5.3: Support Documentation

**As a** beta user
**I want** comprehensive guides
**So that** I can resolve issues without contacting support

**Acceptance Criteria:**
1. Photographer setup guide: Signup → Stripe → First gallery
2. Client FAQ: How to view, download, pay
3. Troubleshooting guide: Common issues and solutions
4. Stripe Connect setup: Step-by-step with screenshots
5. Documentation searchable
6. Documentation mobile-responsive
7. Documentation versioned (beta v1.0)

**Integration Verification:**
- IV1: Documentation accessible without login
- IV2: Links to documentation from app help menu
- IV3: Documentation updated as features change

---

### Story 5.4: Beta Metrics Dashboard

**As a** product team
**I want** key metrics dashboard
**So that** I can track beta success

**Acceptance Criteria:**
1. Dashboard shows: Signups, active users, revenue, commissions paid
2. User activation funnel: Signup → Stripe → Gallery → Client → Payment
3. Payment conversion rate tracked
4. Photographer retention tracked (monthly)
5. Client retention tracked (monthly)
6. Dashboard updates in real-time or hourly
7. Metrics exportable to CSV

**Integration Verification:**
- IV1: Metrics calculated from actual database data
- IV2: Dashboard accessible to admin role only
- IV3: Metrics match manual calculations

---

### Story 5.5: Beta Launch Checklist Validation

**As a** product owner
**I want** pre-launch checklist completion
**So that** beta launch proceeds smoothly

**Acceptance Criteria:**
1. All Epic 1-4 stories complete and tested
2. Payment flow tested end-to-end in Stripe test mode
3. Email delivery confirmed (>95% success rate)
4. All 404 errors resolved
5. Support documentation published
6. 5-10 beta photographers recruited and confirmed
7. Monitoring and alerting operational
8. Emergency rollback plan documented

**Integration Verification:**
- IV1: Production environment matches staging
- IV2: Stripe production keys configured
- IV3: Database migrations applied to production

---

# Section 6: Testing Strategy & Validation

## Testing Approach

### Phase 1: Dashboard Testing (TODAY - November 13, 2025)
**Objective:** Document actual state of all dashboards

**Method:**
1. Start dev server: `cd photovault-hub && npm run dev`
2. Create test accounts: 1 photographer, 1 client, 1 admin
3. Systematically click every button and link
4. Document 404 errors, broken features, mock data
5. Screenshot all issues
6. Update this PRD with findings

**Deliverable:** Testing results markdown document

---

### Phase 2: Payment Flow Testing (Week 1-2)
**Objective:** Validate Stripe integration end-to-end

**Method:**
1. Configure Stripe test mode API keys
2. Create Stripe Connect test account
3. Test OAuth flow: Connect → Disconnect → Reconnect
4. Test checkout: Upfront package purchase ($50)
5. Test webhook: Manually trigger events via Stripe CLI
6. Verify commission calculation on test payment
7. Verify commission record created with "pending" status

**Success Criteria:**
- Stripe Connect OAuth completes successfully
- Test payment processes without errors
- Webhook handler responds within 5 seconds
- Commission calculated correctly (50% split)

---

### Phase 3: Email Testing (Week 2-3)
**Objective:** Verify email delivery and content

**Method:**
1. Configure Resend test mode
2. Trigger invitation email by adding client
3. Verify email received within 2 minutes
4. Trigger payment confirmation by completing test payment
5. Verify commission notification sent to photographer
6. Check all email templates on mobile devices

**Success Criteria:**
- All emails delivered within 2 minutes
- Email templates render correctly on iOS/Android
- Unsubscribe links functional
- No typos or broken links

---

### Phase 4: Onboarding Testing (Week 3-4)
**Objective:** Validate user flows from signup to first value

**Method:**
1. Test photographer onboarding: Signup → Stripe → Gallery → Client
2. Time each step (target <5 minutes total)
3. Test client onboarding: Invitation → Signup → View → Pay
4. Time each step (target <5 minutes total)
5. Identify friction points
6. Verify empty states display correctly

**Success Criteria:**
- Photographer creates first gallery in <5 minutes
- Client views gallery and pays in <5 minutes
- Empty states helpful and actionable

---

### Phase 5: Beta User Testing (Week 4-6)
**Objective:** Validate with real users (5-10 beta photographers)

**Method:**
1. Recruit beta photographers via personal network
2. Onboard 2-3 per week
3. Monitor error logs daily
4. Conduct weekly feedback interviews
5. Track activation funnel metrics
6. Document feature requests and bugs

**Success Criteria:**
- 80%+ photographer activation (create gallery + invite client)
- 60%+ client payment conversion
- <5 critical bugs reported
- Positive feedback from 70%+ beta users

---

## Testing Priorities

### P0: CRITICAL (Must work before beta)
- ✅ Desktop upload (already tested and working)
- 🔴 Stripe Connect OAuth flow
- 🔴 Client payment processing (upfront packages)
- 🔴 Webhook event handling
- 🔴 Commission calculation
- 🔴 Email delivery (invitations, payments)

### P1: HIGH (Should work before beta)
- 🟠 Photographer analytics (remove mock data)
- 🟠 Client dashboard (real stats)
- 🟠 Admin dashboard (real metrics)
- 🟠 Monthly subscription flow
- 🟠 Commission payout automation

### P2: MEDIUM (Nice to have for beta)
- 🟡 Onboarding wizards
- 🟡 Contextual help tooltips
- 🟡 Beta feedback widget
- 🟡 Support documentation

---

# Section 7: Timeline & Milestones

## Revised Timeline (Post-Testing)

**Note:** Timeline will be updated after dashboard testing completes today (November 13, 2025)

### Week 1-2: Epic 1 - Payment Infrastructure
**Goal:** Stripe Connect integrated, test payments processing

**Milestones:**
- [ ] Day 1-2: Stripe Connect OAuth flow built and tested
- [ ] Day 3-4: Checkout page created (upfront packages)
- [ ] Day 5-6: Webhook handler tested with Stripe CLI
- [ ] Day 7-8: Commission calculation logic verified
- [ ] Day 9-10: End-to-end payment flow tested

**Success Metric:** Test payment → Commission created → Webhook processed successfully

---

### Week 3: Epic 2 - Dashboard Fixes + Epic 3 - Emails
**Goal:** All dashboards functional, core emails sending

**Milestones:**
- [ ] Day 1-2: Photographer analytics fixed (remove mockData)
- [ ] Day 3-4: Client dashboard fixed (real stats)
- [ ] Day 5: Admin dashboard fixed (real metrics)
- [ ] Day 6-7: Email infrastructure configured (Resend)
- [ ] Day 8: Invitation emails working
- [ ] Day 9: Payment confirmation emails working
- [ ] Day 10: Commission notification emails working

**Success Metric:** All dashboards show real data, all critical emails delivered

---

### Week 4: Epic 4 - Onboarding + Epic 5 - Beta Prep
**Goal:** Smooth user flows, beta infrastructure ready

**Milestones:**
- [ ] Day 1-2: Photographer onboarding wizard built
- [ ] Day 3-4: Client onboarding flow polished
- [ ] Day 5: Empty states improved
- [ ] Day 6: Error monitoring configured (Sentry)
- [ ] Day 7: Feedback widget added
- [ ] Day 8: Support documentation written
- [ ] Day 9-10: Beta metrics dashboard built

**Success Metric:** First beta photographer onboarded successfully end-to-end

---

### Week 5-6: Beta Launch & Iteration
**Goal:** Onboard 5-10 photographers, validate product-market fit

**Milestones:**
- [ ] Week 5 Day 1: Launch to first 2-3 beta photographers
- [ ] Week 5 Day 3: First client invitations sent
- [ ] Week 5 Day 7: First real payments processed
- [ ] Week 6 Day 1: Onboard remaining beta photographers
- [ ] Week 6 Day 7: First commission payouts (2-week delay)
- [ ] Week 6 Day 14: Beta retrospective and iteration planning

**Success Metric:** 5+ active photographers, 10+ paying clients, <5 critical bugs

---

## Go/No-Go Decision Criteria

### ✅ LAUNCH BETA IF:
- All Epic 1 (Payments) stories complete and tested
- All Epic 2 (Dashboard fixes) P0 issues resolved
- All Epic 3 (Emails) core notifications working
- 5+ beta photographers recruited and confirmed
- Support documentation published
- Error monitoring operational

### ❌ DELAY LAUNCH IF:
- Payment processing has critical bugs
- Commission calculation shows any inaccuracy
- Email delivery rate <90%
- <3 beta photographers recruited
- Stripe Connect OAuth fails in testing

### 🛑 PIVOT/REASSESS IF:
- Testing reveals 50%+ more work than estimated
- Stripe integration blocked by technical limitations
- Beta photographer recruitment fails completely
- Timeline extends beyond 8 weeks

---

# Section 8: Success Metrics

## Beta Launch Success Criteria

### Product Metrics
- **Payment Success Rate:** >98% of transactions process successfully
- **Email Delivery Rate:** >95% of emails delivered within 2 minutes
- **Uptime:** >99% during beta period
- **Page Load Time:** <3 seconds for all critical pages
- **Commission Accuracy:** 100% (zero tolerance for calculation errors)

### User Metrics
- **Photographer Activation:** >80% create gallery + invite client
- **Client Payment Conversion:** >60% of invitations result in payment
- **Photographer Retention:** >80% remain active after month 1
- **Client Retention:** >70% maintain subscription after month 1
- **NPS Score:** >7/10 from beta photographers

### Business Metrics
- **Beta Photographers:** 5-10 active accounts
- **Total Clients:** 20+ paying clients
- **MRR:** $160+ from client subscriptions
- **Commission Payouts:** 100% accuracy, 100% on-time (2-week delay)
- **Platform Fees:** >80% collection rate

### Quality Metrics
- **Critical Bugs:** 0 in production
- **P1 Bugs:** <5 during beta
- **Support Tickets:** <2 per user per month
- **Dashboard Load Time:** <1 second
- **Webhook Processing:** <5 seconds per event

---

# Section 9: Open Questions & Decisions Needed

## Pre-Development Questions

1. **Stripe Account Type:**
   - ❓ Have you created a Stripe account yet?
   - ❓ Which connected account type: Standard, Express, or Custom?
   - **Recommendation:** Express accounts (easiest for photographers)

2. **Email Provider:**
   - ❓ Resend vs. SendGrid vs. AWS SES?
   - **Recommendation:** Resend (developer-friendly, good deliverability)

3. **Beta Timeline:**
   - ❓ Is 5-6 weeks still realistic given payments are 0% complete?
   - **Recommendation:** Re-assess after dashboard testing today

4. **Landing Page Modifications:**
   - ❓ You mentioned landing page needs modifications - what specifically?
   - ❓ Does it meet Stripe Connect requirements already?

5. **Testing Coverage:**
   - ❓ Should we add automated tests during development?
   - **Recommendation:** At minimum, unit tests for commission calculation

6. **Phone Dump Feature:**
   - ❓ Is this in scope for beta or future?
   - **Recommendation:** Post-beta unless critical differentiator

7. **Directory Feature:**
   - ❓ What is the photographer directory? Public listing?
   - **Recommendation:** Clarify or remove from scope

---

## Post-Testing Decisions (Update After Today)

**These will be answered after dashboard testing:**

1. How many 404 errors actually exist?
2. Which dashboards have the most issues?
3. Is mock data only in analytics or elsewhere?
4. What percentage of buttons are broken?
5. Are any features completely unusable?
6. Should any features be removed from beta scope?
7. Does completion estimate need further revision?

---

# Section 10: Next Steps

## Immediate Actions (TODAY - November 13, 2025)

1. **Start Dev Server**
   ```bash
   cd C:\Users\natha\.cursor\Photo Vault\photovault-hub
   npm run dev
   ```

2. **Systematic Dashboard Testing**
   - Create test accounts (photographer, client, admin)
   - Click every button on every page
   - Document 404s and broken features
   - Screenshot issues
   - Note which pages use mock data

3. **Update This PRD**
   - Add testing results to Section 6
   - Revise completion estimate if needed
   - Update timeline based on findings
   - Adjust epic priorities

4. **Review Findings**
   - Discuss discovered issues
   - Re-scope if necessary
   - Confirm Epic 1 (Payments) remains top priority

---

## Short-Term Actions (Next 7 Days)

1. **Stripe Connect Research**
   - Review Stripe Connect documentation
   - Decide on account type (Express recommended)
   - Create Stripe test account
   - Generate test API keys

2. **Email Provider Setup**
   - Sign up for Resend (or chosen provider)
   - Verify sending domain
   - Test email delivery in development

3. **Begin Epic 1 Development**
   - Story 1.1: Stripe Connect OAuth flow
   - Set up development environment variables
   - Create test connected accounts

---

## Medium-Term Actions (Next 30 Days)

1. **Complete Epic 1 (Payments)**
   - All 8 stories implemented and tested
   - End-to-end payment flow verified
   - Commission calculation validated

2. **Complete Epic 2 (Dashboards)**
   - All mock data replaced
   - All 404s fixed
   - All dashboards functional

3. **Complete Epic 3 (Emails)**
   - Email infrastructure operational
   - Core notifications sending reliably

4. **Begin Epic 4 (Onboarding)**
   - Onboarding flows drafted
   - Empty states improved

---

## Long-Term Actions (Next 60 Days)

1. **Complete Epic 5 (Beta Launch)**
   - Monitoring configured
   - Documentation published
   - Beta photographers recruited

2. **Launch Beta**
   - Onboard first 2-3 photographers
   - Monitor closely for issues
   - Iterate based on feedback

3. **Beta Retrospective**
   - Assess product-market fit
   - Plan post-beta roadmap
   - Decide: Scale, pivot, or iterate

---

# APPENDIX

## Glossary

- **Commission:** 50% of client payment earned by photographer
- **Platform Fee:** $22/month paid by photographer for PhotoVault access
- **Upfront Package:** $50 (6 months) or $100 (12 months) prepaid storage
- **TUS Protocol:** Resumable file upload standard (used in desktop app)
- **Stripe Connect:** Payment infrastructure for marketplace platforms
- **RLS:** Row Level Security (Supabase database access control)
- **BMAD:** Breakthrough Method for Agile AI-Driven Development

---

## Key Resources

### Documentation
- Beta Launch Strategy: `PhotoVault_Beta_Launch_Strategy_v1.0.md`
- Project Structure: `PROJECT_STRUCTURE.md`
- Current Status: `CURRENT_STATUS.md`
- Stripe Setup: Multiple files in `docs/` folder

### External APIs
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Resend API](https://resend.com/docs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [TUS Protocol](https://tus.io/)

---

## Contact & Escalation

**Product Owner:** Nathaniel Crowell
**Current Phase:** Beta Completion
**Priority:** Payment system integration (Epic 1)

**Escalation Path:**
- Payment/Stripe issues → Immediate attention
- Commission calculation errors → Critical priority
- Dashboard bugs → Document and prioritize
- Email delivery issues → Address within 24 hours

---

**END OF PRD**

**Next Action:** Start dev server and begin dashboard testing (Section 10)

---

**Document Status:** Draft - Awaiting Testing Validation
**Last Updated:** November 13, 2025
**Version:** 1.0
