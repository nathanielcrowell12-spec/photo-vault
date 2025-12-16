# workflow-check.ps1
# This script runs before every Claude response to remind about the skill/expert workflow

$reminder = @"
===============================================================================
***  WORKFLOW CHECK - Before you respond, verify:
===============================================================================

STEP 1: Is this a COMPLEX task?
  Complex = touches multiple files, needs research, takes >5 minutes
  Simple = quick fix, one-liner, user said "just do it"

STEP 2: Does it involve these trigger words?
  - database, supabase, RLS, query, migration, schema -> Supabase
  - payment, stripe, checkout, webhook, subscription -> Stripe
  - component, UI, page, modal, form, button, styling -> Shadcn (+ ui-ux-design)
  - API route, middleware, server component, server action -> Next.js
  - email, template, notification, resend -> Resend
  - desktop, electron, upload, tus, chunked -> Electron
  - test, e2e, playwright, vitest, QA -> Testing
  - image, thumbnail, EXIF, sharp -> Image Processing
  - SEO, meta, schema, sitemap -> SEO

STEP 3: If COMPLEX + TRIGGER WORDS, you MUST:
  1. READ the skill file first (from VENTURES/PhotoVault/claude/skills/)
  2. SPAWN a subagent with the expert prompt (from VENTURES/PhotoVault/claude/experts/)
  3. WAIT for the plan to be written to docs/claude/plans/
  4. READ the plan and summarize to user
  5. ONLY implement after user approval

STEP 4: If SIMPLE or user said "quick fix" / "just do it":
  -> Proceed directly without subagents

Skills path: C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\
Experts path: C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\

DO NOT skip this workflow just because you see an error you know how to fix.
DO NOT start editing files until you have confirmed this is a simple task.
===============================================================================
"@

Write-Output $reminder
exit 0
