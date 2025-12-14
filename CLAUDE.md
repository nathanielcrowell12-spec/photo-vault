# PhotoVault Hub - Claude Code Context

**Last Updated:** December 8, 2025
**Project:** PhotoVault Hub - Next.js Web Application
**Status:** Active Development - Phase 1 Beta MVP

---

## ⛔ PROTECTED SECTION - DO NOT MODIFY ⛔

**CRITICAL INSTRUCTION FOR CLAUDE CODE:**

The sections marked with "⛔ PROTECTED" in this file define the orchestration system that governs how you operate. **You are NOT permitted to edit, "fix", or "correct" these sections under ANY circumstances.**

If you notice discrepancies between:
- What this file says to do (e.g., file paths, workflows)
- What actually exists in the file system

**DO NOT attempt to fix it yourself.** Instead:
1. Stop what you're doing
2. Report the discrepancy to the user in plain language
3. Wait for the user to fix it via Claude Desktop (which manages the Stone Fence Brain memory system)

**Why this rule exists:** The orchestration system is managed externally. Previous "helpful" edits by Claude Code corrupted the memory system and broke workflows. The user will handle all path corrections through the proper channel.

---

## Quick Start - Dev Server

**Start both services in separate terminals:**

### Terminal 1 - Dev Server
```powershell
cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"
npm run dev -- -p 3002
```

### Terminal 2 - Stripe CLI (for webhooks)
```powershell
& 'C:\Users\natha\stripe-cli\stripe.exe' listen --forward-to localhost:3002/api/webhooks/stripe
```

### URLs
- **Dev server:** http://localhost:3002
- **Webhooks:** http://localhost:3002/api/webhooks/stripe

---

## Parent Documentation

**Read the parent CLAUDE.md for project-wide orchestration rules:**
```
C:\Users\natha\.cursor\Photo Vault\CLAUDE.md
```

This file contains **hub-specific** details only. The parent file has the full orchestration system.

---

## ⚠️ CRITICAL: Desktop App Integration

**DO NOT FORGET:** PhotoVault has TWO applications that work together!

### Desktop App Location
```
C:\Users\natha\.cursor\Photo Vault\photovault-desktop\CLAUDE.md
```

### Why This Matters
The **Desktop App is the PRIMARY method for photographers to upload photos**. Large ZIP files (1GB+) cannot be uploaded via browser - they MUST use the desktop app.

### Hub API Endpoints Used by Desktop

| Endpoint | Purpose | File |
|----------|---------|------|
| `POST /api/v1/upload/prepare` | Creates gallery, returns signed URL | `src/app/api/v1/upload/prepare/route.ts` |
| `POST /api/v1/upload/process` | Extracts photos from uploaded ZIP | `src/app/api/v1/upload/process/route.ts` |
| `/auth/desktop-callback` | OAuth callback for desktop auth | `src/app/auth/desktop-callback/page.tsx` |

### Before Making Changes To:
- **Authentication/middleware** → Check if desktop auth flow still works
- **API routes in `/api/v1/`** → These are called by desktop app
- **Supabase storage policies** → Desktop uploads directly to storage
- **Gallery creation logic** → Desktop creates galleries via API

### Upload Flow (Desktop → Hub → Storage)
```
[Desktop: User selects ZIP]
    → [Hub: /api/v1/upload/prepare] creates gallery record
    → [Desktop: TUS upload] streams to Supabase Storage (6MB chunks)
    → [Hub: /api/v1/upload/process] extracts photos from ZIP
    → [Hub: Gallery page] displays photos
```

---

## Hub-Specific Documentation Index

| Topic | Files in this directory |
|-------|-------------------------|
| **Email system** | `RESEND-EMAIL-SETUP.md`, `EMAIL_SYSTEM_IMPLEMENTATION.md`, `EMAIL_TEMPLATES_COMPLETE.md` |
| **Stripe/payments** | `STRIPE-SETUP-GUIDE.md`, `STRIPE_INTEGRATION_COMPLETE.md`, `STRIPE_VERIFICATION_CHECKLIST.md` |
| **Webhooks** | `WEBHOOK_README.md`, `docs/STRIPE_WEBHOOK_SETUP.md` |
| **Commissions** | `COMMISSION-SYSTEM-IMPLEMENTATION.md`, `COMMISSION_TESTING_GUIDE.md` |
| **Client onboarding** | `CLIENT-ONBOARDING-SETUP.md` |
| **Gallery setup** | `GALLERY-SETUP-GUIDE.md` |
| **Deployment** | `DEPLOYMENT-CHECKLIST.md`, `DEPLOYMENT-GUIDE.md`, `VERCEL-ENV-SETUP.md` |
| **Database** | `SUPABASE-SETUP.md`, `database/*.sql` |

