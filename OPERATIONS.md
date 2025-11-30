# PhotoVault Operations Manual

**Purpose:** Standard operating procedures for AI assistants working on PhotoVault
**Read this when:** Starting a new session, before making changes, when stuck

---

## 1. Quick Start Protocol

### Starting a New Session

```bash
# 1. Navigate to project
cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"

# 2. Check git status (are there uncommitted changes?)
git status

# 3. Start dev server
npm run dev

# 4. Server runs on port 3002 (or next available)
```

### First Things to Do

1. **Read CLAUDE.md** - Check SESSION STATE for where we left off
2. **Check "Next Story To Work On"** - Know what's planned
3. **Ask user:** "Ready to work on Story X.X?" or "What would you like to work on?"
4. **DO NOT** start making changes without user confirmation

---

## 2. Environment Verification

### Before Starting Any Work

Run these checks to ensure environment is ready:

```bash
# Check Node/npm
node -v  # Should be 18+
npm -v

# Check dependencies installed
ls node_modules  # Should exist and have content

# Type check (catches errors before runtime)
npm run type-check

# Dev server starts without errors
npm run dev
```

### For Payment Work (Stripe)

```bash
# Stripe CLI for webhook testing (in separate terminal)
stripe listen --forward-to localhost:3002/api/stripe/webhook

# Verify env vars exist
echo $STRIPE_SECRET_KEY  # Should not be empty (won't show value)
```

### Environment Variables Required

