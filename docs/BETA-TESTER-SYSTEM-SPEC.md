# PhotoVault Beta Tester System - Technical Specification

**Created:** January 4, 2026
**Author:** Claude Desktop (Strategy) → Claude Code (Implementation)
**Priority:** CRITICAL - Required for beta launch
**Estimated Effort:** 1-2 sessions

---

## Executive Summary

This spec enables PhotoVault to onboard 5-15 beta photographers with:
- **Free platform access** for 12 months (normally $22/month)
- **Lifetime price lock** at $22/month (immune to future increases)
- **"Founding Photographer" status** badge
- **Standard 50/50 commission** on client payments

Beta photographers test with **real client payments** in Stripe Live mode, but pay $0 platform fee via a 100% discount coupon.

### Design Philosophy

Beta photographers should experience the app **exactly like regular photographers** - same UI, same flows, same potential friction points. The ONLY differences are:
1. Their Stripe coupon (free platform fee for 12 months)
2. Their locked pricing ($22/month forever)
3. A "Founding Photographer" badge (earned recognition)

No special dashboards. No hand-holding. We need them to stumble and trip so we know what to fix.

---

## Future Context: Client Referral Program (Phase 2)

**NOT building now, but Claude Code should know the architecture:**

After beta launch, we'll add a client referral program:
- Clients with active subscription + 1 gallery see referral offer
- Each successful referral = 1 free month for referrer
- "Successful" = referred client signs up + active subscription + 1 gallery
- Auto-generated referral codes (e.g., `REF-ABC123`) for tracking
- No cap on free months (this is free advertising)
- If client came via photographer with prepaid period, referral credit activates AFTER prepaid expires
- Referred "walk-up" clients are independent until a photographer claims them

**Database implications:** The schema we build now should not conflict with future `referral_codes` and `referral_tracking` tables. Keep the client model extensible.

---

## Part 1: Stripe Configuration (LIVE MODE)

### 1.1 Create Beta Coupon

**Location:** Stripe Dashboard → Products → Coupons → + Create coupon

| Setting | Value |
|---------|-------|
| **Name** | PhotoVault Founding Photographer - Beta 2026 |
| **ID/Code** | `PHOTOVAULT_BETA_2026` |
| **Type** | Percentage off |
| **Percentage off** | 100% |
| **Duration** | Repeating |
| **Duration in months** | 12 |
| **Max redemptions** | 30 |
| **Redeem by** | July 31, 2026 |

**Applies to:** Photographer platform subscription ($22/month product only)

**Does NOT apply to:** Client storage payments (those flow through normally)

### 1.2 Verify Existing Products/Prices

Confirm these exist in Stripe (they should from previous work):

| Product | Price | Type |
|---------|-------|------|
| Photographer Platform Fee | $22/month | Subscription |
| Client Storage - Annual | $100 one-time | One-time |
| Client Storage - 6-Month | $50 one-time | One-time |
| Client Storage - Monthly | $8/month | Subscription |

If any are missing, create them before proceeding.

### 1.3 Environment Variables

Ensure these are set in Vercel for production:

```env
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**CRITICAL:** These must be LIVE keys, not test keys. Beta testers process real client payments.

---

## Part 2: Database Schema Changes

### 2.1 Add Beta Tester Fields to `photographer_profiles`

```sql
-- Migration: add_beta_tester_fields
-- Run this in Supabase SQL Editor OR via Stripe CLI workflow

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

**Note:** We intentionally omit a `beta_status` field. A photographer is either a beta tester (`is_beta_tester = true`) or not. No need for graduated/churned states - Stripe handles billing transitions automatically.

### 2.2 TypeScript Type Updates

Update `src/types/database.ts` or wherever your Supabase types live:

```typescript
// Add to PhotographerProfile interface
interface PhotographerProfile {
  // ... existing fields ...
  is_beta_tester: boolean;
  beta_start_date: string | null;
  price_locked_at: number | null;
}
```

---

## Part 3: Billing Logic Changes

### 3.1 Platform Fee Calculation

**File:** Wherever you calculate/charge the $22/month fee (likely a webhook handler or cron job)

**Current Logic:**
```typescript
const platformFee = 22.00; // Always $22
```

