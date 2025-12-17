# PostHog Alerting Setup Plan - QA Critique
**Plan Reviewed:** `posthog-alerting-setup-plan.md`
**Critic:** QA Critic Expert
**Date:** December 16, 2025
**Skill Consulted:** `posthog-skill.md`

---

## Verdict: APPROVE WITH CONCERNS

**Overall Assessment:** The plan is well-structured and comprehensive. It correctly identifies what PostHog can and cannot do, and proposes appropriate solutions. However, there are several implementation risks and architectural concerns that need to be addressed before deployment.

---

## Top 3 Concerns

### 1. Webhook Monitoring Script Has No Automated Deployment Path (HIGH PRIORITY)

**Issue:** The plan proposes creating `scripts/monitor-webhooks.ts` to run every 15 minutes, but provides NO concrete deployment strategy.

**From the plan:**
> "Set up Vercel Cron Job or GitHub Actions workflow to run every 15 minutes"

**Problems:**
- Vercel Cron Jobs require a **Next.js API route** to call, not a standalone script
- GitHub Actions cron has **10-minute minimum interval** (cannot do 15 minutes reliably)
- The script uses `tsx` which is a dev dependency, not suitable for production

**Risk:** The webhook monitoring will be created but never deployed, leaving a critical gap in error detection.

**Recommendation:**
1. **Convert to API route approach:**
   ```
   GET /api/internal/monitor-webhooks
   - Protected by secret header (Authorization: Bearer ${CRON_SECRET})
   - Runs the webhook failure check
   - Returns JSON status
   ```

2. **Use Vercel Cron:**
   ```json
   // vercel.json
   {
     "crons": [{
       "path": "/api/internal/monitor-webhooks",
       "schedule": "*/15 * * * *"
     }]
   }
   ```

3. **Add rate limiting** to prevent abuse of the endpoint

**Alternative:** Use PostHog's SQL Insights (Option A in the plan) if the free tier supports it. This eliminates the need for custom infrastructure.

---

### 2. Email Alert System Lacks Implementation Details (MEDIUM PRIORITY)

**Issue:** The plan adds `sendAlertEmail()` to EmailService but doesn't verify:
- That the admin email address is configured
- That alerts won't be blocked by spam filters
- That alerts won't trigger rate limits during an outage

**Missing considerations:**
- **Email deliverability:** Alert emails have no user context, might look like spam
- **Rate limiting:** If 100 webhooks fail, will Resend send 100 emails? Or will it rate limit?
- **Alert fatigue:** No mechanism to suppress duplicate alerts (e.g., "payment failures still occurring")

**From posthog-skill.md:**
> "Track errors to both PostHog AND Supabase for redundancy"

The plan correctly implements PostHog + Supabase fallback for errors, but the EMAIL alert system itself has no fallback. If Resend is down, how does the admin know?

**Recommendation:**

1. **Add alert deduplication logic:**
   ```typescript
   // Don't send more than 1 alert per hour for same issue type
   const lastAlertKey = `alert:webhook_failures:${hourTimestamp}`
   const alreadySent = await redis.get(lastAlertKey)
   if (alreadySent) return
   await redis.setex(lastAlertKey, 3600, 'sent')
   ```

2. **Test Resend deliverability with alert format:**
   - Subject line: "[PhotoVault] Alert" might trigger spam filters
   - Consider: "[Action Required] PhotoVault: 5 Payment Failures"

3. **Add alert delivery confirmation:**
   - Log to Supabase `alert_logs` table when alerts are sent
   - Track `alert_type`, `sent_at`, `resend_message_id`
   - This proves alerts were attempted even if Resend fails

4. **Document admin email configuration:**
   - Add `ADMIN_EMAIL` to `VERCEL-ENV-SETUP.md`
   - Validate on startup that it's set

---

### 3. False Positive Risk Not Addressed (MEDIUM PRIORITY)

**Issue:** The alert thresholds are reasonable but don't account for legitimate spikes.

**Scenarios that will trigger false alarms:**
1. **Payment Failures (5/hour threshold):**
   - Black Friday sale with 100 new clients → 10+ will have expired cards
   - Bulk import of test data during development
   - Stripe test mode vs production mode (different failure rates)