Check `.env.local` has these (don't output values, just verify they exist):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

## 3. Communication Standards

### How to Communicate with User

**DO:**
- Announce what you're about to do BEFORE doing it
- Ask clarifying questions when requirements are unclear
- Report progress at natural checkpoints
- Summarize what was done at end of task

**DON'T:**
- Make assumptions about what user wants
- Start large changes without confirmation
- Stay silent during long operations
- Make "improvements" that weren't requested

### Before Editing Any File

Always announce:
```
I'm going to edit [filename] to [brief description of change].
```

Wait for acknowledgment on significant changes.

### When Reporting Errors

Include:
1. What you were trying to do
2. The exact error message
3. What file/line if applicable
4. What you think the cause might be
5. Suggested fix (ask before implementing)

### Progress Updates

For multi-step tasks, update user:
- "Starting task 1 of 5..."
- "Task 1 complete. Moving to task 2..."
- "Encountered an issue with task 3. [details]"

---

## 4. Code Change Protocol

### Before Making Changes

1. **Announce intent** - "I'm going to [change X] in [file Y]"
2. **Explain why** - Brief rationale
3. **Wait for approval** on significant changes
4. **Read the file first** - Understand existing code

### Making Changes

1. **Minimal changes** - Only change what's needed
2. **No drive-by fixes** - Don't "improve" unrelated code
3. **Match existing style** - Follow patterns already in the file
4. **No new dependencies** without discussion

### After Making Changes

1. **Verify it works** - Run relevant checks
2. **Report what changed** - Brief summary
3. **Note any side effects** - "This also affects X"

---

## 5. Testing Standards

### Before Marking a Story Complete

1. **Type check passes:**
   ```bash
   npm run type-check
   ```

2. **Dev server runs without errors:**
   ```bash
   npm run dev
   ```

3. **Manual testing** - Actually test the feature in browser

4. **Edge cases considered** - What could go wrong?

### For Payment Features

- Test with Stripe test cards
- Verify webhook receives events
- Check database records created
- Verify commission calculations

### Test Card Numbers

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

---

## 6. Error Escalation Protocol

### Level 1: Try to Fix (30 seconds)
- Typos, missing imports, obvious fixes
- Fix and move on

### Level 2: Investigate (2 minutes)
- Read error message carefully
- Check relevant files
- Search codebase for similar patterns

### Level 3: Ask User
- After 2-3 failed attempts
- When multiple valid approaches exist
- When change would affect architecture
- When unsure about requirements

### Level 4: HALT
Stop and clearly report to user:
- After 3 failures on same issue
- When blocked by missing config/access
- When requirements are ambiguous
- When change seems risky

**HALT message format:**
```
HALTING: [brief reason]

What I tried:
1. [attempt 1]
2. [attempt 2]
3. [attempt 3]

What I need:
[specific help needed]
```

---

## 7. Code Quality Checklist

### Before Committing / Marking Complete

- [ ] Type check passes (`npm run type-check`)
- [ ] No console errors in browser
- [ ] No hardcoded test data left in code
- [ ] No commented-out code blocks
- [ ] No `console.log` debugging statements (unless intentional)
- [ ] Error handling for user-facing operations
- [ ] Loading states for async operations
- [ ] Works on the happy path
- [ ] Fails gracefully on error path

### Code Style (Match Existing)

- TypeScript strict mode
- Async/await (not .then chains)
- Descriptive variable names
- shadcn/ui components for UI
- Tailwind for styling
- Server components by default, 'use client' only when needed

---

## 8. Git Protocol

### When to Commit

- After completing a story
- After fixing a bug
- Before making risky changes (checkpoint)
- When user asks

### Commit Message Format

```
type: brief description

- Detail 1
- Detail 2

🤖 Generated with Claude Code
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### Before Committing

```bash
git status          # Review what's changed
git diff            # Review actual changes
npm run type-check  # Ensure no type errors
```

### DO NOT

- Force push
- Commit secrets/env files
- Commit node_modules
- Amend commits that are pushed

---

## 9. Deployment Protocol

### When to Deploy

- Only when user explicitly asks
- After story is complete AND tested
- Never deploy mid-story

### Deployment Steps

```bash
# 1. Ensure clean build
npm run build

# 2. If build fails, fix before deploying
# 3. Deploy via Vercel (usually automatic on push to main)
```

### After Deployment

- Verify site is up
- Test critical paths in production
- Monitor for errors

---

## 10. Project-Specific Gotchas

### Known Issues (Not Bugs)

1. **"Multiple GoTrueClient instances"** - Console warning, ignore it
2. **Photos missing `photo_url`** - Fallback to `thumbnail_url` is intentional
3. **Table naming:** Both `galleries` and `photo_galleries` exist - check which one the code uses

### Things That Look Wrong But Aren't

1. **Homepage redirects to static HTML** - Intentional (`/` → `/landing-page.html`)
2. **Some API routes have duplicate webhook handlers** - Legacy vs new, both work
3. **Unused imports in some files** - Low priority cleanup

### Common Mistakes to Avoid

1. **Wrong Supabase client** - Use `createServerSupabaseClient()` with `await` in server code
2. **Wrong table name** - Check if code uses `galleries` or `photo_galleries`
3. **Missing 'use client'** - Client components need this directive
4. **Stripe in client code** - Never use `stripe` (secret key) on client, only `@stripe/stripe-js`

---

## 11. File Locations Quick Reference

| Need to... | File |
|------------|------|
| Add API route | `src/app/api/[route]/route.ts` |
| Add page | `src/app/[path]/page.tsx` |
| Add component | `src/components/[name].tsx` |
| Add UI component | `npx shadcn@latest add [component]` |
| Modify auth | `src/middleware.ts` |
| Modify Stripe | `src/lib/stripe.ts` |
| Add email template | `src/lib/email/templates/` |
| Database types | `src/types/database.ts` |

---

## 12. Rollback Instructions

### If Something Breaks

```bash
# See recent commits
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert specific commit
git revert [commit-hash]
```

### If Dev Server Won't Start

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Try again
npm run dev
```

### If Database Issues

- Check Supabase dashboard for errors
- Verify RLS policies aren't blocking
- Check service role key has access

---

## 13. Session Handoff Template

When ending a session, copy this to CLAUDE.md SESSION STATE:

```markdown
## SESSION STATE (Date)

### Story Worked On
**Story X.X:** [Title]

### Tasks Completed
- [x] Task 1
- [x] Task 2
- [ ] Task 3 (in progress)

### Current State
- **Working on:** [specific task]
- **File:** [filename:line if applicable]
- **Status:** [what's done, what's left]

### Blockers/Issues
- [Any problems encountered]

### Next Session Should
1. [First thing to do]
2. [Second thing]

### Files Modified
- `path/to/file.ts` - [what changed]

### Notes for Next Claude
[Anything important to know]
```

---

## 14. Emergency Contacts

### When Stuck on Stripe
- Stripe Docs: https://stripe.com/docs
- Stripe Dashboard: https://dashboard.stripe.com

### When Stuck on Supabase
- Supabase Docs: https://supabase.com/docs
- Supabase Dashboard: https://app.supabase.com

### When Stuck on Next.js
- Next.js Docs: https://nextjs.org/docs

---

**Remember:** When in doubt, ASK the user. It's better to ask than to assume and break something.