**New Logic:**
```typescript
async function getPlatformFeeForPhotographer(photographerId: string): Promise<number> {
  const { data: profile } = await supabase
    .from('photographer_profiles')
    .select('is_beta_tester, beta_start_date, price_locked_at')
    .eq('id', photographerId)
    .single();

  if (!profile) return 22.00; // Default

  // Beta testers in free period pay $0
  if (profile.is_beta_tester && profile.beta_start_date) {
    const betaStart = new Date(profile.beta_start_date);
    const twelveMonthsLater = new Date(betaStart);
    twelveMonthsLater.setMonth(twelveMonthsLater.getMonth() + 12);

    if (new Date() < twelveMonthsLater) {
      return 0; // Still in free beta period
    }
  }

  // After beta period, use locked price if set
  if (profile.price_locked_at) {
    return profile.price_locked_at;
  }

  // Default platform fee (could be a config value for future price changes)
  return 22.00;
}
```

**Important:** This logic is a FALLBACK. The Stripe coupon handles the 12-month free period automatically. This ensures correct behavior even if coupon expires or has issues.

### 3.2 Stripe Subscription Creation with Coupon

**File:** `src/app/api/stripe/create-photographer-subscription/route.ts` (or similar)

When creating photographer subscription, apply coupon if provided:

```typescript
// In the subscription creation handler
export async function POST(request: Request) {
  const { photographerId, couponCode } = await request.json();

  // Get photographer's Stripe customer ID
  const { data: profile } = await supabase
    .from('photographer_profiles')
    .select('stripe_customer_id')
    .eq('id', photographerId)
    .single();

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: profile.stripe_customer_id,
    items: [{ price: process.env.STRIPE_PHOTOGRAPHER_PRICE_ID }],
  };

  // Apply coupon if provided and valid
  if (couponCode) {
    try {
      // Verify coupon exists and is valid
      const coupon = await stripe.coupons.retrieve(couponCode);
      if (coupon && coupon.valid) {
        subscriptionParams.coupon = couponCode;

        // Mark photographer as beta tester
        await supabase
          .from('photographer_profiles')
          .update({
            is_beta_tester: true,
            beta_start_date: new Date().toISOString(),
            price_locked_at: 22.00,
            beta_status: 'active'
          })
          .eq('id', photographerId);
      }
    } catch (error) {
      console.error('Invalid coupon code:', couponCode);
      // Continue without coupon - don't block signup
    }
  }

  const subscription = await stripe.subscriptions.create(subscriptionParams);

  return Response.json({ subscriptionId: subscription.id });
}
```

---

## Part 4: Onboarding Flow Updates

### 4.1 Option A: Manual Coupon Application (Recommended for Beta)

**Why:** Simpler, fewer moving parts, you personally vet each beta tester.

**Flow:**
1. Beta photographer signs up normally (creates account, connects Stripe)
2. You receive notification of new signup
3. You manually apply coupon in Stripe Dashboard:
   - Go to Customers → Find their subscription → Add coupon
4. You send welcome email confirming beta status

**No code changes needed** for Option A - just a process.

### 4.2 Option B: Coupon Code Field at Signup (Future Enhancement)

**Why:** Self-service, scales better, but more code.

**Changes Required:**

**File:** `src/app/photographer/onboarding/page.tsx` (or wherever signup happens)

```tsx
// Add coupon input field to onboarding form
<div className="space-y-2">
  <Label htmlFor="couponCode">Beta Code (optional)</Label>
  <Input
    id="couponCode"
    placeholder="Enter beta code if you have one"
    value={couponCode}
    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
    className="uppercase"
  />
  <p className="text-sm text-muted-foreground">
    Have a beta invitation? Enter your code for founding photographer benefits.
  </p>
</div>
```

Then pass `couponCode` to the subscription creation API.

### 4.3 Recommendation

**Start with Option A.** You're targeting 5-15 photographers. Manual process is fine for that scale. Build Option B later if you need to scale beta recruitment.

---

## Part 5: UI Indicators

### 5.1 Founding Photographer Badge

**File:** `src/components/photographer/PhotographerBadge.tsx` (NEW)

```tsx
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface PhotographerBadgeProps {
  isBetaTester: boolean;
}

export function FoundingPhotographerBadge({ isBetaTester }: PhotographerBadgeProps) {
  if (!isBetaTester) return null;

  return (
    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
      <Star className="w-3 h-3 mr-1 fill-amber-500" />
      Founding Photographer
    </Badge>
  );
}
```

### 5.2 Display Badge in Dashboard

**File:** `src/app/photographer/dashboard/page.tsx`