2. **Error Spike (200% increase):**
   - Deploying a new feature increases traffic 3x
   - Running E2E tests generates errors
   - Single client with bad network hits refresh 20 times

3. **Webhook Failures (3/hour):**
   - Stripe webhook signature changes (happened before)
   - Temporary network blip causes 5 retries in quick succession
   - Database maintenance causes brief connection failures

**From the plan:**
> "Why relative threshold? Baseline errors might be 5-10/hour normally. Spike to 30+ errors indicates a real issue."

This logic is sound BUT doesn't account for intentional baseline changes (e.g., launching to 100 new photographers).

**Recommendation:**

1. **Add environment-aware thresholds:**
   ```typescript
   const THRESHOLDS = {
     payment_failures: process.env.NODE_ENV === 'production' ? 5 : 999,
     error_spike_percent: process.env.NODE_ENV === 'production' ? 200 : 500,
   }
   ```

2. **Include time-of-day context in alerts:**
   ```
   Subject: [PhotoVault] 8 Payment Failures (3AM UTC - unusual time)
   ```
   Alerts at 3 AM are more concerning than alerts at 5 PM.

3. **Add "Alert Silence" mechanism:**
   - PostHog dashboard should allow "snoozing" alerts for 24 hours
   - Useful during planned maintenance or known issues

4. **Start with higher thresholds, tune down:**
   - Week 1: 10 payment failures/hour (gather baseline data)
   - Week 2: Adjust to 5 or 7 based on actual data
   - Prevents alert fatigue during beta launch

---

## Risk Assessment: MEDIUM

**Technical Risks:**
- Webhook monitoring script deployment is underspecified (HIGH)
- Email deliverability not tested (MEDIUM)
- False positive potential during beta launch (MEDIUM)

**Business Risks:**
- If alerts don't work, critical issues go unnoticed (HIGH)
- If alerts are too noisy, admin ignores them (MEDIUM)

**Implementation Complexity:**
- PostHog dashboard setup: LOW (UI clicks)
- Webhook monitoring: MEDIUM (requires infrastructure decision)
- Email alert system: LOW (simple code)

**Overall Risk:** The plan is implementable, but the webhook monitoring deployment gap is a critical blocker. The other concerns are important but not blockers.

---

## Positive Aspects (What the Plan Gets Right)

1. **Comprehensive event coverage:** Correctly identifies which events need alerts (payment failures, errors, churn)

2. **Leverages existing infrastructure:** Uses PostHog events that are already being tracked (from Stories 6.1-6.3)

3. **Redundancy for critical errors:** PostHog + Supabase fallback for error tracking (good defensive design)

4. **Realistic thresholds:** The recommended thresholds (5 payment failures/hour, 200% error spike) are industry-standard starting points

5. **Testing strategy:** Includes concrete test scenarios for each alert type

6. **Acknowledges PostHog limitations:** Correctly identifies that webhook failures are NOT PostHog events and need custom monitoring

7. **Avoids vendor lock-in:** Generic HTTP webhook support means alerts can go to Slack, Discord, or custom systems

---

## Missing Considerations

### 1. Alert Prioritization

The plan treats all alerts equally. In reality:
- **CRITICAL (wake up at 3 AM):** Stripe webhooks completely stopped
- **HIGH (check within 1 hour):** Payment failure spike
- **MEDIUM (check next morning):** Error rate increased 200%

**Recommendation:** Add alert severity levels to email subject lines:
```
[CRITICAL] PhotoVault: Payment events stopped for 24 hours
[HIGH] PhotoVault: 12 payment failures in last hour
[INFO] PhotoVault: Error rate increased 220%
```

### 2. Alert Remediation Runbook

The plan sends alerts but doesn't tell the admin WHAT TO DO.

**Recommendation:** Add "Next Steps" to each alert email:
```html
<h3>Recommended Actions:</h3>
<ol>
  <li>Check Stripe dashboard for webhook delivery status</li>
  <li>Review webhook_logs table for specific error messages</li>
  <li>Verify STRIPE_WEBHOOK_SECRET is correct in Vercel env vars</li>
  <li>If issue persists 1 hour, contact Stripe support</li>
</ol>
```

