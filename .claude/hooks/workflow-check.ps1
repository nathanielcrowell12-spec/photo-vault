# workflow-check.ps1
# Runs before every Claude response to remind about skill/expert workflow

$reminder = @"
===============================================================================
WORKFLOW CHECK
===============================================================================

Before responding, verify:

1. Is this a COMPLEX task? (multiple files, needs research, >5 minutes)
   - YES -> Read .claude/SKILL-INDEX.md and follow the workflow
   - NO -> Proceed if user said "quick fix" or "just do it"

2. Does user request contain TRIGGER WORDS?
   (database, stripe, component, API, email, desktop, test, image, SEO, analytics)
   - YES -> Read .claude/SKILL-INDEX.md for the right skill/expert to load
   - NO -> May proceed directly for simple tasks

3. For complex tasks with trigger words:
   a) Read the skill file (knowledge)
   b) Read the discipline file (TDD/debugging)
   c) Spawn expert subagent (research)
   d) Expert writes plan to docs/claude/plans/
   e) Present plan to user, implement after approval

SKILL INDEX: .claude/SKILL-INDEX.md
CURRENT STATE: Stone-Fence-Brain/VENTURES/PhotoVault/CURRENT_STATE.md

DO NOT skip this workflow just because you know how to fix something.
===============================================================================
"@

Write-Output $reminder
exit 0
