# Stripe Beta Coupon Implementation Plan

**Created:** January 4, 2026
**Author:** Claude Code (Stripe Expert Agent)
**Related Spec:** `docs/BETA-TESTER-SYSTEM-SPEC.md`
**Status:** READY FOR IMPLEMENTATION

---

## Overview

This plan covers the Stripe-specific implementation for the PhotoVault Beta Tester System:
1. Creating the `PHOTOVAULT_BETA_2026` coupon via Stripe CLI
2. Implementing the `customer.discount.created` webhook handler
3. Sending the beta welcome email

---

## Part 1: Stripe CLI Coupon Creation

### 1.1 Prerequisites

Ensure the Stripe CLI is configured for the correct environment:

```powershell
# Check current Stripe CLI configuration
& 'C:\Users\natha\stripe-cli\stripe.exe' config --list

# For LIVE mode (production beta testers):
& 'C:\Users\natha\stripe-cli\stripe.exe' login

# Verify you're in the right mode:
& 'C:\Users\natha\stripe-cli\stripe.exe' customers list --limit 1
```

### 1.2 Create the Beta Coupon

**IMPORTANT:** The `redeem_by` parameter requires a Unix timestamp.

```powershell
# Calculate Unix timestamp for July 31, 2026 23:59:59 UTC
# July 31, 2026 = 1785283199 (Unix timestamp)

# Create the coupon in Stripe
& 'C:\Users\natha\stripe-cli\stripe.exe' coupons create `
  --id="PHOTOVAULT_BETA_2026" `
  --name="PhotoVault Founding Photographer - Beta 2026" `
  --percent-off=100 `
  --duration=repeating `
  --duration-in-months=12 `
  --max-redemptions=30 `
  --redeem-by=1785283199
```

**Alternative (using PowerShell to calculate timestamp):**

```powershell
# PowerShell: Calculate Unix timestamp for July 31, 2026
$expiryDate = [DateTime]::new(2026, 7, 31, 23, 59, 59, [DateTimeKind]::Utc)
$unixTimestamp = [int][double]::Parse(($expiryDate - [DateTime]::new(1970, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)).TotalSeconds)
Write-Host "Unix timestamp: $unixTimestamp"

# Then use the timestamp in the command
& 'C:\Users\natha\stripe-cli\stripe.exe' coupons create `
  --id="PHOTOVAULT_BETA_2026" `
  --name="PhotoVault Founding Photographer - Beta 2026" `
  --percent-off=100 `
  --duration=repeating `
  --duration-in-months=12 `
  --max-redemptions=30 `
  --redeem-by=$unixTimestamp
```

### 1.3 Verify Coupon Creation

```powershell
# Verify the coupon was created correctly
& 'C:\Users\natha\stripe-cli\stripe.exe' coupons retrieve PHOTOVAULT_BETA_2026
```

Expected output should show:
- `percent_off: 100`
- `duration: repeating`
- `duration_in_months: 12`
- `max_redemptions: 30`
- `redeem_by: 1785283199`
- `valid: true`

---

## Part 2: Webhook Handler Implementation

### 2.1 Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/stripe/webhooks/index.ts` | MODIFY | Add case for `customer.discount.created` |
| `src/lib/stripe/webhooks/discount.ts` | CREATE | New handler module for discount events |
| `src/lib/stripe/webhooks/types.ts` | MODIFY | Add Discount type export |
| `src/lib/email/beta-templates.ts` | CREATE | Beta welcome email template |
| `src/lib/email/email-service.ts` | MODIFY | Add `sendBetaWelcomeEmail` method |

### 2.2 Create Discount Handler Module

**File:** `src/lib/stripe/webhooks/discount.ts`