### 3. Alert Acknowledgment System

No mechanism to mark alerts as "seen" or "resolved."

**Recommendation:**
- Add `alert_logs` table with status: `sent`, `acknowledged`, `resolved`
- Admin dashboard page: `/admin/alerts` to view/acknowledge
- Include acknowledgment link in alert email

### 4. PostHog Free Tier Event Budget

**From posthog-skill.md:**
> "PostHog free tier: 1 million events/month"

The plan adds alerts that query PostHog data, but doesn't consider:
- Do these queries count against the event limit?
- What happens if PhotoVault hits 900K events and needs to conserve budget?

**Recommendation:**
- Verify with PostHog docs whether insight queries consume event quota
- Plan for "alert degradation mode" if approaching limit

---

## Implementation Order Concerns

The plan proposes 4 phases, but the order is suboptimal:

**Current order:**
1. Payment failures (30 min)
2. Webhook monitoring (20 min)
3. Error spikes (20 min)
4. Proactive monitoring (30 min)

**Recommended order:**
1. **Error spikes FIRST** (20 min) - easiest to test, validates PostHog alert system works
2. **Payment failures SECOND** (30 min) - highest business impact
3. **Webhook monitoring THIRD** (45 min, not 20) - needs infrastructure work
4. **Proactive monitoring LAST** (30 min) - nice-to-have, not critical

**Reasoning:** Start with easy wins to validate the alert pipeline, then tackle the harder webhook monitoring problem.

---

## Code Quality Concerns

### 1. Error Handling in monitor-webhooks.ts

The script has minimal error handling:

```typescript
if (error) {
  console.error('Failed to query webhook_logs:', error)
  return  // Silently fails - admin never knows monitoring broke
}
```

**Recommendation:** If the monitoring script itself fails, that's an alert-worthy event. Add:

```typescript
if (error) {
  console.error('Failed to query webhook_logs:', error)
  await EmailService.sendAlertEmail({
    to: ADMIN_EMAIL,
    subject: '[CRITICAL] PhotoVault: Webhook Monitoring Failed',
    body: `The webhook monitoring script crashed: ${error.message}`,
  })
  return
}
```

### 2. No TypeScript Types for Alert Email

```typescript
async sendAlertEmail(params: {
  to: string
  subject: string
  body: string // HTML content
})
```

This should use a proper type from `src/types/email.ts` (if it exists) or define:

```typescript
interface AlertEmailParams {
  to: string
  subject: string
  body: string
  alertType: 'payment_failure' | 'webhook_failure' | 'error_spike' | 'churn'
  severity: 'critical' | 'high' | 'medium' | 'info'
}
```

This enables filtering/routing alerts later.

---

## Recommendations Summary

### Must Fix Before Implementation (Blockers)

1. **Specify webhook monitoring deployment strategy** (Vercel Cron via API route OR GitHub Actions)
2. **Add ADMIN_EMAIL to environment variables documentation**
3. **Add error handling for monitoring script failures**

### Should Fix During Implementation (Important)