```tsx
// In the header/profile section
import { FoundingPhotographerBadge } from "@/components/photographer/PhotographerBadge";

// ...

<div className="flex items-center gap-2">
  <h1 className="text-2xl font-bold">{photographer.business_name}</h1>
  <FoundingPhotographerBadge isBetaTester={photographer.is_beta_tester} />
</div>
```

### 5.3 Beta Status in Settings

**File:** `src/app/photographer/settings/page.tsx`

Add a section showing beta status:

```tsx
{profile.is_beta_tester && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-500" />
        Founding Photographer Status
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <p className="text-sm text-muted-foreground">
        You're one of our founding photographers! Here's what that means:
      </p>
      <ul className="text-sm space-y-1">
        <li>✓ Platform fee waived until {formatDate(addMonths(profile.beta_start_date, 12))}</li>
        <li>✓ Price locked at ${profile.price_locked_at}/month forever</li>
        <li>✓ Direct access to founder for feedback</li>
      </ul>
    </CardContent>
  </Card>
)}
```

---

## Part 6: Webhook Handling

### 6.1 Handle Coupon-Related Events

**File:** `src/app/api/webhooks/stripe/route.ts`

Add handling for coupon application:

```typescript
case 'customer.discount.created':
  // Coupon was applied to customer
  const discount = event.data.object as Stripe.Discount;
  if (discount.coupon.id === 'PHOTOVAULT_BETA_2026') {
    await handleBetaCouponApplied(discount.customer as string);
  }
  break;
```

```typescript
async function handleBetaCouponApplied(stripeCustomerId: string) {
  // Find photographer by Stripe customer ID
  const { data: profile } = await supabase
    .from('photographer_profiles')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (profile) {
    await supabase
      .from('photographer_profiles')
      .update({
        is_beta_tester: true,
        beta_start_date: new Date().toISOString(),
        price_locked_at: 22.00
      })
      .eq('id', profile.id);

    // Send welcome email
    await sendBetaWelcomeEmail(profile.id);
  }
}
```

**Note:** We don't need to handle `customer.discount.deleted` - when the coupon expires, Stripe just starts charging normally. The `is_beta_tester` flag stays true forever (they earned it), and `price_locked_at` ensures they always pay $22 even if we raise prices later.

---

## Part 7: Email Templates

### 7.1 Beta Welcome Email

**Trigger:** When coupon is applied (either manually or via webhook)

**Subject:** Welcome to PhotoVault, Founding Photographer!

```html
<h1>You're In!</h1>

<p>Hey [PHOTOGRAPHER_NAME],</p>

<p>Welcome to PhotoVault's founding photographer program. You're one of only 15 photographers getting early access.</p>

<h2>What You Get:</h2>
<ul>
  <li><strong>$0 platform fee</strong> for the next 12 months ($264 value)</li>
  <li><strong>$22/month locked forever</strong> - immune to future price increases</li>
  <li><strong>Founding Photographer</strong> badge on your profile</li>
  <li><strong>Direct line to me</strong> for feedback and support</li>
</ul>

<h2>What I Need From You:</h2>
<ol>
  <li>Upload at least one real gallery</li>
  <li>Invite at least one real client (they'll pay real money)</li>
  <li>Reply to my weekly check-in emails with honest feedback</li>
  <li>Report any bugs or issues you find</li>
</ol>

<p>Your feedback shapes what PhotoVault becomes. I'm not building this alone - I'm building it with you.</p>

<p><a href="https://photovault.photo/photographer/dashboard">Go to Your Dashboard</a></p>

<p>Let's build this together,<br/>
Nate<br/>
Founder, PhotoVault</p>

<p style="font-size: 12px; color: #666;">
P.S. - As a bonus, I'm attaching our exclusive 100 Dane County Photo Locations guide.
GPS coordinates, permit rules, insider tips for every spot. Enjoy!
</p>
```

### 7.2 Beta Graduation (No Email Needed)

When the 12-month coupon expires, Stripe automatically starts charging $22/month. No special email needed - it's just normal billing kicking in. The photographer already knows from their welcome email that this will happen.

---

## Part 8: Implementation Notes

### What We're NOT Building (Intentionally)

- **Admin dashboard for beta testers** - Manual tracking is fine for 5-15 people
- **Beta graduation email** - When coupon expires, Stripe handles it. No ceremony needed.
- **Special beta tester flows** - They use the same app as everyone else
- **Automated beta enrollment API** - Manual coupon application in Stripe is sufficient