```typescript
/**
 * Discount Webhook Handlers
 *
 * Handles: customer.discount.created
 * Manages beta tester enrollment via coupon application
 */
import { logger } from '@/lib/logger'
import { EmailService } from '@/lib/email/email-service'
import type { WebhookContext, HandlerResult } from './types'
import type Stripe from 'stripe'

// Beta coupon ID - must match Stripe coupon
const BETA_COUPON_ID = 'PHOTOVAULT_BETA_2026'

// Locked price for beta testers
const BETA_LOCKED_PRICE = 22.00

/**
 * Handle discount creation (coupon applied to customer)
 */
export async function handleDiscountCreated(
  discount: Stripe.Discount,
  ctx: WebhookContext
): Promise<HandlerResult> {
  logger.info('[Webhook] Processing customer.discount.created', {
    couponId: discount.coupon?.id,
    customerId: discount.customer,
  })

  const { supabase } = ctx

  // Only process our beta coupon
  if (discount.coupon?.id !== BETA_COUPON_ID) {
    logger.info(`[Webhook] Ignoring non-beta coupon: ${discount.coupon?.id}`)
    return {
      success: true,
      message: `Ignored discount with coupon: ${discount.coupon?.id}`,
    }
  }

  // Get the Stripe customer ID (could be string or Customer object)
  const stripeCustomerId = typeof discount.customer === 'string'
    ? discount.customer
    : discount.customer?.id

  if (!stripeCustomerId) {
    throw new Error('Discount event missing customer ID')
  }

  // Find the photographer by Stripe customer ID
  // First check user_profiles (main user table with stripe_customer_id)
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, full_name, user_type')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (profileError || !userProfile) {
    throw new Error(`User not found for Stripe customer: ${stripeCustomerId}`)
  }

  // Verify this is a photographer
  if (userProfile.user_type !== 'photographer') {
    logger.warn(`[Webhook] Beta coupon applied to non-photographer: ${userProfile.id}`)
    return {
      success: true,
      message: `Coupon applied but user is not a photographer: ${userProfile.id}`,
    }
  }

  // Update photographer_profiles with beta tester status
  const { error: updateError } = await supabase
    .from('photographer_profiles')
    .update({
      is_beta_tester: true,
      beta_start_date: new Date().toISOString(),
      price_locked_at: BETA_LOCKED_PRICE,
    })
    .eq('user_id', userProfile.id)

  if (updateError) {
    throw new Error(`Failed to update photographer profile: ${updateError.message}`)
  }

  // Get photographer's email for welcome message
  const { data: authUser, error: authError } = await supabase
    .from('auth.users')
    .select('email')
    .eq('id', userProfile.id)
    .single()

  // Fallback: query using RPC or service role if auth.users isn't accessible
  let photographerEmail: string | null = null

  if (authError || !authUser?.email) {
    // Try to get email from Stripe customer
    try {
      const stripeCustomer = await ctx.stripe.customers.retrieve(stripeCustomerId)
      if ('email' in stripeCustomer && stripeCustomer.email) {
        photographerEmail = stripeCustomer.email
      }
    } catch (stripeError) {
      logger.warn('[Webhook] Could not retrieve email from Stripe:', stripeError)
    }
  } else {
    photographerEmail = authUser.email
  }

  // Send welcome email (fire and forget, don't block webhook response)
  if (photographerEmail) {
    EmailService.sendBetaWelcomeEmail({
      photographerEmail,
      photographerName: userProfile.full_name || 'Photographer',
      betaStartDate: new Date().toISOString(),
      freeMonths: 12,
      lockedPrice: BETA_LOCKED_PRICE,
    }).catch((emailError) => {
      logger.error('[Webhook] Failed to send beta welcome email:', emailError)
    })
  } else {
    logger.warn('[Webhook] Could not find email for photographer:', userProfile.id)
  }

  logger.info(`[Webhook] Photographer ${userProfile.id} enrolled as beta tester`)

  return {
    success: true,
    message: `Beta tester enrolled: ${userProfile.id}`,
    data: {
      photographerId: userProfile.id,
      betaStartDate: new Date().toISOString(),
      lockedPrice: BETA_LOCKED_PRICE,
    },
  }
}
```

### 2.3 Update Webhook Index

**File:** `src/lib/stripe/webhooks/index.ts`

Add the import and case handler:

```typescript
// Add import at top
import { handleDiscountCreated } from './discount'

// In the switch statement (around line 100), add:
      case 'customer.discount.created':
        result = await handleDiscountCreated(
          event.data.object as Stripe.Discount,
          ctx
        )
        break
```

### 2.4 Update Types

