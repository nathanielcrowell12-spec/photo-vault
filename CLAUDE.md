# PhotoVault Hub - Claude Code Context

**Project:** PhotoVault Hub - Next.js Web Application
**Status:** Active Development

---

## Quick Start

```powershell
# Terminal 1 - Dev Server
cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"
npm run dev -- -p 3002

# Terminal 2 - Stripe CLI (for webhooks)
& 'C:\Users\natha\stripe-cli\stripe.exe' listen --forward-to localhost:3002/api/webhooks/stripe
```

**URLs:** Dev: http://localhost:3002 | Webhooks: http://localhost:3002/api/webhooks/stripe

---

## Memory System

**This file is minimal by design.** Claude retrieves context on-demand.

### On Every Session Start
1. Read this file (done automatically)
2. Read current state: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\CURRENT_STATE.md`
3. Report status to user, wait for direction

### When Trigger Words Detected
1. Read skill index: `.claude/SKILL-INDEX.md`
2. Follow the workflow in that file

### Key Paths
| What | Where |
|------|-------|
| **Skill Index** | `.claude/SKILL-INDEX.md` |
| **Current State** | `Stone-Fence-Brain/VENTURES/PhotoVault/CURRENT_STATE.md` |
| **Work Plan** | `WORK_PLAN.md` (in this directory) |
| **Skills** | `Stone-Fence-Brain/VENTURES/PhotoVault/claude/skills/` |
| **Experts** | `Stone-Fence-Brain/VENTURES/PhotoVault/claude/experts/` |

---

## Hub Essentials

### Database Tables
- **Galleries:** `photo_galleries` (NOT `galleries`)
- **Photos columns:** `original_url`, `thumbnail_url`, `full_url`, `filename`

### Key Files
| Purpose | File |
|---------|------|
| Stripe config | `src/lib/stripe.ts` |
| Webhook handler | `src/app/api/webhooks/stripe/route.ts` |
| Auth middleware | `src/middleware.ts` |
| Auth context | `src/contexts/AuthContext.tsx` |

### Commission Rate
- **50%** to photographer (`PHOTOGRAPHER_COMMISSION_RATE = 0.50` in stripe.ts)

### User Types
`photographer`, `client`, `admin`, `secondary`

---

## Desktop App Integration

**Desktop uploads large ZIP files that browsers cannot handle.**

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/upload/prepare` | Creates gallery, returns signed URL |
| `POST /api/v1/upload/process` | Extracts photos from uploaded ZIP |
| `/auth/desktop-callback` | OAuth callback for desktop auth |

Before changing auth/middleware or `/api/v1/` routes, verify desktop flow still works.

---

## The Three Iron Laws

```
1. NO CODE WITHOUT A FAILING TEST FIRST
2. NO FIX WITHOUT ROOT CAUSE IDENTIFIED
3. NO "IT'S DONE" WITHOUT EVIDENCE
```

HALT and report to user if you cannot comply.

---

## Workflow Bypass

**Only skip the skill/expert workflow if ALL are true:**
1. User said "just do it", "quick fix", or "skip agents"
2. Single-file edit under 10 lines
3. No trigger words present

Otherwise, read `.claude/SKILL-INDEX.md` and follow the workflow.

---

## Session Save Protocol

When ending a session (context low, user says "save", or major task complete):

### 1. Update State File
Update: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\CURRENT_STATE.md`

Include:
- Date/time
- What was accomplished
- What's in progress
- What's blocked
- Files modified

### 2. Generate Handoff Blurb

```
===============================================================================
PHOTOVAULT SESSION HANDOFF - [DATE TIME]
===============================================================================

## STOP - Load Context First

Before working, read:
1. `photovault-hub/CLAUDE.md`
2. `Stone-Fence-Brain/VENTURES/PhotoVault/CURRENT_STATE.md`
3. `.claude/SKILL-INDEX.md`

Then say: "Context loaded. Ready to discuss next steps."

===============================================================================

## Where We Left Off
[Story/task and stopping point]

## Completed
- [Item 1]
- [Item 2]

## Next Steps
1. [Action 1]
2. [Action 2]

## Blockers/Notes
- [Any issues or requirements]

===============================================================================
```

---

## Documentation (Read On-Demand)

| Topic | File |
|-------|------|
| Email | `RESEND-EMAIL-SETUP.md` |
| Stripe | `STRIPE-SETUP-GUIDE.md` |
| Deployment | `DEPLOYMENT-CHECKLIST.md` |
| Commissions | `COMMISSION-SYSTEM-IMPLEMENTATION.md` |

---

*~100 lines. Context retrieved on-demand via SKILL-INDEX.md*