### Why This Approach

Beta testers need to experience the real product with all its friction points. If we smooth their path, we won't learn what breaks for regular users. The only "special" things are:
1. They don't pay platform fees (Stripe coupon)
2. Their price is locked forever (database flag)
3. They get a badge (earned recognition)

---

## Part 9: Testing Checklist

Before going live with beta testers:

### Stripe Configuration
- [ ] Coupon `PHOTOVAULT_BETA_2026` created via CLI
- [ ] Coupon set to 100% off for 12 months
- [ ] Max redemptions set to 30
- [ ] Photographer subscription product exists ($22/month)
- [ ] Client storage products exist ($100, $50, $8/month)
- [ ] Webhook endpoint configured for `customer.discount.created`

### Database
- [ ] Migration run: `is_beta_tester`, `beta_start_date`, `price_locked_at` columns exist
- [ ] TypeScript types updated
- [ ] Test profiles cleaned up (delete old test data)

### Code
- [ ] Platform fee calculation respects `price_locked_at` for future billing
- [ ] Webhook handler marks photographer as beta tester when coupon applied
- [ ] Welcome email sends on coupon application
- [ ] Founding Photographer badge component created
- [ ] Badge displayed in photographer dashboard
- [ ] Badge/status shown in photographer settings

### End-to-End Test
- [ ] Create new photographer account
- [ ] Apply beta coupon manually in Stripe
- [ ] Verify webhook fires and database updates
- [ ] Verify welcome email received
- [ ] Verify $0 charge for platform fee
- [ ] Verify Founding Photographer badge shows in dashboard
- [ ] Create gallery and invite test client
- [ ] Client pays real money ($100 or $8)
- [ ] Verify 50/50 split works correctly

---

## Part 10: Implementation Order

**Recommended sequence:**

1. **Database Migration** (10 min) - Add columns to `photographer_profiles`
2. **Type Updates** (5 min) - Update TypeScript interfaces
3. **Stripe Coupon** (5 min) - Create via Stripe CLI
4. **Webhook Handler** (20 min) - Handle `customer.discount.created`
5. **Badge Component** (15 min) - Founding Photographer visual
6. **Dashboard/Settings Updates** (15 min) - Display badge and status info
7. **Welcome Email Template** (20 min) - Via Resend
8. **Testing** (30 min) - Full flow verification

**Total estimated time:** 2 hours

**What we're NOT doing:** Admin dashboard, graduation email, automated enrollment API, beta_status tracking.

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Coupon code | `PHOTOVAULT_BETA_2026` |
| Max redemptions | 30 beta slots |
| Expiration | July 31, 2026 for new signups |
| Admin dashboard | Not building - manual tracking is fine |
| Graduation email | Not building - Stripe handles transition |
| Badge | Yes - Founding Photographer badge |
| Create coupon how | Via Stripe CLI (not dashboard) |

## Stripe CLI Coupon Creation

Claude Code should create the coupon via Stripe CLI:

```bash
stripe coupons create \
  --id="PHOTOVAULT_BETA_2026" \
  --name="PhotoVault Founding Photographer - Beta 2026" \
  --percent-off=100 \
  --duration=repeating \
  --duration-in-months=12 \
  --max-redemptions=30 \
  --redeem-by=$(date -d "2026-07-31" +%s)
```

This ensures the coupon is created in whatever Stripe mode (test/live) the CLI is configured for.

---

## Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| Supabase migration | CREATE | CRITICAL |
| `src/types/database.ts` | MODIFY | CRITICAL |
| `src/app/api/webhooks/stripe/route.ts` | MODIFY | CRITICAL |
| `src/components/photographer/PhotographerBadge.tsx` | CREATE | HIGH |
| `src/app/photographer/dashboard/page.tsx` | MODIFY | HIGH |
| `src/app/photographer/settings/page.tsx` | MODIFY | HIGH |
| Email template (Resend) - Welcome | CREATE | HIGH |

**Explicitly NOT building:**
- `src/app/admin/beta-testers/page.tsx` - No admin dashboard
- `src/app/api/admin/enroll-beta/route.ts` - Manual Stripe process is fine
- Beta graduation email - Stripe handles billing transition

---

**END OF SPEC**

*Hand this document to Claude Code. Start with Stripe coupon creation (manual in dashboard), then database migration, then work through the rest.*