**File:** `src/lib/stripe/webhooks/types.ts`

Add Discount type export at the bottom:

```typescript
// Add to existing type exports
export type Discount = Stripe.Discount
```

---

## Part 3: Beta Welcome Email Template

### 3.1 Create Beta Templates File

**File:** `src/lib/email/beta-templates.ts`

```typescript
/**
 * Beta Tester Email Templates
 *
 * Templates for beta/founding photographer program communications
 */

export interface BetaWelcomeEmailData {
  photographerEmail: string
  photographerName: string
  betaStartDate: string
  freeMonths: number
  lockedPrice: number
}

/**
 * Beta Welcome Email - HTML Version
 */
export function getBetaWelcomeEmailHTML(data: BetaWelcomeEmailData): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://photovault.photo'
  const freeEndDate = new Date(data.betaStartDate)
  freeEndDate.setMonth(freeEndDate.getMonth() + data.freeMonths)
  const formattedEndDate = freeEndDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PhotoVault, Founding Photographer!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #f59e0b, #eab308);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.95;
            font-size: 16px;
        }
        .badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            margin-top: 15px;
            font-size: 14px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #1f2937;
            margin: 0 0 20px 0;
            font-size: 22px;
        }
        .content p {
            color: #4b5563;
            margin: 0 0 16px 0;
            font-size: 16px;
        }
        .benefits-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 24px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .benefits-box h3 {
            margin: 0 0 16px 0;
            color: #92400e;
            font-size: 18px;
        }
        .benefits-box ul {
            margin: 0;
            padding-left: 20px;
        }
        .benefits-box li {
            color: #92400e;
            margin: 8px 0;
            font-size: 15px;
        }
        .benefits-box li strong {
            color: #78350f;
        }
        .expectations-box {
            background: #f0f9ff;
            padding: 24px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .expectations-box h3 {
            margin: 0 0 16px 0;
            color: #1e40af;
            font-size: 18px;
        }
        .expectations-box ol {
            margin: 0;
            padding-left: 20px;
        }
        .expectations-box li {
            color: #1e40af;
            margin: 8px 0;
            font-size: 15px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b, #eab308);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            margin: 30px 0;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
        .cta-container {
            text-align: center;
        }
        .signature {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .signature p {
            margin: 4px 0;
            font-size: 15px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer p {
            margin: 8px 0;
            color: #9ca3af;
        }
        .footer a {
            color: #f59e0b;
            text-decoration: none;
        }
        .ps {
            margin-top: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>You're In!</h1>
            <p>Welcome to PhotoVault's Founding Photographer Program</p>
            <span class="badge">1 of 15 Founding Photographers</span>
        </div>

        <div class="content">
            <h2>Hey ${data.photographerName},</h2>

            <p>Welcome to PhotoVault's founding photographer program. You're one of only 15 photographers getting early access.</p>

            <div class="benefits-box">
                <h3>What You Get:</h3>
                <ul>
                    <li><strong>$0 platform fee</strong> for the next 12 months ($264 value)</li>
                    <li><strong>$${data.lockedPrice}/month locked forever</strong> - immune to future price increases</li>
                    <li><strong>Founding Photographer badge</strong> on your profile</li>
                    <li><strong>Direct line to me</strong> for feedback and support</li>
                </ul>
                <p style="margin: 16px 0 0 0; font-size: 14px;">
                    Your free period runs until <strong>${formattedEndDate}</strong>
                </p>
            </div>

            <div class="expectations-box">
                <h3>What I Need From You:</h3>
                <ol>
                    <li>Upload at least one real gallery</li>
                    <li>Invite at least one real client (they'll pay real money)</li>
                    <li>Reply to my weekly check-in emails with honest feedback</li>
                    <li>Report any bugs or issues you find</li>
                </ol>
            </div>

            <p>Your feedback shapes what PhotoVault becomes. I'm not building this alone - I'm building it with you.</p>

            <div class="cta-container">
                <a href="${dashboardUrl}/photographer/dashboard" class="cta-button">Go to Your Dashboard</a>
            </div>

            <div class="signature">
                <p>Let's build this together,</p>
                <p><strong>Nate</strong></p>
                <p>Founder, PhotoVault</p>
            </div>

            <div class="ps">
                <strong>P.S.</strong> - As a bonus, I'm attaching our exclusive 100 Dane County Photo Locations guide. GPS coordinates, permit rules, insider tips for every spot. Enjoy!
            </div>

            <div class="footer">
                <p>Questions? Just reply to this email - it comes directly to me.</p>
                <p>Or email <a href="mailto:nate@photovault.photo">nate@photovault.photo</a></p>
                <p style="margin-top: 20px; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} PhotoVault. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

/**
 * Beta Welcome Email - Plain Text Version
 */
export function getBetaWelcomeEmailText(data: BetaWelcomeEmailData): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://photovault.photo'
  const freeEndDate = new Date(data.betaStartDate)
  freeEndDate.setMonth(freeEndDate.getMonth() + data.freeMonths)
  const formattedEndDate = freeEndDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
YOU'RE IN!

Hey ${data.photographerName},

Welcome to PhotoVault's founding photographer program. You're one of only 15 photographers getting early access.

WHAT YOU GET:
- $0 platform fee for the next 12 months ($264 value)
- $${data.lockedPrice}/month locked forever - immune to future price increases
- Founding Photographer badge on your profile
- Direct line to me for feedback and support

Your free period runs until ${formattedEndDate}

WHAT I NEED FROM YOU:
1. Upload at least one real gallery
2. Invite at least one real client (they'll pay real money)
3. Reply to my weekly check-in emails with honest feedback
4. Report any bugs or issues you find

Your feedback shapes what PhotoVault becomes. I'm not building this alone - I'm building it with you.

Go to your dashboard: ${dashboardUrl}/photographer/dashboard

Let's build this together,
Nate
Founder, PhotoVault

P.S. - As a bonus, I'm attaching our exclusive 100 Dane County Photo Locations guide. GPS coordinates, permit rules, insider tips for every spot. Enjoy!

---
Questions? Just reply to this email - it comes directly to me.
Or email nate@photovault.photo

(c) ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}
```

