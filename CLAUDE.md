# PhotoVault Hub - Claude Code Context

**Last Updated:** November 30, 2025
**Project:** PhotoVault Hub - Next.js Web Application
**Status:** Active Development - Phase 1 Beta MVP

---

## Parent Documentation

**IMPORTANT: Read the parent CLAUDE.md first for project-wide context:**
```
C:\Users\natha\.cursor\Photo Vault\CLAUDE.md
```

The parent file contains:
- Documentation loading instructions (topic → doc mapping)
- Cross-project awareness (hub ↔ desktop)
- Business model reference
- Environment URLs

This file contains **hub-specific** details only.

---

## Hub-Specific Documentation Index

When working on hub features, these docs contain the details:

| Topic | Files in this directory |
|-------|-------------------------|
| **Email system** | `RESEND-EMAIL-SETUP.md`, `EMAIL_SYSTEM_IMPLEMENTATION.md`, `EMAIL_TEMPLATES_COMPLETE.md` |
| **Stripe/payments** | `STRIPE-SETUP-GUIDE.md`, `STRIPE_INTEGRATION_COMPLETE.md`, `STRIPE_VERIFICATION_CHECKLIST.md` |
| **Webhooks** | `WEBHOOK_README.md`, `docs/STRIPE_WEBHOOK_SETUP.md` |
| **Commissions** | `COMMISSION-SYSTEM-IMPLEMENTATION.md`, `COMMISSION_TESTING_GUIDE.md`, `COMMISSION-SYSTEM-CORRECTED.md` |
| **Client onboarding** | `CLIENT-ONBOARDING-SETUP.md` |
| **Gallery setup** | `GALLERY-SETUP-GUIDE.md` |
| **Deployment** | `DEPLOYMENT-CHECKLIST.md`, `DEPLOYMENT-GUIDE.md`, `VERCEL-ENV-SETUP.md` |
| **Messaging** | `MESSAGING_SETUP.md`, `MESSAGING-SYSTEM-MVP.md` |
| **Database** | `SUPABASE-SETUP.md`, `setup-database.md`, `database/*.sql` |
| **PRD/Requirements** | `docs/prd.md` (55KB - only read if doing product work) |

---

## Work Plan System

### What is WORK_PLAN.md?

`WORK_PLAN.md` is the **master task list** containing:
- All remaining work organized into **Epics** (major milestones)
- Each Epic broken into **Stories** (one context window each)
- Each Story has **Tasks** with checkboxes
- **Acceptance Criteria** for when a story is complete

### How to Use the Work Plan

1. **Starting a new session:**
   - Read parent `CLAUDE.md` for topic loading
   - Check "SESSION STATE" below for current progress
   - Check `WORK_PLAN.md` for story details

2. **Working on a story:**
   - Find the story in `WORK_PLAN.md`
   - Follow tasks in order
   - Mark complete as you go: `[ ]` → `[x]`

3. **Completing a story:**
   - Verify all Acceptance Criteria met
   - Update SESSION STATE below
   - Sync to Stone Fence Brain

### Current Phase: Phase 1 - Beta MVP (19 Stories)

| Epic | Description | Stories | Status |
|------|-------------|---------|--------|
| **Epic 1** | Payment System Completion | 6 | 🔴 Not Started |
| **Epic 2** | Dashboard Fixes | 4 | 🔴 Not Started |
| **Epic 3** | Email System | 3 | 🔴 Not Started |
| **Epic 4** | Onboarding Polish | 3 | 🔴 Not Started |
| **Epic 5** | Beta Launch Prep | 3 | 🔴 Not Started |

**Status Key:** 🔴 Not Started | 🟡 In Progress | ✅ Complete

---

## BMAD Agents

Use BMAD agents for structured work. Located in `.claude/commands/BMad/`.

| When To Use | Command | Agent | What It Does |
|-------------|---------|-------|--------------|
| **Creating a new story** | `/sm` | Scrum Master (Bob) | Use `*draft` to create story file |
| **Implementing code** | `/dev` | Developer (James) | Use `*develop-story` to implement |
| **Reviewing work** | `/qa` | QA (Quinn) | Use `*review` to validate |
| **Planning/Course correction** | `/pm` | Product Manager (John) | PRD updates, scope changes |

---

## Architecture Overview

```
photovault-hub/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # API routes
│   │   │   ├── stripe/        # Stripe checkout & connect
│   │   │   ├── webhooks/      # Stripe webhooks
│   │   │   └── email/         # Email sending endpoints
│   │   ├── photographer/      # Photographer portal
│   │   ├── client/            # Client portal
│   │   ├── admin/             # Admin dashboard
│   │   └── gallery/           # Public gallery pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── stripe/           # Stripe Elements components
│   ├── contexts/              # React contexts (AuthContext)
│   ├── lib/                   # Utilities
│   │   ├── stripe.ts         # Stripe configuration
│   │   ├── email/            # Email templates & service
│   │   ├── supabase/         # Supabase clients
│   │   └── server/           # Server-side services
│   └── middleware.ts          # Auth & route protection
├── public/
│   └── landing-page.html      # Static landing page
├── database/                   # SQL schemas & migrations
└── docs/                       # Additional documentation
```

---

## Critical Configuration

### Stripe Integration
- **File:** `src/lib/stripe.ts`
- **Commission Rate:** 50% (`PHOTOGRAPHER_COMMISSION_RATE = 0.50`)
- **API Version:** `2025-09-30.clover`