4. **Add alert deduplication** (don't spam admin with 50 emails)
5. **Start with conservative thresholds**, tune down after 1 week of data
6. **Add "Next Steps" remediation guidance to alert emails**
7. **Test email deliverability** with actual alert format before launch

### Nice to Have (Future Improvements)

8. **Alert acknowledgment system** (admin dashboard to view/dismiss alerts)
9. **Alert severity levels** in subject lines
10. **Alert silence mechanism** for planned maintenance

---

## Alignment with PhotoVault Patterns

**Does this plan follow existing patterns?**

✅ **YES:**
- Uses existing PostHog infrastructure (Stories 6.1-6.3)
- Uses existing EmailService pattern
- Uses existing `webhook_logs` table
- Leverages server-side tracking for critical events

❌ **NO:**
- Introduces new standalone script pattern (not used elsewhere in codebase)
- Should use API route pattern instead (consistent with other background jobs)

---

## Security Considerations

### 1. Webhook Monitoring Endpoint Exposure

If the webhook monitor becomes an API route (recommended), it MUST be protected:

```typescript
// /api/internal/monitor-webhooks/route.ts
const authHeader = req.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

**Missing from plan:** No mention of securing the monitoring endpoint.

### 2. Alert Email PII Exposure

Alert emails include:
- Error messages (might contain user input)
- Gallery IDs (could be sensitive)

**Recommendation:** Sanitize error messages before sending:

```typescript
const sanitizedError = error_message.replace(/auth_token=[^&]+/g, 'auth_token=REDACTED')
```

---

## PostHog-Specific Concerns

### 1. Alert Lag Time

**From PostHog docs (per plan sources):**
- Alerts check "every hour"
- This means up to 60 minutes between issue and notification

**For critical issues (Stripe webhooks down), 60 minutes is too long.**

**Recommendation:**
- Keep PostHog alerts for non-critical issues
- Use the webhook monitoring script (15-minute interval) for critical issues
- Consider upgrading to PostHog paid tier for faster alert checks (if available)

### 2. Ingestion Alert Limitations

**From plan Phase 4:**
> "Ingestion Alert: Alert if no `client_payment_completed` events for 24 hours"

**Problem:** 24 hours is a VERY long time. If webhooks break on Monday morning, admin won't know until Tuesday morning.

**Recommendation:** Start with 6-hour threshold, adjust up if too noisy:
- During business hours (9 AM - 9 PM), expect 1+ payment every 6 hours
- During off-hours, 24 hours is acceptable

---

## Testing Gaps

The plan includes test scenarios, but misses:

### 1. Test Alert Suppression

**Missing test:**
- Trigger 20 payment failures
- Verify only 1-2 alert emails sent (not 20)

### 2. Test Webhook Monitoring in Vercel Production

**Missing test:**
- Deploy to Vercel staging
- Verify cron job actually runs every 15 minutes
- Check Vercel logs for execution confirmation

### 3. Test PostHog Alert Delivery Speed

**Missing test:**
- Trigger error spike
- Measure time until PostHog sends alert
- Verify it's within stated "every hour" SLA

---

## Documentation Gaps

**What's missing from the plan:**

1. **Alert Configuration Backup:** If PostHog account is deleted, how do you recreate alerts?
   - Recommendation: Document all alert configurations in `docs/POSTHOG_ALERTS.md`

2. **Alert Log Retention:** How long to keep `webhook_logs` and `error_logs`?
   - Recommendation: Add cleanup job (delete logs older than 30 days)

3. **On-Call Rotation:** Who receives alerts?
   - Recommendation: Add `SECONDARY_ADMIN_EMAIL` env var for redundancy

---

## Final Verdict: APPROVE WITH CONCERNS

**This plan is implementable and solves the right problems, BUT requires the following changes:**

### Before Implementation Starts:
1. Convert webhook monitoring to API route + Vercel Cron (not standalone script)
2. Add `ADMIN_EMAIL` and `CRON_SECRET` to environment documentation
3. Add alert deduplication logic to prevent email spam

### During Implementation:
4. Test email deliverability with actual alert format
5. Add error handling for monitoring script failures
6. Start with conservative thresholds (10 failures/hour, tune down after 1 week)

### After Implementation (Week 2):
7. Tune thresholds based on production data
8. Add alert acknowledgment system if alerts are frequent
9. Consider Slack integration if email is too slow

**Estimated Implementation Time:**
- Plan estimates: 100 minutes (1h 40m)
- Realistic with fixes: **3-4 hours** (includes testing and deployment verification)

**Key Success Metric:**
- Within 1 hour of a critical issue (5+ payment failures), admin receives email and can take action

**Dependencies:**
- PostHog integration (Stories 6.1-6.3) ✅ Already complete
- Resend email service ✅ Already configured
- `webhook_logs` table ✅ Already exists

---

## Recommendation to User

**Present this critique alongside the plan.** Ask the user:

1. **Webhook monitoring deployment:** "Should we use Vercel Cron (simpler) or GitHub Actions (more control)?"
2. **Alert threshold aggressiveness:** "Start conservative (10 failures/hour) or aggressive (5 failures/hour)?"
3. **Alert channel priority:** "Email-only for beta, or set up Slack now?"

**Do NOT implement until the webhook monitoring deployment strategy is decided.**

---

**End of Critique**
