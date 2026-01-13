# Plan Critique: Desktop Draft Gallery Workflow

**Plan Reviewed:** desktop-draft-gallery-workflow-plan.md
**Skill Reference:** electron-skill.md
**Date:** 2026-01-02

## Summary Verdict

**NEEDS REVISION**

The plan correctly identifies the core problem (users redirected to wrong page after desktop upload), but has 3 critical architectural issues that must be resolved before implementation. It creates duplicate code, ignores existing working endpoints, and doesn't address backward compatibility with web uploads.

## Critical Issues (Must Fix)

### 1. Missing Database Column (`email_sent_at`)

- **What's wrong:** The plan assumes `email_sent_at` column exists on `photo_galleries` table, but it's NOT defined in the consolidate migration schema. Only `gallery_status` is added (line 66-67).
- **Why it matters:** Runtime database error when code tries to update this column. Complete feature failure.
- **Suggested fix:** Add migration step BEFORE any code:
  ```sql
  ALTER TABLE photo_galleries ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ DEFAULT NULL;
  ```

### 2. Duplicate Email Endpoint (Architectural Duplication)

- **What's wrong:** There's already a working `POST /api/email/gallery-ready` endpoint (196 lines) that:
  - Sends gallery-ready email to client
  - Updates `email_sent_at`
  - Checks photographer has Stripe Connect setup (lines 77-105)
  - Has idempotency protection (lines 59-68)

  The plan proposes creating a NEW endpoint at `/api/photographer/galleries/{id}/send-to-client` that duplicates this functionality.

- **Why it matters:**
  - Violates DRY principle
  - Two endpoints doing same thing = maintenance burden
  - Plan endpoint is MISSING Stripe validation and idempotency
  - Confuses developers about which endpoint to use

- **Suggested fix:** Choose ONE approach:
  - **Option A (Recommended):** Reuse existing `/api/email/gallery-ready` endpoint from draft page button
  - **Option B:** Delete old endpoint, implement new one with ALL its validation
  - **Option C:** Consolidate into single endpoint handling both workflows

### 3. Unclear Workflow Integration (Sneak-Peek Page Orphaned)

- **What's wrong:** Plan doesn't address what happens to existing `/photographer/galleries/[id]/sneak-peek-select` page. Current flow: upload → sneak-peek-select → send. New flow: upload → draft → send.
- **Why it matters:**
  - Two pages can send emails = user confusion
  - Web-based uploads still go to sneak-peek
  - Desktop uploads go to draft
  - Inconsistent UX, tech debt
- **Suggested fix:** Define explicit workflow:
  - Either: Draft page replaces sneak-peek entirely
  - Or: Document which workflow uses which page

## Concerns (Should Address)

### 4. Missing Stripe Validation

- **What's wrong:** Existing email endpoint requires `stripe_connect_status = 'active'` before allowing email send. Plan endpoint spec doesn't mention this requirement.
- **Why it matters:** Photographer could "successfully" send email but payments would fail. Hidden requirement bug.
- **Suggested fix:** Include Stripe setup check in endpoint requirements

### 5. No Idempotency Protection

- **What's wrong:** Existing endpoint won't send email twice (checks `email_sent_at`). Plan doesn't mention this.
- **Why it matters:** User clicks button, network slow, clicks again = client gets two emails
- **Suggested fix:** Add idempotency check to endpoint spec

### 6. Overengineered Solution

- **What's wrong:** Upload page ALREADY has:
  - Gallery status badge (line 295)
  - Draft badge (line 530)
  - Uploaded photos grid (lines 525-562)
  - "Complete & Send to Client" button (line 307)

  Problem is the button NAVIGATES instead of calling API.

- **Why it matters:** Creating new page when existing page could be fixed with button logic change
- **Suggested fix:** Simpler approach - change upload page button to call API endpoint instead of navigate. No new page needed.

### 7. Incomplete Test Plan

- **What's wrong:** Missing critical test scenarios:
  - Stripe requirement test (photographer without Stripe setup)
  - Idempotency test (send twice)
  - Client email validation test
  - Backward compatibility test (web uploads still work)
  - Desktop 404 test (redirect before page deployed)
- **Why it matters:** Untested edge cases = production bugs
- **Suggested fix:** Add all missing test scenarios before implementation

## Minor Notes (Consider)

- Redundant `gallery_status='draft'` preservation - DB default already handles this
- Desktop redirect timing risk - if draft page isn't deployed, users get 404
- Transaction safety - what if email succeeds but DB update fails?
- Naming: Why "draft" vs "review" or "confirm"?

## Questions for the User

1. **Sneak-Peek Workflow:** Should sneak-peek-select page still exist after this change? Or should both desktop AND web uploads go through draft page?

2. **Email Endpoint:** Do you want to keep the existing `/api/email/gallery-ready` endpoint, or consolidate into new endpoint?

3. **Simpler Fix:** Would you prefer to just fix the upload page button (call API instead of navigate) rather than create a new draft page?

4. **Stripe Requirement:** Confirmed that photographers must have Stripe set up before sending gallery-ready email?

## What the Plan Gets Right

- Correctly identifies the redirect URL problem in desktop app
- Correctly identifies gallery status should be 'draft'
- Good deployment checklist structure
- Test plan framework is solid (just incomplete)
- Success criteria are measurable

## Recommendation

**Do NOT implement as written.**

**Simpler path forward:**
1. Add `email_sent_at` column migration if missing
2. Fix upload page button to call existing `/api/email/gallery-ready` endpoint
3. Change desktop redirect from `/upload` to `/upload` (same page, but button now works)
4. Add loading state to button while email sends
5. Test Stripe validation, idempotency, and edge cases

This approach:
- Reuses existing working code
- No new page needed
- No duplicate endpoints
- Fixes both desktop AND web workflows
- Less code = fewer bugs

**If new draft page is truly required**, revise plan to:
1. Address email endpoint duplication
2. Document sneak-peek page fate
3. Add Stripe/idempotency validation
4. Complete test plan
5. Define workflow for both desktop and web uploads
