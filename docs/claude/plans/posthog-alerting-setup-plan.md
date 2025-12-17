# PostHog Alerting Setup Plan
**Story:** 5.1 - Monitoring & Error Tracking (Remaining Work)
**Date:** December 16, 2025
**Author:** PostHog Analytics Expert

---

## Executive Summary

PhotoVault already has PostHog integrated (Stories 6.1-6.3 complete) with comprehensive error tracking via `error_encountered` events. This plan adds **real-time alerts** to notify the admin when critical issues occur, replacing the need for Sentry.

**Scope:** Configure PostHog Alerts for payment errors, webhook failures, and critical application errors. No code changes required—this is primarily PostHog dashboard configuration.

---

## 1. Current State Analysis

### ✅ What's Already Working

Based on codebase review:

1. **PostHog Foundation (Story 6.1)**
   - Client-side tracking: `src/lib/analytics/client.ts`
   - Server-side tracking: `src/lib/analytics/server.ts`
   - Provider setup: `src/app/providers/PostHogProvider.tsx`

2. **Error Tracking (Story 6.3)**
   - **Error Boundary**: `src/components/ErrorBoundary.tsx` sends `error_encountered` events to PostHog
   - **Fallback Logging**: `/api/analytics/error` endpoint logs to `error_logs` table when PostHog is blocked
   - **Server-side Error Tracking**: Webhook errors tracked via `trackServerEvent`

3. **Payment Event Tracking**
   - `client_payment_completed` - Successful payments (line 468 in webhook)
   - `client_payment_failed` - Failed payments (line 1056 in webhook)
   - All tracked server-side (cannot be ad-blocked)

4. **Webhook Logging Infrastructure**
   - `webhook_logs` table tracks all webhook successes/failures
   - `processed_webhook_events` table for idempotency
   - Error details captured in `error_message` and `stack_trace` columns

### 📊 Events Available for Alerting

From `src/types/analytics.ts`:

| Event Name | Properties | Source | Alert Priority |
|------------|-----------|--------|----------------|
| `error_encountered` | `error_type`, `error_message`, `page`, `stack_trace` | Client + Server | HIGH |
| `client_payment_failed` | `failure_reason`, `amount_cents`, `gallery_id` | Server | CRITICAL |
| `client_payment_completed` | `amount_cents`, `is_first_payment` | Server | Info |
| `photographer_churned` | `total_revenue_cents`, `churn_reason` | Server | HIGH |
| `client_churned` | `tenure_days`, `churn_reason` | Server | HIGH |

---

## 2. PostHog Alerting Capabilities