### 3.2 Update Email Service

**File:** `src/lib/email/email-service.ts`

Add the import and method:

```typescript
// Add to imports at top (around line 70)
import {
  getBetaWelcomeEmailHTML,
  getBetaWelcomeEmailText,
  type BetaWelcomeEmailData,
} from './beta-templates'

// Add method to EmailService class (before the closing brace):

  // ============================================================================
  // BETA PROGRAM EMAILS
  // ============================================================================

  /**
   * Send beta welcome email to founding photographer
   * Triggered when PHOTOVAULT_BETA_2026 coupon is applied
   */
  static async sendBetaWelcomeEmail(data: BetaWelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.photographerEmail,
        subject: 'Welcome to PhotoVault, Founding Photographer!',
        html: getBetaWelcomeEmailHTML(data),
        text: getBetaWelcomeEmailText(data),
      })

      logger.info(`[Email] Beta welcome email sent to ${data.photographerEmail}`)
      return { success: true }
    } catch (error: any) {
      logger.error('[Email] Error sending beta welcome email:', error)
      return { success: false, error: error.message }
    }
  }
```

---

## Part 4: Database Migration

The spec requires adding columns to `photographer_profiles`. Current schema shows the table exists but lacks the beta fields.

**Migration SQL:**

```sql
-- Migration: add_beta_tester_fields
ALTER TABLE photographer_profiles
ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS beta_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS price_locked_at DECIMAL(10,2);

-- Index for quick beta tester lookups
CREATE INDEX IF NOT EXISTS idx_photographer_beta_tester
ON photographer_profiles(is_beta_tester)
WHERE is_beta_tester = TRUE;

COMMENT ON COLUMN photographer_profiles.is_beta_tester IS 'True if photographer is a founding/beta tester';
COMMENT ON COLUMN photographer_profiles.beta_start_date IS 'When they joined the beta program';
COMMENT ON COLUMN photographer_profiles.price_locked_at IS 'Their locked platform fee rate (e.g., 22.00) - immune to future price increases';
```

Run via Supabase MCP tool:
```
mcp__supabase__apply_migration(name: "add_beta_tester_fields", query: <SQL above>)
```

