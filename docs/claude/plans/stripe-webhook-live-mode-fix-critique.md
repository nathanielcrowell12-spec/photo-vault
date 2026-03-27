# QA Critic Critique: Stripe Webhook Live Mode Fix Investigation

**Reviewed:** 2026-01-23
**Plan:** `stripe-webhook-live-mode-fix-investigation.md`
**Critic:** QA Expert

---

## Verdict: APPROVE WITH CONCERNS

The diagnosis is sound and the fix steps are clear. However, there are gaps in recovery procedures and post-fix verification that could leave the user in a worse state if things do not go as planned.

---

## Assessment by Category

### 1. COMPLETENESS: 7/10

**Strengths:**
- Root cause analysis is well-reasoned with strong supporting evidence
- Fix steps are clear and actionable
- Secondary checks cover the obvious fallback scenarios

**Gaps Identified:**

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No rollback plan | HIGH | What if updating the env var breaks something else? Document how to revert. |
| Missing manual reconciliation steps | HIGH | 113 failed webhooks = potential 113 unpaid commissions. Plan says "Stripe will retry" but does not explain what to do if some are outside the 7-day window or were already skipped. |
| No Vercel env var verification step | MEDIUM | Plan assumes env var update works. Add "verify env var was saved correctly" before redeploying. |
| Step 3 is vague about necessity | LOW | "May Not Be Required" is ambiguous. Vercel serverless functions DO require redeployment to pick up new env vars. This should be "Required" not "May Not Be Required". |

---

### 2. CORRECTNESS: 9/10

**Strengths:**
- Correctly identifies that test/live webhook secrets are different
- Correctly identifies signature verification as the failure point
- Aligns with skill file patterns (signature verification, idempotency awareness)
- Does not propose unnecessary code changes

**Concerns:**

| Issue | Severity |
|-------|----------|
| Plan says Vercel "typically picks up env var changes on next deployment" but for serverless, this is actually ALWAYS true - env vars are baked into the deployment. The current wording could cause user to skip redeployment and wonder why it still fails. | Medium |

---

### 3. EDGE CASES: 5/10 - NEEDS IMPROVEMENT

The plan focuses on the happy path but does not address:

| Edge Case | What Could Go Wrong | Missing Mitigation |
|-----------|---------------------|-------------------|
| Webhook endpoint doesn't exist in live mode | Step 1 assumes it exists. If it doesn't, user is stuck. | Add explicit "if not exists, create it" with required event list |
| User copies wrong secret | They might copy test secret while in live mode if dashboard state is confusing | Add verification: "Confirm secret starts with whsec_ and you are in LIVE mode (orange banner)" |
| Multiple webhook endpoints | User might update wrong endpoint's secret | Add guidance on identifying the correct endpoint |
| Stripe retries already exhausted | Events older than 7 days cannot be retried automatically | Document manual recovery: query Stripe API for events, manually process missed ones |
| Concurrent deployments | If another deployment happens during the fix, env var might not propagate | Recommend pausing other deployments during this fix |

---

### 4. SECURITY: 8/10

**Strengths:**
- Does not expose secrets in logs or documentation
- Fix stays within proper channels (Stripe Dashboard, Vercel Dashboard)
- No code changes that could introduce vulnerabilities

**Concerns:**

| Issue | Severity |
|-------|----------|
| No guidance on who should have access to perform this fix | Low |
| No mention of verifying the Stripe Dashboard login is to the correct account | Low |

---

### 5. TESTING: 6/10 - NEEDS IMPROVEMENT

**Strengths:**
- Includes Stripe Dashboard test
- Includes real transaction test
- Includes log verification

**Gaps:**

| Gap | Why It Matters |
|-----|----------------|
| No test for specific event types | Plan only mentions `checkout.session.completed`. What about `invoice.paid`, `customer.subscription.updated`, etc.? All events handled by the webhook should be tested. |
| No verification of database state after test | "Check database for commission record" is good but should specify table and what to look for. |
| No timeline for monitoring | Fix could appear to work initially then fail on edge cases. Should specify "monitor for 24-48 hours" with what to look for. |
| No test for failed payment scenarios | These were likely among the 113 failures. Should test `invoice.payment_failed` handling. |

---

## Top 3 Concerns

### 1. MISSING MANUAL RECONCILIATION PROCEDURE (HIGH PRIORITY)

**The Problem:** 113 webhook failures potentially means 113 unprocessed business events. The plan mentions "Stripe will retry failed events within the 7-day window" but:
- Events from Jan 19 may already be outside the 7-day window (today is Jan 23, only 4 days remain)
- Even if retried, the code must handle them correctly (idempotency)
- There is no procedure to identify WHICH events failed and whether they need manual processing

**Required Addition:** Add a "Post-Fix Reconciliation" section:
1. Query Stripe API for events since Jan 19 with status "failed"
2. For each failed event, check if corresponding record exists in database
3. If missing, manually trigger processing or create record
4. Document expected database tables to check (`commission_payments`, subscriptions, etc.)

---

### 2. STEP 3 SHOULD BE "REQUIRED" NOT "MAY NOT BE REQUIRED" (MEDIUM PRIORITY)

**The Problem:** Vercel serverless functions require a deployment to pick up new environment variables. The current wording "May Not Be Required" could cause:
- User skips redeployment
- Webhook continues failing
- User thinks fix didn't work
- Confusion and wasted time

**Required Change:** Rename to "Step 3: Redeploy Application" and state explicitly: "Environment variable changes require a new deployment to take effect in Vercel serverless functions."

---

### 3. NO EXPLICIT EVENT LIST FOR WEBHOOK ENDPOINT CREATION (MEDIUM PRIORITY)

**The Problem:** Secondary Check 2 says "create it with the required events" but does not list what events are required. If the endpoint needs to be created from scratch in live mode, user will not know which events to select.

**Required Addition:** Add the list of required events from the skill file:
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## Minor Improvements (Nice to Have)

1. Add screenshot guidance for Stripe Dashboard navigation (test/live toggle location)
2. Add expected response format for successful webhook (JSON with `received: true`)
3. Add Vercel log search syntax for filtering webhook requests
4. Add link to Stripe documentation on webhook signature verification errors

---

## Conclusion

The plan correctly diagnoses the root cause and provides a workable fix. However, production incident recovery requires more robust procedures for:
1. Reconciling missed events
2. Ensuring deployment steps are executed
3. Comprehensive testing of all event types

After addressing the top 3 concerns, this plan will be ready for execution.

---

**Verdict:** APPROVE WITH CONCERNS

**Recommended Action:** Address the 3 high/medium priority items before executing. The environment fix itself is correct; the gaps are in recovery and verification procedures.