### Pricing (Stripe Products)
| Product | Price | Product ID |
|---------|-------|------------|
| Year Package | $100 + $8/mo | `prod_TV5f6EOT5K3wKt` |
| 6-Month Package | $50 + $8/mo | `prod_TV5f1eAehZIlA2` |
| 6-Month Trial | $20 one-time | `prod_TV5fYvY8l0WaaV` |
| Reactivation Fee | $20 one-time | `prod_TV5gd98OolGs4g` |
| Client Monthly | $8/month | `prod_TV5gXyg5nNn635` |
| Direct Monthly | $8/month (0% commission) | `prod_TV6BkuQUCil1ZD` |
| Photographer Platform | $22/month | `prod_TV5evkNAa2Ezo5` |

### Database
- **Primary gallery table:** `photo_galleries` (NOT `galleries`)
- **Photos table columns:** `original_url`, `thumbnail_url`, `full_url`, `filename`

### Authentication
- **Provider:** Supabase Auth
- **User Types:** `photographer`, `client`, `admin`
- **Middleware:** `src/middleware.ts`

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Homepage redirect | `src/app/page.tsx` |
| Stripe config | `src/lib/stripe.ts` |
| Webhook handler | `src/app/api/webhooks/stripe/route.ts` |
| Auth middleware | `src/middleware.ts` |
| Auth context | `src/contexts/AuthContext.tsx` |
| Email service | `src/lib/email/email-service.ts` |
| Gallery creation | `src/app/photographer/galleries/create/page.tsx` |
| Gallery upload | `src/app/photographer/galleries/[id]/upload/page.tsx` |
| Sneak peek select | `src/app/photographer/galleries/[id]/sneak-peek-select/page.tsx` |

---

## Development Commands

```bash
cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"
npm run dev          # Start dev server (port varies: 3002-3007)
npm run build        # Production build
npm run type-check   # TypeScript validation
```

### Stripe CLI (Required for Webhook Testing)

**Location:** `C:\Users\natha\stripe-cli\stripe.exe`

```powershell
# Start webhook forwarding (update port as needed)
& 'C:\Users\natha\stripe-cli\stripe.exe' listen --forward-to localhost:3007/api/webhooks/stripe

# Trigger test events
& 'C:\Users\natha\stripe-cli\stripe.exe' trigger payment_intent.succeeded
```

---

## Environment Variables

Required in `.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=PhotoVault <noreply@photovault.photo>

# Site URL (update port as needed)
NEXT_PUBLIC_SITE_URL=http://localhost:3007
```

---

## Public Routes (No Auth Required)

From `src/middleware.ts`:
```typescript
const publicRoutes = [
  '/', '/about', '/contact', '/privacy', '/terms',
  '/financial-model', '/application', '/download-desktop-app',
  '/signup', '/auth/signup', '/photographers/signup',
  '/auth/desktop-callback', '/connect', '/logout',
]
```

Static files (`.html`, `.png`, `.jpg`) bypass middleware automatically.

---

## Known Issues

1. **Multiple GoTrueClient Instances** - Console warning, low impact
2. **Some photos missing `photo_url`** - Fallback to `thumbnail_url` implemented
3. **AuthContext race condition** - Fixed with `initializedRef` check (Nov 29)
4. **Settings page not in nav** - "Subscription" should be "Settings"
5. **Desktop uploader port conflict** - Hardcoded 57123

---

## Sync Rule

After updating this file, sync to Stone Fence Brain:
```bash
cp CLAUDE.md "C:\Users\natha\Stone-Fence-Brain\PHOTOVAULT_CURRENT_STATE.md"
```

---

## SESSION STATE (Nov 30, 2025)

### Current Session - Documentation Structure

**Task:** Creating progressive disclosure documentation system
**Status:** Building CLAUDE.md files at parent, hub, and desktop levels

### Previous Session (Nov 29, 2025 - Session 3)

**Story:** 1.1 - Payment Flow Testing & Verification
**Status:** Gallery creation, photo upload, sneak peek select page all working.

**Progress:**
- ✅ Dual-table architecture consolidated (`photo_galleries` is canonical)
- ✅ AuthContext race condition fixed
- ✅ Gallery creation flow working
- ✅ Photo upload working
- ✅ Sneak Peek Select page created
- ✅ Gallery Ready Email API created

**Test Gallery:**
- ID: `c0962a4c-9258-44ed-9123-ebf78645abba`
- Name: "things"
- Status: draft (photos uploaded, ready for sneak peek selection)

**Next Steps:**
1. Test sneak peek select page
2. Verify email is sent to client
3. Log in as client and view gallery
4. Test client payment flow ($100)
5. Verify webhook fires and commission record created

**Dev Server Port:** 3007

---

## Files Created/Modified Recently

### Nov 29, 2025
| File | Purpose |
|------|---------|
| `src/app/photographer/galleries/[id]/sneak-peek-select/page.tsx` | Sneak peek photo selection |
| `src/app/api/email/gallery-ready/route.ts` | Gallery ready notification |
| `database/add-pricing-columns-to-photo-galleries.sql` | Pricing columns migration |

### Nov 27, 2025
| File | Purpose |
|------|---------|
| `src/components/stripe/StripeProvider.tsx` | Elements context provider |
| `src/components/stripe/PaymentMethodForm.tsx` | Add payment methods |
| `src/components/stripe/PaymentMethodManager.tsx` | CRUD for payment methods |
| `src/app/api/stripe/setup-intent/route.ts` | SetupIntent API |
| `src/lib/payment-models.ts` | Payment option definitions |
