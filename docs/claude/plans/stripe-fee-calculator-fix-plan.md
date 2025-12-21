# Stripe Fee Calculator Display Bug - Fix Plan

**Date:** December 21, 2025
**Issue:** Gallery create page incorrectly shows Stripe fees being deducted from photographer's payout
**Severity:** Medium - Misleading UI, photographer sees lower payout than they'll receive
**Root Cause:** UI calculation error - fees should not be subtracted from photographer payout

---

## 1. Summary of the Bug

### The Problem

On the gallery create page (`src/app/photographer/galleries/create/page.tsx`), lines 768-772 display:

```tsx
<p className="text-2xl font-bold text-green-400">
  ~${(pricingSummary.photographerPayout - pricingSummary.stripeFees).toFixed(2)}
</p>
<p className="text-xs text-muted-foreground mt-1">
  (after ~${pricingSummary.stripeFees.toFixed(2)} Stripe fees)
</p>
```

**This is INCORRECT.**

### Why It's Wrong

PhotoVault uses **Stripe Connect with DESTINATION CHARGES**. With this architecture:

1. **PhotoVault (the platform) pays ALL Stripe fees** - NOT the photographer
2. The photographer receives their full payout amount (shoot fee + storage commission)
3. Stripe fees are deducted from PhotoVault's cut, not the photographer's cut

**Evidence from the codebase:**

- **`src/lib/payment-models.ts` lines 268-269:**
  ```typescript
  // Stripe fees: ~2.9% + $0.30 (absorbed by PhotoVault via destination charges)
  // PhotoVault's actual revenue = photovaultReceives - stripeFees
  ```

- **`src/lib/server/commission-service.ts` lines 47-48:**
  ```typescript
  // Calculate photographer's gross (shoot fee + 50% of storage fee)
  // Stripe fees are deducted from this automatically
  ```
  Comment is misleading - fees are NOT deducted from photographer's gross in destination charges

- **Stripe skill documentation** confirms: With destination charges, the platform absorbs fees

### Current Impact

Photographers see a **lower payout amount than they'll actually receive**, which:
- Creates confusion about how much they'll earn
- Makes PhotoVault's commission split look worse than it is
- May deter photographers from using the platform

### Example

**Scenario:** Photographer creates gallery with:
- Shoot fee: $2,500
- Storage package: Year Package ($100)
- Total client pays: $2,600

**Correct calculation:**
- Photographer receives: $2,500 (shoot fee) + $50 (storage commission) = **$2,550**
- PhotoVault receives: $50 (remaining storage) - ~$77.70 (Stripe fees) = **-$27.70 loss**
  *(PhotoVault absorbs fees on these small transactions, makes profit on recurring $8/month)*

**Current WRONG display:**
- Shows: `~$2,474.70` (after ~$75.30 Stripe fees)
- Photographer thinks they're losing $75.30 to Stripe fees!

---

## 2. Files That Need to Change

### Primary File
- **`src/app/photographer/galleries/create/page.tsx`** (lines 765-773)
  - Fix the "You Will Receive" calculation
  - Update or remove the Stripe fees message

### Files to Review (No Changes Needed)
- **`src/lib/payment-models.ts`** - Already correct, has accurate comment
- **`src/lib/server/commission-service.ts`** - Logic is correct (destination charges)
- **`src/app/api/webhooks/stripe/route.ts`** - Comments correctly state PhotoVault absorbs fees
- **`src/app/api/stripe/public-checkout\route.ts`** - Comments correctly state PhotoVault absorbs fees

### Documentation Files (Informational Only)
These files mention Stripe fees but are for reference/testing - no changes needed:
- `STRIPE_INTEGRATION_COMPLETE.md`
- `docs/STORY-1.1-TEST-SCENARIOS.md`
- `docs/MANUAL-TESTING-GUIDE.md`
- `database/PAYMENT_MODEL_MIGRATION_README.md`

---

## 3. Exact Code Changes

### File: `src/app/photographer/galleries/create/page.tsx`

**Location:** Lines 765-773 (inside the "Pricing Summary" card)

**Current Code:**
```tsx
<div>
  <p className="text-muted-foreground">You Will Receive:</p>
  <p className="text-2xl font-bold text-green-400">
    ~${(pricingSummary.photographerPayout - pricingSummary.stripeFees).toFixed(2)}
  </p>
  <p className="text-xs text-muted-foreground mt-1">
    (after ~${pricingSummary.stripeFees.toFixed(2)} Stripe fees)
  </p>
</div>
```