---

## Work Plan System

### What is WORK_PLAN.md?

`WORK_PLAN.md` is the **master task list** containing:
- All remaining work organized into **Epics** (major milestones)
- Each Epic broken into **Stories** (one context window each)
- Each Story has **Tasks** with checkboxes
- **Acceptance Criteria** for when a story is complete

### Current Phase: Phase 1 - Beta MVP (20 Stories)

| Epic | Description | Stories | Status |
|------|-------------|---------|--------|
| **Epic 1** | Payment System Completion | 7 | ✅ COMPLETE |
| **Epic 2** | Dashboard Fixes | 4 | 🟡 In Progress (2.1-2.3 done) |
| **Epic 3** | Email System | 3 | ✅ Complete |
| **Epic 4** | Onboarding Polish | 3 | 🔴 Not Started |
| **Epic 5** | Beta Launch Prep | 3 | 🔴 Not Started |

**Progress:** 65% Complete (13/20 stories)
**Next Story:** 2.4 - Fix Admin Dashboard

---

## ⛔ PROTECTED SECTION: Skill & Agent Trigger System ⛔

### How This Works

PhotoVault uses a **two-layer intelligence system**:

| Layer | Purpose | Location |
|-------|---------|----------|
| **Skills** | Pre-loaded expert knowledge (patterns, anti-patterns, best practices) | `Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\` |
| **Experts** | Research workers that search YOUR codebase and write implementation plans | `Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\` |

**Protocol:** Always load the SKILL first (knowledge), THEN spawn the EXPERT (researcher).

---

## ⛔ PROTECTED SECTION: Trigger Patterns → Actions ⛔

### Database / Supabase Tasks

| Trigger Words | Action |
|---------------|--------|
| `database`, `supabase`, `RLS`, `query`, `migration`, `schema`, `table`, `policy`, `auth.uid`, `storage bucket` | Load Supabase Skill → Spawn Supabase Expert |

**Workflow:**
1. **Read skill first:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\supabase-skill.md`
2. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\supabase-expert.md`
3. **Subagent outputs plan to:** `docs/claude/plans/supabase-[task-name]-plan.md`
4. **Read the plan, then implement**

---

### Payment / Stripe Tasks

| Trigger Words | Action |
|---------------|--------|
| `payment`, `stripe`, `checkout`, `subscription`, `webhook`, `connect`, `commission`, `payout`, `transfer` | Load Stripe Skill → Spawn Stripe Expert |

**Workflow:**
1. **Read skill first:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\stripe-skill.md`
2. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\stripe-expert.md`
3. **Subagent outputs plan to:** `docs/claude/plans/stripe-[task-name]-plan.md`
4. **Read the plan, then implement**

---

### UI / Component Tasks

| Trigger Words | Action |
|---------------|--------|
| `component`, `UI`, `page`, `modal`, `form`, `button`, `styling`, `tailwind`, `shadcn`, `design` | Load UI/UX Skill + Shadcn Skill → Spawn Shadcn Expert |

**Workflow:**
1. **Read design skill first:** `C:\Users\natha\Stone-Fence-Brain\DEPARTMENTS\Product\skills\ui-ux-design.md`
2. **Read component skill second:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\shadcn-skill.md`
3. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\shadcn-expert.md`
4. **Subagent outputs plan to:** `docs/claude/plans/ui-[task-name]-plan.md`
5. **Read the plan, then implement**

---

### Next.js / API Tasks

| Trigger Words | Action |
|---------------|--------|
| `API route`, `middleware`, `server component`, `client component`, `server action`, `deployment`, `vercel`, `app router` | Load Next.js Skill → Spawn Next.js Expert |

**Workflow:**
1. **Read skill first:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\nextjs-skill.md`
2. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\nextjs-expert.md`
3. **Subagent outputs plan to:** `docs/claude/plans/nextjs-[task-name]-plan.md`
4. **Read the plan, then implement**

---

### Email Tasks

| Trigger Words | Action |
|---------------|--------|
| `email`, `template`, `notification`, `resend` | Load Resend Skill → Spawn Resend Expert |

**Workflow:**
1. **Read skill first:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\resend-skill.md`
2. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\resend-expert.md`
3. **Subagent outputs plan to:** `docs/claude/plans/email-[task-name]-plan.md`
4. **Read the plan, then implement**

---

### Desktop App / Upload Tasks

| Trigger Words | Action |
|---------------|--------|
| `desktop`, `electron`, `upload`, `tus`, `chunked` | Load Electron Skill → Spawn Electron Expert |

**Workflow:**
1. **Read skill first:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\electron-skill.md`
2. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\electron-expert.md`
3. **Subagent outputs plan to:** `docs/claude/plans/electron-[task-name]-plan.md`
4. **Read the plan, then implement**

---

### Testing Tasks

| Trigger Words | Action |
|---------------|--------|
| `test`, `e2e`, `playwright`, `vitest`, `QA` | Load Testing Skill → Spawn Testing Expert |

**Workflow:**
1. **Read skill first:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\testing-skill.md`
2. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\testing-expert.md`
3. **Subagent outputs plan to:** `docs/claude/plans/testing-[task-name]-plan.md`
4. **Read the plan, then implement**

---

### Image Processing Tasks

| Trigger Words | Action |
|---------------|--------|
| `image`, `thumbnail`, `zip`, `EXIF`, `sharp`, `photo processing` | Load Image Processing Skill → Spawn Image Processing Expert |

**Workflow:**
1. **Read skill first:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\image-processing-skill.md`
2. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\image-processing-expert.md`
3. **Subagent outputs plan to:** `docs/claude/plans/image-[task-name]-plan.md`
4. **Read the plan, then implement**

---

### SEO Tasks

| Trigger Words | Action |
|---------------|--------|
| `SEO`, `meta`, `schema`, `sitemap` | Load SEO Skill → Spawn SEO Expert |

**Workflow:**
1. **Read skill first:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\seo-skill.md`
2. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\seo-expert.md`
3. **Subagent outputs plan to:** `docs/claude/plans/seo-[task-name]-plan.md`
4. **Read the plan, then implement**

---

### Directory Building Tasks

| Trigger Words | Action |
|---------------|--------|
| `directory`, `directories`, `listings`, `listing page`, `category pages`, `city pages` | Load Directory Building Skill → Spawn Directory Building Expert |

**Workflow:**
1. **Read skill first:** `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\directory-building-skill.md`
2. **Then spawn Task subagent** with prompt from: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\directory-building-expert.md`
3. **Subagent outputs plan to:** `docs/claude/plans/directory-[task-name]-plan.md`
4. **Read the plan, then implement**

