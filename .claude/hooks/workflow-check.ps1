# workflow-check.ps1
# Runs before every Claude response to:
# 1. Check for context-depletion phrases and trigger handoff
# 2. Remind about skill/expert workflow

# Read JSON input from stdin
$inputJson = $null
try {
    $inputJson = $input | Out-String | ConvertFrom-Json
} catch {
    # If no input or invalid JSON, continue with standard workflow check
}

# Extract the user's prompt
$userPrompt = ""
if ($inputJson -and $inputJson.prompt) {
    $userPrompt = $inputJson.prompt.ToLower()
}

# Define context-depletion trigger phrases
$contextTriggers = @(
    "low on context",
    "getting low on context",
    "running low on context",
    "out of context",
    "save our progress",
    "save progress",
    "done working for the day",
    "done for the day",
    "save this for me",
    "save this",
    "end session",
    "wrap up",
    "wrap this up",
    "closing out",
    "handoff",
    "hand off",
    "context is low",
    "context getting low",
    "let's save",
    "please save",
    "save session"
)

# Check if any trigger phrase is in the prompt
$isContextSave = $false
foreach ($trigger in $contextTriggers) {
    if ($userPrompt -match [regex]::Escape($trigger)) {
        $isContextSave = $true
        break
    }
}

if ($isContextSave) {
    # Context save detected - redirect to skill file (DO NOT inline instructions)
    $handoffRedirect = @"
===============================================================================
HANDOFF TRIGGERED - LOAD SKILL FILE
===============================================================================

STOP! Do NOT execute handoff from this message.

You MUST follow the standard skill workflow:

1. READ: Stone-Fence-Brain/VENTURES/PhotoVault/claude/SKILL-INDEX.md
2. FIND: "handoff" in the trigger words column
3. READ: The skill file at:
   Stone-Fence-Brain/VENTURES/PhotoVault/claude/skills/handoff-skill.md
4. EXECUTE: The full protocol from that file

The skill file contains:
- Complete CURRENT_STATE.md template (all sections)
- Complete handoff blurb template
- Quality checklist (must verify before completing)
- Common mistakes to avoid
- What to NEVER do

DO NOT shortcut this. The inline template is intentionally removed.
The skill file is the single source of truth for handoff protocol.

===============================================================================
"@
    Write-Output $handoffRedirect
} else {
    # Standard workflow check
    $workflowReminder = @"
===============================================================================
WORKFLOW CHECK
===============================================================================

Before responding, verify:

1. Is this a COMPLEX task? (multiple files, needs research, >5 minutes)
   - YES -> Read Stone-Fence-Brain/VENTURES/PhotoVault/claude/SKILL-INDEX.md
   - NO -> Proceed if user said "quick fix" or "just do it"

2. Does user request contain TRIGGER WORDS?
   (database, stripe, component, API, email, desktop, test, image, SEO, analytics)
   - YES -> Read Stone-Fence-Brain/VENTURES/PhotoVault/claude/SKILL-INDEX.md
   - NO -> May proceed directly for simple tasks

3. For complex tasks with trigger words:
   a) Read the skill file (knowledge)
   b) Read the discipline file (TDD/debugging)
   c) Spawn expert subagent (research)
   d) Expert writes plan to docs/claude/plans/
   e) Present plan to user, implement after approval

SKILL INDEX: Stone-Fence-Brain/VENTURES/PhotoVault/claude/SKILL-INDEX.md
CURRENT STATE: Stone-Fence-Brain/VENTURES/PhotoVault/CURRENT_STATE.md

DO NOT skip this workflow just because you know how to fix something.
===============================================================================
"@
    Write-Output $workflowReminder
}

exit 0
