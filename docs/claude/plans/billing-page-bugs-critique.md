# QA Critic Review: Billing Page Bugs Plan

**Date:** 2026-03-14
**Verdict:** REVISE - 2 blockers, 3 significant issues, 2 minor issues

---

## BLOCKER 1: `photographers` table has NO `business_name` column

**The plan (Step 4, line 138) proposes this join query:**
```
photo_galleries ( gallery_name, photographers (business_name) )
```

**Reality:** The `photographers` table has NO `business_name` column. Its columns are: `id`, `business_license`, `tax_id`, `bank_account_info`, `cms_integration_id`, `cms_system`, `commission_rate`, `total_commission_earned`, `monthly_commission`, `created_at`, `updated_at`, `platform_subscription_status`, `suspended_at`, `deleted_at`, and various Stripe/payout columns.

The `business_name` column lives on `user_profiles`, not `photographers`.

**The existing page code (line 137) already has this bug** -- it queries `photographers.business_name` which does not exist and silently returns null, falling back to "Unknown".

**The webhook code (invoice.ts line 92-95) gets this RIGHT** -- it queries `user_profiles` for `full_name` and `business_name` using the `photographer_id` as the user ID.

**Fix required:** The plan must query `user_profiles` (not `photographers`) for the business name. The join path should be:
```
photo_galleries ( gallery_name, photographer_id ) -> user_profiles.eq('id', photographer_id) -> business_name
```

Or if using Supabase's FK join syntax, the plan needs to document whether `photo_galleries.photographer_id` has a FK to `auth.users` (it doesn't -- it FKs to `photographers.id`, which IS the user's auth UUID). So the join would need to go: `photo_galleries -> user_profiles` via `photographer_id = user_profiles.id`.

**Severity:** BLOCKER. The proposed optimized query will return null for every photographer name, making Bug 2 worse not better.

---

## BLOCKER 2: `subscriptions` table has NO `client_id` column -- `create-direct-subscription` route is broken

**The plan (line 155) references `create-direct-subscription/route.ts` but does not flag this critical issue:**

At line 57 of `create-direct-subscription/route.ts`:
```typescript
.eq('client_id', user.id)
```

The `subscriptions` table has these columns: `id`, `user_id`, `gallery_id`, `stripe_subscription_id`, `stripe_customer_id`, `status`, `plan_type`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `canceled_at`, `payment_failure_count`, `last_payment_failure_at`, `access_suspended`, `access_suspended_at`, `created_at`, `updated_at`, `grace_notifications_sent`.

**There is NO `client_id` column.** The column is `user_id`.

This means the "check for existing subscription" guard (line 54-59) silently fails -- it queries a non-existent column, gets 0 results, and allows duplicate subscriptions to be created every time a client clicks "Subscribe."

**The plan does not mention this at all.** It should be fixed as part of this work since it directly impacts billing correctness.

**Severity:** BLOCKER. Clients can create unlimited duplicate subscriptions. This is a money bug.

---

## SIGNIFICANT 1: `payment_history` backfill will do nothing

**Plan Step 1 (line 87-90):**
```sql
UPDATE payment_history ph SET user_id = s.user_id
FROM subscriptions s WHERE ph.stripe_subscription_id = s.stripe_subscription_id;
```

The investigation confirmed: `payment_history` has 0 rows. The backfill UPDATE will affect 0 rows.