---

## ⛔ PROTECTED SECTION: BMAD vs Technical Expert Routing ⛔

| Question Type | Route To | Examples |
|---------------|----------|----------|
| **"What should I do?"** | BMAD Agents | "What's next?", "Is this in scope?", "Break down this epic" |
| **"How do I do it?"** | Technical Experts | "Fix this bug", "Build this feature", "Add this API route" |

### BMAD Agents (Workflow/Planning)
- Location: `C:\Users\natha\Stone-Fence-Brain\INFRASTRUCTURE\bmad-agents\`
- Use for: planning, scope questions, story validation, epic breakdown
- **They give GUIDANCE, not code**

### Technical Experts (Implementation)
- Location: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\`
- Use for: code fixes, feature building, debugging, implementation
- **They RESEARCH your codebase and write implementation plans**

**⚠️ When user says "use agents" for a code task → USE TECHNICAL EXPERTS, NOT BMAD**

---

## ⛔ PROTECTED SECTION: File Inventory ⛔

### Skills (10 files)
```
C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\
├── supabase-skill.md              # RLS, queries, storage patterns
├── stripe-skill.md                # Connect, webhooks, idempotency
├── nextjs-skill.md                # App Router, Server/Client components
├── shadcn-skill.md                # UI components, Tailwind, accessibility
├── testing-skill.md               # Playwright, Vitest, fixtures
├── resend-skill.md                # Email templates, deliverability
├── electron-skill.md              # IPC, chunked uploads, security
├── image-processing-skill.md      # Sharp, streaming, thumbnails
├── seo-skill.md                   # Metadata, structured data, sitemaps
└── directory-building-skill.md    # Schema, SEO, admin, monetization
```

### Experts (11 files)
```
C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\
├── context_session.md             # Read first for all tasks
├── supabase-expert.md
├── stripe-expert.md
├── nextjs-expert.md
├── shadcn-expert.md
├── resend-expert.md
├── electron-expert.md
├── testing-expert.md
├── image-processing-expert.md
├── seo-expert.md
└── directory-building-expert.md
```

### Special Case: UI/UX Design Skill (in DEPARTMENTS)
```
C:\Users\natha\Stone-Fence-Brain\DEPARTMENTS\Product\skills\ui-ux-design.md
```

### Plan Output Location
```
photovault-hub/docs/claude/plans/
└── [domain]-[task]-plan.md
```

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
| Client Monthly | $8/month | `prod_TV5gXyg5nNn635` |
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

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

---

## Known Issues

1. **Multiple GoTrueClient Instances** - Console warning, low impact
2. **Some photos missing `photo_url`** - Fallback to `thumbnail_url` implemented
3. **Settings page not in nav** - "Subscription" should be "Settings"

---

## Session Start Protocol

When starting a PhotoVault Hub session:

1. **Read state files (silently):**
   - `photovault-hub/CLAUDE.md` (this file)
   - `photovault-hub/WORK_PLAN.md`
   - `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\CURRENT_STATE.md`

2. **Report status to user:**
   ```
   📍 Current Status:
   - Last session: [date]
   - Current story: [story number and name]
   - Status: [complete/in-progress/blocked]
   
   📋 Next planned work:
   - [Next story]: [description]
   
   Ready to continue, or do you have something specific?
   ```

3. **Wait for user direction.**

---

## Session End / Save Protocol

**When ending a session:**

### Always Update:
| File | Location | What to Update |
|------|----------|----------------|
| CURRENT_STATE.md | `Stone-Fence-Brain/VENTURES/PhotoVault/` | Full state sync |
| WORK_PLAN.md | `photovault-hub/` | Mark tasks complete |
| This CLAUDE.md | `photovault-hub/` | SESSION STATE section |

### Save Message:
```
💾 Saving session progress...

