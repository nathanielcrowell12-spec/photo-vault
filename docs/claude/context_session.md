# PhotoVault - Session Context for Sub-Agents

**Purpose:** This file provides sub-agents with project context so they can research and plan effectively.
**Last Updated:** November 30, 2025
**Updated By:** Parent Agent

---

## Project Overview

**PhotoVault** is a SaaS platform for professional photographers to:
1. Deliver photos to clients via beautiful galleries
2. Earn recurring revenue through client subscriptions
3. Build long-term client relationships

### Business Model
- **Year 1:** Client pays $100 upfront → Photographer earns $50, PhotoVault keeps $50
- **Year 2+:** Client pays $8/month → Photographer earns $4/month, PhotoVault keeps $4/month

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript |
| **UI** | Tailwind CSS, shadcn/ui components |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL + Auth + Storage) |
| **Payments** | Stripe (Checkout, Connect, Subscriptions, Webhooks) |
| **Email** | Resend API |
| **Deployment** | Vercel |
| **Desktop App** | Electron (separate repo: photovault-desktop) |

---

## Current Work Status

### Phase: Phase 1 - Beta MVP
### Current Story: 1.1 - Payment Flow Testing & Verification

### Epics Status

| Epic | Description | Status |
|------|-------------|--------|
| Epic 1 | Payment System Completion | 🟡 In Progress |
| Epic 2 | Dashboard Fixes | 🔴 Not Started |
| Epic 3 | Email System | ✅ Complete |
| Epic 4 | Onboarding Polish | 🔴 Not Started |
| Epic 5 | Beta Launch Prep | 🔴 Not Started |

### Recently Completed (Nov 30, 2025)
- Fixed gallery-ready email 400 error (Supabase join handling)
- Fixed TypeScript errors in sneak-peek-select and galleries pages
- Added "Resend Notification" feature to galleries page
- Email delivery working in both localhost and production

### Known Issues
1. Multiple GoTrueClient instances warning - Low impact
2. Some photos missing `photo_url` - Fallback to thumbnail_url
3. `is_sneak_peek` column missing from photos table

---

## Key Architecture Decisions

### Database Tables
- **Primary gallery table:** `photo_galleries` (NOT `galleries`)
- **Photos:** `gallery_photos` with `original_url`, `thumbnail_url`, `full_url`, `filename`
- **Clients:** `clients` table linked to galleries
- **Commissions:** `commission_payments` table

### Stripe Configuration
- **Commission Rate:** 50% (defined in `src/lib/stripe.ts`)
- **API Version:** `2025-09-30.clover`
- **Webhook Secret:** Stored in `STRIPE_WEBHOOK_SECRET` env var

### Stripe Products (Test Mode)
| Product | Price | Product ID |
|---------|-------|------------|
| Year Package | $100 + $8/mo | `prod_TV5f6EOT5K3wKt` |
| 6-Month Package | $50 + $8/mo | `prod_TV5f1eAehZIlA2` |
| 6-Month Trial | $20 one-time | `prod_TV5fYvY8l0WaaV` |
| Client Monthly | $8/month | `prod_TV5gXyg5nNn635` |
| Direct Monthly | $8/month (0% commission) | `prod_TV6BkuQUCil1ZD` |
| Photographer Platform | $22/month | `prod_TV5evkNAa2Ezo5` |

---

## File Structure (Key Locations)

```
photovault-hub/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── stripe/          # Stripe checkout, connect, webhooks
│   │   │   ├── email/           # Email endpoints
│   │   │   └── webhooks/stripe/ # Stripe webhook handler
│   │   ├── photographer/        # Photographer portal
│   │   ├── client/              # Client portal
│   │   └── gallery/             # Public gallery pages
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   └── stripe/              # Stripe Elements components
│   ├── lib/
│   │   ├── stripe.ts            # Stripe config & helpers
│   │   ├── email/               # Email templates & service
│   │   └── supabase/            # Supabase clients
│   └── middleware.ts            # Auth & route protection
├── database/                    # SQL schemas & migrations
└── docs/                        # Additional documentation
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=PhotoVault <noreply@photovault.photo>

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3007  # or https://photovault.photo
```

---

## Next Tasks (For Context)

1. Test client payment flow (client receives email → clicks link → pays)
2. Verify webhook fires and commission record created
3. Test full end-to-end: Gallery → Upload → Notify → Pay → Commission
4. Story 1.2: Commission Payout Automation (cron job)
5. Story 1.3: Platform Fee Billing ($22/month for photographers)

---

## Instructions for Sub-Agents

### Your Role
You are a **research and planning specialist**. Your job is to:
1. Read this context file first
2. Research the specific topic using official documentation
3. Search the codebase for existing patterns
4. Write a detailed implementation plan

### Your Output
Write your plan to: `docs/claude/plans/[task-name]-plan.md`

### Plan Format
Your plan should include:
1. **Summary** - What needs to be done (1-2 sentences)
2. **Research Findings** - What you learned from official docs
3. **Existing Patterns** - What patterns already exist in the codebase
4. **Implementation Steps** - Specific, numbered steps
5. **Code Examples** - Actual code snippets to use
6. **Files to Modify** - Exact file paths
7. **Testing Steps** - How to verify it works

### Important Rules
1. **NEVER write implementation code directly** - Only write plans
2. **Follow official documentation** - You are the expert, not us
3. **Reference existing patterns** - Maintain consistency
4. **Be specific** - Include file paths, function names, line numbers
5. **Update this file** - Add any important findings to "Recent Discoveries"

---

## Recent Discoveries (Sub-Agents Add Here)

*Sub-agents: Add any important patterns or gotchas you discover here.*

- **Supabase joins:** Single relations return objects, not arrays. Always check `Array.isArray()`.
- **Stripe webhooks:** Use idempotency keys to prevent duplicate processing.
- **Desktop App Upload Protocol:** README claims TUS protocol, but implementation is custom chunked upload (6MB chunks). Consider migrating to actual `tus-js-client` for better reliability.
- **Desktop Auth Storage:** Currently stores tokens in memory only (lost on restart). Critical issue for production use.
- **Desktop Port Conflict:** Hardcoded port 57123 will fail if already in use. Needs dynamic allocation.

---

## Session History

### Dec 6, 2025
- Electron expert analyzed PhotoVault Desktop app
- Created comprehensive improvement plan (`electron-desktop-improvements-plan.md`)
- Identified 7 critical issues and 4 priority levels of improvements
- Documented auth token persistence, port conflict, config mismatch, upload ETA, offline queue

### Nov 30, 2025
- Implemented sub-agent architecture
- Created context_session.md
- Created expert agent prompts

### Nov 29, 2025
- Fixed AuthContext race condition
- Created Sneak Peek Select page
- Created Gallery Ready Email API

---

*This file is the single source of truth for sub-agents. Keep it updated.*