**The real question the plan doesn't address:** Why is payment_history empty when Nate paid $8 last month? Either:
1. The webhook never fired (Stripe CLI wasn't running, or endpoint wasn't configured in live mode)
2. The webhook fired but the insert failed silently (RLS issue -- the `service_role` policy uses `qual: true` which should work, but maybe the webhook isn't using service role client)
3. The subscription was created through a code path that doesn't trigger `invoice.payment_succeeded`

**The plan assumes** adding `user_id` + RLS policy will fix Bug 1. But if the webhook never writes rows, the fix is moot -- the table will still be empty. The plan should include:
- Investigate why no rows exist (check Stripe dashboard for invoice events)
- If webhook path is confirmed broken, fix it
- Consider a one-time Stripe API backfill script to populate historical payments

**Severity:** SIGNIFICANT. The plan fixes the wrong problem. Even after the migration, payment history will still show "No payment history yet."

---

## SIGNIFICANT 2: `photo_galleries` RLS will block the join for direct subscriptions

**Plan Step 4** proposes a joined query:
```typescript
.from('subscriptions')
.select(`..., photo_galleries (gallery_name, photographers (business_name))`)
.eq('user_id', user.id)
```

The `photo_galleries` SELECT policies are:
- `Clients can view assigned galleries`: `client_id = auth.uid()`
- `Clients can view their galleries`: `client_id IN (SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()) OR user_id = auth.uid()`
- `Photographers can view own/their galleries`: `photographer_id = auth.uid()`

For the join to work, the authenticated client needs to pass one of these RLS policies for each gallery. If `photo_galleries.client_id` doesn't match `auth.uid()` (possible if `client_id` references the `clients` table ID, not the auth user ID), the joined gallery data will be null.

The plan does not verify which ID `photo_galleries.client_id` actually contains (auth user UUID vs. `clients` table UUID). If it's the `clients` table UUID, the second policy with the subquery would be the only path, and it depends on a `clients` table row existing.

**This could make the joined query silently return null gallery names** for legitimate subscriptions, reintroducing Bug 2 even after the fix.

**Severity:** SIGNIFICANT. The optimized join could fail silently due to RLS, and the plan has no fallback or verification step.

---

## SIGNIFICANT 3: Webhook `handlePaymentFailed` writes `payment_history` without `paid_at`

**Plan Step 2** says to add `user_id` to both `handlePaymentSucceeded` (line 122-134) and `handlePaymentFailed` (line 357-364).

Look at the failed payment insert (invoice.ts line 357-364):
```typescript
await supabase.from('payment_history').insert({
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    amount_paid_cents: 0,
    currency: invoice.currency,
    status: 'failed',
    created_at: now.toISOString(),
})
```

Notice: **no `paid_at` field**. But the billing page (line 157) selects `paid_at` and uses it for display (line 679) and ordering (line 158: `.order('paid_at', ...)`).

If `paid_at` is null for failed payments, they'll sort unpredictably and `formatDate(payment.paid_at)` will render "Invalid Date" in the UI.

The plan does not address this. The fix should either:
- Use `created_at` as the display/sort column (since failed payments have no paid_at)
- Set `paid_at` to the current timestamp for failed payments too
- Handle null `paid_at` in the UI

**Severity:** SIGNIFICANT. Failed payment records will display as "Invalid Date" in the payment history UI.

---

## MINOR 1: Hardcoded `$8/month` in subscription card

**Page line 515:** `<span>$8/month</span>` is hardcoded in the subscription display. If pricing changes, or if a photographer-linked subscription has a different price, this will be wrong.

The plan doesn't mention this, and since it's touching the subscription card rendering anyway (Step 3), it would be trivial to pull the actual amount from the subscription or last payment record.

**Severity:** MINOR but worth noting since the plan is already modifying this area.

---

## MINOR 2: Missing error handling for the proposed joined query

**Plan Step 4** replaces N+1 queries with one joined query but has no error handling strategy. The current code (line 121-123) has a pattern for handling missing tables:
```typescript
if (subError && !subError.message?.includes('does not exist')) {
```

The plan should specify: what happens if the join fails? Does the page degrade gracefully, or does it crash? Given the RLS complications above, partial null results from the join are likely and need to be handled.

---

## Summary of Required Revisions

| # | Issue | Action Required |
|---|-------|----------------|
| B1 | `photographers` has no `business_name` | Query `user_profiles` instead. Rewrite join path. |
| B2 | `subscriptions` has no `client_id` | Fix `create-direct-subscription` route to use `user_id`. |
| S1 | `payment_history` is empty (0 rows) | Investigate why webhook isn't inserting. Add backfill script from Stripe API. |
| S2 | `photo_galleries` RLS may block join | Verify RLS path for client users. Consider server-side API route instead of browser query. |
| S3 | Failed payments have null `paid_at` | Handle null `paid_at` in UI or set a value on insert. |
| M1 | Hardcoded $8/month | Pull from actual data. |
| M2 | No error handling for joined query | Add graceful degradation. |

---

## What the Plan Gets Right

- Correct diagnosis that `payment_history` lacks `user_id` and client RLS policy
- Correct identification that `gallery_id: null` causes "UNKNOWN GALLERY" and dead link
- Good instinct to optimize N+1 queries into a join
- Correct approach to hide "View Gallery" for direct subscriptions
- Migration approach (nullable column + backfill) is non-destructive

The plan's root cause analysis is solid for 3 of 4 bugs. The issues are in the implementation details, where wrong column/table names would cause the fix to silently fail.