---

## Part 5: Testing Steps

### 5.1 Local Testing with Stripe CLI

```powershell
# Terminal 1: Start dev server
cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"
npm run dev -- -p 3002

# Terminal 2: Start Stripe webhook forwarding
& 'C:\Users\natha\stripe-cli\stripe.exe' listen --forward-to localhost:3002/api/webhooks/stripe

# Note the webhook signing secret (whsec_xxx) and update .env.local if needed
```

### 5.2 Trigger Test Discount Event

```powershell
# Create a test customer first (if needed)
& 'C:\Users\natha\stripe-cli\stripe.exe' customers create --email="beta-test@example.com"

# Apply the beta coupon to the customer
& 'C:\Users\natha\stripe-cli\stripe.exe' customers update cus_XXXXX --coupon=PHOTOVAULT_BETA_2026

# Or trigger a synthetic event for testing
& 'C:\Users\natha\stripe-cli\stripe.exe' trigger customer.discount.created
```

### 5.3 Verify Webhook Processing

1. Check Terminal 2 for webhook receipt confirmation
2. Check Terminal 1 (dev server) logs for processing
3. Query database to verify `is_beta_tester = true`:

```sql
SELECT id, user_id, is_beta_tester, beta_start_date, price_locked_at
FROM photographer_profiles
WHERE is_beta_tester = true;
```

### 5.4 Test Email Delivery

1. Check Resend dashboard for email delivery status
2. Verify email content and formatting
3. Check spam folder if email not received

---

## Part 6: Error Handling Considerations

### 6.1 Webhook Idempotency

The existing webhook system already handles idempotency via `processed_webhook_events` table. No changes needed.

### 6.2 Missing User Profile

If a Stripe customer has the coupon applied but no matching `user_profiles` record:
- Log error with customer ID
- Return 200 to Stripe (don't retry)
- Alert admin if this happens in production

### 6.3 Email Failures

Email sending is fire-and-forget with error logging:
- Webhook returns success even if email fails
- Error logged to console and potentially error_logs table
- Can manually resend welcome email via admin action

### 6.4 Non-Photographer Coupon Use

If coupon is applied to a non-photographer account:
- Log warning
- Return success (don't fail the webhook)
- The coupon still provides the discount but no badge/status

---

## Part 7: Implementation Checklist

### Pre-Implementation
- [ ] Verify Stripe CLI is installed and configured
- [ ] Confirm target environment (test vs live mode)
- [ ] Review existing webhook handler patterns

### Stripe Configuration
- [ ] Create coupon via CLI command
- [ ] Verify coupon settings in Stripe Dashboard
- [ ] Test coupon applies to photographer subscription price

### Database
- [ ] Run migration to add beta columns
- [ ] Verify columns exist with correct types
- [ ] Update TypeScript types if using generated types

### Code Implementation
- [ ] Create `src/lib/stripe/webhooks/discount.ts`
- [ ] Update `src/lib/stripe/webhooks/index.ts`
- [ ] Update `src/lib/stripe/webhooks/types.ts`
- [ ] Create `src/lib/email/beta-templates.ts`
- [ ] Update `src/lib/email/email-service.ts`

### Testing
- [ ] Test with Stripe CLI webhook forwarding
- [ ] Verify database updates on coupon application
- [ ] Verify email sends and renders correctly
- [ ] Test error cases (missing user, non-photographer)

### Deployment
- [ ] Deploy code changes to Vercel
- [ ] Create coupon in Stripe LIVE mode
- [ ] Verify webhook endpoint in Stripe Dashboard
- [ ] Enable `customer.discount.created` event in webhook settings

---

## References

- [Stripe Coupons API](https://docs.stripe.com/api/coupons)
- [Create a Coupon](https://docs.stripe.com/api/coupons/create)
- [Stripe CLI Documentation](https://docs.stripe.com/cli)
- [Coupons and Promotion Codes](https://docs.stripe.com/billing/subscriptions/coupons)

---

**END OF PLAN**

*This plan is ready for implementation. Start with database migration, then code changes, then Stripe coupon creation (in that order to ensure webhook can process events immediately).*