Based on web research ([PostHog Alerts Docs](https://posthog.com/docs/alerts)):

### Available Alert Types

1. **Trends Alerts** - Monitor insight values (e.g., error count spikes)
2. **Error Tracking Alerts** - Trigger on new/reopened issues
3. **Ingestion Alerts** - Detect when events stop flowing

### Notification Channels

- ✅ **Email** - Built-in, no setup required
- ✅ **Slack** - Via integration
- ✅ **Discord** - Via webhook
- ✅ **MS Teams** - Via webhook
- ✅ **Generic HTTP Webhook** - For custom integrations

### Threshold Types

- **Absolute**: "More than X errors per hour"
- **Relative**: "Errors increased by 50% compared to previous period"

---

## 3. Implementation Plan

### Phase 1: Critical Payment Alerts (30 minutes)

**Goal:** Get notified immediately when client payments fail

#### Step 1.1: Create "Payment Failures" Insight

1. Navigate to PostHog → Insights → New Insight
2. Configure as **Trends** insight:
   - Event: `client_payment_failed`
   - Aggregation: Total count
   - Breakdown by: `failure_reason` (to see common reasons)
   - Time range: Last 7 days
   - Interval: Hourly
3. Save as "Payment Failures - Hourly"

#### Step 1.2: Set Up Payment Failure Alert

1. Click "Alerts" button on the insight
2. Click "New alert"
3. Configure:
   - **Name:** "Payment Failure Spike Alert"
   - **Check frequency:** Every hour
   - **Condition:** Absolute value
   - **Threshold:** More than 5 failures in 1 hour
   - **Recipients:** Admin email (from env var: `FROM_EMAIL` or nate's email)
4. Save alert

#### Step 1.3: Optional Slack Integration

If Slack workspace exists:
1. PostHog Settings → Integrations → Slack
2. Connect workspace
3. Edit alert → Add Slack notification
4. Select channel (e.g., `#photovault-alerts`)

**Expected Outcome:**
- Email sent within 1 hour of threshold breach
- Can investigate failures in PostHog Live Events or Supabase `webhook_logs` table

---

### Phase 2: Webhook Failure Alerts (20 minutes)

**Goal:** Detect when Stripe webhooks are failing repeatedly

#### Step 2.1: Create "Webhook Errors" Database Query

**Note:** Webhook failures are NOT PostHog events—they're in the `webhook_logs` table. We'll use PostHog's SQL Insights feature (if available) or create a custom monitoring endpoint.

**Option A: PostHog SQL Insights (if available)**
1. PostHog → Insights → New SQL Insight
2. Query:
   ```sql
   SELECT
     COUNT(*) as failure_count,
     event_type
   FROM webhook_logs
   WHERE status = 'failed'
     AND processed_at >= NOW() - INTERVAL '1 hour'
   GROUP BY event_type
   HAVING COUNT(*) > 3
   ```
3. Save as "Webhook Failures - Hourly"
4. Set alert on this insight

**Option B: Custom Monitoring Script (Recommended)**

Since webhook failures are in Supabase, not PostHog, we'll create a server-side monitoring script:

**New file:** `scripts/monitor-webhooks.ts`

```typescript
/**
 * Webhook Failure Monitor
 *
 * Checks for webhook failures in last hour and sends alerts.
 * Run via cron job: */15 * * * * (every 15 minutes)
 */

import { createServiceRoleClient } from '@/lib/supabase-server'

const FAILURE_THRESHOLD = 3 // Alert if 3+ failures in 1 hour
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nathaniel.crowell12@gmail.com'

async function checkWebhookFailures() {
  const supabase = createServiceRoleClient()

  // Get failures in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: failures, error } = await supabase
    .from('webhook_logs')
    .select('event_type, error_message, processed_at')
    .eq('status', 'failed')
    .gte('processed_at', oneHourAgo)
    .order('processed_at', { ascending: false })

  if (error) {
    console.error('Failed to query webhook_logs:', error)
    return
  }

  if (failures.length >= FAILURE_THRESHOLD) {
    console.warn(`⚠️ ALERT: ${failures.length} webhook failures in last hour`)

    // Send email alert
    const { EmailService } = await import('@/lib/email/email-service')
    await EmailService.sendAlertEmail({
      to: ADMIN_EMAIL,
      subject: `[PhotoVault] ${failures.length} Webhook Failures Detected`,
      body: `
        <h2>Webhook Failure Alert</h2>
        <p><strong>${failures.length} webhooks failed in the last hour.</strong></p>

        <h3>Recent Failures:</h3>
        <ul>
        ${failures.slice(0, 5).map(f => `
          <li>
            <strong>${f.event_type}</strong> at ${new Date(f.processed_at).toLocaleString()}<br>
            Error: ${f.error_message}
          </li>
        `).join('')}
        </ul>

        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/logs">View Full Logs</a></p>
      `
    })

    console.log('Alert email sent to', ADMIN_EMAIL)
  }
}

// Run check
checkWebhookFailures().catch(console.error)
```

**Deployment:**
- Add to `package.json`: `"monitor:webhooks": "tsx scripts/monitor-webhooks.ts"`
- Set up Vercel Cron Job or GitHub Actions workflow to run every 15 minutes

**Alternative (Simpler):** Use PostHog's "Ingestion Alert" plugin to detect when `client_payment_completed` events stop flowing (indicates webhook issues).

---

### Phase 3: Critical Error Alerts (20 minutes)

**Goal:** Get notified when application errors spike

#### Step 3.1: Create "Error Rate" Insight

1. PostHog → Insights → New Insight
2. Configure as **Trends**:
   - Event: `error_encountered`
   - Aggregation: Total count
   - Breakdown by: `error_type` (to see patterns)
   - Time range: Last 7 days
   - Interval: Hourly
3. Save as "Application Errors - Hourly"

#### Step 3.2: Set Up Error Spike Alert

1. Click "Alerts" on the insight
2. Click "New alert"
3. Configure:
   - **Name:** "Error Spike Alert"
   - **Check frequency:** Every hour
   - **Condition:** Relative change
   - **Threshold:** Increased by 200% compared to previous hour
   - **Recipients:** Admin email
4. Save alert

**Why relative threshold?**
- Baseline errors might be 5-10/hour normally
- Spike to 30+ errors indicates a real issue
- Avoids noise from normal error rate

#### Step 3.3: Create "Critical Error Types" Alert

For specific high-severity errors:

1. Create new Insight with filter:
   - Event: `error_encountered`
   - Filter: `error_type` = "ChunkLoadError" OR "AuthError" OR "StripeError"
2. Set absolute threshold: More than 1 per hour
3. Attach alert with email notification

---

### Phase 4: Proactive Monitoring (30 minutes)

**Goal:** Detect when critical systems stop working entirely

#### Step 4.1: Ingestion Alert for Payment Events

1. PostHog → Apps → Ingestion Alert (install if not installed)
2. Configure:
   - **Event to monitor:** `client_payment_completed`
   - **Alert if no events for:** 24 hours
   - **Webhook URL:** Slack webhook or custom endpoint
3. Save

**Why this matters:**
- If Stripe webhooks break completely, we stop receiving payment events
- This detects "silence" (more dangerous than errors)

#### Step 4.2: Churn Tracking Alert

1. Create Insight:
   - Events: `photographer_churned` + `client_churned`
   - Aggregation: Total count
   - Interval: Daily
2. Set alert:
   - Threshold: More than 5 churns in 1 day
   - Notification: Email

---

## 4. Email Alert Template

**Required:** Add `sendAlertEmail` method to `EmailService`

**New method in `src/lib/email/email-service.ts`:**

```typescript
/**
 * Send generic alert email to admin
 * Used by monitoring scripts and alert webhooks
 */
async sendAlertEmail(params: {
  to: string
  subject: string
  body: string // HTML content
}): Promise<{ success: boolean; messageId?: string; error?: Error }> {
  try {
    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: params.to,
      subject: params.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .alert-box {
              background: #fff3cd;
              border: 2px solid #ffc107;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            ul { padding-left: 20px; }
            li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="alert-box">
            ${params.body}
          </div>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated alert from PhotoVault monitoring system.
          </p>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('[EmailService] Alert email failed:', error)
      return { success: false, error }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('[EmailService] Exception sending alert email:', error)
    return { success: false, error: error as Error }
  }
}
```

---

## 5. Testing Strategy

### Test 1: Payment Failure Alert

**Trigger a test payment failure:**

1. Use Stripe test card: `4000 0000 0000 9995` (always declines)
2. Create test gallery checkout
3. Complete checkout with declining card
4. Verify:
   - `client_payment_failed` event appears in PostHog Live Events
   - `webhook_logs` table shows failure
   - After threshold met, email alert sent

### Test 2: Error Spike Alert

**Trigger multiple errors:**

1. Add test button to dev environment:
   ```tsx
   <button onClick={() => {
     for (let i = 0; i < 10; i++) {
       throw new Error(`Test error ${i}`)
     }
   }}>Trigger Error Spike</button>
   ```
2. Click button repeatedly
3. Verify:
   - Errors appear in PostHog
   - Alert triggers after threshold met

### Test 3: Webhook Monitoring Script

**Simulate webhook failure:**

1. Temporarily break webhook handler (add `throw new Error('test')`)
2. Trigger Stripe event via CLI: `stripe trigger checkout.session.completed`
3. Run monitoring script: `npm run monitor:webhooks`
4. Verify alert email sent

---

## 6. Dashboard Configuration Checklist

- [ ] **Payment Failures Insight** created with hourly interval
- [ ] **Payment Failure Alert** set (threshold: 5/hour)
- [ ] **Application Errors Insight** created with breakdown by error_type
- [ ] **Error Spike Alert** set (threshold: 200% increase)
- [ ] **Critical Error Types Alert** set (specific error types)
- [ ] **Ingestion Alert** configured for payment events
- [ ] **Churn Alert** set (threshold: 5/day)
- [ ] **Admin email** configured as recipient for all alerts
- [ ] **Slack integration** (optional) connected

---

## 7. Code Changes Required

### ✅ No Changes to Existing Analytics Code

The PostHog integration is already complete. Only new additions:

### New Files Needed

1. **`scripts/monitor-webhooks.ts`**
   - Purpose: Check `webhook_logs` table for failures
   - Runs: Every 15 minutes via cron
   - Dependencies: Already has Supabase client and EmailService

2. **`src/lib/email/email-service.ts`** (modification)
   - Add: `sendAlertEmail()` method
   - ~30 lines of code

3. **`.github/workflows/monitor-webhooks.yml`** (optional)
   - GitHub Actions cron to run webhook monitor
   - Alternative: Use Vercel Cron or separate service

### Environment Variables

Already set:
- `POSTHOG_API_KEY` ✅
- `NEXT_PUBLIC_POSTHOG_HOST` ✅
- `RESEND_API_KEY` ✅
- `FROM_EMAIL` ✅

New (optional):
- `ADMIN_EMAIL` - Where to send alerts (defaults to FROM_EMAIL)
- `SLACK_WEBHOOK_URL` - For Slack notifications (if not using PostHog integration)

---

## 8. Recommended Alert Thresholds

Based on production best practices:

| Alert | Threshold | Reasoning |
|-------|-----------|-----------|
| **Payment Failures** | 5 per hour | 1-2 failures are normal (expired cards). 5+ indicates systematic issue. |
| **Error Spike** | 200% increase | Catches sudden problems without noise from baseline errors. |
| **Critical Errors** | 1 per hour | Auth/Stripe errors are always serious. |
| **Ingestion Silence** | 24 hours | Allows for legitimate quiet periods (weekends, holidays). |
| **Churn Spike** | 5 per day | Normal churn is 1-2/day. 5+ indicates major issue. |
| **Webhook Failures** | 3 per hour | 1-2 retries are expected. 3+ means real problem. |

---

## 9. PostHog Dashboard Setup Screenshots

*Note: These are text-based guides. During implementation, take actual screenshots for documentation.*

### Creating a Trends Insight

```
1. Click "Insights" in left sidebar
2. Click "New Insight" button (top right)
3. Select "Trends" tab
4. Under "Series", click "+ Add graph series"
5. Select event: "client_payment_failed"
6. Set interval: "Hour"
7. Click "Save & Continue"
8. Name it: "Payment Failures - Hourly"
```

### Setting Up an Alert

```
1. Open the saved insight
2. Click "Alerts" button (top right, bell icon)
3. Click "New alert"
4. Fill in form:
   - Name: "Payment Failure Spike Alert"
   - Check frequency: Hourly
   - Condition type: Absolute value
   - Threshold: Greater than 5
   - Notify via: Email (add admin email)
5. Click "Create alert"
```

---

## 10. Maintenance & Monitoring

### Daily Tasks
- Check PostHog dashboard for alert status
- Review any alerts received via email

### Weekly Tasks
- Review `error_logs` table for patterns not caught by alerts
- Check `webhook_logs` for any unusual patterns
- Tune alert thresholds if too noisy or too quiet

### Monthly Tasks
- Review alert effectiveness (did we catch real issues?)
- Clean up old webhook logs: `SELECT cleanup_old_webhook_logs()`
- Update alert recipients if team changes

---

## 11. Comparison: PostHog vs Sentry

**Why PostHog is sufficient for PhotoVault:**

| Feature | PostHog | Sentry | PhotoVault Needs |
|---------|---------|--------|------------------|
| Error tracking | ✅ Yes (events) | ✅ Yes (specialized) | ✅ Covered by PostHog |
| Alerts | ✅ Email, Slack, Webhook | ✅ Email, Slack, PagerDuty | ✅ Email sufficient |
| Stack traces | ✅ Via properties | ✅ Enhanced UI | ✅ Stack in PostHog/Supabase |
| Payment tracking | ✅ Server events | ❌ Not built for payments | ✅ PostHog perfect fit |
| User context | ✅ User properties | ✅ User context | ✅ PostHog already has this |
| Ad-blocker proof | ✅ Server-side tracking | ✅ Server-side SDK | ✅ Already implemented |
| Cost | ✅ Free tier: 1M events/mo | ❌ $26/mo minimum | ✅ Well under free tier |

**Verdict:** PostHog covers all critical alerting needs. Sentry adds minimal value for the cost.

---

## 12. Success Criteria

This implementation is complete when:

1. ✅ Admin receives email within 1 hour when 5+ payments fail
2. ✅ Admin receives email when errors spike 200% above baseline
3. ✅ Admin receives email when critical error types occur
4. ✅ Admin receives notification if payment events stop for 24 hours
5. ✅ Webhook monitoring script runs automatically every 15 minutes
6. ✅ All alerts are documented in PostHog dashboard
7. ✅ Test scenarios confirm alerts trigger correctly

---

## 13. Rollout Plan

### Phase 1 (Day 1): Set Up Core Alerts
- Configure Payment Failure alert
- Configure Error Spike alert
- Test both with manual triggers

### Phase 2 (Day 2): Add Webhook Monitoring
- Implement `monitor-webhooks.ts` script
- Add `sendAlertEmail` to EmailService
- Set up cron job (GitHub Actions or Vercel)
- Test webhook alert

### Phase 3 (Day 3): Add Proactive Monitoring
- Configure Ingestion Alert plugin
- Configure Churn alert
- Document all alerts in admin docs

### Phase 4 (Week 2): Tune & Optimize
- Monitor alert noise for 1 week
- Adjust thresholds if needed
- Add Slack integration if email is too slow

---

## Sources

- [PostHog Alerts Documentation](https://posthog.com/docs/alerts)
- [PostHog Error Tracking Alerts](https://posthog.com/docs/error-tracking/alerts)
- [PostHog Alert Examples](https://posthog.com/blog/alerts-examples)
- [PostHog Ingestion Alert Plugin](https://posthog.com/apps/ingestion-alert)

---

**End of Plan**