**Corrected Code (Option 1 - Simple Fix, Recommended):**
```tsx
<div>
  <p className="text-muted-foreground">You Will Receive:</p>
  <p className="text-2xl font-bold text-green-400">
    ~${pricingSummary.photographerPayout.toFixed(2)}
  </p>
  <p className="text-xs text-muted-foreground mt-1">
    (PhotoVault absorbs Stripe fees)
  </p>
</div>
```

**Corrected Code (Option 2 - Educational):**
```tsx
<div>
  <p className="text-muted-foreground">You Will Receive:</p>
  <p className="text-2xl font-bold text-green-400">
    ${pricingSummary.photographerPayout.toFixed(2)}
  </p>
  <p className="text-xs text-muted-foreground mt-1">
    Full amount - PhotoVault covers Stripe fees (~${pricingSummary.stripeFees.toFixed(2)})
  </p>
</div>
```

**Corrected Code (Option 3 - Minimal):**
```tsx
<div>
  <p className="text-muted-foreground">You Will Receive:</p>
  <p className="text-2xl font-bold text-green-400">
    ${pricingSummary.photographerPayout.toFixed(2)}
  </p>
</div>
```
(Simply remove the Stripe fees line entirely)

### Recommendation

**Use Option 1** (Simple Fix) because:
- Clarifies that fees are absorbed by PhotoVault (transparency)
- Keeps the space balanced (doesn't leave empty space)
- Educates photographers about the benefit (PhotoVault eats the fees)

---

## 4. Other Instances in Codebase

### Search Results

Searched for patterns:
- `photographerPayout.*-.*stripeFees` → **Only 1 match** (the bug location)
- `(after|minus|deduct|subtract).*Stripe fee` → Multiple matches, all in docs/comments

### Analysis

**No other instances of this bug were found in the UI code.**

The only instance of incorrectly subtracting Stripe fees from photographer payout is:
- **`src/app/photographer/galleries/create/page.tsx:768`**

All other mentions of Stripe fees in the codebase are:
1. **Correct comments** explaining PhotoVault absorbs fees
2. **Documentation files** for testing/reference
3. **Informational text** at line 701 that correctly says "minus ~3% Stripe fees" for shoot fees only
   - This is acceptable because it's describing how Stripe fees work generally, not calculating actual payout

### Line 701 Review

**Location:** `src/app/photographer/galleries/create/page.tsx:701`
```tsx
<p className="text-xs text-muted-foreground mt-1">
  Your photography fee - you keep 100% (minus ~3% Stripe fees)
</p>
```

**Status:** This is **acceptable** because:
- It's generic educational text, not a calculated amount
- It's technically true that Stripe fees exist (~3%)
- It doesn't show a misleading calculated number
- The actual payout display below (lines 768-772) should show the correct full amount

**Recommendation:** Leave line 701 as-is, or optionally clarify:
```tsx
<p className="text-xs text-muted-foreground mt-1">
  Your photography fee - you keep 100% (PhotoVault absorbs ~3% Stripe fees)
</p>
```

---

## 5. Testing Verification Steps

### Manual Testing

**Test Case 1: All-In-One Pricing with Shoot Fee**

1. Navigate to `/photographer/galleries/create`
2. Select a client (or create new client)
3. Enter gallery details
4. Select billing mode: **All-In-One Invoice**
5. Enter shoot fee: `$2500`
6. Select storage package: **Year Package** ($100)
7. **Verify pricing summary shows:**
   - Client Will Pay: `$2,600.00`
   - You Will Receive: `$2,550.00` (NOT ~$2,474.70)
   - Message: "(PhotoVault absorbs Stripe fees)" (NOT "after Stripe fees")

**Test Case 2: Storage Only (No Shoot Fee)**

1. Navigate to `/photographer/galleries/create`
2. Select a client
3. Enter gallery details
4. Select billing mode: **Storage Only**
5. Select storage package: **6-Month Package** ($50)
6. **Verify pricing summary shows:**
   - Storage Fee: `$50.00`
   - You Will Receive: `$25.00` (50% commission, NOT $25.00 - fees)
   - Message: "(PhotoVault absorbs Stripe fees)"

**Test Case 3: Shoot Only (No Storage Fee)**

1. Navigate to `/photographer/galleries/create`
2. Select a client
3. Enter gallery details
4. Select billing mode: **All-In-One Invoice**
5. Enter shoot fee: `$500`
6. Select storage package: **Shoot Only** (no storage fee)
7. **Verify pricing summary shows:**
   - Client Will Pay: `$500.00`
   - You Will Receive: `$500.00` (NOT $500.00 - fees)
   - Message: "(PhotoVault absorbs Stripe fees)"

**Test Case 4: Free Shoot with Storage**

1. Navigate to `/photographer/galleries/create`
2. Select a client
3. Enter gallery details
4. Select billing mode: **All-In-One Invoice**
5. Enter shoot fee: `$0`
6. Select storage package: **6-Month Trial** ($20)
7. **Verify pricing summary shows:**
   - Client Will Pay: `$20.00`
   - You Will Receive: `$10.00` (50% commission, NOT $10.00 - fees)
   - Message: "(PhotoVault absorbs Stripe fees)"

### Automated Testing (Future)

**Test file location:** `src/app/photographer/galleries/create/__tests__/fee-display.test.tsx`

**Test scenarios:**
```typescript
describe('Fee Calculator Display', () => {
  it('should show full photographer payout without subtracting Stripe fees', () => {
    const pricingSummary = {
      photographerPayout: 2550,
      stripeFees: 75.30
    }

    // Should display $2,550.00 NOT $2,474.70
    expect(photographerPayoutElement.textContent).toBe('$2,550.00')
  })

  it('should display message that PhotoVault absorbs fees', () => {
    expect(feeMessageElement.textContent).toContain('PhotoVault absorbs')
  })

  it('should not subtract Stripe fees from photographer payout', () => {
    expect(feeMessageElement.textContent).not.toContain('after')
  })
})
```

### Visual Regression Testing

**Before fix screenshot:**
- Photographer sees: `~$2,474.70` with "(after ~$75.30 Stripe fees)"

**After fix screenshot:**
- Photographer sees: `~$2,550.00` with "(PhotoVault absorbs Stripe fees)"

**Compare:** Ensure the amount increased by ~$75 (the Stripe fee estimate)

---

## 6. Implementation Checklist

- [ ] Update `src/app/photographer/galleries/create/page.tsx` line 768
  - Remove `- pricingSummary.stripeFees` from calculation
  - Display `pricingSummary.photographerPayout` directly
- [ ] Update `src/app/photographer/galleries/create/page.tsx` line 771
  - Change message from "(after ~$X Stripe fees)" to "(PhotoVault absorbs Stripe fees)"
- [ ] Optionally: Update line 701 educational text to clarify PhotoVault absorbs fees
- [ ] Manual test: All-In-One with shoot fee (verify correct display)
- [ ] Manual test: Storage Only (verify correct display)
- [ ] Manual test: Shoot Only (verify correct display)
- [ ] Manual test: Free shoot with storage (verify correct display)
- [ ] Dev server: Verify no console errors
- [ ] Git commit with message: "fix(ui): Correct photographer payout display - PhotoVault absorbs Stripe fees, not photographer"

---

## 7. Additional Notes

### Why This Bug Existed

The UI was likely copied from a generic e-commerce calculator where:
- The merchant pays Stripe fees
- Payout = gross - fees

But PhotoVault uses **Stripe Connect destination charges**, where:
- The platform (PhotoVault) pays fees
- Photographer receives full destination amount

### Impact on Business

**Before fix:**
- Photographer thinks: "I only get $2,474 from a $2,600 sale"
- Perceived take rate: 4.8% ($126 / $2,600)

**After fix:**
- Photographer knows: "I get $2,550 from a $2,600 sale"
- Actual take rate: 1.9% ($50 / $2,600)
- Plus, PhotoVault is absorbing $77 in fees to make this work

**Result:** Fixing this bug makes PhotoVault's value proposition much clearer.

### Related Documentation

- Stripe skill: `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\stripe-skill.md`
  - Lines 38-56 explain destination charges
  - Confirms platform absorbs fees
- Payment models: `src/lib/payment-models.ts`
  - Lines 268-269 explicitly state PhotoVault absorbs fees
- Commission service: `src/lib/server/commission-service.ts`
  - Line 47-48 comment (though slightly misleading, the actual logic is correct)

### Future Improvements

Consider adding:
1. **Tooltip on "PhotoVault absorbs Stripe fees"**
   - "We cover the ~3% payment processing fees so you keep your full commission"
2. **Fee breakdown toggle**
   - Show detailed breakdown if photographer clicks "Show Details"
   - Display: Shoot fee, storage commission, total payout, fees absorbed by PhotoVault
3. **Comparison mode**
   - "With other platforms, you'd only receive $X (after fees)"
   - "With PhotoVault, you receive the full $Y"

---

## 8. Sign-off

**Plan created by:** Stripe Expert (via Claude Code)
**Reviewed by:** [Pending user approval]
**Status:** Ready for implementation

**Estimated effort:** 5 minutes
**Risk level:** Low (UI-only change, no business logic affected)
**Urgency:** Medium (misleading but not breaking)

---

*End of plan*