Updated:
✅ VENTURES/PhotoVault/CURRENT_STATE.md
✅ WORK_PLAN.md
✅ SESSION STATE in this file

Summary: [What was accomplished]
Next: [What to do next session]
```

---

## SESSION STATE (Dec 9, 2025)

### Story 2.3 - IMPLEMENTED (UNTESTED)

**Date:** December 9, 2025
**Status:** Code written, needs manual testing

### What Was Built This Session

1. **MessagingPanel Modal Sizing** - Changed `h-[600px]` to `h-[85vh] max-h-[800px] min-h-[500px]`
2. **Start New Chat Button** - Added `showPhotographerList` state, button at top of conversation list
3. **Client Upload Web Form** - Full form with all metadata fields (Event Date, Location, People, Event Type, Photographer Name, Notes)
4. **Fixed Upload Buttons** - Desktop App uses protocol handler + fallback modal, Online Upload scrolls to form

### Files Modified
- `src/components/MessagingPanel.tsx` - Responsive sizing, Start New Chat
- `src/app/client/upload/page.tsx` - Complete rebuild with web upload form

### Testing Required (Next Session)
```
npm run dev -- -p 3002
```
1. MessagingPanel - Open messages, verify fits screen
2. Start New Chat - With conversations, click button, verify photographer list
3. Client Upload - Navigate to `/client/upload`, test form creates gallery

### Story 2.3b Created - Support/Timeline/Favorites

**Issues found during user testing:**

| Page | Issue | Fix |
|------|-------|-----|
| `/client/support` | Fake phone `(555) 123-4567` | Change to `(608) 571-7532` |
| `/client/support` | Live Chat card | REMOVE - no feature |
| `/client/support` | Support Hours card | REMOVE - no set hours |
| `/client/timeline` | 100% mock data | Pull from real galleries |
| `/client/dashboard` | "Downloaded" stat | REMOVE - useless |
| `/client/dashboard` | "Favorites" stat | Link to timeline with filter |

**Favorites Feature (discussed):**
- Mark favorites in lightbox (heart icon)
- `gallery_photos.is_favorite` column exists
- Dashboard stat links to `/client/timeline?favorites=true`

### Beta MVP Progress
**60% complete (12/20 stories)** - Story 2.3 needs testing, 2.3b not started

### Next Steps
1. Test Story 2.3 changes
2. Story 2.3b - Support cleanup, timeline real data, favorites
3. Story 2.4 - Admin Dashboard

---

*End of PhotoVault Hub Context*
